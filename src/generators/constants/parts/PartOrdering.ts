import { getAllValues } from '../../../utils/ConstantUtils.js';
import { getPartFamily } from './PartFamilies.js';
import { getPartIndex } from './PartFamiliesOrder.js';
import { PartNames } from './PartNames.js';

/**
 * Family-aware part ordering. Originally two static methods on
 * `PartNames.as` itself (`getAllPartNames`, `comparePartsByFamilies`);
 * moved to their own module here to break a circular import — see the
 * comment at the top of `PartNames.ts` for the full explanation.
 *
 * This module depends on `PartNames.ts`, `PartFamilies.ts`, and
 * `PartFamiliesOrder.ts`; none of those depend back on this module, so
 * the overall graph is acyclic.
 */

/**
 * Returns all part names, ordered by family (per `PartFamiliesOrder`)
 * and then by position within that family (per `PartFamilies`).
 */
export function getAllPartNames(): string[] {
  const list = getAllValues(PartNames) as string[];
  return list.sort(comparePartsByFamilies);
}

/**
 * Convenience comparator for `Array.prototype.sort()`, ordering two part
 * names by their family's generic order, then by position within that
 * family.
 */
export function comparePartsByFamilies(partA: string, partB: string): number {
  const familyNameA = getPartFamily(partA);
  const familyNameB = getPartFamily(partB);
  const familyIndexA = getPartIndex(familyNameA, partA);
  const familyIndexB = getPartIndex(familyNameB, partB);
  return familyIndexA - familyIndexB;
}
