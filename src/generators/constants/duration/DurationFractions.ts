import { Fraction } from '../../../math/Fraction.js';

/**
 * Ported from
 * `as-sources/legacy-generators-base-library/ro/se/legacy/generators/constants/duration/DurationFractions.as`.
 * The AS3 original's constants hold actual `Fraction` instances, not
 * plain data — same here.
 */
export const DurationFractions = {
  WHOLE: new Fraction(1),
  HALF: new Fraction(1, 2),
  QUARTER: new Fraction(1, 4),
  EIGHT: new Fraction(1, 8),
  SIXTEENTH: new Fraction(1, 16),
  THIRTYSECOND: new Fraction(1, 32),
  SIXTYFOURTH: new Fraction(1, 64),
  HUNDREDTWENTYEIGHTH: new Fraction(1, 128),
} as const;
