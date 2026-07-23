import { describe, expect, it } from 'vitest';
import { ClefTypes, getAllTypes } from '../../../src/generators/constants/ClefTypes.js';

describe('ClefTypes', () => {
  it('defines the 6 clef symbols', () => {
    expect(ClefTypes).toEqual({
      BASS: '±',
      TREBLE: 'Ø',
      TENOR: '¥',
      TENOR_MODERN: '≤',
      CONTRABASS: '≥',
      ALTO: '∞',
    });
  });
});

describe('getAllTypes', () => {
  it('returns all 6 clef symbols, alphabetically sorted (via ConstantUtils.getAllValues)', () => {
    const result = getAllTypes();
    expect(result).toHaveLength(6);
    expect(result).toEqual([...result].sort());
    expect(result).toContain(ClefTypes.TREBLE);
    expect(result).toContain(ClefTypes.BASS);
  });
});
