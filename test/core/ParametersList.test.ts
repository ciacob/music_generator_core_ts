import { describe, expect, it, vi } from 'vitest';
import { Parameter } from '../../src/core/Parameter.js';
import { ParametersList } from '../../src/core/ParametersList.js';

function makeParameter(name: string, uid: string): Parameter {
  const parameter = new Parameter();
  parameter.name = name;
  parameter.uid = uid;
  return parameter;
}

describe('ParametersList basics', () => {
  it('starts empty', () => {
    expect(new ParametersList().length).toBe(0);
  });

  it('push adds parameters and returns the new length', () => {
    const list = new ParametersList();
    const len = list.push(makeParameter('Hazard', 'p1'), makeParameter('Heterogeneity', 'p2'));
    expect(len).toBe(2);
    expect(list.length).toBe(2);
  });

  it('getAt retrieves by index', () => {
    const list = new ParametersList();
    const p = makeParameter('Hazard', 'p1');
    list.push(p);
    expect(list.getAt(0)).toBe(p);
  });

  it('empty() removes all parameters', () => {
    const list = new ParametersList();
    list.push(makeParameter('Hazard', 'p1'));
    list.empty();
    expect(list.length).toBe(0);
  });
});

describe('ParametersList.getByName / getByUid', () => {
  it('getByName returns all matches in insertion order', () => {
    const list = new ParametersList();
    const a = makeParameter('Hazard', 'p1');
    const b = makeParameter('Hazard', 'p2');
    const c = makeParameter('Heterogeneity', 'p3');
    list.push(a, b, c);
    expect(list.getByName('Hazard')).toEqual([a, b]);
  });

  it('getByUid returns the matching parameter', () => {
    const list = new ParametersList();
    const p = makeParameter('Hazard', 'p1');
    list.push(p);
    expect(list.getByUid('p1')).toBe(p);
  });

  it('getByUid returns null (and logs) when no match is found', () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const list = new ParametersList();
    expect(list.getByUid('missing')).toBeNull();
    expect(debugSpy).toHaveBeenCalled();
    debugSpy.mockRestore();
  });
});

describe('ParametersList.splice (verifying the array-vs-spread bug fix)', () => {
  it('inserts entries individually, not as a single nested array', () => {
    const list = new ParametersList();
    const a = makeParameter('Hazard', 'p1');
    const b = makeParameter('Heterogeneity', 'p2');
    list.splice(0, 0, a, b);
    expect(list.length).toBe(2);
    expect(list.getAt(0)).toBe(a);
    expect(list.getAt(1)).toBe(b);
  });

  it('removes entries when given a positive deleteCount', () => {
    const list = new ParametersList();
    list.push(makeParameter('A', 'p1'), makeParameter('B', 'p2'), makeParameter('C', 'p3'));
    list.splice(1, 1);
    expect(list.length).toBe(2);
    expect(list.getByName('B')).toEqual([]);
  });
});

describe('ParametersList array-like operations', () => {
  it('indexOf / lastIndexOf locate parameters by reference', () => {
    const list = new ParametersList();
    const a = makeParameter('A', 'p1');
    const b = makeParameter('B', 'p2');
    list.push(a, b, a);
    expect(list.indexOf(a)).toBe(0);
    expect(list.lastIndexOf(a)).toBe(2);
  });

  it('forEach visits every parameter with (parameter, index, list)', () => {
    const list = new ParametersList();
    list.push(makeParameter('A', 'p1'), makeParameter('B', 'p2'));
    const visited: Array<[string, boolean]> = [];
    list.forEach((p, i, l) => visited.push([p.name, l === list]));
    expect(visited).toEqual([
      ['A', true],
      ['B', true],
    ]);
  });

  it('every / some behave like their Array counterparts', () => {
    const list = new ParametersList();
    list.push(makeParameter('A', 'p1'), makeParameter('B', 'p2'));
    expect(list.every((p) => p.name.length === 1)).toBe(true);
    expect(list.some((p) => p.name === 'B')).toBe(true);
  });

  it('reverse reverses in place', () => {
    const list = new ParametersList();
    const a = makeParameter('A', 'p1');
    const b = makeParameter('B', 'p2');
    list.push(a, b);
    list.reverse();
    expect(list.getAt(0)).toBe(b);
  });

  it('pop / shift / unshift behave as expected', () => {
    const list = new ParametersList();
    const a = makeParameter('A', 'p1');
    const b = makeParameter('B', 'p2');
    list.push(a, b);
    expect(list.pop()).toBe(b);
    expect(list.length).toBe(1);
    list.unshift(b);
    expect(list.getAt(0)).toBe(b);
    expect(list.shift()).toBe(b);
  });

  it('removeAt removes and returns the parameter', () => {
    const list = new ParametersList();
    const a = makeParameter('A', 'p1');
    list.push(a);
    expect(list.removeAt(0)).toBe(a);
    expect(list.length).toBe(0);
  });
});
