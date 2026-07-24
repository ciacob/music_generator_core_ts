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

  /** @see IMusicPitch.midiNote */
  get midiNote(): number {
    return this.midiNoteValue;
  }

  /** @see IMusicPitch.midiNote */
  set midiNote(value: number) {
    this.midiNoteValue = value;
  }

  /** @see IMusicPitch.tieNext */
  get tieNext(): boolean {
    return this.tieNextValue;
  }

  /** @see IMusicPitch.tieNext */
  set tieNext(value: boolean) {
    this.tieNextValue = value;
  }

  /** Produces a string rendition of the current instance. Useful for debugging. */
  toString(): string {
    return [this.midiNoteValue, this.tieNextValue ? CommonStrings.EQUAL : CommonStrings.EMPTY].join(
      CommonStrings.EMPTY,
    );
  }
}
