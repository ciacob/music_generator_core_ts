import { describe, expect, it } from 'vitest';
import { CommonTime } from '../../../src/knowledge/timesignature/CommonTime.js';

describe('CommonTime', () => {
  it('has a fraction of 1/1', () => {
    expect(new CommonTime().fraction.toString()).toBe('1/1');
  });

  it('shows as 4/4', () => {
    const ct = new CommonTime();
    expect(ct.shownNumerator).toBe(4);
    expect(ct.shownDenominator).toBe(4);
  });

  it('has a single junction at 3/4', () => {
    const junctions = new CommonTime().junctions;
    expect(junctions).toHaveLength(1);
    expect(junctions[0]?.toString()).toBe('3/4');
  });

  it('has a strong accent on beat 1 and a weaker one on beat 3', () => {
    const accents = new CommonTime().metricAccents;
    expect(accents).toHaveLength(2);
    expect(accents[0]?.strength).toBe(1);
    expect(accents[0]?.position.toString()).toBe('1/4');
    expect(accents[1]?.strength).toBe(0.75);
    expect(accents[1]?.position.toString()).toBe('3/4');
  });

  it('memoizes fraction/junctions/metricAccents across repeated reads', () => {
    const ct = new CommonTime();
    expect(ct.fraction).toBe(ct.fraction);
    expect(ct.junctions).toBe(ct.junctions);
    expect(ct.metricAccents).toBe(ct.metricAccents);
  });
});
