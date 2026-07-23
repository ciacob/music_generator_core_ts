import type { IMusicUnit } from './IMusicUnit.js';

/**
 * Container to hold information consumed by `IMusicalContentAnalyzer`
 * instances.
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/ro/se/legacy/generators/core/interfaces/IAnalysisContext.as`.
 */
export interface IAnalysisContext {
  /** The last `n` music units that were generated (based on the "analysis window" parameter). */
  previousContent: IMusicUnit[];

  /**
   * Untyped musical data (e.g. MIDI pitches) that could potentially be
   * included in the generated output. Likely used by `IRawMusicSource`
   * instances when producing music rudiments.
   */
  proposedContent: unknown[];

  /**
   * A point in time (`0`-`100` inclusive) referring to the remaining
   * musical duration to be "filled".
   */
  percentTime: number;
}
