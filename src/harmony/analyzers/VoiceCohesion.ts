import { AbstractContentAnalyzer } from '../../core/abstracts/AbstractContentAnalyzer.js';
import { CoreParameterNames } from '../../core/constants/CoreParameterNames.js';
import { Fraction } from '../../math/Fraction.js';
import { ParameterNames } from '../constants/ParameterNames.js';
import type { IAnalysisContext } from '../../core/interfaces/IAnalysisContext.js';
import type { IFraction } from '../../math/IFraction.js';
import type { IMusicRequest } from '../../core/interfaces/IMusicRequest.js';
import type { IMusicUnit } from '../../core/interfaces/IMusicUnit.js';
import type { IMusicalContentAnalyzer } from '../../core/interfaces/IMusicalContentAnalyzer.js';
import type { IMusicalInstrument } from '../../knowledge/instruments/IMusicalInstrument.js';
import type { IParameter } from '../../core/interfaces/IParameter.js';
import type { IParametersList } from '../../core/interfaces/IParametersList.js';

// Activity level buckets (coarse classification of exposure percentages).
const BUCKET_NONE = 'NONE'; // 0-33%
const BUCKET_SOME = 'SOME'; // 33-66%
const BUCKET_FULL = 'FULL'; // 66-100%

// Bucket center values for scoring.
const CENTER_NONE = 0;
const CENTER_SOME = 50;
const CENTER_FULL = 100;

// Neutral score returned on early exits.
const NEUTRAL_SCORE = 50;

// Transition table: maps (OLD-INTERIM-IMMEDIATE) pattern to ideal continuation.
// Follows arc heuristic: NONE -> SOME -> FULL -> SOME -> NONE.
const IDEAL_CONTINUATION: Readonly<Record<string, string>> = {
  'NONE-NONE-NONE': BUCKET_SOME, // Absent voice should emerge
  'NONE-NONE-SOME': BUCKET_FULL, // Emerging voice should peak
  'NONE-NONE-FULL': BUCKET_FULL, // Rising voice stays at peak
  'NONE-SOME-NONE': BUCKET_SOME, // Inconsistent; encourage return
  'NONE-SOME-SOME': BUCKET_FULL, // Rising voice should peak
  'NONE-SOME-FULL': BUCKET_FULL, // Rising voice at peak
  'NONE-FULL-NONE': BUCKET_SOME, // Erratic; encourage middle
  'NONE-FULL-SOME': BUCKET_SOME, // Tapering voice continues
  'NONE-FULL-FULL': BUCKET_FULL, // Peaked voice stays
  'SOME-NONE-NONE': BUCKET_NONE, // Fading voice rests
  'SOME-NONE-SOME': BUCKET_SOME, // Erratic; encourage consistency
  'SOME-NONE-FULL': BUCKET_FULL, // Resurgent voice peaks
  'SOME-SOME-NONE': BUCKET_NONE, // Fading voice rests
  'SOME-SOME-SOME': BUCKET_FULL, // Stable voice should peak
  'SOME-SOME-FULL': BUCKET_FULL, // Rising voice at peak
  'SOME-FULL-NONE': BUCKET_NONE, // Tapering voice rests
  'SOME-FULL-SOME': BUCKET_SOME, // Tapering voice continues
  'SOME-FULL-FULL': BUCKET_FULL, // Peaked voice stays
  'FULL-NONE-NONE': BUCKET_NONE, // Collapsed voice stays silent
  'FULL-NONE-SOME': BUCKET_SOME, // Erratic; encourage middle
  'FULL-NONE-FULL': BUCKET_FULL, // Erratic peak; sustain
  'FULL-SOME-NONE': BUCKET_NONE, // Tapering voice rests
  'FULL-SOME-SOME': BUCKET_SOME, // Tapering voice continues
  'FULL-SOME-FULL': BUCKET_FULL, // Resurgent voice peaks
  'FULL-FULL-NONE': BUCKET_NONE, // Peaked voice tapers to rest
  'FULL-FULL-SOME': BUCKET_SOME, // Peaked voice tapers
  'FULL-FULL-FULL': BUCKET_SOME, // Sustained peak should taper
};

/** One `{ unit, proportion }` entry: a music unit, and the fraction of its duration falling in a given section. */
interface SectionEntry {
  unit: IMusicUnit;
  proportion: number;
}

interface SectionBoundaries {
  oldEnd: IFraction;
  interimEnd: IFraction;
}

interface Sections {
  old: SectionEntry[];
  interim: SectionEntry[];
  immediate: SectionEntry[];
  boundaries: SectionBoundaries;
}

