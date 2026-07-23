/**
 * Represents a rational number held as a numerator/denominator pair,
 * instead of floating point form, so exact duration/time-position
 * arithmetic can avoid rounding error.
 *
 * Ported from `as-sources/fraction-library/ro/se/math/IFraction.as`.
 * AS3 `int`/`Number` are collapsed to TypeScript `number` throughout, per
 * the project's translation conventions.
 */
export interface IFraction {
  /**
   * Adds another fraction to this one.
   * @param other The fraction to add.
   * @returns The addition result, as a new fraction.
   */
  add(other: IFraction): IFraction;

  /**
   * Convenience method to determine what percentage "is" this fraction of
   * another one. Shorthand for `getFractionOf(other).floatValue`.
   * @param other Another fraction to find out what percentage the current
   * fraction represents of.
   * @returns A decimal value, such as `0.5`.
   */
  getPercentageOf(other: IFraction): number;

  /**
   * Alias of `divide(other)`.
   * @param other Another fraction to find out what fraction the current
   * fraction represents of.
   * @returns A fraction, such as `1/2`.
   */
  getFractionOf(other: IFraction): IFraction;

  /** The current denominator. */
  readonly denominator: number;

  /**
   * Divides this fraction by another. This is a convenience method.
   * @param other The fraction to divide by.
   * @see getFractionOf
   */
  divide(other: IFraction): IFraction;

  /**
   * Checks if this fraction is equal to another.
   * @param other The fraction to test.
   * @returns The equality test result.
   */
  equals(other: IFraction): boolean;

  /** The (approximated) floating point value. */
  readonly floatValue: number;

  /**
   * Checks if this fraction is greater than another.
   * @param other The fraction to test.
   * @returns The test result.
   */
  greaterThan(other: IFraction): boolean;

  /**
   * Checks if this fraction is smaller than another.
   * @param other The fraction to test.
   * @returns The test result.
   */
  lessThan(other: IFraction): boolean;

  /**
   * Multiplies this fraction by another.
   * @param other The fraction to multiply by.
   * @returns The multiplication result.
   */
  multiply(other: IFraction): IFraction;

  /** The current numerator of the fraction. */
  readonly numerator: number;

  /** The numerator with the whole-number portion removed. */
  readonly properNumerator: number;

  /** The reciprocal (inverse) of the fraction, where the numerator and denominator switch place. */
  readonly reciprocal: IFraction;

  /**
   * Changes the fraction's compound value. You may specify a whole-number
   * portion along with a proper numerator and denominator. A proper
   * numerator is a numerator that does not contain the whole-number
   * portion. For example, to set the value 1 1/4 (read: one whole and one
   * fourth) you will use `setProperValue(1, 1, 4)`.
   *
   * This is equivalent to calling `setValue(5, 4)`.
   *
   * @param whole The new whole-number portion.
   * @param properNumerator The new proper numerator, that is, a numerator
   * that does not contain the whole-number portion.
   * @param denominator The new denominator.
   */
  setProperValue(whole: number, properNumerator: number, denominator: number): void;

  /**
   * Changes the fraction's compound value.
   * @param numerator The new numerator.
   * @param denominator The new denominator.
   */
  setValue(numerator: number, denominator: number): void;

  /**
   * Subtracts another fraction from this one.
   * @param other The fraction to subtract.
   * @returns The subtraction result, as a new fraction.
   */
  subtract(other: IFraction): IFraction;

  /**
   * Similar to `subtract` but switches fractions when `other` is greater
   * than this one.
   * @param other The fraction to subtract.
   * @returns The subtraction result, as a new fraction.
   */
  subtractAbs(other: IFraction): IFraction;

  /** @see Object.prototype.toString */
  toString(): string;

  /** The whole part of the fraction, i.e. 5/4 is 1 whole and 1/4. */
  readonly whole: number;

  /**
   * The value the numerator had before the fraction was reduced.
   * Example: given `6/8`, `numerator` is `3`, while `rawNumerator` is `6`.
   */
  readonly rawNumerator: number;

  /**
   * The value the denominator had before the fraction was reduced.
   * Example: given `6/8`, `denominator` is `4`, while `rawDenominator` is `8`.
   */
  readonly rawDenominator: number;
}
