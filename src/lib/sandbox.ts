import "server-only";
import { Worker } from "node:worker_threads";
import { COMPARE_SOURCE } from "@/lib/arena/compare-source";
import type { ArenaTest, TestResult } from "@/lib/types";

// Code runs in a short-lived worker thread, inside a fresh vm context.
// The worker isolates crashes (uncaught errors, unhandled rejections) and is
// killed on a hard deadline. vm is not a security boundary: this is for your
// own code and for code the app generated for you, on your own server.

const WORKER_SOURCE = String.raw`
const { parentPort, workerData } = require("node:worker_threads");
const vm = require("node:vm");
const util = require("node:util");
${COMPARE_SOURCE}

const MAX_LINES = 300;
const lines = [];
let pending = 0;
let done = false;

function record(args) {
  if (lines.length < MAX_LINES) lines.push(util.format.apply(null, args));
}
function errText(e) {
  if (e && typeof e === "object" && typeof e.name === "string" && typeof e.message === "string") {
    return e.name + ": " + e.message;
  }
  return "Uncaught " + util.inspect(e);
}
function show(value) {
  return util.inspect(value, { depth: 5, breakLength: 100, maxArrayLength: 50 });
}
function finish(payload) {
  if (done) return;
  done = true;
  parentPort.postMessage(payload);
  process.exit(0);
}

let onCrash = function () {};
function guard(fn, args) {
  try {
    fn.apply(null, args);
  } catch (e) {
    onCrash(e);
  }
}
process.on("uncaughtException", function (e) { onCrash(e); });
process.on("unhandledRejection", function (e) { onCrash(e); });

function makeGlobals() {
  const live = new Set();
  const out = function () { record(arguments); };
  return {
    console: { log: out, info: out, warn: out, error: out, debug: out, trace: out,
      dir: function (v) { record([show(v)]); }, table: function (v) { record([show(v)]); } },
    setTimeout: function (fn, ms) {
      const args = Array.prototype.slice.call(arguments, 2);
      pending++;
      const h = setTimeout(function () { live.delete(h); pending--; guard(fn, args); }, ms);
      live.add(h);
      return h;
    },
    clearTimeout: function (h) { if (live.delete(h)) { pending--; clearTimeout(h); } },
    setInterval: function (fn, ms) {
      const args = Array.prototype.slice.call(arguments, 2);
      pending++;
      const h = setInterval(function () { guard(fn, args); }, ms);
      live.add(h);
      return h;
    },
    clearInterval: function (h) { if (live.delete(h)) { pending--; clearInterval(h); } },
    setImmediate: function (fn) {
      const args = Array.prototype.slice.call(arguments, 1);
      pending++;
      const h = setImmediate(function () { live.delete(h); pending--; guard(fn, args); });
      live.add(h);
      return h;
    },
    clearImmediate: function (h) { if (live.delete(h)) { pending--; clearImmediate(h); } },
    queueMicrotask: queueMicrotask,
    structuredClone: structuredClone,
    URL: URL, URLSearchParams: URLSearchParams,
    TextEncoder: TextEncoder, TextDecoder: TextDecoder,
    AbortController: AbortController, AbortSignal: AbortSignal,
    Event: Event, EventTarget: EventTarget,
    atob: atob, btoa: btoa,
  };
}

const ALLOWED_MODULES = ["events", "util", "buffer", "assert", "string_decoder", "stream"];
function nodeGlobals() {
  return {
    process: {
      nextTick: function (fn) {
        const args = Array.prototype.slice.call(arguments, 1);
        process.nextTick(function () { guard(fn, args); });
      },
      env: {}, argv: ["node", "/app/index.js"], platform: "linux",
      version: process.version, versions: process.versions,
      hrtime: process.hrtime, memoryUsage: process.memoryUsage, cwd: function () { return "/app"; },
      on: function () {}, once: function () {}, exitCode: undefined,
    },
    Buffer: Buffer,
    require: function (name) {
      const bare = String(name).replace(/^node:/, "");
      if (ALLOWED_MODULES.indexOf(bare) === -1) throw new Error("Module '" + name + "' is not available in the sandbox");
      return require("node:" + bare);
    },
  };
}

function waitForIdle(deadline, cb) {
  (function check() {
    if (done) return;
    if (Date.now() > deadline) return cb(true);
    if (pending === 0) {
      return setImmediate(function () { if (pending === 0) cb(false); else setTimeout(check, 2); });
    }
    setTimeout(check, 2);
  })();
}

function runSnippet(job) {
  const deadline = Date.now() + job.timeoutMs;
  let error = null;
  onCrash = function (e) {
    error = errText(e);
    finish({ lines: lines, error: error, timedOut: false });
  };
  const globals = makeGlobals();
  const isNode = job.mode === "commonjs";
  const sandbox = Object.assign(globals, isNode ? nodeGlobals() : {});
  const context = vm.createContext(sandbox);
  let source = job.code;
  if (isNode) {
    context.module = { exports: {} };
    source = "(function (exports, require, module, __filename, __dirname) {" + job.code +
      "\n}).call(module.exports, module.exports, require, module, '/app/index.js', '/app');";
  } else {
    context.window = vm.runInContext("globalThis", context);
  }
  function execute() {
    try {
      new vm.Script(source, { filename: "index.js" }).runInContext(context, { timeout: job.timeoutMs });
    } catch (e) {
      if (e && e.code === "ERR_SCRIPT_EXECUTION_TIMEOUT") return finish({ lines: lines, error: null, timedOut: true });
      return onCrash(e);
    }
    if (job.start === "immediate") {
      // Leave the check phase with an already-expired 0ms timer: timers run before immediates.
      const spinUntil = Date.now() + 5;
      while (Date.now() < spinUntil) {}
    }
    waitForIdle(deadline, function (timedOut) {
      finish({ lines: lines, error: error, timedOut: timedOut });
    });
  }
  // Starting from inside a timer makes setImmediate win; starting from inside
  // an immediate makes setTimeout(0) win. Running both exposes snippets whose
  // output depends on that race.
  if (job.start === "timer") setTimeout(execute, 0);
  else if (job.start === "immediate") setImmediate(execute);
  else execute();
}

async function runTests(job) {
  let crash = null;
  onCrash = function (e) { crash = errText(e); };
  const sandbox = Object.assign(makeGlobals(), nodeGlobals());
  const context = vm.createContext(sandbox);
  const name = job.functionName;
  try {
    new vm.Script(job.code + "\n;globalThis.__fn = typeof " + name + " === 'function' ? " + name + " : undefined;",
      { filename: "solution.js" }).runInContext(context, { timeout: job.perTestMs });
  } catch (e) {
    return finish({ fatal: errText(e), results: [], logs: lines });
  }
  if (typeof context.__fn !== "function") {
    return finish({ fatal: "Function \"" + name + "\" is not defined. Keep the function name from the starter code.", results: [], logs: lines });
  }
  const results = [];
  for (const test of job.tests) {
    const started = Date.now();
    crash = null;
    try {
      context.__input = JSON.stringify(test.input);
      let actual = vm.runInContext("__fn.apply(null, JSON.parse(__input))", context, { timeout: job.perTestMs });
      if (actual && typeof actual.then === "function") {
        actual = await Promise.race([
          actual,
          new Promise(function (_, reject) {
            setTimeout(function () { reject(new Error("Timed out after " + job.perTestMs + "ms")); }, job.perTestMs);
          }),
        ]);
      }
      const passed = crash === null && deepEqual(actual, test.expected);
      results.push({ name: test.name, passed: passed, actual: show(actual), error: crash || undefined, ms: Date.now() - started });
    } catch (e) {
      const timedOut = e && e.code === "ERR_SCRIPT_EXECUTION_TIMEOUT";
      results.push({ name: test.name, passed: false, error: timedOut ? "Timed out (infinite loop?)" : errText(e), ms: Date.now() - started });
    }
  }
  finish({ results: results, logs: lines });
}

if (workerData.type === "snippet") runSnippet(workerData);
else runTests(workerData);
`;

