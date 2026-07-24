import { AbstractContentAnalyzer } from '../../core/abstracts/AbstractContentAnalyzer.js';
import {
  ADDED_NOTES_CHORDS_ROOT_IN_BASS_SCORE,
  ADDED_NOTES_CHORDS_ROOT_UPPER_SCORE,
  AUGMENTED_OR_QUARTAL_SCORE,
  CLUSTERS_ROOT_IN_BASS_SCORE,
  CLUSTERS_ROOT_UPPER_SCORE,
  DIMINISHED_SCORE,
  DOMINANT_INVERSIONS_ROOT_IN_BASS_SCORE,
  DOMINANT_INVERSIONS_ROOT_UPPER_SCORE,
  DOMINANT_NINTH_SCORE,
  DOMINANT_TRIAD_SCORE,
  TRIADS_WITH_ROOT_IN_BASS_SCORE,
  TRIADS_WITH_ROOT_UPPER_SCORE,
  getRealPitches,
} from '../../core/helpers/CommonMusicUtils.js';
import { IntervalRegistryEntry } from '../../core/helpers/IntervalRegistryEntry.js';
import { IntervalsSize } from '../../generators/constants/pitch/IntervalsSize.js';
import { ParameterCommons } from '../constants/ParameterCommons.js';
import { ParameterNames } from '../constants/ParameterNames.js';
import { orderByHindemith2ndSeries } from '../../knowledge/harmony/Intervals.js';
import type { IAnalysisContext } from '../../core/interfaces/IAnalysisContext.js';
import type { IMusicPitch } from '../../core/interfaces/IMusicPitch.js';
import type { IMusicRequest } from '../../core/interfaces/IMusicRequest.js';
import type { IMusicUnit } from '../../core/interfaces/IMusicUnit.js';
import type { IMusicalContentAnalyzer } from '../../core/interfaces/IMusicalContentAnalyzer.js';
import type { IParametersList } from '../../core/interfaces/IParametersList.js';

const MIN_LEGAL_SCORE = 1;

