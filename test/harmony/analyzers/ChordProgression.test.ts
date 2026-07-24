import { describe, expect, it } from 'vitest';
import { ChordProgression } from '../../../src/harmony/analyzers/ChordProgression.js';
import { CoreOperationKeys } from '../../../src/core/constants/CoreOperationKeys.js';
import { Fraction } from '../../../src/math/Fraction.js';
import { getExternalVoicesMelodicBias, getInternalVoicesMelodicBias } from '../../../src/generators/constants/BiasTables.js';
import { IntervalsSize } from '../../../src/generators/constants/pitch/IntervalsSize.js';
import { MusicPitch } from '../../../src/core/MusicPitch.js';
import { MusicUnit } from '../../../src/core/MusicUnit.js';
import { Parameter } from '../../../src/core/Parameter.js';
import { ParameterCommons } from '../../../src/harmony/constants/ParameterCommons.js';
import { ParameterNames } from '../../../src/harmony/constants/ParameterNames.js';
import { ParametersList } from '../../../src/core/ParametersList.js';
import { removeOneDupplicate } from '../../../src/utils/Arrays.js';
import { SettingsList } from '../../../src/core/SettingsList.js';
import type { IAnalysisContext } from '../../../src/core/interfaces/IAnalysisContext.js';
import type { IMusicRequest } from '../../../src/core/interfaces/IMusicRequest.js';
import type { IMusicUnit } from '../../../src/core/interfaces/IMusicUnit.js';
import type { IParametersList } from '../../../src/core/interfaces/IParametersList.js';

/*
 * This spec independently re-derives the analyzer's full scoring pipeline (bias-table prep,
 * score-limit computation, and the chord-progression "peeling" loop) as free functions, with
 * two deliberate toggles reproducing the AS3 original's pre-fix behavior at each of the two
 * bug sites (see ChordProgression.ts's file header). This lets the tests below assert, for the
 * same fixture:
 *   1. the real analyzer's output matches the fully-fixed reference exactly;
 *   2. the fully-fixed reference genuinely differs from the pre-fix ("buggy") reference for
 *      inputs that trigger each bug -- proving each fix is real and observable, not a no-op;
 *   3. for inputs that could never have triggered a given bug, buggy and fixed references
 *      agree -- proving neither fix disturbs the cases that already worked.
 */

type BiasAnchorMode = 'buggy' | 'fixed';
type ScoreLimitsArgMode = 'buggy' | 'fixed';

function toDenseBiasArray(biasMap: Readonly<Record<number, number>>): number[] {
  const size = IntervalsSize.PERFECT_OCTAVE + 1;
  const table: number[] = new Array(size);
  for (let i = 0; i < size; i++) {
    table[i] = biasMap[i] as number;
  }
  return table;
}

function normalizeTable(table: number[]): void {
  let tableSum = 0;
  table.forEach((entryValue, entryIndex, srcTable) => {
    const rounded = Math.round(entryValue * 1000);
    srcTable[entryIndex] = rounded;
    tableSum += rounded;
  });
  let checkSum = 0;
  table.forEach((entryValue, entryIndex, srcTable) => {
    const entryPercent = entryValue / tableSum;
    const rounded = Math.round(entryPercent * 100);
    srcTable[entryIndex] = rounded;
    checkSum += rounded;
  });
  const checkDelta = 100 - checkSum;
  table[0] = (table[0] as number) + checkDelta;
}

function buildBiasTables(restlessNess: number): { external: number[]; internal: number[] } {
  const external = toDenseBiasArray(getExternalVoicesMelodicBias());
  const internal = toDenseBiasArray(getInternalVoicesMelodicBias());
  const rawSteadinessFactor = (99 - (restlessNess - 1)) / 99;
  const minSteadinessFactor = ParameterCommons.VOICE_RESTLESSNESS_MIN;
  const maxSteadinessFactor = ParameterCommons.VOICE_RESTLESSNESS_MAX;
  const steadinessFactor = (maxSteadinessFactor - minSteadinessFactor) * rawSteadinessFactor + minSteadinessFactor;
  (external[IntervalsSize.PERFECT_UNISON] as number) *= steadinessFactor;
  (internal[IntervalsSize.PERFECT_UNISON] as number) *= steadinessFactor;
  normalizeTable(external);
  normalizeTable(internal);
  return { external, internal };
}