function runWorker<T>(data: Record<string, unknown>, hardLimitMs: number): Promise<T | null> {
  return new Promise((resolve) => {
    const worker = new Worker(WORKER_SOURCE, {
      eval: true,
      workerData: data,
      resourceLimits: { maxOldGenerationSizeMb: 128, maxYoungGenerationSizeMb: 32 },
    });
    let settled = false;
    const settle = (value: T | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      void worker.terminate();
      resolve(value);
    };
    const timer = setTimeout(() => settle(null), hardLimitMs);
    worker.once("message", (message: T) => settle(message));
    worker.once("error", () => settle(null));
    worker.once("exit", () => settle(null));
  });
}

export interface SnippetRun {
  lines: string[];
  error: string | null;
  timedOut: boolean;
}

type StartPhase = "now" | "timer" | "immediate";

function runSnippetOnce(code: string, mode: "script" | "commonjs", start: StartPhase) {
  return runWorker<SnippetRun>({ type: "snippet", code, mode, start, timeoutMs: 2000 }, 5000);
}

/**
 * Runs a snippet as a classic script ("script") or as a CommonJS module ("commonjs").
 * Returns "nondeterministic" when the output depends on setTimeout vs setImmediate timing.
 */
export async function runSnippet(
  code: string,
  mode: "script" | "commonjs",
): Promise<SnippetRun | "nondeterministic" | null> {
  const racesTimers = /setImmediate/.test(code) && /set(Timeout|Interval)/.test(code);
  if (!racesTimers) return runSnippetOnce(code, mode, "now");
  const [a, b] = await Promise.all([
    runSnippetOnce(code, mode, "timer"),
    runSnippetOnce(code, mode, "immediate"),
  ]);
  if (!a || !b) return null;
  const same = a.lines.join("\n") === b.lines.join("\n") && a.error === b.error;
  return same ? a : "nondeterministic";
}

export interface TestRun {
  fatal?: string;
  results: Omit<TestResult, "hidden" | "input" | "expected">[];
  logs: string[];
}

export async function runTests(code: string, functionName: string, tests: ArenaTest[]): Promise<TestRun> {
  const run = await runWorker<TestRun>(
    { type: "tests", code, functionName, tests, perTestMs: 2000 },
    2000 * tests.length + 3000,
  );
  return run ?? { fatal: "The run was killed (timeout or out of memory).", results: [], logs: [] };
}

/** Output is only checkable when the snippet uses nothing the sandbox lacks. */
export function canExecute(code: string): boolean {
  return !/\b(import\s|import\(|fetch\(|document\.|window\.addEventListener|fs\.|http\.|require\(\s*['"](?!(node:)?(events|util|buffer|assert|string_decoder|stream)['"]))/.test(
    code,
  );
}
