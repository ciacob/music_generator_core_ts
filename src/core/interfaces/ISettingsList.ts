import type { IParameter } from './IParameter.js';

/**
 * Dedicated container to store and retrieve `parameter-time-value`
 * triplets.
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/ro/se/legacy/generators/core/interfaces/ISettingsList.as`.
 */
export interface ISettingsList {
  /**
   * Stores `value` in relation to `parameter` and a point in time
   * (`timeSlot`, a percentage of the available musical time the
   * generation process has to "fill"). If two calls use the same
   * `timeSlot`, the later call overwrites the former.
   *
   * @param parameter The parameter the value refers to.
   * @param timeSlot A point in time, as an unsigned integer in `[1, 100]`
   * inclusive (note: stricter than `getValueAt`'s `[0, 100]` -- `0` is a
   * valid *read*-time sentinel, but is never a valid *write* target),
   * referring to the available musical duration the generation process
   * has to "fill". E.g. `50` would point to the start of the third
   * measure in a four-measure-long fragment.
   * @param value The value to record; its exact type depends on `parameter`.
   */
  setValueAt(parameter: IParameter, timeSlot: number, value: unknown): void;

  /**
   * Retrieves the value recorded for `parameter` at `timeSlot`. If no
   * value was ever recorded for that specific point in time, a new value
   * is calculated via linear interpolation (if `parameter.isTweenable`)
   * or the most recent value is used otherwise. If no value was ever
   * recorded for `parameter` at all, `null` is returned.
   *
   * @param parameter The parameter the value refers to.
   * @param timeSlot A point in time, as an unsigned integer in `[0, 100]`
   * inclusive (note: looser than `setValueAt`'s `[1, 100]` -- `0` is
   * accepted here as "no recorded point yet", resolved via a forward
   * search for the earliest recorded value).
   * @returns A matching, possibly interpolated value, or `null`.
   */
  getValueAt(parameter: IParameter, timeSlot: number): unknown;
}