function computeScoreLimitsRef(external: number[], internal: number[], numPitches: number): { min: number; max: number } {
  const extBiases = external.slice().sort((a, b) => b - a);
  const maxExt = extBiases.shift() as number;
  const minExt = extBiases.pop() as number;
  const intBiases = internal.slice().sort((a, b) => b - a);
  const maxInt = intBiases.shift() as number;
  const minInt = intBiases.pop() as number;

  const NUM_EXTERNAL_VOICES = 2;
  let max = 1;
  let min = 1;
  let biasFactor = numPitches;
  let voiceCounter = 0;
  while (biasFactor > 0) {
    max += (voiceCounter < NUM_EXTERNAL_VOICES ? maxExt : maxInt) * biasFactor;
    min += (voiceCounter < NUM_EXTERNAL_VOICES ? minExt : minInt) * biasFactor;
    biasFactor--;
    voiceCounter++;
  }
  return { min, max };
}

/** Mirrors `computeProgressionScore`, with `anchorMode` selecting the pre-fix ("buggy") or post-fix ("fixed") biasFactor/threshold anchor. */
function computeProgressionScoreRef(
  rawPitchesA: readonly number[],
  rawPitchesB: readonly number[],
  external: number[],
  internal: number[],
  anchorMode: BiasAnchorMode,
): number {
  const pitchesA = rawPitchesA.slice();
  const pitchesB = rawPitchesB.slice();
  const originalNumPitchesA = pitchesA.length; // the AS3 original's (buggy) anchor

  if (pitchesA.length !== pitchesB.length) {
    const bothChordsCopy = [pitchesA, pitchesB].slice().sort((a, b) => a.length - b.length);
    const lesserChord = bothChordsCopy[0] as number[];
    const greaterChord = bothChordsCopy[1] as number[];
    while (lesserChord.length < greaterChord.length) {
      lesserChord.unshift(...lesserChord.slice());
    }
    lesserChord.sort((a, b) => a - b);
    while (lesserChord.length > greaterChord.length) {
      removeOneDupplicate(lesserChord, true);
    }
  }

  const anchor = anchorMode === 'fixed' ? pitchesA.length : originalNumPitchesA;
  let biasFactor = anchor;
  let totalBias = 0;

  pitchesA.reverse();
  pitchesB.reverse();

  while (pitchesA.length > 0) {
    const biasTable = pitchesA.length > anchor - 2 ? external : internal;
    const pitchA = pitchesA.shift() as number;
    const pitchB = pitchesB.shift() as number;
    // BUG FIX applied here too (see ChordProgression.ts's file header): reduced to a simple
    // interval before the lookup, so this reference stays in sync with the real, fixed code.
    const melodicInterval = Math.abs(pitchA - pitchB) % IntervalsSize.PERFECT_OCTAVE;
    const localBias = (biasTable[melodicInterval] as number) * biasFactor;
    totalBias += localBias;
    pitchesA.reverse();
    pitchesB.reverse();
    biasFactor--;
  }
  return totalBias;
}

