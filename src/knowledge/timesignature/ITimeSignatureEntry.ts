import type { IFraction } from '../../math/IFraction.js';
import type { ITimeSignatureDefinition } from './ITimeSignatureDefinition.js';

/**
 * Represents one entry in an `ITimeSignatureMap`. Binds a span of measures
 * to an `ITimeSignatureDefinition`, essentially stating that for a given
 * stretch of measures, a certain time signature is to be used.
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/eu/stochastic/engine/music/knowledge/timesignature/interfaces/ITimeSignatureEntry.as`.
 *
 * `signature`'s getter is typed as possibly `undefined` — unlike the AS3
 * original, whose declared getter type (`ITimeSignatureDefinition`, never
 * `null`) doesn't reflect that a freshly-constructed entry genuinely has
 * no signature set yet (AS3's loose typing let that go unstated; see
 * `TimeSignatureEntry.ts`, whose `duration` getter has to defensively
 * check for exactly this case). The setter still only accepts a real
 * `ITimeSignatureDefinition` — there's no "unset" operation in the
 * original API, so this is a getter/setter type asymmetry now made
 * explicit via separate `get`/`set` interface members (TypeScript 4.3+).
 */
export interface ITimeSignatureEntry {
  /**
   * The musical duration representing this entry's span (the product of
   * its `signature` and `repetitions`).
   */
  readonly duration: IFraction;

  /** How many subsequent measures using the given time signature to employ. */
  get repetitions(): number;
  set repetitions(value: number);

  /** The time signature details. */
  get signature(): ITimeSignatureDefinition | undefined;
  set signature(value: ITimeSignatureDefinition);
}
