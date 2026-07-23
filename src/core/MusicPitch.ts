import { CommonStrings } from '../utils/constants/CommonStrings.js';
import type { IMusicPitch } from './interfaces/IMusicPitch.js';

/**
 * Default implementation of `IMusicPitch`.
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/ro/se/legacy/generators/core/MusicPitch.as`.
 */
export class MusicPitch implements IMusicPitch {
  private midiNoteValue = 0;
  private tieNextValue = false;

  get midiNote(): number {
    return this.midiNoteValue;
  }

  set midiNote(value: number) {
    this.midiNoteValue = value;
  }

  get tieNext(): boolean {
    return this.tieNextValue;
  }

  set tieNext(value: boolean) {
    this.tieNextValue = value;
  }

  toString(): string {
    return [this.midiNoteValue, this.tieNextValue ? CommonStrings.EQUAL : CommonStrings.EMPTY].join(
      CommonStrings.EMPTY,
    );
  }
}
