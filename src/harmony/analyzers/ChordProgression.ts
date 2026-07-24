import { AbstractContentAnalyzer } from '../../core/abstracts/AbstractContentAnalyzer.js';
import { getExternalVoicesMelodicBias, getInternalVoicesMelodicBias } from '../../generators/constants/BiasTables.js';
import { IntervalsSize } from '../../generators/constants/pitch/IntervalsSize.js';
import { ParameterCommons } from '../constants/ParameterCommons.js';
import { ParameterNames } from '../constants/ParameterNames.js';
import { getRealPitches } from '../../core/helpers/CommonMusicUtils.js';
import { removeOneDupplicate } from '../../utils/Arrays.js';
import type { IAnalysisContext } from '../../core/interfaces/IAnalysisContext.js';
import type { IMusicRequest } from '../../core/interfaces/IMusicRequest.js';
import type { IMusicUnit } from '../../core/interfaces/IMusicUnit.js';
import type { IMusicalContentAnalyzer } from '../../core/interfaces/IMusicalContentAnalyzer.js';
import type { IParameter } from '../../core/interfaces/IParameter.js';
import type { IParametersList } from '../../core/interfaces/IParametersList.js';

const NUM_EXTERNAL_VOICES = 2;

/**
 * Builds a dense `number[]` indexed by interval size (`0`..`PERFECT_OCTAVE`) from a
 * `BiasTables` bias map, matching the AS3 original's `Array`-shaped bias tables (which the
 * `.sort()`/`.shift()`/`.pop()`/`.forEach()`/index-mutation operations below all need). Always
 * returns a fresh array, so callers are free to mutate it -- equivalent to the AS3 original's
 * own `.concat()` calls at each use site.
 */
function toDenseBiasArray(biasMap: Readonly<Record<number, number>>): number[] {
  const size = IntervalsSize.PERFECT_OCTAVE + 1;
  const table: number[] = new Array(size);
  for (let i = 0; i < size; i++) {
    table[i] = biasMap[i] as number;
  }
  return table;
}

