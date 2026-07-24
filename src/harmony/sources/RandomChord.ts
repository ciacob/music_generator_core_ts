import { cloneAndReorderInstruments, findSuitablePitch } from '../../core/helpers/CommonMusicUtils.js';
import { getRandomItem, getSubsetOf } from '../../utils/Arrays.js';
import { AbstractRawMusicSource } from '../../core/abstracts/AbstractRawMusicSource.js';
import { CoreOperationKeys } from '../../core/constants/CoreOperationKeys.js';
import { IntervalsSize } from '../../generators/constants/pitch/IntervalsSize.js';
import { MusicPitch } from '../../core/MusicPitch.js';
import { MusicUnit } from '../../core/MusicUnit.js';
import { ParameterNames } from '../constants/ParameterNames.js';
import { PitchAllocation } from '../../core/PitchAllocation.js';
import type { IAnalysisContext } from '../../core/interfaces/IAnalysisContext.js';
import type { IMusicalInstrument } from '../../knowledge/instruments/IMusicalInstrument.js';
import type { IMusicPitch } from '../../core/interfaces/IMusicPitch.js';
import type { IMusicRequest } from '../../core/interfaces/IMusicRequest.js';
import type { IMusicUnit } from '../../core/interfaces/IMusicUnit.js';
import type { IParameter } from '../../core/interfaces/IParameter.js';
import type { IParametersList } from '../../core/interfaces/IParametersList.js';
import type { IPitchAllocation } from '../../core/interfaces/IPitchAllocation.js';
import type { IRawMusicSource } from '../../core/interfaces/IRawMusicSource.js';

const REFERENCE_NUM_MIN_INTERVALS = 2;

/**
 * A contiguous run of candidate MIDI pitches, destined for one voice of
 * one instrument. The AS3 original attaches `instrument`/`voiceIndex` as
 * dynamic properties directly on the (dynamically-typed) `Array` — this
 * interface reproduces that by extending `Array<number>`, since plain JS
 * arrays are ordinary objects and can carry extra properties just as
 * freely; TypeScript just needs a named shape to allow it.
 */
interface RangeZone extends Array<number> {
  instrument?: IMusicalInstrument;
  voiceIndex?: number;
}

/**
 * Concrete `IRawMusicSource` implementation that outputs one unique
 * random chord within given low and high thresholds.
 *
 * Ported from
 * `as-sources/legacy-generators-harmony/ro/se/legacy/generators/harmony/sources/RandomChord.as`.
 *
 * **`Objects` import dropped, confirmed dead.** The AS3 original imports
 * `ro.se.utils.Objects` but never actually calls any of its methods
 * anywhere in the file (`_rejectedChords` is a plain hash-map literal,
 * not built through `Objects`). Confirmed via grep across the full
 * 133-file snapshot: the only real calls to `Objects.compareObjects`/
 * `Objects.getKeys` live in `Arrays.as`'s `filterObjectsArray`/
 * `testForIdentity`/`intersect` — methods already excluded when
 * `Arrays.ts` was ported (step 2), confirmed unused elsewhere. So
 * nothing from `utils/Objects.ts` is needed for this port, and none of
 * it has been ported (the deferred `Objects.ts` debt is resolved as
 * "zero members actually required").
 *
 * **GC hint dropped** (gotcha #7 in the top-level README):
 * `flash.system.System.pauseForGCIfCollectionImminent(0.0001)`, a
 * Flash-runtime GC hint with no Node.js equivalent.
 *
 * **`_compareRangeZones` dropped, confirmed dead.** Declared in the AS3
 * original but never called anywhere in the file (verified via grep
 * against this file alone) — a private, unreferenced leftover.
 *
 * **`pitch != 0` rewritten as `pitch.midiNote !== 0`.** The AS3 original
 * compares an `IMusicPitch` *object* against the number `0` — which only
 * works because AS3's abstract-equality coercion falls back to
 * `pitch.toString()` (never overridden `valueOf()`), and `MusicPitch`'s
 * own `toString()` happens to start with the MIDI note number. That
 * chain further depends on `tieNext` being `false` (a `toString()` of
 * `"0="` for a tied rest would coerce to `NaN`, not `0`); every pitch
 * `_generateChord` ever builds leaves `tieNext` at its `false` default,
 * so the two expressions are behaviorally identical for every reachable
 * input here. TypeScript's type system doesn't allow comparing an object
 * to a number with `!==` in the first place, so the direct, intended
 * check is used instead.
 *
 * **`rawMidiValues.sort()` given an explicit numeric comparator.** The
 * AS3 original's `_getIntervalsAgainstBass` calls `.sort()` with no
 * comparator on an array of MIDI numbers — AS3's default `Array.sort()`
 * is lexicographic (string-based) here, exactly like JavaScript's, so
 * this is a genuine, confirmed bug carried over unmodified until now:
 * e.g. `[9, 60].sort()` yields `[60, 9]`, silently picking the wrong
 * "bass" (lowest) pitch. Fixed with a numeric `(a, b) => a - b`
 * comparator, in the same spirit as the `splice`/`TimeSignatureMap`-style
 * fixes elsewhere in this project.
 *
 * **Injectable `randomFn`** (per this project's standing convention,
 * flagged but not mandated by the top-level README's gotcha #11):
 * threaded through to every call site that consumes randomness
 * (`Arrays.getSubsetOf`, `Arrays.getRandomItem`,
 * `CommonMusicUtils.findSuitablePitch`), defaulting to `Math.random` so
 * behavior is unchanged unless a caller opts in.
 */
