/**
 * Ported from
 * `as-sources/legacy-generators-base-library/ro/se/legacy/generators/constants/BarTypes.as`.
 */
export const BarTypes = {
  NORMAL_BAR: '◊',
  DOUBLE_BAR: 'þ',
  FINAL_BAR: 'ÿ',
  AUTO_BAR: '≉',
} as const;

/** Returns all `BarTypes` values, in a fixed display order (auto, normal, double, final). */
export function getAllTypes(): string[] {
  return [BarTypes.AUTO_BAR, BarTypes.NORMAL_BAR, BarTypes.DOUBLE_BAR, BarTypes.FINAL_BAR];
}
