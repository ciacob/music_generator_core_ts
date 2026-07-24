import { getRandomItem } from '../../utils/Arrays.js';
import { IntervalsSize } from '../../generators/constants/pitch/IntervalsSize.js';
import type { IMusicalInstrument } from '../../knowledge/instruments/IMusicalInstrument.js';
import { MusicPitch } from '../MusicPitch.js';
import { MusicUnit } from '../MusicUnit.js';
import type { IMusicPitch } from '../interfaces/IMusicPitch.js';
import type { IMusicUnit } from '../interfaces/IMusicUnit.js';
import { IntervalRegistryEntry } from './IntervalRegistryEntry.js';

/**
 * A portmanteau of helpful operations against various musical
 * structures. Functions here are agnostic to any specific app-internal
 * model data structure.
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/ro/se/legacy/generators/core/helpers/CommonMusicUtils.as`.
 * A static-only AS3 class, translated as a plain module of functions per
 * this project's established convention.
 *
 * **Typed return value instead of a dynamic string-keyed bag**:
 * `getChordDetails`'s AS3 original returns a plain `Object` keyed by the
 * `ALL_INTERVALS_REGISTRY`/`SIMPLE_INTERVALS`/etc. string constants below
 * (a workaround for AS3 not having a convenient anonymous-typed-record
 * return). This port returns a proper `ChordDetails` interface instead;
 * the string constants are kept exported for reference/fidelity, but are
 * no longer needed as lookup keys.
 *
 * **Shared mutable interval-occurrence cache preserved**: `_allIntervalsCache`
 * is intentionally shared, mutable state in the original — a single
 * O(n) histogram pass over an `intervals` array serves all six `hasAnyX`/
 * `hasMultipleX` queries against that same array, so long as
 * `clearIntervalsCache()` runs first whenever a *different* `intervals`
 * array is about to be analyzed. This is preserved exactly (as a
 * module-level variable), not "purified away", since it's a deliberate
 * performance decision in the original, not an accident.
 */

/**
 * Named consonance-score bands returned by `IntrinsicConsonance`'s `computeScore`, one per
 * Hindemith chord-classification category. Extracted here as named constants purely for
 * readability during translation — the AS3 original returned these as inline magic numbers
 * (`return 100;`, etc.) with no named equivalents to carry over. Values themselves are
 * unchanged from the original; only the names are new.
 */
export const TRIADS_WITH_ROOT_IN_BASS_SCORE = 100;
/** @see TRIADS_WITH_ROOT_IN_BASS_SCORE */
export const TRIADS_WITH_ROOT_UPPER_SCORE = 90;
/** @see TRIADS_WITH_ROOT_IN_BASS_SCORE */
export const ADDED_NOTES_CHORDS_ROOT_IN_BASS_SCORE = 80;
/** @see TRIADS_WITH_ROOT_IN_BASS_SCORE */
export const ADDED_NOTES_CHORDS_ROOT_UPPER_SCORE = 70;
/** @see TRIADS_WITH_ROOT_IN_BASS_SCORE */
export const AUGMENTED_OR_QUARTAL_SCORE = 60;
/** @see TRIADS_WITH_ROOT_IN_BASS_SCORE */
export const DIMINISHED_SCORE = 55;
/** @see TRIADS_WITH_ROOT_IN_BASS_SCORE */
export const DOMINANT_TRIAD_SCORE = 50;
/** @see TRIADS_WITH_ROOT_IN_BASS_SCORE */
export const DOMINANT_INVERSIONS_ROOT_IN_BASS_SCORE = 40;
/** @see TRIADS_WITH_ROOT_IN_BASS_SCORE */
export const DOMINANT_INVERSIONS_ROOT_UPPER_SCORE = 30;
/** @see TRIADS_WITH_ROOT_IN_BASS_SCORE */
export const DOMINANT_NINTH_SCORE = 20;
/** @see TRIADS_WITH_ROOT_IN_BASS_SCORE */
export const CLUSTERS_ROOT_IN_BASS_SCORE = 10;
/** @see TRIADS_WITH_ROOT_IN_BASS_SCORE */
export const CLUSTERS_ROOT_UPPER_SCORE = 1;

/** @deprecated Kept for reference/fidelity; `getChordDetails` returns a typed `ChordDetails` object instead of using this as a lookup key. */
export const ALL_INTERVALS_REGISTRY = 'allIntervalsRegistry';
/** @deprecated See `ALL_INTERVALS_REGISTRY`. */
export const SIMPLE_INTERVALS = 'simpleIntervals';
/** @deprecated See `ALL_INTERVALS_REGISTRY`. */
export const ADJACENT_INTERVALS = 'adjacentIntervals';
/** @deprecated See `ALL_INTERVALS_REGISTRY`. */
export const LOWEST_PITCH_IN_CHORD = 'lowestPitchInChord';
/** @deprecated See `ALL_INTERVALS_REGISTRY`. */
export const PITCHES = 'pitches';
/** @deprecated See `ALL_INTERVALS_REGISTRY`. */
export const NUM_PITCHES = 'numPitches';