/**
 * Audits the overall voice-leading profile of two chords observed in isolation from the
 * harmonic context they evolve in.
 *
 * Ported from
 * `as-sources/legacy-generators-harmony/ro/se/legacy/generators/harmony/analyzers/ChordProgression.as`.
 *
 * **Bug fixed: stale pre-equalization length used as the voice-peeling budget.** In
 * `computeProgressionScore(unitA, unitB)`, the AS3 original captures `iNumPitchesA` (the real-
 * pitch count of `unitA`, i.e. the *previous* chord) *before* the two chords are equalized in
 * length (the shorter one is duplicated/trimmed in place, via aliases that point at the very
 * same array objects, until both match the length of the longer one). It then uses that
 * pre-equalization `iNumPitchesA` both as the initial "voice-peeling" weight (`biasFactor`) and
 * as the external-vs-internal-voice threshold (`pitchesA.length > iNumPitchesA - 2`) — but the
 * `while` loop that consumes both actually iterates `pitchesA.length` times, which, once
 * equalized, may be *larger* than `iNumPitchesA` (whenever the previous chord had *fewer* real
 * pitches than the current one — an ordinary, reachable situation, since `VOICES_NUMBER` is a
 * tweenable parameter and consecutive units can differ in voice count in either direction).
 * When that happens, `biasFactor` overshoots into negative values partway through the loop, and
 * the voice-table threshold is checked against a stale reference point — silently corrupting
 * the resulting score rather than crashing. Fixed by capturing the voice-peeling budget and
 * threshold from the *post-equalization* length (`pitchesA.length`, which by construction is
 * now guaranteed equal to `pitchesB.length`), which the loop actually walks. See the test spec
 * for deliberately heavy coverage of both the previously-broken direction (previous chord
 * shorter than current) and the previously-fine one (previous chord longer or equal), to lock
 * in that the fix doesn't disturb the cases that already worked.
 *
 * **Bug fixed: `computeScoreLimits` under-counting voices when the previous chord has more
 * real pitches than the current one.** A second, related but distinct issue from the one
 * above, in a different method: `analyze()` calls `computeScoreLimits(currNumPitches)`,
 * assuming the peeling loop processes exactly `currNumPitches` voices. But
 * `computeProgressionScore` actually peels `Math.max(prevNumPitches, currNumPitches)` voices
 * (equalization always pads the *shorter* chord up to match the longer one, never trims the
 * longer one down) — so whenever the previous chord has *more* real pitches than the current
 * one, `computeScoreLimits` computes a too-narrow min/max reference range for the number of
 * voices actually peeled, skewing the final normalized score. This one predates and is
 * independent of the `biasFactor` fix above (it existed in the original AS3 exactly as
 * described, unaffected by whether that other bug was present). Fixed by calling
 * `computeScoreLimits(Math.max(prevNumPitches, currNumPitches))` instead.
 *
 * **The commented-out `substitutePitchesOf` calls are left as-is.** The AS3 original has a
 * `// TODO: uncomment after the ChordProgression analyzer is reviewed/rewritten` note next to
 * two commented-out lines that would have passed rest-free ("cleaned") copies of the two units
 * into `computeProgressionScore`, instead of the raw units (with rests still present) it
 * actually passes today. `computeProgressionScore` re-filters rests internally regardless, so
 * this doesn't change the *pitches* considered — ported as a faithful "documented, deliberately
 * deferred" state, not a bug this translation should silently resolve.
 *
 * **`computeScoreLimits`'s claimed caching never actually happens, ported as a plain method
 * call each time.** Its ASDoc says results are "cached... for as long as the number of pitches
 * stays the same", but the method is called unconditionally on every `analyze()` invocation,
 * with no memoization check anywhere. Unlike the `biasFactor` issue above, this has no
 * observable effect on the scores produced -- it's recomputed correctly from scratch every
 * time, just without the (apparently intended, never implemented) performance shortcut. Same
 * category as `IntrinsicConsonance`'s dead `_adjacentIntervalsCache`: documented, not "fixed",
 * since there's nothing incorrect to fix.
 *
 * **Bug fixed: `melodicInterval` indexed the bias table without being reduced to a simple
 * interval first, found by the end-to-end integration test (step 14) crashing on the very
 * first real generation run — not by this file's own, narrower unit tests.** The bias tables
 * (`BiasTables.ts`) only cover one octave (semitone sizes `0`-`12`); `computeProgressionScore`
 * computed `Math.abs(pitchA - pitchB)` directly, with no `% PERFECT_OCTAVE` reduction, so any
 * matched-voice melodic leap larger than an octave — an entirely ordinary occurrence once real,
 * wide-ranging instruments are involved — indexed past the end of the table. In the AS3
 * original, `biasTable[melodicInterval] as uint` on the resulting `undefined` silently
 * coerces to `0` (`ToUint32(NaN) = 0`), so the original just treated large leaps as "zero
 * bias" without crashing. This port's `as number` performs no such runtime coercion, so the
 * same `undefined` propagates as a genuine `NaN` through the running `totalBias` sum — and
 * unlike the earlier, similar cases in this codebase, this one doesn't just produce a quietly
 * wrong number: the corrupted `NaN` score fails `AnalysisScores.add`'s own validation and
 * throws, so it was impossible to miss once a realistic scenario exercised it. Fixed by
 * reducing to a simple interval first (`Math.abs(pitchA - pitchB) % IntervalsSize.PERFECT_OCTAVE`),
 * matching the same convention `IntrinsicConsonance.ts` already established for interval-size
 * table lookups, and standard voice-leading practice (a tenth behaves melodically like a
 * third, just registrally displaced).
 */
export class ChordProgression extends AbstractContentAnalyzer implements IMusicalContentAnalyzer {
  private externalMelodicScores: number[] = [];
  private internalMelodicScores: number[] = [];
  private maxPossibleScore = 1;
  private minPossibleScore = 1;

