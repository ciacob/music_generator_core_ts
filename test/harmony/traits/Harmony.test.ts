import { afterEach, describe, expect, it, vi } from 'vitest';
import { $get } from '../../../src/knowledge/instruments/InstrumentFactory.js';
import { AnalysisContext } from '../../../src/core/AnalysisContext.js';
import { CoreOperationKeys } from '../../../src/core/constants/CoreOperationKeys.js';
import { CoreParameterNames } from '../../../src/core/constants/CoreParameterNames.js';
import { Harmony, resetAnalyzerCacheForTesting } from '../../../src/harmony/traits/Harmony.js';
import { MusicUnit } from '../../../src/core/MusicUnit.js';
import { Parameter } from '../../../src/core/Parameter.js';
import { ParameterNames } from '../../../src/harmony/constants/ParameterNames.js';
import { ParametersList } from '../../../src/core/ParametersList.js';
import { SettingsList } from '../../../src/core/SettingsList.js';
import type { IMusicRequest } from '../../../src/core/interfaces/IMusicRequest.js';
import type { IMusicUnit } from '../../../src/core/interfaces/IMusicUnit.js';
import type { IMusicalInstrument } from '../../../src/knowledge/instruments/IMusicalInstrument.js';
import type { IParametersList } from '../../../src/core/interfaces/IParametersList.js';
import type { ISettingsList } from '../../../src/core/interfaces/ISettingsList.js';

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

interface FixtureOptions {
  lowestPitchPercent?: number;
  highestPitchPercent?: number;
  voicesNumberPercent?: number;
  intrinsicConsonance?: number;
  enforceConsonance?: 0 | 1;
  useMelodicModel?: 0 | 1;
  voiceRestlessness?: number;
  analysisWindowAt1?: number;
  analysisWindowAt?: [number, number]; // [timeSlot, value] -- an additional recorded point
  heterogeneityAt1?: number;
  heterogeneityAt?: [number, number];
  errorMarginAt1?: number;
  errorMarginAt?: [number, number];
  hazardPercent?: number;
  // "Expected value" targets the isValidChord check compares each analyzer's score against.
  meoldicTarget?: number;
  chordProgressionTarget?: number;
  harmonicDistributionTarget?: number;
  voiceCohesionTarget?: number;
}

function buildFixture(instruments: IMusicalInstrument[], options: FixtureOptions = {}): { parametersList: IParametersList; request: IMusicRequest } {
  const parametersList = new ParametersList();
  const settings: ISettingsList = new SettingsList();

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

  function addBooleanParam(name: string, value: 0 | 1): void {
    const p = new Parameter();
    p.type = CoreOperationKeys.TYPE_BOOLEAN;
    p.isTweenable = false;
    p.name = name;
    parametersList.push(p);
    settings.setValueAt(p, 1, value);
  }

  function addIntParam(name: string, value: number): void {
    const p = new Parameter();
    p.type = CoreOperationKeys.TYPE_INT;
    p.isTweenable = false;
    p.name = name;
    parametersList.push(p);
    settings.setValueAt(p, 1, value);
  }

  // RandomChord's own settings.
  addPercentParam(ParameterNames.LOWEST_PITCH, options.lowestPitchPercent ?? 1);
  addPercentParam(ParameterNames.HIGHEST_PITCH, options.highestPitchPercent ?? 100);
  addPercentParam(ParameterNames.VOICES_NUMBER, options.voicesNumberPercent ?? 60);
  addPercentParam(ParameterNames.INTRINSIC_CONSONANCE, options.intrinsicConsonance ?? 50);
  addBooleanParam(ParameterNames.ENFORCE_CONSONANCE, options.enforceConsonance ?? 0);

  // Individual analyzers' own settings.
  addBooleanParam(ParameterNames.USE_MELODIC_MODEL, options.useMelodicModel ?? 0);
  addIntParam(ParameterNames.VOICE_RESTLESSNESS, options.voiceRestlessness ?? 1);

  // The 5 analyzers' own score names, doubling as "expected value" targets for Harmony's own
  // isValidChord check.
  addPercentParam(ParameterNames.MELODIC_DIRECTION_BALANCE, options.meoldicTarget ?? 50);
  addPercentParam(ParameterNames.CHORD_PROGRESSION, options.chordProgressionTarget ?? 1);
  addPercentParam(ParameterNames.HARMONIC_DISTRIBUTION, options.harmonicDistributionTarget ?? 1);
  addPercentParam(ParameterNames.VOICE_COHESION, options.voiceCohesionTarget ?? 50);

  // Harmony's own settings.
  addPercentParam(CoreParameterNames.ANALYSIS_WINDOW, options.analysisWindowAt1 ?? 5, options.analysisWindowAt);
  addPercentParam(CoreParameterNames.HETEROGENEITY, options.heterogeneityAt1 ?? 2, options.heterogeneityAt);
  addPercentParam(CoreParameterNames.ERROR_MARGIN, options.errorMarginAt1 ?? 50, options.errorMarginAt);
  addPercentParam(CoreParameterNames.HAZARD, options.hazardPercent ?? 100);

  const request = { instruments, userSettings: settings } as IMusicRequest;
  return { parametersList, request };
}

afterEach(() => {
  resetAnalyzerCacheForTesting();
  vi.restoreAllMocks();
});