export class RandomChord extends AbstractRawMusicSource implements IRawMusicSource {
  // Class lifetime cache for `getAverageMiddleRange()`.
  private averageMiddleRange: number[] | undefined;

  // Storage for the value of the "VOICES_NUMBER" parameter's instrument-derived total.
  private totalNumVoices = 0;

  // Storage for the value of the "HIGHEST_PITCH" parameter's instrument-derived bound.
  private highestAvailablePitch = 0;

  // Storage for the value of the "LOWEST_PITCH" parameter's instrument-derived bound.
  private lowestAvailablePitch = 0;

  // Storage for the value of the "INTRINSIC_CONSONANCE" parameter.
  private currentConsonance = 0;

  // Storage for the value of the "ENFORCE_CONSONANCE" parameter.
  private enforceConsonance = false;

  // Storage for rejected proposed chords' signatures, to spare evaluating again.
  private rejectedChords = new Set<string>();

  constructor(private readonly randomFn: () => number = Math.random) {
    super();
  }

  /**
   * Note: delegates the actual work to `generateChord()`.
   * @see IRawMusicSource.output
   */
  override output(
    targetMusicUnit: IMusicUnit,
    analysisContext: IAnalysisContext,
    parameters: IParametersList,
    request: IMusicRequest,
  ): IMusicUnit[] {
    // Reset the storage for rejected chords, as parameters may change from chord to chord and, what was not
    // acceptable one chord ago may now be desirable.
    this.rejectedChords = new Set<string>();

    this.currentConsonance = this.getCurrentConsonance(analysisContext, parameters, request);
    this.enforceConsonance = this.getEnforceConsonance(parameters, request);

    let proposedChord: IMusicUnit;
    for (;;) {
      proposedChord = this.generateChord(targetMusicUnit, analysisContext, parameters, request);
      const signature = proposedChord.pitches.toString();
      if (!this.rejectedChords.has(signature)) {
        if (!this.isShallowChord(proposedChord)) {
          break;
        }
        this.rejectedChords.add(signature);
      }
      // else: previously-rejected signature (used for debug in the original) — loop again.
    }
    return [proposedChord];
  }

  /** Retrieves the current value of the "Intrinsic Consonance" parameter, as a number between `0` and `1`. */
  private getCurrentConsonance(
    analysisContext: IAnalysisContext,
    parameters: IParametersList,
    request: IMusicRequest,
  ): number {
    const timeSlot = Math.round(analysisContext.percentTime * 100);
    const consonanceParam = parameters.getByName(ParameterNames.INTRINSIC_CONSONANCE)[0] as IParameter;
    return request.userSettings.getValueAt(consonanceParam, timeSlot) as number;
  }

  /** Retrieves the value of the "Enforce Consonance" parameter, as a boolean. */
  private getEnforceConsonance(parameters: IParametersList, request: IMusicRequest): boolean {
    const enforceConsonanceParam = parameters.getByName(ParameterNames.ENFORCE_CONSONANCE)[0] as IParameter;
    return request.userSettings.getValueAt(enforceConsonanceParam, 0) === 1;
  }

  /**
   * Resets local cache before class' end of life, in case this is needed.
   * @see IRawMusicSource.reset
   */
  override reset(): void {
    this.totalNumVoices = 0;
    this.averageMiddleRange = undefined;
    this.highestAvailablePitch = 0;
    this.lowestAvailablePitch = 0;
  }

