import { getHindemithsIntervalRoot } from '../../knowledge/harmony/Intervals.js';
import { IntervalRootPositions } from '../../knowledge/harmony/IntervalRootPositions.js';

/**
 * Ported from
 * `as-sources/legacy-generators-core-library/ro/se/legacy/generators/core/helpers/IntervalRegistryEntry.as`.
 *
 * Deferred from step 4: this class and `knowledge/harmony/Intervals.ts`
 * were mutually dependent in the AS3 original (this constructor calls
 * `Intervals.getHindemithsIntervalRoot`, while `Intervals.
 * orderByHindemith2ndSeries` took `IntervalRegistryEntry` as its
 * parameter type). That cycle was broken back in step 4 by typing
 * `orderByHindemith2ndSeries` against a small structural interface
 * (`HindemithSortable`) instead of this class — see `Intervals.ts` for
 * the full explanation. This class now depends one-directionally on
 * `Intervals.ts`/`IntervalRootPositions.ts`, with nothing depending back.
 */
export class IntervalRegistryEntry {
  private readonly lowValue: number;
  private readonly sizeValue: number;
  private readonly rootValue: number;

  /**
   * @param low The lower (bass) MIDI pitch of the interval.
   * @param size The interval's size, in semitones.
   */
  constructor(low: number, size: number) {
    this.lowValue = low;
    this.sizeValue = size;
    const rootPlacement = getHindemithsIntervalRoot(size);
    this.rootValue =
      rootPlacement === IntervalRootPositions.BOTTOM
        ? low
        : rootPlacement === IntervalRootPositions.TOP
          ? low + size
          : Number.MAX_SAFE_INTEGER;
  }

  /** The lower (bass) MIDI pitch of the interval, as given to the constructor. */
  get low(): number {
    return this.lowValue;
  }

  /** The interval's size, in semitones, as given to the constructor. */
  get size(): number {
    return this.sizeValue;
  }

  /**
   * The MIDI pitch Hindemith considers this interval's harmonic root: `low` or `low + size`,
   * whichever `getHindemithsIntervalRoot(size)` designates, or `Number.MAX_SAFE_INTEGER` if the
   * interval's root position is undetermined.
   */
  get root(): number {
    return this.rootValue;
  }

  /** @see Object.prototype.toString */
  toString(): string {
    return `Interval Registry Entry: low=${this.lowValue} | size=${this.sizeValue} | root=${this.rootValue}`;
  }
}
