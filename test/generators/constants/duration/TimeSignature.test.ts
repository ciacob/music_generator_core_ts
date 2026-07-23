import { describe, expect, it } from 'vitest';
import { TimeSignature } from '../../../../src/generators/constants/duration/TimeSignature.js';

describe('TimeSignature', () => {
  it('holds real Fraction instances for common named time signatures', () => {
    expect(TimeSignature.COMMON_TIME.toString()).toBe('1/1');
    expect(TimeSignature.MARCH_TIME.toString()).toBe('1/2');
    expect(TimeSignature.WALTZ_TIME.toString()).toBe('3/4');
  });
});
