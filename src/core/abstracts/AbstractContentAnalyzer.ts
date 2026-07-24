import { generateRFC4122GUID } from '../../utils/Strings.js';
import type { IAnalysisContext } from '../interfaces/IAnalysisContext.js';
import type { IMusicRequest } from '../interfaces/IMusicRequest.js';
import type { IMusicUnit } from '../interfaces/IMusicUnit.js';
import type { IMusicalContentAnalyzer } from '../interfaces/IMusicalContentAnalyzer.js';
import type { IParametersList } from '../interfaces/IParametersList.js';

/**
 * Generic implementation of a musical content analyzer base class.
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/ro/se/legacy/generators/core/abstracts/AbstractContentAnalyzer.as`.
 * Real TS `abstract class`, same simplification as
 * `AbstractTimeSignatureDefinition`/`AbstractMusicalInstrument` — the
 * original's runtime self-instance-check-and-throw workaround isn't
 * needed. `uid` and `weight` are the two members the AS3 original
 * implements concretely rather than leaving abstract; preserved here
 * exactly (`weight` returns a fixed default, but is NOT marked `abstract`
 * in the original, so subclasses may still override it if needed).
 */
export abstract class AbstractContentAnalyzer implements IMusicalContentAnalyzer {
  static readonly DEFAULT_WEIGHT = 1;

  private uidValue: string | undefined;
  private thresholdValue = 0;

  /** @see IMusicalContentAnalyzer.analyze */
  abstract analyze(
    targetMusicUnit: IMusicUnit,
    analysisContext: IAnalysisContext,
    parameters: IParametersList,
    request: IMusicRequest,
  ): void;

  /** @see IMusicalContentAnalyzer.weight */
  get weight(): number {
    return AbstractContentAnalyzer.DEFAULT_WEIGHT;
  }

  /** @see IMusicalContentAnalyzer.name */
  abstract get name(): string;

  /** @see IMusicalContentAnalyzer.threshold */
  get threshold(): number {
    return this.thresholdValue;
  }

  /** @see IMusicalContentAnalyzer.threshold */
  set threshold(value: number) {
    this.thresholdValue = value;
  }

  /** @see IMusicalContentAnalyzer.uid */
  get uid(): string {
    if (this.uidValue === undefined) {
      this.uidValue = generateRFC4122GUID();
    }
    return this.uidValue;
  }

  /** Returns a string representation of the current instance. Useful for debugging. */
  toString(): string {
    return `[ANALYZER: ${this.name}]`;
  }
}
