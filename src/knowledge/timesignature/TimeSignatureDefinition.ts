import { Fraction } from '../../math/Fraction.js';
import type { IFraction } from '../../math/IFraction.js';
import { AbstractTimeSignatureDefinition } from './AbstractTimeSignatureDefinition.js';
import type { IMetricAccent } from './IMetricAccent.js';
import type { ITimeSignatureDefinition } from './ITimeSignatureDefinition.js';
import {
  ACCENT_DECAY,
  MAX_ACCENT_STRENGTH,
  MIN_ACCENT_STRENGTH,
  assertProperDenominator,
  assertProperNumerator,
  inferJunctions,
  inferMetricAccents,
} from './timeSignatureMath.js';

/**
 * Represents a musical time signature, both with regard to its visual
 * materialization (the fraction displayed at the beginning of a measure)
 * and to its implicit properties, such as distribution of metrical
 * accents and junctions (beat grouping boundaries).
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/eu/stochastic/engine/music/knowledge/timesignature/TimeSignatureDefinition.as`.
 * The inference algorithm itself (junctions, accents, validation) lives
 * in `timeSignatureMath.ts` as pure functions; this class is a thin
 * wrapper that computes each once in the constructor and caches the
 * results.
 */
export class TimeSignatureDefinition
  extends AbstractTimeSignatureDefinition
  implements ITimeSignatureDefinition
{
  static readonly MAX_ACCENT_STRENGTH = MAX_ACCENT_STRENGTH;
  static readonly MIN_ACCENT_STRENGTH = MIN_ACCENT_STRENGTH;
  static readonly ACCENT_DECAY = ACCENT_DECAY;

  private readonly shownNumeratorValue: number;
  private readonly shownDenominatorValue: number;
  private readonly fractionValue: IFraction;
  private readonly junctionsValue: IFraction[];
  private readonly metricAccentsValue: IMetricAccent[];

  /**
   * @param shownNumerator The numerator of the fraction representing
   * this time signature, in its traditional (display) form — usually
   * NOT the fraction's mathematical simplest form, e.g. one writes `4/4`
   * instead of `1`.
   * @param shownDenominator The denominator of the fraction representing
   * this time signature, in its traditional (display) form.
   * @param junctions Optional, default `undefined`. For most common time
   * signatures, junctions can be determined by calculus, but for
   * irregular time signatures (e.g. 7/8, 5/4) there are multiple
   * grouping solutions (e.g. "3/8 + 2/8 + 2/8" or "2/8 + 3/8 + 2/8")
   * which cannot be inferred automatically. If given, must contain the
   * fractions that define the beats where beaming is to be broken.
   * @param metricAccents Optional, default `undefined`. Only needed if
   * the metric accent distribution for this time signature cannot be
   * inferred from its `junctions` (given or calculated). If given, must
   * contain the metric accents describing how a measure using this time
   * signature is to be stressed.
   * @throws {Error} If `shownNumerator` is `0`; if `shownDenominator` is
   * `0`; or if `shownDenominator` is not a power of `2`.
   */
  constructor(
    shownNumerator: number,
    shownDenominator: number,
    junctions?: IFraction[],
    metricAccents?: IMetricAccent[],
  ) {
    super();
    assertProperNumerator(shownNumerator);
    assertProperDenominator(shownDenominator);

    this.shownNumeratorValue = shownNumerator;
    this.shownDenominatorValue = shownDenominator;
    this.fractionValue = new Fraction(shownNumerator, shownDenominator);
    this.junctionsValue =
      junctions ?? inferJunctions(this.fractionValue, shownNumerator, shownDenominator);
    this.metricAccentsValue =
      metricAccents ?? inferMetricAccents(shownDenominator, this.junctionsValue);
  }

  override get fraction(): IFraction {
    return this.fractionValue;
  }

  override get shownNumerator(): number {
    return this.shownNumeratorValue;
  }

  override get shownDenominator(): number {
    return this.shownDenominatorValue;
  }

  override get metricAccents(): IMetricAccent[] {
    return this.metricAccentsValue;
  }

  override get junctions(): IFraction[] {
    return this.junctionsValue;
  }

  /** @see Object.prototype.toString */
  toString(): string {
    return (
      'TimeSignatureDefinition:\n-numerator:' +
      this.shownNumeratorValue +
      '\n-denominator: ' +
      this.shownDenominatorValue +
      '\n-fraction: ' +
      this.fractionValue +
      '\n-junctions: ' +
      this.junctionsValue.join(', ') +
      '\n-metricAccents: ' +
      this.metricAccentsValue.join(', ') +
      '\n'
    );
  }
}
