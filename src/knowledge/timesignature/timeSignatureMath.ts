import { Fraction } from '../../math/Fraction.js';
import type { IFraction } from '../../math/IFraction.js';
import { isPowerOfTwo } from '../../utils/NumberUtil.js';
import { MetricAccent } from './MetricAccent.js';
import type { IMetricAccent } from './IMetricAccent.js';

/**
 * Pure functions underlying `TimeSignatureDefinition`: validation, beat/
 * junction (beam-break) inference, and metric-accent inference. As in
 * `math/fractionMath.ts` and `stochastic/random/weightedRandomMath.ts`,
 * pulling these out lets the actual inference algorithm be exercised and
 * tested directly, without constructing a `TimeSignatureDefinition`.
 *
 * Ported from the private methods of
 * `as-sources/legacy-generators-core-library/eu/stochastic/engine/music/knowledge/timesignature/TimeSignatureDefinition.as`.
 * Two of those methods (`_getHalfJunction`/`_getThirdsJunction`) read the
 * original class's `_shownDenominator` field via closure; here it's an
 * explicit parameter instead, so every function in this module is fully
 * self-contained (no implicit `this`/closure state).
 */

/** @see TimeSignatureDefinition.MAX_ACCENT_STRENGTH */
export const MAX_ACCENT_STRENGTH = 2;
/** @see TimeSignatureDefinition.MIN_ACCENT_STRENGTH */
export const MIN_ACCENT_STRENGTH = 1.2;
/** @see TimeSignatureDefinition.ACCENT_DECAY */
export const ACCENT_DECAY = 0.75;

/** @throws {Error} If `value` is `0`. */
export function assertProperNumerator(value: number): void {
  if (value === 0) {
    throw new Error('Argument "shownNumerator" cannot be 0.');
  }
}

/** @throws {Error} If `value` is `0` or not a power of `2`. */
export function assertProperDenominator(value: number): void {
  if (value === 0) {
    throw new Error('Argument "shownDenominator" cannot be 0.');
  }
  if (!isPowerOfTwo(value)) {
    throw new Error('Argument "shownDenominator" must be a power of `2` (1, 2, 4, 8, 16, 32, etc.)');
  }
}

/**
 * Beat-level grouping rule: one junction fraction per beat boundary
 * (every multiple of the "1 beat" fraction, up to but excluding the full
 * measure). Used as the fallback when neither a clean half-measure nor
 * thirds-of-a-measure junction applies.
 */
export function getBeatJunction(shownNumerator: number, shownDenominator: number): IFraction[] {
  const beatFraction = new Fraction(1, shownDenominator);
  const ret: IFraction[] = [];
  for (let i = 1; i < shownNumerator; i++) {
    ret.push(beatFraction.multiply(new Fraction(i)));
  }
  return ret;
}

/**
 * Measure-level grouping rule: a single junction at the halfway point,
 * provided that point can be expressed without needing finer resolution
 * than `shownDenominator` already provides (i.e. its denominator, once
 * reduced, doesn't exceed `shownDenominator`).
 *
 * @returns A one-element junction array, or `null` if a clean half-measure
 * junction doesn't apply to this time signature.
 */
export function getHalfJunction(fraction: IFraction, shownDenominator: number): IFraction[] | null {
  const halfFraction = fraction.multiply(new Fraction(1, 2));
  if (halfFraction.denominator <= shownDenominator) {
    return [halfFraction];
  }
  return null;
}

/**
 * Measure-level grouping rule: two junctions splitting the measure into
 * thirds, under the same denominator-resolution condition as
 * `getHalfJunction`.
 *
 * @returns A two-element junction array, or `null` if a clean thirds-of-
 * a-measure junction doesn't apply to this time signature.
 */
export function getThirdsJunction(fraction: IFraction, shownDenominator: number): IFraction[] | null {
  const firstThird = fraction.multiply(new Fraction(1, 3));
  if (firstThird.denominator <= shownDenominator) {
    const secondThird = fraction.multiply(new Fraction(2, 3));
    return [firstThird, secondThird];
  }
  return null;
}

/**
 * Infers beam-break junctions for a time signature by trying, in order: a
 * half-measure split, a thirds-of-a-measure split, and finally per-beat
 * junctions (which always apply). The first candidate that applies wins.
 */
export function inferJunctions(
  fraction: IFraction,
  shownNumerator: number,
  shownDenominator: number,
): IFraction[] {
  return (
    getHalfJunction(fraction, shownDenominator) ??
    getThirdsJunction(fraction, shownDenominator) ??
    getBeatJunction(shownNumerator, shownDenominator)
  );
}

/**
 * Derives metric accents from a time signature's beat-grouping
 * (`junctions`): the first beat of the measure is always maximally
 * stressed, and each subsequent junction gets a progressively decaying
 * accent (`ACCENT_DECAY` compounding per junction).
 */
export function inferMetricAccents(
  shownDenominator: number,
  junctions: readonly IFraction[],
): IMetricAccent[] {
  const ret: IMetricAccent[] = [];

  // The first beat of the measure is always stressed.
  const beatFraction = new Fraction(1, shownDenominator);
  ret.push(new MetricAccent(MAX_ACCENT_STRENGTH, beatFraction));

  // Determine the remaining accents based on the grouping (junction) rules.
  let accentOffset = MAX_ACCENT_STRENGTH - MIN_ACCENT_STRENGTH;
  for (const fraction of junctions) {
    accentOffset *= ACCENT_DECAY;
    ret.push(new MetricAccent(MIN_ACCENT_STRENGTH + accentOffset, fraction.add(beatFraction)));
  }

  return ret;
}
