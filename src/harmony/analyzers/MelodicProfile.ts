import { AbstractContentAnalyzer } from '../../core/abstracts/AbstractContentAnalyzer.js';
import { Fraction } from '../../math/Fraction.js';
import { ParameterCommons } from '../constants/ParameterCommons.js';
import { ParameterNames } from '../constants/ParameterNames.js';
import { analyzeMelodicProfile, getTopPitchOf } from './common/MelodicUtils.js';
import type { IAnalysisContext } from '../../core/interfaces/IAnalysisContext.js';
import type { IFraction } from '../../math/IFraction.js';
import type { IMusicRequest } from '../../core/interfaces/IMusicRequest.js';
import type { IMusicUnit } from '../../core/interfaces/IMusicUnit.js';
import type { IMusicalContentAnalyzer } from '../../core/interfaces/IMusicalContentAnalyzer.js';
import type { IParameter } from '../../core/interfaces/IParameter.js';
import type { IParametersList } from '../../core/interfaces/IParametersList.js';

const WRONG_DIRECTION_PENALTY = 0.25;
const REPEATED_NOTE_PENALTY = 0.1;
const REPEATED_EDGE_PENALTY = 0.07;

/**
 * Analyzes the appropriateness of the top-most voice in a candidate music unit, relative to
 * the melodic profile of the preceding content.
 *
 * Ported from
 * `as-sources/legacy-generators-harmony/ro/se/legacy/generators/harmony/analyzers/MelodicProfile.as`.
 *
 * **Bug fixed: the documented "no previous content" bypass, actually implemented.**
 * The AS3 original's own ASDoc for `analyze()` reads: "Bypass analysis if there is no
 * previous content to this point (e.g., beginning of the generated material), or it only
 * contains rests" — but the method body never does this. It unconditionally calls
 * `MelodicUtils.analyzeMelodicProfile(prevContent)`, which, given an empty or all-rests
 * fragment, computes a `0/0` division for `pivotPitchInterval` (and everything derived from
 * it: `pivotPitch`, `mirroredPivotPitch`) — a genuine, reachable bug, not a hypothetical one:
 * `previousContent` really is `[]` for the very first unit generated in any run (confirmed by
 * tracing `AbstractGeneratorModule.ts`'s analysis-window construction, which clamps its
 * window to the raw musical body's current length — `0` at the very start).
 *
 * In the AS3 original, the immediate fallout was softened by an AS3-only quirk this
 * translation can't rely on: `mirroredPivotPitch as uint` silently sanitizes `NaN` to `0`
 * (`ToUint32(NaN) = 0`), something a plain TypeScript `number` cast does not do — so a
 * literal, cast-for-cast port would not just inherit the original bug faithfully, it would
 * make it worse (an unclamped `NaN` score reaching `analysisScores.add`). Rather than add a
 * `uint`-sanitizing shim to paper over that gap, the actual fix is implemented here: the
 * bypass the source's own documentation already promised. See the file's test spec for
 * deliberately heavy coverage of exactly this condition (empty / rests-only previous content).
 */
export class MelodicProfile extends AbstractContentAnalyzer implements IMusicalContentAnalyzer {
  /** @see IMusicalContentAnalyzer.weight */
  override get weight(): number {
    return 0.99;
  }

  /** @see IMusicalContentAnalyzer.name */
  override get name(): string {
    return ParameterNames.MELODIC_DIRECTION_BALANCE;
  }

