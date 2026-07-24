import { AbstractContentAnalyzer } from '../../core/abstracts/AbstractContentAnalyzer.js';
import { getTriangularNumber } from '../../utils/NumberUtil.js';
import { ParameterCommons } from '../constants/ParameterCommons.js';
import { ParameterNames } from '../constants/ParameterNames.js';
import type { IAnalysisContext } from '../../core/interfaces/IAnalysisContext.js';
import type { IMusicPitch } from '../../core/interfaces/IMusicPitch.js';
import type { IMusicRequest } from '../../core/interfaces/IMusicRequest.js';
import type { IMusicUnit } from '../../core/interfaces/IMusicUnit.js';
import type { IMusicalContentAnalyzer } from '../../core/interfaces/IMusicalContentAnalyzer.js';
import type { IParametersList } from '../../core/interfaces/IParametersList.js';

/** The result of `inspectChord`. */
interface ChordInfo {
  /** The number of playing (non-rest) pitches in the chord. */
  numVoices: number;
  /** The smallest interval (in semitones) between two adjacent playing pitches, or `0` if fewer than 2 exist. */
  smallestIntervalSize: number;
  /** The playing (non-rest) MIDI pitches, top voice first. */
  playingVoices: number[];
  /** Intervals (in semitones) between each playing pitch and its nearest lower playing neighbour, top-down. */
  chordIntervals: number[];
}

/**
 * Reduces `intervals` (at least 3 elements) by repeatedly working from the array's end toward
 * its beginning, replacing the current element with the result of subtracting it from the
 * element right before it, until only two elements remain, then returns their sum. Returns `0`
 * if `intervals` has fewer than 3 elements.
 *
 * Ported from `HarmonicDistribution.as`'s private static `_computeRawScore`.
 *
 * **`currOperand = source.splice(i, 1)` made explicit.** The AS3 original assigns the *array*
 * `splice()` returns (its single removed element, still wrapped in a one-element `Array`)
 * directly to an `int`-typed variable — which only works because AS3's numeric coercion falls
 * through to `Array.toString()` for a one-element array, which is just that element's own
 * string form (same "looks wrong, works via string coercion" pattern already noted in
 * `RandomChord.ts`'s `pitch != 0`). TypeScript won't implicitly coerce an array to a number, so
 * this destructures the single element directly instead — same result, no reliance on stringification.
 */
function computeRawScore(intervals: readonly number[]): number {
  if (intervals.length < 3) {
    return 0;
  }
  const source = intervals.slice();
  while (source.length > 2) {
    for (let i = source.length - 1; i >= 0; i--) {
      const [currOperand] = source.splice(i, 1) as [number];
      if (source[i - 1] !== undefined) {
        const pairOperand = source[i - 1] as number;
        const replacementVal = currOperand > pairOperand ? i : currOperand === pairOperand ? 0 : -i;
        source.splice(i, 0, replacementVal);
      }
    }
  }
  return (source[0] as number) + (source[1] as number);
}

/**
 * Audits the distribution of pitches in a chord, i.e., whether they tend to distribute in a
 * pyramidal shape, or reversed pyramidal shape, or evenly.
 *
 * Ported from
 * `as-sources/legacy-generators-harmony/ro/se/legacy/generators/harmony/analyzers/HarmonicDistribution.as`.
 *
 * **`scores.sort()` given an explicit numeric comparator.** `computeGamut`'s
 * `[worstRawScore, idealRawScore].sort()` relies on AS3's default (lexicographic) `.sort()` --
 * the same category of bug already found and fixed in `RandomChord.ts`'s
 * `rawMidiValues.sort()`. Since `worstRawScore`/`idealRawScore` are signed integers that can be
 * negative and multi-digit, a lexicographic comparison can pick the wrong "smallest" value
 * (e.g. `"-5" > "-12"` as strings, even though `-5 > -12` is false numerically) -- which this
 * function then relies on to decide whether/how much to shift both scores into the positive
 * range. Fixed with a numeric `(a, b) => a - b` comparator.
 */
export class HarmonicDistribution extends AbstractContentAnalyzer implements IMusicalContentAnalyzer {
  /** @see IMusicalContentAnalyzer.name */
  override get name(): string {
    return ParameterNames.HARMONIC_DISTRIBUTION;
  }

  /** @see IMusicalContentAnalyzer.weight */
  override get weight(): number {
    return 0.65;
  }

  /** @see IMusicalContentAnalyzer.analyze */
  override analyze(
    targetMusicUnit: IMusicUnit,
    _analysisContext: IAnalysisContext,
    _parameters: IParametersList,
    _request: IMusicRequest,
  ): void {
    // Get chord information.
    const chordInfo = this.inspectChord(targetMusicUnit.pitches);

    // At least three pitches are needed to compute harmonic distribution.
    if (chordInfo.numVoices < 3) {
      targetMusicUnit.analysisScores.add(ParameterNames.HARMONIC_DISTRIBUTION, ParameterCommons.NA_RESERVED_VALUE);
      return;
    }

    // Infers the maximum and minimum scores the current chord could achieve in best/worst case scenarios
    // then consolidates them into a positive integer, the "score gamut". This value heavily depends on
    // the smallest interval the chord has.
    const gamut = this.computeGamut(chordInfo);

    // Computes a raw score (such as `4`) by iteratively subtracting adjacent deltas, working from the
    // bass upward, and adding the values of the last surviving deltas pair.
    const rawScore = computeRawScore(chordInfo.chordIntervals);

    // Expresses the score as a percent, in relation to already computed gamut.
    let score = this.transposeScore(rawScore, gamut);
    score = Math.round(score * 100);

    // Save the score, as a 1-100 integer.
    targetMusicUnit.analysisScores.add(ParameterNames.HARMONIC_DISTRIBUTION, Math.max(ParameterCommons.MIN_LEGAL_SCORE, score));
  }

