import { describe, expect, it } from 'vitest';
import {
  ADDED_NOTES_CHORDS_ROOT_UPPER_SCORE,
  AUGMENTED_OR_QUARTAL_SCORE,
  CLUSTERS_ROOT_IN_BASS_SCORE,
  DIMINISHED_SCORE,
  DOMINANT_TRIAD_SCORE,
  TRIADS_WITH_ROOT_IN_BASS_SCORE,
  TRIADS_WITH_ROOT_UPPER_SCORE,
} from '../../../src/core/helpers/CommonMusicUtils.js';
import { Fraction } from '../../../src/math/Fraction.js';
import { IntrinsicConsonance } from '../../../src/harmony/analyzers/IntrinsicConsonance.js';
import { MusicPitch } from '../../../src/core/MusicPitch.js';
import { MusicUnit } from '../../../src/core/MusicUnit.js';
import { ParameterCommons } from '../../../src/harmony/constants/ParameterCommons.js';
import { ParameterNames } from '../../../src/harmony/constants/ParameterNames.js';
import type { IAnalysisContext } from '../../../src/core/interfaces/IAnalysisContext.js';
import type { IMusicRequest } from '../../../src/core/interfaces/IMusicRequest.js';
import type { IMusicUnit } from '../../../src/core/interfaces/IMusicUnit.js';
import type { IParametersList } from '../../../src/core/interfaces/IParametersList.js';

/** Builds a music unit with the given MIDI pitches, in ascending order (bass to treble). */
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

const dummyContext = {} as IAnalysisContext;
const dummyParameters = {} as IParametersList;
const dummyRequest = {} as IMusicRequest;

function scoreOf(unit: IMusicUnit): number {
  new IntrinsicConsonance().analyze(unit, dummyContext, dummyParameters, dummyRequest);
  return unit.analysisScores.getValueFor(ParameterNames.INTRINSIC_CONSONANCE);
}

describe('IntrinsicConsonance', () => {
  it('reports NA_RESERVED_VALUE for a single pitch (no harmony possible)', () => {
    expect(scoreOf(chordOf(60))).toBe(ParameterCommons.NA_RESERVED_VALUE);
  });

  it('reports NA_RESERVED_VALUE when only one real (non-rest) pitch remains', () => {
    expect(scoreOf(chordOf(60, 0, 0))).toBe(ParameterCommons.NA_RESERVED_VALUE);
  });

  it('ignores rests when counting playing voices', () => {
    // Same effective chord as the root-position major triad case below, with a rest mixed in.
    expect(scoreOf(chordOf(0, 60, 64, 67))).toBe(TRIADS_WITH_ROOT_IN_BASS_SCORE);
  });

  it('scores a root-position major triad (C-E-G) as root-in-bass', () => {
    expect(scoreOf(chordOf(60, 64, 67))).toBe(TRIADS_WITH_ROOT_IN_BASS_SCORE);
  });

  it('scores a first-inversion major triad (E-G-C) as root-upper', () => {
    expect(scoreOf(chordOf(64, 67, 72))).toBe(TRIADS_WITH_ROOT_UPPER_SCORE);
  });

  it('scores a root-position augmented triad (C-E-G#) as augmented/quartal', () => {
    expect(scoreOf(chordOf(60, 64, 68))).toBe(AUGMENTED_OR_QUARTAL_SCORE);
  });

  it('scores a stack of perfect fourths (C-F-Bb) as augmented/quartal (quartal)', () => {
    expect(scoreOf(chordOf(60, 65, 70))).toBe(AUGMENTED_OR_QUARTAL_SCORE);
  });

  it('scores a fully-diminished seventh chord (C-Eb-Gb-A) as diminished', () => {
    expect(scoreOf(chordOf(60, 63, 66, 69))).toBe(DIMINISHED_SCORE);
  });

  it('scores a root-position dominant seventh chord (G-B-D-F) as a typical dominant', () => {
    expect(scoreOf(chordOf(55, 59, 62, 65))).toBe(DOMINANT_TRIAD_SCORE);
  });

  it('scores a tritone-plus-minor-second cluster (C-F#-G) as a cluster, root-in-bass', () => {
    expect(scoreOf(chordOf(60, 66, 67))).toBe(CLUSTERS_ROOT_IN_BASS_SCORE);
  });

  it('scores a chromatic cluster with seconds but no tritone as an "added notes" chord, root-upper', () => {
    expect(scoreOf(chordOf(60, 61, 62))).toBe(ADDED_NOTES_CHORDS_ROOT_UPPER_SCORE);
  });

  it('never returns a score below MIN_LEGAL_SCORE (1)', () => {
    // Every real category constant used by computeScore is already >= 1, but assert the floor
    // itself holds for a representative sample.
    const chords = [
      chordOf(60, 64, 67),
      chordOf(64, 67, 72),
      chordOf(60, 64, 68),
      chordOf(60, 65, 70),
      chordOf(60, 63, 66, 69),
      chordOf(55, 59, 62, 65),
      chordOf(60, 66, 67),
      chordOf(60, 61, 62),
    ];
    for (const chord of chords) {
      expect(scoreOf(chord)).toBeGreaterThanOrEqual(1);
    }
  });
});
