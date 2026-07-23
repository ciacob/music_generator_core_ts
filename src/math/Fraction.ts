import type { IFraction } from './IFraction.js';
import * as fractionMath from './fractionMath.js';
import type { NormalizedFraction } from './fractionMath.js';

/**
 * Narrows an unknown value to `IFraction` by structural (duck-type) check
 * on its numerator/denominator getters, since AS3's `params[0] is IFraction`
 * runtime interface check has no direct TypeScript equivalent for
 * structurally-typed interfaces.
 */
function isFractionLike(value: unknown): value is IFraction {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as IFraction).numerator === 'number' &&
    typeof (value as IFraction).denominator === 'number'
  );
}

/**
 * Reads the four numeric facets (`numerator`, `denominator`,
 * `rawNumerator`, `rawDenominator`) off of any `IFraction` implementor —
 * not just this class's own instances — so arithmetic here works against
 * the interface, not a concrete type.
 */
function toNormalized(other: IFraction): NormalizedFraction {
  return {
    numerator: other.numerator,
    denominator: other.denominator,
    rawNumerator: other.rawNumerator,
    rawDenominator: other.rawDenominator,
  };
}

/**
 * Holds a rational number in numerator/denominator form instead of
 * floating point form. Provides the basic math and boolean operations, as
 * well as fraction-specific utilities.
 *
 * This class intentionally carries almost no logic of its own: every
 * arithmetic/parsing operation delegates to the pure functions in
 * `fractionMath.ts`, and this class is just the stateful, `IFraction`-
 * shaped wrapper around them (constructing new `Fraction` instances from
 * the plain result values those functions return).
 *
 * Ported from `as-sources/fraction-library/ro/se/math/Fraction.as`.
 */
export class Fraction implements IFraction {
  // --- Static utilities ---

  /** Computes the Lowest Common Multiple (LCM). */
  static lcm(a: number, b: number): number {
    return fractionMath.lcm(a, b);
  }

  /** Computes the Greatest Common Factor (GCF). */
  static gcf(a: number, b: number): number {
    return fractionMath.gcf(a, b);
  }

  /** Constructs and returns a fraction that is equal to `1`. */
  static get WHOLE(): Fraction {
    return new Fraction(1, 1);
  }

  /** Constructs and returns a fraction that is equal to `0`. */
  static get ZERO(): Fraction {
    return new Fraction(0, 1);
  }

  /**
   * Convenience comparison method to be used when sorting arrays and
   * similar operations.
   *
   * @param a The fraction to compare.
   * @param b The fraction to compare with.
   * @returns `1` if `a` is greater than `b`, `-1` if `a` is less than
   * `b`, `0` if they are equal.
   */
  static compare(a: IFraction, b: IFraction): -1 | 0 | 1 {
    return fractionMath.compare(a, b);
  }

  /**
   * Factory helper to build a Fraction from a given string, such as
   * `"1/4"`. Wholes, e.g. `"1 1/4"`, are NOT supported. Negative values
   * are NOT supported either.
   *
   * @throws {Error} If the string cannot be parsed.
   * @param value The string to convert from.
   * @returns An equivalent Fraction instance.
   */
  static fromString(value: string): Fraction {
    return Fraction.fromNormalized(fractionMath.fromString(value));
  }

  /**
   * Factory helper to approximate a fraction from a decimal number, such
   * as `0.5` -> `1/2`.
   *
   * @param decimal The decimal number to convert from.
   * @returns An equivalent Fraction instance.
   */
  static fromDecimal(decimal: number): Fraction {
    return Fraction.fromNormalized(fractionMath.fromDecimal(decimal));
  }

  /** Builds a `Fraction` directly from an already-normalized value, bypassing the constructor's overload resolution. */
  private static fromNormalized(value: NormalizedFraction): Fraction {
    const fraction = new Fraction();
    fraction.state = value;
    return fraction;
  }

  // --- Instance members ---

  private state: NormalizedFraction;

  /**
   * Constructs a new instance of a Fraction object. Supported call
   * shapes (mirroring the AS3 rest-parameter constructor):
   * - `new Fraction()` — equal to `0`.
   * - `new Fraction(other: IFraction)` — copies numerator/denominator from `other`.
   * - `new Fraction(numerator: number)` — assumes `1` as the denominator.
   * - `new Fraction(numerator: number, denominator: number)`
   * - `new Fraction(whole: number, properNumerator: number, denominator: number)`
   *
   * @throws {Error} If the provided arguments don't match one of the shapes above.
   */
  constructor(a?: number | IFraction, b?: number, c?: number) {
    if (a === undefined) {
      this.state = fractionMath.normalize(0, 1);
      return;
    }

    if (b === undefined) {
      if (typeof a === 'number') {
        this.state = fractionMath.normalize(a, 1);
        return;
      }
      if (isFractionLike(a)) {
        this.state = fractionMath.normalize(a.numerator, a.denominator);
        return;
      }
    } else if (typeof a === 'number' && typeof b === 'number') {
      if (c === undefined) {
        this.state = fractionMath.normalize(a, b);
        return;
      }
      if (typeof c === 'number') {
        // (whole, properNumerator, denominator)
        this.state = fractionMath.normalize(a * c + b, c);
        return;
      }
    }

    throw new Error(
      'Cannot create a new Fraction with provided argument(s). Please refer to documentation.',
    );
  }

