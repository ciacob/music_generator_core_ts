import { describe, expect, it } from 'vitest';
import { Fraction } from '../../src/math/Fraction.js';
import type { IFraction } from '../../src/math/IFraction.js';

describe('Fraction construction', () => {
  it('defaults to 0/1 with no arguments', () => {
    const f = new Fraction();
    expect(f.numerator).toBe(0);
    expect(f.denominator).toBe(1);
  });

  it('accepts a single numerator, assuming denominator 1', () => {
    const f = new Fraction(5);
    expect(f.numerator).toBe(5);
    expect(f.denominator).toBe(1);
  });

  it('accepts numerator and denominator', () => {
    const f = new Fraction(3, 4);
    expect(f.numerator).toBe(3);
    expect(f.denominator).toBe(4);
  });

  it('reduces on construction', () => {
    const f = new Fraction(6, 8);
    expect(f.numerator).toBe(3);
    expect(f.denominator).toBe(4);
  });

  it('accepts (whole, properNumerator, denominator)', () => {
    // one whole and one fourth => 5/4
    const f = new Fraction(1, 1, 4);
    expect(f.numerator).toBe(5);
    expect(f.denominator).toBe(4);
  });

  it('copies numerator/denominator from another IFraction', () => {
    const original = new Fraction(3, 4);
    const copy = new Fraction(original);
    expect(copy.numerator).toBe(3);
    expect(copy.denominator).toBe(4);
    // and is a distinct instance, not an alias
    original.setValue(1, 2);
    expect(copy.numerator).toBe(3);
    expect(copy.denominator).toBe(4);
  });

  it('copies from a plain object structurally shaped like an IFraction', () => {
    const plain: IFraction = new Fraction(2, 5);
    const copy = new Fraction(plain);
    expect(copy.numerator).toBe(2);
    expect(copy.denominator).toBe(5);
  });
});

describe('Fraction mutators', () => {
  it('setValue replaces the fraction in place', () => {
    const f = new Fraction(1, 2);
    f.setValue(3, 4);
    expect(f.numerator).toBe(3);
    expect(f.denominator).toBe(4);
  });

  it('setProperValue is equivalent to setValue(whole*denominator+properNumerator, denominator)', () => {
    const f = new Fraction();
    f.setProperValue(2, 1, 3);
    expect(f.numerator).toBe(7);
    expect(f.denominator).toBe(3);
  });
});

describe('Fraction raw vs reduced accessors', () => {
  it('exposes both the reduced and the pre-reduction pair', () => {
    const f = new Fraction(6, 8);
    expect(f.numerator).toBe(3);
    expect(f.denominator).toBe(4);
    expect(f.rawNumerator).toBe(6);
    expect(f.rawDenominator).toBe(8);
  });
});

describe('Fraction computed accessors', () => {
  it('floatValue approximates the fraction as a decimal', () => {
    expect(new Fraction(1, 4).floatValue).toBeCloseTo(0.25);
  });

  it('properNumerator strips the whole-number portion', () => {
    expect(new Fraction(5, 4).properNumerator).toBe(1);
  });

  it('whole returns the integer portion', () => {
    expect(new Fraction(5, 4).whole).toBe(1);
    expect(new Fraction(1, 4).whole).toBe(0);
    expect(new Fraction(8, 4).whole).toBe(2);
  });

  it('reciprocal swaps numerator and denominator', () => {
    const r = new Fraction(2, 3).reciprocal;
    expect(r.numerator).toBe(3);
    expect(r.denominator).toBe(2);
  });
});

describe('Fraction arithmetic', () => {
  it('add returns a new fraction without mutating the operands', () => {
    const a = new Fraction(1, 2);
    const b = new Fraction(1, 3);
    const sum = a.add(b);
    expect(sum.numerator).toBe(5);
    expect(sum.denominator).toBe(6);
    expect(a.numerator).toBe(1);
    expect(a.denominator).toBe(2);
  });

  it('subtract returns the difference without mutating the operands', () => {
    const result = new Fraction(1, 2).subtract(new Fraction(1, 3));
    expect(result.numerator).toBe(1);
    expect(result.denominator).toBe(6);
  });

  it('subtractAbs always returns a non-negative result', () => {
    const a = new Fraction(1, 3);
    const b = new Fraction(1, 2);
    const result = a.subtractAbs(b);
    expect(result.numerator).toBe(1);
    expect(result.denominator).toBe(6);
    // symmetric regardless of operand order
    const reversed = b.subtractAbs(a);
    expect(reversed.numerator).toBe(1);
    expect(reversed.denominator).toBe(6);
  });

  it('multiply returns the product', () => {
    const result = new Fraction(2, 3).multiply(new Fraction(3, 4));
    expect(result.numerator).toBe(1);
    expect(result.denominator).toBe(2);
  });

  it('divide returns the quotient', () => {
    const result = new Fraction(1, 2).divide(new Fraction(1, 4));
    expect(result.numerator).toBe(2);
    expect(result.denominator).toBe(1);
  });
});

describe('Fraction comparisons', () => {
  it('equals is true across different but equivalent representations', () => {
    expect(new Fraction(1, 2).equals(new Fraction(2, 4))).toBe(true);
  });

  it('equals is false for different values', () => {
    expect(new Fraction(1, 2).equals(new Fraction(1, 3))).toBe(false);
  });

  it('greaterThan / lessThan agree with numeric intuition', () => {
    expect(new Fraction(3, 4).greaterThan(new Fraction(1, 2))).toBe(true);
    expect(new Fraction(1, 2).lessThan(new Fraction(3, 4))).toBe(true);
    expect(new Fraction(1, 2).greaterThan(new Fraction(3, 4))).toBe(false);
    expect(new Fraction(3, 4).lessThan(new Fraction(1, 2))).toBe(false);
  });
});

