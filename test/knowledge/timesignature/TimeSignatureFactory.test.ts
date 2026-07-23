import { describe, expect, it } from 'vitest';
import { TimeSignatureDefinition } from '../../../src/knowledge/timesignature/TimeSignatureDefinition.js';
import { $cache, $get } from '../../../src/knowledge/timesignature/TimeSignatureFactory.js';

describe('$get', () => {
  it('returns a TimeSignatureDefinition with the requested numerator/denominator', () => {
    const ts = $get(5, 8);
    expect(ts.shownNumerator).toBe(5);
    expect(ts.shownDenominator).toBe(8);
  });

  it('recycles the same instance for repeated requests with the same numerator/denominator', () => {
    const first = $get(9, 16);
    const second = $get(9, 16);
    expect(first).toBe(second);
  });

  it('returns distinct instances for distinct numerator/denominator pairs', () => {
    const a = $get(11, 16);
    const b = $get(13, 16);
    expect(a).not.toBe(b);
  });
});

describe('$cache', () => {
  it('makes a manually-cached definition retrievable via $get by its own numerator/denominator', () => {
    const custom = new TimeSignatureDefinition(15, 16);
    $cache(custom);
    expect($get(15, 16)).toBe(custom);
  });

  it('overwrites any existing cache entry for the same numerator/denominator', () => {
    const first = $get(17, 32);
    const replacement = new TimeSignatureDefinition(17, 32);
    $cache(replacement);
    expect($get(17, 32)).toBe(replacement);
    expect($get(17, 32)).not.toBe(first);
  });
});
