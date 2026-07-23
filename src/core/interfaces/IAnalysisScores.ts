/**
 * Iterator callback for `IAnalysisScores.forEach`. Returning `false`
 * stops iteration early, matching the AS3 original's documented
 * `Array.prototype.some`-style early-termination convention.
 */
export type AnalysisScoresIterator = (criteria: string, value: number) => boolean | void;

/**
 * Container to hold the scores obtained by a given music unit in regard
 * to various analysis criteria. Maintains `criteria -> value` entries,
 * stored as `string -> number` respectively.
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/ro/se/legacy/generators/core/interfaces/IAnalysisScores.as`.
 * `getValueFor`'s AS3 return type is declared `int`, but its own doc
 * comment says it returns `NaN` when the criteria isn't found — `int`
 * can't actually hold `NaN` in AS3 either (it would silently coerce to
 * `0`), so the declared type and the documented behavior already
 * disagreed in the original. Typed as `number` here, which is at least
 * capable of representing what the documentation describes; the actual
 * sentinel value is a concrete-class decision (`AnalysisScores.ts`, step
 * 7), not something this interface needs to resolve.
 */
export interface IAnalysisScores {
  /**
   * Stores a `criteria -> value` entry. If a value is already stored
   * under the given `criteria`, it is overridden.
   */
  add(criteria: string, value: number): void;

  /** Retrieves the value associated with `criteria`. */
  getValueFor(criteria: string): number;

  /** Removes the entry for `criteria`, provided it exists. */
  remove(criteria: string): void;

  /** Iterates all added entries in insertion order. */
  forEach(iterator: AnalysisScoresIterator): void;

  /** Removes all stored entries. */
  empty(): void;

  /** Whether there are no stored entries. */
  isEmpty(): boolean;
}
