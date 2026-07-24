import { AbstractMusicalTrait } from '../../core/abstracts/AbstractMusicalTrait.js';
import { AnalysisContext } from '../../core/AnalysisContext.js';
import { CoreParameterNames } from '../../core/constants/CoreParameterNames.js';
import { DurationsReducerProcessor } from '../processors/DurationsReducerProcessor.js';
import { getRandomInteger } from '../../utils/NumberUtil.js';
import { MetricPlacement } from '../analyzers/MetricPlacement.js';
import { MultiCriterialSorter } from '../sources/MultiCriterialSorter.js';
import { RawDuration } from '../sources/RawDuration.js';
import type { IAnalysisContext } from '../../core/interfaces/IAnalysisContext.js';
import type { IMusicRequest } from '../../core/interfaces/IMusicRequest.js';
import type { IMusicUnit } from '../../core/interfaces/IMusicUnit.js';
import type { IMusicalContentAnalyzer } from '../../core/interfaces/IMusicalContentAnalyzer.js';
import type { IMusicalPostProcessor } from '../../core/interfaces/IMusicalPostProcessor.js';
import type { IMusicalTrait } from '../../core/interfaces/IMusicalTrait.js';
import type { IParameter } from '../../core/interfaces/IParameter.js';
import type { IParametersList } from '../../core/interfaces/IParametersList.js';
import type { IRawMusicSource } from '../../core/interfaces/IRawMusicSource.js';

// Minimum number of duration candidates to always generate per musical unit.
const MIN_NUM_CANDIDATES = 5;

type AnalyzerConstructor = new () => IMusicalContentAnalyzer;
type AnalyzerEntry = AnalyzerConstructor | IMusicalContentAnalyzer;

function isAnalyzerConstructor(entry: AnalyzerEntry): entry is AnalyzerConstructor {
  return typeof entry === 'function';
}

/**
 * Holds the class definitions of the `IMusicalContentAnalyzer` implementors to use, mutating in
 * place into cached instances on first use. Module-level, mirroring the AS3 original's
 * `private static const ANALYZERS`/`ANALYZERS_BY_NAME` -- shared across every `Duration`
 * instance/call, same convention already established in `Harmony.ts`. This registry is entirely
 * separate from `Harmony.ts`'s own (AS3 static fields are per-class, and so is each of these
 * modules' state).
 */
let analyzerEntries: AnalyzerEntry[] = [MetricPlacement];

/** Registry holding cached instances of `IMusicalContentAnalyzer`s, by their name. Same module-level sharing as `analyzerEntries`. */
const analyzersByName = new Map<string, IMusicalContentAnalyzer>();

const postProcessors: IMusicalPostProcessor[] = [new DurationsReducerProcessor()];

/**
 * `IMusicalTrait` implementation that assigns a duration to each generated music unit.
 * Generates multiple duration candidates, analyzes each, sorts by fitness, and selects the
 * best candidate.
 *
 * Ported from
 * `as-sources/legacy-generators-harmony/ro/se/legacy/generators/harmony/traits/Duration.as`.
 *
 * **Bug fixed: the same `percentTime`/`timeSlot` confusion already found and fixed in
 * `MetricPlacement.ts`, `VoiceCohesion.ts`, and `Harmony.ts` (see any of their file headers for
 * the full writeup).** `winSize`/`heterogeneity` were read via `getValueAt(..., percentTime)`
 * -- the raw `[0, 1)` ratio -- instead of the correctly-converted `time` variable computed right
 * above them and used correctly later (the `hazardParam` lookup). This is the fourth confirmed
 * instance of this exact bug pattern in the AS3 codebase; fixed the same way as the other three,
 * by using the already-computed `timeSlot` (renamed from `time` here for consistency with the
 * other fixed files) for both reads.
 *
 * **Injectable `randomFn`** (per this project's standing convention): threaded through to the
 * internal `RawDuration` instance and the final hazard-pick's `NumberUtil.getRandomInteger` call.
 */
export class Duration extends AbstractMusicalTrait implements IMusicalTrait {
  /** @param randomFn Seedable source of randomness, threaded through to the internal `RawDuration` and the final hazard-pick. Defaults to `Math.random`. */
  constructor(private readonly randomFn: () => number = Math.random) {
    super();
  }

  /** @see IMusicalTrait.musicalPostProcessors */
  override get musicalPostProcessors(): IMusicalPostProcessor[] {
    return postProcessors;
  }

