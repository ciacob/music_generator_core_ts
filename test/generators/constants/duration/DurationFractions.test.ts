import { describe, expect, it } from 'vitest';
import { DurationFractions } from '../../../../src/generators/constants/duration/DurationFractions.js';

describe('DurationFractions', () => {
  it('holds real Fraction instances with the expected values', () => {
    expect(DurationFractions.WHOLE.toString()).toBe('1/1');
    expect(DurationFractions.HALF.toString()).toBe('1/2');
    expect(DurationFractions.QUARTER.toString()).toBe('1/4');
    expect(DurationFractions.EIGHT.toString()).toBe('1/8');
    expect(DurationFractions.SIXTEENTH.toString()).toBe('1/16');
    expect(DurationFractions.THIRTYSECOND.toString()).toBe('1/32');
    expect(DurationFractions.SIXTYFOURTH.toString()).toBe('1/64');
    expect(DurationFractions.HUNDREDTWENTYEIGHTH.toString()).toBe('1/128');
  });

  it('each fraction halves the previous one', () => {
    expect(DurationFractions.HALF.floatValue).toBeCloseTo(DurationFractions.WHOLE.floatValue / 2);
    expect(DurationFractions.QUARTER.floatValue).toBeCloseTo(DurationFractions.HALF.floatValue / 2);
  });

  it('supports Fraction arithmetic directly', () => {
    const sum = DurationFractions.QUARTER.add(DurationFractions.QUARTER);
    expect(sum.toString()).toBe('1/2');
  });
});
