/**
 * Ported from `as-sources/utils-library/ro/se/utils/Strings.as`.
 *
 * The original file is large, and several of its members (`peelMarkup`,
 * `htmlEntitiesDecode`, `applyXMLFormatting`, ...) depend on types that
 * are not even present in this project's `as-sources/` snapshot
 * (`HtmlEntities`, `HtmlEntity`, `Patterns`, `Inflect`) — i.e. the
 * original file does not compile standalone even as reference AS3. Only
 * the members actually referenced elsewhere in the copied 133-file engine
 * snapshot are ported here (verified by grep, not just inferred):
 * `capitalize`, `fromAS3ConstantCase`, `generateRFC4122GUID`, `isAny`,
 * `sprintf`, `toAS3ConstantCase`, `trim`, `trimLeft`, `trimRight` — plus
 * the `padLeft`/`padRight` helpers `sprintf` itself depends on.
 */

/**
 * Pads `str` with `padChar` to `length`, from the left.
 */
export function padLeft(str: string, padChar: string, length: number): string {
  let s = str;
  while (s.length < length) {
    s = padChar + s;
  }
  return s;
}

/**
 * Pads `str` with `padChar` to `length`, from the right.
 */
export function padRight(str: string, padChar: string, length: number): string {
  let s = str;
  while (s.length < length) {
    s += padChar;
  }
  return s;
}

/**
 * Removes whitespace from both the front and the end of `pString`.
 * Returns `''` for `null`/`undefined` input, matching the original AS3
 * (which tolerated `null` `String`s).
 */
export function trim(pString: string | null | undefined): string {
  if (pString == null) {
    return '';
  }
  return pString.replace(/^\s+|\s+$/g, '');
}

/** Removes whitespace from the front (left side) of `pString`. */
export function trimLeft(pString: string | null | undefined): string {
  if (pString == null) {
    return '';
  }
  return pString.replace(/^\s+/, '');
}

/** Removes whitespace from the end (right side) of `pString`. */
export function trimRight(pString: string | null | undefined): string {
  if (pString == null) {
    return '';
  }
  return pString.replace(/\s+$/, '');
}

/**
 * Capitalizes the first word in a string, or all words.
 * @param pString The string.
 * @param all Whether to capitalize all words rather than only the first.
 * Optional, defaults to `false`.
 */
export function capitalize(pString: string, all = false): string {
  const str = trimLeft(pString);
  if (all) {
    return str.replace(/^.|\b./g, (c) => c.toUpperCase());
  }
  return str.replace(/(^\w)/, (c) => c.toUpperCase());
}

/**
 * Convenience method to check whether `pString` "is" or "equals" any of a
 * given set of alternatives.
 */
export function isAny(pString: string, ...alternatives: string[]): boolean {
  for (let i = 0; i < alternatives.length; i++) {
    if (pString === alternatives[i]) {
      return true;
    }
  }
  return false;
}

/**
 * Changes `"MY_STRING"` into `"my string"`. Note that (as in the original)
 * this doesn't attempt to prevent generating duplicate results.
 */
export function fromAS3ConstantCase(str: string): string {
  return str.replace(/_+/g, ' ').toLowerCase();
}

/**
 * Changes `"myString"` into `"my string"`. Private helper used by
 * `toAS3ConstantCase`; not referenced anywhere else in the engine, so it
 * is not exported.
 */
function deCamelize(str: string): string {
  return str.replace(/((?<=[a-z0-9])[A-Z])/g, ' $1');
}

/**
 * Changes `"myString"`, or `"my string"`, into `"MY_STRING"`. Note that
 * (as in the original) this doesn't attempt to prevent generating
 * duplicate results.
 */
export function toAS3ConstantCase(str: string): string {
  let result = deCamelize(str);
  result = result.replace(/\W/g, '_').replace(/_{2,}/g, '_').toUpperCase();
  return result;
}

/**
 * Fast UUID generator, RFC4122 version 4 compliant. Adapted from Jeff
 * Ward's implementation (see original AS3 file for attribution).
 *
 * @param randomFn A function producing a random floating point value in
 * `[0, 1)`. Optional, defaults to `Math.random`. Not present in the
 * original AS3 signature; added here (per this project's convention of
 * favoring injectable randomness) so callers/tests can obtain
 * deterministic UUIDs.
 */
