import { getRandomInteger } from './NumberUtil.js';
import { sprintf } from './Strings.js';

/**
 * Ported from `as-sources/utils-library/ro/se/utils/Arrays.as`.
 *
 * Only the members actually referenced elsewhere in the copied 133-file
 * engine snapshot are ported here (verified by grep): `getRandomItem`,
 * `getSubsetOf`, `removeOneDupplicate`, `shuffle`. The original file also
 * has `consolidate`, `deepCloneArrayOfBasicTypes` (Flash `ByteArray`-only,
 * no Node equivalent worth porting speculatively), `stableGroupByProperty`,
 * `sortAndTestForIdenticPrimitives`, `testForIdentity`, `intersect`, and
 * `filterObjectsArray` — none of which are used anywhere in the engine, so
 * none are ported.
 */

const COLLECTION_TOO_SMALL_ERROR =
  'Cannot extract a subset of %d element(s) from an Array of %d element(s).';

/**
 * Extracts and returns a subset of a given collection. The subset may, or
 * may not, be comprised of unique elements, based on `uniqueElements`.
 *
 * @param collection The originating collection.
 * @param size The size of the subset.
 * @param uniqueElements Whether each element must appear only once in the
 * returned subset. Optional, defaults to `true`.
 * @param workOnSource Optional, default `false`. Only relevant when
 * `uniqueElements` is `true`. If engaged, modifies `collection` in place
 * by removing from it the values that got picked. When `true`, the
 * "collection too small" error is suppressed and will not fire, not even
 * in legitimate scenarios (matching the original AS3 behavior).
 * @param randomFn A function producing a random floating point value in
 * `[0, 1)`. Optional, defaults to `Math.random`. Not present in the
 * original AS3 signature; threaded through to `NumberUtil.getRandomInteger`
 * per this project's convention of favoring injectable randomness.
 * @throws {Error} If requesting a subset greater than the collection, with
 * all items in it required to be unique.
 */
export function getSubsetOf<T>(
  collection: T[],
  size: number,
  uniqueElements = true,
  workOnSource = false,
  randomFn: () => number = Math.random,
): T[] {
  const src = workOnSource ? collection : collection.concat();
  let srcSize = src.length;
  const dest: T[] = [];

  if (!workOnSource) {
    if (size > srcSize && uniqueElements) {
      throw new Error(sprintf(COLLECTION_TOO_SMALL_ERROR, size, srcSize));
    }
  }

  while (dest.length < size) {
    const srcLimit = srcSize - 1;
    const randIndex = getRandomInteger(0, srcLimit, randomFn);
    dest.push(src[randIndex] as T);
    if (uniqueElements) {
      src.splice(randIndex, 1);
      srcSize = src.length;
    }
  }

  return dest;
}

/**
 * Convenience way to obtain a random element from a given array. Whether
 * the array is modified depends on the `remove` parameter.
 *
 * @param collection The originating array.
 * @param remove Optional. If `true`, the picked item is removed in-place
 * from `collection`.
 * @param randomFn A function producing a random floating point value in
 * `[0, 1)`. Optional, defaults to `Math.random`. See `getSubsetOf` for why
 * this is added relative to the original AS3 signature.
 * @returns An item randomly picked from `collection`, or `null` if
 * `collection` is empty, `null`, or `undefined`.
 */
export function getRandomItem<T>(
  collection: T[] | null | undefined,
  remove = false,
  randomFn: () => number = Math.random,
): T | null {
  if (!collection || collection.length === 0) {
    return null;
  }
  return getSubsetOf(collection, 1, remove, true, randomFn)[0] ?? null;
}

/**
 * Removes a single duplicate from `array`, modifying the array in place,
 * without sorting it. `beginFromEnd` determines whether to conduct the
 * search for duplicates in reverse order, from the end of the array
 * rather than from its beginning (the default). The equality test
 * employed is `===`.
 *
 * @returns `true` if a duplicate was found and removed, `false` otherwise.
 */
export function removeOneDupplicate<T>(array: T[], beginFromEnd = false): boolean {
  if (!array || array.length === 0) {
    return false;
  }

  const matchIndices: number[] = [];

  if (beginFromEnd) {
    outerLoopA: for (let valueIndex = array.length - 1; valueIndex >= 0; valueIndex--) {
      const searchValue = array[valueIndex];
      for (let searchIndex = array.length - 1; searchIndex >= 0; searchIndex--) {
        if (searchIndex === valueIndex) {
          continue;
        }
        if (array[searchIndex] === searchValue) {
          matchIndices.push(searchIndex);
          break outerLoopA;
        }
      }
    }
  } else {
    outerLoopB: for (let valueIndex = 0; valueIndex < array.length; valueIndex++) {
      const searchValue = array[valueIndex];
      for (let searchIndex = 0; searchIndex < array.length; searchIndex++) {
        if (array[searchIndex] === searchValue) {
          if (searchIndex === valueIndex) {
            continue;
          }
          matchIndices.push(searchIndex);
          break outerLoopB;
        }
      }
    }
  }

  if (matchIndices.length > 0) {
    array.splice(matchIndices[0] as number, 1);
    return true;
  }
  return false;
}

/**
 * Randomizes `array` in place.
 *
 * N.B.: ported verbatim from the original AS3, including its algorithm —
 * sorting with a comparator that returns `1`/`0`/`-1` based on comparing a
 * random draw against fixed thresholds. This is a faithful port, not a
 * statistically uniform shuffle (`Array.prototype.sort` with a random
 * comparator is well known to produce biased/engine-dependent
 * distributions); changing the algorithm would change the engine's
 * generation output distributions, which is out of scope for a
 * translation task.
 *
 * @param randomFn A function producing a random floating point value in
 * `[0, 1)`. Optional, defaults to `Math.random`. Not present in the
 * original AS3 signature (which hardcoded `Math.random()`); added per
 * this project's convention of favoring injectable randomness.
 */
export function shuffle<T>(array: T[], randomFn: () => number = Math.random): void {
  const randomSort = (): number => {
    const r = randomFn();
    return r > 0.65 ? 1 : r > 0.32 ? 0 : -1;
  };
  array.sort(randomSort);
}