/**
 * Analyzes voice continuity and cohesion patterns in polyphonic textures.
 *
 * Evaluates whether pitch activity is concentrated in individual voices over time
 * (high cohesion) or scattered across all voices simultaneously (low cohesion).
 *
 * - Low values (0%) favor fragmented, Klangfarbenmelodie-style textures where pitches
 *   scatter across voices without sustained individual voice arcs.
 * - High values (100%) favor natural voice arcs where individual voices emerge from
 *   inactivity, build to full activity, then recede before yielding to other voices.
 *
 * Ported from
 * `as-sources/legacy-generators-harmony/ro/se/legacy/generators/harmony/analyzers/VoiceCohesion.as`.
 *
 * **Bug fixed: the `percentTime`/`timeSlot` confusion (see `MetricPlacement.ts`'s file header
 * for the same family of bug, and the standalone commit that renamed `ISettingsList`'s own
 * parameter to `timeSlot` specifically to prevent this).** `_shouldExitEarly` passes
 * `analysisContext.percentTime` (a `[0, 1)` ratio) *directly* as the `timeSlot` argument to two
 * `ISettingsList.getValueAt` calls, with no conversion at all. The project owner and I discussed
 * the precise mechanism this causes in the two languages, since it differs: in the AS3 original,
 * the target parameter's declared `uint` type coerces a fractional argument at the call boundary
 * (truncating e.g. `0.5` to `0`), so in practice only the value recorded at `timeSlot === 0` is
 * ever read, regardless of true position -- unfortunate (the two early-exit checks below never
 * see real time-varying data), but not a crash. TypeScript performs no such runtime coercion, so
 * porting this literally would have been worse, not equivalently "faithful": `getValueAt`'s
 * search would start at a fractional index and step by whole integers, matching no real
 * (integer) slot at all, eventually returning `null` from both calls -- and since
 * `null <= 3` is `true` (`null` coerces to `0` for numeric comparison), the `windowSize <= 3`
 * early-exit would fire *unconditionally*, making this analyzer permanently inert (always
 * `NEUTRAL_SCORE`) for the entire real generation range. Fixed by converting to a genuine
 * `timeSlot` first (`Math.round(analysisContext.percentTime * 100)`), matching every other
 * analyzer/source in this codebase.
 *
 * **`unit.duration` truthiness checks kept, even though this port's `IMusicUnit.duration` is
 * typed as always-present.** `MusicUnit.ts`'s backing field uses a definite-assignment assertion
 * (`!`), meaning a freshly-constructed, not-yet-configured unit can genuinely have `duration`
 * `undefined` at runtime despite the type claiming otherwise -- the AS3 original's own
 * `if (units[i].duration)` guards make sense for exactly this reason, and are preserved as-is.
 */
export class VoiceCohesion extends AbstractContentAnalyzer implements IMusicalContentAnalyzer {
  /** @see IMusicalContentAnalyzer.weight */
  override get weight(): number {
    return 0.82;
  }

  /** @see IMusicalContentAnalyzer.name */
  override get name(): string {
    return ParameterNames.VOICE_COHESION;
  }

  /**
   * Analyzes voice cohesion quality of a given chord within its context.
   *
   * Scores how well the candidate unit fits natural voice arc patterns based on
   * recent voice activity history. Higher scores indicate better adherence to
   * the arc heuristic (NONE -> SOME -> FULL -> SOME -> NONE).
   *
   * @see IMusicalContentAnalyzer.analyze
   */
  override analyze(
    targetMusicUnit: IMusicUnit,
    analysisContext: IAnalysisContext,
    parameters: IParametersList,
    request: IMusicRequest,
  ): void {
    // Early exit checks.
    if (this.shouldExitEarly(analysisContext, parameters, request)) {
      targetMusicUnit.analysisScores.add(ParameterNames.VOICE_COHESION, NEUTRAL_SCORE);
      return;
    }

    // Get all voice slots across the ensemble.
    const voiceSlots = this.collectVoiceSlots(request.instruments);
    if (voiceSlots.length === 0) {
      targetMusicUnit.analysisScores.add(ParameterNames.VOICE_COHESION, NEUTRAL_SCORE);
      return;
    }

    // Split analysis window into three sections.
    const sections = this.splitWindowIntoSections(analysisContext.previousContent);

    // Compute per-voice scores.
    const voiceScores: number[] = [];
    for (let i = 0; i < voiceSlots.length; i++) {
      const voiceSlot = voiceSlots[i] as string;
      const voiceScore = this.computeVoiceScore(voiceSlot, sections, targetMusicUnit, analysisContext.previousContent);
      voiceScores.push(voiceScore);
    }

    // Aggregate via geometric mean.
    const geometricMean = this.computeGeometricMean(voiceScores);
    const finalScore = Math.max(1, Math.round(geometricMean * 100));

    targetMusicUnit.analysisScores.add(ParameterNames.VOICE_COHESION, finalScore);
  }

