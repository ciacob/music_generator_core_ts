import { BracketTypes } from '../BracketTypes.js';

/**
 * Ported from
 * `as-sources/legacy-generators-base-library/ro/se/legacy/generators/constants/parts/PartDefaultBrackets.as`.
 */
export const PartDefaultBrackets = {
  // Keyboards
  PIANO: BracketTypes.BRACE_FIRST_TWO,
  HARPSICHORD: BracketTypes.BRACE_FIRST_TWO,
  CELESTA: BracketTypes.BRACE_FIRST_TWO,
  ORGAN: BracketTypes.BRACE_FIRST_TWO,

  // Solo bowed strings
  VIOLIN: BracketTypes.NONE,
  VIOLA: BracketTypes.NONE,
  CELLO: BracketTypes.NONE,
  CONTRABASS: BracketTypes.NONE,

  // Solo plucked strings
  HARP: BracketTypes.BRACE_FIRST_TWO,
  ACOUSTIC_GUITAR: BracketTypes.NONE,
  ACOUSTIC_BASS_GUITAR: BracketTypes.NONE,

  // Solo reedless woodwinds
  PICCOLO: BracketTypes.NONE,
  FLUTE: BracketTypes.NONE,
  RECORDER: BracketTypes.NONE,

  // Solo single-reed woodwinds
  CLARINET: BracketTypes.NONE,

  // Solo double reed woodwinds
  OBOE: BracketTypes.NONE,
  ENGLISH_HORN: BracketTypes.NONE,
  BASSOON: BracketTypes.NONE,

  // Solo brass
  TRUMPET: BracketTypes.NONE,
  TROMBONE: BracketTypes.NONE,
  TUBA: BracketTypes.NONE,

  // Horns section
  FRENCH_HORNS: BracketTypes.BRACKET_ALL,

  // Pitched percussion
  GLOCKENSPIEL: BracketTypes.NONE,
  VIBRAPHONE: BracketTypes.NONE,
  MARIMBA: BracketTypes.BRACE_FIRST_TWO,
  XYLOPHONE: BracketTypes.NONE,
  TUBULAR_BELLS: BracketTypes.NONE,

  // Other
  CHOIR: BracketTypes.BRACKET_ALL,
} as const;
