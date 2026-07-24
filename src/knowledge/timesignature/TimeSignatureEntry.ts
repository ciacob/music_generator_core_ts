import { Fraction } from '../../math/Fraction.js';
import type { IFraction } from '../../math/IFraction.js';
import type { ITimeSignatureDefinition } from './ITimeSignatureDefinition.js';
import type { ITimeSignatureEntry } from './ITimeSignatureEntry.js';

/**
 * @see ITimeSignatureEntry
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/eu/stochastic/engine/music/knowledge/timesignature/helpers/TimeSignatureEntry.as`.
 *
 * Two small, verified-harmless corrections versus the AS3 original (its
 * `toString()` is never called anywhere in the engine, confirmed by grep,
 * so neither has any practical effect — flagged here for transparency,
 * not because either mattered downstream): `toString()` now reads
 * `this.duration` (the lazily-computing getter) rather than the raw
 * `_duration` cache field directly, which in the original could print
 * `undefined` if `toString()` happened to be called before the `duration`
 * getter ever ran; and a spelling fix ("accounting", not "acounting").
 */
export class TimeSignatureEntry implements ITimeSignatureEntry {
  private zeroFractionCache: IFraction | null = null;
  private durationDirty = false;
  private repetitionsValue = 0;
  private signatureValue: ITimeSignatureDefinition | undefined;
  private durationCache: IFraction | undefined;

  /** @see ITimeSignatureEntry.duration */
  get duration(): IFraction {
    if (!this.signatureValue) {
      return this.zeroFraction;
    }
    if (!this.repetitionsValue) {
      return this.zeroFraction;
    }
    if (!this.durationCache || this.durationDirty) {
      const repetitionsAsFraction = new Fraction(this.repetitionsValue, 1);
      this.durationCache = this.signatureValue.fraction.multiply(repetitionsAsFraction);
      this.durationDirty = false;
    }
    return this.durationCache;
  }

  /** @see ITimeSignatureEntry.repetitions */
  get repetitions(): number {
    return this.repetitionsValue;
  }

  /** @see ITimeSignatureEntry.repetitions */
  set repetitions(value: number) {
    this.repetitionsValue = value;
    this.durationDirty = true;
  }

  /** @see ITimeSignatureEntry.signature */
  get signature(): ITimeSignatureDefinition | undefined {
    return this.signatureValue;
  }

  /** @see ITimeSignatureEntry.signature */
  set signature(value: ITimeSignatureDefinition) {
    this.signatureValue = value;
    this.durationDirty = true;
  }

  /** A cached `IFraction` equal to "0", used before `signature`/`repetitions` are set. */
  private get zeroFraction(): IFraction {
    if (!this.zeroFractionCache) {
      this.zeroFractionCache = Fraction.ZERO;
    }
    return this.zeroFractionCache;
  }

  /** @see Object.prototype.toString */
  toString(): string {
    return `${this.repetitionsValue} measures of ${this.signatureValue?.shownNumerator}/${this.signatureValue?.shownDenominator} accounting for ${this.duration}`;
  }
}
