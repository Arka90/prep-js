// Plain-JS source shared by the server test runner (worker_threads) and the
// browser test runner (Web Worker). Kept as a string so no bundler touches it.
// deepEqual is realm-safe (no instanceof) and treats JSON's missing `undefined`
// as `null`, so expected values written as JSON compare sensibly.
export const COMPARE_SOURCE = String.raw`
function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a === "number" && typeof b === "number") {
    if (Number.isNaN(a) && Number.isNaN(b)) return true;
    return Math.abs(a - b) < 1e-9;
  }
  if ((a === undefined || a === null) && (b === undefined || b === null)) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false;
    return true;
  }
  const ka = Object.keys(a).filter(function (k) { return a[k] !== undefined; });
  const kb = Object.keys(b).filter(function (k) { return b[k] !== undefined; });
  if (ka.length !== kb.length) return false;
  for (const k of ka) {
    if (!Object.prototype.hasOwnProperty.call(b, k) || !deepEqual(a[k], b[k])) return false;
  }
  return true;
}
`;
