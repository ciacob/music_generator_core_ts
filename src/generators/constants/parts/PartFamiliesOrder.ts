import { PartFamilies } from './PartFamilies.js';

/**
 * Ported from
 * `as-sources/legacy-generators-base-library/ro/se/legacy/generators/constants/parts/PartFamiliesOrder.as`.
 * `UNPITCHED_PERCUTION` and `OTHER_INSTRUMENTS` have generic order values
 * defined here even though neither has a populated entry in
 * `PartFamilies`, matching the AS3 original exactly.
 */
export const PartFamiliesOrder = {
  KEYBOARDS: 0,
  BOWED_STRINGS: 100,
  PLUCKED_STRINGS: 200,
  WOODWINDS: 400,
  BRASS: 600,
  PITCHED_PERCUTION: 700,
  UNPITCHED_PERCUTION: 800,
  OTHER_INSTRUMENTS: 900,
} as const;

/**
 * Combines a family's generic order index with a part's position within
 * that family's member list, giving each part a single, stable ordering
 * value.
 */
export function getPartIndex(familyName: string, partName: string): number {
  const genericIndex = PartFamiliesOrder[familyName as keyof typeof PartFamiliesOrder] ?? 0;
  const familyMembers: readonly string[] | undefined =
    PartFamilies[familyName as keyof typeof PartFamilies];
  const specificIndex = familyMembers ? familyMembers.indexOf(partName) : 0;
  return genericIndex + specificIndex;
}
