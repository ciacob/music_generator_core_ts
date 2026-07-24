import { describe, expect, it } from 'vitest';
import { $get } from '../../../src/knowledge/instruments/InstrumentFactory.js';
import { CoreOperationKeys } from '../../../src/core/constants/CoreOperationKeys.js';
import { CoreParameterNames } from '../../../src/core/constants/CoreParameterNames.js';
import { Fraction } from '../../../src/math/Fraction.js';
import { MusicPitch } from '../../../src/core/MusicPitch.js';
import { MusicUnit } from '../../../src/core/MusicUnit.js';
import { Parameter } from '../../../src/core/Parameter.js';
import { ParameterNames } from '../../../src/harmony/constants/ParameterNames.js';
import { ParametersList } from '../../../src/core/ParametersList.js';
import { PitchAllocation } from '../../../src/core/PitchAllocation.js';
import { SettingsList } from '../../../src/core/SettingsList.js';
import { VoiceCohesion } from '../../../src/harmony/analyzers/VoiceCohesion.js';
import type { IAnalysisContext } from '../../../src/core/interfaces/IAnalysisContext.js';
import type { IMusicRequest } from '../../../src/core/interfaces/IMusicRequest.js';
import type { IMusicUnit } from '../../../src/core/interfaces/IMusicUnit.js';
import type { IMusicalInstrument } from '../../../src/knowledge/instruments/IMusicalInstrument.js';
import type { IParametersList } from '../../../src/core/interfaces/IParametersList.js';

/** Builds a music unit with the given duration, optionally "playing" on the given instrument/voiceIndex. */
function unitOf(duration: Fraction, active?: { instrument: IMusicalInstrument; voiceIndex: number }): IMusicUnit {
  const unit = new MusicUnit();
  unit.duration = duration;
  if (active) {
    const pitch = new MusicPitch();
    pitch.midiNote = 60; // any real (non-rest) pitch
    unit.pitches.push(pitch);
    unit.pitchAllocations.push(new PitchAllocation(active.instrument, active.voiceIndex, pitch));
  }
  return unit;
}

/** A silent unit of the given duration -- no pitches, no allocations, so every voice reads as inactive. */
function restOf(duration: Fraction): IMusicUnit {
  const unit = new MusicUnit();
  unit.duration = duration;
  return unit;
}

function buildFixture(
  instruments: IMusicalInstrument[],
  voicesNumberPercent: number,
  analysisWindow: number,
): { parametersList: IParametersList; request: IMusicRequest } {
  const parametersList = new ParametersList();
  const settings = new SettingsList();

  const voicesParam = new Parameter();
  voicesParam.type = CoreOperationKeys.TYPE_ARRAY;
  voicesParam.isTweenable = true;
  voicesParam.name = ParameterNames.VOICES_NUMBER;
  parametersList.push(voicesParam);
  settings.setValueAt(voicesParam, 1, voicesNumberPercent);

  const windowParam = new Parameter();
  windowParam.type = CoreOperationKeys.TYPE_INT;
  windowParam.isTweenable = false;
  windowParam.name = CoreParameterNames.ANALYSIS_WINDOW;
  parametersList.push(windowParam);
  settings.setValueAt(windowParam, 1, analysisWindow);

  const request = { instruments, userSettings: settings } as IMusicRequest;
  return { parametersList, request };
}

function contextWith(previousContent: IMusicUnit[], percentTime: number): IAnalysisContext {
  return { previousContent, proposedContent: [], percentTime };
}

function scoreOf(target: IMusicUnit, context: IAnalysisContext, parametersList: IParametersList, request: IMusicRequest): number {
  new VoiceCohesion().analyze(target, context, parametersList, request);
  return target.analysisScores.getValueFor(ParameterNames.VOICE_COHESION);
}

