import { CommonStrings } from '../../utils/constants/CommonStrings.js';
import { TimeSignatureDefinition } from './TimeSignatureDefinition.js';
import type { ITimeSignatureDefinition } from './ITimeSignatureDefinition.js';

/**
 * Caches `TimeSignatureDefinition` instances by `numerator/denominator`,
 * so repeated requests for the same time signature reuse one instance.
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/eu/stochastic/engine/music/knowledge/timesignature/TimeSignatureFactory.as`.
 * The AS3 original is a class with only `static` members (and an unused
 * empty constructor) — structurally a namespace, not something ever
 * instantiated — so, consistent with how this project already translated
 * every static-only AS3 "class" in `utils/` (step 2) as a plain module of
 * exported functions rather than a class with static methods, this
 * becomes free functions too. The cache itself moves from a
 * `private static var` `Object` bag to a module-level `Map`, matching the
 * same "process-wide shared cache" scope.
 */
const timeSignatures = new Map<string, ITimeSignatureDefinition>();

/**
 * Convenience way of returning a `TimeSignatureDefinition` instance based
 * on the provided numerator and denominator, recycling existing
 * instances.
 *
 * @see ITimeSignatureDefinition.shownNumerator
 * @see ITimeSignatureDefinition.shownDenominator
 */
export function $get(numerator: number, denominator: number): ITimeSignatureDefinition {
  const storageName = `${numerator}${CommonStrings.SLASH}${denominator}`;
  let signature = timeSignatures.get(storageName);
  if (!signature) {
    signature = new TimeSignatureDefinition(numerator, denominator);
    timeSignatures.set(storageName, signature);
  }
  return signature;
}

/**
 * Enables manually adding a time signature definition to the cache, for
 * later retrieval. The instance is indexed by its `shownNumerator` and
 * `shownDenominator` properties.
 */
export function $cache(timeSignature: ITimeSignatureDefinition): void {
  const storageName = `${timeSignature.shownNumerator}${CommonStrings.SLASH}${timeSignature.shownDenominator}`;
  timeSignatures.set(storageName, timeSignature);
}
