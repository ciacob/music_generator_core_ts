import { AbstractMusicalTrait } from '../../core/abstracts/AbstractMusicalTrait.js';
import { AnalysisContext } from '../../core/AnalysisContext.js';
import { ChordProgression } from '../analyzers/ChordProgression.js';
import { CoreParameterNames } from '../../core/constants/CoreParameterNames.js';
import { getRandomInteger } from '../../utils/NumberUtil.js';
import { HarmonicDistribution } from '../analyzers/HarmonicDistribution.js';
import { IntrinsicConsonance } from '../analyzers/IntrinsicConsonance.js';
import { MelodicProfile } from '../analyzers/MelodicProfile.js';
import { MultiCriterialSorter } from '../sources/MultiCriterialSorter.js';
import { ParameterCommons } from '../constants/ParameterCommons.js';
import { ParameterNames } from '../constants/ParameterNames.js';
import { RandomChord } from '../sources/RandomChord.js';
import { VoiceCohesion } from '../analyzers/VoiceCohesion.js';
import type { IAnalysisContext } from '../../core/interfaces/IAnalysisContext.js';
import type { IMusicPitch } from '../../core/interfaces/IMusicPitch.js';
import type { IMusicRequest } from '../../core/interfaces/IMusicRequest.js';
import type { IMusicUnit } from '../../core/interfaces/IMusicUnit.js';
import type { IMusicalContentAnalyzer } from '../../core/interfaces/IMusicalContentAnalyzer.js';
import type { IMusicalPostProcessor } from '../../core/interfaces/IMusicalPostProcessor.js';
import type { IMusicalTrait } from '../../core/interfaces/IMusicalTrait.js';
import type { IParameter } from '../../core/interfaces/IParameter.js';
import type { IParametersList } from '../../core/interfaces/IParametersList.js';
import type { IPitchAllocation } from '../../core/interfaces/IPitchAllocation.js';
import type { IRawMusicSource } from '../../core/interfaces/IRawMusicSource.js';

// Factor to reduce number of generated chords by, when the "Enforce minimum consonance" parameter is in effect.
const ENFORCE_CONSONANCE_EASE_FACTOR = 0.05;

// Minimum number of chords to always generate per musical unit.
const MIN_NUM_CHORDS = 5;

type AnalyzerConstructor = new () => IMusicalContentAnalyzer;
type AnalyzerEntry = AnalyzerConstructor | IMusicalContentAnalyzer;

function isAnalyzerConstructor(entry: AnalyzerEntry): entry is AnalyzerConstructor {
  return typeof entry === 'function';
}

/**
 * Holds the class definitions of the `IMusicalContentAnalyzer` implementors to use. After
 * initializing each class, the resulting instance replaces its corresponding class definition
 * in place.
 *
 * Module-level (not a class field), deliberately mirroring the AS3 original's `private static
 * const ANALYZERS`/`ANALYZERS_BY_NAME`: shared across *every* `Harmony` instance/call, not
 * per-instance state, so each analyzer's `.threshold` persists and adapts across an entire
 * generation run (see the "adjust threshold and try again" logic below) regardless of how many
 * `Harmony` instances exist or how many times `execute()` is called.
 */
let analyzerEntries: AnalyzerEntry[] = [MelodicProfile, IntrinsicConsonance, ChordProgression, HarmonicDistribution, VoiceCohesion];

/** Registry holding cached instances of `IMusicalContentAnalyzer`s, by their name. Same module-level sharing as `analyzerEntries`. */
const analyzersByName = new Map<string, IMusicalContentAnalyzer>();

/** Computes the simple average of the given values. Returns `NaN` for an empty array (matching the AS3 original's `0/0`). */
function average(values: readonly number[]): number {
  let sum = 0;
  for (const value of values) {
    sum += value;
  }
  return sum / values.length;
}

/**
 * Converts an analyzer's percent weight into a threshold bump multiplier.
 * Lower weights produce larger multipliers, making it easier for low-priority
 * analyzers to match when nothing has matched. The multiplier is capped at 2.0,
 * which corresponds to a weight of zero.
 */