  /**
   * Actually does the job of creating a possible chord (only pitches are provided).
   * @returns An `IMusicUnit` instance with the proposed pitches.
   * @see output
   */
  private generateChord(
    _targetMusicUnit: IMusicUnit,
    analysisContext: IAnalysisContext,
    parameters: IParametersList,
    request: IMusicRequest,
  ): IMusicUnit {
    // GRAB CONTEXT
    const timeSlot = Math.round(analysisContext.percentTime * 100);
    const getParam = parameters.getByName.bind(parameters);
    const settings = request.userSettings;

    // We need to internally reorder available instruments based on their center pitch, so that if we have e.g.,
    // brass ordered as Horns, Trumpets, Trombone and Tuba (traditional score ordering) we are still able to
    // deliver the highest notes of a chord to Trumpets, then the mid and mid/low notes to Horns and, the low
    // notes to Trombones and Tuba, just as if the instruments were ordered as Trumpets, Horns, Trombones and
    // Tuba (contemporary score ordering).
    const instruments = cloneAndReorderInstruments(request.instruments);

    // GRAB PARAMETERS' VALUES
    // Chord range
    const lowestParam = getParam(ParameterNames.LOWEST_PITCH)[0] as IParameter;
    const lowestPercent = (settings.getValueAt(lowestParam, timeSlot) as number) * 0.01;
    const highestParam = getParam(ParameterNames.HIGHEST_PITCH)[0] as IParameter;
    const highestPercent = (settings.getValueAt(highestParam, timeSlot) as number) * 0.01;
    const middleRange = this.getAverageMiddleRange(instruments);
    const highestPitch = this.getHighestAvailablePitch(instruments);
    const lowestPitch = this.getLowestAvailablePitch(instruments);
    const highest = (middleRange[1] as number) + Math.round(highestPercent * (highestPitch - (middleRange[1] as number)));
    const lowest = lowestPitch + Math.round(lowestPercent * ((middleRange[0] as number) - lowestPitch));

    // Number of pitches in the chord
    const numVoicesParam = getParam(ParameterNames.VOICES_NUMBER)[0] as IParameter;
    const numVoicesPercent = (settings.getValueAt(numVoicesParam, timeSlot) as number) * 0.01;
    const maxNumVoices = this.getTotalNumVoices(instruments);
    const numVoices =
      maxNumVoices >= 2
        ? Math.max(CoreOperationKeys.MIN_NUM_VOICES, Math.ceil(numVoicesPercent * maxNumVoices))
        : 1;

    // Build pitches table (must be rebuilt because the `high` and `low` limits might have changed)
    const allPitches: number[] = [];
    for (let midiPitch = lowest; midiPitch <= highest; midiPitch++) {
      allPitches.push(midiPitch);
    }

    // Build "range zones", based on the total number of available voices.
    // NOTE: it is important whether a voice will occupy half of a staff or the entire staff. Some instruments
    // combine both situations.
    // TODO: refactor based on the above observation.
    const rangeZones: RangeZone[] = [];
    const zoneSize = Math.ceil(allPitches.length / this.totalNumVoices);
    while (allPitches.length > 0) {
      rangeZones.push(allPitches.splice(0, zoneSize) as RangeZone);
    }

    // Adjust the range zones to fit inside the range of the corresponding instrument.
    const rangeZonesClone = rangeZones.slice();
    for (let revIndex = instruments.length - 1; revIndex >= 0; revIndex--) {
      const instrument = instruments[revIndex] as IMusicalInstrument;
      const instNumVoices = instrument.maximumAutonomousVoices;
      const instHighest = instrument.midiRange[1] as number;
      const instLowest = instrument.midiRange[0] as number;
      const instrumentZones = rangeZonesClone.splice(0, instNumVoices);

      instrumentZones.forEach((zone, voiceIndex) => {
        const eligiblePitches = zone.filter((midiPitch) => midiPitch >= instLowest && midiPitch <= instHighest);
        zone.length = 0;
        zone.push(...eligiblePitches);

        // N.B.: storing static properties on an Array of integers/MIDI pitches.
        // The app lays out voices from top to bottom; as our Array has the bass zone in first index, we
        // need to report voices in reverse order.
        zone.instrument = instrument;
        zone.voiceIndex = instrumentZones.length - 1 - voiceIndex;
      });
    }

    // Based on the current number of voices that we must use, randomly employ one or more of
    // the range zones built above. For consistency, maintain the zones order and their total
    // number (use zero-element zones as placeholders).
    const zoneIndices: number[] = [];
    for (let zoneIndex = 0; zoneIndex < rangeZones.length; zoneIndex++) {
      zoneIndices.push(zoneIndex);
    }
    const zoneIndicesToUse = getSubsetOf(
      zoneIndices,
      Math.min(zoneIndices.length, numVoices),
      true,
      false,
      this.randomFn,
    );
    const zonesToUse: RangeZone[] = [];
    for (let zoneIndex = 0; zoneIndex < rangeZones.length; zoneIndex++) {
      if (zoneIndicesToUse.indexOf(zoneIndex) !== -1) {
        zonesToUse[zoneIndex] = rangeZones[zoneIndex] as RangeZone;
      } else {
        const skippedZone = rangeZones[zoneIndex] as RangeZone;
        const placeHolder: RangeZone = [] as unknown as RangeZone;
        placeHolder.instrument = skippedZone.instrument;
        placeHolder.voiceIndex = skippedZone.voiceIndex;
        zonesToUse[zoneIndex] = placeHolder;
      }
    }

    // Pick a MIDI value from each eligible zone. Use the reserved MIDI pitch `0` for non-eligible zones. When
    // rendering to score, all `0` MIDI pitches will be translated to rests.
    // We transfer chosen pitches to a MusicUnit (as this is the standardized vehicle we use to carry any type
    // of information).
    //
    // NOTE:
    // We previously have internally sorted instruments based on their relative pitch and score order rules, and
    // have assigned pitches to our chord/MusicUnit based on this sorted order. However, in the score,
    // instruments might be in any order. We now need to explicitly give pitch allocation rules, so that each
    // pitch eventually reaches its intended instrument.
    const tmpMusicUnit: IMusicUnit = new MusicUnit();
    const tmpPitches: IMusicPitch[] = tmpMusicUnit.pitches;
    const tmpAllocations: IPitchAllocation[] = tmpMusicUnit.pitchAllocations;
    zonesToUse.forEach((zone) => {
      const pitch: IMusicPitch = new MusicPitch();
      if (zone.length > 0) {
        pitch.midiNote = this.enforceConsonance
          ? findSuitablePitch(zone, tmpPitches, this.currentConsonance, this.randomFn)
          : ((getRandomItem(zone, false, this.randomFn) as number | null) ?? 0);
      } else {
        pitch.midiNote = 0;
      }
      tmpPitches.push(pitch);
      const allocation: IPitchAllocation = new PitchAllocation(
        zone.instrument as IMusicalInstrument,
        zone.voiceIndex as number,
        pitch,
      );
      tmpAllocations.push(allocation);
    });

    return tmpMusicUnit;
  }