  /**
   * Generates multiple duration candidates, analyzes each, sorts by composite fitness, and
   * assigns the best candidate to the target music unit.
   * @see IMusicalTrait.execute
   */
  override execute(targetMusicUnit: IMusicUnit, analysisContext: IAnalysisContext, parameters: IParametersList, request: IMusicRequest): void {
    // 1. SETUP
    const percentTime = analysisContext.percentTime;
    const timeSlot = Math.round(percentTime * 100);
    const settings = request.userSettings;

    // 2. CALCULATE NUMBER OF CANDIDATES TO GENERATE
    const winSizeParam = parameters.getByName(CoreParameterNames.ANALYSIS_WINDOW)[0] as IParameter;
    const winSize = settings.getValueAt(winSizeParam, timeSlot) as number; // BUG FIX (see file header)
    const heterogeneityParam = parameters.getByName(CoreParameterNames.HETEROGENEITY)[0] as IParameter;
    const heterogeneity = settings.getValueAt(heterogeneityParam, timeSlot) as number; // BUG FIX
    const numCandidates = Math.max(MIN_NUM_CANDIDATES, winSize * heterogeneity);

    // 3. GENERATE CANDIDATES
    const rawDurations: IMusicUnit[] = [];
    const rawSource: IRawMusicSource = new RawDuration(this.randomFn);
    for (let i = 0; i < numCandidates; i++) {
      const candidate = rawSource.output(targetMusicUnit, analysisContext, parameters, request)[0] as IMusicUnit;
      rawDurations.push(candidate);
    }

    // 4. ANALYZE ALL CANDIDATES
    let analyzer: IMusicalContentAnalyzer;
    for (let i = 0; i < rawDurations.length; i++) {
      const candidateUnit = rawDurations[i] as IMusicUnit;

      for (let j = 0; j < analyzerEntries.length; j++) {
        const entry = analyzerEntries[j] as AnalyzerEntry;

        // Initialize analyzer on first use.
        if (isAnalyzerConstructor(entry)) {
          analyzer = new entry();
          analyzerEntries[j] = analyzer;
          analyzersByName.set(analyzer.name, analyzer);
        } else {
          analyzer = entry;
        }

        // Analyze this candidate.
        analyzer.analyze(candidateUnit, analysisContext, parameters, request);
      }
    }

    // 5. SORT BY MULTI-CRITERIAL FITNESS
    const sorter: IRawMusicSource = new MultiCriterialSorter();
    const sorterContext: IAnalysisContext = new AnalysisContext();
    sorterContext.previousContent = rawDurations;
    sorterContext.percentTime = percentTime;
    const orderedDurations = sorter.output(targetMusicUnit, sorterContext, parameters, request);

    // 6. APPLY HAZARD AND PICK
    const hazardParam = parameters.getByName(CoreParameterNames.HAZARD)[0] as IParameter;
    const hazardPercent = (settings.getValueAt(hazardParam, timeSlot) as number) * 0.01;
    const sliceSize = Math.max(1, Math.min(orderedDurations.length, Math.floor(orderedDurations.length * hazardPercent)));
    const slicedDurations = orderedDurations.slice(0, sliceSize);
    const durationIndex = getRandomInteger(0, sliceSize - 1, this.randomFn);
    const chosenDuration = slicedDurations[durationIndex] as IMusicUnit;

    // 7. TRANSFER DURATION TO TARGET
    targetMusicUnit.duration = chosenDuration.duration;

    // 8. TRANSFER ANALYSIS SCORES (for debug/reference)
    const srcScores = chosenDuration.analysisScores;
    const targetScores = targetMusicUnit.analysisScores;
    if (!srcScores.isEmpty()) {
      srcScores.forEach((criteria) => {
        targetScores.add(criteria, srcScores.getValueFor(criteria));
        return true;
      });
    }
  }
}

/**
 * Test-only escape hatch to reset the module-level analyzer cache between test runs, since it's
 * deliberately shared across every `Duration` instance (see the class doc comment). Not part of
 * the public API surface ported from AS3 -- exported solely so tests can start from a clean
 * cache instead of leaking analyzer state mutated by earlier tests.
 */
export function resetAnalyzerCacheForTesting(): void {
  analyzerEntries = [MetricPlacement];
  analyzersByName.clear();
}
