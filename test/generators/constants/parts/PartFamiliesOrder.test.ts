import { describe, expect, it } from 'vitest';
import { PartFamiliesOrder, getPartIndex } from '../../../../src/generators/constants/parts/PartFamiliesOrder.js';

describe('PartFamiliesOrder', () => {
  it('orders keyboards first and other-instruments last', () => {
    expect(PartFamiliesOrder.KEYBOARDS).toBe(0);
    expect(PartFamiliesOrder.OTHER_INSTRUMENTS).toBe(900);
  });
});

describe('getPartIndex', () => {
  it('combines the family order with the part-within-family position', () => {
    // BOWED_STRINGS order is 100; VIOLIN is index 0 within that family.
    expect(getPartIndex('BOWED_STRINGS', 'Violin')).toBe(100);
    // VIOLA is index 1 within BOWED_STRINGS.
    expect(getPartIndex('BOWED_STRINGS', 'Viola')).toBe(101);
  });

  it('orders parts across families consistently with the family order', () => {
    const pianoIndex = getPartIndex('KEYBOARDS', 'Piano');
    const violinIndex = getPartIndex('BOWED_STRINGS', 'Violin');
    expect(pianoIndex).toBeLessThan(violinIndex);
  });

  it('returns just the generic family index when the part is not found in the family', () => {
    expect(getPartIndex('BOWED_STRINGS', 'Unknown Part')).toBe(100 - 1);
  });

  it('returns 0 for an unrecognized family name', () => {
    expect(getPartIndex('NOT_A_FAMILY', 'Violin')).toBe(0);
  });
});
