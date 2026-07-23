import { describe, expect, it } from 'vitest';
import { Fraction } from '../../../src/math/Fraction.js';
import {
  ACCENT_DECAY,
  MAX_ACCENT_STRENGTH,
  MIN_ACCENT_STRENGTH,
  assertProperDenominator,
  assertProperNumerator,
  getBeatJunction,
  getHalfJunction,
  getThirdsJunction,
  inferJunctions,
  inferMetricAccents,
} from '../../../src/knowledge/timesignature/timeSignatureMath.js';

describe('assertProperNumerator', () => {
  it('does not throw for a non-zero value', () => {
    expect(() => assertProperNumerator(4)).not.toThrow();
  });

  it('throws for 0', () => {
    expect(() => assertProperNumerator(0)).toThrow(/shownNumerator.*cannot be 0/);
  });
});

describe('assertProperDenominator', () => {
  it('does not throw for a power of 2', () => {
    for (const value of [1, 2, 4, 8, 16, 32]) {
      expect(() => assertProperDenominator(value)).not.toThrow();
    }
  });

  it('throws for 0', () => {
    expect(() => assertProperDenominator(0)).toThrow(/shownDenominator.*cannot be 0/);
  });

  it('throws for a non-power-of-2', () => {
    expect(() => assertProperDenominator(3)).toThrow(/must be a power of `2`/);
  });
});

describe('getBeatJunction', () => {
  it('produces one junction per beat boundary, excluding the final one', () => {
    // 4/4: beat = 1/4. Junctions at 1/4, 2/4 (=1/2), 3/4.
    const junctions = getBeatJunction(4, 4);
    expect(junctions.map((f) => f.toString())).toEqual(['1/4', '1/2', '3/4']);
  });

  it('produces no junctions for a single-beat measure', () => {
    expect(getBeatJunction(1, 4)).toEqual([]);
  });
});

describe('getHalfJunction', () => {
  it('returns a single half-measure junction when representable at the display resolution', () => {
    // 4/4 (fraction 1/1): half = 1/2, denominator 2 <= shownDenominator 4.
    const result = getHalfJunction(new Fraction(1, 1), 4);
    expect(result?.map((f) => f.toString())).toEqual(['1/2']);
  });

  it('returns null when the half-measure point needs finer resolution than the display denominator', () => {
    // 3/8 (fraction 3/8): half = 3/16, denominator 16 > shownDenominator 8.
    const result = getHalfJunction(new Fraction(3, 8), 8);
    expect(result).toBeNull();
  });
});

describe('getThirdsJunction', () => {
  it('returns two thirds-of-a-measure junctions when representable', () => {
    // 6/8 (fraction 3/4): first third = 1/4, denominator 4 <= shownDenominator 8.
    const result = getThirdsJunction(new Fraction(3, 4), 8);
    expect(result?.map((f) => f.toString())).toEqual(['1/4', '1/2']);
  });

  it('returns null when a clean thirds split is not representable', () => {
    // 2/2 (fraction 1/1, shownDenominator 2): first third = 1/3, denominator 3 > shownDenominator 2.
    const result = getThirdsJunction(new Fraction(1, 1), 2);
    expect(result).toBeNull();
  });
});

describe('inferJunctions', () => {
  it('prefers the half-measure junction when it applies (common time)', () => {
    const junctions = inferJunctions(new Fraction(1, 1), 4, 4);
    expect(junctions.map((f) => f.toString())).toEqual(['1/2']);
  });

  it('falls back to per-beat junctions when neither half nor thirds apply', () => {
    // 7/8 (fraction 7/8): half = 7/16 (denom 16 > 8), thirds = 7/24 (denom 24 > 8) ->
    // falls back to beat junctions.
    const junctions = inferJunctions(new Fraction(7, 8), 7, 8);
    expect(junctions).toHaveLength(6);
  });
});

describe('inferMetricAccents', () => {
  it('gives the first beat the maximum accent strength', () => {
    const junctions = inferJunctions(new Fraction(1, 1), 4, 4);
    const accents = inferMetricAccents(4, junctions);
    expect(accents[0]?.strength).toBe(MAX_ACCENT_STRENGTH);
    expect(accents[0]?.position.toString()).toBe('1/4');
  });

  it('produces one accent per junction, plus the primary beat accent', () => {
    const junctions = inferJunctions(new Fraction(1, 1), 4, 4);
    const accents = inferMetricAccents(4, junctions);
    expect(accents).toHaveLength(junctions.length + 1);
  });

  it('positions each secondary accent at junction + one beat', () => {
    const junctions = [new Fraction(1, 2)];
    const accents = inferMetricAccents(4, junctions);
    // junction (1/2) + beat (1/4) = 3/4
    expect(accents[1]?.position.toString()).toBe('3/4');
  });

  it('decays accent strength for each successive junction', () => {
    const junctions = [new Fraction(1, 4), new Fraction(1, 2), new Fraction(3, 4)];
    const accents = inferMetricAccents(4, junctions);
    const strengths = accents.slice(1).map((a) => a.strength);
    // Each successive secondary accent strength should be strictly
    // decreasing (compounding ACCENT_DECAY).
    expect(strengths[0]).toBeGreaterThan(strengths[1] as number);
    expect(strengths[1]).toBeGreaterThan(strengths[2] as number);
  });

  it('matches the hand-computed strength for the first secondary accent', () => {
    const accents = inferMetricAccents(4, [new Fraction(1, 2)]);
    const expectedOffset = (MAX_ACCENT_STRENGTH - MIN_ACCENT_STRENGTH) * ACCENT_DECAY;
    expect(accents[1]?.strength).toBeCloseTo(MIN_ACCENT_STRENGTH + expectedOffset);
  });

  it('returns just the primary accent for an empty junctions list', () => {
    const accents = inferMetricAccents(4, []);
    expect(accents).toHaveLength(1);
  });
});
