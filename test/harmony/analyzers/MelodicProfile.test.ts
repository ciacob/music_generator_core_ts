import { describe, expect, it } from 'vitest';
import { CoreOperationKeys } from '../../../src/core/constants/CoreOperationKeys.js';
import { Fraction } from '../../../src/math/Fraction.js';
import { MelodicProfile } from '../../../src/harmony/analyzers/MelodicProfile.js';
import { MusicPitch } from '../../../src/core/MusicPitch.js';
import { MusicUnit } from '../../../src/core/MusicUnit.js';
import { Parameter } from '../../../src/core/Parameter.js';
import { ParameterCommons } from '../../../src/harmony/constants/ParameterCommons.js';
import { ParameterNames } from '../../../src/harmony/constants/ParameterNames.js';
import { ParametersList } from '../../../src/core/ParametersList.js';
import { SettingsList } from '../../../src/core/SettingsList.js';
import type { IAnalysisContext } from '../../../src/core/interfaces/IAnalysisContext.js';
import type { IMusicRequest } from '../../../src/core/interfaces/IMusicRequest.js';
import type { IMusicUnit } from '../../../src/core/interfaces/IMusicUnit.js';
import type { IParametersList } from '../../../src/core/interfaces/IParametersList.js';

/** Builds a music unit with the given MIDI pitches (use `0` for a rest) and duration. */
function unitOf(duration: Fraction, ...midiNotes: number[]): IMusicUnit {
  const unit = new MusicUnit();
  unit.duration = duration;
  for (const midiNote of midiNotes) {
    const pitch = new MusicPitch();
    pitch.midiNote = midiNote;
    unit.pitches.push(pitch);
  }
  return unit;
}

function buildFixture(useMelodicModel: 0 | 1): { parametersList: IParametersList; request: IMusicRequest } {
  const parametersList = new ParametersList();
  const settings = new SettingsList();

  const param = new Parameter();
  param.type = CoreOperationKeys.TYPE_BOOLEAN;
  param.isTweenable = false;
  param.name = ParameterNames.USE_MELODIC_MODEL;
  parametersList.push(param);
  settings.setValueAt(param, 1, useMelodicModel);

  const request = { instruments: [], userSettings: settings } as IMusicRequest;
  return { parametersList, request };
}

function contextWith(previousContent: IMusicUnit[]): IAnalysisContext {
  return { previousContent, proposedContent: [], percentTime: 0.5 };
}

