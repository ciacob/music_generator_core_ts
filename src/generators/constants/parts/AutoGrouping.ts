import { getPartFamily } from './PartFamilies.js';

/**
 * Ported from
 * `as-sources/legacy-generators-base-library/ro/se/legacy/generators/constants/parts/AutoGrouping.as`.
 */

/**
 * List of part families that are eligible for automatic grouping. These
 * strings must match 1:1 with the key names defined in `PartFamilies`.
 */
export const ELLIGIBLE_FAMILIES = ['BOWED_STRINGS', 'BRASS', 'WOODWINDS'] as const;

/**
 * Returns `true` if the given `partName`'s family is in the list of
 * families eligible for auto-grouping.
 */
export function isPartFamilyElligible(partName: string): boolean {
  const family = getPartFamily(partName);
  return Boolean(family) && (ELLIGIBLE_FAMILIES as readonly string[]).indexOf(family) !== -1;
}
