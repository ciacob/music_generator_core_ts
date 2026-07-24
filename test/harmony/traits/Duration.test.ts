import { afterEach, describe, expect, it, vi } from 'vitest';
import { AnalysisContext } from '../../../src/core/AnalysisContext.js';
import { CoreOperationKeys } from '../../../src/core/constants/CoreOperationKeys.js';
import { CoreParameterNames } from '../../../src/core/constants/CoreParameterNames.js';
import { Duration, resetAnalyzerCacheForTesting } from '../../../src/harmony/traits/Duration.js';
import { DurationsReducerProcessor } from '../../../src/harmony/processors/DurationsReducerProcessor.js';
import { MusicUnit } from '../../../src/core/MusicUnit.js';
import { Parameter } from '../../../src/core/Parameter.js';
import { ParameterNames } from '../../../src/harmony/constants/ParameterNames.js';
import { ParametersList } from '../../../src/core/ParametersList.js';
import { RawDuration } from '../../../src/harmony/sources/RawDuration.js';
import { SettingsList } from '../../../src/core/SettingsList.js';
import { TimeSignatureEntry } from '../../../src/knowledge/timesignature/TimeSignatureEntry.js';
import { TimeSignatureMap } from '../../../src/knowledge/timesignature/TimeSignatureMap.js';
import * as TimeSignatureFactory from '../../../src/knowledge/timesignature/TimeSignatureFactory.js';
import type { IMusicRequest } from '../../../src/core/interfaces/IMusicRequest.js';
import type { IParametersList } from '../../../src/core/interfaces/IParametersList.js';
import type { ITimeSignatureMap } from '../../../src/knowledge/timesignature/ITimeSignatureMap.js';

/** Small, deterministic PRNG (mulberry32). */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildTimeMap(...measures: Array<[number, number, number]>): ITimeSignatureMap {
  const map = new TimeSignatureMap();
  for (const [num, den, reps] of measures) {
    const entry = new TimeSignatureEntry();
    entry.signature = TimeSignatureFactory.$get(num, den);
    entry.repetitions = reps;
    map.push(entry);
  }
  return map;
}

interface FixtureOptions {
  durationsPercent?: number;
  analysisWindowAt1?: number;
  analysisWindowAt?: [number, number];
  heterogeneityAt1?: number;
  heterogeneityAt?: [number, number];
  hazardPercent?: number;
}

function buildFixture(timeMap: ITimeSignatureMap, options: FixtureOptions = {}): { parametersList: IParametersList; request: IMusicRequest } {
  const parametersList = new ParametersList();
  const settings = new SettingsList();

  function addPercentParam(name: string, valueAt1: number, extra?: [number, number]): void {
    const p = new Parameter();
    p.type = CoreOperationKeys.TYPE_ARRAY;
    p.isTweenable = true;
    p.name = name;
    parametersList.push(p);
    settings.setValueAt(p, 1, valueAt1);
    if (extra) {
      settings.setValueAt(p, extra[0], extra[1]);
    }
  }

  addPercentParam(ParameterNames.DURATIONS, options.durationsPercent ?? 50);
  addPercentParam(CoreParameterNames.ANALYSIS_WINDOW, options.analysisWindowAt1 ?? 2, options.analysisWindowAt);
  addPercentParam(CoreParameterNames.HETEROGENEITY, options.heterogeneityAt1 ?? 2, options.heterogeneityAt);
  addPercentParam(CoreParameterNames.HAZARD, options.hazardPercent ?? 100);

  const request = { timeMap, instruments: [], userSettings: settings } as IMusicRequest;
  return { parametersList, request };
}

afterEach(() => {
  resetAnalyzerCacheForTesting();
  vi.restoreAllMocks();
});

