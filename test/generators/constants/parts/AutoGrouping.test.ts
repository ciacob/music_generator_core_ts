import { describe, expect, it } from 'vitest';
import {
  ELLIGIBLE_FAMILIES,
  isPartFamilyElligible,
} from '../../../../src/generators/constants/parts/AutoGrouping.js';

describe('ELLIGIBLE_FAMILIES', () => {
  it('lists BOWED_STRINGS, BRASS, WOODWINDS', () => {
    expect(ELLIGIBLE_FAMILIES).toEqual(['BOWED_STRINGS', 'BRASS', 'WOODWINDS']);
  });
});

describe('isPartFamilyElligible', () => {
  it('is true for a bowed string instrument', () => {
    expect(isPartFamilyElligible('VIOLIN')).toBe(true);
  });

  it('is true for a brass instrument', () => {
    expect(isPartFamilyElligible('TRUMPET')).toBe(true);
  });

  it('is true for a woodwind instrument', () => {
    expect(isPartFamilyElligible('FLUTE')).toBe(true);
  });

  it('is false for a keyboard instrument (not an eligible family)', () => {
    expect(isPartFamilyElligible('PIANO')).toBe(false);
  });

  it('is false for an unrecognized instrument', () => {
    expect(isPartFamilyElligible('KAZOO')).toBe(false);
  });
});
