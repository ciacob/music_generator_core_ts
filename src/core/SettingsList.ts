import { sprintf } from '../utils/Strings.js';
import { CommonStrings } from '../utils/constants/CommonStrings.js';
import { CoreOperationKeys } from './constants/CoreOperationKeys.js';
import {
  ERROR_CODE,
  MAX_TIME,
  MIN_TIME,
  computeLinearInterpolation,
  isInt,
  isUint,
  recordedTimeAtOrAfter,
  recordedTimeAtOrBefore,
} from './settingsListMath.js';
import type { IParameter } from './interfaces/IParameter.js';
import type { ISettingsList } from './interfaces/ISettingsList.js';

const TIME_ERR_HEADER = 'Invalid time slot [%s] set for parameter [%s]. Details:';
const TOO_SMALL_TIME_ERR = 'Time slot is too small: [%s] is less than minimum allowed [%s].';
const TOO_LARGE_TIME_ERR = 'Time slot is too large: [%s] is greater than maximum allowed [%s].';
const NOT_ARRAY_TIME_ERR =
  'Type of parameter [%s] is not Array, therefore time slot cannot be [%s]. It must always be [%s].';

const VALUE_ERR_HEADER = 'Invalid value [%s] set for parameter [%s] at time slot [%s]. Details:';
const NULL_VALUE_ERR = 'Value is NULL.';
const BAD_TYPE_VALUE_ERR = 'Expected type [%s] but encountered [%s].';
const NAN_VALUE_ERR = 'Value is not a number (NaN)';
const TOO_SMALL_VALUE_ERR = 'Value is too small: [%s] is less than minimum allowed [%s].';
const TOO_LARGE_VALUE_ERR = 'Value is too large: [%s] is greater than maximum allowed [%s].';

/**
 * Dedicated container to store and retrieve `parameter-time-value`
 * triplets.
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/ro/se/legacy/generators/core/SettingsList.as`.
 *
 * Each parameter's recorded values are kept as a sparse `timeSlot ->
 * value` map (`Record<number, unknown>`) rather than the AS3 original's
 * fixed-length `Array` — behaviorally equivalent (both rely on "is this
 * slot `undefined`" checks), but avoids JS's sparse-array-hole quirks for
 * something that's really a lookup map, not a sequential list.
 *
 * The AS3 original's `_assertProperValue` performs `value is int`/`value
 * is uint` runtime type checks that have no exact TypeScript equivalent
 * (there's no `int`/`uint` runtime type) — approximated via
 * `settingsListMath.isInt`/`isUint`. One deliberate simplification: the
 * original still computed `(value as uint) < minUint`/`> maxUint` even
 * when `value` failed the `is uint` check, which in AS3 means a negative
 * number gets bit-reinterpreted into a huge unsigned value rather than
 * throwing — an obscure runtime quirk with no meaningful TypeScript
 * equivalent (there's no `uint` to reinterpret into). Here, the
 * min/max checks only run once `isUint(value)` is already confirmed,
 * avoiding that quirk rather than reproducing it.
 */
export class SettingsList implements ISettingsList {
  /** @see settingsListMath.ERROR_CODE */
  static readonly ERROR_CODE = ERROR_CODE;

  private values: Record<string, Record<number, unknown>> = {};

  /** @see ISettingsList.setValueAt */
  setValueAt(parameter: IParameter, timeSlot: number, value: unknown): void {
    const uid = parameter.uid;
    if (!(uid in this.values)) {
      this.values[uid] = {};
    }
    if (this.assertProperValue(parameter, timeSlot, value) && this.assertProperTime(parameter, timeSlot)) {
      (this.values[uid] as Record<number, unknown>)[timeSlot] = value;
    }
  }

  /** @see ISettingsList.getValueAt */
  getValueAt(parameter: IParameter, timeSlot: number): unknown {
    const uid = parameter.uid;
    if (!(uid in this.values)) {
      return null;
    }
    const slots = this.values[uid] as Record<number, unknown>;
    if (Object.keys(slots).length === 0) {
      return null;
    }

    const canInterpolate =
      parameter.isTweenable &&
      (parameter.type === CoreOperationKeys.TYPE_INT || parameter.type === CoreOperationKeys.TYPE_ARRAY);

    // If interpolation is an option, return the interpolated value;
    // otherwise, return the last known (given) value.
    const timeAtOrBefore = recordedTimeAtOrBefore(slots, timeSlot);
    if (timeAtOrBefore !== ERROR_CODE) {
      const valueAtOrBefore = slots[timeAtOrBefore];
      if (canInterpolate) {
        const timeAtOrAfter = recordedTimeAtOrAfter(slots, timeSlot);
        const valueAtOrAfter = slots[timeAtOrAfter];
        let interpolatedValue = computeLinearInterpolation(
          timeAtOrBefore,
          valueAtOrBefore as number,
          timeAtOrAfter,
          valueAtOrAfter as number,
          timeSlot,
        );
        // Round the interpolated value to an integer.
        interpolatedValue = Math.round(interpolatedValue);
        return interpolatedValue;
      }
      return valueAtOrBefore;
    }

    // If we reached here, this dataset is corrupt or malformed.
    return null;
  }

