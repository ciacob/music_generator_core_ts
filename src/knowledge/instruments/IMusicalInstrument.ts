/**
 * Container to store information about a musical instrument.
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/eu/stochastic/engine/music/knowledge/instruments/interfaces/IMusicalInstrument.as`.
 * `Vector.<T>` becomes `readonly T[]` per this project's translation
 * conventions (readonly since every implementor treats these as
 * lazily-computed, effectively immutable snapshots).
 */
export interface IMusicalInstrument {
  /** Internally or externally defined ID that globally identifies this instrument instance. */
  uid: string;

  /**
   * Alternative name used to look up individual instrument features in
   * constant tables such as `PartFamilies` or `PartMidiPatches`, e.g. for
   * a Piano, this would be `"PIANO"`.
   */
  readonly internalName: string;

  /**
   * The name this instrument would use when notated in a score, e.g. a
   * Piano would return `"Piano"`. Sourced from `PartNames`.
   */
  readonly name: string;

  /**
   * The abbreviated name this instrument would use when notated in a
   * score, e.g. a Piano would return `"Pno."`. Sourced from
   * `PartAbbreviatedNames`.
   */
  readonly abbreviatedName: string;

  /**
   * An integer helping to distinguish between several instances of the
   * same instrument that might be playing in the same score, e.g. in a
   * score with two Violins, the first has index `n`, and the second `n+1`.
   */
  readonly ordinalIndex: number;

  /**
   * Where applicable, the individual staff names this instrument uses.
   * These may be displayed in the notated score in certain scenarios; for
   * instance, for an Organ this would be `['Right Hand', 'Left Hand',
   * 'Pedal']`. Sourced from `PartVoiceNames`.
   */
  readonly staffNames: readonly string[];

  /**
   * Where applicable, the abbreviated individual staff names this
   * instrument uses, e.g. for an Organ this would be `['R.H.', 'L.H.',
   * 'Ped.']`. Sourced from `PartAbbreviatedVoiceNames`.
   */
  readonly abbreviatedStaffNames: readonly string[];

  /**
   * The number of staves this instrument implicitly uses when notated in
   * a score. The default value is sourced from `PartDefaultStavesNumber`;
   * callers may set this to shrink or expand an instrument's voices onto
   * fewer or more staves.
   */
  stavesNumber: number;

  /** The clefs this instrument implicitly uses when notated in a score. Sourced from `PartDefaultClefs`. */
  readonly clefs: readonly string[];

  /** The bracket this instrument implicitly uses when notated in a score. Sourced from `PartDefaultBrackets`. */
  readonly bracket: string;

  /**
   * The instrument taxonomy this instrument is normally part of, e.g. for
   * a Piano this would be `"KEYBOARDS"`. Sourced from `PartFamilies`.
   */
  readonly partFamily: string;

  /**
   * The General MIDI compliant patch number for this instrument. Sourced
   * from `PartMidiPatches`.
   */
  readonly midiPatch: number;

  /**
   * The MIDI (thus "sounding", or "concert pitch") range of this
   * instrument, e.g. for a Piano this would be `[21, 108]`. Sourced from
   * `PartRanges`.
   */
  readonly midiRange: readonly number[];

  /**
   * The MIDI range this instrument is most proficient in when playing
   * simultaneous pitches. Sourced from `PartIdealHarmonicRange`.
   */
  readonly idealHarmonicRange: readonly number[];

  /** The maximum number of simultaneous pitches this instrument can emit, by construction. */
  readonly maximumPoliphony: number;

  /**
   * The maximum number of polyphonically independent melodic lines this
   * instrument can produce, when operated by a seasoned professional
   * player.
   */
  readonly maximumAutonomousVoices: number;

  /**
   * The transposition, in semitones, a playback routine should apply to
   * this instrument's part when notated in the score, e.g. for a French
   * Horn this would be `-7`. Sourced from `PartTranspositions`.
   */
  readonly transposition: number;
}
