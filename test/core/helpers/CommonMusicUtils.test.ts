import { describe, expect, it } from 'vitest';
import {
  cleanupContent,
  cloneAndReorderInstruments,
  clearIntervalsCache,
  countIntOccurrences,
  findSuitablePitch,
  getChordDetails,
  getRealPitches,
  hasAnyMajorSecond,
  hasAnyMajorSeventh,
  hasAnyMinorSecond,
  hasAnyMinorSeventh,
  hasAnyTritone,
  hasMultipleTritones,
  isConsonanceAcceptable,
  midiPitchesToMusicUnit,
  substitutePitchesOf,
  validateConsonanceScore,
} from '../../../src/core/helpers/CommonMusicUtils.js';
import { MusicPitch } from '../../../src/core/MusicPitch.js';
import { MusicUnit } from '../../../src/core/MusicUnit.js';
import type { IMusicalInstrument } from '../../../src/knowledge/instruments/IMusicalInstrument.js';

function makeChord(midiNotes: readonly number[]): MusicUnit {
  const unit = new MusicUnit();
  for (const midiNote of midiNotes) {
    const pitch = new MusicPitch();
    pitch.midiNote = midiNote;
    unit.pitches.push(pitch);
  }
  return unit;
}

function makeInstrumentStub(
  internalName: string,
  ordinalIndex: number,
  idealHarmonicRange: readonly [number, number],
): IMusicalInstrument {
  return {
    uid: `${internalName}-${ordinalIndex}`,
    internalName,
    name: internalName,
    abbreviatedName: internalName,
    ordinalIndex,
    staffNames: [],
    abbreviatedStaffNames: [],
    stavesNumber: 1,
    clefs: [],
    bracket: '',
    partFamily: '',
    midiPatch: 0,
    midiRange: [0, 127],
    idealHarmonicRange: idealHarmonicRange as unknown as readonly number[],
    maximumPoliphony: 1,
    maximumAutonomousVoices: 1,
    transposition: 0,
  };
}

describe('getChordDetails', () => {
  it('computes simple/adjacent intervals and lowest pitch for a C major triad', () => {
    const chord = makeChord([60, 64, 67]); // C E G
    const details = getChordDetails(chord);
    expect(details.lowestPitchInChord).toBe(60);
    expect(details.numPitches).toBe(3);
    // C-E (4), C-G (7), E-G (3)
    expect(details.simpleIntervals.slice().sort()).toEqual([3, 4, 7]);
    // Adjacent: C-E (4), E-G (3)
    expect(details.adjacentIntervals.slice().sort()).toEqual([3, 4]);
    expect(details.pitches).toHaveLength(3);
  });

  it('populates allIntervalsRegistry by default', () => {
    const chord = makeChord([60, 64, 67]);
    const details = getChordDetails(chord);
    expect(details.allIntervalsRegistry).toHaveLength(3);
  });

  it('omits allIntervalsRegistry when withRegistry is false', () => {
    const chord = makeChord([60, 64, 67]);
    const details = getChordDetails(chord, false);
    expect(details.allIntervalsRegistry).toBeUndefined();
  });

  it('ignores octave-equivalent pitch pairs (simpleInterval === 0)', () => {
    const chord = makeChord([60, 72]); // unison an octave apart
    const details = getChordDetails(chord);
    expect(details.simpleIntervals).toEqual([]);
  });
});

describe('isConsonanceAcceptable', () => {
  it('accepts a consonant triad at a high consonance score', () => {
    expect(isConsonanceAcceptable(makeChord([60, 64, 67]), 100)).toBe(true);
  });

  it('rejects a chord containing a second at a high consonance score', () => {
    expect(isConsonanceAcceptable(makeChord([60, 62, 67]), 100)).toBe(false);
  });
});

describe('validateConsonanceScore', () => {
  it('always passes within the diminished/augmented/quartal skip range', () => {
    clearIntervalsCache();
    expect(validateConsonanceScore(58, [1, 6, 10])).toBe(true);
  });

  it('rejects tritones for high (triad) scores', () => {
    clearIntervalsCache();
    expect(validateConsonanceScore(95, [6])).toBe(false);
  });

  it('accepts a clean triad (no seconds/sevenths/tritones) for high scores', () => {
    clearIntervalsCache();
    expect(validateConsonanceScore(95, [3, 4, 7])).toBe(true);
  });

  it('accepts anything for cluster-range scores', () => {
    clearIntervalsCache();
    expect(validateConsonanceScore(1, [1, 2, 6, 10, 11])).toBe(true);
  });
});