describe('VoiceCohesion', () => {
  describe('early-exit (bypass) conditions', () => {
    it('reports NEUTRAL_SCORE (50) when VOICES_NUMBER >= 95%', () => {
      const violin = $get('Violin', 0) as IMusicalInstrument;
      const { parametersList, request } = buildFixture([violin], 95, 10);
      const previousContent = [restOf(new Fraction(1, 4)), restOf(new Fraction(1, 4)), restOf(new Fraction(1, 4))];
      const target = unitOf(new Fraction(1, 4));
      expect(scoreOf(target, contextWith(previousContent, 0.5), parametersList, request)).toBe(50);
    });

    it('reports NEUTRAL_SCORE (50) when ANALYSIS_WINDOW <= 3', () => {
      const violin = $get('Violin', 0) as IMusicalInstrument;
      const { parametersList, request } = buildFixture([violin], 50, 3);
      const previousContent = [restOf(new Fraction(1, 4)), restOf(new Fraction(1, 4)), restOf(new Fraction(1, 4))];
      const target = unitOf(new Fraction(1, 4));
      expect(scoreOf(target, contextWith(previousContent, 0.5), parametersList, request)).toBe(50);
    });

    it('reports NEUTRAL_SCORE (50) when previousContent has fewer than 3 units', () => {
      const violin = $get('Violin', 0) as IMusicalInstrument;
      const { parametersList, request } = buildFixture([violin], 50, 10);
      const previousContent = [restOf(new Fraction(1, 4)), restOf(new Fraction(1, 4))];
      const target = unitOf(new Fraction(1, 4));
      expect(scoreOf(target, contextWith(previousContent, 0.5), parametersList, request)).toBe(50);
    });

    it('reports NEUTRAL_SCORE (50) when cumulated duration is below 3/4', () => {
      const violin = $get('Violin', 0) as IMusicalInstrument;
      const { parametersList, request } = buildFixture([violin], 50, 10);
      // 3 units of 1/8 each = 3/8 total, well under 3/4.
      const previousContent = [restOf(new Fraction(1, 8)), restOf(new Fraction(1, 8)), restOf(new Fraction(1, 8))];
      const target = unitOf(new Fraction(1, 4));
      expect(scoreOf(target, contextWith(previousContent, 0.5), parametersList, request)).toBe(50);
    });

    it('reports NEUTRAL_SCORE (50) when there are no instruments (no voice slots)', () => {
      const { parametersList, request } = buildFixture([], 50, 10);
      const previousContent = [
        unitOf(new Fraction(1, 4)),
        unitOf(new Fraction(1, 4)),
        unitOf(new Fraction(1, 4)),
        unitOf(new Fraction(1, 4)),
      ];
      const target = unitOf(new Fraction(1, 4));
      expect(scoreOf(target, contextWith(previousContent, 0.5), parametersList, request)).toBe(50);
    });
  });

  describe('percentTime/timeSlot bug fix regression guard', () => {
    it('does not always return NEUTRAL_SCORE for real, non-degenerate contexts (the fixed bug made this analyzer permanently inert)', () => {
      // With the bug, ANY percentTime other than exactly 0 caused the ANALYSIS_WINDOW <= 3
      // early-exit to fire unconditionally (see file header), so this analyzer would ALWAYS
      // return NEUTRAL_SCORE (50), regardless of how much real, meaningful previousContent
      // was supplied and regardless of the actual configured ANALYSIS_WINDOW/VOICES_NUMBER.
      // Assert, for a genuinely non-neutral (fractional) percentTime, that a real computed
      // score reaches the caller -- specifically, one that DIFFERS from NEUTRAL_SCORE for an
      // arc pattern we know should score away from the middle (see the hand-verified cases
      // below for the exact numbers).
      const violin = $get('Violin', 0) as IMusicalInstrument;
      const { parametersList, request } = buildFixture([violin], 50, 10);
      // Six silent units (old + interim + immediate, all NONE), then an ACTIVE candidate.
      const previousContent = [
        restOf(new Fraction(1, 4)),
        restOf(new Fraction(1, 4)),
        restOf(new Fraction(1, 4)),
        restOf(new Fraction(1, 4)),
        restOf(new Fraction(1, 4)),
        restOf(new Fraction(1, 4)),
      ];
      const target = unitOf(new Fraction(1, 4), { instrument: violin, voiceIndex: 1 });
      // percentTime=0.3333... is a realistic, non-zero, fractional value -- exactly the kind
      // the bug always collapsed to "read as 0 / always bypass".
      const score = scoreOf(target, contextWith(previousContent, 1 / 3), parametersList, request);
      expect(score).toBe(100);
    });
  });

  describe('hand-verified arc-scoring scenarios (single instrument, single voice)', () => {
    // Six units of 1/4 each (total 3/2), split into three equal 1/2-duration sections of two
    // units each: old=[u1,u2], interim=[u3,u4], immediate=[u5,u6].
    const violin = $get('Violin', 0) as IMusicalInstrument;

    it('an entirely silent history (NONE-NONE-NONE) followed by a candidate that emerges to ~50% exposure scores perfectly (ideal: SOME)', () => {
      const { parametersList, request } = buildFixture([violin], 50, 10);
      const previousContent = [
        restOf(new Fraction(1, 4)),
        restOf(new Fraction(1, 4)),
        restOf(new Fraction(1, 4)),
        restOf(new Fraction(1, 4)),
        restOf(new Fraction(1, 4)),
        restOf(new Fraction(1, 4)),
      ];
      // Candidate plays -> after sliding the window (shedding one candidate-duration's worth
      // from the left of "immediate + candidate"), the updated immediate section is
      // [u6 (silent), candidate (active)] -> 50% exposure, exactly matching the ideal center
      // for BUCKET_SOME (50) that "NONE-NONE-NONE" calls for -> delta=0 -> voiceScore=1 -> 100.
      const target = unitOf(new Fraction(1, 4), { instrument: violin, voiceIndex: 1 });
      expect(scoreOf(target, contextWith(previousContent, 1 / 3), parametersList, request)).toBe(100);
    });

    it('an entirely silent history followed by a candidate that STAYS silent scores worse (0.5, i.e. 50)', () => {
      const { parametersList, request } = buildFixture([violin], 50, 10);
      const previousContent = [
        restOf(new Fraction(1, 4)),
        restOf(new Fraction(1, 4)),
        restOf(new Fraction(1, 4)),
        restOf(new Fraction(1, 4)),
        restOf(new Fraction(1, 4)),
        restOf(new Fraction(1, 4)),
      ];
      // Candidate silent -> updated immediate = [u6 (silent), candidate (silent)] -> 0%
      // exposure. delta=|0-50|=50 -> voiceScore=1-50/100=0.5 -> round(0.5*100)=50.
      const target = unitOf(new Fraction(1, 4));
      expect(scoreOf(target, contextWith(previousContent, 1 / 3), parametersList, request)).toBe(50);
    });
  });

  describe('general properties (multi-instrument, black-box)', () => {
    it('produces a finite score in [1, 100] and is deterministic for a richer, multi-instrument context', () => {
      const piano = $get('Piano', 0) as IMusicalInstrument; // 4 voices
      const violin = $get('Violin', 1) as IMusicalInstrument; // 1 voice
      const { parametersList, request } = buildFixture([piano, violin], 60, 8);
      const previousContent = [
        unitOf(new Fraction(1, 4), { instrument: piano, voiceIndex: 1 }),
        unitOf(new Fraction(1, 4), { instrument: piano, voiceIndex: 2 }),
        unitOf(new Fraction(1, 4), { instrument: violin, voiceIndex: 1 }),
        unitOf(new Fraction(1, 4), { instrument: piano, voiceIndex: 3 }),
        restOf(new Fraction(1, 4)),
        unitOf(new Fraction(1, 4), { instrument: piano, voiceIndex: 4 }),
      ];
      const target = unitOf(new Fraction(1, 4), { instrument: piano, voiceIndex: 1 });
      const context = contextWith(previousContent, 0.42);

      const scoreA = scoreOf(target, context, parametersList, request);
      const scoreB = scoreOf(unitOf(new Fraction(1, 4), { instrument: piano, voiceIndex: 1 }), context, parametersList, request);

      expect(Number.isNaN(scoreA)).toBe(false);
      expect(scoreA).toBeGreaterThanOrEqual(1);
      expect(scoreA).toBeLessThanOrEqual(100);
      expect(scoreA).toBe(scoreB); // purely deterministic, no randomness involved
    });
  });
});
