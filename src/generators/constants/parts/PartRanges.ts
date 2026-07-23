/**
 * Ported from
 * `as-sources/legacy-generators-base-library/ro/se/legacy/generators/constants/parts/PartRanges.as`.
 */
export const PartRanges = {
  // Keyboards
  PIANO: [21, 108],
  HARPSICHORD: [29, 89],
  CELESTA: [60, 108],
  ORGAN: [12, 115],

  // Bowed strings
  VIOLIN: [55, 103],
  VIOLA: [48, 91],
  CELLO: [36, 76],
  CONTRABASS: [28, 67],

  // Plucked strings
  HARP: [24, 103],
  ACOUSTIC_GUITAR: [40, 83],
  ACOUSTIC_BASS_GUITAR: [28, 65],

  // Reedless woodwinds
  PICCOLO: [74, 102],
  FLUTE: [60, 96],
  RECORDER: [60, 81],

  // Single-reed woodwinds
  CLARINET: [50, 94],

  // Double reed woodwinds
  OBOE: [58, 91],
  ENGLISH_HORN: [52, 81],
  BASSOON: [34, 75],

  // Solo brass
  TRUMPET: [55, 82],
  TROMBONE: [40, 72],
  TUBA: [28, 58],
  FRENCH_HORNS: [34, 77],

  // Pitched percussion
  GLOCKENSPIEL: [79, 108],
  VIBRAPHONE: [53, 89],
  MARIMBA: [45, 96],
  XYLOPHONE: [65, 108],
  TUBULAR_BELLS: [60, 77],

  // Other
  CHOIR: [41, 79],
} as const;
