import type { IFraction } from '../../math/IFraction.js';
import type { IMusicUnit } from './IMusicUnit.js';

/** Callback shape for `every`/`forEach`/`some`, mirroring `Array.prototype` callbacks but passing the `IMusicalBody` itself as the third argument. */
export type MusicalBodyCallback<R> = (unit: IMusicUnit, index: number, body: IMusicalBody) => R;

/**
 * A container for `IMusicUnit` objects, representing the actual musical
 * result of a generation operation, in a meta-musical format.
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/ro/se/legacy/generators/core/interfaces/IMusicalBody.as`.
 * Array-like, same design as `ITimeSignatureMap` in step 4. `length` is
 * mutable here (unlike `ITimeSignatureMap.length`), matching the AS3
 * original's explicit `get`/`set` pair (mirroring `Array.prototype.length`,
 * which can also be assigned to truncate/extend an array).
 */
export interface IMusicalBody {
  /**
   * The total musical duration of the contained music units.
   *
   * This is automatically recalculated whenever units are added to or
   * removed from the body. HOWEVER, individual changes to an already-
   * added unit's own `duration` are NOT tracked — call `updateDuration()`
   * after altering an existing unit's duration.
   */
  readonly duration: IFraction;

  /**
   * Recalculates the total musical duration of the contained units. This
   * is a time-consuming process — call it as seldom as possible (e.g. at
   * the end of a loop, not on every iteration).
   */
  updateDuration(): void;

  /** @see Array.prototype.length */
  length: number;

  /** @see Array.prototype.every */
  every(callback: MusicalBodyCallback<boolean>): boolean;

  /** @see Array.prototype.forEach */
  forEach(callback: MusicalBodyCallback<void>): void;

  /** Returns the unit at the given index. */
  getAt(index: number): IMusicUnit;

  /** @see Array.prototype.indexOf */
  indexOf(searchUnit: IMusicUnit, fromIndex?: number): number;

  /** Inserts `unit` at `index`, shifting subsequent units back. */
  insertAt(index: number, unit: IMusicUnit): void;

  /** @see Array.prototype.lastIndexOf */
  lastIndexOf(searchUnit: IMusicUnit, fromIndex?: number): number;

  /** @see Array.prototype.pop */
  pop(): IMusicUnit | undefined;

  /** @see Array.prototype.push */
  push(...units: IMusicUnit[]): number;

  /** Removes and returns the unit at `index`. */
  removeAt(index: number): IMusicUnit;

  /** @see Array.prototype.reverse */
  reverse(): void;

  /** @see Array.prototype.shift */
  shift(): IMusicUnit | undefined;

  /** @see Array.prototype.some */
  some(callback: MusicalBodyCallback<boolean>): boolean;

  /** @see Array.prototype.sort */
  sort(compareFn?: (a: IMusicUnit, b: IMusicUnit) => number): void;

  /** @see Array.prototype.splice */
  splice(startIndex: number, deleteCount?: number, ...units: IMusicUnit[]): void;

  /** @see Object.prototype.toString */
  toString(): string;

  /** @see Array.prototype.unshift */
  unshift(...units: IMusicUnit[]): number;
}
