import { ClefTypes } from '../ClefTypes.js';

/**
 * Ported from
 * `as-sources/legacy-generators-base-library/ro/se/legacy/generators/constants/parts/PartDefaultClefs.as`.
 */
export const PartDefaultClefs = {
  // Keyboards
  PIANO: [ClefTypes.TREBLE, ClefTypes.BASS],
  HARPSICHORD: [ClefTypes.TREBLE, ClefTypes.BASS],
  CELESTA: [ClefTypes.TREBLE, ClefTypes.BASS],
  ORGAN: [ClefTypes.TREBLE, ClefTypes.BASS, ClefTypes.BASS],

  // Solo bowed strings
  VIOLIN: [ClefTypes.TREBLE],
  VIOLA: [ClefTypes.ALTO],
  CELLO: [ClefTypes.BASS],
  CONTRABASS: [ClefTypes.CONTRABASS],

  // Solo plucked strings
  HARP: [ClefTypes.TREBLE, ClefTypes.BASS],
  ACOUSTIC_GUITAR: [ClefTypes.TENOR_MODERN],
  ACOUSTIC_BASS_GUITAR: [ClefTypes.BASS],

  // Solo reedless woodwinds
  PICCOLO: [ClefTypes.TREBLE],
  FLUTE: [ClefTypes.TREBLE],
  RECORDER: [ClefTypes.TREBLE],

  // Solo single-reed woodwinds
  CLARINET: [ClefTypes.TREBLE],

  // Solo double reed woodwinds
  OBOE: [ClefTypes.TREBLE],
  ENGLISH_HORN: [ClefTypes.TREBLE],
  BASSOON: [ClefTypes.BASS],

  // Solo brass
  TRUMPET: [ClefTypes.TREBLE],
  TROMBONE: [ClefTypes.BASS],
  TUBA: [ClefTypes.BASS],

  // Horns section
  FRENCH_HORNS: [ClefTypes.TREBLE, ClefTypes.BASS],

  // Pitched percussion
  GLOCKENSPIEL: [ClefTypes.TREBLE],
  VIBRAPHONE: [ClefTypes.TREBLE],
  MARIMBA: [ClefTypes.TREBLE],
  XYLOPHONE: [ClefTypes.TREBLE],
  TUBULAR_BELLS: [ClefTypes.TREBLE],

  // Other
  CHOIR: [ClefTypes.TREBLE, ClefTypes.TREBLE, ClefTypes.TENOR_MODERN, ClefTypes.BASS],
} as const;
