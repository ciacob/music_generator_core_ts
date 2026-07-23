import { describe, expect, it } from 'vitest';
import {
  PartAbbreviatedVoiceNames,
  getNames,
} from '../../../../src/generators/constants/parts/PartAbbreviatedVoiceNames.js';

describe('PartAbbreviatedVoiceNames data', () => {
  it('aliases HARPSICHORD to the same array as PIANO', () => {
    expect(PartAbbreviatedVoiceNames.HARPSICHORD).toBe(PartAbbreviatedVoiceNames.PIANO);
  });
});

describe('getNames', () => {
  it('looks up a bare part name case-insensitively (via AS3-constant-case conversion)', () => {
    expect(getNames('piano')).toEqual(['R.H.', 'L.H.']);
    expect(getNames('Piano')).toEqual(['R.H.', 'L.H.']);
  });

  it('looks up a part+numStaves variant', () => {
    expect(getNames('organ', 3)).toEqual(['(Org.) R.H.', 'L.H.', 'Ped.']);
  });

  it('returns null for a name with no matching entry', () => {
    expect(getNames('kazoo')).toBeNull();
  });

  it('returns null when numStaves does not match a defined variant', () => {
    expect(getNames('piano', 99)).toBeNull();
  });
});