  /**
   * Determines if pitches contained by the provided `IMusicUnit` depict a "shallow"
   * chord, that is a chord transporting little harmonic information due to excessive doubling, such as,
   * e.g., C4-C5-C6.
   *
   * NOTES:
   * Starting with v.1.5.1, we will avoid outputting "chords" like "C3-C4-C5", or (when applicable) "C3-E3-C5",
   * as the harmonic analyzer gives these good scores (for their lack of dissonances), whereas they really
   * sound dull and "neutral" at best.
   *
   * The rule employed will be:
   * << Each chord must have at least NUM_VOICES-1 different simple intervals (e.g., "decomposed intervals",
   * or INT_NAME % 12) against the bass, not counting the perfect prime. >>
   *
   * That is to say that I want at least two pitches that are different than the chord's bass pitch, not
   * counting doubling, in all chords that use at least three "voices".
   *
   * @param chord The chord to assess, as an `IMusicUnit`.
   * @returns `true` if the chord is shallow, `false` otherwise.
   */
  private isShallowChord(chord: IMusicUnit): boolean {
    const pitches = chord.pitches;
    const numPitches = pitches.filter((pitch) => pitch.midiNote !== 0).length;

    // If this "chord" is comprised of a lone pitch (which is possible if user sets the
    // "Number of voices" parameter to the minimum), then this function should not interfere, and it
    // should allow such a chord to "pass through", by declaring it valid (i.e., "not invalid").
    if (numPitches < 2) {
      return false;
    }

    // The chord is "shallow" (thus, "invalid") if its number of unique simple intervals observed against
    // the bass (not counting primes) is less than the minimum accepted number of unique intervals in a chord.
    const intervalsAgainstBass = this.getIntervalsAgainstBass(pitches, true, true);
    const minAcceptedNumIntervals = Math.min(numPitches - 1, REFERENCE_NUM_MIN_INTERVALS);
    return intervalsAgainstBass.length < minAcceptedNumIntervals;
  }