/** The result of `getChordDetails`. */
export interface ChordDetails {
  /** Detailed information about every interval in the chord, or `undefined` if `withRegistry` was `false`. */
  allIntervalsRegistry: IntervalRegistryEntry[] | undefined;
  /** The semitone count of every "simple" (non-compound) interval in the chord. */
  simpleIntervals: number[];
  /** The semitone count of every *adjacent* interval in the chord (neighboring notes only). */
  adjacentIntervals: number[];
  /** The bass of the chord, as a MIDI value. */
  lowestPitchInChord: number;
  /** Every pitch in the chord. */
  pitches: IMusicPitch[];
  /** The number of distinct pitches the chord has. */
  numPitches: number;
}

let allIntervalsCache: number[] = [];

/**
 * Returns a shallow clone of `instruments`, ordered by each instrument's
 * middle/center pitch (roughly the pitch at the middle of its range).
 * Also sorts instances of the same instrument by their ordinal index (so
 * "Violin 1" is reported "before" "Violin 2").
 */
export function cloneAndReorderInstruments(instruments: readonly IMusicalInstrument[]): IMusicalInstrument[] {
  const clone = instruments.slice();
  clone.sort(compareInstruments);
  return clone;
}

/**
 * Scrutinizes `chord` and returns details about its harmonic structure.
 *
 * @param chord A music unit that describes a chord.
 * @param withRegistry Optional, default `true`. Whether to also compute
 * and return `allIntervalsRegistry` information, since doing so is
 * somewhat expensive.
 */
export function getChordDetails(chord: IMusicUnit, withRegistry = true): ChordDetails {
  const allIntervalsRegistry: IntervalRegistryEntry[] | undefined = withRegistry ? [] : undefined;
  const simpleIntervals: number[] = [];
  const adjacentIntervals: number[] = [];
  let lowestPitchInChord = Number.MAX_SAFE_INTEGER;
  const pitches = chord.pitches;
  const numPitches = pitches.length;

  for (let i = 0; i < numPitches; i++) {
    const currentPitch = pitches[i] as IMusicPitch;
    const currMidiNote = currentPitch.midiNote;
    if (currMidiNote < lowestPitchInChord) {
      lowestPitchInChord = currMidiNote;
    }
    const remainderPitches = pitches.slice(i + 1);
    for (let j = 0; j < remainderPitches.length; j++) {
      const otherPitch = remainderPitches[j] as IMusicPitch;
      const interval = Math.abs(currMidiNote - otherPitch.midiNote);
      const simpleInterval = interval % IntervalsSize.PERFECT_OCTAVE;
      if (simpleInterval !== 0) {
        simpleIntervals.push(simpleInterval);
        if (allIntervalsRegistry) {
          allIntervalsRegistry.push(new IntervalRegistryEntry(currMidiNote, simpleInterval));
        }
        if (j === 0) {
          adjacentIntervals.push(simpleInterval);
        }
      }
    }
  }

  return {
    allIntervalsRegistry,
    simpleIntervals,
    adjacentIntervals,
    lowestPitchInChord,
    pitches,
    numPitches,
  };
}

/**
 * Scrutinizes `chord` and decides if it is acceptable given
 * `referenceConsonance`. Note this only performs a very basic
 * validation, e.g. a chord that should be "100%" consonant should not
 * contain any seconds or tritones.
 *
 * @param referenceConsonance A value within `0` and `100` describing the
 * consonance setting the chord is to be evaluated by, where `100` means
 * "fully consonant".
 */
export function isConsonanceAcceptable(chord: IMusicUnit, referenceConsonance: number): boolean {
  clearIntervalsCache();
  const chordDetails = getChordDetails(chord, false);
  return validateConsonanceScore(referenceConsonance, chordDetails.simpleIntervals);
}

