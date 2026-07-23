import { describe, expect, it } from 'vitest';
import { WeightedRandomPicker } from '../../../src/stochastic/random/WeightedRandomPicker.js';
import { WRPickerConfig } from '../../../src/stochastic/random/WRPickerConfig.js';

describe('WeightedRandomPicker basic picking', () => {
  it('picks an element from the configured pool', () => {
    const picker = new WeightedRandomPicker(() => 0);
    picker.configure(WRPickerConfig.$create().$add('only', 1));
    const result = picker.pick();
    expect(result).toEqual(['only']);
  });

  it('draws numPicks elements per pick() call', () => {
    const picker = new WeightedRandomPicker(() => 0);
    picker.configure(WRPickerConfig.$create().$add('a', 1).$add('b', 1).$setNumPicks(2));
    expect(picker.pick()).toHaveLength(2);
  });

  it('returns an empty array before any configuration is applied', () => {
    const picker = new WeightedRandomPicker();
    expect(picker.pick()).toEqual([]);
  });

  it('only ever picks configured elements', () => {
    const picker = new WeightedRandomPicker();
    picker.configure(WRPickerConfig.$create().$add('a', 3).$add('b', 1).$setNumPicks(20));
    for (const item of picker.pick()) {
      expect(['a', 'b']).toContain(item);
    }
  });
});

describe('WeightedRandomPicker with exhaustible=false (duplicates permitted)', () => {
  it('never reports exhausted', () => {
    const picker = new WeightedRandomPicker();
    picker.configure(WRPickerConfig.$create().$add('a', 1).$setExhaustible(false));
    expect(picker.exhausted).toBe(false);
    picker.pick();
    expect(picker.exhausted).toBe(false);
  });

  it('can pick the same element repeatedly across separate pick() calls', () => {
    const picker = new WeightedRandomPicker(() => 0);
    picker.configure(WRPickerConfig.$create().$add('only', 1).$setExhaustible(false));
    expect(picker.pick()).toEqual(['only']);
    expect(picker.pick()).toEqual(['only']);
    expect(picker.pick()).toEqual(['only']);
  });
});

describe('WeightedRandomPicker with exhaustible=true (no duplicates)', () => {
  it('never repeats an element within a single pick() call', () => {
    const picker = new WeightedRandomPicker();
    picker.configure(
      WRPickerConfig.$create().$add('a', 1).$add('b', 1).$add('c', 1).$setExhaustible(true).$setNumPicks(3),
    );
    const result = picker.pick();
    expect(new Set(result).size).toBe(3);
    expect(result.sort()).toEqual(['a', 'b', 'c']);
  });

  it('becomes exhausted after every unique element has been picked across refills', () => {
    const picker = new WeightedRandomPicker();
    picker.configure(WRPickerConfig.$create().$add('a', 1).$add('b', 1).$setExhaustible(true));
    picker.pick();
    picker.pick();
    expect(picker.exhausted).toBe(true);
    expect(picker.pick()).toEqual([]);
  });

  it('refill() restores the pool after exhaustion', () => {
    const picker = new WeightedRandomPicker();
    const cfg = WRPickerConfig.$create().$add('a', 1).$add('b', 1).$setExhaustible(true);
    picker.configure(cfg);
    picker.pick();
    picker.pick();
    expect(picker.exhausted).toBe(true);
    picker.refill();
    expect(picker.exhausted).toBe(false);
    expect(picker.pick()).toHaveLength(1);
  });

  it('throws when numPicks exceeds the number of unique options', () => {
    expect(() => {
      const picker = new WeightedRandomPicker();
      picker.configure(WRPickerConfig.$create().$add('a', 1).$setExhaustible(true).$setNumPicks(2));
    }).toThrow(/Cannot pick 2 unique values from a list of 1 available options/);
  });

  it('does not throw when duplicates are permitted, even if numPicks exceeds unique options', () => {
    expect(() => {
      const picker = new WeightedRandomPicker();
      picker.configure(WRPickerConfig.$create().$add('a', 1).$setExhaustible(false).$setNumPicks(5));
    }).not.toThrow();
  });
});

describe('WeightedRandomPicker weighting', () => {
  it('favors a heavily-weighted element over many draws with an unseeded RNG', () => {
    const picker = new WeightedRandomPicker();
    picker.configure(WRPickerConfig.$create().$add('common', 99).$add('rare', 1));
    let commonCount = 0;
    for (let i = 0; i < 200; i++) {
      const [picked] = picker.pick();
      if (picked === 'common') commonCount++;
    }
    // Not a statistically rigorous bound, just a sanity check that the
    // heavier weight dominates by a wide margin.
    expect(commonCount).toBeGreaterThan(150);
  });
});

describe('WeightedRandomPicker custom randomIntegerFunction', () => {
  it('uses the configured randomIntegerFunction for index picking instead of the default', () => {
    let calls = 0;
    const alwaysFirst = (limitLow: number, _limitHigh: number): number => {
      calls++;
      return limitLow;
    };
    const picker = new WeightedRandomPicker();
    picker.configure(
      WRPickerConfig.$create().$add('a', 1).$add('b', 1).$setRandomIntegerFunction(alwaysFirst),
    );
    picker.pick();
    expect(calls).toBeGreaterThan(0);
  });
});
