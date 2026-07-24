import { sprintf, trim, trimLeft, trimRight } from '../utils/Strings.js';
import { CommonStrings } from '../utils/constants/CommonStrings.js';
import type { AnalysisScoresIterator, IAnalysisScores } from './interfaces/IAnalysisScores.js';

const MIN_SCORE = 0;
const MAX_SCORE = 100;

const CRITERIA_ERR_HEADER = 'Invalid [criteria] used to record analysis score. Details:';
const NULL_VALUE_ERR = 'Value is NULL.';
const EMPTY_VALUE_ERR = 'Value is an empty string.';
const WHITESPACE_VALUE_ERR = 'Value only contains whitespace.';
const LEADING_WHITESPACE_VALUE_ERR = 'Value [%s] contains leading whitespace.';
const TRAILING_WHITESPACE_VALUE_ERR = 'Value [%s] contains trailing whitespace.';

const SCORE_ERR_HEADER = 'Invalid analysis score [%s] recorded for criteria [%s]. Details:';
const NAN_SCORE_ERR = 'Score is not a number (NaN)';
const TOO_SMALL_SCORE_ERR = 'Score is too small: [%s] is less than minimum allowed [%s].';
const TOO_LARGE_SCORE_ERR = 'Score is too large: [%s] is greater than maximum allowed [%s].';

/**
 * Default implementation of `IAnalysisScores`.
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/ro/se/legacy/generators/core/AnalysisScores.as`.
 *
 * `assertProperValue`'s out-of-range checks (`TOO_SMALL_SCORE_ERR`/
 * `TOO_LARGE_SCORE_ERR`) are effectively unreachable via `add()`: `add()`
 * clamps `value` into `[MIN_SCORE, MAX_SCORE]` *before* validating it (a
 * documented "Change in 1.5.0" favoring graceful recovery over halting
 * execution), so by the time `assertProperValue` runs, an out-of-range
 * value can no longer occur through that path — only a genuine `NaN`
 * survives the clamp unaffected (since any comparison against `NaN` is
 * `false`). This is the original's own documented behavior, not a
 * translation artifact; ported faithfully, including the now-partially-
 * dead validation branches.
 */
export class AnalysisScores implements IAnalysisScores {
  private criteriaList: string[] = [];
  private values: Record<string, number> = {};

  /** @see IAnalysisScores.add */
  add(criteria: string, value: number): void {
    let clampedValue = value;
    if (clampedValue < MIN_SCORE) {
      clampedValue = MIN_SCORE;
    }
    if (clampedValue > MAX_SCORE) {
      clampedValue = MAX_SCORE;
    }

    if (this.assertProperCriteria(criteria) && this.assertProperValue(criteria, clampedValue)) {
      if (this.criteriaList.indexOf(criteria) === -1) {
        this.criteriaList.push(criteria);
      }
      this.values[criteria] = clampedValue;
    }
  }

  /** @see IAnalysisScores.getValueFor */
  getValueFor(criteria: string): number {
    if (!(criteria in this.values)) {
      return NaN;
    }
    return this.values[criteria] as number;
  }

  /** @see IAnalysisScores.remove */
  remove(criteria: string): void {
    const criteriaIndex = this.criteriaList.indexOf(criteria);
    if (criteriaIndex !== -1) {
      this.criteriaList.splice(criteriaIndex, 1);
      delete this.values[criteria];
    }
  }

  /** @see IAnalysisScores.forEach */
  forEach(iterator: AnalysisScoresIterator): void {
    for (const criteria of this.criteriaList) {
      const value = this.values[criteria] as number;
      const mustContinue = iterator(criteria, value);
      if (mustContinue === false) {
        break;
      }
    }
  }

  /** @see IAnalysisScores.empty */
  empty(): void {
    this.criteriaList.length = 0;
    this.values = {};
  }

  /** @see IAnalysisScores.isEmpty */
  isEmpty(): boolean {
    return this.criteriaList.length === 0;
  }

  /**
   * Throws if `criteria` is inappropriate. Effectively enforces client
   * code to store semantically accurate data in each assignment.
   *
   * Validation rules:
   * 1. `criteria` must not be `null`/`undefined`, an empty string, or
   *    contain only whitespace.
   * 2. `criteria` must not contain any leading or trailing whitespace.
   */
  private assertProperCriteria(criteria: string | null | undefined): boolean {
    const assertTokens: string[] = [];
    if (criteria == null) {
      assertTokens.push(NULL_VALUE_ERR);
    } else if (criteria.length === 0) {
      assertTokens.push(EMPTY_VALUE_ERR);
    } else if (trim(criteria).length === 0) {
      assertTokens.push(sprintf(WHITESPACE_VALUE_ERR, criteria));
    } else if (trimLeft(criteria).length !== criteria.length) {
      assertTokens.push(sprintf(LEADING_WHITESPACE_VALUE_ERR, criteria));
    } else if (trimRight(criteria).length !== criteria.length) {
      assertTokens.push(sprintf(TRAILING_WHITESPACE_VALUE_ERR, criteria));
    }
    if (assertTokens.length > 0) {
      assertTokens.unshift(sprintf(CRITERIA_ERR_HEADER, criteria));
      throw new Error(assertTokens.join(CommonStrings.NEW_LINE));
    }
    return true;
  }

  /**
   * Throws if `value` is inappropriate. Effectively enforces client code
   * to store semantically accurate data in each assignment.
   *
   * Validation rules:
   * 1. `value` must not be `NaN`.
   * 2. `value` must be in the range `[0, 100]` inclusive (see the class
   *    comment above for why this branch is effectively unreachable via
   *    `add()`, which pre-clamps).
   */
  private assertProperValue(criteria: string, value: number): boolean {
    const assertTokens: string[] = [];
    if (Number.isNaN(value)) {
      assertTokens.push(NAN_SCORE_ERR);
    } else if (value < MIN_SCORE) {
      assertTokens.push(sprintf(TOO_SMALL_SCORE_ERR, value, MIN_SCORE));
    } else if (value > MAX_SCORE) {
      assertTokens.push(sprintf(TOO_LARGE_SCORE_ERR, value, MAX_SCORE));
    }
    if (assertTokens.length > 0) {
      assertTokens.unshift(sprintf(SCORE_ERR_HEADER, value, criteria));
      throw new Error(assertTokens.join(CommonStrings.NEW_LINE));
    }
    return true;
  }
}
