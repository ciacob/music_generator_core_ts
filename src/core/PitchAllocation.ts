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
  constructor(
    private instrumentValue: IMusicalInstrument,
    private voiceIndexValue: number,
    private allocatedPitchValue: IMusicPitch,
  ) {}

  get instrument(): IMusicalInstrument {
    return this.instrumentValue;
  }

  set instrument(value: IMusicalInstrument) {
    this.instrumentValue = value;
  }

  get voiceIndex(): number {
    return this.voiceIndexValue;
  }

  set voiceIndex(value: number) {
    this.voiceIndexValue = value;
  }

  get allocatedPitch(): IMusicPitch {
    return this.allocatedPitchValue;
  }

  set allocatedPitch(value: IMusicPitch) {
    this.allocatedPitchValue = value;
  }

  /** @see Object.prototype.toString */
  toString(): string {
    return `[instrument ${this.instrumentValue.internalName}(${this.instrumentValue.uid}), voice ${this.voiceIndexValue}, pitch ${this.allocatedPitchValue}]`;
  }
}