  /**
   * Obtains information about the chord depicted by the provided pitches:
   * - the PLAYING pitches;
   * - the number of playing pitches/voices;
   * - the intervals between adjacent playing pitches (in semitones);
   * - the size of the smallest interval available inside the chord.
   */
  private inspectChord(chord: readonly IMusicPitch[]): ChordInfo {
    const info: ChordInfo = {
      numVoices: 0,
      smallestIntervalSize: Number.MAX_SAFE_INTEGER,
      playingVoices: [],
      chordIntervals: [],
    };
    const reversed = chord.slice().reverse();
    reversed.forEach((pitch, i, v) => {
      // We only count those pitches having MIDI values greater than 0; by convention, MIDI `0`
      // stands for a musical rest (that particular voice does not play in this chord). We are only
      // interested in voices that play.
      const currMidiNote = pitch.midiNote;
      if (currMidiNote !== 0) {
        info.playingVoices.push(currMidiNote);
        info.numVoices++;

        // By the same logic, the "next pitch" is actually the pitch of the closest playing voice.
        let nextPitch: IMusicPitch | null = null;
        let testPitchOffset = 0;
        while (!nextPitch && testPitchOffset < v.length) {
          testPitchOffset++;
          const testIndex = i + testPitchOffset;
          if (testIndex < v.length) {
            nextPitch = v[testIndex] as IMusicPitch;
          }
          if (nextPitch && nextPitch.midiNote === 0) {
            nextPitch = null;
          }
        }
        if (nextPitch) {
          const intervalSize = Math.abs(currMidiNote - nextPitch.midiNote);
          info.chordIntervals.push(intervalSize);
          if (intervalSize < info.smallestIntervalSize) {
            info.smallestIntervalSize = intervalSize;
          }
        }
      }
    });
    if (info.smallestIntervalSize === Number.MAX_SAFE_INTEGER) {
      info.smallestIntervalSize = 0;
    }
    return info;
  }

  /**
   * Computes the best and the worst scores a chord with the given chord's number of voices and
   * smallest interval would achieve and returns the delta as a positive value.
   */
  private computeGamut(chordInfo: ChordInfo): number {
    // Build the "best" and "worst" chords and compute their scores. We use triangular numbers to convey a
    // sense of a pyramidal shape.
    const idealIntervals: number[] = [];
    let triangularIndex = chordInfo.smallestIntervalSize;
    const triangularNumber = getTriangularNumber(triangularIndex);
    if (triangularNumber !== triangularIndex) {
      idealIntervals.push(triangularIndex);
    }
    while (idealIntervals.length < chordInfo.numVoices) {
      idealIntervals.push(getTriangularNumber(triangularIndex));
      triangularIndex++;
    }
    const idealRawScore = computeRawScore(idealIntervals);
    const worstIntervals = idealIntervals.slice().reverse();
    const worstRawScore = computeRawScore(worstIntervals);

    // Move the entire range out of the negative realm (if applicable) and return the delta.
    // Numeric comparator fix, see file header.
    const scores = [worstRawScore, idealRawScore].sort((a, b) => a - b);
    let adjustedWorstRawScore = worstRawScore;
    let adjustedIdealRawScore = idealRawScore;
    const smallestScore = scores[0] as number;
    if (smallestScore < 0) {
      const offset = Math.abs(smallestScore);
      adjustedWorstRawScore += offset;
      adjustedIdealRawScore += offset;
    }
    return Math.abs(adjustedIdealRawScore - adjustedWorstRawScore);
  }

  /**
   * Represents given `rawScore` as a percent of the given `gamut`.
   *
   * NOTES:
   * - the gamut is built against canonical best/worst pyramidal structures. In "real life", there might be chord
   *   structures that are not pyramidal at all, or are "deformed pyramids", i.e., the pyramid's "walls" are
   *   "curved". In this last case, the received `rawScore` will actually be higher than the `gamut`. Our
   *   response is to apply a penalty that is proportional to the degree of "deformation" rather than ceiling the
   *   value to `gamut`.
   * - since the gamut has been obtained by moving into the positive realm the negative half of the test score,
   *   we will add half of the gamut to received `rawScore`.
   */
  private transposeScore(rawScore: number, gamut: number): number {
    let adjustedRawScore = rawScore + gamut * 0.5;
    if (adjustedRawScore > gamut) {
      const applicablePercent = gamut / adjustedRawScore;
      adjustedRawScore = applicablePercent * gamut;
    }
    return adjustedRawScore / gamut;
  }
}
