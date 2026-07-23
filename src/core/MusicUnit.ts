import { generateRFC4122GUID } from '../utils/Strings.js';
import type { IFraction } from '../math/IFraction.js';
import { AnalysisScores } from './AnalysisScores.js';
import type { IAnalysisScores } from './interfaces/IAnalysisScores.js';
import type { IMusicPitch } from './interfaces/IMusicPitch.js';
import type { IMusicUnit } from './interfaces/IMusicUnit.js';
import type { IPerformanceInstruction } from './interfaces/IPerformanceInstruction.js';
import type { IPitchAllocation } from './interfaces/IPitchAllocation.js';
import type { ITupletDefinition } from './interfaces/ITupletDefinition.js';

/**
 * Default implementation of `IMusicUnit`.
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/ro/se/legacy/generators/core/MusicUnit.as`.
 */
export class MusicUnit implements IMusicUnit {
  private uidValue: string | undefined;
  private durationValue!: IFraction;
  private tupletRootUidValue = '';
  private tupletDefinitionValue!: ITupletDefinition;
  private readonly pitchesValue: IMusicPitch[] = [];
  private readonly pitchAllocationsValue: IPitchAllocation[] = [];
  private readonly performanceInstructionsValue: IPerformanceInstruction[] = [];
  private analysisScoresValue: IAnalysisScores | undefined;

  get uid(): string {
    if (this.uidValue === undefined) {
      this.uidValue = generateRFC4122GUID();
    }
    return this.uidValue;
  }

  get duration(): IFraction {
    return this.durationValue;
  }

  set duration(value: IFraction) {
    this.durationValue = value;
  }

  get tupletRootUid(): string {
    return this.tupletRootUidValue;
  }

  set tupletRootUid(value: string) {
    this.tupletRootUidValue = value;
  }

  get tupletDefinition(): ITupletDefinition {
    return this.tupletDefinitionValue;
  }

  set tupletDefinition(value: ITupletDefinition) {
    this.tupletDefinitionValue = value;
  }

  get pitches(): IMusicPitch[] {
    return this.pitchesValue;
  }

  get pitchAllocations(): IPitchAllocation[] {
    return this.pitchAllocationsValue;
  }

  get performanceInstructions(): IPerformanceInstruction[] {
    return this.performanceInstructionsValue;
  }

  get analysisScores(): IAnalysisScores {
    if (!this.analysisScoresValue) {
      this.analysisScoresValue = new AnalysisScores();
    }
    return this.analysisScoresValue;
  }

  clone(): IMusicUnit {
    const target = new MusicUnit();
    target.duration = this.durationValue;
    target.tupletDefinition = this.tupletDefinitionValue;
    target.tupletRootUid = this.tupletRootUidValue;
    copyArrayItems(this.pitchesValue, target.pitches);
    copyArrayItems(this.pitchAllocationsValue, target.pitchAllocations);
    copyArrayItems(this.performanceInstructionsValue, target.performanceInstructions);
    if (this.analysisScoresValue && !this.analysisScoresValue.isEmpty()) {
      const targetScores = target.analysisScores;
      this.analysisScoresValue.forEach((criteria, value) => {
        targetScores.add(criteria, value);
        return true;
      });
    }
    return target;
  }

  /** Overrides `Object.prototype.toString()`. Useful for debugging. */
  toString(): string {
    return [`MusicUnit (${this.uid})`, `[${this.pitchesValue.join()}]${this.durationValue ?? ''}`].join(', ');
  }
}

/** Copies items from one array to another. Items are passed by reference, NOT recreated. */
function copyArrayItems<T>(source: readonly T[], target: T[]): void {
  for (let i = 0; i < source.length; i++) {
    target[i] = source[i] as T;
  }
}
