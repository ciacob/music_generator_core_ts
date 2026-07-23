/**
 * Ported from
 * `as-sources/legacy-generators-base-library/ro/se/legacy/generators/constants/parts/PartNames.as`.
 *
 * The AS3 original also defines `getAllPartNames`/`comparePartsByFamilies`
 * as static methods on this same class, referencing `PartFamilies`/
 * `PartFamiliesOrder` (which in turn reference `PartNames`'s own
 * constants at *their* top level). That's a genuine circular import, and
 * — contrary to what an earlier version of this file's comment claimed —
 * it is not actually safe: whichever module in the cycle is imported
 * first has its own top-level code paused partway through while the
 * still-mid-evaluation modules it circularly imports get resolved, so a
 * consumer that imports `PartNames.ts` before anything else in the cycle
 * would find `PartFamilies.ts`'s top-level `PartNames.VIOLIN` access
 * reading from a not-yet-initialized module (this was caught by this
 * project's own test suite entering the cycle via `PartNames.ts`
 * directly). `getAllPartNames`/`comparePartsByFamilies` are moved to
 * `PartOrdering.ts` instead, which depends on this file, `PartFamilies.ts`,
 * and `PartFamiliesOrder.ts` — none of which depend back on it — making
 * the whole dependency graph acyclic. This file now holds only the plain
 * data.
 */
export const PartNames = {
  // Keyboards
  PIANO: 'Piano',
  HARPSICHORD: 'Harpsichord',
  CELESTA: 'Celesta',
  ORGAN: 'Organ',

  // Bowed strings
  VIOLIN: 'Violin',
  VIOLA: 'Viola',
  CELLO: 'Cello',
  CONTRABASS: 'Contrabass',

  // Plucked strings
  HARP: 'Harp',
  ACOUSTIC_GUITAR: 'Acoustic guitar',
  ACOUSTIC_BASS_GUITAR: 'Acoustic bass guitar',

  PICCOLO: 'Piccolo',
  FLUTE: 'Flute',
  RECORDER: 'Recorder',

  // Single-reed woodwinds
  CLARINET: 'Clarinet',

  // Double reed woodwinds
  OBOE: 'Oboe',
  ENGLISH_HORN: 'English horn',
  BASSOON: 'Bassoon',

  // Brass
  TRUMPET: 'Trumpet',
  TROMBONE: 'Trombone',
  TUBA: 'Tuba',

  // Horns section
  FRENCH_HORNS: 'French horns',

  // Pitched percussion
  GLOCKENSPIEL: 'Glockenspiel',
  VIBRAPHONE: 'Vibraphone',
  MARIMBA: 'Marimba',
  XYLOPHONE: 'Xylophone',
  TUBULAR_BELLS: 'Tubular bells',

  // Other
  CHOIR: 'Choir',
} as const;
