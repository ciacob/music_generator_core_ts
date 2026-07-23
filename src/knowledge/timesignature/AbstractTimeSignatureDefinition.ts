import type { IFraction } from '../../math/IFraction.js';
import type { IMetricAccent } from './IMetricAccent.js';
import type { ITimeSignatureDefinition } from './ITimeSignatureDefinition.js';

/**
 * Ported from
 * `as-sources/legacy-generators-core-library/eu/stochastic/engine/music/knowledge/timesignature/abstracts/AbstractTimeSignatureDefinition.as`.
 *
 * Simplified relative to the AS3 original using a real TypeScript
 * `abstract class`, enforced at compile time (subclasses must implement
 * every abstract member; the class itself can never be `new`'d directly)
 * — stronger than what AS3 could express. The original had no
 * `abstract`/`final`-on-instantiation language feature, so it simulated
 * one at runtime: its constructor took the constructing subclass instance
 * as a parameter (`super(this)`) and threw via a private
 * `_yeldAbstractClassError()` helper (built from
 * `flash.utils.getQualifiedClassName`) if that parameter was falsy —
 * which only happens if `AbstractTimeSignatureDefinition` were
 * instantiated directly, since any real subclass constructor always
 * passes a truthy `this`. Every abstract getter below also threw the same
 * error in the original, guarding against a subclass that forgot to
 * override one — TypeScript's `abstract` keyword makes that scenario a
 * compile error instead, so no runtime guard is needed here at all.
 */
export abstract class AbstractTimeSignatureDefinition implements ITimeSignatureDefinition {
  abstract get fraction(): IFraction;
  abstract get shownNumerator(): number;
  abstract get shownDenominator(): number;
  abstract get metricAccents(): IMetricAccent[];
  abstract get junctions(): IFraction[];
}
