import type { IAnalysisContext } from './IAnalysisContext.js';
import type { IMusicRequest } from './IMusicRequest.js';
import type { IMusicUnit } from './IMusicUnit.js';
import type { IParametersList } from './IParametersList.js';

/**
 * Analyzes a given music unit and gives it a score specific to a
 * particular analysis criteria, e.g. harmonic consonance. Parameter
 * values and/or previous music units are available in case contextual
 * analysis is needed.
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/ro/se/legacy/generators/core/interfaces/IMusicalContentAnalyzer.as`.
 */
export interface IMusicalContentAnalyzer {
  /** Conducts the analysis and stores the resulting score inside `targetMusicUnit`. No value is returned. */
  analyze(
    targetMusicUnit: IMusicUnit,
    analysisContext: IAnalysisContext,
    parameters: IParametersList,
    request: IMusicRequest,
  ): void;

  /** A globally unique value identifying this analyzer. */
  readonly uid: string;

  /**
   * An intrinsic weight, or importance, of this analyzer (`0`-`1`
   * inclusive). Ideally, all parties operating this analyzer take this
   * weight into account to make its influence more or less salient.
   */
  readonly weight: number;

  /** A human-friendly name identifying this analyzer. Preferably unique. */
  readonly name: string;

  /**
   * The client code operating this analyzer is expected to store the
   * currently acceptable threshold for scores calculated by `analyze()`
   * here, and use it to decide whether a calculated score is "acceptable".
   */
  threshold: number;
}
