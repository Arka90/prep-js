export type Track = "javascript" | "node" | "mongodb" | "react" | "nextjs";

export interface Concept {
  /** stable id, kebab-case, prefixed by track short code: js., node., mongo., react., next. */
  id: string;
  track: Track;
  /** short human name shown in UI, <= 40 chars */
  name: string;
  /** 1 = foundations … 5 = expert/internals. Concepts are unlocked in tier order. */
  tier: 1 | 2 | 3 | 4 | 5;
  /** 1–2 dense sentences telling the question writer EXACTLY what to probe: specific behaviours, edge cases, gotchas and the common misconceptions to target. No fluff. */
  focus: string;
}

export const CURRICULUM: Concept[] = [
  // ───────────────────────────── JAVASCRIPT ─────────────────────────────
  // Tier 1
  {
    id: "js.scope-var-let-const",
    track: "javascript",
    name: "Block vs function scope (var/let/const)",
    tier: 1,
    focus:
      "Function-scoped var vs block-scoped let/const, var leaking out of if/for blocks, redeclaration rules, var creating a property on globalThis at script top level while let/const do not, and const preventing rebinding but not mutation of the referenced object.",
  },
  {
    id: "js.hoisting-tdz",
    track: "javascript",
    name: "Hoisting & the Temporal Dead Zone",
    tier: 1,
    focus:
      "What is hoisted and how: var initialised to undefined, function declarations hoisted with body, function expressions/arrow functions only as their variable, let/const/class in TDZ throwing ReferenceError (including typeof x in TDZ and shadowing an outer variable, e.g. let x = x + 1), and precedence when a var and a function declaration share a name.",
  },
  {
    id: "js.types-typeof",
    track: "javascript",
    name: "Primitives, wrappers & typeof quirks",
    tier: 1,
    focus:
      "The 7 primitives vs objects, typeof null === 'object', typeof of functions/classes/undeclared variables/arrays, Array.isArray vs instanceof across realms, auto-boxing (setting a property on a string primitive silently does nothing), new Number(0) being truthy, and passing by value vs passing references (reassigning a parameter vs mutating it).",
  },
  {
    id: "js.logical-nullish-optional",
    track: "javascript",
    name: "||, &&, ??, ?. and short-circuiting",
    tier: 1,
    focus:
      "Logical operators return an operand not a boolean, || vs ?? with 0/''/NaN/false, SyntaxError when mixing ?? with || or && without parentheses, logical assignment (||=, &&=, ??=) only assigning when needed (setter not called otherwise), and optional chaining short-circuiting the whole chain (a?.b.c, a?.[i], fn?.()) and returning undefined not null.",
  },
  {
    id: "js.destructuring-defaults",
    track: "javascript",
    name: "Destructuring, defaults & rest",
    tier: 1,
    focus:
      "Default values apply only for undefined (not null), defaults evaluated lazily and can reference earlier bindings, destructuring null/undefined throws TypeError (including nested and function parameters without a = {} default), renaming with defaults ({a: b = 1}), rest excluding already-picked keys and not copying the prototype, swapping via [a, b] = [b, a], and ASI pitfalls when a line starts with ( or [.",
  },
  {
    id: "js.spread-copy-clone",
    track: "javascript",
    name: "Spread, shallow copy & structuredClone",
    tier: 1,
    focus:
      "Object/array spread and Object.assign are shallow (nested objects shared), spread copies only own enumerable props and invokes getters (Object.assign also triggers target setters), JSON.parse(JSON.stringify()) losing Dates/undefined/Map/functions/cycles, and structuredClone handling cycles, Date, Map, Set and typed arrays but throwing on functions/DOM nodes and dropping class prototypes, getters and non-enumerable props.",
  },
  // Tier 2
  {
    id: "js.closures-loops-stale",
    track: "javascript",
    name: "Closures in loops & stale captures",
    tier: 2,
    focus:
      "Output of setTimeout/callbacks created inside for loops with var vs let (per-iteration binding, including the for-loop init copy semantics), IIFE workarounds, closures capturing variables not values, stale values captured by long-lived callbacks (setInterval, event listeners), and closures keeping large outer objects alive.",
  },
  {
    id: "js.coercion-equality",
    track: "javascript",
    name: "Type coercion & == algorithm",
    tier: 2,
    focus:
      "The Abstract Equality steps (null == undefined only, no coercion of null to 0 in ==, booleans converted to numbers first, objects via ToPrimitive), results such as [] == ![], '0' == false, NaN != NaN, [] + {}, {} + [] at statement start, '5' - 2 vs '5' + 2, unary + on strings/arrays/Dates, relational comparison of strings lexicographically, and Object.is vs === (NaN, +0/-0).",
  },
  {
    id: "js.this-binding",
    track: "javascript",
    name: "this binding rules & bind precedence",
    tier: 2,
    focus:
      "Default (undefined in strict/modules, globalThis in sloppy), implicit, explicit (call/apply/bind) and new binding with their precedence; lost binding when extracting a method or passing it as a callback; bind being permanent (re-bind and call ignored) yet overridden by new; this inside nested functions, setTimeout callbacks, and top-level this in ES modules vs CommonJS.",
  },
  {
    id: "js.arrow-class-fields",
    track: "javascript",
    name: "Arrow functions & class-field methods",
    tier: 2,
    focus:
      "Arrow functions have lexical this/arguments/super/new.target, cannot be constructed, ignore call/apply/bind thisArg; arrow methods on object literals capturing module this; class-field arrow methods being per-instance (memory, not on prototype, not overridable via super, not mockable on the prototype) vs prototype methods; returning object literals needing parentheses.",
  },
  {
    id: "js.array-method-gotchas",
    track: "javascript",
    name: "Array method gotchas",
    tier: 2,
    focus:
      "Default sort converts to strings ([10, 9, 1].sort()), sort/reverse/splice mutate vs toSorted/toReversed/toSpliced/with (ES2023) returning copies, ['1','2','3'].map(parseInt), holes (forEach/map/filter skip them, for-of and spread yield undefined), includes finding NaN while indexOf doesn't, Array(3) vs Array.of(3) vs Array.from({length: 3}), reduce without initial value on empty arrays throwing, and mutating an array while iterating it.",
  },
  {
    id: "js.numbers-floating-point",
    track: "javascript",
    name: "Numbers & floating point",
    tier: 2,
    focus:
      "IEEE-754 doubles: 0.1 + 0.2 !== 0.3, comparing with Number.EPSILON, Number.MAX_SAFE_INTEGER and precision loss beyond it (e.g. large IDs from JSON), NaN propagation and isNaN vs Number.isNaN coercion, -0 behaviour (Object.is, 1/-0, JSON.stringify(-0)), parseInt/parseFloat vs Number('') and Number(' 12 '), toFixed rounding surprises (1.005.toFixed(2)), and integer division/modulo of negatives.",
  },
  {
    id: "js.object-keys-json",
    track: "javascript",
    name: "Property order, enumeration & JSON",
    tier: 2,
    focus:
      "Own-key ordering (integer-like keys ascending, then strings in insertion order, then symbols), for...in including inherited enumerable keys vs Object.keys/entries vs Reflect.ownKeys, computed keys coercing to strings (obj[{}] collisions), JSON.stringify dropping undefined/functions/symbols in objects but writing null in arrays, toJSON, replacer/space args, reviver, and throwing on BigInt and cycles.",
  },
  {
    id: "js.error-handling",
    track: "javascript",
    name: "Errors, try/catch & custom errors",
    tier: 2,
    focus:
      "try/catch not catching errors thrown later in async callbacks, throwing non-Error values (no stack), custom Error subclasses (name, instanceof, stack capture), Error cause option, AggregateError, optional catch binding, catch-scoped variable shadowing, rethrowing vs swallowing, and finally always running (including after return).",
  },
  // Tier 3
  {
    id: "js.map-set-collections",
    track: "javascript",
    name: "Map, Set & modern collection APIs",
    tier: 3,
    focus:
      "Map vs plain object (any key type, SameValueZero so NaN keys work and -0 equals +0, insertion-order iteration, size, no prototype-key collisions), object keys in Set compared by reference, iteration while mutating, JSON.stringify(new Map()) giving {}, Object.groupBy vs Map.groupBy (ES2024), ES2025 Set methods (union, intersection, difference, isSubsetOf) and Iterator helpers (map/filter/take on iterators being lazy).",
  },
  {
    id: "js.prototype-chain",
    track: "javascript",
    name: "Prototypes & the prototype chain",
    tier: 3,
    focus:
      "__proto__/Object.getPrototypeOf vs a function's .prototype, property lookup and shadowing (assignment creates an own prop unless an inherited setter or non-writable prop blocks it), Object.create(null) dictionaries lacking hasOwnProperty (use Object.hasOwn), instanceof walking the chain and being fooled by prototype reassignment, constructor property pitfalls, and methods on the prototype being shared across instances.",
  },
  {
    id: "js.class-internals",
    track: "javascript",
    name: "Class internals & private fields",
    tier: 3,
    focus:
      "Classes as constructor functions with non-enumerable methods, strict-mode bodies and TDZ; derived constructors must call super() before this; field initialisation order (base constructor runs before derived fields, so an overridden method called from the base sees undefined fields); fields using define semantics (shadowing accessors); #private brand checks (#x in obj) and TypeError on foreign objects; static fields/blocks and static inheritance; super method lookup via [[HomeObject]].",
  },
  {
    id: "js.event-loop-microtasks",
    track: "javascript",
    name: "Event loop: microtasks vs macrotasks",
    tier: 3,
    focus:
      "Predict log order mixing synchronous code, setTimeout(0), Promise.then, queueMicrotask, await and requestAnimationFrame; the microtask queue draining fully after each macrotask (and starving rendering/timers when it re-queues itself); the executor of new Promise running synchronously; and the misconception that setTimeout(fn, 0) runs immediately or that await pauses the whole thread.",
  },
  {
    id: "js.promise-combinators",
    track: "javascript",
    name: "Promises & combinators",
    tier: 3,
    focus:
      "Promise.all rejecting fast while other promises keep running (no cancellation), allSettled result shape, race vs any (AggregateError when all reject), Promise.withResolvers (ES2024) and Promise.try (ES2025), then returning a value vs a promise vs throwing, missing return inside then chains, .catch placement vs the second then argument, and unhandled rejections from promises created but not awaited.",
  },
  {
    id: "js.async-await-errors",
    track: "javascript",
    name: "async/await desugaring & errors",
    tier: 3,
    focus:
      "async functions always returning promises, await on non-promises/thenables, return vs return await inside try/catch/finally (error not caught), sequential awaits in loops vs Promise.all parallelism, async callbacks in forEach not being awaited, errors thrown synchronously in an async function becoming rejections, and top-level await only in modules.",
  },
  {
    id: "js.property-descriptors",
    track: "javascript",
    name: "Property descriptors, getters & freeze",
    tier: 3,
    focus:
      "Data vs accessor descriptors, Object.defineProperty defaulting writable/enumerable/configurable to false, writes to non-writable props failing silently in sloppy mode but throwing in strict mode, getters/setters on objects and classes (infinite recursion when a setter assigns to itself), Object.freeze being shallow, freeze vs seal vs preventExtensions, and non-configurable props blocking delete and redefinition.",
  },
  // Tier 4
  {
    id: "js.generators-iterators",
    track: "javascript",
    name: "Iterators, generators & async iteration",
    tier: 4,
    focus:
      "The iterator protocol and Symbol.iterator, generators being lazy and single-use, next(value) feeding the paused yield (first next arg ignored), return()/throw() and finally blocks running on early break from for-of, yield* delegation and its return value, infinite generators with spread, and async generators with for await...of (sequential awaiting, Array.fromAsync, cleanup on break).",
  },
  {
    id: "js.proxy-reflect",
    track: "javascript",
    name: "Proxy & Reflect",
    tier: 4,
    focus:
      "Common traps (get/set/has/deleteProperty/ownKeys/apply/construct), forwarding with Reflect and the receiver argument so getters see the proxy, set traps needing to return true (TypeError in strict mode otherwise), invariants that throw (non-configurable props), proxies of Map/Set/Date/private-field classes breaking because internal slots are not forwarded, identity (proxy !== target), and Proxy.revocable.",
  },
  {
    id: "js.symbols-toprimitive",
    track: "javascript",
    name: "Symbols & Symbol.toPrimitive",
    tier: 4,
    focus:
      "Symbol() uniqueness vs Symbol.for registry, symbols skipped by for-in/Object.keys/JSON but seen by Reflect.ownKeys, TypeError on implicit string conversion of symbols, ToPrimitive hint order (valueOf then toString for 'number'/'default', reversed for 'string', Date defaulting to 'string'), Symbol.toPrimitive overriding both, and well-known symbols (iterator, asyncIterator, toStringTag, hasInstance).",
  },
  {
    id: "js.esm-semantics",
    track: "javascript",
    name: "ES module semantics & live bindings",
    tier: 4,
    focus:
      "Imports are live read-only bindings (reassigning an import throws; exported let updates are seen by importers), export default expression vs export { x as default } (snapshot vs live), static imports hoisted and evaluated once in depth-first post-order, circular imports hitting the TDZ, namespace objects being frozen, dynamic import() returning a promise, and top-level await delaying dependent modules.",
  },
  {
    id: "js.tagged-templates-strings",
    track: "javascript",
    name: "Tagged templates, strings & Unicode",
    tier: 4,
    focus:
      "Tag function arguments (strings array with .raw, interpolated values), the strings array being frozen and identical across calls from the same call site, String.raw, strings as UTF-16 (emoji length 2, split('') breaking surrogate pairs vs [...str]), normalize() for equality, localeCompare vs < for sorting, and replace vs replaceAll with string patterns and $ replacement sequences.",
  },
  {
    id: "js.control-flow-quirks",
    track: "javascript",
    name: "finally, labels, ASI & switch quirks",
    tier: 4,
    focus:
      "return/throw in finally overriding the try/catch completion (swallowing errors), finally running after return with the return value already computed, labelled break/continue out of nested loops, switch using === and fall-through with default placement, ASI hazards (return followed by newline, lines starting with ( [ or `), and the comma operator.",
  },
  {
    id: "js.regex-gotchas",
    track: "javascript",
    name: "Regular expression gotchas",
    tier: 4,
    focus:
      "Stateful lastIndex with /g or /y making test()/exec() alternate true/false, match vs matchAll (needs /g) vs exec, greedy vs lazy quantifiers, named groups and lookbehind, the u/v flags (v in ES2024) for Unicode, catastrophic backtracking (ReDoS) from nested quantifiers, RegExp.escape (ES2025) vs building patterns from user input, and replace with a function replacer.",
  },
  // Tier 5
  {
    id: "js.promise-resolution-ticks",
    track: "javascript",
    name: "Promise resolution & tick ordering",
    tier: 5,
    focus:
      "Precise microtask counts: resolving with a native promise/thenable adds extra ticks (NewPromiseResolveThenableJob), async function returning a promise resolving later than returning a value, await on a native promise taking one tick, interleaving of two concurrent async functions and then-chains, and Promise.resolve(p) === p for native promises.",
  },
  {
    id: "js.memory-weakrefs-gc",
    track: "javascript",
    name: "GC, WeakMap, WeakRef & leaks",
    tier: 5,
    focus:
      "Reachability-based GC, WeakMap/WeakSet keys must be objects or non-registered symbols and are not iterable/sizable, using WeakMap for private data and caches keyed by objects, WeakRef.deref and FinalizationRegistry callbacks being non-deterministic (never rely on them for correctness), and typical leaks: forgotten timers/listeners, unbounded Map caches, closures sharing a scope that retains big objects, detached DOM nodes.",
  },
  {
    id: "js.bigint-typed-arrays",
    track: "javascript",
    name: "BigInt, TypedArrays & ArrayBuffer",
    tier: 5,
    focus:
      "BigInt mixing with Number throwing TypeError, 1n == 1 but 1n !== 1, truncating division, no Math/unary + support, JSON.stringify throwing; TypedArrays wrapping/clamping on overflow (Uint8 vs Uint8ClampedArray), multiple views over one ArrayBuffer sharing memory, endianness via DataView, resizable ArrayBuffer and transfer() (ES2024), and structuredClone/postMessage transfer detaching buffers.",
  },
  {
    id: "js.engine-optimisations",
    track: "javascript",
    name: "Engine internals: shapes & ICs",
    tier: 5,
    focus:
      "V8 hidden classes/shapes and why property insertion order and delete matter, monomorphic vs polymorphic vs megamorphic inline caches, packed vs holey and SMI vs double elements kinds (and why new Array(n) or holes deoptimise), JIT deoptimisation triggers, and string concatenation (ropes) vs join performance myths.",
  },
  {
    id: "js.scope-internals-sloppy",
    track: "javascript",
    name: "Scope internals & sloppy-mode quirks",
    tier: 5,
    focus:
      "Lexical environments and the scope chain, direct vs indirect eval scope, with statements, arguments aliasing parameters in sloppy mode but not strict mode or with default params, Annex B block-level function declarations behaving differently in sloppy vs strict, named function expression names being read-only inside the function, and implicit globals from assignment to undeclared variables.",
  },

  // ─────────────────────────────── NODE ────────────────────────────────
  // Tier 1
  {
    id: "node.module-systems-basics",
    track: "node",
    name: "CommonJS vs ESM basics",
    tier: 1,
    focus:
      "How Node decides module type (.mjs/.cjs, package.json 'type', Node 22 syntax detection), exports vs module.exports (reassigning exports breaks the link), ESM requiring file extensions and lacking __dirname/__filename/require (import.meta.dirname/filename/resolve), JSON imports needing import attributes, and top-level this being module.exports in CJS vs undefined in ESM.",
  },
  {
    id: "node.process-env-exit",
    track: "node",
    name: "process, env vars & exit codes",
    tier: 1,
    focus:
      "process.env values always being strings ('false' is truthy, undefined vs ''), --env-file and loading order, process.argv layout, process.exit() truncating pending async stdout writes vs setting process.exitCode, exit codes on uncaught errors, and the 'exit' event only allowing synchronous work.",
  },
  {
    id: "node.fs-apis",
    track: "node",
    name: "fs: sync, callback & promises APIs",
    tier: 1,
    focus:
      "fs sync calls blocking the event loop, error-first callbacks vs fs/promises, readFile loading whole files into memory vs streams, existsSync-then-open TOCTOU races (open and handle ENOENT/EEXIST instead), writeFile not being atomic (write temp then rename), mkdir recursive, and relative paths resolving against process.cwd() not the module's directory.",
  },
  {
    id: "node.path-url",
    track: "node",
    name: "path & URL handling",
    tier: 1,
    focus:
      "path.join vs path.resolve (absolute segments reset resolve, join just concatenates), normalize and '..' handling, path.posix vs win32 separators, fileURLToPath/pathToFileURL for import.meta.url, new URL(relative, base) resolution differing with/without a trailing slash on the base, and URLSearchParams encoding (+ vs %20).",
  },
  {
    id: "node.callbacks-promisify",
    track: "node",
    name: "Error-first callbacks & promisify",
    tier: 1,
    focus:
      "The (err, result) convention, calling a callback twice or both sync and async (releasing Zalgo), throwing inside callbacks not reaching the caller's try/catch, util.promisify and util.promisify.custom, callbackify, and timers/promises, events.once and fs/promises as promise-native alternatives.",
  },
  {
    id: "node.npm-package-json",
    track: "node",
    name: "npm, semver & package.json",
    tier: 1,
    focus:
      "Semver ranges (^ on 0.x only allowing patch bumps, ~, exact), lockfiles and npm ci vs npm install, dependencies vs devDependencies vs peerDependencies, the 'exports' field blocking deep imports and conditional exports (import/require/default order), 'engines', npx/npm scripts and lifecycle hooks (postinstall supply-chain risk).",
  },
  // Tier 2
  {
    id: "node.event-loop-phases",
    track: "node",
    name: "Event loop phases",
    tier: 2,
    focus:
      "libuv phases (timers, pending callbacks, poll, check, close), why setTimeout(0) vs setImmediate order is non-deterministic in the main module but setImmediate always wins inside an I/O callback, poll phase blocking for I/O, setTimeout minimum 1ms and drift, and what keeps the process alive (ref/unref handles).",
  },
  {
    id: "node.nexttick-microtasks",
    track: "node",
    name: "nextTick vs promises vs setImmediate",
    tier: 2,
    focus:
      "Order of logs mixing process.nextTick, Promise.then, queueMicrotask, setTimeout(0) and setImmediate; nextTick queue draining before the promise microtask queue in CommonJS, the ordering flipping in an ESM entry module (evaluation already runs inside a microtask), and recursive nextTick starving I/O.",
  },
  {
    id: "node.eventemitter",
    track: "node",
    name: "EventEmitter semantics",
    tier: 2,
    focus:
      "emit() calling listeners synchronously in registration order (and returning a boolean), an 'error' event with no listener throwing and crashing the process, once, prependListener, listeners added/removed during emit, MaxListenersExceededWarning as a leak signal, async listeners' rejections being unhandled unless captureRejections, and events.once/events.on promise helpers.",
  },
  {
    id: "node.buffers-encodings",
    track: "node",
    name: "Buffers & encodings",
    tier: 2,
    focus:
      "Buffer.alloc vs allocUnsafe (uninitialised memory leaks) and the shared pool, byte length vs string length for UTF-8, subarray/slice sharing memory, multi-byte characters split across chunks (StringDecoder/setEncoding), base64 vs base64url vs hex, Buffer as a Uint8Array subclass, and Buffer.concat cost in loops.",
  },
  {
    id: "node.http-server-basics",
    track: "node",
    name: "http module & request lifecycle",
    tier: 2,
    focus:
      "req/res being streams (body must be consumed, chunks concatenated), forgetting res.end() hanging requests, ERR_HTTP_HEADERS_SENT from writing headers twice, Content-Length vs chunked encoding, status/headers defaults, the global fetch (undici) client not throwing on 4xx/5xx and requiring body consumption, and request body size limits.",
  },
  {
    id: "node.express-middleware",
    track: "node",
    name: "Express/Fastify middleware & errors",
    tier: 2,
    focus:
      "Middleware order (registration order, app.use path prefix matching), next() vs next(err) vs next('route'), error handlers needing 4 arguments and registration after routes, Express 4 not catching async rejections vs Express 5 forwarding them, double responses after next(), and Fastify's hook lifecycle/encapsulation and async handlers returning values vs reply.send.",
  },
  {
    id: "node.unhandled-errors",
    track: "node",
    name: "Uncaught exceptions & rejections",
    tier: 2,
    focus:
      "unhandledRejection crashing the process by default (--unhandled-rejections=throw since Node 15), uncaughtException leaving the process in an undefined state (log and exit, don't resume), rejections handled late, errors in async callbacks escaping try/catch, operational vs programmer errors, and async stack traces.",
  },
  // Tier 3
  {
    id: "node.streams-fundamentals",
    track: "node",
    name: "Streams: readable/writable basics",
    tier: 3,
    focus:
      "Readable flowing vs paused mode (attaching 'data' starts flow, data lost if no consumer), for await over readables, objectMode, highWaterMark, 'end' vs 'finish' vs 'close' events, Readable.from, and the misconception that streams make code faster rather than memory-bounded.",
  },
  {
    id: "node.streams-backpressure",
    track: "node",
    name: "Backpressure & stream.pipeline",
    tier: 3,
    focus:
      "write() returning false and waiting for 'drain', ignoring backpressure causing memory blowups, .pipe() not forwarding errors or destroying other streams (leaking file descriptors) vs stream.pipeline / stream/promises pipeline, implementing a Transform (callback, push, flush), and finished() for cleanup.",
  },
  {
    id: "node.esm-cjs-interop",
    track: "node",
    name: "ESM/CJS interop & require(esm)",
    tier: 3,
    focus:
      "import of a CJS module giving module.exports as default with named exports only via static analysis (cjs-module-lexer), require(esm) enabled by default in Node 22.12+ but throwing ERR_REQUIRE_ASYNC_MODULE for top-level await, createRequire, dynamic import() from CJS, the dual-package hazard (two copies/instanceof failures), and conditional exports.",
  },
  {
    id: "node.require-cache-resolution",
    track: "node",
    name: "require cache, resolution & cycles",
    tier: 3,
    focus:
      "Modules cached by resolved filename (singletons, different paths/symlinks producing duplicates), the module wrapper (exports, require, module, __filename, __dirname), node_modules lookup walking up directories, CJS circular requires returning partially-filled exports, deleting require.cache for reloads, and ESM's cache being non-clearable.",
  },
  {
    id: "node.abort-timers",
    track: "node",
    name: "AbortController, timeouts & cancellation",
    tier: 3,
    focus:
      "Passing AbortSignal to fetch, fs, events.once, timers/promises and child_process; AbortSignal.timeout and AbortSignal.any; AbortError name vs TimeoutError; listener cleanup to avoid leaks on long-lived signals; timer.unref(); and cancellation not stopping work already running (Promise.race 'timeouts' leaving the operation running).",
  },
  {
    id: "node.child-process",
    track: "node",
    name: "child_process: exec, spawn, fork",
    tier: 3,
    focus:
      "exec (shell, buffered, maxBuffer, command injection with user input) vs execFile vs spawn (streams, args array) vs fork (IPC channel), 'exit' vs 'close' events, stdio inherit/pipe, deadlocks from unread stdout pipes, killing process trees, and signal handling in children.",
  },
  {
    id: "node.async-concurrency",
    track: "node",
    name: "Async concurrency control",
    tier: 3,
    focus:
      "Unbounded Promise.all fan-out exhausting DB pools/file descriptors/rate limits, bounded concurrency (p-limit style queues), sequential for-await loops when order/limits matter, retries with exponential backoff and jitter only for idempotent operations, timeouts per attempt, and partial failure handling with allSettled.",
  },
  // Tier 4
  {
    id: "node.workers-cluster",
    track: "node",
    name: "worker_threads vs cluster vs processes",
    tier: 4,
    focus:
      "worker_threads for CPU-bound JS (separate isolates/event loops, postMessage structured clone, transferList, SharedArrayBuffer + Atomics) vs cluster (multiple processes sharing a port, no shared memory, sticky sessions for websockets) vs child_process; worker pool sizing; and the misconception that async I/O needs workers.",
  },
  {
    id: "node.libuv-threadpool",
    track: "node",
    name: "libuv thread pool & blocking work",
    tier: 4,
    focus:
      "UV_THREADPOOL_SIZE default 4 and which APIs use it (fs, dns.lookup, crypto.pbkdf2/scrypt, zlib) vs OS-level async networking, dns.lookup vs dns.resolve under load, pool saturation causing unrelated fs latency, and sync crypto/JSON/regex blocking the main thread.",
  },
  {
    id: "node.graceful-shutdown",
    track: "node",
    name: "Graceful shutdown & signals",
    tier: 4,
    focus:
      "Handling SIGTERM/SIGINT, server.close() stopping new connections but waiting on keep-alive sockets (closeIdleConnections/closeAllConnections), draining in-flight requests and queues, closing DB pools, hard timeout fallback, readiness probe failing first, and PID 1/npm start not forwarding signals in containers.",
  },
  {
    id: "node.http-keepalive-timeouts",
    track: "node",
    name: "HTTP keep-alive, agents & timeouts",
    tier: 4,
    focus:
      "server.keepAliveTimeout shorter than a load balancer's idle timeout causing intermittent 502s, headersTimeout/requestTimeout, client-side connection pooling (http.Agent keepAlive, undici dispatcher), ECONNRESET/'socket hang up' causes, and slowloris-style resource exhaustion.",
  },
  {
    id: "node.async-local-storage",
    track: "node",
    name: "AsyncLocalStorage & context",
    tier: 4,
    focus:
      "Propagating request IDs/tenant/user via AsyncLocalStorage.run, why enterWith is risky, context loss with callback-queue libraries, custom thenables or connection pools (fix via AsyncResource.bind), store mutation vs replacement, and misuse as a global mutable singleton.",
  },
  {
    id: "node.security-pitfalls",
    track: "node",
    name: "Security: pollution, traversal & more",
    tier: 4,
    focus:
      "Prototype pollution via deep merge of JSON.parse output containing __proto__/constructor.prototype, path traversal when joining user input (resolve then check the prefix with a trailing separator), command injection via exec, ReDoS, SSRF via user-controlled URLs, and unvalidated redirects.",
  },
  {
    id: "node.crypto-correctness",
    track: "node",
    name: "crypto correctness",
    tier: 4,
    focus:
      "crypto.randomBytes/randomUUID vs Math.random for tokens, scrypt/argon2/bcrypt with salts vs plain SHA-256 for passwords, timingSafeEqual (throws on length mismatch), HMAC for webhook signatures computed on the raw body (not re-serialised JSON), AES-GCM IV reuse, and sync crypto blocking the loop.",
  },
  // Tier 5
  {
    id: "node.memory-leaks",
    track: "node",
    name: "Memory leaks & V8 heap",
    tier: 5,
    focus:
      "Diagnosing leaks with heap snapshots/comparison and --inspect, rss vs heapUsed vs external/arrayBuffers (Buffers are off-heap), young/old generation GC and --max-old-space-size in containers, and classic leak sources: unbounded caches, listeners on long-lived emitters, closures in timers, and promise chains never settling.",
  },
  {
    id: "node.perf-profiling",
    track: "node",
    name: "Performance profiling & event loop lag",
    tier: 5,
    focus:
      "CPU profiling (--cpu-prof, flame graphs), measuring event-loop delay with perf_hooks.monitorEventLoopDelay/eventLoopUtilization, large JSON.parse/stringify blocking, sync APIs in hot paths, GC pauses, and interpreting p99 latency vs throughput under load testing.",
  },
  {
    id: "node.stream-internals",
    track: "node",
    name: "Custom streams & internals",
    tier: 5,
    focus:
      "Implementing _read/_write/_final/_flush/_destroy correctly, push() returning false, objectMode highWaterMark counting objects, Duplex vs Transform, destroy semantics and autoDestroy, errors after end, async iterator backpressure, and interop with Web Streams (Readable.fromWeb/toWeb).",
  },
  {
    id: "node.observability",
    track: "node",
    name: "Diagnostics & observability",
    tier: 5,
    focus:
      "OpenTelemetry auto-instrumentation needing to load before app code (require hooks vs ESM --import/module.register), diagnostics_channel, structured logging with async transports (pino) vs blocking console.log, correlating logs with trace IDs, and the overhead of async_hooks.",
  },
  {
    id: "node.modern-runtime",
    track: "node",
    name: "Node 22+ runtime features",
    tier: 5,
    focus:
      "Built-in test runner (node:test, mocks, fake timers, --test), --watch, TypeScript type stripping (erasable syntax only: enums/namespaces need transform, no type checking), the permission model, built-in WebSocket client, node:sqlite, and the misconception that type stripping validates types.",
  },

  // ────────────────────────────── MONGODB ──────────────────────────────
  // Tier 1
  {
    id: "mongo.bson-types",
    track: "mongodb",
    name: "Documents & BSON types",
    tier: 1,
    focus:
      "Querying an ObjectId field with a string (no match), Date vs ISO string storage, Int32/Int64/Double/Decimal128 and money precision, null vs missing fields, the 16MB document limit, immutable _id, and BSON type ordering when comparing mixed types.",
  },
  {
    id: "mongo.crud-basics",
    track: "mongodb",
    name: "CRUD operations & results",
    tier: 1,
    focus:
      "insertMany ordered vs unordered on duplicate key errors (what gets inserted), find returning a lazy cursor, matchedCount vs modifiedCount (0 modified when values are unchanged), replaceOne vs updateOne (driver rejecting updates without operators), deleteMany({}) wiping a collection, and findOneAndUpdate returning the pre-image by default.",
  },
  {
    id: "mongo.query-operators",
    track: "mongodb",
    name: "Comparison & logical query operators",
    tier: 1,
    focus:
      "Implicit AND and duplicate keys in a JS object literal silently overwriting conditions, $or vs $in, $ne/$nin matching documents where the field is missing, { field: null } matching null and missing, $exists and $type, and case-insensitive/unanchored $regex not using indexes efficiently.",
  },
  {
    id: "mongo.projection",
    track: "mongodb",
    name: "Projection rules",
    tier: 1,
    focus:
      "Not mixing inclusion and exclusion except for _id, _id included by default, dotted paths into embedded docs and arrays, $slice and $elemMatch projection, positional $ projection returning only the first match, and projection reducing network/memory but not documents examined.",
  },
  {
    id: "mongo.sort-limit-skip",
    track: "mongodb",
    name: "Sort, limit & skip",
    tier: 1,
    focus:
      "Cursor method call order not mattering (sort then skip then limit are always applied in that order), non-deterministic results when sorting on non-unique fields without a tiebreaker like _id, sorting on arrays (min/max element) and missing fields, and blocking in-memory sorts with their memory limit when no index supports the sort.",
  },
  {
    id: "mongo.mongoose-schemas",
    track: "mongodb",
    name: "Mongoose schemas, casting & strict",
    tier: 1,
    focus:
      "Schema types and casting ('5' to 5, invalid ObjectId CastError), strict mode silently dropping unknown fields on save, strictQuery default false in Mongoose 7+ (unknown filter keys passed through), defaults, timestamps, required with empty strings/arrays, and model name pluralisation into collection names.",
  },
  // Tier 2
  {
    id: "mongo.array-query-semantics",
    track: "mongodb",
    name: "Array matching: dot vs $elemMatch",
    tier: 2,
    focus:
      "{ tags: 'x' } matching any element, exact array equality being order-sensitive, dot-notation conditions on arrays of subdocuments matching across different elements vs $elemMatch requiring one element to satisfy all, range queries on scalar arrays satisfied by different elements, $all, and $size not supporting ranges.",
  },
  {
    id: "mongo.update-operators",
    track: "mongodb",
    name: "Update operators",
    tier: 2,
    focus:
      "$set/$unset/$inc (creating missing fields), $push with $each/$slice/$sort/$position, $addToSet object equality being field-order sensitive, $pull with conditions, $min/$max, $setOnInsert, $rename, conflicting paths in one update erroring, and update pipelines (aggregation-style updates) for computed values.",
  },
  {
    id: "mongo.positional-operators",
    track: "mongodb",
    name: "Positional operators $, $[], $[id]",
    tier: 2,
    focus:
      "$ updating only the first matched element and requiring the array in the query filter, $[] updating all elements, $[<identifier>] with arrayFilters for conditional and nested-array updates, $ not working with $elemMatch-less multi-condition filters across elements, and positional operators in upserts.",
  },
  {
    id: "mongo.upsert-behaviour",
    track: "mongodb",
    name: "Upsert behaviour & races",
    tier: 2,
    focus:
      "Which fields an upsert copies from the filter (equality fields yes, operator expressions no), $setOnInsert vs $set, concurrent upserts creating duplicates without a unique index (and E11000 retries), upsert: true with $ positional, and returnDocument/new options on findOneAndUpdate.",
  },
  {
    id: "mongo.aggregation-basics",
    track: "mongodb",
    name: "Aggregation pipeline basics",
    tier: 2,
    focus:
      "Stage order mattering ($match/$sort early for index use), $project vs $addFields/$set, $group with _id: null and accumulators, $group output order not guaranteed, '$field' paths vs literal strings ($literal), $count, and aggregation returning plain documents (no Mongoose casting or hooks on input).",
  },
  {
    id: "mongo.indexes-basics",
    track: "mongodb",
    name: "Index fundamentals & unique indexes",
    tier: 2,
    focus:
      "Single-field indexes and direction, the automatic _id index, unique indexes treating missing fields as null (only one doc may lack the field; use a partial index), index write/memory cost, Mongoose autoIndex in production, and case-insensitive uniqueness via collation.",
  },
  {
    id: "mongo.mongoose-queries",
    track: "mongodb",
    name: "Mongoose queries, lean & exec",
    tier: 2,
    focus:
      "Queries being thenables executed on await (awaiting twice throws 'Query was already executed'), callbacks removed in Mongoose 7+, find returning [] vs findOne returning null, lean() returning POJOs (no virtuals, getters, save or defaults), countDocuments vs estimatedDocumentCount, and select/sort/limit chaining.",
  },
  // Tier 3
  {
    id: "mongo.compound-index-esr",
    track: "mongodb",
    name: "Compound indexes & ESR rule",
    tier: 3,
    focus:
      "Equality-Sort-Range field ordering, the index prefix rule (which queries can use {a:1,b:1,c:1}), sort direction compatibility (reverse ok, mixed directions must match), range before sort causing in-memory sorts, and redundant indexes that are prefixes of others.",
  },
  {
    id: "mongo.explain-plans",
    track: "mongodb",
    name: "Reading explain() plans",
    tier: 3,
    focus:
      "queryPlanner vs executionStats, COLLSCAN vs IXSCAN vs FETCH vs SORT stages, ratios of totalKeysExamined/totalDocsExamined/nReturned, rejectedPlans and the plan cache, hint(), and why a used index can still be a bad index.",
  },
  {
    id: "mongo.covered-queries",
    track: "mongodb",
    name: "Covered queries",
    tier: 3,
    focus:
      "Conditions for a covered query (filter and projection fields all in the index, _id excluded unless indexed), totalDocsExamined 0 as proof, multikey indexes and embedded-doc projections preventing coverage, and trade-offs of widening indexes.",
  },
  {
    id: "mongo.lookup-unwind",
    track: "mongodb",
    name: "$lookup & $unwind",
    tier: 3,
    focus:
      "$lookup localField/foreignField vs pipeline with let/$expr (correlated subqueries), needing an index on the foreign field, $lookup always producing an array, $unwind dropping docs with empty/missing arrays unless preserveNullAndEmptyArrays, cardinality explosion from unwinding, and regrouping with $group.",
  },
  {
    id: "mongo.mongoose-populate",
    track: "mongodb",
    name: "Mongoose populate",
    tier: 3,
    focus:
      "populate running separate queries (not a join), populate inside loops causing N+1, missing refs yielding null or being filtered out, populate with select/match/options, virtual populate (localField/foreignField, justOne), populate on lean docs, and deep populate cost.",
  },
  {
    id: "mongo.mongoose-middleware-validation",
    track: "mongodb",
    name: "Mongoose hooks & validation",
    tier: 3,
    focus:
      "Document vs query middleware (this is the doc vs the Query), save hooks not firing for updateOne/findOneAndUpdate/insertMany, validators running on save but not on updates unless runValidators (with limited context), unique not being a validator, async/pre hook errors, and deleteOne document vs query middleware.",
  },
  {
    id: "mongo.mongoose-virtuals",
    track: "mongodb",
    name: "Virtuals, getters & toJSON",
    tier: 3,
    focus:
      "Virtuals not included in res.json unless toJSON/toObject { virtuals: true }, the id virtual, getters/setters and when they run, transform functions to strip fields like password, lean dropping virtuals/getters, and virtuals not being queryable.",
  },
  // Tier 4
  {
    id: "mongo.special-indexes",
    track: "mongodb",
    name: "Multikey, partial, TTL & text indexes",
    tier: 4,
    focus:
      "Multikey indexes (can't compound two array fields; bounds not always intersected), partial indexes only used when the query includes the partial filter condition, sparse vs partial, TTL on a single Date field with a background monitor running about every 60s (not exact), and text/wildcard index limits.",
  },
  {
    id: "mongo.aggregation-advanced",
    track: "mongodb",
    name: "Advanced aggregation ($facet, windows)",
    tier: 4,
    focus:
      "$facet (sub-pipelines can't use indexes, 16MB output limit), $bucket/$bucketAuto, $setWindowFields for running totals/ranks, $map/$filter/$reduce on arrays, $unionWith, $merge vs $out, per-stage memory limits and allowDiskUse, and $expr in $match having limited index use.",
  },
  {
    id: "mongo.pagination",
    track: "mongodb",
    name: "Pagination: skip vs keyset",
    tier: 4,
    focus:
      "skip cost growing linearly, keyset/range pagination on (sortField, _id) with compound tiebreaker conditions, duplicates/missing rows under concurrent inserts with skip, exposing opaque cursors, and the cost of exact total counts (estimates or $facet).",
  },
  {
    id: "mongo.schema-embed-reference",
    track: "mongodb",
    name: "Schema design: embed vs reference",
    tier: 4,
    focus:
      "Designing for access patterns, embedding for data read together vs referencing for independent/large/unbounded data, unbounded array anti-pattern and the 16MB limit, extended reference and subset patterns, duplication consistency trade-offs, and one-to-few vs one-to-many vs one-to-squillions.",
  },
  {
    id: "mongo.transactions",
    track: "mongodb",
    name: "Multi-document transactions",
    tier: 4,
    focus:
      "Requiring a replica set/sharded cluster, passing the session to every operation (forgetting { session } in Mongoose runs outside the txn), withTransaction retrying on TransientTransactionError/UnknownTransactionCommitResult (so the callback must be idempotent), write conflicts, 60s default lifetime, and preferring single-document atomicity via schema design.",
  },
  {
    id: "mongo.read-write-concerns",
    track: "mongodb",
    name: "Read/write concerns & preference",
    tier: 4,
    focus:
      "w:1 vs w:'majority' (implicit default majority since 5.0) and rollback of non-majority writes on failover, j and wtimeout, readConcern local/majority/snapshot/linearizable, secondary reads returning stale data, causal consistency sessions, and retryable writes.",
  },
  // Tier 5
  {
    id: "mongo.objectid-internals",
    track: "mongodb",
    name: "ObjectId internals",
    tier: 5,
    focus:
      "12-byte layout (4-byte timestamp, 5-byte random per process, 3-byte counter), getTimestamp and range queries by creation time, _id ordering only roughly matching insertion (second granularity, client clock skew), ObjectIds not being secrets, comparing with .equals() vs === in JS, and 24-hex validation pitfalls (isValid accepting 12-char strings).",
  },
  {
    id: "mongo.performance-n-plus-one",
    track: "mongodb",
    name: "N+1, pooling & query performance",
    tier: 5,
    focus:
      "N+1 queries from loops and populate (batch with $in, DataLoader, $lookup), connection pool sizing (maxPoolSize) and pool exhaustion under Promise.all, projection to shrink payloads, slow query log/profiler, and the working set exceeding RAM.",
  },
  {
    id: "mongo.schema-patterns-advanced",
    track: "mongodb",
    name: "Advanced schema patterns",
    tier: 5,
    focus:
      "Bucket pattern and native time-series collections, computed/pre-aggregated pattern, outlier pattern, polymorphic collections (Mongoose discriminators), schema versioning and lazy migration, and archiving strategies.",
  },
  {
    id: "mongo.concurrency-atomicity",
    track: "mongodb",
    name: "Atomicity & optimistic concurrency",
    tier: 5,
    focus:
      "Single-document atomicity, lost updates from read-modify-save in application code vs atomic operators or conditional filters, Mongoose versionKey (__v only incremented for array changes by default) vs optimisticConcurrency, conditional findOneAndUpdate for inventory/counters, and idempotency keys.",
  },
  {
    id: "mongo.replication-sharding",
    track: "mongodb",
    name: "Replication & sharding",
    tier: 5,
    focus:
      "Replica set elections and driver retry behaviour, oplog, shard key selection (cardinality, frequency, monotonically increasing keys causing hot shards), targeted vs scatter-gather queries, hashed vs ranged sharding, jumbo chunks, and resharding.",
  },

  // ─────────────────────────────── REACT ───────────────────────────────
  // Tier 1
  {
    id: "react.jsx-rendering-rules",
    track: "react",
    name: "JSX rules & rendering values",
    tier: 1,
    focus:
      "JSX compiling to jsx() calls, expressions vs statements in JSX, {count && <X/>} rendering 0, true/false/null/undefined rendering nothing, lowercase component names being treated as DOM tags, className/htmlFor, style objects, fragments (keyed <Fragment>), and returning multiple elements.",
  },
  {
    id: "react.props-state-snapshots",
    track: "react",
    name: "Props, state & render snapshots",
    tier: 1,
    focus:
      "State as a per-render snapshot (reading state right after setState gives the old value), props being read-only, mutating state objects/arrays in place causing no re-render (same reference), immutable update patterns for nested objects and arrays, and initialiser functions useState(() => expensive()) vs useState(expensive()).",
  },
  {
    id: "react.list-keys",
    track: "react",
    name: "Lists & keys",
    tier: 1,
    focus:
      "Index keys causing state/input mix-ups on insert/reorder/delete, random keys remounting every render, keys only needing sibling uniqueness, key placed on the wrong element (inner vs mapped outer), key not accessible as a prop, and using key deliberately to reset component state.",
  },
  {
    id: "react.events-handlers",
    track: "react",
    name: "Event handling",
    tier: 1,
    focus:
      "onClick={handle()} calling during render vs onClick={handle}, passing arguments with arrow functions, synthetic events and preventDefault vs returning false, event delegation at the root container, stopPropagation semantics, and onChange firing on every keystroke (unlike the DOM change event).",
  },
  {
    id: "react.controlled-uncontrolled",
    track: "react",
    name: "Controlled vs uncontrolled inputs",
    tier: 1,
    focus:
      "value without onChange making inputs read-only, the warning when switching from undefined to a defined value, defaultValue/defaultChecked, file inputs always uncontrolled, number inputs yielding strings, select multiple, and controlled inputs losing cursor position when updated asynchronously.",
  },
  {
    id: "react.what-triggers-render",
    track: "react",
    name: "What triggers a re-render",
    tier: 1,
    focus:
      "Re-renders caused by own state change, parent re-render (children re-render regardless of whether props changed unless memoised) and context change; the misconception that props changes trigger renders; render purity requirements; and render vs commit (DOM only updated for differences).",
  },
  // Tier 2
  {
    id: "react.batching-updaters",
    track: "react",
    name: "State batching & updater functions",
    tier: 2,
    focus:
      "Automatic batching in React 18+ including inside timeouts/promises/native handlers, calling setCount(count + 1) three times vs setCount(c => c + 1), mixing values and updaters, Object.is bailout on identical values, flushSync, and updaters needing to be pure (run twice in StrictMode).",
  },
  {
    id: "react.effects-lifecycle",
    track: "react",
    name: "useEffect lifecycle & cleanup",
    tier: 2,
    focus:
      "Effects running after paint, cleanup running before the next effect and on unmount (with the previous render's values), StrictMode dev mount-unmount-mount exposing missing cleanups, race conditions in fetch effects (ignore flag/AbortController), and 'You might not need an effect' cases (derived data, event-specific logic).",
  },
  {
    id: "react.effect-dependencies",
    track: "react",
    name: "Effect dependency arrays",
    tier: 2,
    focus:
      "No array vs [] vs [deps], Object.is comparison making inline objects/functions retrigger effects every render (infinite loops with setState), suppressing exhaustive-deps causing stale values, removing deps by moving objects inside the effect or using updater functions, and useEffectEvent (stable in React 19.2) for non-reactive logic.",
  },
  {
    id: "react.stale-closures",
    track: "react",
    name: "Stale closures in hooks",
    tier: 2,
    focus:
      "setInterval/timeout/subscription callbacks capturing the render's state, handlers in async flows reading outdated state after await, memoised callbacks with missing deps, and fixes (functional updates, refs updated in effects, useEffectEvent) with their trade-offs.",
  },
  {
    id: "react.refs-dom",
    track: "react",
    name: "Refs, DOM access & ref as prop",
    tier: 2,
    focus:
      "useRef mutations not triggering re-renders, ref.current being null during render and set during commit, reading/writing refs during render being unsafe, callback refs, React 19 ref as a regular prop (forwardRef no longer needed) and ref callbacks returning cleanup functions, and useImperativeHandle.",
  },
  {
    id: "react.derived-state",
    track: "react",
    name: "Derived state & lifting state",
    tier: 2,
    focus:
      "Copying props into state (initial value only, goes stale), syncing state via useEffect causing extra renders and flicker, computing during render instead, resetting state with key, storing IDs instead of duplicated objects, and lifting state vs colocating it.",
  },
  {
    id: "react.identity-reconciliation",
    track: "react",
    name: "Reconciliation & component identity",
    tier: 2,
    focus:
      "State preserved by type and position in the tree, the same component in both branches of a ternary keeping state, changing the element type resetting the subtree, defining components inside other components remounting them every render (focus loss), and keys to force identity.",
  },
  // Tier 3
  {
    id: "react.memoization-tradeoffs",
    track: "react",
    name: "memo, useMemo & useCallback",
    tier: 3,
    focus:
      "React.memo shallow prop comparison broken by inline objects/functions/children JSX, useCallback being useless without a memoised consumer or dependency use, useMemo for expensive computation vs referential stability, costs of memoisation, and custom arePropsEqual pitfalls.",
  },
  {
    id: "react.context-propagation",
    track: "react",
    name: "Context & re-render propagation",
    tier: 3,
    focus:
      "All consumers re-rendering when the provider value identity changes (inline objects), memo not blocking context updates, splitting state/dispatch contexts, default value only used without a provider, React 19 <Context value> as provider, and use(Context) callable conditionally.",
  },
  {
    id: "react.usereducer-state-design",
    track: "react",
    name: "useReducer & state structure",
    tier: 3,
    focus:
      "Reducer purity (called twice in StrictMode; side effects duplicate), returning the same state to bail out, stable dispatch identity, avoiding redundant/contradictory state (isLoading + isError), normalising nested data, and choosing useState vs useReducer vs external stores.",
  },
  {
    id: "react.custom-hooks",
    track: "react",
    name: "Rules of hooks & custom hooks",
    tier: 3,
    focus:
      "Why hooks rely on call order (conditional/looped hooks break state), custom hooks sharing logic not state (each call gets its own), naming with use, returning stable references, avoiding lifecycle-style hooks like useMount, and use() as the exception that can be called conditionally.",
  },
  {
    id: "react.error-boundaries",
    track: "react",
    name: "Error boundaries",
    tier: 3,
    focus:
      "Boundaries being class components (getDerivedStateFromError/componentDidCatch) or libraries, not catching errors in event handlers, async code or the boundary itself, resetting via key or resetKeys, placement granularity, and React 19 root options onCaughtError/onUncaughtError/onRecoverableError.",
  },
  {
    id: "react.portals-bubbling",
    track: "react",
    name: "Portals & event bubbling",
    tier: 3,
    focus:
      "Events from inside a portal bubbling through the React tree (to the parent that rendered the portal) not the DOM tree, 'click outside' handlers breaking, context flowing through portals, focus management and accessibility for modals, and SSR constraints.",
  },
  {
    id: "react.form-actions",
    track: "react",
    name: "React 19 actions & forms",
    tier: 3,
    focus:
      "<form action={fn}> receiving FormData (values are strings), useActionState(action, initial) with action(prevState, formData) signature and isPending, useFormStatus only working in a component rendered inside the form, automatic reset of uncontrolled fields after a successful action, and sequential queuing of actions.",
  },
  // Tier 4
  {
    id: "react.suspense-use",
    track: "react",
    name: "Suspense & the use() hook",
    tier: 4,
    focus:
      "Suspense fallback shown for the nearest boundary, use(promise) requiring a cached/stable promise (creating it during a client render suspends forever), nested boundaries and reveal order, already-shown content not being replaced by a fallback during transitions, and Suspense not catching errors.",
  },
  {
    id: "react.transitions",
    track: "react",
    name: "Transitions & useDeferredValue",
    tier: 4,
    focus:
      "startTransition/useTransition marking non-urgent interruptible updates with isPending, async transitions in React 19 (state updates after an await need their own startTransition), transitions not usable for controlled text input state, and useDeferredValue with initialValue vs debouncing.",
  },
  {
    id: "react.use-optimistic",
    track: "react",
    name: "useOptimistic",
    tier: 4,
    focus:
      "Optimistic state existing only while an action/transition is pending then reverting to the base state, needing to call the setter inside an action or startTransition, the reducer form for list appends, error rollback, and keeping the base state in sync with the server response.",
  },
  {
    id: "react.use-sync-external-store",
    track: "react",
    name: "useSyncExternalStore & tearing",
    tier: 4,
    focus:
      "Tearing in concurrent rendering when reading mutable external stores, getSnapshot needing to return a cached immutable value (a new object each call causes an infinite loop), stable subscribe functions, getServerSnapshot for SSR, and selector patterns used by Zustand/Redux.",
  },
  {
    id: "react.layout-effects",
    track: "react",
    name: "useLayoutEffect & effect timing",
    tier: 4,
    focus:
      "useLayoutEffect running synchronously after DOM mutation before paint (measure/position without flicker) at the cost of blocking paint, its SSR behaviour, useInsertionEffect for CSS-in-JS, and the order of parent/child effects and cleanups.",
  },
  {
    id: "react.performance-patterns",
    track: "react",
    name: "Render performance patterns",
    tier: 4,
    focus:
      "Moving state down and lifting content up (children as props) to avoid re-renders, using the Profiler to find commit costs, virtualisation for long lists, avoiding expensive work in render, context splitting, and when not to optimise.",
  },
  // Tier 5
  {
    id: "react.compiler",
    track: "react",
    name: "React Compiler",
    tier: 5,
    focus:
      "Automatic memoisation of components and hooks, reliance on Rules of React (bailing out on mutating props/state, reading refs in render), the 'use no memo' directive, interplay with existing useMemo/useCallback, eslint plugin diagnostics, and the misconception that it removes all re-renders.",
  },
  {
    id: "react.concurrent-internals",
    track: "react",
    name: "Fiber, lanes & concurrent rendering",
    tier: 5,
    focus:
      "Render phase (interruptible, can be thrown away) vs commit phase, why render side effects are unsafe, lanes/priorities, time slicing, StrictMode double rendering, and bailout nuance (a same-value setState may still render the component once).",
  },
  {
    id: "react.server-components-model",
    track: "react",
    name: "Server Components model",
    tier: 5,
    focus:
      "Server components being async and never re-rendering on the client, having no state/effects, 'use client' marking a module boundary, serializable props across the boundary, passing server components as children to client components, and 'use server' functions as references.",
  },
  {
    id: "react.hydration-ssr",
    track: "react",
    name: "SSR, hydration & useId",
    tier: 5,
    focus:
      "hydrateRoot, mismatch causes (Date/locale/Math.random/typeof window branches, invalid HTML nesting, browser extensions), suppressHydrationWarning working only one level deep, useId for stable IDs across server/client, streaming SSR with selective hydration, and a two-pass render pattern for client-only content.",
  },
  {
    id: "react.new-apis-19",
    track: "react",
    name: "React 19.x new APIs",
    tier: 5,
    focus:
      "<Activity mode='hidden'> preserving state while unmounting effects, document metadata (<title>, <meta>, <link>) rendered in components and hoisted, stylesheet precedence, resource preloading (preload, preinit), useEffectEvent, and removed legacy APIs (propTypes, string refs, defaultProps on function components).",
  },

  // ────────────────────────────── NEXT.JS ──────────────────────────────
  // Tier 1
  {
    id: "next.file-conventions",
    track: "nextjs",
    name: "App Router file conventions",
    tier: 1,
    focus:
      "page/layout/loading/error/not-found/template/default/route files, dynamic [slug], catch-all [...slug] vs optional [[...slug]], route groups (group) not affecting URLs, _private folders, colocation of non-route files, and route.ts conflicting with page.tsx in the same segment.",
  },
  {
    id: "next.server-vs-client",
    track: "nextjs",
    name: "Server vs Client Components",
    tier: 1,
    focus:
      "Components being Server Components by default, what needs a Client Component (state, effects, event handlers, browser APIs), Client Components still being pre-rendered to HTML on the server (not browser-only), and server components not shipping JS to the client.",
  },
  {
    id: "next.use-client-boundary",
    track: "nextjs",
    name: "'use client' boundary propagation",
    tier: 1,
    focus:
      "'use client' marking an entry point so every module it imports becomes client code, not needing the directive in every file, importing a server component into a client module turning it into a client component, passing server components as children/props instead, the server-only package, and third-party components needing a client wrapper.",
  },
  {
    id: "next.navigation-link",
    track: "nextjs",
    name: "Link, router & navigation",
    tier: 1,
    focus:
      "<Link> prefetching behaviour (full for static routes, partial up to loading.js for dynamic), useRouter from next/navigation not next/router, push vs replace vs refresh, soft navigation preserving shared layout state, redirect() throwing (don't catch it), and usePathname/useSearchParams being client hooks (useSearchParams needing Suspense for static routes).",
  },
  {
    id: "next.layouts-templates",
    track: "nextjs",
    name: "Layouts vs templates",
    tier: 1,
    focus:
      "Layouts persisting and not re-rendering on navigation between child routes, layouts not receiving searchParams or the current pathname, templates remounting per navigation, the root layout requiring <html> and <body>, and multiple root layouts via route groups causing full page loads.",
  },
  {
    id: "next.env-vars",
    track: "nextjs",
    name: "Environment variables",
    tier: 1,
    focus:
      "NEXT_PUBLIC_ variables inlined at build time (runtime changes ignored; dynamic process.env[key] access not inlined), non-public vars undefined in client bundles, .env/.env.local/.env.production load order, and needing runtime config for single-image Docker builds deployed to many environments.",
  },
  // Tier 2
  {
    id: "next.server-data-fetching",
    track: "nextjs",
    name: "Data fetching in Server Components",
    tier: 2,
    focus:
      "Async server components fetching directly (DB/ORM or fetch, no API route needed), sequential awaits creating waterfalls vs Promise.all/preloading, fetch request memoisation within one render pass (same URL and options), React cache() for non-fetch data, and not calling your own route handlers from server components.",
  },
  {
    id: "next.params-promise",
    track: "nextjs",
    name: "params & searchParams as Promises",
    tier: 2,
    focus:
      "Next 15+ params and searchParams props being Promises (await in server components, use() in client components), sync access being removed, typing with PageProps helpers, generateStaticParams for pre-rendering and dynamicParams, and reading searchParams opting the page into dynamic rendering.",
  },
  {
    id: "next.server-actions-basics",
    track: "nextjs",
    name: "Server Actions basics",
    tier: 2,
    focus:
      "'use server' at the top of a module vs inline in a server component, form action progressive enhancement, FormData values, actions invoked as POST requests, return values needing to be serializable, calling actions from event handlers/startTransition, and useActionState integration.",
  },
  {
    id: "next.loading-error-boundaries",
    track: "nextjs",
    name: "loading, error & not-found",
    tier: 2,
    focus:
      "loading.js wrapping the page (not the same-segment layout) in Suspense, error.js needing to be a client component and not catching errors thrown by the layout in the same segment (global-error.js for the root layout), reset() re-rendering, notFound() and not-found.js, and production errors showing only a digest.",
  },
  {
    id: "next.route-handlers",
    track: "nextjs",
    name: "Route handlers",
    tier: 2,
    focus:
      "route.ts exporting HTTP method functions, GET handlers not cached by default since Next 15, NextRequest/NextResponse vs Web Response, params as a Promise in the second argument, CORS/OPTIONS handling, streaming responses, and when to prefer Server Actions or direct server-component data access instead.",
  },
  {
    id: "next.metadata-api",
    track: "nextjs",
    name: "Metadata API",
    tier: 2,
    focus:
      "Static metadata object vs generateMetadata, shallow merging across segments (a nested openGraph object replacing the parent's entirely), title.template and title.absolute, metadataBase for relative URLs, file-based icon/opengraph-image, fetch deduplication with the page, and metadata not being exportable from client components.",
  },
  {
    id: "next.image-font",
    track: "nextjs",
    name: "next/image & next/font",
    tier: 2,
    focus:
      "next/image requiring width/height or fill with a positioned parent, the sizes prop controlling srcset choice (missing sizes downloading oversized images), eager/priority loading for the LCP image, remotePatterns configuration, and next/font self-hosting fonts at build time to avoid layout shift and external requests.",
  },
  // Tier 3
  {
    id: "next.static-vs-dynamic",
    track: "nextjs",
    name: "Static vs dynamic rendering triggers",
    tier: 3,
    focus:
      "What opts a route into dynamic rendering (cookies(), headers(), searchParams, connection(), draftMode, uncached fetch), 'use client' not making a route dynamic, reading build output, export const dynamic ('force-static' making cookies() empty, 'force-dynamic'), and generateStaticParams with dynamicParams.",
  },
  {
    id: "next.fetch-caching",
    track: "nextjs",
    name: "fetch caching defaults",
    tier: 3,
    focus:
      "Next 15+ fetch not cached by default (opt in with cache: 'force-cache' or next: { revalidate }), next.tags, fetch memoisation vs the Data Cache, non-fetch data (ORM) not being cached without cache/'use cache', and Client Router Cache staleTimes (dynamic pages default 0s in 15).",
  },
  {
    id: "next.revalidation",
    track: "nextjs",
    name: "revalidatePath, revalidateTag & ISR",
    tier: 3,
    focus:
      "Time-based ISR being stale-while-revalidate (first request after expiry still gets stale content), on-demand revalidatePath (path vs 'layout' type) vs revalidateTag, Next 16 revalidateTag requiring a cacheLife profile and updateTag for read-your-writes inside Server Actions, refresh(), and revalidating from route handlers/webhooks.",
  },
  {
    id: "next.server-actions-security",
    track: "nextjs",
    name: "Server Action security",
    tier: 3,
    focus:
      "Every exported action being a public POST endpoint (must authenticate and authorise inside the action, not rely on the page being protected), validating inputs (zod) since args are client-controlled, closure variables being encrypted but still client-round-tripped, returning minimal data, Origin/Host checks and allowedOrigins, and bodySizeLimit.",
  },
  {
    id: "next.serialization-boundary",
    track: "nextjs",
    name: "Server→client serialization",
    tier: 3,
    focus:
      "What can be passed as props to Client Components (plain objects, Date, Map/Set, BigInt, promises, Server Actions) vs what can't (functions, class instances, symbols), passing promises and unwrapping with use(), RSC payload bloat from large props, and accidentally leaking secrets or whole DB rows to the client.",
  },
  {
    id: "next.streaming-suspense",
    track: "nextjs",
    name: "Streaming & Suspense",
    tier: 3,
    focus:
      "loading.js vs granular <Suspense> boundaries, the shell being blocked by awaits above boundaries, HTTP status (200) being committed once streaming starts so notFound()/redirect() inside a streamed boundary are handled client-side, SEO implications, and parallel data fetching per boundary.",
  },
  {
    id: "next.hydration-mismatch",
    track: "nextjs",
    name: "Hydration mismatches",
    tier: 3,
    focus:
      "Causes (Date.now/locale/timezone formatting, Math.random, typeof window branches in render, invalid nesting like <div> in <p>, browser extensions), fixes (useEffect, suppressHydrationWarning, dynamic import with ssr: false only inside Client Components), and reading the React 19 diff error output.",
  },
  // Tier 4
  {
    id: "next.use-cache",
    track: "nextjs",
    name: "'use cache', cacheLife & cacheTag",
    tier: 4,
    focus:
      "'use cache' at file/component/function level (with cacheComponents enabled), cache keys derived from serialisable arguments and closed-over values, not being able to call cookies()/headers() inside (read outside and pass as args), cacheLife profiles, cacheTag + revalidateTag/updateTag, and non-serialisable children passed through without affecting the key.",
  },
  {
    id: "next.cache-components-ppr",
    track: "nextjs",
    name: "Cache Components & PPR",
    tier: 4,
    focus:
      "Partial prerendering: static shell plus dynamic holes behind Suspense, the build error for uncached/dynamic data accessed outside a Suspense boundary, connection() and dynamic APIs marking holes, Date.now/Math.random requiring a cache or dynamic marker, and legacy segment configs (dynamic, revalidate, fetchCache) being incompatible with cacheComponents.",
  },
  {
    id: "next.proxy-middleware",
    track: "nextjs",
    name: "proxy.ts (formerly middleware)",
    tier: 4,
    focus:
      "Next 16 renaming middleware.ts to proxy.ts (export function proxy, Node.js runtime), matcher config and excluding static assets, rewrite vs redirect vs NextResponse.next with modified request headers, keeping it to optimistic checks (no heavy DB work), and never relying on it as the only auth layer (e.g. the x-middleware-subrequest bypass CVE).",
  },
  {
    id: "next.parallel-intercepting",
    track: "nextjs",
    name: "Parallel & intercepting routes",
    tier: 4,
    focus:
      "@slot folders passed as layout props without affecting the URL, default.js being required for unmatched slots on hard navigation (404 otherwise), slot state persisting on soft navigation, intercepting conventions (.), (..), (...) based on route segments not the filesystem, and the modal pattern where a refresh renders the full page.",
  },
  {
    id: "next.auth-patterns",
    track: "nextjs",
    name: "Authentication & authorization patterns",
    tier: 4,
    focus:
      "Checking auth in a data access layer close to the data rather than only in layouts (layouts don't re-render on navigation and don't protect sibling route handlers/actions), cookies() being read-only in Server Components (set only in actions/route handlers), session cookies vs JWTs, and server-only DTOs.",
  },
  {
    id: "next.runtimes-segment-config",
    track: "nextjs",
    name: "Runtimes & route segment config",
    tier: 4,
    focus:
      "Edge vs Node.js runtimes (no fs/native modules, limited APIs on edge), export const runtime/maxDuration/preferredRegion/dynamic/revalidate, how segment configs combine across layouts and pages, and serverless cold starts/connection pooling for databases.",
  },
  // Tier 5
  {
    id: "next.caching-layers",
    track: "nextjs",
    name: "Caching layers interplay",
    tier: 5,
    focus:
      "Request memoisation vs Data Cache vs Full Route Cache vs Client Router Cache, which invalidation API clears which layer, router.refresh() not purging the Data Cache, Server Action revalidation also refreshing the client router cache, and back/forward navigation cache behaviour.",
  },
  {
    id: "next.rsc-payload-bundling",
    track: "nextjs",
    name: "RSC payload & bundling",
    tier: 5,
    focus:
      "The RSC (Flight) payload and how soft navigations fetch it, client reference manifests, server/client bundle splitting, barrel-file imports bloating bundles (optimizePackageImports), analysing bundle size, and 'server-only'/'client-only' import guards.",
  },
  {
    id: "next.self-hosting-deploy",
    track: "nextjs",
    name: "Self-hosting & deployment",
    tier: 5,
    focus:
      "output: 'standalone' Docker builds, ISR/cache across multiple instances needing a shared cacheHandler, consistent Server Action encryption keys and build IDs across instances, version skew during rolling deploys, image optimisation requirements, and Turbopack as the default bundler in Next 16.",
  },
  {
    id: "next.after-instrumentation",
    track: "nextjs",
    name: "after(), instrumentation & errors",
    tier: 5,
    focus:
      "after() for post-response work (logging/analytics) and its limits, instrumentation.ts register() and onRequestError for error reporting, OpenTelemetry setup, and unstable_rethrow so framework errors (redirect/notFound) aren't swallowed by try/catch.",
  },
  {
    id: "next.upgrade-15-16",
    track: "nextjs",
    name: "Next 15/16 breaking changes",
    tier: 5,
    focus:
      "Async request APIs (params, searchParams, cookies, headers), fetch/GET route handlers no longer cached by default, middleware → proxy rename, Turbopack default, next lint removal, revalidateTag signature change, and React 19 as a requirement; spotting code that silently changes behaviour after upgrading.",
  },
];

export const CONCEPTS_BY_ID: Record<string, Concept> = Object.fromEntries(CURRICULUM.map((c) => [c.id, c]));
