import { describe, expect, it } from 'vitest';
import {
  PartEnsembleSizes,
  getAllNamesOrdered,
  getNameBySize,
} from '../../../../src/generators/constants/parts/PartEnsembleSizes.js';

describe('PartEnsembleSizes', () => {
  it('has 10 members', () => {
    expect(Object.keys(PartEnsembleSizes)).toHaveLength(10);
    expect(PartEnsembleSizes['SOLO$']).toBe(1);
    expect(PartEnsembleSizes['$CHAMBER']).toBe(10);
  });
});

describe('getAllNamesOrdered', () => {
  it('returns all 10 names sorted ascending by size', () => {
    const names = getAllNamesOrdered();
    expect(names).toHaveLength(10);
    expect(names[0]).toBe('SOLO$');
    expect(names[names.length - 1]).toBe('$CHAMBER');
  });
});

describe('getNameBySize', () => {
  it('finds the exact size match', () => {
    expect(getNameBySize(3)).toBe('TRIO$');
  });

  it('finds the largest defined size that is <= the given size', () => {
    // 15 is beyond any defined size except $CHAMBER (10), which should win.
    expect(getNameBySize(15)).toBe('$CHAMBER');
  });

  it('returns null when size is smaller than every defined size', () => {
    expect(getNameBySize(0)).toBeNull();
  });
});