/** Full pipeline, mirroring `analyze()`'s post-bypass math, with both bug sites independently toggleable. */
function fullScoreRef(
  prevPitches: readonly number[],
  currPitches: readonly number[],
  restlessNess: number,
  scoreLimitsArgMode: ScoreLimitsArgMode,
  biasAnchorMode: BiasAnchorMode,
): number {
  const { external, internal } = buildBiasTables(restlessNess);
  const scoreLimitsArg = scoreLimitsArgMode === 'fixed' ? Math.max(prevPitches.length, currPitches.length) : currPitches.length;
  const { min, max } = computeScoreLimitsRef(external, internal, scoreLimitsArg);
  const rawScore = computeProgressionScoreRef(prevPitches, currPitches, external, internal, biasAnchorMode);
  const rawDelta = rawScore - min;
  const refDelta = max - min;
  let score = rawDelta / refDelta;
  score = Math.max(ParameterCommons.MIN_LEGAL_SCORE, Math.round(score * 100));
  return score;
}

/** Builds a music unit with the given MIDI pitches (ascending order, bass to treble) and duration. */
function chordOf(...midiNotes: number[]): IMusicUnit {
  const unit = new MusicUnit();
  unit.duration = Fraction.WHOLE;
  for (const midiNote of midiNotes) {
    const pitch = new MusicPitch();
    pitch.midiNote = midiNote;
    unit.pitches.push(pitch);
  }
  return unit;
}

function buildFixture(restlessNess: number): { parametersList: IParametersList; request: IMusicRequest } {
  const parametersList = new ParametersList();
  const settings = new SettingsList();
  const param = new Parameter();
  param.type = CoreOperationKeys.TYPE_INT;
  param.isTweenable = false;
  param.name = ParameterNames.VOICE_RESTLESSNESS;
  parametersList.push(param);
  settings.setValueAt(param, 1, restlessNess);
  const request = { instruments: [], userSettings: settings } as IMusicRequest;
  return { parametersList, request };
}

function contextWith(previousContent: IMusicUnit[]): IAnalysisContext {
  return { previousContent, proposedContent: [], percentTime: 0.5 };
}

function realScoreFor(prevPitches: number[], currPitches: number[], restlessNess: number): number {
  const { parametersList, request } = buildFixture(restlessNess);
  const target = chordOf(...currPitches);
  const analyzer = new ChordProgression();
  analyzer.analyze(target, contextWith([chordOf(...prevPitches)]), parametersList, request);
  return target.analysisScores.getValueFor(ParameterNames.CHORD_PROGRESSION);
}

const RESTLESSNESS = 40;

