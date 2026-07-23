import { DurationFractions } from '../../generators/constants/duration/DurationFractions.js';

/**
 * Support for static constants used across the entire project.
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/ro/se/legacy/generators/core/constants/CoreOperationKeys.as`.
 * Note the original only defines 5 of the 7 `IParameter.type` values its
 * own doc comment (and `IParameter.as`'s) mentions — `TYPE_UINT` and
 * `TYPE_NUMBER` are referenced in prose but never actually defined here.
 * Ported faithfully as-is (this is a pre-existing gap in the source, not
 * introduced by the translation).
 */
export const CoreOperationKeys = {
  // Acceptable IParameter types
  TYPE_INT: 100,
  TYPE_BOOLEAN: 103,
  TYPE_STRING: 104,
  TYPE_OBJECT: 105,
  TYPE_ARRAY: 106,

  // Communication helpers (keys in payload objects to be sent through PTT)
  PARAM_NAME: 'paramName',
  PARAM_UID: 'paramUid',
  DOCUMENTATION_DESCRIPTION: 'documentationDescription',
  DOCUMENTATION_URL: 'documentationUrl',
  TWEENING_STATUS: 'tweeningStatus',
  EDITOR_SERVICE_NOTICE: 'editorServiceNotice',
  EDITOR_FOCUS_NOTICE: 'editorFocusNotice',
  INLINE_DOC_REQUESTED_NOTICE: 'inlineDocRequestedNotice',
  INLINE_DOC_DISCARDED_NOTICE: 'inlineDocDiscardedNotice',
  DOC_REQUESTED_NOTICE: 'docRequestedNotice',

  // Musical constants
  MIN_NUM_VOICES: 1,
  DURATIONS_IN_USE: [
    DurationFractions.WHOLE,
    DurationFractions.HALF,
    DurationFractions.QUARTER,
    DurationFractions.EIGHT,
    DurationFractions.SIXTEENTH,
  ],
  WHOLE_CHART_VALUES: [
    [1, 1],
    [50, 15],
    [85, 60],
    [100, 100],
  ],
  HALF_CHART_VALUES: [
    [1, 1],
    [50, 30],
    [75, 100],
    [100, 1],
  ],
  QUARTER_CHART_VALUES: [
    [1, 1],
    [40, 58],
    [50, 100],
    [60, 58],
    [100, 1],
  ],
  EIGHT_CHART_VALUES: [
    [1, 1],
    [25, 100],
    [50, 30],
    [100, 1],
  ],
  SIXTEENTH_CHART_VALUES: [
    [1, 100],
    [15, 60],
    [50, 15],
    [100, 1],
  ],
} as const;
