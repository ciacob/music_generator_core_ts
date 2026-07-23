import { describe, expect, it } from 'vitest';
import {
  addRaw,
  compare,
  divideRaw,
  equalsValue,
  fromDecimal,
  fromString,
  gcf,
  greaterThanValue,
  lcm,
  lessThanValue,
  multiplyRaw,
  normalize,
  reciprocalOf,
  subtractRaw,
  toStringValue,
  type NormalizedFraction,
} from '../../src/math/fractionMath.js';

/** Convenience: build a normalized fraction directly from a raw pair. */
const n = (numerator: number, denominator: number): NormalizedFraction =>
  normalize(numerator, denominator);

describe('gcf', () => {
  it('finds the greatest common factor of two positive numbers', () => {
    expect(gcf(12, 8)).toBe(4);
    expect(gcf(8, 12)).toBe(4);
  });

  it('returns the non-zero operand when the other is 0', () => {
    expect(gcf(0, 5)).toBe(5);
    expect(gcf(5, 0)).toBe(5);
  });

  it('is 1 for coprime numbers', () => {
    expect(gcf(9, 28)).toBe(1);
  });

  it('treats inputs by absolute value', () => {
    expect(gcf(-12, 8)).toBe(4);
    expect(gcf(12, -8)).toBe(4);
    expect(gcf(-12, -8)).toBe(4);
  });
});

describe('lcm', () => {
  it('finds the lowest common multiple of two numbers', () => {
    expect(lcm(4, 6)).toBe(12);
    expect(lcm(3, 7)).toBe(21);
  });

  it('is the larger number when one divides the other', () => {
    expect(lcm(3, 9)).toBe(9);
  });
});

describe('normalize', () => {
  it('reduces a numerator/denominator pair by their GCF', () => {
    const v = normalize(6, 8);
    expect(v.numerator).toBe(3);
    expect(v.denominator).toBe(4);
  });

  it('preserves the pre-reduction pair as rawNumerator/rawDenominator', () => {
    const v = normalize(6, 8);
    expect(v.rawNumerator).toBe(6);
    expect(v.rawDenominator).toBe(8);
  });

  it('leaves an already-reduced pair untouched (raw === reduced)', () => {
    const v = normalize(3, 4);
    expect(v).toEqual({ numerator: 3, denominator: 4, rawNumerator: 3, rawDenominator: 4 });
  });

  it('collapses a zero numerator to 0/1', () => {
    expect(normalize(0, 5)).toEqual({
      numerator: 0,
      denominator: 1,
      rawNumerator: 0,
      rawDenominator: 1,
    });
  });

  it('collapses a zero denominator to 0/1', () => {
    expect(normalize(7, 0)).toEqual({
      numerator: 0,
      denominator: 1,
      rawNumerator: 0,
      rawDenominator: 1,
    });
  });

  it('moves a negative sign from the denominator onto the numerator', () => {
    const v = normalize(3, -4);
    expect(v.numerator).toBe(-3);
    expect(v.denominator).toBe(4);
    expect(v.rawNumerator).toBe(-3);
    expect(v.rawDenominator).toBe(4);
  });

  it('keeps a negative numerator negative when the denominator is positive', () => {
    const v = normalize(-3, 4);
    expect(v.numerator).toBe(-3);
    expect(v.denominator).toBe(4);
  });

  it('cancels out when both numerator and denominator are negative', () => {
    const v = normalize(-3, -4);
    expect(v.numerator).toBe(3);
    expect(v.denominator).toBe(4);
  });
});

describe('addRaw', () => {
  it('adds two fractions with different denominators', () => {
    const result = addRaw(n(1, 2), n(1, 3));
    expect(result.numerator).toBe(5);
    expect(result.denominator).toBe(6);
  });

  it('adds two fractions with the same denominator', () => {
    const result = addRaw(n(1, 4), n(2, 4));
    expect(result.numerator).toBe(3);
    expect(result.denominator).toBe(4);
  });

  it('reduces the result when possible', () => {
    const result = addRaw(n(1, 6), n(1, 3));
    expect(result.numerator).toBe(1);
    expect(result.denominator).toBe(2);
  });

  it('combines using the raw (unreduced) operand pairs', () => {
    // 2/4 (raw) + 1/4 = 3/4, whereas naively using the already-reduced
    // 1/2 would still land on the same *value* here, but this test locks
    // in that rawNumerator/rawDenominator (not numerator/denominator) are
    // what feed the combination, matching the AS3 source.
    const unreduced: NormalizedFraction = { numerator: 1, denominator: 2, rawNumerator: 2, rawDenominator: 4 };
    const result = addRaw(unreduced, n(1, 4));
    expect(result.numerator).toBe(3);
    expect(result.denominator).toBe(4);
  });
});

