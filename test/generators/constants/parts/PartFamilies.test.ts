import { describe, expect, it } from 'vitest';
import {
  OTHER_INSTRUMENTS,
  PartFamilies,
  getAllFamilies,
  getPartFamily,
  haveSameFamily,
} from '../../../../src/generators/constants/parts/PartFamilies.js';

describe('PartFamilies', () => {
  it('defines 6 families', () => {
    expect(Object.keys(PartFamilies)).toHaveLength(6);
  });

  it('does not include OTHER_INSTRUMENTS as a family member', () => {
    expect(Object.keys(PartFamilies)).not.toContain('OTHER_INSTRUMENTS');
  });
});

describe('getAllFamilies', () => {
  it('returns all 6 family names', () => {
    expect(getAllFamilies()).toHaveLength(6);
    expect(getAllFamilies()).toContain('BOWED_STRINGS');
  });

  it('returns the same cached array across repeated calls', () => {
    expect(getAllFamilies()).toBe(getAllFamilies());
  });
});

describe('getPartFamily', () => {
  it('matches VIOLIN to BOWED_STRINGS', () => {
    expect(getPartFamily('VIOLIN')).toBe('BOWED_STRINGS');
  });

  it('matches TRUMPET to BRASS', () => {
    expect(getPartFamily('TRUMPET')).toBe('BRASS');
  });

  it('matches a multi-word instrument (FRENCH_HORNS) correctly', () => {
    expect(getPartFamily('FRENCH_HORNS')).toBe('BRASS');
  });

  it('matches PIANO to KEYBOARDS', () => {
    expect(getPartFamily('PIANO')).toBe('KEYBOARDS');
  });

  it('returns OTHER_INSTRUMENTS for an unrecognized instrument', () => {
    expect(getPartFamily('KAZOO')).toBe(OTHER_INSTRUMENTS);
  });

  it('caches results across repeated calls for the same part', () => {
    const first = getPartFamily('CELLO');
    const second = getPartFamily('CELLO');
    expect(first).toBe('BOWED_STRINGS');
    expect(second).toBe('BOWED_STRINGS');
  });
});

describe('haveSameFamily', () => {
  it('is true when all parts share a family', () => {
    expect(haveSameFamily(['VIOLIN', 'VIOLA', 'CELLO'])).toBe(true);
  });

  it('is false when parts belong to different families', () => {
    expect(haveSameFamily(['VIOLIN', 'TRUMPET'])).toBe(false);
  });

  it('is false if any part is OTHER_INSTRUMENTS-classified', () => {
    expect(haveSameFamily(['VIOLIN', 'KAZOO'])).toBe(false);
  });

  it('is false for an empty or null list', () => {
    expect(haveSameFamily([])).toBe(false);
    expect(haveSameFamily(null)).toBe(false);
    expect(haveSameFamily(undefined)).toBe(false);
  });

  it('is false if any part name is falsy', () => {
    expect(haveSameFamily(['VIOLIN', ''])).toBe(false);
  });

  it('is true for a single part', () => {
    expect(haveSameFamily(['VIOLIN'])).toBe(true);
  });
});
