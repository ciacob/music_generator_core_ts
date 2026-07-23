import { describe, expect, it } from 'vitest';
import { IntervalRootPositions } from '../../../src/knowledge/harmony/IntervalRootPositions.js';

describe('IntervalRootPositions', () => {
  it('defines TOP, BOTTOM, UNKNOWN with the expected values', () => {
    expect(IntervalRootPositions.TOP).toBe(1);
    expect(IntervalRootPositions.BOTTOM).toBe(0);
    expect(IntervalRootPositions.UNKNOWN).toBe(-1);
  });
});
