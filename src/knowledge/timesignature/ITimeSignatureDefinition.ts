import type { IFraction } from '../../math/IFraction.js';
import type { IMetricAccent } from './IMetricAccent.js';

/**
 * Container to store information that defines a musical time signature.
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/eu/stochastic/engine/music/knowledge/timesignature/interfaces/ITimeSignatureDefinition.as`.
 * `Vector.<T>` becomes `T[]` per this project's translation conventions.
 */
export interface ITimeSignatureDefinition {
  /**
   * The mathematical fraction that represents the duration of a measure
   * using this time signature definition, e.g. for "common time" (aka
   * 4/4), that would be a "(one) whole" fraction, or 1/1.
   */
  readonly fraction: IFraction;

  /**
   * The numerator to be used for display purposes when notating a
   * measure that uses this time signature. Frequently enough, this is
   * different from the fraction's numerator, e.g. in "common time" it
   * would be `4`, whereas the mathematical fraction in simplest form is
   * `1/1`.
   */
  readonly shownNumerator: number;

  /**
   * The denominator to be used for display purposes, when notating a
   * measure that uses this time signature. Frequently enough, this is
   * different from the fraction's denominator, e.g. in "common time" it
   * would be `4`, whereas the mathematical fraction in simplest form is
   * `1/1`.
   */
  readonly shownDenominator: number;

  /**
   * A list of metric accents that define how a measure of music using
   * this time signature is to be stressed (if only theoretically) when
   * played, e.g. "common time" defines a "strong" metric accent on the
   * first beat (1/4) and a "weak" one on the third (3/4).
   */
  readonly metricAccents: IMetricAccent[];

  /**
   * A list of fractions that define the beats where beaming is to be
   * broken for display purposes, when notating a measure that uses this
   * time signature, e.g. "common time" usually beams eighths or lower
   * durations in two groups of two beats each (so beats 1 & 2 are beamed
   * together, and so are beats 3 & 4). This effectively means there's a
   * "beam break" set at the end of the second beat, so `junctions` would
   * contain only one `2/4` (or, in simple form, `1/2`) fraction for
   * common time.
   */
  readonly junctions: IFraction[];
}