  /** Checks early exit conditions that warrant neutral scoring. */
  private shouldExitEarly(analysisContext: IAnalysisContext, parameters: IParametersList, request: IMusicRequest): boolean {
    const settings = request.userSettings;
    // BUG FIX (see file header): convert to a genuine timeSlot before any getValueAt call.
    const timeSlot = Math.round(analysisContext.percentTime * 100);

    // Exit if VOICES_NUMBER >= 95% (all voices active all the time).
    const voicesParam = parameters.getByName(ParameterNames.VOICES_NUMBER)[0] as IParameter;
    const voicesPercent = settings.getValueAt(voicesParam, timeSlot) as number;
    if (voicesPercent >= 95) {
      return true;
    }

    // Exit if ANALYSIS_WINDOW <= 3.
    const windowParam = parameters.getByName(CoreParameterNames.ANALYSIS_WINDOW)[0] as IParameter;
    const windowSize = settings.getValueAt(windowParam, timeSlot) as number;
    if (windowSize <= 3) {
      return true;
    }

    const previousContent = analysisContext.previousContent;

    // Exit if less than 3 units in window.
    if (!previousContent || previousContent.length < 3) {
      return true;
    }

    // Exit if cumulated duration < 3/4.
    const totalDuration = this.computeTotalDuration(previousContent);
    const threeQuarters = new Fraction(3, 4);
    if (totalDuration.lessThan(threeQuarters)) {
      return true;
    }

    return false;
  }

  /**
   * Collects all voice slot identifiers across the ensemble.
   * Returns an array of strings: `"instrumentUID-voiceIndex"`.
   */
  private collectVoiceSlots(instruments: readonly IMusicalInstrument[]): string[] {
    const slots: string[] = [];

    for (let i = 0; i < instruments.length; i++) {
      const instrument = instruments[i] as IMusicalInstrument;
      const voiceCount = instrument.maximumAutonomousVoices;

      for (let v = 1; v <= voiceCount; v++) {
        const slotKey = `${instrument.uid}-${v}`;
        slots.push(slotKey);
      }
    }

    return slots;
  }

  /** Computes cumulated duration of all units in an array. */
  private computeTotalDuration(units: readonly IMusicUnit[]): IFraction {
    let total: IFraction = Fraction.ZERO;

    for (let i = 0; i < units.length; i++) {
      const unit = units[i] as IMusicUnit;
      if (unit.duration) {
        total = total.add(unit.duration);
      }
    }

    return total;
  }

  /**
   * Splits analysis window into three equal sections by cumulated duration.
   * Each section may contain partial unit contributions (proportional splits).
   */
  private splitWindowIntoSections(units: readonly IMusicUnit[]): Sections {
    const totalDuration = this.computeTotalDuration(units);
    const thirdDuration = totalDuration.divide(new Fraction(3, 1));

    const oldBoundary = thirdDuration;
    const interimBoundary = thirdDuration.multiply(new Fraction(2, 1));

    const sections: Sections = {
      old: [],
      interim: [],
      immediate: [],
      boundaries: {
        oldEnd: oldBoundary,
        interimEnd: interimBoundary,
      },
    };

    let cumulative: IFraction = Fraction.ZERO;

    for (let i = 0; i < units.length; i++) {
      const unit = units[i] as IMusicUnit;
      if (!unit.duration) {
        continue;
      }

      const unitStart = cumulative;
      const unitEnd = cumulative.add(unit.duration);

      this.distributeUnitAcrossSections(unit, unitStart, unitEnd, sections);

      cumulative = unitEnd;
    }

    return sections;
  }

