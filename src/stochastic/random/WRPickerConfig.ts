import {
  computeNormalizedList,
  type NormalizedEntry,
  type RandomIntegerFunction,
} from './weightedRandomMath.js';

/**
 * A single configured candidate: the value to potentially pick, and its
 * (possibly negative) selection weight. Private to this file; not
 * referenced anywhere else.
 */
class Entry {
  constructor(
    public readonly source: unknown,
    public weight: number,
  ) {}
}

/**
 * Fluent (method-chaining) configuration object for `WeightedRandomPicker`.
 *
 * Ported from
 * `as-sources/weighted-random-picker-library/ro/se/stochastic/random/WRPickerConfig.as`.
 *
 * Two structural simplifications relative to the AS3 original, both
 * enabled by TypeScript/JS language features AS3 lacked — not changes in
 * observable behavior:
 *
 * 1. **Private constructor.** The AS3 original has no `private`
 *    constructor keyword, so it simulated one with an internal `iLock`
 *    token class: `WRPickerConfig`'s constructor threw unless called with
 *    a token only `$create()` could produce. TypeScript has a real
 *    `private constructor`, enforced at compile time (stronger than the
 *    original's runtime-`throw` approach), so the token dance is dropped
 *    in favor of that.
 * 2. **Insertion-ordered storage.** The AS3 original tracks entries via
 *    three parallel structures — a `Dictionary` (element → entry, since
 *    Flash's plain `Object` can't be keyed by arbitrary objects), a
 *    numeric-`uid`-keyed `Object` map, and a separate ordered `Array` of
 *    uids — solely because Flash's `Dictionary` does not guarantee
 *    insertion-order iteration. A single JS/TS `Map` *does* guarantee
 *    insertion-order iteration (per the ECMAScript spec), so one
 *    `Map<unknown, Entry>` replaces all three AS3 structures (and the
 *    `Entry.uid`/`_count` bookkeeping that existed only to drive them).
 */
export class WRPickerConfig {
  private entries = new Map<unknown, Entry>();
  private exhaustibleFlag = false;
  private numPicksValue = 1;
  private normalizedListCache: NormalizedEntry[] | null = null;
  private randomIntegerFunctionValue: RandomIntegerFunction | undefined;

  private constructor() {}

  /** Creates a new, empty configuration. */
  static $create(): WRPickerConfig {
    return new WRPickerConfig();
  }

  /**
   * Adds `element` with the given `weight`. If `element` was already
   * added, this is equivalent to calling `change(element, weight)`
   * instead (its weight is updated rather than a duplicate entry being
   * created).
   */
  $add(element: unknown, weight: number): WRPickerConfig {
    if (this.entries.has(element)) {
      this.change(element, weight);
      return this;
    }
    this.entries.set(element, new Entry(element, weight));
    this.normalizedListCache = null;
    return this;
  }

  /** Sets whether picks exhaust the pool (no duplicate picks) or not. */
  $setExhaustible(state: boolean): WRPickerConfig {
    this.exhaustibleFlag = state;
    return this;
  }

  /** Sets how many elements a single `pick()` call draws. Clamped to at least 1. */
  $setNumPicks(times: number): WRPickerConfig {
    this.numPicksValue = Math.max(1, times);
    return this;
  }

  /**
   * Supplies a custom random-integer source, e.g. one backed by a seeded
   * PRNG. Seed that generator outside of this config/`WeightedRandomPicker`.
   *
   * The function must accept an inclusive `[limitLow, limitHigh]` range
   * and return a random integer within it (both ends included).
   */
  $setRandomIntegerFunction(func: RandomIntegerFunction): WRPickerConfig {
    this.randomIntegerFunctionValue = func;
    return this;
  }

  /** @see $setRandomIntegerFunction */
  $unsetRandomIntegerFunction(): WRPickerConfig {
    this.randomIntegerFunctionValue = undefined;
    return this;
  }

  /**
   * Changes the weight of an already-added `element`.
   * @returns `false` if `element` was never added, `true` otherwise.
   */
  change(element: unknown, newWeight: number): boolean {
    const entry = this.entries.get(element);
    if (!entry) {
      return false;
    }
    if (entry.weight !== newWeight) {
      entry.weight = newWeight;
      this.normalizedListCache = null;
    }
    return true;
  }

  /**
   * Removes a previously-added `element`.
   * @returns `false` if `element` was never added, `true` otherwise.
   */
  remove(element: unknown): boolean {
    if (!this.entries.has(element)) {
      return false;
    }
    this.entries.delete(element);
    this.normalizedListCache = null;
    return true;
  }

  get numPicks(): number {
    return this.numPicksValue;
  }

  get exhaustible(): boolean {
    return this.exhaustibleFlag;
  }

  /**
   * The normalized `[source, percentageWeight]` list backing this
   * configuration, computed (and cached) via
   * `weightedRandomMath.computeNormalizedList`. The cache is invalidated
   * by `$add`/`change`/`remove`.
   */
  get normalizedList(): NormalizedEntry[] {
    if (!this.normalizedListCache) {
      this.normalizedListCache = computeNormalizedList([...this.entries.values()]);
    }
    return this.normalizedListCache;
  }

  get randomIntegerFunction(): RandomIntegerFunction | undefined {
    return this.randomIntegerFunctionValue;
  }
}
