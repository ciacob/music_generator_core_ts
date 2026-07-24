import { Fraction } from '../../../math/Fraction.js';
import type { IFraction } from '../../../math/IFraction.js';
import type { IMusicPitch } from '../../../core/interfaces/IMusicPitch.js';
import type { IMusicUnit } from '../../../core/interfaces/IMusicUnit.js';

/** The result of `analyzeMelodicProfile`. */
export interface MelodicProfileAnalysis {
  /** Average note duration for the entire fragment. */
  averageDuration: IFraction;
  /** `1`, `-1` or `0`, if the fragment melodically ascends, descends or has no clear direction. */
  direction: 1 | -1 | 0;
  /** First (top-voice) pitch of the fragment. `0` if the fragment has no pitched content. */
  markerPitch: number;
  /**
   * The number of semitones that separates `markerPitch` from the calculated average (aka
   * "pivot") of the fragment's range. The average can be weighted or not, based on
   * `weighInDuration`. `NaN` if the fragment has no pitched content (see file header).
   */
  pivotPitchInterval: number;
  /** The MIDI number obtained by adding `markerPitch` to `pivotPitchInterval`. */
  pivotPitch: number;
  /** The MIDI number obtained by subtracting `pivotPitchInterval` from `markerPitch`. */
  mirroredPivotPitch: number;
  /** The highest of the MIDI pitches found in the top voice/layer of the fragment. */
  highestPitchInFragment: number;
  /** The lowest of the MIDI pitches found in the top voice/layer of the fragment. */
  lowestPitchInFragment: number;
  /**
   * The number of semitones representing the range of the top voice/layer of the fragment
   * (i.e. `lowestPitchInFragment` subtracted from `highestPitchInFragment`).
   */
  fragmentRange: number;
}

/**
 * A portmanteau of helpful operations for melodic (top-voice) analysis.
 *
 * Ported from
 * `as-sources/legacy-generators-harmony/ro/se/legacy/generators/harmony/analyzers/common/MelodicUtils.as`.
 * A static-only AS3 class, translated as a plain module of functions per
 * this project's established convention.
 *
 * **`pitchTable` becomes a `Map<number, IFraction>`** instead of the AS3
 * original's dynamic `Object` keyed by stringified MIDI numbers. Behaves
 * the same (accumulate total duration per distinct top pitch), but
 * without relying on AS3/JS's numeric-string-key auto-sort quirk, which
 * this algorithm's floating-point summation doesn't actually depend on
 * for correctness (it only ever sums into a single running total).
 *
 * **`analyzeMelodicProfile([])` produces `NaN` fields, ported as-is.**
 * With no pitched content in `musicalFragment`, `pivotPitchInterval`
 * (and everything derived from it: `pivotPitch`, `mirroredPivotPitch`)
 * becomes `NaN` — a plain `0/0` numeric division in the AS3 original,
 * identical in JavaScript. This is a real, pre-existing edge case in the
 * source (not introduced by this translation): the sole caller,
 * `MelodicProfile.analyze()`, has an ASDoc comment describing a bypass
 * for exactly this situation ("bypass analysis if there is no previous
 * content... or it only contains rests") that its own method body never
 * actually implements. That's a `MelodicProfile`-level decision (whether
 * and how to add the bypass its own docs promise), not something this
 * shared, general-purpose helper should silently paper over — ported
 * faithfully here, flagged again in `MelodicProfile.ts`.
 */

/**
 * Returns the top-most MIDI pitch of a given music unit, or `0` if the unit is empty.
 * @param unit A music unit to find the top-most pitch of.
 * @returns The top-most MIDI pitch.
 */
export function getTopPitchOf(unit: IMusicUnit): number {
  let topMidiNumber = 0;
  const pitches = unit.pitches;
  for (let j = 0; j < pitches.length; j++) {
    const midiNumber = (pitches[j] as IMusicPitch).midiNote;
    if (midiNumber > topMidiNumber) {
      topMidiNumber = midiNumber;
    }
  }
  return topMidiNumber;
}

