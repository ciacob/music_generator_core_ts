import { describe, expect, it } from 'vitest';
import { $get } from '../../../src/knowledge/instruments/InstrumentFactory.js';
import { CoreOperationKeys } from '../../../src/core/constants/CoreOperationKeys.js';
import { MusicUnit } from '../../../src/core/MusicUnit.js';
import { Parameter } from '../../../src/core/Parameter.js';
import { ParameterNames } from '../../../src/harmony/constants/ParameterNames.js';
import { ParametersList } from '../../../src/core/ParametersList.js';
import { RandomChord } from '../../../src/harmony/sources/RandomChord.js';
import { SettingsList } from '../../../src/core/SettingsList.js';
import type { IAnalysisContext } from '../../../src/core/interfaces/IAnalysisContext.js';
import type { IMusicRequest } from '../../../src/core/interfaces/IMusicRequest.js';
import type { IMusicalInstrument } from '../../../src/knowledge/instruments/IMusicalInstrument.js';
import type { IParametersList } from '../../../src/core/interfaces/IParametersList.js';

/** Small, deterministic PRNG (mulberry32), so tests never depend on `Math.random`. */
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

interface FixtureValues {
  lowestPitchPercent: number;
  highestPitchPercent: number;
  voicesNumberPercent: number;
  intrinsicConsonance: number;
  enforceConsonance: 0 | 1;
}

function buildFixture(
  instruments: IMusicalInstrument[],
  values: FixtureValues,
): { parametersList: IParametersList; request: IMusicRequest } {
  const parametersList = new ParametersList();
  const settings = new SettingsList();

  // TYPE_ARRAY parameters are validated (per SettingsList) as uints in [1, 100] -- exactly the
  // "percent" convention LOWEST_PITCH/HIGHEST_PITCH/VOICES_NUMBER/INTRINSIC_CONSONANCE use here.
  function addPercentParam(name: string, value: number): void {
    const p = new Parameter();
    p.type = CoreOperationKeys.TYPE_ARRAY;
    p.isTweenable = true;
    p.name = name;
    parametersList.push(p);
    settings.setValueAt(p, 1, value);
  }

  // ENFORCE_CONSONANCE is read as a plain 0/1 flag (`=== 1`), which doesn't fit TYPE_ARRAY's
  // [1, 100] range validation -- TYPE_BOOLEAN has no such restriction (SettingsList applies no
  // validation to it, matching the AS3 original's own "TODO: implement when actually needed").
  function addBooleanParam(name: string, value: 0 | 1): void {
    const p = new Parameter();
    p.type = CoreOperationKeys.TYPE_BOOLEAN;
    p.isTweenable = false;
    p.name = name;
    parametersList.push(p);
    settings.setValueAt(p, 1, value);
  }

  addPercentParam(ParameterNames.LOWEST_PITCH, values.lowestPitchPercent);
  addPercentParam(ParameterNames.HIGHEST_PITCH, values.highestPitchPercent);
  addPercentParam(ParameterNames.VOICES_NUMBER, values.voicesNumberPercent);
  addPercentParam(ParameterNames.INTRINSIC_CONSONANCE, values.intrinsicConsonance);
  addBooleanParam(ParameterNames.ENFORCE_CONSONANCE, values.enforceConsonance);

  const request = { instruments, userSettings: settings } as IMusicRequest;
  return { parametersList, request };
}

const context: IAnalysisContext = {
  previousContent: [],
  proposedContent: [],
  percentTime: 0.5,
};

