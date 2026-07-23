import { describe, expect, it } from 'vitest';
import {
  buildRafflePool,
  computeNormalizedList,
  removeAllOccurrences,
} from '../../../src/stochastic/random/weightedRandomMath.js';

describe('computeNormalizedList', () => {
  it('normalizes positive weights to percentages summing to ~100', () => {
    const result = computeNormalizedList([
      { source: 'a', weight: 1 },
      { source: 'b', weight: 1 },
      { source: 'c', weight: 2 },
    ]);
    expect(result).toEqual([
      ['a', 25],
      ['b', 25],
      ['c', 50],
    ]);
  });

  it('sorts the result ascending by (pre-normalization) weight', () => {
    const result = computeNormalizedList([
      { source: 'heavy', weight: 9 },
      { source: 'light', weight: 1 },
    ]);
    expect(result.map(([source]) => source)).toEqual(['light', 'heavy']);
  });

  it('handles a single entry as 100%', () => {
    expect(computeNormalizedList([{ source: 'only', weight: 5 }])).toEqual([['only', 100]]);
  });

  it('returns an empty list for no entries', () => {
    expect(computeNormalizedList([])).toEqual([]);
  });

  it('treats an all-zero-weight entry as 0% rather than NaN', () => {
    // AS3's `uint(NaN)` coerces to 0; this locks in the equivalent here.
    expect(computeNormalizedList([{ source: 'a', weight: 0 }])).toEqual([['a', 0]]);
  });

  it('transposes a single negative weight into the positive range via the pivot', () => {
    const result = computeNormalizedList([
      { source: 'x', weight: -5 },
      { source: 'y', weight: 10 },
    ]);
    expect(result).toEqual([
      ['x', 6],
      ['y', 95],
    ]);
  });

  it('gives the more-negative (larger magnitude) weight a smaller final share', () => {
    // -10 is "more negative" than -2, so it should end up picked less
    // often (smaller final percentage) after inversion.
    const result = computeNormalizedList([
      { source: 'p', weight: -2 },
      { source: 'q', weight: -10 },
    ]);
    expect(result).toEqual([
      ['q', 10],
      ['p', 90],
    ]);
  });

  it('never lets the heaviest-magnitude negative weight collapse to a 0 share', () => {
    // Without the +1 pivot adjustment, the single most-negative entry
    // would invert to exactly 0 (full exclusion). It should remain
    // pickable, just with the smallest share.
    const result = computeNormalizedList([{ source: 'only-negative', weight: -7 }]);
    expect(result[0]?.[1]).toBeGreaterThan(0);
  });
});

describe('buildRafflePool', () => {
  it('repeats each source proportionally to its weight', () => {
    const pool = buildRafflePool([
      ['a', 25],
      ['b', 75],
    ]);
    expect(pool).toHaveLength(100);
    expect(pool.filter((v) => v === 'a')).toHaveLength(25);
    expect(pool.filter((v) => v === 'b')).toHaveLength(75);
  });

  it('excludes a source with weight 0 entirely', () => {
    const pool = buildRafflePool([
      ['a', 0],
      ['b', 100],
    ]);
    expect(pool).not.toContain('a');
    expect(pool).toHaveLength(100);
  });

  it('returns an empty pool for an empty list', () => {
    expect(buildRafflePool([])).toEqual([]);
  });
});

describe('removeAllOccurrences', () => {
  it('removes every occurrence of the given value', () => {
    expect(removeAllOccurrences([1, 2, 1, 3, 1], 1)).toEqual([2, 3]);
  });

  it('leaves the array unchanged if the value is not present', () => {
    expect(removeAllOccurrences([1, 2, 3], 9)).toEqual([1, 2, 3]);
  });

  it('does not mutate the input array', () => {
    const input = [1, 2, 1];
    removeAllOccurrences(input, 1);
    expect(input).toEqual([1, 2, 1]);
  });

  it('uses === equality (distinguishes reference-equal vs structurally-equal objects)', () => {
    const a = { id: 1 };
    const b = { id: 1 };
    expect(removeAllOccurrences([a, b], a)).toEqual([b]);
  });
});
