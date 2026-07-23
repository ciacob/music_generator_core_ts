import { describe, expect, it } from 'vitest';
import { IntervalsSize } from '../../../../src/generators/constants/pitch/IntervalsSize.js';

describe('IntervalsSize', () => {
  it('maps each named interval to its semitone count', () => {
    expect(IntervalsSize.PERFECT_UNISON).toBe(0);
    expect(IntervalsSize.MINOR_SECOND).toBe(1);
    expect(IntervalsSize.MAJOR_SECOND).toBe(2);
    expect(IntervalsSize.MINOR_THIRD).toBe(3);
    expect(IntervalsSize.MAJOR_THIRD).toBe(4);
    expect(IntervalsSize.PERFECT_FOURTH).toBe(5);
    expect(IntervalsSize.AUGMENTED_FOURTH).toBe(6);
    expect(IntervalsSize.PERFECT_FIFTH).toBe(7);
    expect(IntervalsSize.MINOR_SIXTH).toBe(8);
    expect(IntervalsSize.MAJOR_SIXTH).toBe(9);
    expect(IntervalsSize.MINOR_SEVENTH).toBe(10);
    expect(IntervalsSize.MAJOR_SEVENTH).toBe(11);
    expect(IntervalsSize.PERFECT_OCTAVE).toBe(12);
  });
});
