import type { IMusicalInstrument } from '../../knowledge/instruments/IMusicalInstrument.js';
import type { IMusicPitch } from './IMusicPitch.js';

/**
 * Defines one rule for allocating one pitch to one instrument and voice
 * of that instrument.
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/ro/se/legacy/generators/core/interfaces/IPitchAllocation.as`.
 */
export interface IPitchAllocation {
  /** The instance of the instrument to allocate the current pitch to. */
  instrument: IMusicalInstrument;

  /**
   * The index of the voice among the ones played by the current
   * instrument where the current pitch is to be allocated. `1`-based
   * (not `0`-based).
   */
  voiceIndex: number;

  /** The pitch being allocated. */
  allocatedPitch: IMusicPitch;
}