describe('Duration', () => {
  it('assigns a duration and transfers analysis scores onto targetMusicUnit', () => {
    const timeMap = buildTimeMap([4, 4, 4]);
    const { parametersList, request } = buildFixture(timeMap);
    const target = new MusicUnit();
    const context = new AnalysisContext();
    context.percentTime = 0.5;

    new Duration(seededRandom(1)).execute(target, context, parametersList, request);

    expect(target.duration).toBeDefined();
    expect(target.analysisScores.isEmpty()).toBe(false);
    expect(target.analysisScores.getValueFor(ParameterNames.METRIC_PLACEMENT)).toBeGreaterThanOrEqual(0);
  });

  it('is deterministic given the same injected randomFn seed', () => {
    const timeMap = buildTimeMap([4, 4, 4]);
    const fixtureA = buildFixture(timeMap);
    const fixtureB = buildFixture(timeMap);
    const contextA = new AnalysisContext();
    contextA.percentTime = 0.3;
    const contextB = new AnalysisContext();
    contextB.percentTime = 0.3;

    const targetA = new MusicUnit();
    new Duration(seededRandom(99)).execute(targetA, contextA, fixtureA.parametersList, fixtureA.request);
    resetAnalyzerCacheForTesting();
    const targetB = new MusicUnit();
    new Duration(seededRandom(99)).execute(targetB, contextB, fixtureB.parametersList, fixtureB.request);

    expect(targetA.duration.equals(targetB.duration)).toBe(true);
  });

  describe('percentTime/timeSlot bug fix regression guard', () => {
    it('reads winSize/heterogeneity from the correctly-converted timeSlot, not the raw percentTime', () => {
      const timeMap = buildTimeMap([4, 4, 4]);
      const { parametersList, request } = buildFixture(timeMap, {
        analysisWindowAt1: 2,
        analysisWindowAt: [50, 20],
        heterogeneityAt1: 2,
        heterogeneityAt: [50, 5],
      });

      const getValueAtSpy = vi.spyOn(request.userSettings, 'getValueAt');
      const target = new MusicUnit();
      const context = new AnalysisContext();
      context.percentTime = 0.5; // -> timeSlot 50

      new Duration(seededRandom(7)).execute(target, context, parametersList, request);

      const timeSlotsQueriedFor = (paramName: string): unknown[] =>
        getValueAtSpy.mock.calls.filter((call) => (call[0] as { name: string }).name === paramName).map((call) => call[1]);

      for (const paramName of [CoreParameterNames.ANALYSIS_WINDOW, CoreParameterNames.HETEROGENEITY]) {
        const slots = timeSlotsQueriedFor(paramName);
        expect(slots.length).toBeGreaterThan(0);
        for (const slot of slots) {
          expect(slot).toBe(50);
        }
      }
    });

    it('resolves a DIFFERENT timeSlot for a different percentTime, and produces a correspondingly different candidate count', () => {
      const timeMap = buildTimeMap([4, 4, 4]);
      const { parametersList, request } = buildFixture(timeMap, {
        analysisWindowAt1: 2,
        analysisWindowAt: [50, 20],
        heterogeneityAt1: 2,
        heterogeneityAt: [50, 5],
      });

      // No threshold/validation logic in Duration (unlike Harmony), so numCandidates is
      // directly observable via how many times RawDuration.output is called.
      const outputSpy = vi.spyOn(RawDuration.prototype, 'output');

      const targetLow = new MusicUnit();
      const contextLow = new AnalysisContext();
      contextLow.percentTime = 0.01; // -> timeSlot 1: winSize=2, heterogeneity=2 -> max(5, 4) = 5
      new Duration(seededRandom(7)).execute(targetLow, contextLow, parametersList, request);
      expect(outputSpy).toHaveBeenCalledTimes(5);

      outputSpy.mockClear();
      resetAnalyzerCacheForTesting();

      const targetHigh = new MusicUnit();
      const contextHigh = new AnalysisContext();
      contextHigh.percentTime = 0.5; // -> timeSlot 50: winSize=20, heterogeneity=5 -> max(5, 100) = 100
      new Duration(seededRandom(7)).execute(targetHigh, contextHigh, parametersList, request);
      expect(outputSpy).toHaveBeenCalledTimes(100);
    });
  });

  describe('musicalPostProcessors', () => {
    it('returns an array containing exactly one DurationsReducerProcessor', () => {
      const processors = new Duration().musicalPostProcessors;
      expect(processors).toHaveLength(1);
      expect(processors[0]).toBeInstanceOf(DurationsReducerProcessor);
    });
  });

  describe('MIN_NUM_CANDIDATES floor', () => {
    it('never generates fewer than 5 candidates even when winSize*heterogeneity is small', () => {
      const timeMap = buildTimeMap([4, 4, 4]);
      const { parametersList, request } = buildFixture(timeMap, { analysisWindowAt1: 1, heterogeneityAt1: 1 });

      const outputSpy = vi.spyOn(RawDuration.prototype, 'output');
      const target = new MusicUnit();
      const context = new AnalysisContext();
      context.percentTime = 0.01;

      new Duration(seededRandom(5)).execute(target, context, parametersList, request);

      // winSize=1, heterogeneity=1 -> raw product=1, but MIN_NUM_CANDIDATES=5 floors it.
      expect(outputSpy).toHaveBeenCalledTimes(5);
      expect(target.duration).toBeDefined();
    });
  });
});
