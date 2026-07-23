import { Fraction } from '../../../math/Fraction.js';

/**
 * Ported from
 * `as-sources/legacy-generators-base-library/ro/se/legacy/generators/constants/duration/TimeSignature.as`.
 */
export const TimeSignature = {
  COMMON_TIME: new Fraction(4, 4),
  MARCH_TIME: new Fraction(1, 2),
  WALTZ_TIME: new Fraction(3, 4),
} as const;