  // --- Mutators ---

  /**
   * Changes the fraction's compound value.
   *
   * N.B.: Mutates the current fraction.
   *
   * @param numerator The new numerator.
   * @param denominator The new denominator.
   */
  setValue(numerator: number, denominator: number): void {
    this.state = fractionMath.normalize(numerator, denominator);
  }

  /**
   * Changes the fraction's compound value. You may specify a whole-number
   * portion along with a proper numerator and denominator. A proper
   * numerator is a numerator that does not contain the whole-number
   * portion. For example, to set the value 1 1/4 (read: one whole and one
   * fourth) you will use `setProperValue(1, 1, 4)`.
   *
   * This is equivalent to calling `setValue(5, 4)`.
   *
   * N.B.: Mutates the current fraction.
   *
   * @param whole The new whole-number portion.
   * @param properNumerator The new proper numerator, that is, a numerator
   * that does not contain the whole-number portion.
   * @param denominator The new denominator.
   */
  setProperValue(whole: number, properNumerator: number, denominator: number): void {
    this.setValue(whole * denominator + properNumerator, denominator);
  }

  // --- Non-computed accessors ---

  /** The numerator. */
  get numerator(): number {
    return this.state.numerator;
  }

  /** The denominator. */
  get denominator(): number {
    return this.state.denominator;
  }

  /** The unreduced numerator. */
  get rawNumerator(): number {
    return this.state.rawNumerator;
  }

  /** The unreduced denominator. */
  get rawDenominator(): number {
    return this.state.rawDenominator;
  }

  // --- Computed accessors ---

  /** The (approximated) floating point value. */
  get floatValue(): number {
    return this.state.numerator / this.state.denominator;
  }

  /** The numerator with the whole-number portion removed. */
  get properNumerator(): number {
    return this.state.numerator % this.state.denominator;
  }

  /** The reciprocal (inverse) of the fraction, where the numerator and denominator switch place. */
  get reciprocal(): IFraction {
    return Fraction.fromNormalized(fractionMath.reciprocalOf(this.state));
  }

  /** The whole part of the fraction, i.e. 5/4 is 1 whole and 1/4. */
  get whole(): number {
    return (this.state.numerator - this.properNumerator) / this.state.denominator;
  }

  // --- Arithmetic operations ---

  /**
   * Adds another fraction to this one. Returns the result, leaves the
   * current fraction untouched.
   */
  add(other: IFraction): IFraction {
    return Fraction.fromNormalized(fractionMath.addRaw(this.state, toNormalized(other)));
  }

  /**
   * Divides this fraction by another. This is a convenience method.
   * Returns the result, leaves the current fraction untouched.
   */
  divide(other: IFraction): IFraction {
    return this.multiply(other.reciprocal);
  }

  /**
   * Multiplies this fraction by another. Returns the result, leaves the
   * current fraction untouched.
   */
  multiply(other: IFraction): IFraction {
    return Fraction.fromNormalized(fractionMath.multiplyRaw(this.state, toNormalized(other)));
  }

  /**
   * Subtracts another fraction from this one. Returns the result, leaves
   * the current fraction untouched.
   */
  subtract(other: IFraction): IFraction {
    return Fraction.fromNormalized(fractionMath.subtractRaw(this.state, toNormalized(other)));
  }

  /**
   * Similar to `subtract` but switches fractions when `other` is greater
   * than this one. Returns the result, leaves the current fraction
   * untouched.
   */
  subtractAbs(other: IFraction): IFraction {
    if (other.greaterThan(this)) {
      return other.subtract(this);
    }
    return this.subtract(other);
  }

  // --- Boolean operations ---

  /** Checks if this fraction is equal to another. */
  equals(other: IFraction): boolean {
    return fractionMath.equalsValue(this.state, other);
  }

  /** Checks if this fraction is greater than another. */
  greaterThan(other: IFraction): boolean {
    return fractionMath.greaterThanValue(this.state, other);
  }

  /** Checks if this fraction is smaller than another. */
  lessThan(other: IFraction): boolean {
    return fractionMath.lessThanValue(this.state, other);
  }

  // --- Instance utilities ---

  /**
   * Convenience method to determine what percentage "is" this fraction of
   * another one. Shorthand for `getFractionOf(other).floatValue`.
   */
  getPercentageOf(other: IFraction): number {
    return this.getFractionOf(other).floatValue;
  }

  /** Alias of `divide(other)`. */
  getFractionOf(other: IFraction): IFraction {
    return this.divide(other);
  }

  /**
   * Returns a string representation of this fraction. The output can be
   * consumed by `Fraction.fromString()`.
   */
  toString(): string {
    return fractionMath.toStringValue(this.state);
  }

  /** Returns a JSON representation of this fraction (same as `toString()`). */
  toJSON(): string {
    return this.toString();
  }
}
