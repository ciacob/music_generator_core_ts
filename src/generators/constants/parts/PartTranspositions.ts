/**
 * Ported from
 * `as-sources/legacy-generators-base-library/ro/se/legacy/generators/constants/parts/PartTranspositions.as`.
 */
export const PartTranspositions = {
  // Keyboards
  PIANO: 0,
  HARPSICHORD: 0,
  CELESTA: 12,
  ORGAN: 0,

  // Bowed strings
  VIOLIN: 0,
  VIOLA: 0,
  CELLO: 0,
  CONTRABASS: -12,

  // Plucked strings
  HARP: 0,
  ACOUSTIC_GUITAR: -12,
  ACOUSTIC_BASS_GUITAR: -12,

  // Reedless woodwinds
  PICCOLO: 12,
  FLUTE: 0,
  RECORDER: 0,

  // Single-reed woodwinds
  CLARINET: -2,

  // Double reed woodwinds
  OBOE: 0,
  ENGLISH_HORN: -7,
  BASSOON: 0,

  // Brass
  TRUMPET: 0,
  TROMBONE: 0,
  TUBA: -12,
  FRENCH_HORNS: -7,

  // Pitched percussion
  GLOCKENSPIEL: 12,
  VIBRAPHONE: 0,
  MARIMBA: 0,
  XYLOPHONE: 12,
  TUBULAR_BELLS: 0,

  // Other
  CHOIR: 0,
} as const;
