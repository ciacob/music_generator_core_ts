/**
 * Pure arithmetic and parsing functions underlying `Fraction`/`IFraction`.
 *
 * Everything in this module is a pure function operating on plain data
 * shapes (`FractionLike`, `NormalizedFraction`) — no classes, no shared
 * mutable state, no I/O. This is deliberate: `Fraction` (in `Fraction.ts`)
 * is a thin, stateful wrapper around these functions, so nearly all of the
 * engine's rational-number logic is unit-testable in isolation, without
 * ever constructing a `Fraction` instance.
 *
 * Ported from `as-sources/fraction-library/ro/se/math/Fraction.as`. See
 * that file's static utilities (`lcm`, `gcf`, `fromString`, `fromDecimal`)
 * and instance arithmetic/comparison methods for the original AS3 logic
 * this module mirrors.
 */

/**
 * The minimal shape a value needs to participate in fraction arithmetic:
 * a numerator and a denominator. `NormalizedFraction` satisfies this, but
 * so does any plain `{ numerator, denominator }` literal.
 */
export interface FractionLike {
  numerator: number;
  denominator: number;
}

/**
 * A fully-normalized fraction value: the reduced (GCF-divided)
 * numerator/denominator pair, alongside the pre-reduction ("raw")
 * numerator/denominator that produced it. Mirrors the AS3 `Fraction`
 * class's private state immediately after `_normalize()` runs.
 *
 * Keeping the raw pair around matters for fidelity: `add`/`subtract`/
 * `multiply` in the original engine combine operands using their *raw*
 * numerator/denominator (not the already-reduced one), then normalize the
 * combined result exactly once. Reusing the reduced values instead would
 * still be mathematically correct, but would silently change which
 * intermediate values participate in the LCM/product before reduction —
 * this module preserves the original order of operations.
 */
export interface NormalizedFraction {
  numerator: number;
  denominator: number;
  rawNumerator: number;
  rawDenominator: number;
}

/**
 * Computes the Greatest Common Factor (GCF) of two numbers using the
 * Euclidean algorithm. Both inputs are treated by absolute value; the
 * result is always >= 0.
 *
 * N.B.: as in the original AS3 engine, callers are expected to keep
 * numerator/denominator magnitudes well below 2^53 to preserve exact
 * integer behavior (this module does not itself enforce that bound).
 */
