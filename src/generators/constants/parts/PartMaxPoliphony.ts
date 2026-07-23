/**
 * Informative table denoting how many pitches a given instrument can
 * simultaneously sound. Takes into consideration whether the instrument
 * has a sort of "sustain pedal" or not. For a number of instruments this
 * is debatable, so a number was assumed and stuck with.
 *
 * Ported from
 * `as-sources/legacy-generators-base-library/ro/se/legacy/generators/constants/parts/PartMaxPoliphony.as`.
 */
export const PartMaxPoliphony = {
  // Keyboards
  PIANO: 88,
  HARPSICHORD: 10,
  CELESTA: 10,
  ORGAN: 12,

  // Bowed strings
  VIOLIN: 2,
  VIOLA: 2,
  CELLO: 2,
  CONTRABASS: 2,

  // Plucked strings
  HARP: 47,
  ACOUSTIC_GUITAR: 6,
  ACOUSTIC_BASS_GUITAR: 4,

  PICCOLO: 1,
  FLUTE: 1,
  RECORDER: 1,

  // Single-reed woodwinds
  CLARINET: 1,

  // Double reed woodwinds
  OBOE: 1,
  ENGLISH_HORN: 1,
  BASSOON: 1,

  // Brass
  TRUMPET: 1,
  TROMBONE: 1,
  TUBA: 1,
  FRENCH_HORNS: 3,

  // Pitched percussion
  GLOCKENSPIEL: 4,
  VIBRAPHONE: 36,
  MARIMBA: 6,
  XYLOPHONE: 4,
  TUBULAR_BELLS: 2,

  // Other
  CHOIR: 8,
} as const;
