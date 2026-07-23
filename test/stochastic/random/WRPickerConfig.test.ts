import { describe, expect, it } from 'vitest';
import { WRPickerConfig } from '../../../src/stochastic/random/WRPickerConfig.js';

describe('WRPickerConfig construction', () => {
  // Note: the constructor is `private`, which TypeScript enforces at
  // *compile* time only (attempting `new WRPickerConfig()` from outside
  // the class fails `tsc`, which this whole project already compiles
  // under `strict` mode as part of its build). `private` provides no
  // *runtime* enforcement once compiled to JS, so there's nothing
  // meaningful to assert about it in a runtime test; only `$create()`'s
  // behavior is testable here.

  it('$create returns a fresh, empty configuration', () => {
    const cfg = WRPickerConfig.$create();
    expect(cfg.normalizedList).toEqual([]);
  });
});

describe('WRPickerConfig defaults', () => {
  it('defaults numPicks to 1', () => {
    expect(WRPickerConfig.$create().numPicks).toBe(1);
  });

  it('defaults exhaustible to false', () => {
    expect(WRPickerConfig.$create().exhaustible).toBe(false);
  });

  it('defaults randomIntegerFunction to undefined', () => {
    expect(WRPickerConfig.$create().randomIntegerFunction).toBeUndefined();
  });
});

describe('WRPickerConfig fluent setters', () => {
  it('$setNumPicks sets numPicks', () => {
    const cfg = WRPickerConfig.$create().$setNumPicks(3);
    expect(cfg.numPicks).toBe(3);
  });

  it('$setNumPicks clamps to a minimum of 1', () => {
    expect(WRPickerConfig.$create().$setNumPicks(0).numPicks).toBe(1);
  });

  it('$setExhaustible sets exhaustible', () => {
    expect(WRPickerConfig.$create().$setExhaustible(true).exhaustible).toBe(true);
  });

  it('$setRandomIntegerFunction / $unsetRandomIntegerFunction round-trip', () => {
    const fn = (a: number, b: number) => a;
    const cfg = WRPickerConfig.$create().$setRandomIntegerFunction(fn);
    expect(cfg.randomIntegerFunction).toBe(fn);
    cfg.$unsetRandomIntegerFunction();
    expect(cfg.randomIntegerFunction).toBeUndefined();
  });

  it('each fluent setter returns the same instance (chainable)', () => {
    const cfg = WRPickerConfig.$create();
    expect(cfg.$setNumPicks(2)).toBe(cfg);
    expect(cfg.$setExhaustible(true)).toBe(cfg);
    expect(cfg.$add('x', 1)).toBe(cfg);
  });
});

describe('WRPickerConfig.$add / change / remove', () => {
  it('$add adds an entry reflected in normalizedList', () => {
    const cfg = WRPickerConfig.$create().$add('a', 1);
    expect(cfg.normalizedList).toEqual([['a', 100]]);
  });

  it('$add with an already-present element updates its weight instead of duplicating it', () => {
    const cfg = WRPickerConfig.$create().$add('a', 1).$add('a', 5);
    expect(cfg.normalizedList).toEqual([['a', 100]]);
  });

  it('preserves insertion order across entries', () => {
    const cfg = WRPickerConfig.$create().$add('z', 1).$add('a', 1).$add('m', 1);
    expect(cfg.normalizedList.map(([source]) => source)).toEqual(['z', 'a', 'm']);
  });

  it('change updates an existing element weight and returns true', () => {
    const cfg = WRPickerConfig.$create().$add('a', 1).$add('b', 1);
    const changed = cfg.change('a', 9);
    expect(changed).toBe(true);
    expect(cfg.normalizedList).toEqual([
      ['b', 10],
      ['a', 90],
    ]);
  });

  it('change returns false for an element that was never added', () => {
    expect(WRPickerConfig.$create().change('nope', 5)).toBe(false);
  });

  it('remove removes an element and returns true', () => {
    const cfg = WRPickerConfig.$create().$add('a', 1).$add('b', 1);
    const removed = cfg.remove('a');
    expect(removed).toBe(true);
    expect(cfg.normalizedList).toEqual([['b', 100]]);
  });

  it('remove returns false for an element that was never added', () => {
    expect(WRPickerConfig.$create().remove('nope')).toBe(false);
  });
});

describe('WRPickerConfig.normalizedList caching', () => {
  it('returns a cached list across repeated reads with no changes', () => {
    const cfg = WRPickerConfig.$create().$add('a', 1);
    expect(cfg.normalizedList).toBe(cfg.normalizedList);
  });

  it('invalidates the cache on $add', () => {
    const cfg = WRPickerConfig.$create().$add('a', 1);
    const before = cfg.normalizedList;
    cfg.$add('b', 1);
    expect(cfg.normalizedList).not.toBe(before);
  });

  it('invalidates the cache on change (only if the weight actually differs)', () => {
    const cfg = WRPickerConfig.$create().$add('a', 1);
    const before = cfg.normalizedList;
    cfg.change('a', 1); // same weight -> no invalidation
    expect(cfg.normalizedList).toBe(before);
    cfg.change('a', 2); // different weight -> invalidation
    expect(cfg.normalizedList).not.toBe(before);
  });

  it('invalidates the cache on remove', () => {
    const cfg = WRPickerConfig.$create().$add('a', 1).$add('b', 1);
    const before = cfg.normalizedList;
    cfg.remove('b');
    expect(cfg.normalizedList).not.toBe(before);
  });
});
