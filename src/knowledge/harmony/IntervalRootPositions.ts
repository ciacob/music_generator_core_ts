/**
 * Convenience constants related to placement of the "root" (in
 * Hindemith's definition) within a harmonic interval. Three placements
 * are available: `TOP`, `BOTTOM`, or `UNKNOWN` (the last reserved for the
 * tritone alone, which has no defined root either way).
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/eu/stochastic/engine/music/knowledge/harmony/IntervalRootPositions.as`.
 * A static-only AS3 class, translated as a plain constants object per
 * this project's established convention (see `utils/` in step 2).
 */
export const IntervalRootPositions = {
  TOP: 1,
  BOTTOM: 0,
  UNKNOWN: -1,
} as const;
