/**
 * Ported from
 * `as-sources/legacy-generators-base-library/ro/se/legacy/generators/constants/duration/CompoundTimeSignatures.as`.
 * Each `[numerator, denominator]` pair, matching the original AS3 `Array`
 * shape exactly.
 */
export const CompoundTimeSignatures = {
  NINE_BY_EIGHT: [9, 8],
  NINE_BY_FOUR: [9, 4],
  NINE_BY_SIXTEEN: [9, 16],
  NINE_BY_TWO: [9, 2],
  SIX_BY_EIGHT: [6, 8],
  SIX_BY_FOUR: [6, 4],
  SIX_BY_SIXTEEN: [6, 16],
  SIX_BY_TWO: [6, 2],
  TWELVE_BY_EIGHT: [12, 8],
  TWELVE_BY_FOUR: [12, 4],
  TWELVE_BY_SIXTEEN: [12, 16],
  TWELVE_BY_TWO: [12, 2],
} as const;
