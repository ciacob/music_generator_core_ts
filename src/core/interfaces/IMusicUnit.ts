import type { IFraction } from '../../math/IFraction.js';
import type { IAnalysisScores } from './IAnalysisScores.js';
import type { IMusicPitch } from './IMusicPitch.js';
import type { IPerformanceInstruction } from './IPerformanceInstruction.js';
import type { IPitchAllocation } from './IPitchAllocation.js';
import type { ITupletDefinition } from './ITupletDefinition.js';

/**
 * Ported from
 * `as-sources/legacy-generators-core-library/ro/se/legacy/generators/core/interfaces/IMusicUnit.as`.
 *
 * `pitches`/`pitchAllocations`/`performanceInstructions`/`analysisScores`
 * are `readonly` here (the property can't be reassigned to a different
 * array/instance) but their element types are NOT `readonly` — matching
 * the original's own note that "the container itself is readonly, but
 * its content can be freely set" (i.e. callers push/splice into the same
 * array reference).
 */
export interface IMusicUnit {
  /** Globally unique, readonly identifier for this music unit. */
  readonly uid: string;

  /** The musical duration, e.g. `1/4` (a quarter note/crotchet). */
  duration: IFraction;

  /**
   * If applicable, the identifier of the music unit that starts the
   * tuplet this music unit is part of. If THIS music unit starts the
   * tuplet, `tupletRootUid` holds the same value as `uid`.
   */
  tupletRootUid: string;

  /**
   * If applicable, information about the tuplet this music unit starts.
   * Includes tuplet nominal beats number/duration and regular nominal
   * beats number/duration.
   */
  tupletDefinition: ITupletDefinition;

  /**
   * The pitches this music unit defines. Each entry defines a MIDI note
   * number and whether to tie to the next music unit's pitch (provided it
   * has the same MIDI note number).
   */
  readonly pitches: IMusicPitch[];

  /**
   * Allocation rules distributing this music unit's pitches among
   * available instruments. `pitchAllocations` and `pitches` maintain 1:1
   * correspondence.
   */
  readonly pitchAllocations: IPitchAllocation[];

  /**
   * Performance indications (dynamics, tempo, etc.) related to this music
   * unit's pitches. `performanceInstructions`, `pitchAllocations`, and
   * `pitches` maintain 1:1 correspondence.
   */
  readonly performanceInstructions: IPerformanceInstruction[];

  /** The scores this music unit obtained against various analysis criteria. */
  readonly analysisScores: IAnalysisScores;

  /**
   * Returns a new `IMusicUnit` with identical properties to this one — a
   * SHALLOW CLONE (all non-primitive properties and array elements are
   * passed by reference rather than recreated).
   */
  clone(): IMusicUnit;
}
