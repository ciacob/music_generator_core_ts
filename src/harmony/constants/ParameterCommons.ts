/**
 * The actual minimum and maximum values used to resolve the generic
 * 0% and 100% limits of some Parameters, plus a couple of sentinel values
 * shared across the harmony package's content analyzers.
 *
 * Ported from
 * `as-sources/legacy-generators-harmony/ro/se/legacy/generators/harmony/constants/ParameterCommons.as`.
 *
 * Per project convention (see `utils/constants/CommonStrings.ts`), the
 * original AS3 "constants class" becomes a single frozen object. AS3's
 * `int`/`Number` distinction (gotcha #13 in the top-level README) collapses
 * to plain `number` here.
 */
export const ParameterCommons = {
  VOICE_RESTLESSNESS_MIN: 0,
  VOICE_RESTLESSNESS_MAX: 3,

  NA_RESERVED_VALUE: 0,
  MIN_LEGAL_SCORE: 1,
} as const;
