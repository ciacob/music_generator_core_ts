import { Fraction } from '../../math/Fraction.js';
import type { IFraction } from '../../math/IFraction.js';
import { AbstractTimeSignatureDefinition } from './AbstractTimeSignatureDefinition.js';
import { MetricAccent } from './MetricAccent.js';
import type { IMetricAccent } from './IMetricAccent.js';
import type { ITimeSignatureDefinition } from './ITimeSignatureDefinition.js';

/**
 * The built-in "common time" (4/4) time signature definition.
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/eu/stochastic/engine/music/knowledge/timesignature/CommonTime.as`.
 */
export class CommonTime extends AbstractTimeSignatureDefinition implements ITimeSignatureDefinition {
  private fractionCache: IFraction | null = null;
  private junctionsCache: IFraction[] | null = null;
  private metricAccentsCache: IMetricAccent[] | null = null;

  override get fraction(): IFraction {
    if (!this.fractionCache) {
      this.fractionCache = new Fraction(1);
    }
    return this.fractionCache;
  }

  override get junctions(): IFraction[] {
    if (!this.junctionsCache) {
      this.junctionsCache = [new Fraction(3, 4)];
    }
    return this.junctionsCache;
  }

  override get metricAccents(): IMetricAccent[] {
    if (!this.metricAccentsCache) {
      const primaryAccent = new MetricAccent(1, new Fraction(1, 4));
      const secondaryAccent = new MetricAccent(0.75, new Fraction(3, 4));
      this.metricAccentsCache = [primaryAccent, secondaryAccent];
    }
    return this.metricAccentsCache;
  }

  override get shownDenominator(): number {
    return 4;
  }

  override get shownNumerator(): number {
    return 4;
  }
}
