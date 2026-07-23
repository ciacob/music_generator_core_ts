import { IntervalsSize } from './pitch/IntervalsSize.js';

/**
 * Ported from
 * `as-sources/legacy-generators-base-library/ro/se/legacy/generators/constants/BiasTables.as`.
 * The AS3 original's two lazily-computed getters become plain functions,
 * consistent with how this project translates AS3 getters-on-static-only-
 * classes elsewhere (e.g. `utils/ColorUtils.ts`). Each returns a
 * `Record<number, number>` (interval size in semitones -> bias) rather
 * than the original's sparse `Array` indexed by interval size — a more
 * direct match for what's actually a "map from interval size to bias",
 * without an Array's sparse-index quirks.
 */
export const BASELINE = 100;

let externalVoicesMelodicBiasCache: Record<number, number> | null = null;

/**
 * The bias (degree of acceptability) of melodic musical intervals that
 * occur inside an "external voice" (e.g. bass and soprano) as part of a
 * homophonic choral, keyed by interval size in semitones.
 */
export function getExternalVoicesMelodicBias(): Record<number, number> {
  if (!externalVoicesMelodicBiasCache) {
    externalVoicesMelodicBiasCache = {
      [IntervalsSize.MINOR_THIRD]: BASELINE * 3.2,
      [IntervalsSize.MAJOR_THIRD]: BASELINE * 3.1,
      [IntervalsSize.MAJOR_SECOND]: BASELINE * 3,
      [IntervalsSize.MINOR_SECOND]: BASELINE * 2.9,
      [IntervalsSize.PERFECT_FOURTH]: BASELINE * 1.5,
      [IntervalsSize.PERFECT_FIFTH]: BASELINE * 1.4,
      [IntervalsSize.PERFECT_UNISON]: BASELINE * 1.8,
      [IntervalsSize.MAJOR_SIXTH]: BASELINE * 1.3,
      [IntervalsSize.MINOR_SIXTH]: BASELINE * 1.2,
      [IntervalsSize.PERFECT_OCTAVE]: BASELINE * 1.1,
      [IntervalsSize.AUGMENTED_FOURTH]: BASELINE * 0.25,
      [IntervalsSize.MINOR_SEVENTH]: BASELINE * 0.5,
      [IntervalsSize.MAJOR_SEVENTH]: BASELINE * 0.1,
    };
  }
  return externalVoicesMelodicBiasCache;
}

let internalVoicesMelodicBiasCache: Record<number, number> | null = null;

/**
 * The bias (degree of acceptability) of melodic musical intervals that
 * occur inside an "internal voice" (e.g. alto, tenor) as part of a
 * homophonic choral, keyed by interval size in semitones.
 */
export function getInternalVoicesMelodicBias(): Record<number, number> {
  if (!internalVoicesMelodicBiasCache) {
    internalVoicesMelodicBiasCache = {
      [IntervalsSize.PERFECT_UNISON]: BASELINE * 2,
      [IntervalsSize.MAJOR_SECOND]: BASELINE * 1.9,
      [IntervalsSize.MINOR_SECOND]: BASELINE * 1.8,
      [IntervalsSize.MINOR_THIRD]: BASELINE * 1.7,
      [IntervalsSize.MAJOR_THIRD]: BASELINE * 1.6,
      [IntervalsSize.PERFECT_FOURTH]: BASELINE * 1.1,
      [IntervalsSize.PERFECT_FIFTH]: BASELINE * 0.7,
      [IntervalsSize.MAJOR_SIXTH]: BASELINE * 0.6,
      [IntervalsSize.MINOR_SIXTH]: BASELINE * 0.5,
      [IntervalsSize.MINOR_SEVENTH]: BASELINE * 0.4,
      [IntervalsSize.PERFECT_OCTAVE]: BASELINE * 0.3,
      [IntervalsSize.MAJOR_SEVENTH]: BASELINE * 0.2,
      [IntervalsSize.AUGMENTED_FOURTH]: BASELINE * 0.1,
    };
  }
  return internalVoicesMelodicBiasCache;
}
