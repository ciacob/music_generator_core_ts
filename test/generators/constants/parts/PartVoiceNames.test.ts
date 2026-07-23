import { describe, expect, it } from 'vitest';
import { PartVoiceNames, getNames } from '../../../../src/generators/constants/parts/PartVoiceNames.js';

describe('PartVoiceNames data', () => {
  it('aliases HARPSICHORD to the same array as PIANO', () => {
    expect(PartVoiceNames.HARPSICHORD).toBe(PartVoiceNames.PIANO);
  });
});

describe('getNames', () => {
  it('looks up a bare part name', () => {
    expect(getNames('piano')).toEqual(['Right Hand', 'Left Hand']);
  });

  it('looks up a part+numStaves variant', () => {
    expect(getNames('choir', 3)).toEqual(['Soprano', 'Alto', 'Tenor/Bass ']);
    expect(getNames('organ', 5)).toEqual([
      '(Organ) Right Hand I',
      'Right Hand II',
      'Left Hand I',
      'Left Hand II',
      'Pedal',
    ]);
  });

  it('returns null for an unrecognized part', () => {
    expect(getNames('kazoo')).toBeNull();
  });
});
