/**
 * Shared string-literal constants, ported from
 * `as-sources/utils-library/ro/se/utils/constants/CommonStrings.as`.
 *
 * The original AS3 file is a `constants class` — a class with nothing but
 * `public static const` string members, used both directly (as
 * `CommonStrings.SOME_CONST`) and reflectively (passed as a `Class` to
 * `ConstantUtils.getAllNames`/`getAllValues`). TypeScript has no equivalent
 * of a "constants class" you can reflect over, so this — and every other
 * ported "constants class" in this project (see `generators/constants/` in
 * a later step) — becomes a single frozen object instead. `ConstantUtils`
 * is adapted accordingly to operate on plain objects (see
 * `ConstantUtils.ts`).
 *
 * Ported in full: this file is pure data with no behavior, so there is no
 * cost/fidelity tradeoff in keeping the complete original set even though
 * only a handful of these (`EMPTY`, `EQUAL`, `NEW_LINE`, `SLASH`,
 * `UNDERSCORE`) are referenced elsewhere in the engine as of this writing.
 */
export const CommonStrings = {
  AT: '@',
  HASH: '#',
  EMPTY: '',
  COLON_SPACE: ': ',
  COMMA: ',',
  COMMA_SPACE: ', ',
  COMMA_NEW_LINE: ',\n',
  COPYRIGHT_SIGN: '(c)',
  DASH: '-',
  DOLLAR_SIGN: '$',
  DOT: '.',
  DOT_SPACE: '. ',
  DOUBLE_COLON: '::',
  ELLIPSIS: '…',
  LEFT_PAREN: '(',
  NEW_LINE: '\n',
  WIN_NEW_LINE: '\r\n',
  RETURN: '\r',
  PERCENT: '%',
  QUOTES: '"',
  RIGHT_PAREN: ')',
  SPACE: ' ',
  NON_BREAKING_SPACE: '\u00A0',
  ZERO_WIDTH_SPACE: '\u200B',
  SPACE_DASH_SPACE: ' - ',
  UNDERSCORE: '_',
  CIRCUMFLEX: '^',
  LESS_THAN: '<',
  GREATER_THAN: '>',
  NULL: 'NULL',
  $S: '%s',
  $D: '%d',
  ZERO: '0',
  BROKEN_VERTICAL_BAR: '¦',
  SLASH: '/',
  BACK_SLASH: '\x5c',
  DOUBLE_BACK_SLASH: '\x5c\x5c',
  AMPERSAND: '&',
  SEMICOLON: ';',
  QUESTION_MARK: '?',
  EQUAL: '=',
  PIPE: '|',
  TAB: '\t',

  OR: 'or',
  PAGNATION_OF: ' of ',
  AND: 'and',
  ALSO_COMMA: 'also,',

  TEST_NAME: 'John Doe',
} as const;
