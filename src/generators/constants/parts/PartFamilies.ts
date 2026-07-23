import { capitalize, fromAS3ConstantCase } from '../../../utils/Strings.js';
import { getAllNames } from '../../../utils/ConstantUtils.js';
import { PartNames } from './PartNames.js';

/**
 * Ported from
 * `as-sources/legacy-generators-base-library/ro/se/legacy/generators/constants/parts/PartFamilies.as`.
 *
 * The AS3 original keeps a separate `OTHER_INSTRUMENTS` constant *outside*
 * the enumerable family list, using a custom AS3 namespace (`se::`) so it
 * is accessible via qualified access but invisible to
 * `ConstantUtils.getAllNames`'s reflection (which only sees `public`
 * members). TypeScript doesn't need a language trick for that — a value
 * simply isn't part of an object's keys unless it's a property of that
 * object — so `OTHER_INSTRUMENTS` here is just a separate top-level
 * export, never added to the `PartFamilies` object that `getAllFamilies`
 * enumerates.
 */
export const PartFamilies = {
  BOWED_STRINGS: [PartNames.VIOLIN, PartNames.VIOLA, PartNames.CELLO, PartNames.CONTRABASS],

  PLUCKED_STRINGS: [PartNames.HARP, PartNames.ACOUSTIC_GUITAR, PartNames.ACOUSTIC_BASS_GUITAR],

  BRASS: [PartNames.TRUMPET, PartNames.TROMBONE, PartNames.FRENCH_HORNS, PartNames.TUBA],

  WOODWINDS: [
    PartNames.PICCOLO,
    PartNames.FLUTE,
    PartNames.RECORDER,
    PartNames.OBOE,
    PartNames.ENGLISH_HORN,
    PartNames.CLARINET,
    PartNames.BASSOON,
  ],

  KEYBOARDS: [PartNames.PIANO, PartNames.HARPSICHORD, PartNames.CELESTA, PartNames.ORGAN],

  PITCHED_PERCUTION: [
    PartNames.GLOCKENSPIEL,
    PartNames.VIBRAPHONE,
    PartNames.MARIMBA,
    PartNames.XYLOPHONE,
    PartNames.TUBULAR_BELLS,
  ],
} as const;

/**
 * Sentinel family name for a part that cannot be matched to any known
 * family. Deliberately not a member of `PartFamilies` — see the file
 * comment above.
 */
export const OTHER_INSTRUMENTS = 'OTHER_INSTRUMENTS';

let allFamiliesCache: string[] | null = null;

/** Returns an array with all part family names defined in `PartFamilies`. */
export function getAllFamilies(): string[] {
  if (!allFamiliesCache) {
    allFamiliesCache = getAllNames(PartFamilies);
  }
  return allFamiliesCache;
}

const partToFamilyCache = new Map<string, string>();

/**
 * Returns the name of the family the given instrument (part) belongs to.
 * @param partName The part to look up the family of.
 * @returns The family name, or `OTHER_INSTRUMENTS` if the instrument
 * cannot be matched to any known family.
 */
export function getPartFamily(partName: string): string {
  const cached = partToFamilyCache.get(partName);
  if (cached !== undefined) {
    return cached;
  }
  const friendlyPartName = capitalize(fromAS3ConstantCase(partName));
  const allFamilies = getAllFamilies();
  let family: string = OTHER_INSTRUMENTS;
  for (const familyName of allFamilies) {
    const familyMembers: readonly string[] = PartFamilies[familyName as keyof typeof PartFamilies];
    if (familyMembers && familyMembers.indexOf(friendlyPartName) !== -1) {
      family = familyName;
      break;
    }
  }
  partToFamilyCache.set(partName, family);
  return family;
}

/**
 * Returns `true` if the given `partNames` are all members of the same
 * family, `false` otherwise (including if any given part name is falsy
 * or unrecognized).
 */
export function haveSameFamily(partNames: readonly string[] | null | undefined): boolean {
  if (partNames && partNames.length) {
    let prevFamily: string | null = null;
    for (const partName of partNames) {
      if (!partName) {
        return false;
      }
      const currFamily = getPartFamily(partName);
      if (currFamily === OTHER_INSTRUMENTS) {
        return false;
      }
      if (prevFamily !== null && currFamily !== prevFamily) {
        return false;
      }
      prevFamily = currFamily;
    }
    return true;
  }
  return false;
}
