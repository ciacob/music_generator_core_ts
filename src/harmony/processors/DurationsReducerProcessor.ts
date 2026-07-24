import { AbstractMusicalPostProcessor } from '../../core/abstracts/AbstractMusicalPostProcessor.js';
import type { IMusicPitch } from '../../core/interfaces/IMusicPitch.js';
import type { IMusicRequest } from '../../core/interfaces/IMusicRequest.js';
import type { IMusicUnit } from '../../core/interfaces/IMusicUnit.js';
import type { IMusicalBody } from '../../core/interfaces/IMusicalBody.js';
import type { IMusicalPostProcessor } from '../../core/interfaces/IMusicalPostProcessor.js';
import type { IPitchAllocation } from '../../core/interfaces/IPitchAllocation.js';

/**
 * Detects same-pitch notes found within the same voice and adjacent clusters
 * and ties them, so that the right-hand note is not "struck" anymore. This
 * procedure may result in rudimentary polyphonic setups, which may improve
 * the overall sounding of a generated homophonic choral.
 *
 * Ported from
 * `as-sources/legacy-generators-harmony/ro/se/legacy/generators/harmony/processors/DurationsReducerProcessor.as`.
 *
 * **Sliding two-unit window simplified.** The AS3 original maintains its
 * "last two units seen" window via `slice.push(unit); if (slice.length > 2)
 * { slice.reverse(); slice.length = 2; slice.reverse(); }` — a double-reverse-
 * and-truncate trick to drop the oldest element while keeping the remaining
 * two in chronological order. This is exactly equivalent to just tracking the
 * single previous unit directly (traced through: each `forEach` step either
 * has no previous unit yet, or compares against exactly the immediately-
 * preceding one), so this port does that instead — same pairs compared, same
 * order, no behavioral difference, just without the indirection.
 *
 * @see IMusicalPostProcessor
 */
export class DurationsReducerProcessor extends AbstractMusicalPostProcessor implements IMusicalPostProcessor {
  /** @see IMusicalPostProcessor.execute */
  override execute(rawMusicalBody: IMusicalBody, _request: IMusicRequest): void {
    let leftUnit: IMusicUnit | undefined;

    rawMusicalBody.forEach((rightUnit) => {
      if (leftUnit) {
        this.tieMatchingPitches(leftUnit, rightUnit);
      }
      leftUnit = rightUnit;
    });
  }

  /**
   * Compares `leftUnit` and `rightUnit` pitch-by-pitch (matched by index),
   * tying `leftUnit`'s pitch to `rightUnit`'s whenever both are real (non-
   * rest) notes at the same MIDI pitch, allocated to the same instrument and
   * voice.
   */
  private tieMatchingPitches(leftUnit: IMusicUnit, rightUnit: IMusicUnit): void {
    const leftPitches = leftUnit.pitches;
    const leftPitchAllocations = leftUnit.pitchAllocations;
    const rightPitches = rightUnit.pitches;
    const rightPitchAllocations = rightUnit.pitchAllocations;

    leftPitches.forEach((leftPitch: IMusicPitch, pitchIndex: number) => {
      const rightPitch = pitchIndex < rightPitches.length ? rightPitches[pitchIndex] : undefined;
      const leftAllocation = pitchIndex < leftPitchAllocations.length ? leftPitchAllocations[pitchIndex] : undefined;
      const rightAllocation = pitchIndex < rightPitchAllocations.length ? rightPitchAllocations[pitchIndex] : undefined;

      if (leftPitch && rightPitch && leftAllocation && rightAllocation) {
        if (this.isMatchingContinuation(leftPitch, rightPitch, leftAllocation, rightAllocation)) {
          leftPitch.tieNext = true;
        }
      }
    });
  }

  /** Whether `rightPitch`/`rightAllocation` is a same-pitch, same-voice continuation of `leftPitch`/`leftAllocation`. */
  private isMatchingContinuation(
    leftPitch: IMusicPitch,
    rightPitch: IMusicPitch,
    leftAllocation: IPitchAllocation,
    rightAllocation: IPitchAllocation,
  ): boolean {
    return (
      leftPitch.midiNote === rightPitch.midiNote &&
      leftAllocation.instrument === rightAllocation.instrument &&
      leftAllocation.voiceIndex === rightAllocation.voiceIndex
    );
  }
}
