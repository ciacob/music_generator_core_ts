import { describe, expect, it } from 'vitest';
import { TimeSignatureDefinition } from '../../../src/knowledge/timesignature/TimeSignatureDefinition.js';
import { TimeSignatureEntry } from '../../../src/knowledge/timesignature/TimeSignatureEntry.js';
import { TimeSignatureMap } from '../../../src/knowledge/timesignature/TimeSignatureMap.js';

/** Builds a ready-to-use entry: `repetitions` measures of `numerator`/`denominator`. */
function makeEntry(numerator: number, denominator: number, repetitions: number): TimeSignatureEntry {
  const entry = new TimeSignatureEntry();
  entry.signature = new TimeSignatureDefinition(numerator, denominator);
  entry.repetitions = repetitions;
  return entry;
}

describe('TimeSignatureMap defaults', () => {
  it('starts empty with a duration of 0/1', () => {
    const map = new TimeSignatureMap();
    expect(map.length).toBe(0);
    expect(map.duration.toString()).toBe('0/1');
  });
});

describe('TimeSignatureMap.push / getAt / duration accounting', () => {
  it('push adds entries and returns the new length', () => {
    const map = new TimeSignatureMap();
    const len = map.push(makeEntry(4, 4, 2), makeEntry(3, 4, 1));
    expect(len).toBe(2);
    expect(map.length).toBe(2);
  });

  it('getAt retrieves the entry at a given index', () => {
    const map = new TimeSignatureMap();
    const entry = makeEntry(4, 4, 1);
    map.push(entry);
    expect(map.getAt(0)).toBe(entry);
  });

  it('accumulates duration across pushed entries', () => {
    const map = new TimeSignatureMap();
    map.push(makeEntry(4, 4, 2)); // 2 measures of 1/1 = 2/1
    map.push(makeEntry(3, 4, 4)); // 4 measures of 3/4 = 3/1
    expect(map.duration.toString()).toBe('5/1');
  });
});

describe('TimeSignatureMap.insertAt / removeAt', () => {
  it('insertAt inserts at the given index and updates duration', () => {
    const map = new TimeSignatureMap();
    const a = makeEntry(4, 4, 1);
    const b = makeEntry(4, 4, 1);
    map.push(a);
    map.insertAt(0, b);
    expect(map.getAt(0)).toBe(b);
    expect(map.getAt(1)).toBe(a);
    expect(map.duration.toString()).toBe('2/1');
  });

  it('removeAt removes the entry and reduces duration', () => {
    const map = new TimeSignatureMap();
    const a = makeEntry(4, 4, 3);
    map.push(a);
    const removed = map.removeAt(0);
    expect(removed).toBe(a);
    expect(map.length).toBe(0);
    expect(map.duration.toString()).toBe('0/1');
  });
});

describe('TimeSignatureMap.pop / shift', () => {
  it('pop removes and returns the last entry, reducing duration', () => {
    const map = new TimeSignatureMap();
    const a = makeEntry(4, 4, 1);
    const b = makeEntry(4, 4, 2);
    map.push(a, b);
    const popped = map.pop();
    expect(popped).toBe(b);
    expect(map.length).toBe(1);
    expect(map.duration.toString()).toBe('1/1');
  });

  it('pop on an empty map returns undefined without throwing', () => {
    const map = new TimeSignatureMap();
    expect(map.pop()).toBeUndefined();
  });

  it('shift removes and returns the first entry, reducing duration', () => {
    const map = new TimeSignatureMap();
    const a = makeEntry(4, 4, 1);
    const b = makeEntry(4, 4, 2);
    map.push(a, b);
    const shifted = map.shift();
    expect(shifted).toBe(a);
    expect(map.length).toBe(1);
    expect(map.duration.toString()).toBe('2/1');
  });

  it('shift on an empty map returns undefined without throwing', () => {
    const map = new TimeSignatureMap();
    expect(map.shift()).toBeUndefined();
  });
});

describe('TimeSignatureMap.splice', () => {
  it('removes entries and reduces duration accordingly', () => {
    const map = new TimeSignatureMap();
    map.push(makeEntry(4, 4, 1), makeEntry(4, 4, 2), makeEntry(4, 4, 3));
    map.splice(1, 1); // remove the middle (2-measure) entry
    expect(map.length).toBe(2);
    expect(map.duration.toString()).toBe('4/1'); // 1 + 3
  });

  it('inserts entries individually, not as a single nested array (verifying the AS3 bug fix)', () => {
    const map = new TimeSignatureMap();
    const a = makeEntry(4, 4, 1);
    const b = makeEntry(4, 4, 1);
    map.splice(0, 0, a, b);
    expect(map.length).toBe(2);
    expect(map.getAt(0)).toBe(a);
    expect(map.getAt(1)).toBe(b);
    expect(map.duration.toString()).toBe('2/1');
  });

  it('defaults deleteCount to "delete everything from startIndex onward"', () => {
    const map = new TimeSignatureMap();
    map.push(makeEntry(4, 4, 1), makeEntry(4, 4, 1), makeEntry(4, 4, 1));
    map.splice(1);
    expect(map.length).toBe(1);
  });
});

describe('TimeSignatureMap array-like read operations', () => {
  it('indexOf / lastIndexOf locate entries by reference', () => {
    const map = new TimeSignatureMap();
    const a = makeEntry(4, 4, 1);
    const b = makeEntry(4, 4, 1);
    map.push(a, b, a);
    expect(map.indexOf(a)).toBe(0);
    expect(map.lastIndexOf(a)).toBe(2);
    expect(map.indexOf(b)).toBe(1);
  });

  it('forEach visits every entry with (entry, index, map)', () => {
    const map = new TimeSignatureMap();
    map.push(makeEntry(4, 4, 1), makeEntry(3, 4, 1));
    const visited: Array<[number, boolean]> = [];
    map.forEach((entry, index, m) => {
      visited.push([index, m === map]);
    });
    expect(visited).toEqual([
      [0, true],
      [1, true],
    ]);
  });

  it('every / some behave like their Array counterparts', () => {
    const map = new TimeSignatureMap();
    map.push(makeEntry(4, 4, 1), makeEntry(4, 4, 2));
    expect(map.every((entry) => entry.repetitions >= 1)).toBe(true);
    expect(map.some((entry) => entry.repetitions === 2)).toBe(true);
    expect(map.some((entry) => entry.repetitions === 99)).toBe(false);
  });

  it('reverse reverses entry order in place', () => {
    const map = new TimeSignatureMap();
    const a = makeEntry(4, 4, 1);
    const b = makeEntry(4, 4, 1);
    map.push(a, b);
    map.reverse();
    expect(map.getAt(0)).toBe(b);
    expect(map.getAt(1)).toBe(a);
  });

  it('sort accepts a comparator, like Array.prototype.sort', () => {
    const map = new TimeSignatureMap();
    map.push(makeEntry(4, 4, 3), makeEntry(4, 4, 1), makeEntry(4, 4, 2));
    map.sort((a, b) => a.repetitions - b.repetitions);
    expect([map.getAt(0).repetitions, map.getAt(1).repetitions, map.getAt(2).repetitions]).toEqual([
      1, 2, 3,
    ]);
  });

  it('unshift adds entries to the front and returns the new length', () => {
    const map = new TimeSignatureMap();
    const a = makeEntry(4, 4, 1);
    const b = makeEntry(4, 4, 1);
    map.push(a);
    const len = map.unshift(b);
    expect(len).toBe(2);
    expect(map.getAt(0)).toBe(b);
  });
});