  /**
   * Returns an array with positive integers depicting all intervals forming by all upper pitches
   * against the lowest (i.e., bass) pitch. Optionally decomposes intervals, so that a major third
   * over one octave (16 semitones) will still read as a mere major third (4 semitones), and, also
   * optionally, omits perfect primes (0 semitones) entirely from the reported set.
   *
   * @param pitches The set of pitches to extract intervals from.
   * @param decomposeIntervals Whether to decompose intervals.
   * @param omitPrimes Whether to omit perfect primes.
   * @returns An array with all observed intervals.
   */
  private getIntervalsAgainstBass(
    pitches: readonly IMusicPitch[],
    decomposeIntervals: boolean,
    omitPrimes: boolean,
  ): number[] {
    const rawMidiValues: number[] = [];
    for (let i = 0; i < pitches.length; i++) {
      rawMidiValues.push((pitches[i] as IMusicPitch).midiNote);
    }
    // Explicit numeric comparator — the AS3 original relies on the default (lexicographic)
    // `.sort()`, a genuine bug (see file header). Fixed here.
    rawMidiValues.sort((a, b) => a - b);
    const bassNote = rawMidiValues.shift() as number;
    const intervals: number[] = [];
    for (let i = 0; i < rawMidiValues.length; i++) {
      const currNote = rawMidiValues[i] as number;
      let interval = Math.abs(bassNote - currNote);
      if (decomposeIntervals) {
        interval = interval % IntervalsSize.PERFECT_OCTAVE;
      }
      if (omitPrimes && interval === 0) {
        continue;
      }
      if (intervals.indexOf(interval) === -1) {
        intervals.push(interval);
      }
    }
    return intervals;
  }

  /**
   * Returns the total number of polyphonic voices the instruments currently in use can provide.
   * Results are cached.
   */
  private getTotalNumVoices(instruments: readonly IMusicalInstrument[]): number {
    if (!this.totalNumVoices) {
      let total = 0;
      for (let i = 0; i < instruments.length; i++) {
        total += (instruments[i] as IMusicalInstrument).maximumAutonomousVoices;
      }
      this.totalNumVoices = total;
    }
    return this.totalNumVoices;
  }

  /**
   * Returns the average "middle range" of the instruments currently in use. The source of this
   * information is the `idealHarmonicRange` setting of each instrument, which is usually somewhere
   * in the middle toward high instrument's range.
   */
  private getAverageMiddleRange(instruments: readonly IMusicalInstrument[]): number[] {
    if (!this.averageMiddleRange) {
      let lowLimitSum = 0;
      let highLimitSum = 0;
      for (let i = 0; i < instruments.length; i++) {
        const instrument = instruments[i] as IMusicalInstrument;
        lowLimitSum += instrument.idealHarmonicRange[0] as number;
        highLimitSum += instrument.idealHarmonicRange[1] as number;
      }
      const lowLimitAverage = Math.ceil(lowLimitSum / instruments.length);
      const highLimitAverage = Math.floor(highLimitSum / instruments.length);
      this.averageMiddleRange = [lowLimitAverage, highLimitAverage];
    }
    return this.averageMiddleRange;
  }

  /** Returns the highest pitch any of the instruments currently in use is able to produce. */
  private getHighestAvailablePitch(instruments: readonly IMusicalInstrument[]): number {
    if (!this.highestAvailablePitch) {
      let globalHighestPitch = 0;
      for (let i = 0; i < instruments.length; i++) {
        const localHighest = (instruments[i] as IMusicalInstrument).midiRange[1] as number;
        if (localHighest > globalHighestPitch) {
          globalHighestPitch = localHighest;
        }
      }
      this.highestAvailablePitch = globalHighestPitch;
    }
    return this.highestAvailablePitch;
  }

  /** Returns the lowest pitch any of the instruments currently in use is able to produce. */
  private getLowestAvailablePitch(instruments: readonly IMusicalInstrument[]): number {
    if (!this.lowestAvailablePitch) {
      let globalLowestPitch = Number.MAX_SAFE_INTEGER;
      for (let i = 0; i < instruments.length; i++) {
        const localLowest = (instruments[i] as IMusicalInstrument).midiRange[0] as number;
        if (localLowest < globalLowestPitch) {
          globalLowestPitch = localLowest;
        }
      }
      this.lowestAvailablePitch = globalLowestPitch;
    }
    return this.lowestAvailablePitch;
  }
}