/**
 * Computes and returns the average/"pivot" pitch of the given `musicalFragment`, along with
 * some other side info.
 *
 * @param musicalFragment An array of `IMusicUnit` items (contains both pitch and duration
 * information) to be melodically analyzed.
 * @param weighInDuration Whether to factor in the cumulated duration of each pitch. If `true`
 * (the default), the average note duration for the entire fragment span will be calculated,
 * and the duration of each unit will be divided by that in order to produce the weight to use.
 * @returns Details of the analysis. See `MelodicProfileAnalysis`.
 */
export function analyzeMelodicProfile(
  musicalFragment: readonly IMusicUnit[],
  weighInDuration = true,
): MelodicProfileAnalysis {
  // Obtain a "pitch table", where each pitch in use (or only the top-most, if requested) is
  // listed just once, along with its total duration.
  let highestPitchInFragment = 0;
  let lowestPitchInFragment = 127;
  const pitchTable = new Map<number, IFraction>();
  let markerPitch = 0;
  let durationsCount = 0;
  let durationsSum: IFraction = Fraction.ZERO;

  for (let i = 0; i < musicalFragment.length; i++) {
    const unit = musicalFragment[i] as IMusicUnit;
    const unitDuration = unit.duration;
    const pitches = unit.pitches;
    let unitHasPitches = false;
    let topUnitPitch = 0;
    for (let j = 0; j < pitches.length; j++) {
      const midiNumber = (pitches[j] as IMusicPitch).midiNote;
      // IMusicPitch instances having a `midiNote` of `0` are rests and must be ignored.
      if (midiNumber > 0) {
        unitHasPitches = true;
        if (midiNumber > topUnitPitch) {
          topUnitPitch = midiNumber;
        }
      }
    }
    if (unitHasPitches) {
      // We work towards computing `averageDuration` by counting every "non-rest" unit and adding its duration.
      durationsCount++;
      durationsSum = durationsSum.add(unitDuration);

      // We found the top-most pitch of the current unit: we update the pitchTable with it.
      const storedDuration = pitchTable.get(topUnitPitch);
      pitchTable.set(topUnitPitch, storedDuration ? storedDuration.add(unitDuration) : unitDuration);

      // Also, we need to get a hold on the first pitch of the first unit.
      if (!markerPitch) {
        markerPitch = topUnitPitch;
      }

      // Finally, we want to get a hold on the highest and lowest pitches for the entire fragment.
      if (topUnitPitch > highestPitchInFragment) {
        highestPitchInFragment = topUnitPitch;
      }
      if (topUnitPitch < lowestPitchInFragment) {
        lowestPitchInFragment = topUnitPitch;
      }
    }
  }

  // We actually compute the average duration.
  const averageDuration = durationsSum.divide(new Fraction(durationsCount));

  // We compute the pivot/center pitch by weighting-in the duration or not, as requested.
  let pitchIntervalsSum = 0;
  let denominator = 0;
  for (const [midiPitch, durationFraction] of pitchTable) {
    const pitchInterval = midiPitch - markerPitch;
    let operand: number;
    // If requested, we weight pitches by the ratio of their duration to the average duration.
    if (weighInDuration) {
      const weight = durationFraction.divide(averageDuration).floatValue;
      operand = pitchInterval * weight;
    } else {
      operand = pitchInterval;
    }
    pitchIntervalsSum += operand;
    denominator++;
  }
  const pivotPitchInterval = Math.round(pitchIntervalsSum / denominator);
  const pivotPitch = markerPitch + pivotPitchInterval;
  const mirroredPivotPitch = markerPitch - pivotPitchInterval;

  // We compute the fragment's ambitus/range and return as side info.
  const fragmentRange =
    highestPitchInFragment && lowestPitchInFragment ? highestPitchInFragment - lowestPitchInFragment : 0;

  return {
    averageDuration,
    direction: pivotPitchInterval > 0 ? 1 : pivotPitchInterval < 0 ? -1 : 0,
    markerPitch,
    mirroredPivotPitch,
    pivotPitch,
    pivotPitchInterval,
    highestPitchInFragment,
    lowestPitchInFragment,
    fragmentRange,
  };
}
