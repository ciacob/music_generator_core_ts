import type { IAnalysisContext } from '../interfaces/IAnalysisContext.js';
import type { IMusicRequest } from '../interfaces/IMusicRequest.js';
import type { IMusicUnit } from '../interfaces/IMusicUnit.js';
import type { IMusicalPostProcessor } from '../interfaces/IMusicalPostProcessor.js';
import type { IMusicalTrait } from '../interfaces/IMusicalTrait.js';
import type { IParametersList } from '../interfaces/IParametersList.js';

/**
 * Generic implementation of a musical trait base class.
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/ro/se/legacy/generators/core/abstracts/AbstractMusicalTrait.as`.
 * Real TS `abstract class`; unlike most `Abstract*` base classes in this
 * project, this one has no concrete members at all (the AS3 original has
 * no `uid` or similar), so it's abstract-only.
 */
export abstract class AbstractMusicalTrait implements IMusicalTrait {
  abstract get musicalPostProcessors(): IMusicalPostProcessor[];

  abstract execute(
    targetMusicUnit: IMusicUnit,
    analysisContext: IAnalysisContext,
    parameters: IParametersList,
    request: IMusicRequest,
  ): void;
}