/** Builds a `value -> occurrence count` histogram, used for the various `hasAnyX`/`isXChord` checks below. */
function countOccurrences(values: readonly number[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

/**
 * Establishes the harmonic consonance of an isolated chord, based on the consonance of its
 * constituent intervals.
 *
 * Ported from
 * `as-sources/legacy-generators-harmony/ro/se/legacy/generators/harmony/analyzers/IntrinsicConsonance.as`.
 *
 * **`_countIntOccurrences`'s two caches collapsed into two per-call `Map` histograms.** The AS3
 * original memoizes via two class fields (`_allIntervalsCache`, `_adjacentIntervalsCache`)
 * passed by reference into a shared counting helper. Tracing it closely: `_allIntervalsCache`
 * is explicitly reset to `[]` at the top of `analyze()`, so it's a genuinely non-null, truthy
 * array reference by the time `_countIntOccurrences` first receives it — the shared-mutation
 * caching trick works as intended. `_adjacentIntervalsCache`, however, is never initialized
 * anywhere (constructor or `analyze()`), so it's always AS3's default `null` for an
 * uninitialized `Array`-typed field, meaning `_countIntOccurrences`'s `$cache || []` builds a
 * fresh local array every single call that's discarded once the function returns — the
 * memoization for that one field never actually engages. This has no effect on the scores
 * computed (each call still builds a correct histogram from scratch, just redundantly, over a
 * handful of intervals at most) — a harmless missed-optimization, not a behavioral bug — so
 * this port just computes both histograms once per `analyze()`/`computeScore()` call, which is
 * simpler than reproducing an accidental non-cache and has no observable difference.
 *
 * **`hasRootUpperInChord()`'s `allIntervalsRegistry[0]` access is safe.** It's reachable only
 * from branches of `computeScore` that are past the point where `isAugmentedChord`/
 * `isQuartalChord`/`isDiminishedChord` would otherwise have already returned `true` -- and all
 * three of those trivially return `true` whenever `adjacentIntervals` is empty (an "n occurrences
 * out of 0 total" check is vacuously satisfied). Since every interval recorded in
 * `adjacentIntervals` is also recorded in `allIntervalsRegistry` (the former is a subset,
 * pushed alongside the latter in the same loop), a non-empty `adjacentIntervals` guarantees a
 * non-empty `allIntervalsRegistry` by the time `hasRootUpperInChord()` can be reached.
 */
export class IntrinsicConsonance extends AbstractContentAnalyzer implements IMusicalContentAnalyzer {
  private allIntervalsRegistry: IntervalRegistryEntry[] = [];
  private adjacentIntervals: number[] = [];
  private lowestPitchInChord = 0;

  /** @see IMusicalContentAnalyzer.weight */
  override get weight(): number {
    return 0.89;
  }

  /** @see IMusicalContentAnalyzer.name */
  override get name(): string {
    return ParameterNames.INTRINSIC_CONSONANCE;
  }

  /**
   * Analyzes the intrinsic consonance of a given music unit. Produces a score expressed as a
   * rational number between `1` (fully consonant) and `0` (fully dissonant).
   * @see IMusicalContentAnalyzer.analyze
   */
  override analyze(
    targetMusicUnit: IMusicUnit,
    _analysisContext: IAnalysisContext,
    _parameters: IParametersList,
    _request: IMusicRequest,
  ): void {
    // Collect and sort all intervals found in the current chord (music unit).
    this.allIntervalsRegistry = [];
    const simpleIntervals: number[] = [];
    this.adjacentIntervals = [];
    this.lowestPitchInChord = Number.MAX_SAFE_INTEGER;
    const pitches = getRealPitches(targetMusicUnit.pitches);
    const numPitches = pitches.length;

    // Exit with illegal score if there are less than two playing voices (as it takes at least two voices to
    // "make harmony").
    if (numPitches < 2) {
      targetMusicUnit.analysisScores.add(ParameterNames.INTRINSIC_CONSONANCE, ParameterCommons.NA_RESERVED_VALUE);
      return;
    }
    for (let i = 0; i < numPitches; i++) {
      const currentPitch = pitches[i] as IMusicPitch;
      const currMidiNote = currentPitch.midiNote;
      if (currMidiNote < this.lowestPitchInChord) {
        this.lowestPitchInChord = currMidiNote;
      }
      const remainderPitches = pitches.slice(i + 1);
      for (let j = 0; j < remainderPitches.length; j++) {
        const otherPitch = remainderPitches[j] as IMusicPitch;
        const interval = Math.abs(currMidiNote - otherPitch.midiNote);
        const simpleInterval = interval % IntervalsSize.PERFECT_OCTAVE;
        if (simpleInterval !== 0) {
          simpleIntervals.push(simpleInterval);
          this.allIntervalsRegistry.push(new IntervalRegistryEntry(currMidiNote, simpleInterval));
          if (j === 0) {
            this.adjacentIntervals.push(simpleInterval);
          }
        }
      }
    }

    // Compute and store the consonance score.
    let score = this.computeScore(simpleIntervals);
    score = Math.max(MIN_LEGAL_SCORE, score);
    targetMusicUnit.analysisScores.add(ParameterNames.INTRINSIC_CONSONANCE, score);
  }

  /**
   * Computes and returns a consonance score based on Paul Hindemith's observations from
   * "The craft of musical composition" (1953).
   */
  private computeScore(intervals: readonly number[]): number {
    const allCounts = countOccurrences(intervals);
    const adjacentCounts = countOccurrences(this.adjacentIntervals);
    const numAdjacentIntervals = this.adjacentIntervals.length;

    const countOf = (counts: Map<number, number>, value: number): number => counts.get(value) ?? 0;

    // Augmented and quartal chords in root position
    if (this.isAugmentedChord(adjacentCounts, numAdjacentIntervals) || this.isQuartalChord(adjacentCounts, numAdjacentIntervals)) {
      return AUGMENTED_OR_QUARTAL_SCORE;
    }

    // Diminished chords in any inversion, including diminished seventh chords
    if (this.isDiminishedChord(adjacentCounts, numAdjacentIntervals)) {
      return DIMINISHED_SCORE;
    }

    // Chords with no tritone
    const hasAnyTritone = countOf(allCounts, IntervalsSize.AUGMENTED_FOURTH) > 0;
    if (!hasAnyTritone) {
      // Chords with no seconds, nor sevenths of any kind
      const hasAnySeconds =
        countOf(allCounts, IntervalsSize.MINOR_SECOND) > 0 || countOf(allCounts, IntervalsSize.MAJOR_SECOND) > 0;
      const hasAnySevenths =
        countOf(allCounts, IntervalsSize.MINOR_SEVENTH) > 0 || countOf(allCounts, IntervalsSize.MAJOR_SEVENTH) > 0;
      if (!hasAnySeconds && !hasAnySevenths) {
        return this.hasRootUpperInChord() ? TRIADS_WITH_ROOT_UPPER_SCORE : TRIADS_WITH_ROOT_IN_BASS_SCORE;
      }
      // Chords with some seconds, or some sevenths, or both (but no tritones)
      return this.hasRootUpperInChord()
        ? ADDED_NOTES_CHORDS_ROOT_UPPER_SCORE
        : ADDED_NOTES_CHORDS_ROOT_IN_BASS_SCORE;
    }

    // Chords with at least one tritone
    const numTritones = countOf(allCounts, IntervalsSize.AUGMENTED_FOURTH);
    const hasSingleTritone = numTritones === 1;
    const hasMultipleTritones = numTritones >= 2;
    const hasAnyMinorSecond = countOf(allCounts, IntervalsSize.MINOR_SECOND) > 0;
    const hasAnyMajorSecond = countOf(allCounts, IntervalsSize.MAJOR_SECOND) > 0;
    const hasAnyMinorSeventh = countOf(allCounts, IntervalsSize.MINOR_SEVENTH) > 0;
    const hasAnyMajorSeventh = countOf(allCounts, IntervalsSize.MAJOR_SEVENTH) > 0;
    const hasAnySeconds = hasAnyMinorSecond || hasAnyMajorSecond;

    // Chords that have a single tritone, no seconds, and a minor seventh (the typical
    // dominant chords in the tonality).
    if (hasSingleTritone && !hasAnySeconds && !hasAnyMajorSeventh && hasAnyMinorSeventh) {
      return DOMINANT_TRIAD_SCORE;
    }

    // Chords that have a single tritone, no minor seconds, no major sevenths and either
    // major seconds, or minor sevenths, or both (typically the inversions of dominant
    // chords in the tonality).
    if (hasSingleTritone && !hasAnyMinorSecond && !hasAnyMajorSeventh && (hasAnyMajorSecond || hasAnyMinorSeventh)) {
      return this.hasRootUpperInChord() ? DOMINANT_INVERSIONS_ROOT_UPPER_SCORE : DOMINANT_INVERSIONS_ROOT_IN_BASS_SCORE;
    }

    // Chords that have several tritones, no minor seconds, no major sevenths and either
    // major seconds, minor sevenths, or both (typically dominant ninths or over).
    if (hasMultipleTritones && !hasAnyMinorSecond && !hasAnyMajorSeventh && (hasAnyMajorSecond || hasAnyMinorSeventh)) {
      return DOMINANT_NINTH_SCORE;
    }

    // Chords that have one or more tritones and either minor seconds, major sevenths, or
    // both (typically clusters).
    if (hasAnyMinorSecond || hasAnyMajorSeventh) {
      return this.hasRootUpperInChord() ? CLUSTERS_ROOT_UPPER_SCORE : CLUSTERS_ROOT_IN_BASS_SCORE;
    }

    return MIN_LEGAL_SCORE;
  }

  /**
   * Returns `true` if `allIntervalsRegistry` denotes a chord whose root (in Hindemith's
   * definition) is placed "upper in chord" (e.g., not in the bass). See the file header for why
   * `allIntervalsRegistry[0]` is safe to read unconditionally here.
   */
  private hasRootUpperInChord(): boolean {
    this.allIntervalsRegistry.sort(orderByHindemith2ndSeries);
    const mostSignificantInterval = this.allIntervalsRegistry[0] as IntervalRegistryEntry;
    return mostSignificantInterval.root !== this.lowestPitchInChord;
  }

  /**
   * Returns `true` if the collected adjacent intervals describe a diminished chord structure.
   * Reducing all compound intervals, a diminished chord will only contain 3m, or
   * only contain 3m and 4+, or only contain 3m, 4+ and 6M.
   */
  private isDiminishedChord(adjacentCounts: Map<number, number>, numAdjacentIntervals: number): boolean {
    const numMinorThirds = adjacentCounts.get(IntervalsSize.MINOR_THIRD) ?? 0;
    const numTritones = adjacentCounts.get(IntervalsSize.AUGMENTED_FOURTH) ?? 0;
    const numMajorSixths = adjacentCounts.get(IntervalsSize.MAJOR_SIXTH) ?? 0;
    return (
      numMinorThirds === numAdjacentIntervals ||
      numMinorThirds + numTritones === numAdjacentIntervals ||
      numMinorThirds + numTritones + numMajorSixths === numAdjacentIntervals
    );
  }

  /**
   * Returns `true` if the collected adjacent intervals describe an augmented chord structure.
   * Reducing all compound intervals, an augmented chord only contains 3M, or only contains 6m.
   */
  private isAugmentedChord(adjacentCounts: Map<number, number>, numAdjacentIntervals: number): boolean {
    const numMajorThirds = adjacentCounts.get(IntervalsSize.MAJOR_THIRD) ?? 0;
    const numMinorSixths = adjacentCounts.get(IntervalsSize.MINOR_SIXTH) ?? 0;
    return numMajorThirds === numAdjacentIntervals || numMinorSixths === numAdjacentIntervals;
  }

  /**
   * Returns `true` if the collected adjacent intervals describe a quartal chord structure.
   * Reducing all compound intervals, a quartal chord only contains 4p. NOTE THAT WE DO NOT
   * ADDRESS QUARTAL CHORDS INVERSIONS here, as they match other, more specific rules instead.
   */
  private isQuartalChord(adjacentCounts: Map<number, number>, numAdjacentIntervals: number): boolean {
    const numFourths = adjacentCounts.get(IntervalsSize.PERFECT_FOURTH) ?? 0;
    return numFourths === numAdjacentIntervals;
  }
}
