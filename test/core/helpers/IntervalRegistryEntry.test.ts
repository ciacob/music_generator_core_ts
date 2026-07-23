import { describe, expect, it } from 'vitest';
import { IntervalRegistryEntry } from '../../../src/core/helpers/IntervalRegistryEntry.js';
import { IntervalsSize } from '../../../src/generators/constants/pitch/IntervalsSize.js';

describe('IntervalRegistryEntry', () => {
  it('exposes low and size as given', () => {
    const entry = new IntervalRegistryEntry(60, IntervalsSize.PERFECT_FIFTH);
    expect(entry.low).toBe(60);
    expect(entry.size).toBe(IntervalsSize.PERFECT_FIFTH);
  });

  it('places the root at the bottom for a perfect fifth', () => {
    const entry = new IntervalRegistryEntry(60, IntervalsSize.PERFECT_FIFTH);
    expect(entry.root).toBe(60);
  });

  it('places the root at the top for a perfect fourth', () => {
    const entry = new IntervalRegistryEntry(60, IntervalsSize.PERFECT_FOURTH);
    expect(entry.root).toBe(60 + IntervalsSize.PERFECT_FOURTH);
  });

  it('leaves the root undefined (a large sentinel) for a tritone', () => {
    const entry = new IntervalRegistryEntry(60, IntervalsSize.AUGMENTED_FOURTH);
    expect(entry.root).toBe(Number.MAX_SAFE_INTEGER);
  });

  it('toString includes low, size, and root', () => {
    const entry = new IntervalRegistryEntry(60, IntervalsSize.PERFECT_FIFTH);
    const str = entry.toString();
    expect(str).toContain('60');
    expect(str).toContain(String(IntervalsSize.PERFECT_FIFTH));
  });
});
