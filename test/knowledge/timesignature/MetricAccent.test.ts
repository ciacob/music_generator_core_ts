import { describe, expect, it } from 'vitest';
import { Fraction } from '../../../src/math/Fraction.js';
import { MetricAccent } from '../../../src/knowledge/timesignature/MetricAccent.js';

describe('MetricAccent', () => {
  it('defaults to strength 0 and position 0/1 when constructed with no arguments', () => {
    const accent = new MetricAccent();
    expect(accent.strength).toBe(0);
    expect(accent.position.toString()).toBe('0/1');
  });

  it('accepts strength and position via the constructor', () => {
    const accent = new MetricAccent(0.75, new Fraction(3, 4));
    expect(accent.strength).toBe(0.75);
    expect(accent.position.toString()).toBe('3/4');
  });

  it('supports the construct-then-assign pattern used throughout the engine', () => {
    const accent = new MetricAccent();
    accent.strength = 1;
    accent.position = new Fraction(1, 4);
    expect(accent.strength).toBe(1);
    expect(accent.position.toString()).toBe('1/4');
  });

  it('toString formats as "[MetricAccent: strength @position]"', () => {
    const accent = new MetricAccent(0.75, new Fraction(3, 4));
    expect(accent.toString()).toBe('[MetricAccent: 0.75 @3/4]');
  });
});
