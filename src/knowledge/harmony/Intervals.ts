import { IntervalsSize } from '../../generators/constants/pitch/IntervalsSize.js';
import { IntervalRootPositions } from './IntervalRootPositions.js';

/**
 * Groups musical knowledge related to harmonic intervals.
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/eu/stochastic/engine/music/knowledge/harmony/Intervals.as`.
 * A static-only AS3 class, translated as a plain module of exported
 * functions per this project's established convention (see `utils/` in
 * step 2).
 *
 * **Breaking a circular dependency.** The AS3 original's
 * `orderByHindemith2ndSeries` takes two `IntervalRegistryEntry`
 * parameters (a class that lives in `core/helpers/`, not yet ported as of
 * this file) — but `IntervalRegistryEntry`'s own constructor calls
 * `getHindemithsIntervalRoot` below, making the two classes mutually
 * dependent in AS3's nominal (import-based) type system. Inspecting what
 * `orderByHindemith2ndSeries` actually reads off its parameters shows it
 * only ever touches `.size` and `.low` — never `.root` — so its real
 * dependency is on "anything with a `size` and a `low`," not on the
 * concrete class. `HindemithSortable` below captures exactly that shape;
 * any object satisfying it (including a future `IntervalRegistryEntry`)
 * works here without this file importing that class at all. This is a
 * genuine, zero-behavior-change decoupling — not a design compromise —
 * made possible by TypeScript's structural typing, which AS3 doesn't
 * have.
 */

/**
 * The minimal shape `orderByHindemith2ndSeries` needs: a harmonic
 * interval's size (in semitones) and its bass ("low") MIDI pitch.
 */
export interface HindemithSortable {
  /** The interval's size, in semitones. */
  readonly size: number;
  /** The interval's bass ("low") MIDI pitch. */
  readonly low: number;
}

/**
 * Internal reference of Hindemith's "2nd series", or harmonic intervals'
 * "significance" order.
 */
const hindemith2ndSeries: readonly number[] = [
  IntervalsSize.PERFECT_FIFTH,
  IntervalsSize.PERFECT_FOURTH,
  IntervalsSize.MAJOR_THIRD,
  IntervalsSize.MINOR_SIXTH,
  IntervalsSize.MINOR_THIRD,
  IntervalsSize.MAJOR_SIXTH,
  IntervalsSize.MAJOR_SECOND,
  IntervalsSize.MINOR_SEVENTH,
  IntervalsSize.MINOR_SECOND,
  IntervalsSize.MAJOR_SEVENTH,
  IntervalsSize.AUGMENTED_FOURTH,
];

/**
 * Returns a fresh copy (matching the AS3 original's `.concat()`) of an
 * ordered array reflecting Hindemith's view on harmonic intervals'
 * "significance". The intervals are represented by their number of
 * semitones, e.g. `5` is the "perfect fourth".
 */
export function getHindemiths2ndSeries(): number[] {
  return hindemith2ndSeries.slice();
}

/**
 * Returns Hindemith's "root" of a given harmonic interval, based on its
 * size in semitones. Returns one of the `IntervalRootPositions` values.
 */
export function getHindemithsIntervalRoot(intervalSize: number): number {
  const reduced = intervalSize % IntervalsSize.PERFECT_OCTAVE;
  switch (reduced) {
    case IntervalsSize.PERFECT_FIFTH:
      return IntervalRootPositions.BOTTOM;
    case IntervalsSize.PERFECT_FOURTH:
      return IntervalRootPositions.TOP;
    case IntervalsSize.MAJOR_THIRD:
      return IntervalRootPositions.BOTTOM;
    case IntervalsSize.MINOR_SIXTH:
      return IntervalRootPositions.TOP;
    case IntervalsSize.MINOR_THIRD:
      return IntervalRootPositions.BOTTOM;
    case IntervalsSize.MAJOR_SIXTH:
      return IntervalRootPositions.TOP;
    case IntervalsSize.MAJOR_SECOND:
      return IntervalRootPositions.TOP;
    case IntervalsSize.MINOR_SEVENTH:
      return IntervalRootPositions.BOTTOM;
    case IntervalsSize.MINOR_SECOND:
      return IntervalRootPositions.TOP;
    case IntervalsSize.MAJOR_SEVENTH:
      return IntervalRootPositions.BOTTOM;
    default:
      return IntervalRootPositions.UNKNOWN;
  }
}

/**
 * Convenience comparator for `Array.prototype.sort()`. Expects its
 * arguments to represent simple (i.e. not "compound") intervals.
 *
 * Intervals are first sorted by "significance" (perfect fifths first,
 * per `getHindemiths2ndSeries()`'s order), then by base pitch — should
 * two perfect fifths be found in the same chord, the lowest of them is
 * listed first.
 */
export function orderByHindemith2ndSeries(
  intervalA: HindemithSortable,
  intervalB: HindemithSortable,
): number {
  let significanceDelta = 0;
  if (intervalA.size !== intervalB.size) {
    significanceDelta =
      hindemith2ndSeries.indexOf(intervalA.size) - hindemith2ndSeries.indexOf(intervalB.size);
  }
  return significanceDelta || intervalA.low - intervalB.low;
}

/**
 * Returns the intrinsic consonance score for a given `simple` harmonic
 * interval (an interval smaller than an octave).
 *
 * @param interval A simple harmonic interval (i.e. containing 12 or
 * fewer semitones) to obtain a consonance score of.
 * @returns The associated score, or `0` if the interval is compound (has
 * more than 12 semitones), or is itself one of the perfect
 * unison/fourth/octave intervals (neither consonant nor dissonant "per
 * se").
 */
export function getConsonance(interval: number): number {
  switch (interval) {
    case 7:
      return 5; // 5p
    case 4:
      return 4; // 3M
    case 3:
      return 3; // 3m
    case 9:
      return 2; // 6M
    case 8:
      return 1; // 6m
    case 6:
      return -1; // 4+
    case 10:
      return -2; // 7m
    case 2:
      return -3; // 2M
    case 11:
      return -4; // 7M
    case 1:
      return -5; // 2m
    // `1p`, `4p`, and `8p` are neither consonant nor dissonant "per se"
    case 0:
    case 5:
    case 12:
      return 0;
    default:
      return 0;
  }
}

/**
 * Returns the decay, or attenuation factor, for compound intervals. This
 * attenuation is proportional to the number of octaves added to a simple
 * interval, and brings it closer to harmonic neutrality with each octave
 * added.
 *
 * @param octavesAdded The number of octaves added to a simple interval
 * to make it a compound interval.
 * @returns The attenuation factor to apply to the interval's intrinsic
 * consonance score.
 */
export function decayFactor(octavesAdded: number): number {
  switch (octavesAdded) {
    case 0:
      return 1;
    case 1:
      return 0.8;
    case 2:
      return 0.4;
    case 3:
      return 0.1;
    case 4:
      return 0;
    default:
      return 0;
  }
}
