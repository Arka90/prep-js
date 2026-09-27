import { COMPARE_SOURCE } from "@/lib/arena/compare-source";
import type { ArenaTest, TestResult } from "@/lib/types";

// Runs visible tests in a throwaway Web Worker so an infinite loop can't freeze the tab.
const WORKER_SOURCE = `${COMPARE_SOURCE}
function show(v) {
  if (v === undefined) return "undefined";
  if (typeof v === "string") return JSON.stringify(v);
  if (typeof v === "function") return "[Function]";
  try { return JSON.stringify(v, function (k, x) { return x === undefined ? "__undef__" : x; }).replace(/"__undef__"/g, "undefined"); }
  catch (e) { return String(v); }
}
self.onmessage = async function (event) {
  var job = event.data;
  var logs = [];
  var log = function () { if (logs.length < 200) logs.push(Array.prototype.map.call(arguments, function (a) { return typeof a === "string" ? a : show(a); }).join(" ")); };
  var sandboxConsole = { log: log, info: log, warn: log, error: log, debug: log, table: log, dir: log };
  var fn;
  try {
    fn = new Function("console", job.code + "\\n;return typeof " + job.functionName + " === 'function' ? " + job.functionName + " : undefined;")(sandboxConsole);
  } catch (e) {
    return self.postMessage({ fatal: (e && e.name ? e.name + ": " + e.message : String(e)), results: [], logs: logs });
  }
  if (typeof fn !== "function") {
    return self.postMessage({ fatal: "Function \\"" + job.functionName + "\\" is not defined. Keep the function name from the starter code.", results: [], logs: logs });
  }
  var results = [];
  for (var i = 0; i < job.tests.length; i++) {
    var test = job.tests[i];
    var started = performance.now();
    try {
      var actual = fn.apply(null, structuredClone(test.input));
      if (actual && typeof actual.then === "function") {
        actual = await Promise.race([actual, new Promise(function (_, reject) { setTimeout(function () { reject(new Error("Timed out after 2000ms")); }, 2000); })]);
      }
      results.push({ name: test.name, passed: deepEqual(actual, test.expected), actual: show(actual), ms: Math.round(performance.now() - started) });
    } catch (e) {
      results.push({ name: test.name, passed: false, error: e && e.name ? e.name + ": " + e.message : String(e), ms: Math.round(performance.now() - started) });
    }
  }
  self.postMessage({ results: results, logs: logs });
};`;

export interface RunOutput {
  fatal: string | null;
  results: TestResult[];
  logs: string[];
}

export function runInBrowser(code: string, functionName: string, tests: ArenaTest[]): Promise<RunOutput> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(new Blob([WORKER_SOURCE], { type: "text/javascript" }));
    const worker = new Worker(url);
    const finish = (output: RunOutput) => {
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve(output);
    };
    const timer = setTimeout(
      () => finish({ fatal: "Timed out after 5s — infinite loop?", results: [], logs: [] }),
      5000,
    );
    worker.onmessage = (event: MessageEvent<{ fatal?: string; results: Omit<TestResult, "hidden">[]; logs: string[] }>) => {
      const { fatal, results, logs } = event.data;
      finish({
        fatal: fatal ?? null,
        logs,
        results: results.map((r, i) => ({ ...r, hidden: false, input: tests[i].input, expected: tests[i].expected })),
      });
    };
    worker.onerror = (event) => finish({ fatal: event.message || "Worker crashed", results: [], logs: [] });
    worker.postMessage({ code, functionName, tests });
  });
}
