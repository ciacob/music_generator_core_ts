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
   * The remaining musical duration to be "filled", as a ratio genuinely in
   * `[0, 1)` (approaching, but per `AbstractGeneratorModule`'s own
   * `Math.min(1, ...)` clamp, never reaching, `1`) -- despite its name and
   * despite the AS3 original's own doc comment claiming a `0`-`100` range.
   * That claim doesn't match the AS3 original's actual runtime behavior
   * either: `AbstractGeneratorModule.as` assigns `_percentCompleted`
   * (itself a plain `actual.getPercentageOf(due)` ratio) directly to this
   * property, with no `*100` anywhere in that assignment.
   *
   * This name is intentionally kept as-is (not renamed to something like
   * `progressFraction`) despite being misleading, since it's already
   * embedded throughout the engine's call sites -- callers must actively
   * convert it (typically `Math.round(analysisContext.percentTime * 100)`)
   * into the *separately and correctly* named `timeSlot` concept
   * (`ISettingsList.setValueAt`/`getValueAt`'s own, genuinely `0`-`100`-ish,
   * parameter) whenever they need to look up a parameter's value for the
   * current point in time. Never assign this property directly to a local
   * variable also named `percentTime` -- that exact collision (present in
   * several places in the original AS3 codebase, e.g.
   * `RawDuration.as`/`VoiceCohesion.as`/the `Duration`/`Harmony` traits)
   * is precisely what caused a real, reachable bug to go unnoticed in
   * `MetricPlacement.as` (see `MetricPlacement.ts`'s own file header).
   */
  percentTime: number;
}
