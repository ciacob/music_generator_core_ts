import { shuffle } from '../../utils/Arrays.js';
import { getRandomInteger } from '../../utils/NumberUtil.js';
import { sprintf } from '../../utils/Strings.js';
import { buildRafflePool, removeAllOccurrences } from './weightedRandomMath.js';
import type { NormalizedEntry, RandomIntegerFunction } from './weightedRandomMath.js';
import type { WRPickerConfig } from './WRPickerConfig.js';

const SHUFFLE_PASSES = 10;
const NOT_ENOUGH_UNIQUE_OPTIONS =
  'WeightedRandomPicker - Configuration Error: Cannot pick %d unique ' +
  'values from a list of %d available options. Adjust either value, or turn off the `exhaustible` flag.';

/**
 * Draws elements from a `WRPickerConfig`'s weighted candidate list,
 * either with or without repetition, by expanding candidates into a flat
 * "raffle pool" (each candidate repeated in proportion to its normalized
 * weight) and drawing uniformly random indices from it.
 *
 * Ported from
 * `as-sources/weighted-random-picker-library/ro/se/stochastic/random/WeightedRandomPicker.as`.
 *
 * One addition relative to the AS3 original: the constructor accepts an
 * optional `randomFn` used for the internal pool-shuffling step. The
 * original had no way to seed this — `_shuffle()` called `Arrays.shuffle`,
 * which hardcoded `Math.random()`, entirely independent of whatever
 * `WRPickerConfig.$setRandomIntegerFunction` was configured (that only
 * ever fed into index *picking*, via the `RANDOM_INTEGER` getter below,
 * never into shuffling). This was a real, verified asymmetry in the
 * original design: picks were seedable, shuffling never was. `randomFn`
 * here closes that gap for testability, defaulting to `Math.random` so
 * behavior is unchanged unless a caller opts in.
 */
export class WeightedRandomPicker {
  private configuration: WRPickerConfig | null = null;
  private areDuplicatesPermitted = false;
  private availableOptions: NormalizedEntry[] = [];
  private rafflePool: unknown[] = [];
  private numDrawings = 1;

  /**
   * @param randomFn Seedable source of randomness for pool shuffling. Defaults to `Math.random`.
   * @see this file's own doc comment for why shuffling and index-picking need separate seeding.
   */
  constructor(private readonly randomFn: () => number = Math.random) {}

  /** Applies a configuration, immediately (re)building the raffle pool. */
  configure(cfg: WRPickerConfig): void {
    this.configuration = cfg;
    this.rebuild();
  }

  /** Rebuilds and reshuffles the raffle pool from the current configuration, without re-reading it. */
  refill(): void {
    this.rafflePool = buildRafflePool(this.availableOptions);
    this.shufflePool();
  }

  /**
   * Draws the configured number of elements (`WRPickerConfig.numPicks`).
   *
   * @returns A (possibly empty) array of picked elements. Empty when
   * extracting duplicates is forbidden and the pool of drawable elements
   * has been exhausted.
   */
  pick(): unknown[] {
    const ret: unknown[] = [];
    if (this.rafflePool.length === 0) {
      return ret;
    }
    while (ret.length < this.numDrawings) {
      ret.push(this.pickAnOption());
    }
    return ret;
  }

  /** Whether the drawable pool has run out (always `false` if duplicate picks are permitted). */
  get exhausted(): boolean {
    if (this.areDuplicatesPermitted) {
      return false;
    }
    return this.rafflePool.length === 0;
  }

  /**
   * The random-integer source used for index picking: the configuration's
   * custom function if one was supplied via
   * `WRPickerConfig.$setRandomIntegerFunction`, otherwise
   * `NumberUtil.getRandomInteger`.
   */
  private get randomInteger(): RandomIntegerFunction {
    return this.configuration?.randomIntegerFunction ?? getRandomInteger;
  }

  private rebuild(): void {
    // Unreachable in practice: `rebuild` is private and only ever called
    // from `configure()`, immediately after `this.configuration` is set.
    // This guard exists purely to satisfy strict null checks.
    if (!this.configuration) {
      return;
    }
    this.numDrawings = this.configuration.numPicks;
    this.areDuplicatesPermitted = !this.configuration.exhaustible;
    this.availableOptions = this.configuration.normalizedList;
    const numOptions = this.availableOptions.length;
    if (this.numDrawings > numOptions && !this.areDuplicatesPermitted) {
      throw new Error(sprintf(NOT_ENOUGH_UNIQUE_OPTIONS, this.numDrawings, numOptions));
    }
    this.rafflePool = buildRafflePool(this.availableOptions);
    this.shufflePool();
  }

  /**
   * We have two cases:
   * 1. Duplicates are permitted in the returned set: pick anything,
   *    return it.
   * 2. Duplicates are not permitted, and we picked some (new kind of)
   *    element: remove all its copies from the pool (so the same kind of
   *    element can't be picked again), return it.
   *
   * (The AS3 original notes a third case — picking a kind of element
   * already excluded — never occurs, since duplicates are removed as
   * described.)
   */
  private pickAnOption(): unknown {
    const chosenIndex = this.randomInteger(0, this.rafflePool.length - 1);
    const picked = this.rafflePool[chosenIndex];
    if (this.areDuplicatesPermitted) {
      return picked;
    }
    this.rafflePool = removeAllOccurrences(this.rafflePool, picked);
    return picked;
  }

  private shufflePool(): void {
    let shuffleCount = SHUFFLE_PASSES;
    do {
      shuffle(this.rafflePool, this.randomFn);
    } while (--shuffleCount > 0);
  }
}