  /**
   * Distributes a unit (or portions of it) across the three sections
   * based on where its time span falls relative to section boundaries.
   */
  private distributeUnitAcrossSections(unit: IMusicUnit, unitStart: IFraction, unitEnd: IFraction, sections: Sections): void {
    const oldEnd = sections.boundaries.oldEnd;
    const interimEnd = sections.boundaries.interimEnd;

    // Unit entirely in OLD section.
    if (unitEnd.lessThan(oldEnd) || unitEnd.equals(oldEnd)) {
      sections.old.push({ unit, proportion: 1.0 });
      return;
    }

    // Unit entirely in IMMEDIATE section.
    if (unitStart.greaterThan(interimEnd) || unitStart.equals(interimEnd)) {
      sections.immediate.push({ unit, proportion: 1.0 });
      return;
    }

    // Unit entirely in INTERIM section.
    if (
      (unitStart.greaterThan(oldEnd) || unitStart.equals(oldEnd)) &&
      (unitEnd.lessThan(interimEnd) || unitEnd.equals(interimEnd))
    ) {
      sections.interim.push({ unit, proportion: 1.0 });
      return;
    }

    // Unit spans OLD-INTERIM boundary.
    if (unitStart.lessThan(oldEnd) && unitEnd.greaterThan(oldEnd)) {
      const oldPortion = oldEnd.subtract(unitStart);
      const oldProportion = oldPortion.divide(unit.duration).floatValue;
      sections.old.push({ unit, proportion: oldProportion });

      const remainingStart = oldEnd;
      const remainingEnd = unitEnd;

      // Check if remainder crosses into IMMEDIATE.
      if (remainingEnd.greaterThan(interimEnd)) {
        const interimPortion = interimEnd.subtract(remainingStart);
        const interimProportion = interimPortion.divide(unit.duration).floatValue;
        sections.interim.push({ unit, proportion: interimProportion });

        const immediateProportion = 1.0 - oldProportion - interimProportion;
        sections.immediate.push({ unit, proportion: immediateProportion });
      } else {
        const interimProportionOnly = 1.0 - oldProportion;
        sections.interim.push({ unit, proportion: interimProportionOnly });
      }
      return;
    }

    // Unit spans INTERIM-IMMEDIATE boundary.
    if (unitStart.lessThan(interimEnd) && unitEnd.greaterThan(interimEnd)) {
      const interimPortionB = interimEnd.subtract(unitStart);
      const interimProportionB = interimPortionB.divide(unit.duration).floatValue;
      sections.interim.push({ unit, proportion: interimProportionB });

      const immediateProportionB = 1.0 - interimProportionB;
      sections.immediate.push({ unit, proportion: immediateProportionB });
    }
  }

  /** Computes score for a single voice slot based on its activity pattern. */
  private computeVoiceScore(voiceSlot: string, sections: Sections, candidateUnit: IMusicUnit, windowUnits: readonly IMusicUnit[]): number {
    // Compute exposure percentages for each section.
    const oldExposure = this.computeExposurePercentage(voiceSlot, sections.old);
    const interimExposure = this.computeExposurePercentage(voiceSlot, sections.interim);
    const immediateExposure = this.computeExposurePercentage(voiceSlot, sections.immediate);

    // Classify into buckets.
    const oldBucket = this.classifyIntoBucket(oldExposure);
    const interimBucket = this.classifyIntoBucket(interimExposure);
    const immediateBucket = this.classifyIntoBucket(immediateExposure);

    // Look up ideal continuation.
    const patternKey = `${oldBucket}-${interimBucket}-${immediateBucket}`;
    const idealBucket = IDEAL_CONTINUATION[patternKey];
    const idealCenter = this.bucketToCenter(idealBucket);

    // Slide window to include candidate, recompute IMMEDIATE section.
    const updatedImmediate = this.computeUpdatedImmediateExposure(voiceSlot, sections, candidateUnit, windowUnits);

    // Score the voice.
    const delta = Math.abs(updatedImmediate - idealCenter);
    const voiceScore = 1 - delta / 100;

    return Math.max(0, voiceScore); // Clamp to [0, 1].
  }

  /**
   * Computes exposure percentage for a voice slot within a section.
   */
  private computeExposurePercentage(voiceSlot: string, section: readonly SectionEntry[]): number {
    let exposureDuration: IFraction = Fraction.ZERO;
    let totalDuration: IFraction = Fraction.ZERO;

    for (let i = 0; i < section.length; i++) {
      const entry = section[i] as SectionEntry;
      const unit = entry.unit;
      const proportion = entry.proportion;

      if (!unit.duration) {
        continue;
      }

      const proportionalDuration = unit.duration.multiply(Fraction.fromDecimal(proportion));
      totalDuration = totalDuration.add(proportionalDuration);

      if (this.voiceIsActiveInUnit(voiceSlot, unit)) {
        exposureDuration = exposureDuration.add(proportionalDuration);
      }
    }

    if (totalDuration.numerator === 0) {
      return 0;
    }

    return exposureDuration.getPercentageOf(totalDuration) * 100;
  }

  /** Checks if a voice slot has at least one active (non-rest) pitch in a unit. */
  private voiceIsActiveInUnit(voiceSlot: string, unit: IMusicUnit): boolean {
    const allocations = unit.pitchAllocations;

    for (let i = 0; i < allocations.length; i++) {
      const allocation = allocations[i] as (typeof allocations)[number];
      const allocationSlot = `${allocation.instrument.uid}-${allocation.voiceIndex}`;

      if (allocationSlot === voiceSlot && allocation.allocatedPitch.midiNote !== 0) {
        return true;
      }
    }

    return false;
  }

