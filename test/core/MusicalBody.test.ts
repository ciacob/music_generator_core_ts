import { describe, expect, it } from 'vitest';
import { Fraction } from '../../src/math/Fraction.js';
import { MusicUnit } from '../../src/core/MusicUnit.js';
import { MusicalBody } from '../../src/core/MusicalBody.js';

function makeUnit(numerator: number, denominator: number): MusicUnit {
  const unit = new MusicUnit();
  unit.duration = new Fraction(numerator, denominator);
  return unit;
}

describe('MusicalBody defaults', () => {
  it('starts empty with a duration of 0/1', () => {
    const body = new MusicalBody();
    expect(body.length).toBe(0);
    expect(body.duration.toString()).toBe('0/1');
  });
});

describe('MusicalBody.push / getAt / duration accounting', () => {
  it('push adds units and returns the new length', () => {
    const body = new MusicalBody();
    const len = body.push(makeUnit(1, 4), makeUnit(1, 4));
    expect(len).toBe(2);
    expect(body.length).toBe(2);
  });

  it('accumulates duration across pushed units', () => {
    const body = new MusicalBody();
    body.push(makeUnit(1, 4), makeUnit(1, 4));
    expect(body.duration.toString()).toBe('1/2');
  });
});

describe('MusicalBody.insertAt / removeAt', () => {
  it('insertAt inserts and updates duration', () => {
    const body = new MusicalBody();
    const a = makeUnit(1, 4);
    const b = makeUnit(1, 4);
    body.push(a);
    body.insertAt(0, b);
    expect(body.getAt(0)).toBe(b);
    expect(body.getAt(1)).toBe(a);
    expect(body.duration.toString()).toBe('1/2');
  });

  it('removeAt removes and reduces duration', () => {
    const body = new MusicalBody();
    body.push(makeUnit(1, 2));
    body.removeAt(0);
    expect(body.length).toBe(0);
    expect(body.duration.toString()).toBe('0/1');
  });
});

describe('MusicalBody.pop / shift', () => {
  it('pop on an empty body returns undefined without throwing', () => {
    expect(new MusicalBody().pop()).toBeUndefined();
  });

  it('shift on an empty body returns undefined without throwing', () => {
    expect(new MusicalBody().shift()).toBeUndefined();
  });

  it('pop removes the last unit and reduces duration', () => {
    const body = new MusicalBody();
    const a = makeUnit(1, 4);
    const b = makeUnit(1, 2);
    body.push(a, b);
    expect(body.pop()).toBe(b);
    expect(body.duration.toString()).toBe('1/4');
  });
});

describe('MusicalBody.length setter and updateDuration (bug fix verification)', () => {
  it('set length on a body with no units does not throw (the fixed null-deref)', () => {
    const body = new MusicalBody();
    expect(() => {
      body.length = 0;
    }).not.toThrow();
    expect(body.duration.toString()).toBe('0/1');
  });

  it('updateDuration() on a fresh body does not throw', () => {
    const body = new MusicalBody();
    expect(() => body.updateDuration()).not.toThrow();
  });

  it('set length truncates units and recomputes duration accordingly', () => {
    const body = new MusicalBody();
    body.push(makeUnit(1, 4), makeUnit(1, 4), makeUnit(1, 4));
    body.length = 1;
    expect(body.length).toBe(1);
    expect(body.duration.toString()).toBe('1/4');
  });
});

describe('MusicalBody.splice', () => {
  it('inserts entries individually (matches the AS3 original, which does this correctly here)', () => {
    const body = new MusicalBody();
    const a = makeUnit(1, 4);
    const b = makeUnit(1, 4);
    body.splice(0, 0, a, b);
    expect(body.length).toBe(2);
    expect(body.getAt(0)).toBe(a);
    expect(body.getAt(1)).toBe(b);
  });

  it('removes entries and reduces duration', () => {
    const body = new MusicalBody();
    body.push(makeUnit(1, 4), makeUnit(1, 2), makeUnit(1, 4));
    body.splice(1, 1);
    expect(body.length).toBe(2);
    expect(body.duration.toString()).toBe('1/2');
  });
});

describe('MusicalBody array-like read operations', () => {
  it('forEach visits every unit with (unit, index, body)', () => {
    const body = new MusicalBody();
    body.push(makeUnit(1, 4), makeUnit(1, 2));
    const visited: Array<[number, boolean]> = [];
    body.forEach((unit, index, b) => visited.push([index, b === body]));
    expect(visited).toEqual([
      [0, true],
      [1, true],
    ]);
  });

  it('every / some behave like their Array counterparts', () => {
    const body = new MusicalBody();
    body.push(makeUnit(1, 4), makeUnit(1, 4));
    expect(body.every((u) => u.duration.toString() === '1/4')).toBe(true);
    expect(body.some((u) => u.duration.toString() === '1/4')).toBe(true);
  });

  it('reverse reverses in place', () => {
    const body = new MusicalBody();
    const a = makeUnit(1, 4);
    const b = makeUnit(1, 2);
    body.push(a, b);
    body.reverse();
    expect(body.getAt(0)).toBe(b);
  });

  it('indexOf / lastIndexOf locate units by reference', () => {
    const body = new MusicalBody();
    const a = makeUnit(1, 4);
    const b = makeUnit(1, 4);
    body.push(a, b, a);
    expect(body.indexOf(a)).toBe(0);
    expect(body.lastIndexOf(a)).toBe(2);
  });

  it('unshift adds to the front and returns the new length', () => {
    const body = new MusicalBody();
    const a = makeUnit(1, 4);
    const b = makeUnit(1, 2);
    body.push(a);
    const len = body.unshift(b);
    expect(len).toBe(2);
    expect(body.getAt(0)).toBe(b);
  });
});