describe('Harmony', () => {
  it('generates a chord and transfers pitches, allocations, and analysis scores onto targetMusicUnit', () => {
    const piano = $get('Piano', 0) as IMusicalInstrument;
    const { parametersList, request } = buildFixture([piano]);
    const target = new MusicUnit();
    const context = new AnalysisContext();
    context.previousContent = [];
    context.percentTime = 0.5;

    new Harmony(seededRandom(1)).execute(target, context, parametersList, request);

    expect(target.pitches.length).toBeGreaterThan(0);
    expect(target.pitchAllocations.length).toBe(target.pitches.length);
    expect(target.analysisScores.isEmpty()).toBe(false);
  });

  it('is deterministic given the same injected randomFn seed', () => {
    const piano = $get('Piano', 0) as IMusicalInstrument;
    const fixtureA = buildFixture([piano]);
    const fixtureB = buildFixture([piano]);
    const contextA = new AnalysisContext();
    contextA.percentTime = 0.5;
    const contextB = new AnalysisContext();
    contextB.percentTime = 0.5;

    const targetA = new MusicUnit();
    new Harmony(seededRandom(42)).execute(targetA, contextA, fixtureA.parametersList, fixtureA.request);
    resetAnalyzerCacheForTesting();
    const targetB = new MusicUnit();
    new Harmony(seededRandom(42)).execute(targetB, contextB, fixtureB.parametersList, fixtureB.request);

    expect(targetA.pitches.map((p) => p.midiNote)).toEqual(targetB.pitches.map((p) => p.midiNote));
  });

  describe('percentTime/timeSlot bug fix regression guard', () => {
    it('reads winSize/heterogeneity/errorMargin from the correctly-converted timeSlot, not the raw percentTime', () => {
      const piano = $get('Piano', 0) as IMusicalInstrument;
      const { parametersList, request } = buildFixture([piano], {
        analysisWindowAt1: 2,
        analysisWindowAt: [50, 20],
        heterogeneityAt1: 2,
        heterogeneityAt: [50, 5],
        errorMarginAt1: 5,
        errorMarginAt: [50, 40],
      });

      const getValueAtSpy = vi.spyOn(request.userSettings, 'getValueAt');

      const target = new MusicUnit();
      const context = new AnalysisContext();
      context.percentTime = 0.5; // -> timeSlot 50

      new Harmony(seededRandom(7)).execute(target, context, parametersList, request);

      const timeSlotsQueriedFor = (paramName: string): unknown[] =>
        getValueAtSpy.mock.calls.filter((call) => (call[0] as { name: string }).name === paramName).map((call) => call[1]);

      // With the bug, these would always have been called with 0.5 (the raw percentTime)
      // directly -- never the correct integer timeSlot 50 -- causing getValueAt's internal
      // search to fail (see file header). With the fix, every call for these three
      // parameters must use timeSlot 50.
      for (const paramName of [CoreParameterNames.ANALYSIS_WINDOW, CoreParameterNames.HETEROGENEITY, CoreParameterNames.ERROR_MARGIN]) {
        const slots = timeSlotsQueriedFor(paramName);
        expect(slots.length).toBeGreaterThan(0);
        for (const slot of slots) {
          expect(slot).toBe(50);
        }
      }
    });

    it('resolves a DIFFERENT timeSlot for a different percentTime, proving the value is genuinely consumed', () => {
      const piano = $get('Piano', 0) as IMusicalInstrument;
      const { parametersList, request } = buildFixture([piano], {
        analysisWindowAt1: 2,
        analysisWindowAt: [50, 20],
      });

      const getValueAtSpy = vi.spyOn(request.userSettings, 'getValueAt');
      const target = new MusicUnit();
      const context = new AnalysisContext();
      context.percentTime = 0.01; // -> timeSlot 1

      new Harmony(seededRandom(7)).execute(target, context, parametersList, request);

      const windowSlots = getValueAtSpy.mock.calls
        .filter((call) => (call[0] as { name: string }).name === CoreParameterNames.ANALYSIS_WINDOW)
        .map((call) => call[1]);
      expect(windowSlots.length).toBeGreaterThan(0);
      for (const slot of windowSlots) {
        expect(slot).toBe(1);
      }
    });
  });

  describe('threshold adaptation', () => {
    it('adjusts analyzer thresholds and retries when no chord passes within the initial budget', () => {
      const piano = $get('Piano', 0) as IMusicalInstrument;
      // An impossible target (VOICE_COHESION target of 1, when VoiceCohesion always bypasses to
      // 50 for a fresh/empty previousContent) combined with a tiny error margin forces the
      // initial budget to be exhausted with zero accepted chords, triggering the
      // "adjust threshold and try again" branch. A very small analysisWindow*heterogeneity
      // keeps the test fast.
      const { parametersList, request } = buildFixture([piano], {
        analysisWindowAt1: 1,
        heterogeneityAt1: 1,
        errorMarginAt1: 1,
        voiceCohesionTarget: 1,
      });

      const target = new MusicUnit();
      const context = new AnalysisContext();
      context.percentTime = 0.01;

      // Should not hang or throw -- the threshold-adaptation loop must eventually terminate
      // (thresholds are capped at 100, at which point every chord passes).
      expect(() => new Harmony(seededRandom(3)).execute(target, context, parametersList, request)).not.toThrow();
      expect(target.pitches.length).toBeGreaterThan(0);
    });
  });

  describe('musicalPostProcessors', () => {
    it('returns an empty array (not null)', () => {
      expect(new Harmony().musicalPostProcessors).toEqual([]);
    });
  });
});