  /**
   * Throws if `value` does not match `parameter`'s type and minimum/
   * maximum thresholds. Effectively enforces client code to store
   * semantically accurate data in each triplet.
   *
   * Validation rules:
   * 1. Parameters of type `TYPE_ARRAY` are assumed to contain unsigned
   *    integers ranging from `1` to `100`.
   * 2. Parameters of type `TYPE_INT` must respect their own `minValue`/
   *    `maxValue`, if given.
   * 3. For all other parameter types (`TYPE_BOOLEAN`, `TYPE_STRING`,
   *    `TYPE_OBJECT`), no validation is performed yet (matching the
   *    original's own "TODO: implement when actually needed").
   */
  private assertProperValue(parameter: IParameter, timeSlot: number, value: unknown): boolean {
    const assertTokens: string[] = [];
    const type = parameter.type;
    const haveMinThreshold =
      parameter.minValue !== null && parameter.minValue !== undefined && isInt(parameter.minValue);
    const haveMaxThreshold =
      parameter.maxValue !== null && parameter.maxValue !== undefined && isInt(parameter.maxValue);

    if (type === CoreOperationKeys.TYPE_ARRAY) {
      const minUint = 1;
      const maxUint = 100;
      if (value === null || value === undefined) {
        assertTokens.push(NULL_VALUE_ERR);
      }
      if (typeof value === 'number' && Number.isNaN(value)) {
        assertTokens.push(NAN_VALUE_ERR);
      }
      if (!isUint(value)) {
        assertTokens.push(sprintf(BAD_TYPE_VALUE_ERR, 'uint', typeof value));
      } else {
        if (value < minUint) {
          assertTokens.push(sprintf(TOO_SMALL_VALUE_ERR, value, minUint));
        }
        if (value > maxUint) {
          assertTokens.push(sprintf(TOO_LARGE_VALUE_ERR, value, maxUint));
        }
      }
    } else if (type === CoreOperationKeys.TYPE_INT) {
      let minInt = Number.MIN_SAFE_INTEGER;
      let maxInt = Number.MAX_SAFE_INTEGER;
      if (haveMinThreshold) {
        minInt = parameter.minValue as number;
      } else if (parameter.minValue !== null && parameter.minValue !== undefined) {
        assertTokens.push(sprintf(BAD_TYPE_VALUE_ERR, 'int', typeof parameter.minValue));
      }
      if (haveMaxThreshold) {
        maxInt = parameter.maxValue as number;
      } else if (parameter.maxValue !== null && parameter.maxValue !== undefined) {
        assertTokens.push(sprintf(BAD_TYPE_VALUE_ERR, 'int', typeof parameter.maxValue));
      }
      if (value === null || value === undefined) {
        assertTokens.push(NULL_VALUE_ERR);
      }
      if (typeof value === 'number' && Number.isNaN(value)) {
        assertTokens.push(NAN_VALUE_ERR);
      }
      if (!isInt(value)) {
        assertTokens.push(sprintf(BAD_TYPE_VALUE_ERR, 'int', typeof value));
      } else {
        if (haveMinThreshold && value < minInt) {
          assertTokens.push(sprintf(TOO_SMALL_VALUE_ERR, value, minInt));
        }
        if (haveMaxThreshold && value > maxInt) {
          assertTokens.push(sprintf(TOO_LARGE_VALUE_ERR, value, maxInt));
        }
      }
    }
    // TYPE_BOOLEAN / TYPE_STRING / TYPE_OBJECT: no-op, matching the original's own "TODO: implement when actually needed".

    if (assertTokens.length > 0) {
      assertTokens.unshift(sprintf(VALUE_ERR_HEADER, value, parameter.name, timeSlot));
      throw new Error(assertTokens.join(CommonStrings.NEW_LINE));
    }
    return true;
  }

  /**
   * Throws if `timeSlot` is out of range, or inappropriate for
   * `parameter`'s type. Effectively enforces client code to store
   * semantically accurate data in each triplet.
   *
   * Validation rules:
   * 1. `timeSlot` must be in the range `[1, 100]` inclusive.
   * 2. If `parameter.type` is NOT `TYPE_ARRAY`, `timeSlot` must ALWAYS
   *    be the minimum allowed value (`1`).
   */
  private assertProperTime(parameter: IParameter, timeSlot: number): boolean {
    const assertTokens: string[] = [];
    if (timeSlot < MIN_TIME) {
      assertTokens.push(sprintf(TOO_SMALL_TIME_ERR, timeSlot, MIN_TIME));
    }
    if (timeSlot > MAX_TIME) {
      assertTokens.push(sprintf(TOO_LARGE_TIME_ERR, timeSlot, MAX_TIME));
    }
    if (parameter.type !== CoreOperationKeys.TYPE_ARRAY && timeSlot !== MIN_TIME) {
      assertTokens.push(sprintf(NOT_ARRAY_TIME_ERR, parameter.name, timeSlot, MIN_TIME));
    }
    if (assertTokens.length > 0) {
      assertTokens.unshift(sprintf(TIME_ERR_HEADER, timeSlot, parameter.name));
      throw new Error(assertTokens.join(CommonStrings.NEW_LINE));
    }
    return true;
  }
}
