import { describe, expect, it } from 'vitest';
import { HarmonicDistribution } from '../../../src/harmony/analyzers/HarmonicDistribution.js';
import { MusicPitch } from '../../../src/core/MusicPitch.js';
import { MusicUnit } from '../../../src/core/MusicUnit.js';
import { ParameterCommons } from '../../../src/harmony/constants/ParameterCommons.js';
import { ParameterNames } from '../../../src/harmony/constants/ParameterNames.js';
import type { IAnalysisContext } from '../../../src/core/interfaces/IAnalysisContext.js';
import type { IMusicRequest } from '../../../src/core/interfaces/IMusicRequest.js';
import type { IMusicUnit } from '../../../src/core/interfaces/IMusicUnit.js';
import type { IParametersList } from '../../../src/core/interfaces/IParametersList.js';

/** Builds a music unit with the given MIDI pitches, in ascending order (bass to treble). Use `0` for a rest. */
function chordOf(...midiNotes: number[]): IMusicUnit {
  const unit = new MusicUnit();
  for (const midiNote of midiNotes) {
    const pitch = new MusicPitch();
    pitch.midiNote = midiNote;
    unit.pitches.push(pitch);
  }
  return unit;
}

const dummyContext = {} as IAnalysisContext;
const dummyParameters = {} as IParametersList;
const dummyRequest = {} as IMusicRequest;

function scoreOf(unit: IMusicUnit): number {
  new HarmonicDistribution().analyze(unit, dummyContext, dummyParameters, dummyRequest);
  return unit.analysisScores.getValueFor(ParameterNames.HARMONIC_DISTRIBUTION);
}

describe('HarmonicDistribution', () => {
  describe('bypass condition', () => {
    it('reports NA_RESERVED_VALUE for a two-voice chord', () => {
      expect(scoreOf(chordOf(60, 67))).toBe(ParameterCommons.NA_RESERVED_VALUE);
    });

    it('reports NA_RESERVED_VALUE for a single-voice chord', () => {
      expect(scoreOf(chordOf(60))).toBe(ParameterCommons.NA_RESERVED_VALUE);
    });

    it('counts only playing (non-rest) voices toward the 3-voice minimum', () => {
      // 4 pitches total, but only 2 are real -- still below the minimum.
      expect(scoreOf(chordOf(60, 0, 0, 67))).toBe(ParameterCommons.NA_RESERVED_VALUE);
    });
  });

  describe('four-voice chords: pyramidal (wide-at-bottom) vs. reversed', () => {
    it('scores a "pyramidal" spacing (intervals narrowing toward the top) near the maximum', () => {
      // 48-59-67-72: bass-to-treble intervals 11, 8, 5 -- wide at the bottom, narrow at the top,
      // the classical/ideal SATB shape this analyzer rewards.
      expect(scoreOf(chordOf(48, 59, 67, 72))).toBe(100);
    });

    it('scores the exact mirror-image spacing (intervals widening toward the top) near the minimum', () => {
      // 48-55-64-75: bass-to-treble intervals 7, 9, 11 -- the reverse shape (narrow at the
      // bottom, wide at the top).
      expect(scoreOf(chordOf(48, 55, 64, 75))).toBe(1);
    });

    it('scores an evenly-spaced four-voice chord roughly in the middle', () => {
      // 48-55-62-69: bass-to-treble intervals 7, 7, 7 -- neither pyramidal nor reversed.
      expect(scoreOf(chordOf(48, 55, 62, 69))).toBe(50);
    });
  });

  describe('exactly-three-voice chords always score 50 (documented AS3 behavior, ported as-is)', () => {
    // With exactly 3 playing voices, chordIntervals has only 2 elements -- below the 3-element
    // minimum computeRawScore requires to do any actual reduction -- so the raw score is always
    // 0 regardless of the actual pitches chosen, and transposeScore(0, gamut) always resolves to
    // exactly 0.5 (50 once rounded to a percent). This is a genuine, faithfully-preserved AS3
    // behavior (identical formula, identical threshold), not a translation artifact.
    it.each([
      ['close triad', [60, 64, 67]],
      ['wide triad', [30, 60, 90]],
      ['cluster triad', [60, 61, 62]],
      ['all pitches equal', [60, 60, 60]],
    ])('%s always scores exactly 50', (_label, midiNotes) => {
      expect(scoreOf(chordOf(...(midiNotes as number[])))).toBe(50);
    });
  });

  describe('rests and unusual spacings do not crash and stay within [1, 100]', () => {
    it('handles a rest between playing voices by seeking the nearest actual neighbour', () => {
      const score = scoreOf(chordOf(48, 0, 60, 67));
      expect(Number.isNaN(score)).toBe(false);
      expect(score).toBeGreaterThanOrEqual(1);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('handles a chord containing a unison (smallestIntervalSize = 0) without crashing', () => {
      const score = scoreOf(chordOf(60, 60, 64, 67));
      expect(Number.isNaN(score)).toBe(false);
      expect(score).toBeGreaterThanOrEqual(1);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('handles a wider, five-voice chord without crashing, staying within [1, 100]', () => {
      const score = scoreOf(chordOf(36, 48, 55, 64, 75));
      expect(Number.isNaN(score)).toBe(false);
      expect(score).toBeGreaterThanOrEqual(1);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('determinism', () => {
    it('is purely deterministic (no randomness involved) -- repeated calls on equivalent chords agree', () => {
      const a = scoreOf(chordOf(48, 59, 67, 72));
      const b = scoreOf(chordOf(48, 59, 67, 72));
      expect(a).toBe(b);
    });
  });
});
