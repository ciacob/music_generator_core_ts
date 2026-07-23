import { describe, expect, it } from 'vitest';
import {
  decayFactor,
  getConsonance,
  getHindemiths2ndSeries,
  getHindemithsIntervalRoot,
  orderByHindemith2ndSeries,
} from '../../../src/knowledge/harmony/Intervals.js';
import { IntervalRootPositions } from '../../../src/knowledge/harmony/IntervalRootPositions.js';

describe('getHindemiths2ndSeries', () => {
  it('returns the series in significance order, perfect fifth first', () => {
    const series = getHindemiths2ndSeries();
    expect(series[0]).toBe(7); // perfect fifth
    expect(series).toHaveLength(11);
  });

  it('returns a fresh array each call (mutating the result does not affect subsequent calls)', () => {
    const first = getHindemiths2ndSeries();
    first.push(999);
    const second = getHindemiths2ndSeries();
    expect(second).not.toContain(999);
  });
});

describe('getHindemithsIntervalRoot', () => {
  it.each([
    [7, IntervalRootPositions.BOTTOM], // perfect fifth
    [5, IntervalRootPositions.TOP], // perfect fourth
    [4, IntervalRootPositions.BOTTOM], // major third
    [8, IntervalRootPositions.TOP], // minor sixth
    [3, IntervalRootPositions.BOTTOM], // minor third
    [9, IntervalRootPositions.TOP], // major sixth
    [2, IntervalRootPositions.TOP], // major second
    [10, IntervalRootPositions.BOTTOM], // minor seventh
    [1, IntervalRootPositions.TOP], // minor second
    [11, IntervalRootPositions.BOTTOM], // major seventh
  ])('maps interval size %i to root position %i', (size, expected) => {
    expect(getHindemithsIntervalRoot(size)).toBe(expected);
  });

  it('has no defined root for the tritone (augmented fourth)', () => {
    expect(getHindemithsIntervalRoot(6)).toBe(IntervalRootPositions.UNKNOWN);
  });

  it('has no defined root for a perfect unison or perfect octave', () => {
    expect(getHindemithsIntervalRoot(0)).toBe(IntervalRootPositions.UNKNOWN);
    expect(getHindemithsIntervalRoot(12)).toBe(IntervalRootPositions.UNKNOWN);
  });

  it('reduces compound intervals modulo the octave before classifying', () => {
    // 19 semitones = an octave (12) + a perfect fifth (7)
    expect(getHindemithsIntervalRoot(19)).toBe(IntervalRootPositions.BOTTOM);
  });
});

describe('orderByHindemith2ndSeries', () => {
  it('sorts by significance first (perfect fifth before perfect fourth)', () => {
    const fifth = { size: 7, low: 60 };
    const fourth = { size: 5, low: 60 };
    expect(orderByHindemith2ndSeries(fifth, fourth)).toBeLessThan(0);
    expect(orderByHindemith2ndSeries(fourth, fifth)).toBeGreaterThan(0);
  });

  it('falls back to base pitch when significance is equal', () => {
    const higher = { size: 7, low: 60 };
    const lower = { size: 7, low: 48 };
    expect(orderByHindemith2ndSeries(higher, lower)).toBeGreaterThan(0);
    expect(orderByHindemith2ndSeries(lower, higher)).toBeLessThan(0);
  });

  it('returns 0 for identical size and low', () => {
    const a = { size: 7, low: 60 };
    const b = { size: 7, low: 60 };
    expect(orderByHindemith2ndSeries(a, b)).toBe(0);
  });

  it('is usable as an Array.sort comparator, producing significance order', () => {
    const intervals = [
      { size: 2, low: 60 }, // major second
      { size: 7, low: 60 }, // perfect fifth
      { size: 4, low: 60 }, // major third
    ];
    intervals.sort(orderByHindemith2ndSeries);
    expect(intervals.map((i) => i.size)).toEqual([7, 4, 2]);
  });
});

describe('getConsonance', () => {
  it.each([
    [7, 5],
    [4, 4],
    [3, 3],
    [9, 2],
    [8, 1],
    [6, -1],
    [10, -2],
    [2, -3],
    [11, -4],
    [1, -5],
  ])('scores interval %i as %i', (interval, expected) => {
    expect(getConsonance(interval)).toBe(expected);
  });

  it('scores perfect unison/fourth/octave as neutral (0)', () => {
    expect(getConsonance(0)).toBe(0);
    expect(getConsonance(5)).toBe(0);
    expect(getConsonance(12)).toBe(0);
  });

  it('scores an out-of-range (compound) interval as 0', () => {
    expect(getConsonance(20)).toBe(0);
  });
});

describe('decayFactor', () => {
  it.each([
    [0, 1],
    [1, 0.8],
    [2, 0.4],
    [3, 0.1],
    [4, 0],
  ])('returns %s -> %s octaves added -> decay factor', (octaves, expected) => {
    expect(decayFactor(octaves)).toBe(expected);
  });

  it('returns 0 beyond the defined range', () => {
    expect(decayFactor(5)).toBe(0);
  });
});
