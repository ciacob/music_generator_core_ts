/**
 * Pure functions underlying `SettingsList`. As in `math/fractionMath.ts`
 * and similar modules elsewhere in this project, pulling these out lets
 * the actual search/interpolation algorithm be tested directly, without
 * constructing a `SettingsList` or any `IParameter`.
 *
 * Ported from the private methods of
 * `as-sources/legacy-generators-core-library/ro/se/legacy/generators/core/SettingsList.as`.
 */

export const MIN_TIME = 1;
export const MAX_TIME = 100;
const LAST_SLOT = MAX_TIME;

/**
 * Special return value meaning "this settings list is malformed and/or
 * contains garbage data" — no recorded time could be found in either
 * direction.
 */
export const ERROR_CODE = 404;

/**
 * Returns the recorded time closest to `timeSlot`, searching backward
 * first; if nothing is found searching backward, falls back to a forward
 * search (`recordedTimeAtOrAfter`).
 *
 * @param slots A sparse `timeSlot -> value` map (only defined at the
 * indices where a value was actually recorded).
 * @param timeSlot The point in time to start searching from.
 * @param useFallback Whether to search in the opposite direction as a
 * fallback. Internally set to `false` on fallback calls, to prevent
 * infinite recursion.
 * @returns A time slot (`0`-`100` inclusive), or `ERROR_CODE`.
 */
export function recordedTimeAtOrBefore(
  slots: Readonly<Record<number, unknown>>,
  timeSlot: number,
  useFallback = true,
): number {
  let searchIndex = timeSlot;
  while (searchIndex >= MIN_TIME && slots[searchIndex] === undefined) {
    searchIndex--;
  }
  if (searchIndex < MIN_TIME) {
    return useFallback ? recordedTimeAtOrAfter(slots, timeSlot, false) : ERROR_CODE;
  }
  return searchIndex;
}

/**
 * Returns the recorded time closest to `timeSlot`, searching forward
 * first; if nothing is found searching forward, falls back to a backward
 * search (`recordedTimeAtOrBefore`).
 *
 * @see recordedTimeAtOrBefore
 */
export function recordedTimeAtOrAfter(
  slots: Readonly<Record<number, unknown>>,
  timeSlot: number,
  useFallback = true,
): number {
  let searchIndex = timeSlot;
  while (searchIndex <= LAST_SLOT && slots[searchIndex] === undefined) {
    searchIndex++;
  }
  if (searchIndex > LAST_SLOT) {
    return useFallback ? recordedTimeAtOrBefore(slots, timeSlot, false) : ERROR_CODE;
  }
  return searchIndex;
}

/**
 * Computes linear interpolation. All arguments are expected to be
 * floats.
 *
 * @param x1 The start point.
 * @param y1 The start value (known value at the starting point).
 * @param x3 The end point.
 * @param y3 The end value (known value at the ending point).
 * @param x2 The "interpolation" point — the point a value is needed for.
 * @returns The calculated (interpolated) value for `x2` (aka `y2`).
 * Returns `0 + y1` (i.e. just `y1`) if the displacement itself would be
 * `NaN` (e.g. `x1 === x3`), matching the original's `isNaN` guard.
 */
export function computeLinearInterpolation(
  x1: number,
  y1: number,
  x3: number,
  y3: number,
  x2: number,
): number {
  const displacement = ((x2 - x1) * (y3 - y1)) / (x3 - x1);
  return (Number.isNaN(displacement) ? 0 : displacement) + y1;
}

/**
 * AS3's `value is int` has no exact TypeScript equivalent (there's no
 * `int` runtime type) — approximated here as "a number with no
 * fractional part".
 */
export function isInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value);
}

/** Same approximation as `isInt`, additionally requiring non-negativity (AS3's `value is uint`). */
export function isUint(value: unknown): value is number {
  return isInt(value) && value >= 0;
}
