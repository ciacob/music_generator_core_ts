import { AbstractRawMusicSource } from '../../core/abstracts/AbstractRawMusicSource.js';
import { CoreOperationKeys } from '../../core/constants/CoreOperationKeys.js';
import type { IAnalysisContext } from '../../core/interfaces/IAnalysisContext.js';
import type { IMusicRequest } from '../../core/interfaces/IMusicRequest.js';
import type { IMusicUnit } from '../../core/interfaces/IMusicUnit.js';
import type { IParameter } from '../../core/interfaces/IParameter.js';
import type { IParametersList } from '../../core/interfaces/IParametersList.js';
import type { IRawMusicSource } from '../../core/interfaces/IRawMusicSource.js';

/**
 * Multi-criterial decision maker that orders a set of `IMusicUnit` instances by their
 * composite fitness across multiple analysis criteria.
 *
 * Uses Euclidean distance (sum of squared differences) to measure how far each unit's
 * analysis scores are from their ideal/expected values. Units closer to ideal are ranked higher.
 *
 * Ported from
 * `as-sources/legacy-generators-harmony/ro/se/legacy/generators/harmony/sources/MultiCriterialSorter.as`.
 *
 * NOTE (carried over from the AS3 original): this could be reimplemented
 * as standalone, as it bears no conceptual connection to `IRawMusicSource`.
 *
 * **`!unitA.analysisScores` guards kept, though currently unreachable.**
 * `MusicUnit.analysisScores`'s getter lazily creates an `AnalysisScores`
 * instance if none exists yet — in *both* the AS3 original and this port
 * — so the getter never actually returns a falsy value; the "units
 * without scores sink to bottom" branch below can't be exercised through
 * that getter today. Ported faithfully anyway: it's a real, deliberate
 * defensive check in the source (not dead code introduced by this
 * translation), and would become live again if `IMusicUnit.analysisScores`
 * were ever widened to be genuinely optional.
 *
 * No dependency on `Math.random()` or any other randomness source, so
 * (unlike `RandomChord`/`RawDuration`) there is no `randomFn` to inject.
 */
export class MultiCriterialSorter extends AbstractRawMusicSource implements IRawMusicSource {
  private parameters: IParametersList | undefined;
  private request: IMusicRequest | undefined;
  private timeSlot = 0;

  /** @see IRawMusicSource.output */
  override output(
    _targetMusicUnit: IMusicUnit,
    analysisContext: IAnalysisContext,
    parameters: IParametersList,
    request: IMusicRequest,
  ): IMusicUnit[] {
    // Grab context
    this.parameters = parameters;
    this.request = request;
    this.timeSlot = Math.round(analysisContext.percentTime * 100);

    // Sort music units by composite fitness
    const units = analysisContext.previousContent;
    units.sort((unitA, unitB) => this.sorterFunction(unitA, unitB));
    return units;
  }

  /**
   * Sorting function that orders `IMusicUnit` instances by Euclidean distance from ideal.
   *
   * Computes the squared Euclidean distance between each unit's analysis scores and their
   * expected/ideal values (as defined by parameters). Units with smaller distances (closer
   * to ideal across all criteria) are ranked higher.
   *
   * @param unitA First unit to compare.
   * @param unitB Second unit to compare.
   * @returns Negative if A is better (closer to ideal), positive if B is better, `0` if equal or on error.
   */
  private sorterFunction(unitA: IMusicUnit, unitB: IMusicUnit): number {
    // Units without assessment scores sink to bottom (see file header: currently unreachable
    // through MusicUnit's lazily-initializing getter, kept for fidelity/defense-in-depth).
    if (!unitA.analysisScores && !unitB.analysisScores) {
      return 0;
    }
    if (!unitA.analysisScores) {
      return 1;
    }
    if (!unitB.analysisScores) {
      return -1;
    }

    const parameters = this.parameters as IParametersList;
    const request = this.request as IMusicRequest;
    const timeSlot = this.timeSlot;

    // Accumulate squared distances for both units
    const context = {
      squaredDistanceA: 0,
      squaredDistanceB: 0,
      aborted: false,
    };

    unitA.analysisScores.forEach((criteria, valueA) => {
      // Validate parameter exists
      const matches = parameters.getByName(criteria);
      if (matches.length === 0) {
        context.aborted = true;
        return false;
      }

      // Validate parameter is numeric
      const param = matches[0] as IParameter;
      if (param.type !== CoreOperationKeys.TYPE_INT && param.type !== CoreOperationKeys.TYPE_ARRAY) {
        context.aborted = true;
        return false;
      }

      // Get ideal/expected value from parameter settings
      const expectedValue = request.userSettings.getValueAt(param, timeSlot);
      if (typeof expectedValue !== 'number' || Number.isNaN(expectedValue) || Number.isNaN(valueA)) {
        context.aborted = true;
        return false;
      }

      // Get unit B's score for same criteria
      const valueB = unitB.analysisScores.getValueFor(criteria);
      if (Number.isNaN(valueB)) {
        context.aborted = true;
        return false;
      }

      // Accumulate squared distance (Euclidean distance formula without sqrt)
      context.squaredDistanceA += (valueA - expectedValue) * (valueA - expectedValue);
      context.squaredDistanceB += (valueB - expectedValue) * (valueB - expectedValue);
      return true;
    });

    // Abort on validation errors
    if (context.aborted) {
      return 0;
    }

    // Compare rounded squared distances (smaller is better)
    return Math.round(context.squaredDistanceA) - Math.round(context.squaredDistanceB);
  }
}
