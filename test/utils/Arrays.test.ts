import { describe, expect, it } from 'vitest';
import { getRandomItem, getSubsetOf, removeOneDupplicate, shuffle } from '../../src/utils/Arrays.js';

describe('getSubsetOf', () => {
  it('extracts a subset of the requested size', () => {
    const result = getSubsetOf([1, 2, 3, 4, 5], 3, true, false, () => 0);
    expect(result).toHaveLength(3);
  });

  it('produces unique elements when uniqueElements is true', () => {
    // With a fixed RNG always returning 0 (always picks index 0 of the
    // shrinking source), the picks must still all be distinct source
    // elements since picked elements are removed from the source pool.
    const result = getSubsetOf([1, 2, 3, 4, 5], 5, true, false, () => 0);
    expect(new Set(result).size).toBe(5);
    expect(result.sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('does not mutate the source collection by default', () => {
    const source = [1, 2, 3, 4, 5];
    getSubsetOf(source, 2, true, false, () => 0);
    expect(source).toEqual([1, 2, 3, 4, 5]);
  });

  it('mutates the source collection in place when workOnSource is true', () => {
    const source = [1, 2, 3, 4, 5];
    getSubsetOf(source, 2, true, true, () => 0);
    expect(source).toHaveLength(3);
  });

  it('may repeat elements when uniqueElements is false', () => {
    const result = getSubsetOf([1, 2, 3], 5, false, false, () => 0);
    expect(result).toHaveLength(5);
    expect(result.every((v) => v === 1)).toBe(true);
  });

  it('throws when requesting more unique elements than the collection has', () => {
    expect(() => getSubsetOf([1, 2], 5, true, false)).toThrow(
      /Cannot extract a subset of 5 element\(s\) from an Array of 2 element\(s\)\./,
    );
  });

  it('does not throw when workOnSource suppresses the size check', () => {
    // Matches the original AS3 quirk: the too-small check is skipped
    // whenever workOnSource is true, even in a legitimately too-small
    // scenario.
    expect(() => getSubsetOf([1, 2], 2, true, true, () => 0)).not.toThrow();
  });
});

describe('getRandomItem', () => {
  it('returns an item from the collection', () => {
    const item = getRandomItem([10, 20, 30], false, () => 0);
    expect([10, 20, 30]).toContain(item);
  });

  it('returns null for an empty collection', () => {
    expect(getRandomItem([])).toBeNull();
  });

  it('returns null for a null/undefined collection', () => {
    expect(getRandomItem(null)).toBeNull();
    expect(getRandomItem(undefined)).toBeNull();
  });

  it('removes the picked item in place when remove=true', () => {
    const source = [1, 2, 3];
    getRandomItem(source, true, () => 0);
    expect(source).toHaveLength(2);
  });

  it('does not mutate the collection when remove=false', () => {
    const source = [1, 2, 3];
    getRandomItem(source, false, () => 0);
    expect(source).toHaveLength(3);
  });
});

describe('removeOneDupplicate', () => {
  it('removes exactly one occurrence of the first found duplicate, searching from the start', () => {
    const arr = [1, 2, 3, 2, 4];
    const removed = removeOneDupplicate(arr);
    expect(removed).toBe(true);
    expect(arr).toHaveLength(4);
    // one of the two `2`s is gone, one instance remains
    expect(arr.filter((v) => v === 2)).toHaveLength(1);
  });

  it('removes a duplicate searching from the end when beginFromEnd is true', () => {
    const arr = [1, 2, 3, 2, 4];
    const removed = removeOneDupplicate(arr, true);
    expect(removed).toBe(true);
    expect(arr.filter((v) => v === 2)).toHaveLength(1);
  });

  it('returns false and leaves the array untouched when there are no duplicates', () => {
    const arr = [1, 2, 3];
    const removed = removeOneDupplicate(arr);
    expect(removed).toBe(false);
    expect(arr).toEqual([1, 2, 3]);
  });

  it('returns false for an empty array', () => {
    expect(removeOneDupplicate([])).toBe(false);
  });

  it('leaves an array with no duplicates the same length regardless of direction', () => {
    expect(removeOneDupplicate([1, 2, 3], true)).toBe(false);
  });
});

describe('shuffle', () => {
  it('does not add or remove elements', () => {
    const arr = [1, 2, 3, 4, 5];
    shuffle(arr, () => 0.5);
    expect(arr.slice().sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('is deterministic for a fixed RNG', () => {
    const a = [1, 2, 3, 4, 5];
    const b = [1, 2, 3, 4, 5];
    shuffle(a, () => 0.1);
    shuffle(b, () => 0.1);
    expect(a).toEqual(b);
  });

  it('mutates the array in place (does not return a new one)', () => {
    const arr = [1, 2, 3];
    const returned = shuffle(arr, () => 0.5);
    expect(returned).toBeUndefined();
  });
});