  /** @see IMusicalContentAnalyzer.name */
  override get name(): string {
    return ParameterNames.CHORD_PROGRESSION;
  }

  /** @see IMusicalContentAnalyzer.weight */
  override get weight(): number {
    return 0.7;
  }

  /**
   * Analyses melodic movement of each corresponding pair of pitches from two neighbour music
   * units, and yields a score that favors "classical" chord progression, where "external
   * voices" move more than "internal voices".
   * @see IMusicalContentAnalyzer.analyze
   */
  override analyze(
    targetMusicUnit: IMusicUnit,
    analysisContext: IAnalysisContext,
    parameters: IParametersList,
    request: IMusicRequest,
  ): void {
    this.externalMelodicScores = toDenseBiasArray(getExternalVoicesMelodicBias());
    this.internalMelodicScores = toDenseBiasArray(getInternalVoicesMelodicBias());

    // Adjust the likeliness of holding onto the same pitch while moving to the
    // next music unit. This directly influences the likeliness of held notes on a
    // "per-voice" basis, and causes a blend of polyphony to mix into the, otherwise,
    // homophonic choral.
    const timeSlot = Math.round(analysisContext.percentTime * 100);
    const settings = request.userSettings;
    const restlessnessParam = parameters.getByName(ParameterNames.VOICE_RESTLESSNESS)[0] as IParameter;
    const restlessNess = settings.getValueAt(restlessnessParam, timeSlot) as number;
    const rawSteadinessFactor = (99 - (restlessNess - 1)) / 99;
    const minSteadinessFactor = ParameterCommons.VOICE_RESTLESSNESS_MIN;
    const maxSteadinessFactor = ParameterCommons.VOICE_RESTLESSNESS_MAX;
    const steadinessFactor = (maxSteadinessFactor - minSteadinessFactor) * rawSteadinessFactor + minSteadinessFactor;
    (this.externalMelodicScores[IntervalsSize.PERFECT_UNISON] as number) *= steadinessFactor;
    (this.internalMelodicScores[IntervalsSize.PERFECT_UNISON] as number) *= steadinessFactor;
    this.normalizeTable(this.externalMelodicScores);
    this.normalizeTable(this.internalMelodicScores);

    // Extract the reference (previous) chord.
    const prevContent = analysisContext.previousContent;

    // If this is the first chord, it is equally good or bad, since there has never
    // been any voice leading. Therefore, store a score of `NA_RESERVED_VALUE` for it.
    if (prevContent.length === 0) {
      targetMusicUnit.analysisScores.add(ParameterNames.CHORD_PROGRESSION, ParameterCommons.NA_RESERVED_VALUE);
      return;
    }

    const prevUnit = prevContent[prevContent.length - 1] as IMusicUnit;
    const prevUnitPitches = getRealPitches(prevUnit.pitches);
    const prevNumPitches = prevUnitPitches.length;

    // If the previous "chord" consists entirely of rests, things are rather debatable, strictly musically speaking.
    // For the time being, we choose to store a score of `NA_RESERVED_VALUE` as well, essentially meaning that
    // anything could follow a rest, from a voice-leading perspective.
    if (prevNumPitches === 0) {
      targetMusicUnit.analysisScores.add(ParameterNames.CHORD_PROGRESSION, ParameterCommons.NA_RESERVED_VALUE);
      return;
    }

    const currPitches = getRealPitches(targetMusicUnit.pitches);
    const currNumPitches = currPitches.length;

    // If the current "chord" consists entirely of rests, the same considerations and resolution shall apply.
    if (currNumPitches === 0) {
      targetMusicUnit.analysisScores.add(ParameterNames.CHORD_PROGRESSION, ParameterCommons.NA_RESERVED_VALUE);
      return;
    }

    // If neither previous nor current chord have at least two voices, we will exit as well. We will want this
    // situation to be controlled by melodic rather than harmonic analyzers. It is acceptable, though, that one of
    // the two only have one voice.
    if (prevNumPitches < 2 && currNumPitches < 2) {
      targetMusicUnit.analysisScores.add(ParameterNames.CHORD_PROGRESSION, ParameterCommons.NA_RESERVED_VALUE);
      return;
    }

    // Store the maximum and minimum scores that can be achieved; this will help
    // us produce a normalized result (a rational number between `0` and `1`).
    //
    // BUG FIX (see file header, second fix): the AS3 original calls this with
    // `currNumPitches` alone, but `computeProgressionScore` below actually peels
    // `Math.max(prevNumPitches, currNumPitches)` voices (equalization always pads the
    // shorter chord up to match the longer one, never trims the longer one down). Passing
    // just `currNumPitches` under-counts whenever the previous chord had MORE real pitches
    // than the current one, computing a too-narrow min/max reference range for the actual
    // number of voices peeled.
    this.computeScoreLimits(Math.max(prevNumPitches, currNumPitches));

    // Clean up both operands (remove rests from both previous and current chord), in order to reduce the odds of
    // misleading the analyzer, would be the intent here -- but see the file header for why the units are
    // actually passed through unmodified (a deliberately deferred TODO in the AS3 original).
    const cleanPrevUnit = prevUnit;
    const cleanCurrUnit = targetMusicUnit;

    // Compute and store the chord progression score.
    const rawScore = this.computeProgressionScore(cleanPrevUnit, cleanCurrUnit);
    const rawDelta = rawScore - this.minPossibleScore;
    const refDelta = this.maxPossibleScore - this.minPossibleScore;
    let score = rawDelta / refDelta;
    score = Math.max(ParameterCommons.MIN_LEGAL_SCORE, Math.round(score * 100));
    targetMusicUnit.analysisScores.add(ParameterNames.CHORD_PROGRESSION, score);
  }