describe('RandomChord', () => {
  it('generates a chord using all available voices for a single instrument', () => {
    const piano = $get('Piano', 0) as IMusicalInstrument;
    const { parametersList, request } = buildFixture([piano], {
      lowestPitchPercent: 1,
      highestPitchPercent: 100,
      voicesNumberPercent: 100,
      intrinsicConsonance: 1,
      enforceConsonance: 0,
    });
    const source = new RandomChord(seededRandom(1));
    const [unit] = source.output(new MusicUnit(), context, parametersList, request);

    expect(unit).toBeDefined();
    expect(unit?.pitches).toHaveLength(piano.maximumAutonomousVoices);
    for (const pitch of unit?.pitches ?? []) {
      expect(pitch.midiNote).toBeGreaterThanOrEqual(piano.midiRange[0] as number);
      expect(pitch.midiNote).toBeLessThanOrEqual(piano.midiRange[1] as number);
    }
    // Every generated pitch must have been allocated to the (only) instrument in play.
    for (const allocation of unit?.pitchAllocations ?? []) {
      expect(allocation.instrument).toBe(piano);
    }
  });

  it('is deterministic given the same injected randomFn seed', () => {
    const piano = $get('Piano', 0) as IMusicalInstrument;
    const values: FixtureValues = {
      lowestPitchPercent: 20,
      highestPitchPercent: 80,
      voicesNumberPercent: 75,
      intrinsicConsonance: 50,
      enforceConsonance: 0,
    };
    const fixtureA = buildFixture([piano], values);
    const fixtureB = buildFixture([piano], values);

    const resultA = new RandomChord(seededRandom(42)).output(
      new MusicUnit(),
      context,
      fixtureA.parametersList,
      fixtureA.request,
    )[0];
    const resultB = new RandomChord(seededRandom(42)).output(
      new MusicUnit(),
      context,
      fixtureB.parametersList,
      fixtureB.request,
    )[0];

    expect(resultA?.pitches.map((p) => p.midiNote)).toEqual(resultB?.pitches.map((p) => p.midiNote));
  });

  it('restricts pitches per-instrument when several instruments are in play', () => {
    const violin = $get('Violin', 0) as IMusicalInstrument;
    const cello = $get('Cello', 0) as IMusicalInstrument;
    const { parametersList, request } = buildFixture([violin, cello], {
      lowestPitchPercent: 1,
      highestPitchPercent: 100,
      voicesNumberPercent: 100,
      intrinsicConsonance: 1,
      enforceConsonance: 0,
    });
    const source = new RandomChord(seededRandom(7));
    const [unit] = source.output(new MusicUnit(), context, parametersList, request);

    expect(unit?.pitchAllocations).toHaveLength(2);
    for (const allocation of unit?.pitchAllocations ?? []) {
      const instrument = allocation.instrument;
      const midiNote = allocation.allocatedPitch.midiNote;
      if (midiNote !== 0) {
        expect(midiNote).toBeGreaterThanOrEqual(instrument.midiRange[0] as number);
        expect(midiNote).toBeLessThanOrEqual(instrument.midiRange[1] as number);
      }
    }
  });

  it('adapts total voice count to the current instrument set after reset()', () => {
    const piano = $get('Piano', 0) as IMusicalInstrument;
    const violin = $get('Violin', 1) as IMusicalInstrument;
    const source = new RandomChord(seededRandom(3));

    const pianoFixture = buildFixture([piano], {
      lowestPitchPercent: 1,
      highestPitchPercent: 100,
      voicesNumberPercent: 100,
      intrinsicConsonance: 1,
      enforceConsonance: 0,
    });
    const [pianoUnit] = source.output(new MusicUnit(), context, pianoFixture.parametersList, pianoFixture.request);
    expect(pianoUnit?.pitches).toHaveLength(piano.maximumAutonomousVoices);

    source.reset();

    const violinFixture = buildFixture([violin], {
      lowestPitchPercent: 1,
      highestPitchPercent: 100,
      voicesNumberPercent: 100,
      intrinsicConsonance: 1,
      enforceConsonance: 0,
    });
    const [violinUnit] = source.output(new MusicUnit(), context, violinFixture.parametersList, violinFixture.request);
    expect(violinUnit?.pitches).toHaveLength(violin.maximumAutonomousVoices);
  });

  it('exercises the enforceConsonance branch (CommonMusicUtils.findSuitablePitch) without throwing', () => {
    const piano = $get('Piano', 0) as IMusicalInstrument;
    const { parametersList, request } = buildFixture([piano], {
      lowestPitchPercent: 1,
      highestPitchPercent: 100,
      voicesNumberPercent: 100,
      intrinsicConsonance: 70,
      enforceConsonance: 1,
    });
    const source = new RandomChord(seededRandom(9));
    const [unit] = source.output(new MusicUnit(), context, parametersList, request);

    expect(unit?.pitches.length).toBeGreaterThan(0);
    for (const pitch of unit?.pitches ?? []) {
      expect(pitch.midiNote).toBeGreaterThanOrEqual(piano.midiRange[0] as number);
      expect(pitch.midiNote).toBeLessThanOrEqual(piano.midiRange[1] as number);
    }
  });
});
