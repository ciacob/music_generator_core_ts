/**
 * Defines performance indications (such as dynamics — pp, mp, p; tempo —
 * Andante, Moderato, Allegro, etc.) that are to be added in relation to
 * the pitches of a music unit.
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/ro/se/legacy/generators/core/interfaces/IPerformanceInstruction.as`.
 *
 * **Typo fixed**: the AS3 original's setter for `value` is declared as
 * `function set (value : Object) : void;` — missing the property name
 * between `set` and `(`, which isn't valid ActionScript at all (a setter
 * declaration requires `set <propertyName>(...)`). This doesn't compile
 * as real AS3, so it can only ever have been reference-only, unexercised
 * source. Reconstructed here as `set value(...)`, matching the getter
 * immediately above it in the original and the interface's own naming
 * pattern throughout the rest of this file.
 */
export interface IPerformanceInstruction {
  /** A globally unique value that identifies this processing instruction. */
  readonly uid: string;

  /** A name identifying this performance instruction. */
  name: string;

  /**
   * A taxonomy name this performance instruction fits in. Expected
   * names are: `"dynamics"`, `"dynamic changes"`, `"tempo"`, `"tempo
   * changes"`, `"articulations"`, `"text"`.
   */
  category: string;

  /** The "content" or "payload" of this performance instruction, in a format the client code expects. */
  value: unknown;
}
