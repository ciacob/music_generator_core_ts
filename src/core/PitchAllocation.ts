import type { IMusicalInstrument } from '../knowledge/instruments/IMusicalInstrument.js';
import type { IMusicPitch } from './interfaces/IMusicPitch.js';
import type { IPitchAllocation } from './interfaces/IPitchAllocation.js';

/**
 * Defines one rule for allocating one pitch to one instrument and voice
 * of that instrument.
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/ro/se/legacy/generators/core/PitchAllocation.as`.
 */
export class PitchAllocation implements IPitchAllocation {
  /**
   * @param instrumentValue The instrument to allocate the pitch to. @see IPitchAllocation.instrument
   * @param voiceIndexValue The voice, among the instrument's own, to allocate the pitch to. @see IPitchAllocation.voiceIndex
   * @param allocatedPitchValue The pitch being allocated. @see IPitchAllocation.allocatedPitch
   */
  constructor(
    private instrumentValue: IMusicalInstrument,
    private voiceIndexValue: number,
    private allocatedPitchValue: IMusicPitch,
  ) {}

  /** @see IPitchAllocation.instrument */
  get instrument(): IMusicalInstrument {
    return this.instrumentValue;
  }

  /** @see IPitchAllocation.instrument */
  set instrument(value: IMusicalInstrument) {
    this.instrumentValue = value;
  }

  /** @see IPitchAllocation.voiceIndex */
  get voiceIndex(): number {
    return this.voiceIndexValue;
  }

  /** @see IPitchAllocation.voiceIndex */
  set voiceIndex(value: number) {
    this.voiceIndexValue = value;
  }

  /** @see IPitchAllocation.allocatedPitch */
  get allocatedPitch(): IMusicPitch {
    return this.allocatedPitchValue;
  }

  /** @see IPitchAllocation.allocatedPitch */
  set allocatedPitch(value: IMusicPitch) {
    this.allocatedPitchValue = value;
  }

  /** @see Object.prototype.toString */
  toString(): string {
    return `[instrument ${this.instrumentValue.internalName}(${this.instrumentValue.uid}), voice ${this.voiceIndexValue}, pitch ${this.allocatedPitchValue}]`;
  }
}
