import type { IFraction } from '../../math/IFraction.js';
import type { ITimeSignatureEntry } from './ITimeSignatureEntry.js';

/**
 * Callback shape used by `every`/`forEach`/`some` — matches the AS3
 * original's `_wrapCallback` adapter, which substitutes the map itself
 * (`this`, exposed as `_self`) for the internal `Vector` that a plain
 * `Vector.<T>.forEach`-style callback would otherwise receive as its
 * third argument.
 */
export type TimeSignatureMapCallback<R> = (
  entry: ITimeSignatureEntry,
  index: number,
  map: ITimeSignatureMap,
) => R;

/**
 * Container to store a number of musical measures with their respective
 * time signatures.
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/eu/stochastic/engine/music/knowledge/timesignature/interfaces/ITimeSignatureMap.as`.
 *
 * This is intentionally a general-purpose, `Array`-like editable
 * container (mirroring most of `Array.prototype`'s mutator surface) even
 * though the generation engine itself only ever reads `duration`,
 * `length`, and `getAt()` — see `TimeSignatureMap.ts` for the
 * grep-verified usage note. It's kept in full because it's a "core
 * contract" of the engine's public API (per the project README's package
 * map), not an internal implementation detail scoped down like the
 * `utils/` helpers were in step 2.
 *
 * `pop()`/`shift()` are typed to possibly return `undefined` (calling
 * either on an empty map) — again more honest than the AS3 original's
 * always-`ITimeSignatureEntry` declared return type.
 */
export interface ITimeSignatureMap {
  /** The total musical duration, as a fraction. */
  readonly duration: IFraction;

  /** @see Array.prototype.length */
  readonly length: number;

  /** @see Array.prototype.every */
  every(callback: TimeSignatureMapCallback<boolean>): boolean;

  /** @see Array.prototype.forEach */
  forEach(callback: TimeSignatureMapCallback<void>): void;

  /** Returns the entry at the given index. */
  getAt(index: number): ITimeSignatureEntry;

  /** @see Array.prototype.indexOf */
  indexOf(searchEntry: ITimeSignatureEntry, fromIndex?: number): number;

  /** Inserts `entry` at `index`, shifting subsequent entries back. */
  insertAt(index: number, entry: ITimeSignatureEntry): void;

  /** @see Array.prototype.lastIndexOf */
  lastIndexOf(searchEntry: ITimeSignatureEntry, fromIndex?: number): number;

  /** @see Array.prototype.pop */
  pop(): ITimeSignatureEntry | undefined;

  /** @see Array.prototype.push */
  push(...entries: ITimeSignatureEntry[]): number;

  /** Removes and returns the entry at `index`. */
  removeAt(index: number): ITimeSignatureEntry;

  /** @see Array.prototype.reverse */
  reverse(): void;

  /** @see Array.prototype.shift */
  shift(): ITimeSignatureEntry | undefined;

  /** @see Array.prototype.some */
  some(callback: TimeSignatureMapCallback<boolean>): boolean;

  /** @see Array.prototype.sort */
  sort(compareFn?: (a: ITimeSignatureEntry, b: ITimeSignatureEntry) => number): void;

  /** @see Array.prototype.splice */
  splice(startIndex: number, deleteCount?: number, ...entries: ITimeSignatureEntry[]): void;

  /** @see Object.prototype.toString */
  toString(): string;

  /** @see Array.prototype.unshift */
  unshift(...entries: ITimeSignatureEntry[]): number;
}
