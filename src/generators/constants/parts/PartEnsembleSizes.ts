import { getAllNames as getAllConstantNames } from '../../../utils/ConstantUtils.js';

/**
 * Ported from
 * `as-sources/legacy-generators-base-library/ro/se/legacy/generators/constants/parts/PartEnsembleSizes.as`.
 *
 * NOTE (from the original): the position of the `$` char indicates
 * whether the quantizer name should be appended or prepended, e.g.
 * `"SOLO$"` would produce `<instrument name> Solo`, such as
 * `"Piano Solo"`.
 *
 * The AS3 original's own static method was also named `getAllNames()`,
 * which would collide with the imported `ConstantUtils.getAllNames` in
 * this module's scope — renamed to `getAllNamesOrdered` here (it also
 * more precisely describes what it does: the size-sorted name list,
 * unlike the generic alphabetical order `ConstantUtils.getAllNames`
 * returns).
 */
export const PartEnsembleSizes = {
  'SOLO$': 1,
  'DUO$': 2,
  'TRIO$': 3,
  'QUARTET$': 4,
  'QUINTET$': 5,
  'SEXTET$': 6,
  'SEPTET$': 7,
  'OCTET$': 8,
  'NONET$': 9,
  '$CHAMBER': 10,
} as const;

let allNamesCache: string[] | null = null;

/** Returns all `PartEnsembleSizes` names, ordered by increasing size, cached after the first call. */
export function getAllNamesOrdered(): string[] {
  if (!allNamesCache) {
    allNamesCache = getAllConstantNames(PartEnsembleSizes).sort(compareBySize);
  }
  return allNamesCache;
}

function sizeOf(name: string): number {
  return PartEnsembleSizes[name as keyof typeof PartEnsembleSizes];
}

function compareBySize(nameA: string, nameB: string): number {
  return sizeOf(nameA) - sizeOf(nameB);
}

/**
 * Produces a name based on a given size, i.e. `"$Trio"` for `3`. The
 * position of the `$` char suggests whether the returned name should be
 * prepended or appended.
 *
 * @param size A size to find a name for.
 * @returns The resulting name, or `null` if no defined size is `<= size`.
 */
export function getNameBySize(size: number): string | null {
  const allNames = getAllNamesOrdered().slice().reverse();
  for (const aName of allNames) {
    const aSize = sizeOf(aName);
    if (size >= aSize) {
      return aName;
    }
  }
  return null;
}
