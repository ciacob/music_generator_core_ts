import { AbstractContentAnalyzer } from '../../core/abstracts/AbstractContentAnalyzer.js';
import { Fraction } from '../../math/Fraction.js';
import { ParameterNames } from '../constants/ParameterNames.js';
import type { IAnalysisContext } from '../../core/interfaces/IAnalysisContext.js';
import type { IFraction } from '../../math/IFraction.js';
import type { IMusicRequest } from '../../core/interfaces/IMusicRequest.js';
import type { IMusicUnit } from '../../core/interfaces/IMusicUnit.js';
import type { IMusicalContentAnalyzer } from '../../core/interfaces/IMusicalContentAnalyzer.js';
import type { IParametersList } from '../../core/interfaces/IParametersList.js';
import type { ITimeSignatureDefinition } from '../../knowledge/timesignature/ITimeSignatureDefinition.js';
import type { ITimeSignatureEntry } from '../../knowledge/timesignature/ITimeSignatureEntry.js';
import type { ITimeSignatureMap } from '../../knowledge/timesignature/ITimeSignatureMap.js';

// Beat hierarchy types.
const PRIMARY = 'PRIMARY';
const SECONDARY = 'SECONDARY';

// Rank tiers (1 = strongest).
const RANK_FULL_BEAT = 1;
const RANK_FIRST_DIVISION = 2;
const RANK_SECOND_DIVISION = 3;
const RANK_NO_ALIGNMENT = 4;

// Neutral score used whenever there isn't enough information to rank a position.
const NEUTRAL_SCORE = 50;

// Score table with headroom constraint.
const SCORES: Readonly<Record<string, number>> = {
  '1a': 100,
  '1b': 90,
  '1c': 80,
  '2a': 70,
  '2b': 63,
  '2c': 56,
  '3a': 49,
  '3b': 44,
  '3c': 39,
  '4a': 34,
  '4b': 30,
  '4c': 26,
};

/**
 * Analyzes how naturally a duration is placed within the metric structure.
 *
 * Scores durations based on alignment with beat hierarchy (primary/secondary beats).
 * Uses a dual-position ranking system: evaluates both start and end positions,
 * computing geometric mean of their scores.
 *
 * Ported from
 * `as-sources/legacy-generators-harmony/ro/se/legacy/generators/harmony/analyzers/MetricPlacement.as`.
 *
 * **Bug fixed at the root: the `percentTime`/`timeSlot` naming collision.** The AS3 original's
 * `_getStartTime` computes `Fraction.fromDecimal(analysisContext.percentTime / 100)` — dividing
 * by `100`, as if `analysisContext.percentTime` were already a `0`-`100` value. It never is:
 * `IAnalysisContext.percentTime` is a `[0, 1)` ratio at runtime (see that interface's own,
 * now-corrected, doc comment), and every other analyzer in this codebase that consumes it does
 * the *opposite* conversion (`Math.round(analysisContext.percentTime * 100)`) to get a genuine
 * `0`-`100` value for an `ISettingsList.getValueAt`/`setValueAt` call. This file doesn't call
 * either of those — it needs the raw `[0, 1)` ratio directly, to scale a total duration — so the
 * fix is simply to drop the erroneous `/ 100` entirely, using `analysisContext.percentTime` as
 * given. Found and fixed together with the project owner, who traced it to a systemic naming
 * problem (two unrelated concepts across this codebase both called `percentTime`) and had the
 * `ISettingsList`/`SettingsList` side of it renamed to `timeSlot` beforehand specifically to
 * prevent this class of bug from recurring — see that rename's own commit for the full audit.
 *
 * **`measure.signature` may be `undefined` here, unlike the AS3 original's `ITimeSignatureEntry`
 * contract (which declares `signature` as always returning a real `ITimeSignatureDefinition`).**
 * This port's `ITimeSignatureEntry.ts` is more honest: a freshly-constructed entry genuinely has
 * no signature set yet, so the getter is typed `ITimeSignatureDefinition | undefined`. Since the
 * original never had to handle this, `_rankPosition` gets a new guard here, falling back to the
 * same `NEUTRAL_SCORE` already used for "position beyond the time map" — treating "we don't have
 * enough information to say" consistently across both cases, rather than inventing a new,
 * undocumented fallback value.
 */
