import { describe, expect, it } from 'vitest';
import { Fraction } from '../../../src/math/Fraction.js';
import type { IAnalysisContext } from '../../../src/core/interfaces/IAnalysisContext.js';
import type { AnalysisScoresIterator, IAnalysisScores } from '../../../src/core/interfaces/IAnalysisScores.js';
import type {
  GenerationCallback,
  IGeneratorModule,
} from '../../../src/core/interfaces/IGeneratorModule.js';
import type { IMusicRequest } from '../../../src/core/interfaces/IMusicRequest.js';
import type { IMusicUnit } from '../../../src/core/interfaces/IMusicUnit.js';
import type { IMusicalBody, MusicalBodyCallback } from '../../../src/core/interfaces/IMusicalBody.js';
import type { IParameter } from '../../../src/core/interfaces/IParameter.js';
import type { IParametersList } from '../../../src/core/interfaces/IParametersList.js';

/**
 * These tests don't exercise behavior (there is none — these are pure
 * type contracts). Instead, each one builds a minimal, literal object
 * satisfying an interface, which only compiles if that interface (and
 * everything it transitively references) is actually well-formed and
 * implementable. This is the meaningful form of "coverage" available for
 * a batch of pure interfaces, and it catches the kind of mistake that
 * matters here: a typo'd property name, a signature that doesn't line up
 * with what a caller would need, or a circular/contradictory type.
 */

describe('IMusicUnit is implementable', () => {
  it('accepts a minimal literal object satisfying the full interface', () => {
    const unit: IMusicUnit = {
      uid: 'unit-1',
      duration: new Fraction(1, 4),
      tupletRootUid: '',
      tupletDefinition: {
        tupletBeatsNumber: 3,
        tupletBeatDuration: new Fraction(1, 8),
        regularBeatsNumber: 2,
        regularBeatDuration: new Fraction(1, 8),
      },
      pitches: [{ midiNote: 60, tieNext: false, toString: () => '60' }],
      pitchAllocations: [],
      performanceInstructions: [],
      analysisScores: makeEmptyAnalysisScores(),
      clone(): IMusicUnit {
        return { ...unit };
      },
    };

    expect(unit.duration.toString()).toBe('1/4');
    expect(unit.pitches[0]?.midiNote).toBe(60);
    expect(unit.clone().uid).toBe('unit-1');
  });
});

describe('IMusicalBody is implementable (array-like)', () => {
  it('accepts a minimal array-backed implementation', () => {
    const body = makeMinimalBody();
    const unit: IMusicUnit = makeMinimalUnit('u1');
    body.push(unit);
    expect(body.length).toBe(1);
    expect(body.getAt(0)).toBe(unit);
    expect(body.duration.toString()).toBe('1/4');
  });
});

describe('IParametersList / IParameter are implementable', () => {
  it('accepts a minimal parameter and a list containing it', () => {
    const parameter: IParameter = {
      uid: 'p1',
      type: 1,
      name: 'hazard',
      payload: 0.5,
      minValue: 0,
      maxValue: 1,
      isTweenable: true,
      isOptional: false,
      isContextual: false,
      description: 'Controls randomness',
      documentationUrl: '',
      color: 0xffffff,
      icon: undefined,
    };

    const params: IParameter[] = [parameter];
    const list: IParametersList = {
      get length() {
        return params.length;
      },
      every: (cb) => params.every((p, i) => cb(p, i, list)),
      forEach: (cb) => params.forEach((p, i) => cb(p, i, list)),
      getAt: (index) => params[index] as IParameter,
      getByName: (name) => params.filter((p) => p.name === name),
      getByUid: (uid) => params.find((p) => p.uid === uid) ?? null,
      indexOf: (search, fromIndex = 0) => params.indexOf(search, fromIndex),
      insertAt: (index, p) => {
        params.splice(index, 0, p);
      },
      lastIndexOf: (search, fromIndex = 0x7fffffff) => params.lastIndexOf(search, fromIndex),
      pop: () => params.pop(),
      push: (...p) => params.push(...p),
      removeAt: (index) => params.splice(index, 1)[0] as IParameter,
      reverse: () => params.reverse(),
      shift: () => params.shift(),
      some: (cb) => params.some((p, i) => cb(p, i, list)),
      sort: (compareFn) => params.sort(compareFn),
      splice: (startIndex, deleteCount, ...p) => {
        params.splice(startIndex, deleteCount ?? params.length, ...p);
      },
      toString: () => params.toString(),
      unshift: (...p) => params.unshift(...p),
    };

    expect(list.length).toBe(1);
    expect(list.getByUid('p1')).toBe(parameter);
    expect(list.getByUid('missing')).toBeNull();
  });
});

