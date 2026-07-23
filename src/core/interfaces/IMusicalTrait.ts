import type { IAnalysisContext } from './IAnalysisContext.js';
import type { IMusicRequest } from './IMusicRequest.js';
import type { IMusicUnit } from './IMusicUnit.js';
import type { IMusicalPostProcessor } from './IMusicalPostProcessor.js';
import type { IParametersList } from './IParametersList.js';

/**
 * Entity that binds together INFORMATION and LOGIC relevant to a
 * particular music aspect (and, most likely, to a particular generator).
 * A set of MUSICAL TRAITS, together with a set of PARAMETERS, essentially
 * define a generator, since they encapsulate that generator's entire
 * specificity.
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/ro/se/legacy/generators/core/interfaces/IMusicalTrait.as`.
 * (That file's ASDoc for `execute` also describes a `sources` parameter
 * that the actual method signature doesn't have — a stale-doc/signature
 * mismatch in the original, not reproduced here.)
 */
export interface IMusicalTrait {
  /**
   * Post-processors to run against generated material once raw
   * generation is complete, to refine it.
   */
  readonly musicalPostProcessors: IMusicalPostProcessor[];

  /**
   * The main routine of this trait. Affects the generated musical
   * material by setting, changing, or deleting one or more of
   * `targetMusicUnit`'s properties.
   *
   * @param targetMusicUnit The music unit whose properties are to be altered.
   * @param analysisContext Context information (e.g. the latest `n`
   * music units) the routine can use to compute values for
   * context-dependent properties.
   * @param parameters The parameters list, as defined by the generator
   * that owns this trait.
   * @param request The musical request the generator was invoked with.
   */
  execute(
    targetMusicUnit: IMusicUnit,
    analysisContext: IAnalysisContext,
    parameters: IParametersList,
    request: IMusicRequest,
  ): void;
}