function weightToThresholdMultiplier(factor: number): number {
  if (factor > 1) {
    return Math.min(2, factor);
  }
  return 1 - factor + 1;
}

/**
 * The main harmony-generation trait: generates candidate chords, analyzes and filters them,
 * sorts survivors from fittest to least fit, picks one (with a controllable degree of
 * randomness via the "Hazard" parameter), and transfers the result onto `targetMusicUnit`.
 *
 * Ported from
 * `as-sources/legacy-generators-harmony/ro/se/legacy/generators/harmony/traits/Harmony.as`.
 *
 * **Bug fixed: three `getValueAt` calls read the raw `[0, 1)` `percentTime` ratio directly,
 * instead of the correctly-converted `timeSlot`.** The AS3 original computes a correctly
 * converted `time` variable right at the top (`Math.round(percentTime * 100)`), and even uses
 * it correctly later (the `hazardParam` lookup) — but `winSize`, `heterogeneity`, and
 * `errorMargin` are each read via `getValueAt(..., percentTime)` instead, the same family of
 * bug as `MetricPlacement.ts`/`VoiceCohesion.ts` (see either file's header for the full
 * writeup, and the standalone commit that renamed `ISettingsList`'s own parameter to
 * `timeSlot` specifically to prevent this). This is the widest-reaching instance of the bug
 * found so far: `winSize`/`heterogeneity` together determine `numChordsToTry` (how many
 * candidate chords get generated and tested per call), and `errorMargin` determines the
 * acceptance threshold for every analyzer — all three would always read whatever was recorded
 * at `timeSlot === 0` (per the AS3 `uint` truncation semantics discussed with the project
 * owner), never the piece's true current position. Fixed by using the already-computed
 * `timeSlot` for all three.
 *
 * **Injectable `randomFn`** (per this project's standing convention): threaded through to the
 * internal `RandomChord` instance and the final hazard-pick's `NumberUtil.getRandomInteger`
 * call, defaulting to `Math.random`.
 *
 * **`musicalPostProcessors` returns `[]`, not `null`.** The AS3 original's getter returns
 * `null` (with a "TODO Auto Generated method stub" comment suggesting it was never actually
 * implemented) — this port's `IMusicalTrait.musicalPostProcessors` is honestly typed as always
 * a real array, so `[]` (semantically identical: "no post-processors") is used instead.
 */
export class Harmony extends AbstractMusicalTrait implements IMusicalTrait {
  /** @param randomFn Seedable source of randomness, threaded through to the internal `RandomChord` and the final hazard-pick. Defaults to `Math.random`. */
  constructor(private readonly randomFn: () => number = Math.random) {
    super();
  }

  /** @see IMusicalTrait.musicalPostProcessors */
  override get musicalPostProcessors(): IMusicalPostProcessor[] {
    return [];
  }

