import { describe, expect, it } from 'vitest';
import { ParameterNames } from '../../../src/harmony/constants/ParameterNames.js';
import { ParameterCommons } from '../../../src/harmony/constants/ParameterCommons.js';
import { PrimitiveSourceNames } from '../../../src/harmony/constants/PrimitiveSourceNames.js';

describe('ParameterNames', () => {
  it('defines all 13 members from the original AS3 constants class', () => {
    expect(Object.keys(ParameterNames)).toHaveLength(13);
  });

  it('matches the exact string values from the AS3 source', () => {
    expect(ParameterNames).toEqual({
      ENFORCE_CONSONANCE: 'Enforce minimum consonance',
      DURATIONS: 'Durations Tendency',
      METRIC_PLACEMENT: 'Metric Placement',
      HIGHEST_PITCH: 'Highest Permitted Pitch',
      LOWEST_PITCH: 'Lowest Permitted Pitch',
      VOICES_NUMBER: 'Number of Voices',
      USE_MELODIC_MODEL: 'Use melodic model',
      MELODIC_DIRECTION_BALANCE: 'Melodic direction balance',
      INTRINSIC_CONSONANCE: 'Intrinsic Consonance',
      CHORD_PROGRESSION: 'Chord Progression',
      VOICE_RESTLESSNESS: 'Voice Restlessness',
      HARMONIC_DISTRIBUTION: 'Harmonic Distribution',
      VOICE_COHESION: 'Voice Cohesion',
    });
  });
});

describe('ParameterCommons', () => {
  it('defines the voice-restlessness range used to resolve 0%/100% limits', () => {
    expect(ParameterCommons.VOICE_RESTLESSNESS_MIN).toBe(0);
    expect(ParameterCommons.VOICE_RESTLESSNESS_MAX).toBe(3);
  });

  it('defines the shared analyzer sentinel values', () => {
    expect(ParameterCommons.NA_RESERVED_VALUE).toBe(0);
    expect(ParameterCommons.MIN_LEGAL_SCORE).toBe(1);
  });
});

describe('PrimitiveSourceNames', () => {
  it('defines RANDOM_PITCHES, the only member in the original AS3 source', () => {
    expect(Object.keys(PrimitiveSourceNames)).toHaveLength(1);
    expect(PrimitiveSourceNames.RANDOM_PITCHES).toBe('RandomPitches');
  });
});