export function gcf(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

/**
 * Computes the Lowest Common Multiple (LCM) of two numbers, via
 * `(a / gcf(a, b)) * b`.
 */
export function lcm(a: number, b: number): number {
  return (a / gcf(a, b)) * b;
}

/**
 * Normalizes a raw numerator/denominator pair into standard form:
 * - a zero numerator or denominator collapses the whole value to `0/1`;
 * - a negative denominator has its sign moved onto the numerator instead
 *   (so the denominator of a normalized fraction is never negative);
 * - the (sign-adjusted) input pair is preserved as `rawNumerator`/
 *   `rawDenominator`;
 * - the GCF is factored out of the sign-adjusted pair to produce the
 *   reduced `numerator`/`denominator`.
 */
export function normalize(numerator: number, denominator: number): NormalizedFraction {
  let n = numerator;
  let d = denominator;

  if (d === 0 || n === 0) {
    n = 0;
    d = 1;
  }

  if (d < 0) {
    n *= -1;
    d *= -1;
  }

  const rawNumerator = n;
  const rawDenominator = d;

  const factor = gcf(n, d);
  return {
    numerator: n / factor,
    denominator: d / factor,
    rawNumerator,
    rawDenominator,
  };
}

/**
 * Adds two normalized fractions, combining their *raw* (pre-reduction)
 * numerator/denominator pairs over their lowest common denominator, then
 * normalizing the sum exactly once.
 */
export function addRaw(a: NormalizedFraction, b: NormalizedFraction): NormalizedFraction {
  const lcd = lcm(a.rawDenominator, b.rawDenominator);
  const quot1 = lcd / a.rawDenominator;
  const quot2 = lcd / b.rawDenominator;
  return normalize(a.rawNumerator * quot1 + b.rawNumerator * quot2, lcd);
}

/**
 * Subtracts `b` from `a`, combining their *raw* numerator/denominator
 * pairs over their lowest common denominator, then normalizing the
 * difference exactly once.
 */
export function subtractRaw(a: NormalizedFraction, b: NormalizedFraction): NormalizedFraction {
  const lcd = lcm(a.rawDenominator, b.rawDenominator);
  const quot1 = lcd / a.rawDenominator;
  const quot2 = lcd / b.rawDenominator;
  return normalize(a.rawNumerator * quot1 - b.rawNumerator * quot2, lcd);
}

/**
 * Multiplies two normalized fractions using their *raw* numerator/
 * denominator pairs, then normalizes the product exactly once.
 */
export function multiplyRaw(a: NormalizedFraction, b: NormalizedFraction): NormalizedFraction {
  return normalize(a.rawNumerator * b.rawNumerator, a.rawDenominator * b.rawDenominator);
}

/**
 * Returns the reciprocal (numerator/denominator swapped) of a normalized
 * fraction. Uses the already-*reduced* numerator/denominator (matching
 * the original AS3 `get reciprocal()`, which swaps the public
 * `numerator`/`denominator` getters rather than the raw pair).
 */
export function reciprocalOf(a: NormalizedFraction): NormalizedFraction {
  return normalize(a.denominator, a.numerator);
}

/**
 * Divides `a` by `b` — a convenience equal to `multiplyRaw(a, reciprocalOf(b))`.
 */
export function divideRaw(a: NormalizedFraction, b: NormalizedFraction): NormalizedFraction {
  return multiplyRaw(a, reciprocalOf(b));
}

/**
 * Cross-multiplication comparison of two fractions' *reduced*
 * numerator/denominator pairs.
 *
 * @returns `1` if `a` is greater than `b`, `-1` if `a` is less than `b`,
 * `0` if they are equal.
 */
export function compare(a: FractionLike, b: FractionLike): -1 | 0 | 1 {
  const left = b.denominator * a.numerator;
  const right = a.denominator * b.numerator;
  if (left > right) {
    return 1;
  }
  if (left < right) {
    return -1;
  }
  return 0;
}

/** Whether `a` and `b` represent the same rational value. */
export function equalsValue(a: FractionLike, b: FractionLike): boolean {
  return compare(a, b) === 0;
}

/** Whether `a` is strictly greater than `b`. */
export function greaterThanValue(a: FractionLike, b: FractionLike): boolean {
  return compare(a, b) === 1;
}

/** Whether `a` is strictly less than `b`. */
export function lessThanValue(a: FractionLike, b: FractionLike): boolean {
  return compare(a, b) === -1;
}

/**
 * Formats a fraction's *reduced* numerator/denominator as `"n/d"`. The
 * output is accepted by `fromString()`.
 */
export function toStringValue(v: FractionLike): string {
  return `${v.numerator}/${v.denominator}`;
}

/**
 * Parses a string of the form `"n/d"` (e.g. `"1/4"`) into a normalized
 * fraction. Only non-negative integer numerators/denominators are
 * accepted; whole-number-prefixed forms (`"1 1/4"`) and negative values
 * are NOT supported, matching the original AS3 `Fraction.fromString()`.
 *
 * @throws {Error} If `value` cannot be parsed per the above rules.
 */
export function fromString(value: string): NormalizedFraction {
  const segments = value.split('/');
  if (segments.length === 2) {
    const numerator = Number.parseInt(segments[0], 10);
    const denominator = Number.parseInt(segments[1], 10);
    const numeratorIsValidUint = Number.isInteger(numerator) && numerator >= 0;
    const denominatorIsValidUint = Number.isInteger(denominator) && denominator >= 0;
    if (numeratorIsValidUint && denominatorIsValidUint) {
      return normalize(numerator, denominator);
    }
  }
  throw new Error(
    `fromString() failed to import a fraction value from \`${value}\`. The only accepted format is (regexp): \`\\d+\\/\\d+\`, e.g.: \`1/4\`.`,
  );
}

/**
 * Approximates a fraction from a decimal number, e.g. `0.5` -> `1/2`.
 *
 * Ported verbatim from the original AS3 algorithm: it derives a
 * denominator from the decimal's string length, then reduces the
 * resulting numerator/denominator pair via a tolerance-based GCD. This is
 * an approximation, not an exact conversion — it is only as faithful as
 * `decimal.toString()`'s formatting of the input.
 */
export function fromDecimal(decimal: number): NormalizedFraction {
  const approximateGcd = (a: number, b: number): number => {
    if (b < 0.0000001) {
      return a;
    }
    return approximateGcd(b, Math.floor(a % b));
  };

  const len = Math.max(1, decimal.toString().length - 2);
  const denominator = Math.pow(10, len);
  const numerator = decimal * denominator;
  const divisor = approximateGcd(numerator, denominator);

  return normalize(numerator / divisor, denominator / divisor);
}
