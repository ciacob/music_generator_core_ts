/**
 * Represents one of the pitches inside a music unit.
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/ro/se/legacy/generators/core/interfaces/IMusicPitch.as`.
 */
export interface IMusicPitch {
  /** The MIDI number representing the pitch, e.g. `60` is middle C. */
  midiNote: number;

  /**
   * Whether or not to tie to the next music unit's corresponding pitch
   * (provided it has the same MIDI note number).
   */
  tieNext: boolean;

  /** @see Object.prototype.toString */
  toString(): string;
}