export class MetricPlacement extends AbstractContentAnalyzer implements IMusicalContentAnalyzer {
  /**
   * Weight of this analyzer in multi-criterial decisions.
   * @see IMusicalContentAnalyzer.weight
   */
  override get weight(): number {
    return 0.89;
  }

  /**
   * Human-friendly name identifying this analyzer.
   * @see IMusicalContentAnalyzer.name
   */
  override get name(): string {
    return ParameterNames.METRIC_PLACEMENT;
  }

  /**
   * Analyzes the metric placement quality of a given duration.
   *
   * Evaluates how well the duration aligns with metric structure by scoring
   * both start and end positions, then computing their geometric mean.
   *
   * @see IMusicalContentAnalyzer.analyze
   */
  override analyze(
    targetMusicUnit: IMusicUnit,
    analysisContext: IAnalysisContext,
    _parameters: IParametersList,
    request: IMusicRequest,
  ): void {
    // Get temporal positions.
    const startTime = this.getStartTime(analysisContext, request);
    const stopTime = this.getStopTime(startTime, targetMusicUnit);

    // Rank both positions.
    const startScore = this.rankPosition(startTime, request);
    const stopScore = this.rankPosition(stopTime, request);

    // Compute geometric mean.
    const finalScore = Math.sqrt(startScore * stopScore);

    // Store result.
    targetMusicUnit.analysisScores.add(ParameterNames.METRIC_PLACEMENT, Math.round(finalScore));
  }

  /**
   * Calculates the start time of the current unit as a Fraction.
   *
   * BUG FIX (see file header): uses `analysisContext.percentTime` directly, as the `[0, 1)`
   * ratio it actually is — the AS3 original erroneously divided it by `100` first.
   */
  private getStartTime(analysisContext: IAnalysisContext, request: IMusicRequest): IFraction {
    const referenceDuration = request.timeMap.duration;
    const percentFraction = Fraction.fromDecimal(analysisContext.percentTime);
    return referenceDuration.multiply(percentFraction);
  }

  /** Calculates the stop time (end of duration) as a Fraction. */
  private getStopTime(startTime: IFraction, targetMusicUnit: IMusicUnit): IFraction {
    return startTime.add(targetMusicUnit.duration);
  }

  /**
   * Finds the measure containing the given time position.
   * Returns `undefined` if position is beyond the time map.
   */
  private getCurrentMeasure(position: IFraction, timeMap: ITimeSignatureMap): ITimeSignatureEntry | undefined {
    let accumulator: IFraction = Fraction.ZERO;
    const numEntries = timeMap.length;

    for (let i = 0; i < numEntries; i++) {
      const entry = timeMap.getAt(i);
      const nextAccumulator = accumulator.add(entry.duration);

      // Check if position falls within this entry's span.
      if (position.lessThan(nextAccumulator) || position.equals(nextAccumulator)) {
        return entry;
      }

      accumulator = nextAccumulator;
    }

    // Position beyond time map.
    return undefined;
  }

  /**
   * Determines if a measure uses ternary subdivision.
   * Heuristic: numerator divisible by 3.
   */
  private isMeasureTernary(signature: ITimeSignatureDefinition): boolean {
    return signature.shownNumerator % 3 === 0;
  }

  /**
   * Determines beat hierarchy (Primary/Secondary/Other) for a position within measure.
   * Heuristic: first beat is primary, rest are secondary.
   */
  private getBeatHierarchy(positionInMeasure: IFraction, _signature: ITimeSignatureDefinition): string {
    // First beat (position 0) is primary.
    if (positionInMeasure.numerator === 0) {
      return PRIMARY;
    }

    // All other beats are secondary for now.
    return SECONDARY;
  }

