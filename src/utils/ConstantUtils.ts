/**
 * Ported from `as-sources/utils-library/ro/se/utils/ConstantUtils.as`.
 *
 * The original AS3 utility reflects over a `Class` at runtime via
 * `flash.utils.describeType`, reading its `constant`/`accessor` nodes to
 * enumerate a "constants class"'s names/values. TypeScript has no runtime
 * reflection over classes like that, but it doesn't need one here: every
 * "constants class" in this port (see `constants/CommonStrings.ts`, and
 * the `generators/constants/` tables in a later step) is translated as a
 * plain frozen object instead of a class. `getAllNames`/`getAllValues`
 * are adapted accordingly to operate on such objects directly via
 * `Object.keys`/`Object.values` — the AS3 version's `sort()` (default,
 * lexicographic) is preserved exactly, since `Array.prototype.sort()`
 * with no comparator is also lexicographic in JS/TS.
 *
 * Only `getAllNames`/`getAllValues` are referenced elsewhere in the
 * copied 133-file engine snapshot (verified by grep). The original file's
 * `getValueByMatchingName`, `getNamesByMatchingValue`, `hasName`, and
 * `hasValue` are not used anywhere in the engine, so they are not ported.
 * The AS3 `includeAccessors` parameter of `getAllNames` has no
 * counterpart here — TypeScript object literals don't distinguish
 * "constant" own-properties from "accessor" (getter) own-properties the
 * way AS3's `describeType` does, and no caller in the engine ever passed
 * `true` for it anyway.
 */

/**
 * Returns all names (keys) defined by a "constants object" (the TS
 * equivalent of an AS3 constants class — see the file-level note above).
 *
 * @param constants The constants object to retrieve names of.
 * @returns An alphabetically sorted array with all the names found.
 */
export function getAllNames(constants: Record<string, unknown>): string[] {
  return Object.keys(constants).sort();
}

/**
 * Returns all values defined by a "constants object" (the TS equivalent
 * of an AS3 constants class — see the file-level note above).
 *
 * @param constants The constants object to retrieve values of.
 * @returns An alphabetically (lexicographically, per default `sort()`
 * semantics) sorted array with all the values found.
 */
export function getAllValues(constants: Record<string, unknown>): unknown[] {
  return Object.values(constants).sort();
}