describe('MelodicProfile', () => {
  describe('"Use melodic model" off', () => {
    it('bypasses analysis and reports NA_RESERVED_VALUE regardless of previous content', () => {
      const { parametersList, request } = buildFixture(0);
      const target = unitOf(Fraction.WHOLE, 60);
      const analyzer = new MelodicProfile();

      analyzer.analyze(target, contextWith([unitOf(Fraction.WHOLE, 55)]), parametersList, request);

      expect(target.analysisScores.getValueFor(ParameterNames.MELODIC_DIRECTION_BALANCE)).toBe(
        ParameterCommons.NA_RESERVED_VALUE,
      );
    });
  });

  describe('"Use melodic model" on, empty or rests-only previous content (the fixed bypass)', () => {
    it('reports NA_RESERVED_VALUE for a totally empty previousContent (start of generation)', () => {
      const { parametersList, request } = buildFixture(1);
      const target = unitOf(Fraction.WHOLE, 60);
      const analyzer = new MelodicProfile();

      analyzer.analyze(target, contextWith([]), parametersList, request);

      const score = target.analysisScores.getValueFor(ParameterNames.MELODIC_DIRECTION_BALANCE);
      expect(score).toBe(0);
      expect(Number.isNaN(score)).toBe(false);
    });

    it('reports NA_RESERVED_VALUE when previousContent has exactly one rest unit', () => {
      const { parametersList, request } = buildFixture(1);
      const target = unitOf(Fraction.WHOLE, 60);
      const analyzer = new MelodicProfile();

      analyzer.analyze(target, contextWith([unitOf(new Fraction(1, 4), 0)]), parametersList, request);

      const score = target.analysisScores.getValueFor(ParameterNames.MELODIC_DIRECTION_BALANCE);
      expect(score).toBe(0);
      expect(Number.isNaN(score)).toBe(false);
    });

    it('reports NA_RESERVED_VALUE when previousContent has several rest-only units', () => {
      const { parametersList, request } = buildFixture(1);
      const target = unitOf(Fraction.WHOLE, 60);
      const analyzer = new MelodicProfile();
      const rests = [unitOf(new Fraction(1, 4), 0), unitOf(new Fraction(1, 4), 0), unitOf(new Fraction(1, 4), 0)];

      analyzer.analyze(target, contextWith(rests), parametersList, request);

      const score = target.analysisScores.getValueFor(ParameterNames.MELODIC_DIRECTION_BALANCE);
      expect(score).toBe(0);
      expect(Number.isNaN(score)).toBe(false);
    });

    it('reports NA_RESERVED_VALUE for a rest-only unit with multiple simultaneous rest pitches', () => {
      const { parametersList, request } = buildFixture(1);
      const target = unitOf(Fraction.WHOLE, 60);
      const analyzer = new MelodicProfile();

      // A single "chord" unit whose every pitch is a rest (midiNote 0) -- still "no pitched content".
      analyzer.analyze(target, contextWith([unitOf(new Fraction(1, 4), 0, 0, 0)]), parametersList, request);

      const score = target.analysisScores.getValueFor(ParameterNames.MELODIC_DIRECTION_BALANCE);
      expect(score).toBe(0);
      expect(Number.isNaN(score)).toBe(false);
    });

    it('never produces a NaN score, even across many repeated calls with empty/rests-only content', () => {
      const { parametersList, request } = buildFixture(1);
      const analyzer = new MelodicProfile();
      const emptyVariants: IMusicUnit[][] = [
        [],
        [unitOf(new Fraction(1, 4), 0)],
        [unitOf(new Fraction(1, 4), 0), unitOf(new Fraction(1, 8), 0)],
        [unitOf(new Fraction(1, 16), 0, 0)],
      ];

      for (const previousContent of emptyVariants) {
        const target = unitOf(Fraction.WHOLE, 60);
        analyzer.analyze(target, contextWith(previousContent), parametersList, request);
        const score = target.analysisScores.getValueFor(ParameterNames.MELODIC_DIRECTION_BALANCE);
        expect(Number.isNaN(score)).toBe(false);
        expect(score).toBe(0);
      }
    });
  });

  describe('"Use melodic model" on, with real previous content (normal path, unaffected by the fix)', () => {
    it('produces a finite score in [0, 100] once previous content has actual pitches', () => {
      const { parametersList, request } = buildFixture(1);
      const target = unitOf(new Fraction(1, 4), 67);
      const analyzer = new MelodicProfile();
      const previousContent = [
        unitOf(new Fraction(1, 4), 60),
        unitOf(new Fraction(1, 4), 62),
        unitOf(new Fraction(1, 4), 64),
      ];

      analyzer.analyze(target, contextWith(previousContent), parametersList, request);

      const score = target.analysisScores.getValueFor(ParameterNames.MELODIC_DIRECTION_BALANCE);
      expect(Number.isNaN(score)).toBe(false);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('a single mid-fragment rest does not trigger the bypass (real pitched content elsewhere)', () => {
      const { parametersList, request } = buildFixture(1);
      const target = unitOf(new Fraction(1, 4), 67);
      const analyzer = new MelodicProfile();
      const previousContent = [unitOf(new Fraction(1, 4), 60), unitOf(new Fraction(1, 4), 0)];

      analyzer.analyze(target, contextWith(previousContent), parametersList, request);

      const score = target.analysisScores.getValueFor(ParameterNames.MELODIC_DIRECTION_BALANCE);
      expect(Number.isNaN(score)).toBe(false);
      // Should be a real computed score, not the NA_RESERVED_VALUE sentinel used by the bypass paths.
      expect(score).toBeGreaterThan(0);
    });
  });
});