  /**
   * Ranks a time position and returns a score (1-100).
   *
   * Evaluates position alignment with beat structure:
   * - Rank 1: Aligns with full beat
   * - Rank 2: Aligns with first division (half/third)
   * - Rank 3: Aligns with second division
   * - Rank 4: No clear alignment
   *
   * Beat hierarchy (a/b/c) modulates final score.
   */
  private rankPosition(position: IFraction, request: IMusicRequest): number {
    const measure = this.getCurrentMeasure(position, request.timeMap);

    // Default to neutral score if beyond time map.
    if (!measure) {
      return NEUTRAL_SCORE;
    }

    const signature = measure.signature;

    // Default to neutral score if the measure has no signature set yet (see file header --
    // the AS3 original's looser typing didn't have to account for this).
    if (!signature) {
      return NEUTRAL_SCORE;
    }

    const isTernary = this.isMeasureTernary(signature);

    // Calculate position within measure.
    const positionInMeasure = this.getPositionInMeasure(position, request.timeMap, measure);

    // Determine beat hierarchy.
    const hierarchy = this.getBeatHierarchy(positionInMeasure, signature);

    // Determine rank tier.
    const rank = this.determineRank(positionInMeasure, signature, isTernary);

    // Map to score.
    const subtier = this.mapHierarchyToSubtier(hierarchy);
    const scoreKey = `${rank}${subtier}`;

    return SCORES[scoreKey] ?? NEUTRAL_SCORE;
  }

  /** Calculates position within the current measure. */
  private getPositionInMeasure(
    absolutePosition: IFraction,
    timeMap: ITimeSignatureMap,
    currentMeasure: ITimeSignatureEntry,
  ): IFraction {
    let accumulator: IFraction = Fraction.ZERO;
    const numEntries = timeMap.length;

    for (let i = 0; i < numEntries; i++) {
      const entry = timeMap.getAt(i);

      if (entry === currentMeasure) {
        // Found our measure, return offset within it.
        return absolutePosition.subtract(accumulator);
      }

      accumulator = accumulator.add(entry.duration);
    }

    // Fallback.
    return Fraction.ZERO;
  }

  /** Determines rank tier based on beat alignment. */
  private determineRank(positionInMeasure: IFraction, signature: ITimeSignatureDefinition, isTernary: boolean): number {
    const beatDuration = signature.fraction.divide(new Fraction(signature.shownNumerator, 1));

    // Rank 1: Position aligns with full beat.
    const moduloBeat = this.modulo(positionInMeasure, beatDuration);
    if (moduloBeat.numerator === 0) {
      return RANK_FULL_BEAT;
    }

    // Rank 2: Position aligns with first division (half or third).
    const firstDivision = isTernary ? beatDuration.divide(new Fraction(3, 1)) : beatDuration.divide(new Fraction(2, 1));
    const moduloFirst = this.modulo(positionInMeasure, firstDivision);
    if (moduloFirst.numerator === 0) {
      return RANK_FIRST_DIVISION;
    }

    // Rank 3: Position aligns with second division.
    const secondDivision = isTernary ? beatDuration.divide(new Fraction(9, 1)) : beatDuration.divide(new Fraction(4, 1));
    const moduloSecond = this.modulo(positionInMeasure, secondDivision);
    if (moduloSecond.numerator === 0) {
      return RANK_SECOND_DIVISION;
    }

    // Rank 4: No clear alignment.
    return RANK_NO_ALIGNMENT;
  }

  /** Maps beat hierarchy to score subtier (a/b/c). */
  private mapHierarchyToSubtier(hierarchy: string): string {
    switch (hierarchy) {
      case PRIMARY:
        return 'a';
      case SECONDARY:
        return 'b';
      default:
        return 'c';
    }
  }

  /**
   * Computes modulo operation for Fractions.
   * Returns the remainder of dividend / divisor.
   */
  private modulo(dividend: IFraction, divisor: IFraction): IFraction {
    // Convert to common denominator for integer math.
    const dividendFloat = dividend.floatValue;
    const divisorFloat = divisor.floatValue;

    if (divisorFloat === 0) {
      return Fraction.ZERO;
    }

    const quotient = Math.floor(dividendFloat / divisorFloat);
    const subtractAmount = divisor.multiply(new Fraction(quotient, 1));

    return dividend.subtract(subtractAmount);
  }
}