  /** Classifies exposure percentage into coarse bucket. */
  private classifyIntoBucket(exposurePercent: number): string {
    if (exposurePercent < 33) {
      return BUCKET_NONE;
    }
    if (exposurePercent < 66) {
      return BUCKET_SOME;
    }
    return BUCKET_FULL;
  }

  /** Maps bucket name to its center value. */
  private bucketToCenter(bucket: string | undefined): number {
    switch (bucket) {
      case BUCKET_NONE:
        return CENTER_NONE;
      case BUCKET_SOME:
        return CENTER_SOME;
      case BUCKET_FULL:
        return CENTER_FULL;
      default:
        return CENTER_SOME;
    }
  }

  /** Slides window rightward to include candidate unit, recomputes IMMEDIATE section exposure. */
  private computeUpdatedImmediateExposure(
    voiceSlot: string,
    sections: Sections,
    candidateUnit: IMusicUnit,
    _windowUnits: readonly IMusicUnit[],
  ): number {
    // Early exit if candidate has no duration set.
    if (!candidateUnit.duration) {
      // Return current immediate exposure (no window slide).
      return this.computeExposurePercentage(voiceSlot, sections.immediate);
    }

    // Compute duration to shed from left (equal to candidate duration).
    const shedDuration = candidateUnit.duration;

    // Build updated immediate section by:
    // 1. Taking current immediate section.
    // 2. Adding candidate unit.
    // 3. Shedding equal duration from the left edge of the window.
    let updatedSection: SectionEntry[] = [];

    // Add existing immediate section.
    for (let i = 0; i < sections.immediate.length; i++) {
      updatedSection.push(sections.immediate[i] as SectionEntry);
    }

    // Add candidate.
    updatedSection.push({ unit: candidateUnit, proportion: 1.0 });

    // Compute total duration of updated section before shedding.
    const totalBeforeShed = this.computeSectionDuration(updatedSection);

    // Shed from left if section is now oversized.
    const targetDuration = sections.boundaries.interimEnd.subtract(sections.boundaries.oldEnd);

    if (totalBeforeShed.greaterThan(targetDuration)) {
      updatedSection = this.shedFromLeft(updatedSection, shedDuration);
    }

    // Recompute exposure in updated section.
    return this.computeExposurePercentage(voiceSlot, updatedSection);
  }

  /** Computes total duration of a section (sum of `unit.duration * proportion`). */
  private computeSectionDuration(section: readonly SectionEntry[]): IFraction {
    let total: IFraction = Fraction.ZERO;

    for (let i = 0; i < section.length; i++) {
      const entry = section[i] as SectionEntry;
      if (entry.unit.duration) {
        const proportional = entry.unit.duration.multiply(Fraction.fromDecimal(entry.proportion));
        total = total.add(proportional);
      }
    }

    return total;
  }

  /**
   * Sheds specified duration from left edge of section.
   * Returns new section with leftward content removed/reduced.
   */
  private shedFromLeft(section: readonly SectionEntry[], shedDuration: IFraction): SectionEntry[] {
    const result: SectionEntry[] = [];
    let remainingToShed = shedDuration;

    for (let i = 0; i < section.length; i++) {
      const entry = section[i] as SectionEntry;
      if (!entry.unit.duration) {
        continue;
      }

      const entryDuration = entry.unit.duration.multiply(Fraction.fromDecimal(entry.proportion));

      if (remainingToShed.greaterThan(entryDuration) || remainingToShed.equals(entryDuration)) {
        // Shed entire entry.
        remainingToShed = remainingToShed.subtract(entryDuration);
        continue;
      }

      if (remainingToShed.greaterThan(Fraction.ZERO)) {
        // Partially shed this entry.
        const keptDuration = entryDuration.subtract(remainingToShed);
        const newProportion = keptDuration.divide(entry.unit.duration).floatValue;
        result.push({ unit: entry.unit, proportion: newProportion });
        remainingToShed = Fraction.ZERO;
      } else {
        // Keep entire entry.
        result.push(entry);
      }
    }

    return result;
  }

  /** Computes geometric mean of voice scores. */
  private computeGeometricMean(scores: readonly number[]): number {
    if (scores.length === 0) {
      return 0.5;
    }

    let product = 1;
    for (let i = 0; i < scores.length; i++) {
      product *= scores[i] as number;
    }

    return Math.pow(product, 1 / scores.length);
  }
}