  /** @see IMusicalTrait.execute */
  override execute(targetMusicUnit: IMusicUnit, analysisContext: IAnalysisContext, parameters: IParametersList, request: IMusicRequest): void {
    // Obtain current percent time (a [0, 1) ratio), and its correctly-converted timeSlot (1-100).
    const percentTime = analysisContext.percentTime;
    const timeSlot = Math.round(percentTime * 100);
    const settings = request.userSettings;

    // Generate and assess raw material. Only chords passing a preliminary validation/fitness
    // test are added as raw/potential chords. Chords are generated and validated one by one.
    const rawChords: IMusicUnit[] = [];
    const rawSource: IRawMusicSource = new RandomChord(this.randomFn);
    const winSizeParam = parameters.getByName(CoreParameterNames.ANALYSIS_WINDOW)[0] as IParameter;
    // BUG FIX (see file header): use timeSlot, not the raw percentTime.
    const winSize = settings.getValueAt(winSizeParam, timeSlot) as number;
    const heterogeneityParam = parameters.getByName(CoreParameterNames.HETEROGENEITY)[0] as IParameter;
    const heterogeneity = settings.getValueAt(heterogeneityParam, timeSlot) as number; // BUG FIX
    let numChordsToTry = winSize * heterogeneity;

    // The "Enforce minimum consonance" boolean parameter imposes a huge performance hit, while dramatically
    // improving the quality of the chords returned. It thus makes sense to drastically reduce the number of
    // tries while this parameter is in effect.
    const enforceConsonanceParam = parameters.getByName(ParameterNames.ENFORCE_CONSONANCE)[0] as IParameter;
    const isEnforcingConsonance = settings.getValueAt(enforceConsonanceParam, 0) === 1;
    if (isEnforcingConsonance) {
      numChordsToTry = Math.max(MIN_NUM_CHORDS, Math.floor(numChordsToTry * ENFORCE_CONSONANCE_EASE_FACTOR));
    }
    let numTries = numChordsToTry;

    // Starting with 1.5.0, all randomly generated chords must pass a preliminary validation test in order
    // to be even considered for use. The test consists in comparing every chord score to its corresponding
    // expected value, and the resulting delta to a threshold, calculated based on a user configurable
    // error margin.
    const errMarginParam = parameters.getByName(CoreParameterNames.ERROR_MARGIN)[0] as IParameter;
    const errorMargin = (settings.getValueAt(errMarginParam, timeSlot) as number) / 100; // BUG FIX

    let possibleUnit: IMusicUnit;

    do {
      // Generate one chord.
      possibleUnit = rawSource.output(targetMusicUnit, analysisContext, parameters, request)[0] as IMusicUnit;

      // Analyze it: analysis computes and stores chord scores within its `analysisScores` property.
      const normThreshold = Math.round(errorMargin * 100);
      let analyzer: IMusicalContentAnalyzer;
      for (let i = 0; i < analyzerEntries.length; i++) {
        const entry = analyzerEntries[i] as AnalyzerEntry;
        if (isAnalyzerConstructor(entry)) {
          analyzer = new entry();

          // Mutate array entry from a class definition to a class instance.
          analyzerEntries[i] = analyzer;

          // Cache the class instance by a conventional name.
          analyzersByName.set(analyzer.name, analyzer);

          analyzer.threshold = normThreshold;
        } else {
          analyzer = entry;
        }

        // Note: analysis stores outcome on the analyzed unit itself. Each unit
        // maintains dedicated storage where analyzers can put their respective scores.
        analyzer.analyze(possibleUnit, analysisContext, parameters, request);
      }

      // Only retain those chords whose scores ALL fall within a set threshold.
      let isValidChord = true;
      const deltas: number[] = [];

      possibleUnit.analysisScores.forEach((criteria, value) => {
        // If any one of the scores already failed the test, don't do any further testing.
        if (!isValidChord) {
          return;
        }

        // Note: since we are inside a closure, it is safer if we re-read these values instead of
        // using their snapshot stored at closure creation time, e.g., we prefer to re-read the
        // `percentTime` into a local variable.
        const pTime = Math.round(analysisContext.percentTime * 100);
        const parameter = parameters.getByName(criteria)[0] as IParameter;

        // We skip checking contextual parameters at the beginning of the fragment, because there
        // is no context yet these parameters could refer to.
        if (value === ParameterCommons.NA_RESERVED_VALUE || (pTime === 0 && parameter.isContextual)) {
          return; // returning without a value only skips the current iteration (`false` exits the loop)
        }

        const uSettings = request.userSettings;
        const expectedValue = uSettings.getValueAt(parameter, pTime) as number;
        const delta = Math.abs(value - expectedValue);
        deltas.push(delta);

        const scoringAnalyzer = analyzersByName.get(criteria) as IMusicalContentAnalyzer;
        if (delta >= scoringAnalyzer.threshold) {
          isValidChord = false;
        }
      });

      if (isValidChord) {
        rawChords.push(possibleUnit);

        // If we collected at least one "perfect match", we end our search.
        const averageDelta = average(deltas);
        if (averageDelta === 0) {
          break;
        }

        // Exit early if we have collected enough acceptable chords (at least `winSize`,
        // as determined by the ANALYSIS_WINDOW parameter).
        if (rawChords.length >= winSize) {
          break;
        }
      }
      numTries--;

      // If we have exhausted the number of chords to be tried, yet we found no match,
      // that could mean the threshold cannot be met (in current context at least). Adjust
      // the threshold and try again.
      if (numTries === 0 && rawChords.length === 0) {
        let madeChanges = false;
        for (let i = 0; i < analyzerEntries.length; i++) {
          const entry = analyzerEntries[i] as AnalyzerEntry;
          if (!isAnalyzerConstructor(entry)) {
            if (entry.threshold < 100) {
              entry.threshold = weightToThresholdMultiplier(entry.weight) * entry.threshold;
              if (entry.threshold > 100) {
                entry.threshold = 100;
              }
              madeChanges = true;
            }
          }
        }
        if (madeChanges) {
          numTries = numChordsToTry;
        }
      }
    } while (numTries > 0);

    // Sort the chords, from fittest to most unsuitable.
    const sorter: IRawMusicSource = new MultiCriterialSorter();
    const sorterContext: IAnalysisContext = new AnalysisContext();
    sorterContext.previousContent = rawChords;
    sorterContext.percentTime = percentTime;
    const orderedChords = sorter.output(targetMusicUnit, sorterContext, parameters, request);

    // Pick one random acceptable chord based on the "Hazard" Parameter.
    const hazardParam = parameters.getByName(CoreParameterNames.HAZARD)[0] as IParameter;
    const hazardPercent = (request.userSettings.getValueAt(hazardParam, timeSlot) as number) * 0.01;
    // AS3 assigns a Number to an `int`-typed local here, which truncates (not rounds) toward zero.
    let sliceSize = Math.trunc(orderedChords.length * hazardPercent);
    sliceSize = Math.max(1, sliceSize);
    sliceSize = Math.min(orderedChords.length, sliceSize);
    const slicedChords = orderedChords.slice(0, sliceSize);
    const chordIndex = getRandomInteger(0, sliceSize - 1, this.randomFn);
    const chosenChord = slicedChords[chordIndex] as IMusicUnit;

    // Transfer the analysis scores to the target MusicUnit, for further reference and debug.
    //
    // Note: while we generated and manipulated many MusicUnits in this code, they were all transient/
    // volatile. Their end goal was only to reveal the best way to mutate our injected `targetMusicUnit`
    // instance.
    const srcScores = chosenChord.analysisScores;
    const targetScores = targetMusicUnit.analysisScores;
    if (!srcScores.isEmpty()) {
      srcScores.forEach((criteria) => {
        const srcVal = srcScores.getValueFor(criteria);
        targetScores.add(criteria, srcVal);
        return true;
      });
    }

    // Transfer pitches from the picked chord to the target MusicUnit. Note that instrument transposition is
    // NOT taken into account at this level. IF transposition is to be observed, it will be handled
    // by the client code, e.g., before converting generated material into musical notation/MIDI events.
    const srcPitches = chosenChord.pitches;
    const targetPitches = targetMusicUnit.pitches;
    targetPitches.length = 0;
    for (let i = 0; i < srcPitches.length; i++) {
      targetPitches[i] = srcPitches[i] as IMusicPitch;
    }

    // Also transfer allocations from the picked chord to the target MusicUnit, if available (i.e., if
    // generated pitches were already distributed among the available instruments).
    const srcAllocations = chosenChord.pitchAllocations;
    const targetAllocations = targetMusicUnit.pitchAllocations;
    targetAllocations.length = 0;
    for (let i = 0; i < srcAllocations.length; i++) {
      targetAllocations[i] = srcAllocations[i] as IPitchAllocation;
    }
  }
}

/**
 * Test-only escape hatch to reset the module-level analyzer cache between test runs, since it's
 * deliberately shared across every `Harmony` instance (see the class doc comment). Not part of
 * the public API surface ported from AS3 -- exported solely so tests can start from a clean
 * cache instead of leaking analyzer thresholds mutated by earlier tests.
 */
export function resetAnalyzerCacheForTesting(): void {
  analyzerEntries = [MelodicProfile, IntrinsicConsonance, ChordProgression, HarmonicDistribution, VoiceCohesion];
  analyzersByName.clear();
}
