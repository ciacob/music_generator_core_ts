/**
 * Informative table denoting the MIDI (thus "sounding", or "concert
 * pitch") range each instrument is most proficient in when playing
 * simultaneous pitches. This is usually a (portion) of the instrument's
 * "middle range", because in this area its timbre has the right balance
 * of partials: not too many (which would clutter the chord beyond
 * recognition) but not too few either (which would strip any "harmonic
 * resonance" from the chord).
 *
 * This is highly debatable regardless of the instrument, so some ranges
 * were assumed and stuck with.
 *
 * Ported from
 * `as-sources/legacy-generators-base-library/ro/se/legacy/generators/constants/parts/PartIdealHarmonicRange.as`.
 */
export const PartIdealHarmonicRange = {
  // Keyboards
  PIANO: [52, 83],
  HARPSICHORD: [50, 71],
  CELESTA: [77, 94],
  ORGAN: [49, 86],

  // Bowed strings
  VIOLIN: [72, 89],
  VIOLA: [63, 79],
  CELLO: [50, 64],
  CONTRABASS: [42, 56],

  // Plucked strings
  HARP: [52, 80],
  ACOUSTIC_GUITAR: [55, 71],
  ACOUSTIC_BASS_GUITAR: [41, 54],

  // Reedless woodwinds
  PICCOLO: [84, 94],
  FLUTE: [72, 85],
  RECORDER: [67, 75],

  // Single-reed woodwinds
  CLARINET: [65, 81],

  // Double reed woodwinds
  OBOE: [69, 81],
  ENGLISH_HORN: [62, 73],
  BASSOON: [48, 63],

  // Solo brass
  TRUMPET: [64, 74],
  TROMBONE: [51, 63],
  TUBA: [38, 49],
  FRENCH_HORNS: [49, 65],

  // Pitched percussion
  GLOCKENSPIEL: [89, 100],
  VIBRAPHONE: [65, 78],
  MARIMBA: [63, 81],
  XYLOPHONE: [80, 96],
  TUBULAR_BELLS: [66, 72],

  // Other
  CHOIR: [54, 68],
} as const;
