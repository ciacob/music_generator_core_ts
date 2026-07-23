/**
 * Ported from
 * `as-sources/legacy-generators-base-library/ro/se/legacy/generators/constants/parts/PartMidiPatches.as`.
 *
 * NOTE (from the original): this is NOT the standard General MIDI (GM)
 * patch table. Due to severe memory leaks in the Alchemy-compiled
 * synthesizer originally in use, a custom velocity-switched patching
 * scheme was used as a workaround instead — patches are selected by
 * sending `noteOn` messages with the velocity values defined below, with
 * softer instruments mapped to higher velocities and louder instruments
 * to lower ones, to compensate for the synth's un-disable-able
 * velocity-to-attenuation modulator. See `GMPartMidiPatches.ts` for the
 * actual General MIDI patch numbers.
 */
export const PartMidiPatches = {
  ACOUSTIC_BASS_GUITAR: 111, // Acoustic Bass
  CHOIR: 114, // Ahh Choir
  BASSOON: 108,
  CELESTA: 120,
  CELLO: 109,
  ORGAN: 99, // Church Organ
  CLARINET: 110,
  CONTRABASS: 112,
  ENGLISH_HORN: 107,
  FLUTE: 116,
  FRENCH_HORNS: 103,
  GLOCKENSPIEL: 115,
  HARPSICHORD: 119,
  MARIMBA: 123,
  ACOUSTIC_GUITAR: 125, // Nylon guitar
  OBOE: 106,
  HARP: 124, // Orchestral Harp
  PIANO: 113, // Piano f
  PICCOLO: 105,
  RECORDER: 121,
  TROMBONE: 101,
  TRUMPET: 100,
  TUBA: 102,
  TUBULAR_BELLS: 117,
  VIBRAPHONE: 122,
  VIOLA: 118,
  VIOLIN: 104,
  XYLOPHONE: 126,
} as const;
