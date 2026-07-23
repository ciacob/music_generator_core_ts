import { Fraction } from '../math/Fraction.js';
import type { IFraction } from '../math/IFraction.js';
import type { IMusicUnit } from './interfaces/IMusicUnit.js';
import type { IMusicalBody, MusicalBodyCallback } from './interfaces/IMusicalBody.js';

/**
 * A container for `IMusicUnit` objects, representing the actual musical
 * result of a generation operation, in a meta-musical format.
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/ro/se/legacy/generators/core/MusicalBody.as`.
 *
 * **Bug fixed**: the AS3 original's `updateDuration()` calls
 * `_duration.setValue(0, 1)` unconditionally — but `_duration` is only
 * ever lazily initialized by `_addDurationOf`/`_removeDurationOf`, so
 * calling `updateDuration()` (reachable via the public `set length`
 * setter) on a body that never had a unit added would call `.setValue`
 * on a `null` reference and crash. Verified nothing in the engine
 * currently triggers this (no ported code calls `updateDuration()` or
 * sets `.length` before adding units), but it's a one-line fix with no
 * downstream risk, so it's fixed here: `updateDuration()` now lazily
 * initializes `duration` the same way the add/remove helpers already do.
 */
export class MusicalBody implements IMusicalBody {
  private zeroFractionCache: IFraction | null = null;
  private units: IMusicUnit[] = [];
  private durationValue: IFraction | undefined;

  get duration(): IFraction {
    return this.durationValue ?? this.zeroFraction;
  }

  updateDuration(): void {
    if (!this.durationValue) {
      this.durationValue = new Fraction();
    }
    this.durationValue.setValue(0, 1);
    for (const unit of this.units) {
      this.addDurationOf(unit);
    }
  }

  get length(): number {
    return this.units.length;
  }

  set length(value: number) {
    this.units.length = value;
    this.updateDuration();
  }

  every(callback: MusicalBodyCallback<boolean>): boolean {
    return this.units.every((u, i) => callback(u, i, this));
  }

  forEach(callback: MusicalBodyCallback<void>): void {
    this.units.forEach((u, i) => callback(u, i, this));
  }

  getAt(index: number): IMusicUnit {
    return this.units[index] as IMusicUnit;
  }

  indexOf(searchUnit: IMusicUnit, fromIndex = 0): number {
    return this.units.indexOf(searchUnit, fromIndex);
  }

  insertAt(index: number, unit: IMusicUnit): void {
    this.units.splice(index, 0, unit);
    this.addDurationOf(unit);
  }

  lastIndexOf(searchUnit: IMusicUnit, fromIndex = 0x7fffffff): number {
    return this.units.lastIndexOf(searchUnit, fromIndex);
  }

  pop(): IMusicUnit | undefined {
    const unit = this.units[this.units.length - 1];
    if (unit) {
      this.removeDurationOf(unit);
    }
    return this.units.pop();
  }

  push(...units: IMusicUnit[]): number {
    for (const unit of units) {
      this.addDurationOf(unit);
    }
    return this.units.push(...units);
  }

  removeAt(index: number): IMusicUnit {
    const unit = this.units[index] as IMusicUnit;
    this.removeDurationOf(unit);
    this.units.splice(index, 1);
    return unit;
  }

  reverse(): void {
    this.units.reverse();
  }

  shift(): IMusicUnit | undefined {
    const unit = this.units[0];
    if (unit) {
      this.removeDurationOf(unit);
    }
    return this.units.shift();
  }

  some(callback: MusicalBodyCallback<boolean>): boolean {
    return this.units.some((u, i) => callback(u, i, this));
  }

  sort(compareFn?: (a: IMusicUnit, b: IMusicUnit) => number): void {
    this.units.sort(compareFn);
  }

  splice(startIndex: number, deleteCount = 0xffffffff, ...units: IMusicUnit[]): void {
    if (deleteCount > 0) {
      const unitsToDelete = this.units.slice(startIndex, startIndex + deleteCount);
      for (const unit of unitsToDelete) {
        this.removeDurationOf(unit);
      }
    }
    if (units.length > 0) {
      for (const unit of units) {
        this.addDurationOf(unit);
      }
    }
    this.units.splice(startIndex, deleteCount, ...units);
  }

  toString(): string {
    return this.units.toString();
  }

  unshift(...units: IMusicUnit[]): number {
    for (const unit of units) {
      this.addDurationOf(unit);
    }
    return this.units.unshift(...units);
  }

  /** Updates the total duration to include the duration of `unit`. */
  private addDurationOf(unit: IMusicUnit): void {
    if (this.durationValue == null) {
      this.durationValue = new Fraction();
    }
    this.durationValue = this.durationValue.add(unit.duration);
  }

  /** Updates the total duration to remove the duration of `unit`. */
  private removeDurationOf(unit: IMusicUnit): void {
    if (this.durationValue == null) {
      this.durationValue = new Fraction();
    }
    this.durationValue = this.durationValue.subtract(unit.duration);
  }

  /** A cached `IFraction` equal to "0", used before any units have been added. */
  private get zeroFraction(): IFraction {
    if (!this.zeroFractionCache) {
      this.zeroFractionCache = Fraction.ZERO;
    }
    return this.zeroFractionCache;
  }
}
