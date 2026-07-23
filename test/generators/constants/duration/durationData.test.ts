import { describe, expect, it } from 'vitest';
import { CompoundTimeSignatures } from '../../../../src/generators/constants/duration/CompoundTimeSignatures.js';
import { DivisionTypes } from '../../../../src/generators/constants/duration/DivisionTypes.js';
import { DivisionsEquivalency } from '../../../../src/generators/constants/duration/DivisionsEquivalency.js';
import { DivisionsUsedInCompoundSignatures } from '../../../../src/generators/constants/duration/DivisionsUsedInCompoundSignatures.js';
import { DivisionsUsedInSimpleSignatures } from '../../../../src/generators/constants/duration/DivisionsUsedInSimpleSignatures.js';
import { DotTypes } from '../../../../src/generators/constants/duration/DotTypes.js';
import { DurationSymbols } from '../../../../src/generators/constants/duration/DurationSymbols.js';
import { Tuplets } from '../../../../src/generators/constants/duration/Tuplets.js';

describe('CompoundTimeSignatures', () => {
  it('pairs each name with its [numerator, denominator]', () => {
    expect(CompoundTimeSignatures.SIX_BY_EIGHT).toEqual([6, 8]);
    expect(CompoundTimeSignatures.TWELVE_BY_FOUR).toEqual([12, 4]);
    expect(Object.keys(CompoundTimeSignatures)).toHaveLength(12);
  });
});

describe('DivisionTypes', () => {
  it('has 10 members, spot-checked', () => {
    expect(Object.keys(DivisionTypes)).toHaveLength(10);
    expect(DivisionTypes.REGULAR).toBe('none/regular');
    expect(DivisionTypes.TRIPLET).toBe('triplet');
  });
});

describe('DivisionsEquivalency', () => {
  it('has 14 members, spot-checked', () => {
    expect(Object.keys(DivisionsEquivalency)).toHaveLength(14);
    expect(DivisionsEquivalency.DUPLET).toBe('2/3');
    expect(DivisionsEquivalency.UNDECTUPLET_FOR_THREE).toBe('11/3');
  });
});

describe('DivisionsUsedInCompoundSignatures', () => {
  it('has 8 members, spot-checked', () => {
    expect(Object.keys(DivisionsUsedInCompoundSignatures)).toHaveLength(8);
    expect(DivisionsUsedInCompoundSignatures.QUINTUPLET).toBe('QUINTUPLET_FOR_THREE');
  });
});

describe('DivisionsUsedInSimpleSignatures', () => {
  it('has 7 members, spot-checked', () => {
    expect(Object.keys(DivisionsUsedInSimpleSignatures)).toHaveLength(7);
    expect(DivisionsUsedInSimpleSignatures.QUINTUPLET).toBe('QUINTUPLET_FOR_FOUR');
  });
});

describe('DotTypes', () => {
  it('defines NONE, SINGLE, DOUBLE as fraction strings', () => {
    expect(DotTypes).toEqual({ NONE: '0/1', SINGLE: '1/2', DOUBLE: '3/4' });
  });
});

describe('DurationSymbols', () => {
  it('has 7 members (HUNDREDTWENTYEIGHTH intentionally omitted, matching the original TODO)', () => {
    expect(Object.keys(DurationSymbols)).toHaveLength(7);
    expect(DurationSymbols.WHOLE).toBe('ó');
  });
});

describe('Tuplets', () => {
  it('defines MAX_SRC_NUM_BEATS and MAX_TARGET_NUM_BEATS', () => {
    expect(Tuplets.MAX_SRC_NUM_BEATS).toBe(21);
    expect(Tuplets.MAX_TARGET_NUM_BEATS).toBe(12);
  });
});
