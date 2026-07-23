import { describe, expect, it } from 'vitest';
import { Fraction } from '../../../src/math/Fraction.js';
import { TimeSignatureDefinition } from '../../../src/knowledge/timesignature/TimeSignatureDefinition.js';

describe('TimeSignatureDefinition construction', () => {
  it('exposes shownNumerator/shownDenominator as given', () => {
    const ts = new TimeSignatureDefinition(7, 8);
    expect(ts.shownNumerator).toBe(7);
    expect(ts.shownDenominator).toBe(8);
  });

  it('computes fraction as the reduced numerator/denominator', () => {
    const ts = new TimeSignatureDefinition(4, 4);
    expect(ts.fraction.toString()).toBe('1/1');
  });

  it('throws for a zero numerator', () => {
    expect(() => new TimeSignatureDefinition(0, 4)).toThrow(/shownNumerator/);
  });

  it('throws for a zero denominator', () => {
    expect(() => new TimeSignatureDefinition(4, 0)).toThrow(/shownDenominator/);
  });

  it('throws for a non-power-of-2 denominator', () => {
    expect(() => new TimeSignatureDefinition(4, 3)).toThrow(/power of `2`/);
  });
});

describe('TimeSignatureDefinition inference', () => {
  it('infers junctions when none are given', () => {
    const ts = new TimeSignatureDefinition(4, 4);
    expect(ts.junctions.map((f) => f.toString())).toEqual(['1/2']);
  });

  it('infers metric accents when none are given', () => {
    const ts = new TimeSignatureDefinition(4, 4);
    expect(ts.metricAccents).toHaveLength(2);
    expect(ts.metricAccents[0]?.strength).toBe(TimeSignatureDefinition.MAX_ACCENT_STRENGTH);
  });

  it('accepts explicit junctions, bypassing inference', () => {
    const customJunctions = [new Fraction(1, 8), new Fraction(5, 8)];
    const ts = new TimeSignatureDefinition(7, 8, customJunctions);
    expect(ts.junctions).toBe(customJunctions);
  });

  it('accepts explicit metricAccents, bypassing inference', () => {
    const customJunctions = [new Fraction(1, 8)];
    const ts = new TimeSignatureDefinition(7, 8, customJunctions, []);
    expect(ts.metricAccents).toEqual([]);
  });
});

describe('TimeSignatureDefinition.toString', () => {
  it('includes the numerator, denominator, fraction, junctions, and accents', () => {
    const ts = new TimeSignatureDefinition(4, 4);
    const str = ts.toString();
    expect(str).toContain('4');
    expect(str).toContain('1/1');
    expect(str).toContain('1/2');
  });
});

describe('TimeSignatureDefinition static constants', () => {
  it('exposes MAX_ACCENT_STRENGTH, MIN_ACCENT_STRENGTH, ACCENT_DECAY', () => {
    expect(TimeSignatureDefinition.MAX_ACCENT_STRENGTH).toBe(2);
    expect(TimeSignatureDefinition.MIN_ACCENT_STRENGTH).toBe(1.2);
    expect(TimeSignatureDefinition.ACCENT_DECAY).toBe(0.75);
  });
});