  /**
   * Normalizes in-place the given array of numbers, making sure that they sum up to 100, while
   * keeping their original proportions.
   */
  private normalizeTable(table: number[]): void {
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

    // If, after normalization, the values inside the table do not precisely
    // add up to 100 (which can happen due to rounding errors), the offset is
    // added to the first element of the table.
    const checkDelta = 100 - checkSum;
    table[0] = (table[0] as number) + checkDelta;
  }

  /**
   * Calculates the maximum and minimum possible scores for the given number of pitches/voices.
   * See the file header for why this isn't actually cached across calls, despite the AS3
   * original's ASDoc claiming it is.
   */
  private computeScoreLimits(numPitches: number): void {
    // Find the maximum/minimum possible bias for external voices.
    const extVoiceBiases = this.externalMelodicScores.slice().sort((a, b) => b - a);
    const maxExtVoiceBias = extVoiceBiases.shift() as number;
    const minExtVoiceBias = extVoiceBiases.pop() as number;

    // Find the maximum/minimum possible bias for internal voices.
    const intVoiceBiases = this.internalMelodicScores.slice().sort((a, b) => b - a);
    const maxIntVoiceBias = intVoiceBiases.shift() as number;
    const minIntVoiceBias = intVoiceBiases.pop() as number;

    // Use the maximum bias for "external voices" twice (as there are two "external
    // voices", the "soprano" and the "bass"), and the maximum bias for "internal
    // voices" for each remaining voice (as they will all be "internal voices").
    // Decrease the bias factor as we progress through the voices (because "internal
    // voices" are, melodically, less important than "external voices": in fact, the
    // more "internal" a voice is, the less melodically important it is).
    this.maxPossibleScore = 1;
    this.minPossibleScore = 1;
    let biasFactor = numPitches;
    let voiceCounter = 0;
    while (biasFactor > 0) {
      this.maxPossibleScore += (voiceCounter < NUM_EXTERNAL_VOICES ? maxExtVoiceBias : maxIntVoiceBias) * biasFactor;
      this.minPossibleScore += (voiceCounter < NUM_EXTERNAL_VOICES ? minExtVoiceBias : minIntVoiceBias) * biasFactor;
      biasFactor--;
      voiceCounter++;
    }
  }