/**
 * Given a `pool` of possible pitches to choose from, a `stub` of the
 * chord being built (notes already deemed appropriate, which won't be
 * touched) and a `score` describing the desired consonance, finds and
 * returns a MIDI pitch from `pool` that would not offend the existing
 * chord stub, nor the expected consonance score.
 *
 * Building a chord one pitch at a time is overall more economical in CPU
 * terms than randomly gathering it and then deciding whether it's
 * suitable.
 *
 * @param pool Pitches to choose from.
 * @param stub The part of the chord "already built".
 * @param score The harmonic score the chord must produce when analyzed.
 * @param randomFn A function producing a random floating point value in
 * `[0, 1)`. Optional, defaults to `Math.random`. Not present in the
 * original AS3 signature; threaded through to `Arrays.getRandomItem` per
 * this project's convention of favoring injectable randomness.
 * @returns The MIDI pitch that would abide by all the conditions laid
 * out above. NOTE: can return `0` if none of the notes in the pool were
 * acceptable; `0` is a valid special value, translating to a rest (a
 * "voice" that does not play/sing).
 */
export function findSuitablePitch(
  pool: number[],
  stub: readonly IMusicPitch[],
  score: number,
  randomFn: () => number = Math.random,
): number {
  if (stub.length === 0) {
    return (getRandomItem(pool, true, randomFn) as number | null) ?? 0;
  }
  const highestInStub = (stub[stub.length - 1] as IMusicPitch).midiNote;
  while (pool.length > 0) {
    const pitchCandidate = getRandomItem(pool, true, randomFn) as number | null;
    if (pitchCandidate === null || pitchCandidate <= highestInStub) {
      continue;
    }
    const intervalsToTest: number[] = [];
    for (const stubNote of stub) {
      const simpleInterval = (pitchCandidate - stubNote.midiNote) % 12;
      intervalsToTest.push(simpleInterval);
    }
    clearIntervalsCache();
    if (validateConsonanceScore(score, intervalsToTest)) {
      return pitchCandidate;
    }
  }
  return 0;
}

/**
 * Counts and returns the number of occurrences of `value` within `arr`.
 *
 * @param value The numeric (integer) value to look for.
 * @param arr The set to look into.
 * @param cache Optional. An array to store counted occurrences in, so
 * recounting on each call isn't needed.
 */
export function countIntOccurrences(value: number, arr: readonly number[], cache: number[] | null = null): number {
  const counter = cache ?? [];
  if (counter.length === 0) {
    for (const interval of arr) {
      counter[interval] = (counter[interval] ?? 0) + 1;
    }
  }
  return counter[value] ?? 0;
}

/** Resets the internal cache used by `countIntOccurrences`. */
export function clearIntervalsCache(): void {
  allIntervalsCache = [];
}

/** Returns `true` if `intervals` contains at least one tritone. */
export function hasAnyTritone(intervals: readonly number[]): boolean {
  return countIntOccurrences(IntervalsSize.AUGMENTED_FOURTH, intervals, allIntervalsCache) > 0;
}

/** Returns `true` if `intervals` contains at least two tritones. */
export function hasMultipleTritones(intervals: readonly number[]): boolean {
  return countIntOccurrences(IntervalsSize.AUGMENTED_FOURTH, intervals, allIntervalsCache) >= 2;
}

/** Returns `true` if `intervals` contains a minor second. */
export function hasAnyMinorSecond(intervals: readonly number[]): boolean {
  return countIntOccurrences(IntervalsSize.MINOR_SECOND, intervals, allIntervalsCache) > 0;
}

/** Returns `true` if `intervals` contains a major second. */
export function hasAnyMajorSecond(intervals: readonly number[]): boolean {
  return countIntOccurrences(IntervalsSize.MAJOR_SECOND, intervals, allIntervalsCache) > 0;
}

/** Returns `true` if `intervals` contains a minor seventh. */
export function hasAnyMinorSeventh(intervals: readonly number[]): boolean {
  return countIntOccurrences(IntervalsSize.MINOR_SEVENTH, intervals, allIntervalsCache) > 0;
}

/** Returns `true` if `intervals` contains a major seventh. */
export function hasAnyMajorSeventh(intervals: readonly number[]): boolean {
  return countIntOccurrences(IntervalsSize.MAJOR_SEVENTH, intervals, allIntervalsCache) > 0;
}

/**
 * By convention, any pitch of `0` reported in a chord is a rest (if a
 * specific voice doesn't play, it's represented as MIDI `0`, sacrificed
 * since it's too low to be of real use anyway).
 *
 * Returns a copy of `rawPitches` with all `0`s removed. E.g. given a
 * chord of `[0, 67, 72, 79]` (Bass voice not playing), returns
 * `[67, 72, 79]` — a chord of only three voices, with MIDI `67` as the
 * new Bass voice.
 */
export function getRealPitches(rawPitches: readonly IMusicPitch[]): IMusicPitch[] {
  return rawPitches.filter((pitch) => pitch.midiNote !== 0);
}

/**
 * Makes a clone of `musicUnit`, with `withPitches` replacing the
 * original pitches. The original is left untouched.
 */
