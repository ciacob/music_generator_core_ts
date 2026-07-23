import { Fraction } from '../../math/Fraction.js';
import type { IFraction } from '../../math/IFraction.js';
import type { IMetricAccent } from './IMetricAccent.js';

/**
 * Ported from
 * `as-sources/legacy-generators-core-library/eu/stochastic/engine/music/knowledge/timesignature/helpers/MetricAccent.as`.
 *
 * The AS3 original's fields are untyped-initialized (`Number` defaults to
 * `NaN`, the `IFraction` reference defaults to `null`) and every real
 * usage in the engine follows a "construct, then immediately assign both
 * properties" pattern (`new MetricAccent; x.strength = ...; x.position =
 * ...`). To keep `IMetricAccent`'s fields honestly non-nullable (matching
 * the interface as declared) while still supporting that same
 * zero-argument construction style, the constructor here takes optional
 * `strength`/`position` parameters defaulting to `0`/`Fraction.ZERO`
 * rather than leaving the fields transiently `NaN`/`null`.
 */
export class MetricAccent implements IMetricAccent {
  constructor(
    public strength: number = 0,
    public position: IFraction = Fraction.ZERO,
  ) {}

  /** @see Object.prototype.toString */
  toString(): string {
    return `[MetricAccent: ${this.strength} @${this.position}]`;
  }
}
