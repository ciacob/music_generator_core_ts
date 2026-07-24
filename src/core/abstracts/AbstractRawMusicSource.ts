import { generateRFC4122GUID } from '../../utils/Strings.js';
import type { IAnalysisContext } from '../interfaces/IAnalysisContext.js';
import type { IMusicRequest } from '../interfaces/IMusicRequest.js';
import type { IMusicUnit } from '../interfaces/IMusicUnit.js';
import type { IParametersList } from '../interfaces/IParametersList.js';
import type { IRawMusicSource } from '../interfaces/IRawMusicSource.js';

/**
 * Generic implementation of a musical primitive source base class.
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/ro/se/legacy/generators/core/abstracts/AbstractRawMusicSource.as`.
 * Real TS `abstract class`; `uid` is the one concrete member. `reset()`
 * is concrete too in the original (a no-op subclasses may override), so
 * it's a regular (non-abstract) method here as well.
 */
export abstract class AbstractRawMusicSource implements IRawMusicSource {
  private uidValue: string | undefined;

  /** @see IRawMusicSource.output */
  abstract output(
    targetMusicUnit: IMusicUnit,
    analysisContext: IAnalysisContext,
    parameters: IParametersList,
    request: IMusicRequest,
  ): IMusicUnit[];

  /** @see IRawMusicSource.uid */
  get uid(): string {
    if (this.uidValue === undefined) {
      this.uidValue = generateRFC4122GUID();
    }
    return this.uidValue;
  }

  /** Subclasses may override as needed. */
  reset(): void {
    // no-op by default
  }
}