  /**
   * Analyzes the appropriateness of the top-most voice in the current music unit, within the
   * current analysis context.
   */
  override analyze(
    targetMusicUnit: IMusicUnit,
    analysisContext: IAnalysisContext,
    parameters: IParametersList,
    request: IMusicRequest,
  ): void {
    // Bypass analysis if "Use melodic model" is off.
    const settings = request.userSettings;
    const melodicSwitchParam = parameters.getByName(ParameterNames.USE_MELODIC_MODEL)[0] as IParameter;
    const useMelodicModel = !!(settings.getValueAt(melodicSwitchParam, 0) as number);
    if (!useMelodicModel) {
      targetMusicUnit.analysisScores.add(ParameterNames.MELODIC_DIRECTION_BALANCE, ParameterCommons.NA_RESERVED_VALUE);
      return;
    }

    // Bypass analysis if there is no "previous content" to this point (e.g., beginning of the
    // generated material), or it only contains rests. Without this, the pivot-pitch math below
    // divides by zero (see file header for why this bypass -- documented, but missing from the
    // AS3 original -- is implemented here rather than ported as a literal, silently-corrupting
    // no-op).
    const prevContent = analysisContext.previousContent;
    const hasPitchedContent = prevContent.some((unit) => unit.pitches.some((pitch) => pitch.midiNote > 0));
    if (prevContent.length === 0 || !hasPitchedContent) {
      targetMusicUnit.analysisScores.add(ParameterNames.MELODIC_DIRECTION_BALANCE, ParameterCommons.NA_RESERVED_VALUE);
      return;
    }

    // Compute the pitch that would "ideally" continue the given context, and represent the score of the
    // analysis as the smallest ratio between that pitch and the current pitch.
    const currentPitch = getTopPitchOf(targetMusicUnit);
    const analysisResult = analyzeMelodicProfile(prevContent);
    const originalPivotPitch = analysisResult.pivotPitch;
    const idealDirection = analysisResult.direction * -1;
    const idealPitch = analysisResult.mirroredPivotPitch;
    const actualDirection = currentPitch > originalPivotPitch ? 1 : currentPitch < originalPivotPitch ? -1 : 0;
    let ratio: IFraction = new Fraction(currentPitch, idealPitch);
    if (ratio.greaterThan(Fraction.WHOLE)) {
      ratio = ratio.reciprocal;
    }
    let score = ratio.floatValue;
    let canonicalScore = Math.round(score * 100);

    // Apply supplementary penalties if the current pitch takes the "wrong" direction.
    if (actualDirection !== idealDirection) {
      const penaltyOffset = score * WRONG_DIRECTION_PENALTY;
      if (score > penaltyOffset) {
        score -= penaltyOffset;
        canonicalScore = Math.round(score * 100);
      }
    }

    // Apply supplementary penalties if the current pitch has already been used in the given context, the
    // more uses of it, the greater the penalty. This aims to encourage more expressive melodic lines, and
    // should be an effective measure against long stretches of held or repeating pitches.
    let numAdjacentHeldNotes = 0;
    for (let i = prevContent.length - 1; i >= 0; i--) {
      const pastPitch = getTopPitchOf(prevContent[i] as IMusicUnit);
      if (pastPitch === 0) {
        continue;
      }
      if (pastPitch === currentPitch) {
        numAdjacentHeldNotes++;
        const penaltyFactor = numAdjacentHeldNotes * REPEATED_NOTE_PENALTY;
        const penaltyOffset = score * penaltyFactor;
        if (score > penaltyOffset) {
          score -= penaltyOffset;
          canonicalScore = Math.round(score * 100);
        }
      }
    }

    // Apply supplementary penalties if the current pitch is the highest or the lowest pitch recorded in the given
    // context. We are thus trying to encourage melodic lines that "lead" somewhere rather than closing onto themselves.
    // Also this should make for clearer climax points in our melody, which can only add to its comprehensibility.
    const highPastPitch = analysisResult.highestPitchInFragment;
    const lowPastPitch = analysisResult.lowestPitchInFragment;
    if ((highPastPitch !== 0 && currentPitch === highPastPitch) || (lowPastPitch !== 127 && currentPitch === lowPastPitch)) {
      const penaltyOffset = score * REPEATED_EDGE_PENALTY;
      if (score > penaltyOffset) {
        score -= penaltyOffset;
        canonicalScore = Math.round(score * 100);
      }
    }

    // Commit the computed score to the unit.
    targetMusicUnit.analysisScores.add(ParameterNames.MELODIC_DIRECTION_BALANCE, canonicalScore);
  }
}