  /**
   * Computes the "chord progression score", which is a means of describing how much the
   * voice leading in two neighbour chords loosely conforms to rules of classic
   * four-part writing.
   *
   * This is a mere approximation, done by observing the melodic relationship each
   * note from the first chord makes with its counterpart from the second chord. The
   * goal is to favor those chord successions where "internal voices" move in step
   * motion (or small skips). "External voices" are encouraged to mix in more skips, in
   * order to increase the odds for a more expressive "soprano" or "bass".
   */
  private computeProgressionScore(unitA: IMusicUnit, unitB: IMusicUnit): number {
    // Extract the pitches, so that we can work non-destructively on the units themselves
    // (the arrays built here are freely mutated below).
    const pitchesA: number[] = [];
    for (const pitch of unitA.pitches) {
      if (pitch.midiNote > 0) {
        pitchesA.push(pitch.midiNote);
      }
    }
    const pitchesB: number[] = [];
    for (const pitch of unitB.pitches) {
      if (pitch.midiNote > 0) {
        pitchesB.push(pitch.midiNote);
      }
    }

    // We can only compute melodic progression for chords having the same number of
    // pitches (because every pitch in chord A must "lead" to a pitch in chord B).
    // If this is not the case, we duplicate the lesser chord until it has
    // the same number of pitches as the greater chord, or more. If needed, we trim
    // down the duplicated chord, top to bottom.
    if (pitchesA.length !== pitchesB.length) {
      const bothChords: number[][] = [pitchesA, pitchesB];
      const bothChordsCopy = bothChords.slice().sort((arrA, arrB) => arrA.length - arrB.length);
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

    // In homophonic music, pitches in a chord (improperly named "voices") are
    // hierarchically organized in "external voices" (e.g., the bass and the
    // soprano in a SATB choir) and "internal voices" (e.g., the alto and the
    // tenor). External voices are, melodically, more important than internal
    // voices. Also, lower-pitched voices are melodically less important than
    // higher-pitched voices.
    //
    // Therefore, given two chords with `n` "voices" each, where `0` is the lowest
    // voice and `n` is the highest voice, we traverse both of them in
    // `n`, `0`, `n - 1`, `0 + 1`, etc. order, and, while doing so, we multiply
    // the corresponding voice leading score by a decreasing factor.
    //
    // The voice leading scores are stored in pre-calculated tables (see `BiasTables`
    // for an explanation).
    //
    // BUG FIX (see file header): `numPitches` is captured HERE, after the two chords
    // have been equalized in length above -- unlike the AS3 original, which captured
    // it before equalization, from `unitA`'s pitch count alone.
    const numPitches = pitchesA.length;
    let biasFactor = numPitches;
    let totalBias = 0;

    // Start with chords in reversed image (highest pitches are in index 0 of both arrays).
    pitchesA.reverse();
    pitchesB.reverse();

    // "Peel" one pair of pitches at the time, working towards the inner voices,
    // starting with the "soprano".
    while (pitchesA.length > 0) {
      const biasTable = pitchesA.length > numPitches - 2 ? this.externalMelodicScores : this.internalMelodicScores;
      const pitchA = pitchesA.shift() as number;
      const pitchB = pitchesB.shift() as number;
      // BUG FIX (see file header): reduced to a simple interval before the lookup -- the bias
      // tables only cover one octave (0-12 semitones); an un-reduced leap larger than that
      // indexed past the end of the table.
      const melodicInterval = Math.abs(pitchA - pitchB) % IntervalsSize.PERFECT_OCTAVE;
      const localBias = (biasTable[melodicInterval] as number) * biasFactor;
      totalBias += localBias;
      pitchesA.reverse();
      pitchesB.reverse();
      biasFactor--;
    }
    return totalBias;
  }
}
