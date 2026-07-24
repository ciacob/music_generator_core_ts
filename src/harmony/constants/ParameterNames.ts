/**
 * Parameters that are only specific to this `IGeneratorModule` implementation
 * (`MultilineGenerator`), as opposed to `CoreParameterNames`, which lists
 * parameters assumed to exist in any `IGeneratorModule`.
 *
 * Ported from
 * `as-sources/legacy-generators-harmony/ro/se/legacy/generators/harmony/constants/ParameterNames.as`.
 *
 * The original AS3 file is a "constants class" (nothing but
 * `public static const` string members). Per project convention (see
 * `utils/constants/CommonStrings.ts`), this becomes a single frozen object.
 */
export const ParameterNames = {
  ENFORCE_CONSONANCE: 'Enforce minimum consonance',
  DURATIONS: 'Durations Tendency',
  METRIC_PLACEMENT: 'Metric Placement',
  HIGHEST_PITCH: 'Highest Permitted Pitch',
  LOWEST_PITCH: 'Lowest Permitted Pitch',
  VOICES_NUMBER: 'Number of Voices',
  USE_MELODIC_MODEL: 'Use melodic model',
  MELODIC_DIRECTION_BALANCE: 'Melodic direction balance',
  INTRINSIC_CONSONANCE: 'Intrinsic Consonance',
  CHORD_PROGRESSION: 'Chord Progression',
  VOICE_RESTLESSNESS: 'Voice Restlessness',
  HARMONIC_DISTRIBUTION: 'Harmonic Distribution',
  VOICE_COHESION: 'Voice Cohesion',
} as const;
