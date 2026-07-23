import { describe, expect, it } from 'vitest';
import { BarTypes, getAllTypes } from '../../../src/generators/constants/BarTypes.js';

describe('BarTypes', () => {
  it('defines the 4 bar type symbols', () => {
    expect(BarTypes).toEqual({
      NORMAL_BAR: '◊',
      DOUBLE_BAR: 'þ',
      FINAL_BAR: 'ÿ',
      AUTO_BAR: '≉',
    });
  });
});

describe('getAllTypes', () => {
  it('returns all 4 types, auto-bar first (matching the original explicit ordering)', () => {
    expect(getAllTypes()).toEqual([
      BarTypes.AUTO_BAR,
      BarTypes.NORMAL_BAR,
      BarTypes.DOUBLE_BAR,
      BarTypes.FINAL_BAR,
    ]);
  });
});
