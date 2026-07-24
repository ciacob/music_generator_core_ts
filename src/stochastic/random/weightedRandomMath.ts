/**
 * Pure functions underlying `WRPickerConfig`/`WeightedRandomPicker`.
 *
 * As in `math/fractionMath.ts`, this module holds the actual algorithmic
 * logic as plain functions over plain data, so it's fully unit-testable
 * without constructing either class. `WRPickerConfig` and
 * `WeightedRandomPicker` are thin, stateful wrappers around these.
 *
 * Ported from the private/internal logic of
 * `as-sources/weighted-random-picker-library/ro/se/stochastic/random/WRPickerConfig.as`
 * (`_computeNormalizedList`) and `WeightedRandomPicker.as`
 * (`_compilePool`, and the pool-filtering half of `_pickAnOption`).
 */

/** A single weighted candidate, before normalization. */
export interface WeightEntry {
  /** The candidate value itself. */
  readonly source: unknown;
  /** The candidate's (possibly negative) selection weight. */
  readonly weight: number;
}

/**
 * A `[source, weight]` pair, matching the shape `WRPickerConfig.as`'s
 * `normalizedList` returns (an `Array` of two-element `Array`s) and that
 * `WeightedRandomPicker.as` consumes it as.
 */
export type NormalizedEntry = [source: unknown, weight: number];

/**
 * The signature `WRPickerConfig.$setRandomIntegerFunction` documents for
 * a custom random-integer source: given an inclusive `[limitLow,
 * limitHigh]` range, returns a random integer within it. Note this is
 * deliberately a different shape than the `randomFn: () => number`
 * (a `[0, 1)` float source) used elsewhere in this project (e.g.
 * `NumberUtil.getRandomInteger`'s own optional third parameter) — a
 * `RandomIntegerFunction` *replaces* the whole integer-picking algorithm,
 * rather than just supplying the underlying float source for the default
 * one. `NumberUtil.getRandomInteger` (with its own trailing optional
 * parameter dropped by ordinary call-site arity) satisfies this type.
 */
export type RandomIntegerFunction = (limitLow: number, limitHigh: number) => number;

/**
 * Computes each entry's `Math.ceil((weight / weightsSum) * 100)` share,
 * matching AS3's `uint(NaN)` coercing to `0` when `weightsSum` is `0`
 * (which only arises when every weight in `entries` is `0`) — JS would
 * otherwise propagate `NaN` here instead.
 */
function toShareOrZero(share: number): number {
  return Number.isNaN(share) ? 0 : share;
}

/**
 * Converts a list of (possibly negative-weighted) candidates into a
 * normalized, ascending-by-weight list of `[source, percentageWeight]`
 * pairs whose weights sum to (approximately) 100 — i.e. a distribution
 * with 1%-granularity "slots" per candidate.
 *
 * Negative weights are supported as an inverse-priority mechanism: they
 * are first transposed into a positive range (using the largest negative
 * magnitude as a pivot, so the "heaviest" negative weight — the one meant
 * to be picked *least* often — ends up smallest), then every positive
 * weight is offset upward so the two bands never collide. The combined
 * list is sorted ascending by (pre-normalization) weight before the
 * percentage pass runs.
 *
 * Ported from `WRPickerConfig.as`'s private `_computeNormalizedList`.
 */
export function computeNormalizedList(entries: readonly WeightEntry[]): NormalizedEntry[] {
  let maxNegative = 0;
  const negativeWeights: NormalizedEntry[] = [];
  const positiveWeights: NormalizedEntry[] = [];

  for (const entry of entries) {
    let w = entry.weight;
    if (w < 0) {
      w = Math.abs(w);
      if (w > maxNegative) {
        maxNegative = w;
      }
      negativeWeights.push([entry.source, w]);
      continue;
    }
    positiveWeights.push([entry.source, w]);
  }

  if (negativeWeights.length !== 0) {
    // Also allow the "lightest" (largest-magnitude negative) element to
    // remain pickable. Without this step, it would end up with weight 0
    // after inversion, which means exclusion.
    maxNegative += 1;
    for (const pair of negativeWeights) {
      pair[1] = maxNegative - pair[1];
    }
  }

  if (maxNegative !== 0) {
    for (const pair of positiveWeights) {
      pair[1] = maxNegative + pair[1];
    }
  }

  const combined = negativeWeights.concat(positiveWeights);
  combined.sort((a, b) => a[1] - b[1]);

  const weightsSum = combined.reduce((sum, pair) => sum + pair[1], 0);

  return combined.map(([source, weight]) => {
    const share = toShareOrZero(Math.ceil((weight / weightsSum) * 100));
    return [source, share] as NormalizedEntry;
  });
}

/**
 * Expands a normalized `[source, weight]` list into a flat "raffle pool":
 * each source repeated `weight` times. Picking a uniformly random index
 * from the resulting pool is what gives heavier-weighted sources a
 * proportionally higher chance of being picked.
 *
 * Ported from `WeightedRandomPicker.as`'s private `_compilePool`.
 */
export function buildRafflePool(availableOptions: readonly NormalizedEntry[]): unknown[] {
  const pool: unknown[] = [];
  for (const [source, weight] of availableOptions) {
    for (let i = 0; i < weight; i++) {
      pool.push(source);
    }
  }
  return pool;
}

/**
 * Returns a new array with every occurrence of `value` removed from
 * `pool`, using `===` equality. Used to purge all copies of a just-picked
 * element from the raffle pool when duplicate picks are not permitted.
 *
 * Ported from the pool-filtering loop inside `WeightedRandomPicker.as`'s
 * private `_pickAnOption` (there implemented as a mutating `splice` loop;
 * here as a pure function returning a new array, consistent with this
 * project's preference for pure/testable functions).
 */
export function removeAllOccurrences<T>(pool: readonly T[], value: T): T[] {
  return pool.filter((item) => item !== value);
}
