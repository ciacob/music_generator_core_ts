/**
 * General MIDI (GM) instrument patch mappings.
 *
 * Ported from
 * `as-sources/legacy-generators-base-library/ro/se/legacy/generators/constants/parts/GMPartMidiPatches.as`.
 *
 * The AS3 original pairs each patch number constant with an
 * `[Description(value="...")]` metadata tag, read back via
 * `flash.utils.describeType` reflection in `getAllPatches`/
 * `getGMPatchInfo`. TypeScript has no metadata-tag/reflection equivalent,
 * so the patch numbers and their descriptive names are represented as two
 * parallel plain objects instead — `GMPartMidiPatches` (patch numbers,
 * kept as the primary export for symbol-name fidelity) and
 * `GM_PATCH_DESCRIPTIONS` (the "GM instrument name" strings the metadata
 * tags held) — and `getAllPatches`/`getGMPatchInfo` read both directly
 * rather than via reflection.
 */
export const GMPartMidiPatches = {
  PIANO: 1,
  CELESTA: 9,
  GLOCKENSPIEL: 10,
  VIBRAPHONE: 12,
  MARIMBA: 13,
  XYLOPHONE: 14,
  TUBULAR_BELLS: 15,
  HARPSICHORD: 7,
  ORGAN: 20,
  ACOUSTIC_GUITAR: 25,
  ACOUSTIC_BASS_GUITAR: 33,
  VIOLIN: 41,
  VIOLA: 42,
  CELLO: 43,
  CONTRABASS: 44,
  HARP: 47,
  FRENCH_HORNS: 61,
  TRUMPET: 57,
  TROMBONE: 58,
  TUBA: 59,
  OBOE: 69,
  ENGLISH_HORN: 70,
  BASSOON: 71,
  CLARINET: 72,
  PICCOLO: 73,
  FLUTE: 74,
  RECORDER: 75,
  CHOIR: 53,
} as const;

/** @see GMPartMidiPatches (the file comment explains why this exists separately) */
export const GM_PATCH_DESCRIPTIONS: Record<keyof typeof GMPartMidiPatches, string> = {
  PIANO: 'Acoustic Grand Piano',
  CELESTA: 'Celesta',
  GLOCKENSPIEL: 'Glockenspiel',
  VIBRAPHONE: 'Vibraphone',
  MARIMBA: 'Marimba',
  XYLOPHONE: 'Xylophone',
  TUBULAR_BELLS: 'Tubular Bells',
  HARPSICHORD: 'Harpsichord',
  ORGAN: 'Church Organ',
  ACOUSTIC_GUITAR: 'Acoustic Guitar (Nylon)',
  ACOUSTIC_BASS_GUITAR: 'Acoustic Bass',
  VIOLIN: 'Violin',
  VIOLA: 'Viola',
  CELLO: 'Cello',
  CONTRABASS: 'Contrabass',
  HARP: 'Orchestral Harp',
  FRENCH_HORNS: 'French Horn',
  TRUMPET: 'Trumpet',
  TROMBONE: 'Trombone',
  TUBA: 'Tuba',
  OBOE: 'Oboe',
  ENGLISH_HORN: 'English Horn',
  BASSOON: 'Bassoon',
  CLARINET: 'Clarinet',
  PICCOLO: 'Piccolo',
  FLUTE: 'Flute',
  RECORDER: 'Recorder',
  CHOIR: 'Choir Aahs',
};

/** A GM instrument's descriptive name paired with its patch number. */
export interface GMPatchInfo {
  /** The General MIDI instrument's descriptive name (e.g. `"Acoustic Grand Piano"`). */
  gmName: string;
  /** The General MIDI program/patch number. */
  gmPatch: number;
}

let allPatchesCache: GMPatchInfo[] | null = null;

/**
 * Retrieves an array of all GM patches, each paired with its descriptive
 * name, sorted by patch number.
 */
export function getAllPatches(): GMPatchInfo[] {
  if (!allPatchesCache) {
    const keys = Object.keys(GMPartMidiPatches) as (keyof typeof GMPartMidiPatches)[];
    allPatchesCache = keys
      .map((key) => ({ gmName: GM_PATCH_DESCRIPTIONS[key], gmPatch: GMPartMidiPatches[key] }))
      .sort((a, b) => a.gmPatch - b.gmPatch);
  }
  return allPatchesCache;
}

/**
 * Retrieves General MIDI patch information for a given instrument.
 * @param internalInst The name of the constant representing the
 * instrument (e.g. `"PIANO"`).
 * @returns The patch's name/number, or `null` if not found.
 */
export function getGMPatchInfo(internalInst: string): GMPatchInfo | null {
  if (internalInst in GMPartMidiPatches) {
    const key = internalInst as keyof typeof GMPartMidiPatches;
    return { gmName: GM_PATCH_DESCRIPTIONS[key], gmPatch: GMPartMidiPatches[key] };
  }
  return null;
}