describe('ChordProgression', () => {
  describe('bypass conditions', () => {
    it('reports NA_RESERVED_VALUE for the very first chord (no previous content)', () => {
      const { parametersList, request } = buildFixture(RESTLESSNESS);
      const target = chordOf(60, 64, 67);
      new ChordProgression().analyze(target, contextWith([]), parametersList, request);
      expect(target.analysisScores.getValueFor(ParameterNames.CHORD_PROGRESSION)).toBe(
        ParameterCommons.NA_RESERVED_VALUE,
      );
    });

    it('reports NA_RESERVED_VALUE when the previous chord is entirely rests', () => {
      expect(realScoreFor([0, 0], [60, 64, 67], RESTLESSNESS)).toBe(ParameterCommons.NA_RESERVED_VALUE);
    });

    it('reports NA_RESERVED_VALUE when the current chord is entirely rests', () => {
      expect(realScoreFor([60, 64, 67], [0, 0], RESTLESSNESS)).toBe(ParameterCommons.NA_RESERVED_VALUE);
    });

    it('reports NA_RESERVED_VALUE when neither chord has at least two real voices', () => {
      expect(realScoreFor([60], [67], RESTLESSNESS)).toBe(ParameterCommons.NA_RESERVED_VALUE);
    });

    it('does NOT bypass when exactly one of the two chords has a single voice', () => {
      const score = realScoreFor([60], [60, 64, 67], RESTLESSNESS);
      expect(score).not.toBe(ParameterCommons.NA_RESERVED_VALUE);
    });
  });

  describe('regression coverage for both fixes, against an independently re-derived reference', () => {
    it('matches the fully-fixed reference for a symmetric case (equal voice counts, no bug could trigger)', () => {
      const prev = [60, 64, 67];
      const curr = [62, 65, 69];
      const expected = fullScoreRef(prev, curr, RESTLESSNESS, 'fixed', 'fixed');
      const buggy = fullScoreRef(prev, curr, RESTLESSNESS, 'buggy', 'buggy');
      // Sanity: with equal voice counts, neither bug could have triggered (no length
      // mismatch ever occurs), so both formulations must agree.
      expect(buggy).toBe(expected);
      expect(realScoreFor(prev, curr, RESTLESSNESS)).toBe(expected);
    });

    it('matches the fully-fixed reference, and DIFFERS from the fully-buggy one, when the previous chord is SHORTER (the biasFactor bug)', () => {
      const prev = [60, 67]; // 2 voices
      const curr = [55, 60, 64, 70]; // 4 voices
      const expectedFixed = fullScoreRef(prev, curr, RESTLESSNESS, 'fixed', 'fixed');
      const fullyBuggy = fullScoreRef(prev, curr, RESTLESSNESS, 'buggy', 'buggy');
      expect(fullyBuggy).not.toBe(expectedFixed);
      expect(realScoreFor(prev, curr, RESTLESSNESS)).toBe(expectedFixed);
    });

    it('isolates the biasFactor fix alone: differs from buggy-anchor even when computeScoreLimits arg is already correct', () => {
      const prev = [60, 67];
      const curr = [55, 60, 64, 70];
      const fixedAnchorOnly = fullScoreRef(prev, curr, RESTLESSNESS, 'fixed', 'fixed');
      const buggyAnchorOnly = fullScoreRef(prev, curr, RESTLESSNESS, 'fixed', 'buggy');
      expect(buggyAnchorOnly).not.toBe(fixedAnchorOnly);
    });

    it('matches the fully-fixed reference, and DIFFERS from the fully-buggy one, when the previous chord is LONGER (the computeScoreLimits bug)', () => {
      const prev = [50, 55, 60, 65]; // 4 voices
      const curr = [60, 67]; // 2 voices
      const expectedFixed = fullScoreRef(prev, curr, RESTLESSNESS, 'fixed', 'fixed');
      const fullyBuggy = fullScoreRef(prev, curr, RESTLESSNESS, 'buggy', 'buggy');
      expect(fullyBuggy).not.toBe(expectedFixed);
      expect(realScoreFor(prev, curr, RESTLESSNESS)).toBe(expectedFixed);
    });

    it('isolates the computeScoreLimits fix alone: differs from buggy-arg even when the biasFactor anchor is already correct (previous chord longer never mis-anchors biasFactor)', () => {
      const prev = [50, 55, 60, 65];
      const curr = [60, 67];
      const fixedArgOnly = fullScoreRef(prev, curr, RESTLESSNESS, 'fixed', 'fixed');
      const buggyArgOnly = fullScoreRef(prev, curr, RESTLESSNESS, 'buggy', 'fixed');
      expect(buggyArgOnly).not.toBe(fixedArgOnly);
    });

    it('confirms the previous-chord-longer case never triggered the biasFactor bug on its own (buggy vs fixed anchor agree when computeScoreLimits arg is fixed)', () => {
      const prev = [50, 55, 60, 65];
      const curr = [60, 67];
      const fixedBoth = fullScoreRef(prev, curr, RESTLESSNESS, 'fixed', 'fixed');
      const fixedArgBuggyAnchorNoop = fullScoreRef(prev, curr, RESTLESSNESS, 'fixed', 'buggy');
      // pitchesA (=prev) is already the GREATER chord here, so it's never mutated by
      // equalization -- its post-equalization length equals its original length, so the
      // "buggy" vs "fixed" anchor distinction is a no-op in this specific direction.
      expect(fixedArgBuggyAnchorNoop).toBe(fixedBoth);
    });

    it('matches the fully-fixed reference across several more prev/curr voice-count combinations', () => {
      const cases: Array<[number[], number[]]> = [
        [[60], [55, 60, 64, 70]],
        [[60, 64], [60]],
        [[48, 60, 67, 72, 76], [50, 62, 69]],
        [[50, 62, 69], [48, 60, 67, 72, 76]],
        [[60, 60], [60, 60]],
      ];
      for (const [prev, curr] of cases) {
        const expected = fullScoreRef(prev, curr, RESTLESSNESS, 'fixed', 'fixed');
        expect(realScoreFor(prev, curr, RESTLESSNESS)).toBe(expected);
      }
    });

    it('never produces a score below MIN_LEGAL_SCORE (1) across the same combinations', () => {
      const cases: Array<[number[], number[]]> = [
        [[60], [55, 60, 64, 70]],
        [[60, 64], [60]],
        [[48, 60, 67, 72, 76], [50, 62, 69]],
        [[50, 62, 69], [48, 60, 67, 72, 76]],
        [[60, 67], [55, 60, 64, 70]],
        [[50, 55, 60, 65], [60, 67]],
      ];
      for (const [prev, curr] of cases) {
        expect(realScoreFor(prev, curr, RESTLESSNESS)).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('melodicInterval bug fix regression guard (out-of-range bias-table index)', () => {
    it('does not throw when a matched voice leaps more than an octave between chords', () => {
      // Reproduces the exact crash found by the end-to-end integration test: prevPitches[0]=30
      // and currPitches[0]=90 are 60 semitones apart (5 octaves) -- with the bug, this indexed
      // biasTable[60] (undefined, since the table only covers 0-12), producing a NaN score that
      // AnalysisScores.add's own validation rejects, throwing.
      expect(() => realScoreFor([30, 40], [90, 95], RESTLESSNESS)).not.toThrow();
    });

    it('produces a finite, in-range score (not NaN) for a >1 octave leap', () => {
      const score = realScoreFor([30, 40], [90, 95], RESTLESSNESS);
      expect(Number.isNaN(score)).toBe(false);
      expect(score).toBeGreaterThanOrEqual(1);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('matches the fully-fixed reference for a >1 octave leap scenario', () => {
      const prev = [30, 40];
      const curr = [90, 95]; // both voices leap exactly 60 semitones (5 octaves) up
      const expected = fullScoreRef(prev, curr, RESTLESSNESS, 'fixed', 'fixed');
      expect(realScoreFor(prev, curr, RESTLESSNESS)).toBe(expected);
    });

    it('a compound leap scores identically to its simple-interval equivalent (e.g. a 10th behaves like a 3rd)', () => {
      // prev->curr leap of exactly 15 semitones (a compound minor third, i.e. a tenth) must
      // score the same as a leap of 3 semitones (15 % 12 = 3, a plain minor third) -- proving
      // the fix reduces to a genuine simple interval, not just "avoids crashing".
      const prevCompound = [40];
      const currCompound = [55]; // 15 semitones up
      const prevSimple = [40];
      const currSimple = [43]; // 3 semitones up

      // Both chords also need a second voice for the >=2-voice bypass to not fire; give both
      // an identical, unrelated held second voice so it contributes equally to each score.
      const scoreCompound = realScoreFor([...prevCompound, 60], [...currCompound, 60], RESTLESSNESS);
      const scoreSimple = realScoreFor([...prevSimple, 60], [...currSimple, 60], RESTLESSNESS);
      expect(scoreCompound).toBe(scoreSimple);
    });

    it('handles an extreme, multi-octave leap (10+ octaves) without throwing or producing NaN', () => {
      const score = realScoreFor([20, 25], [140, 145], RESTLESSNESS);
      expect(Number.isNaN(score)).toBe(false);
      expect(score).toBeGreaterThanOrEqual(1);
      expect(score).toBeLessThanOrEqual(100);
    });
  });
});
