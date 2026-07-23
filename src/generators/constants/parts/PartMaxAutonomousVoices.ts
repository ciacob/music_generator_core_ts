/**
 * Informative table denoting how many completely autonomous polyphonic
 * voices a given instrument can constantly sustain. For a number of
 * instruments this is debatable, so a number was assumed and stuck with.
 *
 * Ported from
 * `as-sources/legacy-generators-base-library/ro/se/legacy/generators/constants/parts/PartMaxAutonomousVoices.as`.
 */
export const PartMaxAutonomousVoices = {
  // Keyboards
  PIANO: 4,
  HARPSICHORD: 4,
  CELESTA: 4,
  ORGAN: 6,

  // Bowed strings
  VIOLIN: 1,
  VIOLA: 1,
  CELLO: 1,
  CONTRABASS: 1,

  // Plucked strings
  HARP: 2,
  ACOUSTIC_GUITAR: 2,
  ACOUSTIC_BASS_GUITAR: 1,

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
  GLOCKENSPIEL: 2,
  VIBRAPHONE: 2,
  MARIMBA: 2,
  XYLOPHONE: 2,
  TUBULAR_BELLS: 2,

  // Other
  CHOIR: 4,
} as const;
