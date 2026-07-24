import type { IAnalysisContext } from './interfaces/IAnalysisContext.js';
import type { IMusicUnit } from './interfaces/IMusicUnit.js';

/**
 * Default implementation of `IAnalysisContext`.
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/ro/se/legacy/generators/core/AnalysisContext.as`.
 *
 * The AS3 original leaves its fields uninitialized (`null` until
 * explicitly set); here they default to an empty array / `0` instead, so
 * `previousContent`/`proposedContent` are always safely iterable and
 * `toString()` never has to guard against a `null` join target. A minor,
 * low-risk divergence for a plain data holder, not a behavior-changing
 * one for any real generation logic (which always sets these explicitly
 * before reading them).
 */
export class AnalysisContext implements IAnalysisContext {
  private previousContentValue: IMusicUnit[] = [];
  private proposedContentValue: unknown[] = [];
  private percentTimeValue = 0;

  /** @see IAnalysisContext.previousContent */
  get previousContent(): IMusicUnit[] {
    return this.previousContentValue;
  }

  /** @see IAnalysisContext.previousContent */
  set previousContent(value: IMusicUnit[]) {
    this.previousContentValue = value;
  }

  /** @see IAnalysisContext.proposedContent */
  get proposedContent(): unknown[] {
    return this.proposedContentValue;
  }

  /** @see IAnalysisContext.proposedContent */
  set proposedContent(value: unknown[]) {
    this.proposedContentValue = value;
  }

  /** @see IAnalysisContext.percentTime */
  get percentTime(): number {
    return this.percentTimeValue;
  }

  /** @see IAnalysisContext.percentTime */
  set percentTime(value: number) {
    this.percentTimeValue = value;
  }

  /** Produces a string rendition of the current instance. Useful for debugging. */
  toString(): string {
    return `[AnalysisContext: percentTime: ${this.percentTimeValue} | previousContent: ${this.previousContentValue.join(', ')}]`;
  }
}
