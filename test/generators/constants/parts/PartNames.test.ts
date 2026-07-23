import { describe, expect, it } from 'vitest';
import { PartNames } from '../../../../src/generators/constants/parts/PartNames.js';
import {
  comparePartsByFamilies,
  getAllPartNames,
} from '../../../../src/generators/constants/parts/PartOrdering.js';

describe('PartNames', () => {
  it('has 28 members', () => {
    expect(Object.keys(PartNames)).toHaveLength(28);
    expect(PartNames.PIANO).toBe('Piano');
  });
});

describe('comparePartsByFamilies', () => {
  it('orders keyboards before bowed strings', () => {
    expect(comparePartsByFamilies(PartNames.PIANO, PartNames.VIOLIN)).toBeLessThan(0);
  });

  it('orders violin before viola within bowed strings', () => {
    expect(comparePartsByFamilies(PartNames.VIOLIN, PartNames.VIOLA)).toBeLessThan(0);
  });

  it('returns 0 for the same part', () => {
    expect(comparePartsByFamilies(PartNames.PIANO, PartNames.PIANO)).toBe(0);
  });
});

describe('getAllPartNames', () => {
  it('returns all 28 part names', () => {
    expect(getAllPartNames()).toHaveLength(28);
  });

  it('orders keyboards before bowed strings before woodwinds before brass', () => {
    const all = getAllPartNames();
    const pianoIndex = all.indexOf(PartNames.PIANO);
    const violinIndex = all.indexOf(PartNames.VIOLIN);
    const trumpetIndex = all.indexOf(PartNames.TRUMPET);
    expect(pianoIndex).toBeLessThan(violinIndex);
    expect(violinIndex).toBeLessThan(trumpetIndex);
  });
});
