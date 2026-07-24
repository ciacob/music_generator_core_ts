import { Fraction } from '../../math/Fraction.js';
import type { IFraction } from '../../math/IFraction.js';
import type { ITimeSignatureEntry } from './ITimeSignatureEntry.js';
import type { ITimeSignatureMap, TimeSignatureMapCallback } from './ITimeSignatureMap.js';

/**
 * Container to store a number of musical measures with their respective
 * time signatures.
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/eu/stochastic/engine/music/knowledge/timesignature/helpers/TimeSignatureMap.as`.
 *
 * As noted in `ITimeSignatureMap.ts`, this whole Array-like mutation
 * surface is unused by the generation engine itself (verified by grep —
 * only `duration`, `length`, and `getAt()` are ever called elsewhere),
 * but is kept in full as a "core contract" per the project README.
 *
 * Two bug fixes versus the AS3 original, both verified to have zero
 * practical effect (neither method is ever called anywhere in the
 * engine) but fixed anyway since both are cheap, low-risk corrections —
 * same reasoning as the earlier `ColorUtils.generateRandomColor` fix:
 *
 * 1. `splice()` passed the rest-arg `entries` *array* as a single third
 *    argument to the underlying `Vector.splice(startIndex, deleteCount,
 *    entries)`, rather than spreading it — meaning the whole array would
 *    have been inserted as one bogus element instead of its individual
 *    entries (contradicting the duration-accounting loop just above it
 *    in the same method, which correctly iterated `entries[i]`
 *    individually).
 * 2. `pop()`/`shift()` on an empty map would call `entry.duration` on an
 *    `undefined` entry, crashing. TypeScript's strict null checking
 *    surfaces this directly at compile time (the helper `entry` is
 *    typed `ITimeSignatureEntry | undefined`), so the guard below isn't
 *    optional polish — it's required to compile — but it also happens to
 *    fix the underlying crash.
 */
export class TimeSignatureMap implements ITimeSignatureMap {
  private zeroFractionCache: IFraction | null = null;
  private entries: ITimeSignatureEntry[] = [];
  private durationCache: IFraction | undefined;

  /** @see ITimeSignatureMap.duration */
  get duration(): IFraction {
    return this.durationCache ?? this.zeroFraction;
  }

  /** @see ITimeSignatureMap.length */
  get length(): number {
    return this.entries.length;
  }

  /** @see ITimeSignatureMap.every */
  every(callback: TimeSignatureMapCallback<boolean>): boolean {
    return this.entries.every((entry, index) => callback(entry, index, this));
  }

  /** @see ITimeSignatureMap.forEach */
  forEach(callback: TimeSignatureMapCallback<void>): void {
    this.entries.forEach((entry, index) => callback(entry, index, this));
  }

  /** @see ITimeSignatureMap.getAt */
  getAt(index: number): ITimeSignatureEntry {
    return this.entries[index] as ITimeSignatureEntry;
  }

  /** @see ITimeSignatureMap.indexOf */
  indexOf(searchEntry: ITimeSignatureEntry, fromIndex = 0): number {
    return this.entries.indexOf(searchEntry, fromIndex);
  }

  /** @see ITimeSignatureMap.insertAt */
  insertAt(index: number, entry: ITimeSignatureEntry): void {
    this.entries.splice(index, 0, entry);
    this.addDurationOf(entry);
  }

  /** @see ITimeSignatureMap.lastIndexOf */
  lastIndexOf(searchEntry: ITimeSignatureEntry, fromIndex = 0x7fffffff): number {
    return this.entries.lastIndexOf(searchEntry, fromIndex);
  }

  /** @see ITimeSignatureMap.pop */
  pop(): ITimeSignatureEntry | undefined {
    const entry = this.entries[this.entries.length - 1];
    if (entry) {
      this.removeDurationOf(entry);
    }
    return this.entries.pop();
  }

  /** @see ITimeSignatureMap.push */
  push(...entries: ITimeSignatureEntry[]): number {
    for (const entry of entries) {
      this.addDurationOf(entry);
    }
    return this.entries.push(...entries);
  }

  /** @see ITimeSignatureMap.removeAt */
  removeAt(index: number): ITimeSignatureEntry {
    const entry = this.entries[index] as ITimeSignatureEntry;
    this.removeDurationOf(entry);
    this.entries.splice(index, 1);
    return entry;
  }

  /** @see ITimeSignatureMap.reverse */
  reverse(): void {
    this.entries.reverse();
  }

  /** @see ITimeSignatureMap.shift */
  shift(): ITimeSignatureEntry | undefined {
    const entry = this.entries[0];
    if (entry) {
      this.removeDurationOf(entry);
    }
    return this.entries.shift();
  }

  /** @see ITimeSignatureMap.some */
  some(callback: TimeSignatureMapCallback<boolean>): boolean {
    return this.entries.some((entry, index) => callback(entry, index, this));
  }

  /** @see ITimeSignatureMap.sort */
  sort(compareFn?: (a: ITimeSignatureEntry, b: ITimeSignatureEntry) => number): void {
    this.entries.sort(compareFn);
  }

  /** @see ITimeSignatureMap.splice */
  splice(startIndex: number, deleteCount = 0xffffffff, ...entries: ITimeSignatureEntry[]): void {
    if (deleteCount > 0) {
      const entriesToDelete = this.entries.slice(startIndex, startIndex + deleteCount);
      for (const entry of entriesToDelete) {
        this.removeDurationOf(entry);
      }
    }
    if (entries.length > 0) {
      for (const entry of entries) {
        this.addDurationOf(entry);
      }
    }
    this.entries.splice(startIndex, deleteCount, ...entries);
  }

  /** @see ITimeSignatureMap.toString */
  toString(): string {
    return this.entries.toString();
  }

  /** @see ITimeSignatureMap.unshift */
  unshift(...entries: ITimeSignatureEntry[]): number {
    for (const entry of entries) {
      this.addDurationOf(entry);
    }
    return this.entries.unshift(...entries);
  }

  /** Updates the total `duration` to include the duration of `entry`. */
  private addDurationOf(entry: ITimeSignatureEntry): void {
    if (this.durationCache == null) {
      this.durationCache = new Fraction();
    }
    this.durationCache = this.durationCache.add(entry.duration);
  }

  /** Updates the total `duration` to remove the duration of `entry`. */
  private removeDurationOf(entry: ITimeSignatureEntry): void {
    if (this.durationCache == null) {
      this.durationCache = new Fraction();
    }
    this.durationCache = this.durationCache.subtract(entry.duration);
  }

  /** A cached `IFraction` equal to "0", used before any entries have been added. */
  private get zeroFraction(): IFraction {
    if (!this.zeroFractionCache) {
      this.zeroFractionCache = Fraction.ZERO;
    }
    return this.zeroFractionCache;
  }
}