describe('IGeneratorModule is implementable, including its write-only callback', () => {
  it('accepts a minimal implementation and allows setting (but not reading) callback', async () => {
    let receivedPercent = -1;

    class MinimalGenerator implements IGeneratorModule {
      private notifyFn: GenerationCallback | undefined;

      async generate(_request: IMusicRequest): Promise<void> {
        this.notifyFn?.({ state: 'in progress', percentComplete: 1, error: null });
      }
      abort(): void {
        /* no-op */
      }
      set callback(value: GenerationCallback) {
        this.notifyFn = value;
      }
      get lastResult(): IMusicalBody {
        return makeMinimalBody();
      }
      get moduleUid(): string {
        return 'minimal-generator';
      }
      get instanceUid(): string {
        return 'instance-1';
      }
      get info(): Record<string, unknown> {
        return { moduleUid: this.moduleUid };
      }
      get parametersList(): IParametersList {
        throw new Error('not needed for this test');
      }
      get musicalTraits() {
        return [];
      }
    }

    const generator = new MinimalGenerator();
    generator.callback = (status) => {
      receivedPercent = status.percentComplete;
    };
    await generator.generate({} as IMusicRequest);

    expect(receivedPercent).toBe(1);
    expect(generator.moduleUid).toBe('minimal-generator');
  });
});

describe('IAnalysisContext / IAnalysisScores are implementable', () => {
  it('accepts a minimal analysis context referencing music units', () => {
    const context: IAnalysisContext = {
      previousContent: [makeMinimalUnit('prev-1')],
      proposedContent: [60, 64, 67],
      percentTime: 42,
    };

    expect(context.previousContent).toHaveLength(1);
    expect(context.percentTime).toBe(42);
  });

  it('accepts a minimal analysis scores implementation, including early-stopping forEach', () => {
    const scores = makeEmptyAnalysisScores();
    scores.add('consonance', 5);
    scores.add('voiceLeading', 3);
    expect(scores.isEmpty()).toBe(false);
    expect(scores.getValueFor('consonance')).toBe(5);

    const visited: string[] = [];
    const iterator: AnalysisScoresIterator = (criteria) => {
      visited.push(criteria);
      return false; // stop after first entry
    };
    scores.forEach(iterator);
    expect(visited).toHaveLength(1);

    scores.remove('consonance');
    expect(scores.getValueFor('consonance')).toBeNaN();
    scores.empty();
    expect(scores.isEmpty()).toBe(true);
  });
});

// --- Shared minimal-implementation helpers for the tests above ---

function makeMinimalUnit(uid: string): IMusicUnit {
  const unit: IMusicUnit = {
    uid,
    duration: new Fraction(1, 4),
    tupletRootUid: '',
    tupletDefinition: {
      tupletBeatsNumber: 0,
      tupletBeatDuration: new Fraction(0, 1),
      regularBeatsNumber: 0,
      regularBeatDuration: new Fraction(0, 1),
    },
    pitches: [],
    pitchAllocations: [],
    performanceInstructions: [],
    analysisScores: makeEmptyAnalysisScores(),
    clone(): IMusicUnit {
      return { ...unit };
    },
  };
  return unit;
}

function makeMinimalBody(): IMusicalBody {
  const units: IMusicUnit[] = [];
  const body: IMusicalBody = {
    get duration() {
      return units.reduce((sum, u) => sum.add(u.duration), new Fraction(0, 1));
    },
    updateDuration() {},
    get length() {
      return units.length;
    },
    set length(value: number) {
      units.length = value;
    },
    every: (cb: MusicalBodyCallback<boolean>) => units.every((u, i) => cb(u, i, body)),
    forEach: (cb: MusicalBodyCallback<void>) => units.forEach((u, i) => cb(u, i, body)),
    getAt: (index) => units[index] as IMusicUnit,
    indexOf: (search, fromIndex = 0) => units.indexOf(search, fromIndex),
    insertAt: (index, unit) => {
      units.splice(index, 0, unit);
    },
    lastIndexOf: (search, fromIndex = 0x7fffffff) => units.lastIndexOf(search, fromIndex),
    pop: () => units.pop(),
    push: (...newUnits) => units.push(...newUnits),
    removeAt: (index) => units.splice(index, 1)[0] as IMusicUnit,
    reverse: () => units.reverse(),
    shift: () => units.shift(),
    some: (cb: MusicalBodyCallback<boolean>) => units.some((u, i) => cb(u, i, body)),
    sort: (compareFn) => units.sort(compareFn),
    splice: (startIndex, deleteCount, ...newUnits) => {
      units.splice(startIndex, deleteCount ?? units.length, ...newUnits);
    },
    toString: () => units.toString(),
    unshift: (...newUnits) => units.unshift(...newUnits),
  };
  return body;
}

function makeEmptyAnalysisScores(): IAnalysisScores {
  const entries = new Map<string, number>();
  return {
    add(criteria, value) {
      entries.set(criteria, value);
    },
    getValueFor(criteria) {
      return entries.has(criteria) ? (entries.get(criteria) as number) : NaN;
    },
    remove(criteria) {
      entries.delete(criteria);
    },
    forEach(iterator) {
      for (const [criteria, value] of entries) {
        if (iterator(criteria, value) === false) {
          break;
        }
      }
    },
    empty() {
      entries.clear();
    },
    isEmpty() {
      return entries.size === 0;
    },
  };
}