export function generateRFC4122GUID(randomFn: () => number = Math.random): string {
  const template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
  return template.replace(/[xy]/g, (c) => {
    const r = Math.floor(randomFn() * 16);
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Casts a value the way AS3's `uint()` would: truncate toward zero, then
 * wrap into the unsigned 32-bit range. Used by `sprintf`'s `%o`/`%u`/`%x`/
 * `%X` conversions.
 */
function toUint32(value: unknown): number {
  const n = Math.trunc(Number(value));
  return n >>> 0;
}

/**
 * `sprintf(3)`-style string formatting. Ported from the original AS3
 * implementation (itself adapted by Manish Jethani; see the AS3 source
 * for the full attribution/license header). Supports the `#`, `0`, `-`,
 * `+` flags; field widths; precision; and the `d`/`i`/`o`/`u`/`x`/`X`/`f`/
 * `F`/`c`/`s`/`%` conversion specifiers. Length modifiers and the `*`
 * (asterisk) field width are not supported, matching the original.
 */
export function sprintf(format: string, ...args: unknown[]): string {
  let result = '';
  const length = format.length;

  for (let i = 0; i < length; i++) {
    let c = format.charAt(i);

    if (c === '%') {
      let next: unknown;
      let str: string;
      let pastFieldWidth = false;
      let pastFlags = false;

      let flagAlternateForm = false;
      let flagZeroPad = false;
      let flagLeftJustify = false;
      let flagSign = false;

      let fieldWidth = '';
      let precision = '';
      let capitalise = false;

      i++;
      c = format.charAt(i);

      while (
        c !== 'd' &&
        c !== 'i' &&
        c !== 'o' &&
        c !== 'u' &&
        c !== 'x' &&
        c !== 'X' &&
        c !== 'f' &&
        c !== 'F' &&
        c !== 'c' &&
        c !== 's' &&
        c !== '%'
      ) {
        if (!pastFlags) {
          if (!flagAlternateForm && c === '#') flagAlternateForm = true;
          else if (!flagZeroPad && c === '0') flagZeroPad = true;
          else if (!flagLeftJustify && c === '-') flagLeftJustify = true;
          else if (c === ' ') {
            // Parsed for fidelity with the original (which parses a
            // space flag too), but — as in the original — it is never
            // actually applied to any output below.
          } else if (!flagSign && c === '+') flagSign = true;
          else pastFlags = true;
        }

        if (!pastFieldWidth && c === '.') {
          pastFlags = true;
          pastFieldWidth = true;
          i++;
          c = format.charAt(i);
          continue;
        }

        if (pastFlags) {
          if (!pastFieldWidth) fieldWidth += c;
          else precision += c;
        }

        i++;
        c = format.charAt(i);
      }

      const fw = fieldWidth !== '' ? Number.parseInt(fieldWidth, 10) : null;
      const prec = precision !== '' ? Number.parseInt(precision, 10) : null;

      switch (c) {
        case 'd':
        case 'i': {
          next = args.shift();
          const intVal = Math.trunc(Number(next));
          str = String(Math.abs(intVal));

          if (prec !== null) str = padLeft(str, '0', prec);

          if (intVal < 0) str = '-' + str;
          else if (flagSign && intVal >= 0) str = '+' + str;

          if (fw !== null) {
            if (flagLeftJustify) str = padRight(str, ' ', fw);
            else if (flagZeroPad && prec === null) str = padLeft(str, '0', fw);
            else str = padLeft(str, ' ', fw);
          }

          result += str;
          break;
        }

        case 'o': {
          next = args.shift();
          const uintVal = toUint32(next);
          str = uintVal.toString(8);

          if (flagAlternateForm && str !== '0') str = '0' + str;
          if (prec !== null) str = padLeft(str, '0', prec);

          if (fw !== null) {
            if (flagLeftJustify) str = padRight(str, ' ', fw);
            else if (flagZeroPad && prec === null) str = padLeft(str, '0', fw);
            else str = padLeft(str, ' ', fw);
          }

          result += str;
          break;
        }

        case 'u': {
          next = args.shift();
          const uintVal = toUint32(next);
          str = uintVal.toString(10);

          if (prec !== null) str = padLeft(str, '0', prec);

          if (fw !== null) {
            if (flagLeftJustify) str = padRight(str, ' ', fw);
            else if (flagZeroPad && prec === null) str = padLeft(str, '0', fw);
            else str = padLeft(str, ' ', fw);
          }

          result += str;
          break;
        }

        case 'X':
          capitalise = true;
        // falls through
        case 'x': {
          next = args.shift();
          const uintVal = toUint32(next);
          str = uintVal.toString(16);

          if (prec !== null) str = padLeft(str, '0', prec);

          const prepend = flagAlternateForm && uintVal !== 0;

          if (fw !== null && !flagLeftJustify && flagZeroPad && prec === null) {
            str = padLeft(str, '0', prepend ? fw - 2 : fw);
          }

          if (prepend) str = '0x' + str;

          if (fw !== null) {
            if (flagLeftJustify) str = padRight(str, ' ', fw);
            else str = padLeft(str, ' ', fw);
          }

          if (capitalise) str = str.toUpperCase();

          result += str;
          break;
        }

        case 'f':
        case 'F': {
          next = args.shift();
          const numVal = Number(next);
          str = Math.abs(numVal).toFixed(prec !== null ? prec : 6);

          if (numVal < 0) str = '-' + str;
          else if (flagSign && numVal >= 0) str = '+' + str;

          if (flagAlternateForm && str.indexOf('.') === -1) str += '.';

          if (fw !== null) {
            if (flagLeftJustify) str = padRight(str, ' ', fw);
            else if (flagZeroPad && prec === null) str = padLeft(str, '0', fw);
            else str = padLeft(str, ' ', fw);
          }

          result += str;
          break;
        }

        case 'c': {
          next = args.shift();
          str = String.fromCharCode(Math.trunc(Number(next)));

          if (fw !== null) {
            if (flagLeftJustify) str = padRight(str, ' ', fw);
            else str = padLeft(str, ' ', fw);
          }

          result += str;
          break;
        }

        case 's': {
          next = args.shift();
          str = String(next);

          if (prec !== null) str = str.substring(0, prec);

          if (fw !== null) {
            if (flagLeftJustify) str = padRight(str, ' ', fw);
            else str = padLeft(str, ' ', fw);
          }

          result += str;
          break;
        }

        case '%':
          result += '%';
          break;
      }
    } else {
      result += c;
    }
  }

  return result;
}
