/**
 * Ported from
 * `as-sources/legacy-generators-base-library/ro/se/legacy/generators/constants/GeneratorBaseKeys.as`.
 * `NEED_API_AVAILABILITY`'s value contains a stray space in the original
 * (`'needApiA vailability'`) — preserved verbatim rather than "fixed",
 * since unlike a display-string typo, this is a lookup-key *value* that
 * other (unported, likely UI/editor-layer) code could match against
 * exactly; silently changing it could break an equality comparison
 * elsewhere.
 */
export const GeneratorBaseKeys = {
  ADVANCED: 'Advanced',
  API_ARGUMENTS: 'apiArguments',
  API_AVAILABILITY_RESULT: 'apiAvailabilityResult',
  API_EXECUTION_RESULT: 'apiExecutionResult',
  API_EXISTS: 'apiExists',
  API_NAME: 'apiName',
  API_OUTPUT: 'apiOutput',
  DEFAULT: 'endPointDefault',
  DESCRIPTION: 'Description',
  EDITOR_FONT_SIZE: 'EditorFontSize',
  INDEX: 'Index',
  LABEL: 'endPointLabel',
  LIST_FONT_SIZE: 'ListFontSize',
  MAXIMUM: 'Maximum',
  MINIMUM: 'Minimum',
  MODULE_GENERATION_COMPLETE: 'moduleGenerationComplete',
  MODULE_GENERATION_ABORTED: 'moduleGenerationAborted',
  NAME: 'endPointName',
  NEED_API_AVAILABILITY: 'needApiA vailability',
  NEED_API_EXECUTION: 'needApiExecution',
  SOURCE: 'endPointSource',
  TYPE: 'endPointType',
  NOTE_STREAMS: 'noteStreams',
  UNIQUE_SELECTION: 'UniqueSelection',
  DEPENDS_ON: 'DependsOn',
} as const;
