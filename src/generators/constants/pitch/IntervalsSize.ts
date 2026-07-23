/**
 * Interval sizes, in semitones. Ported from
 * `as-sources/legacy-generators-base-library/ro/se/legacy/generators/constants/pitch/IntervalsSize.as`.
 *
 * Pulled forward from step 6 (`generators/constants/`, otherwise done as
 * its own step) since `knowledge/harmony/Intervals.ts` is the one place
 * that needs it this early, and this single table is small and fully
 * self-contained (pure data, no dependencies of its own).
 */
export const IntervalsSize = {
  PERFECT_UNISON: 0,
  MINOR_SECOND: 1,
  MAJOR_SECOND: 2,
  MINOR_THIRD: 3,
  MAJOR_THIRD: 4,
  PERFECT_FOURTH: 5,
  AUGMENTED_FOURTH: 6,
  PERFECT_FIFTH: 7,
  MINOR_SIXTH: 8,
  MAJOR_SIXTH: 9,
  MINOR_SEVENTH: 10,
  MAJOR_SEVENTH: 11,
  PERFECT_OCTAVE: 12,
} as const;
