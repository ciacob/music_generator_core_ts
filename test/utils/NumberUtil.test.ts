import { describe, expect, it } from 'vitest';
import { getRandomInteger, getTriangularNumber, isPowerOfTwo } from '../../src/utils/NumberUtil.js';

describe('getRandomInteger', () => {
  it('returns limitA when the injected RNG returns 0', () => {
    expect(getRandomInteger(3, 5, () => 0)).toBe(3);
  });

  it('returns the highest value in range as the RNG approaches 1', () => {
    expect(getRandomInteger(3, 5, () => 0.9999999)).toBe(5);
  });

  it('is order-independent (limitA/limitB can be swapped)', () => {
    expect(getRandomInteger(5, 3, () => 0)).toBe(3);
    expect(getRandomInteger(5, 3, () => 0.9999999)).toBe(5);
  });

  it('handles a single-value interval', () => {
    expect(getRandomInteger(4, 4, () => 0.5)).toBe(4);
  });

  it('defaults to Math.random when no RNG is provided', () => {
    const result = getRandomInteger(1, 1);
    expect(result).toBe(1);
  });

  it('covers the full closed interval across the RNG range', () => {
    const results = new Set<number>();
    for (let i = 0; i < 100; i++) {
      results.add(getRandomInteger(1, 3, () => i / 100));
    }
    expect(results).toEqual(new Set([1, 2, 3]));
  });
});

describe('getTriangularNumber', () => {
  it('computes n(n+1)/2', () => {
    expect(getTriangularNumber(0)).toBe(0);
    expect(getTriangularNumber(1)).toBe(1);
    expect(getTriangularNumber(4)).toBe(10);
    expect(getTriangularNumber(10)).toBe(55);
  });
});

describe('isPowerOfTwo', () => {
  it('is true for powers of two', () => {
    for (const value of [1, 2, 4, 8, 16, 1024]) {
      expect(isPowerOfTwo(value)).toBe(true);
    }
  });

  it('is false for non-powers of two', () => {
    for (const value of [3, 5, 6, 7, 9, 100]) {
      expect(isPowerOfTwo(value)).toBe(false);
    }
  });
});
