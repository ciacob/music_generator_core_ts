import { describe, expect, it } from 'vitest';
import { CoreOperationKeys } from '../../../src/core/constants/CoreOperationKeys.js';
import { DurationFractions } from '../../../src/generators/constants/duration/DurationFractions.js';
import { MusicUnit } from '../../../src/core/MusicUnit.js';
import { Parameter } from '../../../src/core/Parameter.js';
import { ParameterNames } from '../../../src/harmony/constants/ParameterNames.js';
import { ParametersList } from '../../../src/core/ParametersList.js';
import { RawDuration } from '../../../src/harmony/sources/RawDuration.js';
import { SettingsList } from '../../../src/core/SettingsList.js';
import type { IAnalysisContext } from '../../../src/core/interfaces/IAnalysisContext.js';
import type { IFraction } from '../../../src/math/IFraction.js';
import type { IMusicRequest } from '../../../src/core/interfaces/IMusicRequest.js';
import type { IParametersList } from '../../../src/core/interfaces/IParametersList.js';

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

function buildFixture(durationsPercent: number): { parametersList: IParametersList; request: IMusicRequest } {
  const parametersList = new ParametersList();
  const settings = new SettingsList();

  const durationsParam = new Parameter();
  durationsParam.type = CoreOperationKeys.TYPE_ARRAY;
  durationsParam.isTweenable = true;
  durationsParam.name = ParameterNames.DURATIONS;
  parametersList.push(durationsParam);
  settings.setValueAt(durationsParam, 1, durationsPercent);

  const request = { instruments: [], userSettings: settings } as IMusicRequest;
  return { parametersList, request };
}

const context: IAnalysisContext = {
  previousContent: [],
  proposedContent: [],
  percentTime: 0.5,
};

const ALL_DURATIONS: readonly IFraction[] = [
  DurationFractions.WHOLE,
  DurationFractions.HALF,
  DurationFractions.QUARTER,
  DurationFractions.EIGHT,
  DurationFractions.SIXTEENTH,
];

describe('RawDuration', () => {
  it('outputs exactly one candidate whose duration is one of the five supported fractions', () => {
    const { parametersList, request } = buildFixture(50);
    const source = new RawDuration(seededRandom(1));
    const result = source.output(new MusicUnit(), context, parametersList, request);

    expect(result).toHaveLength(1);
    const selected = result[0]?.duration as IFraction;
    expect(ALL_DURATIONS.some((fraction) => fraction.equals(selected))).toBe(true);
  });

  it('is deterministic given the same injected randomFn seed', () => {
    const fixtureA = buildFixture(30);
    const fixtureB = buildFixture(30);

    const resultA = new RawDuration(seededRandom(99)).output(
      new MusicUnit(),
      context,
      fixtureA.parametersList,
      fixtureA.request,
    )[0];
    const resultB = new RawDuration(seededRandom(99)).output(
      new MusicUnit(),
      context,
      fixtureB.parametersList,
      fixtureB.request,
    )[0];

    expect((resultA?.duration as IFraction).equals(resultB?.duration as IFraction)).toBe(true);
  });

  it('produces a mix of durations across many draws, biased by the DURATIONS parameter', () => {
    const { parametersList, request } = buildFixture(50);
    const source = new RawDuration(seededRandom(123));
    const seen = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const [unit] = source.output(new MusicUnit(), context, parametersList, request);
      seen.add((unit?.duration as IFraction).toString());
    }
    // With a real weighted distribution in play, 50 draws should not all collapse onto a
    // single duration value.
    expect(seen.size).toBeGreaterThan(1);
  });

  it('reset() releases the cached distribution chart without changing observable behavior', () => {
    const { parametersList, request } = buildFixture(50);
    const source = new RawDuration(seededRandom(5));
    const before = source.output(new MusicUnit(), context, parametersList, request);
    source.reset();
    const after = source.output(new MusicUnit(), context, parametersList, request);

    expect(before).toHaveLength(1);
    expect(after).toHaveLength(1);
    expect(ALL_DURATIONS.some((fraction) => fraction.equals(after[0]?.duration as IFraction))).toBe(true);
  });
});
