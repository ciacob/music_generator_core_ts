import { describe, expect, it } from 'vitest';
import { getAllNames, getAllValues } from '../../src/utils/ConstantUtils.js';

const sampleConstants = {
  ZEBRA: 'z',
  APPLE: 'a',
  MANGO: 'm',
};

describe('getAllNames', () => {
  it('returns all keys, alphabetically sorted', () => {
    expect(getAllNames(sampleConstants)).toEqual(['APPLE', 'MANGO', 'ZEBRA']);
  });

  it('returns an empty array for an empty object', () => {
    expect(getAllNames({})).toEqual([]);
  });
});

describe('getAllValues', () => {
  it('returns all values, lexicographically sorted (matching default Array.sort semantics)', () => {
    expect(getAllValues(sampleConstants)).toEqual(['a', 'm', 'z']);
  });

  it('sorts numeric values lexicographically, not numerically (matching AS3 default sort)', () => {
    expect(getAllValues({ A: 10, B: 2, C: 1 })).toEqual([1, 10, 2]);
  });

  it('returns an empty array for an empty object', () => {
    expect(getAllValues({})).toEqual([]);
  });
});