describe('findSuitablePitch', () => {
  it('returns a pitch from the pool when stub is empty', () => {
    const pool = [60, 64, 67];
    const randomFn = () => 0; // deterministic: always picks index 0
    const pitch = findSuitablePitch(pool, [], 100, randomFn);
    expect(pitch).toBe(60);
  });

  it('returns 0 when the pool is exhausted without finding a suitable pitch', () => {
    const highNote = new MusicPitch();
    highNote.midiNote = 60;
    // Every candidate is <= highestInStub (60), so none ever qualify.
    const pool = [58, 59, 60];
    const pitch = findSuitablePitch(pool, [highNote], 100, () => 0);
    expect(pitch).toBe(0);
  });

  it('finds a consonant pitch above the stub', () => {
    const lowNote = new MusicPitch();
    lowNote.midiNote = 60; // C
    const pool = [67]; // G -- a perfect fifth above, consonant
    const pitch = findSuitablePitch(pool, [lowNote], 100, () => 0);
    expect(pitch).toBe(67);
  });
});

describe('countIntOccurrences / clearIntervalsCache', () => {
  it('counts occurrences of a value within a set', () => {
    expect(countIntOccurrences(3, [1, 3, 3, 5])).toBe(2);
  });

  it('returns 0 for a value not present', () => {
    expect(countIntOccurrences(9, [1, 2, 3])).toBe(0);
  });

  it('reuses a provided cache instead of recomputing', () => {
    const cache: number[] = [];
    expect(countIntOccurrences(3, [1, 3, 3], cache)).toBe(2);
    // Even though the underlying array changes, the cache is reused as-is.
    expect(countIntOccurrences(3, [9, 9, 9], cache)).toBe(2);
  });

  it('clearIntervalsCache does not throw and is safe to call repeatedly', () => {
    expect(() => {
      clearIntervalsCache();
      clearIntervalsCache();
    }).not.toThrow();
  });
});

describe('hasAnyX / hasMultipleX interval predicates', () => {
  it('detects a tritone', () => {
    clearIntervalsCache();
    expect(hasAnyTritone([6])).toBe(true);
    clearIntervalsCache();
    expect(hasAnyTritone([3, 4, 7])).toBe(false);
  });

  it('detects multiple tritones', () => {
    clearIntervalsCache();
    expect(hasMultipleTritones([6, 6])).toBe(true);
    clearIntervalsCache();
    expect(hasMultipleTritones([6])).toBe(false);
  });

  it('detects minor/major seconds', () => {
    clearIntervalsCache();
    expect(hasAnyMinorSecond([1])).toBe(true);
    clearIntervalsCache();
    expect(hasAnyMajorSecond([2])).toBe(true);
  });

  it('detects minor/major sevenths', () => {
    clearIntervalsCache();
    expect(hasAnyMinorSeventh([10])).toBe(true);
    clearIntervalsCache();
    expect(hasAnyMajorSeventh([11])).toBe(true);
  });
});

describe('getRealPitches', () => {
  it('filters out rest (midiNote 0) pitches', () => {
    const rest = new MusicPitch();
    rest.midiNote = 0;
    const g = new MusicPitch();
    g.midiNote = 67;
    const real = getRealPitches([rest, g]);
    expect(real).toEqual([g]);
  });
});

describe('substitutePitchesOf', () => {
  it('replaces the pitches on a clone, leaving the original untouched', () => {
    const original = makeChord([60, 64, 67]);
    const newPitch = new MusicPitch();
    newPitch.midiNote = 72;
    const substituted = substitutePitchesOf(original, [newPitch]);

    expect(substituted.pitches).toEqual([newPitch]);
    expect(original.pitches).toHaveLength(3);
  });
});

describe('cleanupContent', () => {
  it('is an unimplemented stub that returns its input unchanged', () => {
    const content = [makeChord([60])];
    expect(cleanupContent(content, true)).toBe(content);
  });
});

describe('midiPitchesToMusicUnit', () => {
  it('builds a music unit with one pitch per given MIDI note', () => {
    const unit = midiPitchesToMusicUnit([60, 64, 67]);
    expect(unit.pitches.map((p) => p.midiNote)).toEqual([60, 64, 67]);
  });
});

describe('cloneAndReorderInstruments', () => {
  it('orders instruments by descending mid-range pitch (treble first, bass last -- conventional score order)', () => {
    const violin = makeInstrumentStub('VIOLIN', 0, [55, 88]); // mid ~72
    const cello = makeInstrumentStub('CELLO', 0, [36, 76]); // mid ~56
    const ordered = cloneAndReorderInstruments([violin, cello]);
    expect(ordered[0]).toBe(violin);
    expect(ordered[1]).toBe(cello);
  });

  it('orders same-named instruments by ordinal index', () => {
    const violin1 = makeInstrumentStub('VIOLIN', 0, [55, 88]);
    const violin2 = makeInstrumentStub('VIOLIN', 1, [55, 88]);
    const ordered = cloneAndReorderInstruments([violin2, violin1]);
    expect(ordered[0]).toBe(violin1);
    expect(ordered[1]).toBe(violin2);
  });

  it('does not mutate the original array', () => {
    const violin = makeInstrumentStub('VIOLIN', 0, [55, 88]);
    const cello = makeInstrumentStub('CELLO', 0, [36, 76]);
    const original = [violin, cello];
    cloneAndReorderInstruments(original);
    expect(original[0]).toBe(violin);
    expect(original[1]).toBe(cello);
  });
});