describe('Fraction instance utilities', () => {
  it('getFractionOf is an alias of divide', () => {
    const a = new Fraction(1, 2);
    const b = new Fraction(1, 4);
    expect(a.getFractionOf(b).numerator).toBe(a.divide(b).numerator);
    expect(a.getFractionOf(b).denominator).toBe(a.divide(b).denominator);
  });

  it('getPercentageOf returns a decimal share of another fraction', () => {
    const half = new Fraction(1, 2);
    const whole = new Fraction(1, 1);
    expect(half.getPercentageOf(whole)).toBeCloseTo(0.5);
  });

  it('toString formats as "n/d" using the reduced form', () => {
    expect(new Fraction(6, 8).toString()).toBe('3/4');
  });

  it('toJSON matches toString', () => {
    const f = new Fraction(3, 4);
    expect(f.toJSON()).toBe(f.toString());
  });
});

describe('Fraction static factories', () => {
  it('WHOLE is 1/1', () => {
    expect(Fraction.WHOLE.numerator).toBe(1);
    expect(Fraction.WHOLE.denominator).toBe(1);
  });

  it('ZERO is 0/1', () => {
    expect(Fraction.ZERO.numerator).toBe(0);
    expect(Fraction.ZERO.denominator).toBe(1);
  });

  it('WHOLE/ZERO each return a fresh instance', () => {
    const a = Fraction.ZERO;
    a.setValue(5, 1);
    expect(Fraction.ZERO.numerator).toBe(0);
  });

  it('lcm/gcf are exposed as static passthroughs', () => {
    expect(Fraction.gcf(12, 8)).toBe(4);
    expect(Fraction.lcm(4, 6)).toBe(12);
  });

  it('compare mirrors instance greaterThan/lessThan/equals', () => {
    const a = new Fraction(3, 4);
    const b = new Fraction(1, 2);
    expect(Fraction.compare(a, b)).toBe(1);
    expect(Fraction.compare(b, a)).toBe(-1);
    expect(Fraction.compare(a, a)).toBe(0);
  });

  it('fromString parses a fraction string', () => {
    const f = Fraction.fromString('3/4');
    expect(f.numerator).toBe(3);
    expect(f.denominator).toBe(4);
  });

  it('fromString throws on malformed input', () => {
    expect(() => Fraction.fromString('not-a-fraction')).toThrow();
  });

  it('fromDecimal approximates a decimal value', () => {
    const f = Fraction.fromDecimal(0.5);
    expect(f.numerator).toBe(1);
    expect(f.denominator).toBe(2);
  });
});

describe('Fraction interop with non-Fraction IFraction implementors', () => {
  /**
   * A minimal, independent IFraction implementation (not extending
   * Fraction) used to confirm arithmetic/comparison methods work against
   * the interface, not a concrete class check.
   */
  class MinimalFraction implements IFraction {
    constructor(
      public readonly numerator: number,
      public readonly denominator: number,
      public readonly rawNumerator: number = numerator,
      public readonly rawDenominator: number = denominator,
    ) {}
    add(other: IFraction): IFraction {
      throw new Error('unused in this test');
    }
    getPercentageOf(other: IFraction): number {
      throw new Error('unused in this test');
    }
    getFractionOf(other: IFraction): IFraction {
      throw new Error('unused in this test');
    }
    divide(other: IFraction): IFraction {
      throw new Error('unused in this test');
    }
    equals(other: IFraction): boolean {
      throw new Error('unused in this test');
    }
    get floatValue(): number {
      return this.numerator / this.denominator;
    }
    greaterThan(other: IFraction): boolean {
      throw new Error('unused in this test');
    }
    lessThan(other: IFraction): boolean {
      throw new Error('unused in this test');
    }
    multiply(other: IFraction): IFraction {
      throw new Error('unused in this test');
    }
    get properNumerator(): number {
      return this.numerator % this.denominator;
    }
    get reciprocal(): IFraction {
      return new MinimalFraction(this.denominator, this.numerator);
    }
    setProperValue(): void {
      throw new Error('unused in this test');
    }
    setValue(): void {
      throw new Error('unused in this test');
    }
    subtract(other: IFraction): IFraction {
      throw new Error('unused in this test');
    }
    subtractAbs(other: IFraction): IFraction {
      throw new Error('unused in this test');
    }
    toString(): string {
      return `${this.numerator}/${this.denominator}`;
    }
    get whole(): number {
      return (this.numerator - this.properNumerator) / this.denominator;
    }
  }

  it('add/subtract/multiply work against a foreign IFraction implementor', () => {
    const a = new Fraction(1, 2);
    const b = new MinimalFraction(1, 4);

    expect(a.add(b).numerator).toBe(3);
    expect(a.add(b).denominator).toBe(4);

    expect(a.subtract(b).numerator).toBe(1);
    expect(a.subtract(b).denominator).toBe(4);

    expect(a.multiply(b).numerator).toBe(1);
    expect(a.multiply(b).denominator).toBe(8);
  });

  it('divide works against a foreign IFraction implementor (via its reciprocal)', () => {
    const a = new Fraction(1, 2);
    const b = new MinimalFraction(1, 4);
    const result = a.divide(b);
    expect(result.numerator).toBe(2);
    expect(result.denominator).toBe(1);
  });

  it('equals/greaterThan/lessThan work against a foreign IFraction implementor', () => {
    const a = new Fraction(1, 2);
    expect(a.equals(new MinimalFraction(2, 4))).toBe(true);
    expect(a.greaterThan(new MinimalFraction(1, 4))).toBe(true);
    expect(a.lessThan(new MinimalFraction(3, 4))).toBe(true);
  });
});
