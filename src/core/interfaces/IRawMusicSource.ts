import type { IAnalysisContext } from './IAnalysisContext.js';
import type { IMusicRequest } from './IMusicRequest.js';
import type { IMusicUnit } from './IMusicUnit.js';
import type { IParametersList } from './IParametersList.js';

/**
 * Blueprint for an entity that provides music rudiments to use as
 * foundation for musical generation. For example, in a harmonic
 * generator, an implementor could produce a number of random chords, to
 * be evaluated and filtered by higher-level entities in later stages.
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/ro/se/legacy/generators/core/interfaces/IRawMusicSource.as`.
 */
export interface IRawMusicSource {
  /**
   * Produces and returns one or more music rudiments.
   * @param targetMusicUnit The music unit currently being altered, in case needed.
   * @param analysisContext Relevant context information, in case needed.
   * @param parameters The parameters list, as defined by the generator
   * using this source, in case needed.
   * @param request The musical request the generator was invoked with, in case needed.
   */
  output(
    targetMusicUnit: IMusicUnit,
    analysisContext: IAnalysisContext,
    parameters: IParametersList,
    request: IMusicRequest,
  ): IMusicUnit[];

  /** A globally unique value identifying this source. */
  readonly uid: string;

  /** Discards any cached computed parameter values, causing a new computation round to take place. */
  reset(): void;
}