export function substitutePitchesOf(musicUnit: IMusicUnit, withPitches: readonly IMusicPitch[]): IMusicUnit {
  const newMusicUnit = musicUnit.clone();
  const newPitches = newMusicUnit.pitches;
  newPitches.length = 0;
  for (const pitch of withPitches) {
    newPitches.push(pitch);
  }
  return newMusicUnit;
}

/**
 * Effectively removes non-pitch music units from `content` (leading and
 * trailing empty units get removed if `trim` is `true`).
 *
 * @remarks The AS3 original is an unimplemented stub (`// TODO:
 * implement`) that just returns `content` unchanged — ported faithfully
 * as the same stub, not invented around.
 */
export function cleanupContent(content: readonly IMusicUnit[], _trim: boolean): readonly IMusicUnit[] {
  return content;
}

/**
 * Performs biased, binary, raw validation of `intervals` based on
 * `score`. Given intervals must construct a chord at least as "good"
 * (consonant) as the score it's validated against — giving consonant
 * chords an advantage over dissonant ones (very consonant chords
 * validate against virtually any score), counterbalancing a natural
 * tendency to pick dissonant chords.
 *
 * @param score The consonance score to account for, `0` (fully
 * dissonant) to `100` (fully consonant).
 * @param intervals The simple intervals present in the chord.
 * @returns `true` if the raw check passes (e.g. there are no tritones in
 * `intervals` when `score` is above `90`), `false` otherwise.
 */
export function validateConsonanceScore(score: number, intervals: readonly number[]): boolean {
  // We skip checking the specific score range that deals with diminished, augmented or
  // quartal chords.
  if (score >= DIMINISHED_SCORE && score <= AUGMENTED_OR_QUARTAL_SCORE) {
    return true;
  }

  const hasMinorSeconds = hasAnyMinorSecond(intervals);
  const hasMajorSeconds = hasAnyMajorSecond(intervals);
  const hasAnySeconds = hasMinorSeconds || hasMajorSeconds;
  const hasMinorSevenths = hasAnyMinorSeventh(intervals);
  const hasMajorSevenths = hasAnyMajorSeventh(intervals);
  const hasAnySevenths = hasMinorSevenths || hasMajorSevenths;
  const hasAnyTritones = hasAnyTritone(intervals);
  const hasSeveralTritones = hasMultipleTritones(intervals);

  // Triads must not have seconds, sevenths or tritones.
  if (score >= TRIADS_WITH_ROOT_UPPER_SCORE) {
    return !(hasAnySeconds || hasAnySevenths || hasAnyTritones);
  }

  // "Added-note" chords must not have tritones.
  if (score >= ADDED_NOTES_CHORDS_ROOT_UPPER_SCORE) {
    return !hasAnyTritones;
  }

  // Dominant chord in root position must not have seconds or multiple tritones.
  if (score >= DOMINANT_TRIAD_SCORE) {
    return !(hasAnySeconds || hasSeveralTritones);
  }

  // Dominant chord inversions must not have multiple tritones, minor seconds, or major sevenths.
  if (score >= DOMINANT_INVERSIONS_ROOT_UPPER_SCORE) {
    return !(hasMinorSeconds || hasMajorSevenths || hasSeveralTritones);
  }

  // Dominant ninths must not have minor seconds or major sevenths.
  if (score >= DOMINANT_NINTH_SCORE) {
    return !(hasMinorSeconds || hasMajorSevenths);
  }

  // If down here, we have clusters, which we do not forbid any interval for.
  return true;
}

/** Builds a music unit from a plain array of MIDI pitch numbers. */
export function midiPitchesToMusicUnit(pitches: readonly number[]): IMusicUnit {
  const unit = new MusicUnit();
  const tmpPitches = unit.pitches;
  for (const midiNote of pitches) {
    const pitch = new MusicPitch();
    pitch.midiNote = midiNote;
    tmpPitches.push(pitch);
  }
  return unit;
}

/** Sorting function used by `cloneAndReorderInstruments`. */
function compareInstruments(instrumentA: IMusicalInstrument, instrumentB: IMusicalInstrument): number {
  const aLow = instrumentA.idealHarmonicRange[0] as number;
  const aHigh = instrumentA.idealHarmonicRange[1] as number;
  const bLow = instrumentB.idealHarmonicRange[0] as number;
  const bHigh = instrumentB.idealHarmonicRange[1] as number;
  const aMidPitch = aLow + Math.round((aHigh - aLow) * 0.5);
  const bMidPitch = bLow + Math.round((bHigh - bLow) * 0.5);
  let score = bMidPitch - aMidPitch;
  if (score === 0 && instrumentA.internalName === instrumentB.internalName) {
    score = instrumentA.ordinalIndex - instrumentB.ordinalIndex;
  }
  return score;
}
