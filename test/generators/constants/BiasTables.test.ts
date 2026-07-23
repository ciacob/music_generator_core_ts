import { describe, expect, it } from 'vitest';
import {
  BASELINE,
  getExternalVoicesMelodicBias,
  getInternalVoicesMelodicBias,
} from '../../../src/generators/constants/BiasTables.js';
import { IntervalsSize } from '../../../src/generators/constants/pitch/IntervalsSize.js';

describe('BASELINE', () => {
  it('is 100', () => {
    expect(BASELINE).toBe(100);
  });
});

describe('getExternalVoicesMelodicBias', () => {
  it('gives the minor third the highest bias', () => {
    const bias = getExternalVoicesMelodicBias();
    expect(bias[IntervalsSize.MINOR_THIRD]).toBe(BASELINE * 3.2);
    const allValues = Object.values(bias);
    expect(Math.max(...allValues)).toBe(bias[IntervalsSize.MINOR_THIRD]);
  });

  it('gives the major seventh the lowest bias', () => {
    const bias = getExternalVoicesMelodicBias();
    const allValues = Object.values(bias);
    expect(Math.min(...allValues)).toBe(bias[IntervalsSize.MAJOR_SEVENTH]);
  });

  it('returns the same cached object across repeated calls', () => {
    expect(getExternalVoicesMelodicBias()).toBe(getExternalVoicesMelodicBias());
  });

  it('defines a bias for all 13 listed intervals', () => {
    expect(Object.keys(getExternalVoicesMelodicBias())).toHaveLength(13);
  });
});

describe('getInternalVoicesMelodicBias', () => {
  it('gives the perfect unison the highest bias', () => {
    const bias = getInternalVoicesMelodicBias();
    expect(bias[IntervalsSize.PERFECT_UNISON]).toBe(BASELINE * 2);
    const allValues = Object.values(bias);
    expect(Math.max(...allValues)).toBe(bias[IntervalsSize.PERFECT_UNISON]);
  });

  it('is independent from the external voices table', () => {
    expect(getInternalVoicesMelodicBias()).not.toBe(getExternalVoicesMelodicBias());
  });

  it('returns the same cached object across repeated calls', () => {
    expect(getInternalVoicesMelodicBias()).toBe(getInternalVoicesMelodicBias());
  });
});