describe('subtractRaw', () => {
  it('subtracts two fractions with different denominators', () => {
    const result = subtractRaw(n(1, 2), n(1, 3));
    expect(result.numerator).toBe(1);
    expect(result.denominator).toBe(6);
  });

  it('produces a negative numerator when the result is negative', () => {
    const result = subtractRaw(n(1, 3), n(1, 2));
    expect(result.numerator).toBe(-1);
    expect(result.denominator).toBe(6);
  });

  it('yields 0/1 when subtracting an equal fraction', () => {
    const result = subtractRaw(n(2, 4), n(1, 2));
    expect(result).toEqual({ numerator: 0, denominator: 1, rawNumerator: 0, rawDenominator: 1 });
  });
});

describe('multiplyRaw', () => {
  it('multiplies two fractions', () => {
    const result = multiplyRaw(n(2, 3), n(3, 4));
    expect(result.numerator).toBe(1);
    expect(result.denominator).toBe(2);
  });

  it('multiplying by zero yields 0/1', () => {
    const result = multiplyRaw(n(2, 3), n(0, 1));
    expect(result).toEqual({ numerator: 0, denominator: 1, rawNumerator: 0, rawDenominator: 1 });
  });
});

describe('reciprocalOf', () => {
  it('swaps numerator and denominator', () => {
    const result = reciprocalOf(n(2, 3));
    expect(result.numerator).toBe(3);
    expect(result.denominator).toBe(2);
  });

  it('is its own inverse', () => {
    const original = n(5, 7);
    const twice = reciprocalOf(reciprocalOf(original));
    expect(twice.numerator).toBe(original.numerator);
    expect(twice.denominator).toBe(original.denominator);
  });
});

describe('divideRaw', () => {
  it('divides two fractions', () => {
    const result = divideRaw(n(1, 2), n(1, 4));
    expect(result.numerator).toBe(2);
    expect(result.denominator).toBe(1);
  });

  it('dividing a fraction by itself yields 1/1', () => {
    const result = divideRaw(n(3, 5), n(3, 5));
    expect(result.numerator).toBe(1);
    expect(result.denominator).toBe(1);
  });
});

describe('compare', () => {
  it('returns 1 when a > b', () => {
    expect(compare(n(3, 4), n(1, 2))).toBe(1);
  });

  it('returns -1 when a < b', () => {
    expect(compare(n(1, 2), n(3, 4))).toBe(-1);
  });

  it('returns 0 when a === b, even with different denominators', () => {
    expect(compare(n(1, 2), n(2, 4))).toBe(0);
  });
});

describe('equalsValue / greaterThanValue / lessThanValue', () => {
  it('agree with compare()', () => {
    expect(equalsValue(n(1, 2), n(2, 4))).toBe(true);
    expect(greaterThanValue(n(3, 4), n(1, 2))).toBe(true);
    expect(lessThanValue(n(1, 2), n(3, 4))).toBe(true);
    expect(equalsValue(n(1, 2), n(1, 3))).toBe(false);
    expect(greaterThanValue(n(1, 2), n(3, 4))).toBe(false);
    expect(lessThanValue(n(3, 4), n(1, 2))).toBe(false);
  });
});

describe('toStringValue', () => {
  it('formats the reduced numerator/denominator as "n/d"', () => {
    expect(toStringValue(n(6, 8))).toBe('3/4');
  });

  it('formats zero as "0/1"', () => {
    expect(toStringValue(n(0, 9))).toBe('0/1');
  });
});

describe('fromString', () => {
  it('parses a simple fraction string', () => {
    const v = fromString('1/4');
    expect(v.numerator).toBe(1);
    expect(v.denominator).toBe(4);
  });

  it('reduces the parsed value', () => {
    const v = fromString('6/8');
    expect(v.numerator).toBe(3);
    expect(v.denominator).toBe(4);
  });

  it('round-trips through toStringValue', () => {
    const original = n(5, 7);
    const roundTripped = fromString(toStringValue(original));
    expect(roundTripped).toEqual(original);
  });

  it('throws on a value with no slash', () => {
    expect(() => fromString('14')).toThrow();
  });

  it('throws on a value with too many segments', () => {
    expect(() => fromString('1/2/3')).toThrow();
  });

  it('throws on a negative numerator', () => {
    expect(() => fromString('-1/4')).toThrow();
  });

  it('throws on a negative denominator', () => {
    expect(() => fromString('1/-4')).toThrow();
  });

  it('throws on a non-numeric segment', () => {
    expect(() => fromString('a/b')).toThrow();
  });
});

describe('fromDecimal', () => {
  it('approximates 0.5 as 1/2', () => {
    const v = fromDecimal(0.5);
    expect(v.numerator).toBe(1);
    expect(v.denominator).toBe(2);
  });

  it('approximates 0.25 as 1/4', () => {
    const v = fromDecimal(0.25);
    expect(v.numerator).toBe(1);
    expect(v.denominator).toBe(4);
  });

  it('approximates 0.75 as 3/4', () => {
    const v = fromDecimal(0.75);
    expect(v.numerator).toBe(3);
    expect(v.denominator).toBe(4);
  });

  it('treats a whole number decimal as itself over 1', () => {
    const v = fromDecimal(2);
    expect(v.numerator).toBe(2);
    expect(v.denominator).toBe(1);
  });
});
