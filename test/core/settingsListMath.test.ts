import { describe, expect, it } from 'vitest';
import {
  ERROR_CODE,
  computeLinearInterpolation,
  isInt,
  isUint,
  recordedTimeAtOrAfter,
  recordedTimeAtOrBefore,
} from '../../src/core/settingsListMath.js';

describe('recordedTimeAtOrBefore', () => {
  it('finds the exact recorded time', () => {
    expect(recordedTimeAtOrBefore({ 50: 1 }, 50)).toBe(50);
  });

  it('searches backward for the nearest recorded time', () => {
    expect(recordedTimeAtOrBefore({ 10: 1, 50: 2 }, 60)).toBe(50);
  });

  it('falls back to a forward search when nothing is found backward', () => {
    expect(recordedTimeAtOrBefore({ 50: 1 }, 10)).toBe(50);
  });

  it('returns ERROR_CODE when nothing is found in either direction', () => {
    expect(recordedTimeAtOrBefore({}, 50)).toBe(ERROR_CODE);
  });

  it('does not fall back when useFallback is false', () => {
    expect(recordedTimeAtOrBefore({ 50: 1 }, 10, false)).toBe(ERROR_CODE);
  });
});

describe('recordedTimeAtOrAfter', () => {
  it('finds the exact recorded time', () => {
    expect(recordedTimeAtOrAfter({ 50: 1 }, 50)).toBe(50);
  });

  it('searches forward for the nearest recorded time', () => {
    expect(recordedTimeAtOrAfter({ 50: 1, 90: 2 }, 40)).toBe(50);
  });

  it('falls back to a backward search when nothing is found forward', () => {
    expect(recordedTimeAtOrAfter({ 10: 1 }, 50)).toBe(10);
  });

  it('returns ERROR_CODE when nothing is found in either direction', () => {
    expect(recordedTimeAtOrAfter({}, 50)).toBe(ERROR_CODE);
  });
});

describe('computeLinearInterpolation', () => {
  it('interpolates the midpoint correctly', () => {
    expect(computeLinearInterpolation(0, 0, 100, 100, 50)).toBe(50);
  });

  it('interpolates a non-midpoint correctly', () => {
    expect(computeLinearInterpolation(0, 0, 100, 200, 25)).toBe(50);
  });

  it('returns y1 when x1 === x3 (division by zero guard)', () => {
    expect(computeLinearInterpolation(50, 42, 50, 99, 50)).toBe(42);
  });
});

describe('isInt / isUint', () => {
  it('accepts whole numbers as int', () => {
    expect(isInt(5)).toBe(true);
    expect(isInt(-5)).toBe(true);
    expect(isInt(0)).toBe(true);
  });

  it('rejects fractional numbers, NaN, and non-numbers as int', () => {
    expect(isInt(5.5)).toBe(false);
    expect(isInt(NaN)).toBe(false);
    expect(isInt('5')).toBe(false);
    expect(isInt(null)).toBe(false);
  });

  it('accepts non-negative whole numbers as uint', () => {
    expect(isUint(5)).toBe(true);
    expect(isUint(0)).toBe(true);
  });

  it('rejects negative numbers as uint', () => {
    expect(isUint(-5)).toBe(false);
  });
});
