import { describe, expect, it } from 'vitest';
import { AnalysisScores } from '../../src/core/AnalysisScores.js';

describe('AnalysisScores basics', () => {
  it('starts empty', () => {
    const scores = new AnalysisScores();
    expect(scores.isEmpty()).toBe(true);
  });

  it('add/getValueFor round-trips a value', () => {
    const scores = new AnalysisScores();
    scores.add('consonance', 75);
    expect(scores.getValueFor('consonance')).toBe(75);
    expect(scores.isEmpty()).toBe(false);
  });

  it('add overwrites a value for the same criteria', () => {
    const scores = new AnalysisScores();
    scores.add('consonance', 50);
    scores.add('consonance', 80);
    expect(scores.getValueFor('consonance')).toBe(80);
  });

  it('getValueFor returns NaN for an unrecorded criteria', () => {
    expect(new AnalysisScores().getValueFor('missing')).toBeNaN();
  });

  it('remove deletes a recorded criteria', () => {
    const scores = new AnalysisScores();
    scores.add('consonance', 75);
    scores.remove('consonance');
    expect(scores.getValueFor('consonance')).toBeNaN();
    expect(scores.isEmpty()).toBe(true);
  });

  it('empty() clears all entries', () => {
    const scores = new AnalysisScores();
    scores.add('a', 1);
    scores.add('b', 2);
    scores.empty();
    expect(scores.isEmpty()).toBe(true);
  });
});

describe('AnalysisScores value clamping', () => {
  it('clamps a too-large value to 100', () => {
    const scores = new AnalysisScores();
    scores.add('consonance', 150);
    expect(scores.getValueFor('consonance')).toBe(100);
  });

  it('clamps a too-small (negative) value to 0', () => {
    const scores = new AnalysisScores();
    scores.add('consonance', -10);
    expect(scores.getValueFor('consonance')).toBe(0);
  });
});

describe('AnalysisScores.forEach', () => {
  it('iterates entries in insertion order', () => {
    const scores = new AnalysisScores();
    scores.add('first', 1);
    scores.add('second', 2);
    const visited: Array<[string, number]> = [];
    scores.forEach((criteria, value) => {
      visited.push([criteria, value]);
    });
    expect(visited).toEqual([
      ['first', 1],
      ['second', 2],
    ]);
  });

  it('stops early when the iterator returns false', () => {
    const scores = new AnalysisScores();
    scores.add('first', 1);
    scores.add('second', 2);
    scores.add('third', 3);
    const visited: string[] = [];
    scores.forEach((criteria) => {
      visited.push(criteria);
      return criteria !== 'second';
    });
    expect(visited).toEqual(['first', 'second']);
  });
});

describe('AnalysisScores validation', () => {
  it('throws for an empty-string criteria', () => {
    expect(() => new AnalysisScores().add('', 50)).toThrow();
  });

  it('throws for a whitespace-only criteria', () => {
    expect(() => new AnalysisScores().add('   ', 50)).toThrow();
  });

  it('throws for a criteria with leading whitespace', () => {
    expect(() => new AnalysisScores().add(' consonance', 50)).toThrow();
  });

  it('throws for a criteria with trailing whitespace', () => {
    expect(() => new AnalysisScores().add('consonance ', 50)).toThrow();
  });

  it('throws for a NaN value', () => {
    expect(() => new AnalysisScores().add('consonance', NaN)).toThrow();
  });
});
