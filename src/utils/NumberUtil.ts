/**
 * Ported from `as-sources/utils-library/ro/se/utils/NumberUtil.as`.
 *
 * The original file has a couple dozen static helpers (factorial,
 * ordinalise, addCommas, distanceBetween, etc.); only `getRandomInteger`,
 * `getTriangularNumber`, and `isPowerOfTwo` are ever referenced elsewhere
 * in the copied 133-file engine snapshot (verified by grep across
 * `as-sources/`, not just the files translated so far). The rest is
 * intentionally not ported — it would be untested, unreferenced surface
 * area — but nothing here stops adding it later if a future translation
 * step turns out to need it.
 */

/**
 * Returns a random integer included in a given closed interval `[a, b]`
 * (order-independent), e.g. `getRandomInteger(3, 5)` returns `3`, `4`, or
 * `5`.
 *
 * @param limitA One of the two ends of the interval.
 * @param limitB The other end of the interval.
 * @param randomFunction A function producing a random floating point
 * value in `[0, 1)`. Optional, defaults to `Math.random`. Exposed (as it
 * already was in the original AS3 signature) so callers/tests can inject
 * a seeded PRNG for deterministic behavior.
 * @returns A random integer within the interval.
 */
export function getRandomInteger(
  limitA: number,
  limitB: number,
  randomFunction: () => number = Math.random,
): number {
  const poolLength = Math.abs(limitA - limitB) + 1;
  const lowest = Math.min(limitA, limitB);
  return Math.floor(randomFunction() * poolLength) + lowest;
}

/**
 * Computes the nth triangular number, via `n(n+1)/2`.
 */
export function getTriangularNumber(n: number): number {
  return (n * (n + 1)) / 2;
}

/**
 * Determines whether the given `value` is a power of `2`.
 *
 * N.B.: ported verbatim, including its floating-point-division approach
 * (`log(value)/log(2)`), which can be imprecise for very large values.
 * This is a faithful translation of the original AS3 behavior, not a
 * numerically hardened reimplementation.
 */
export function isPowerOfTwo(value: number): boolean {
  return (Math.log(value) / Math.log(2)) % 1 === 0;
}
