import { generateRFC4122GUID, isAny } from '../../utils/Strings.js';
import { generateRandomColor } from '../../utils/ColorUtils.js';
import { getAllValues } from '../../utils/ConstantUtils.js';
import { Fraction } from '../../math/Fraction.js';
import type { IFraction } from '../../math/IFraction.js';
import { AnalysisContext } from '../AnalysisContext.js';
import { MusicUnit } from '../MusicUnit.js';
import { MusicalBody } from '../MusicalBody.js';
import { Parameter } from '../Parameter.js';
import { ParametersList } from '../ParametersList.js';
import { CoreOperationKeys } from '../constants/CoreOperationKeys.js';
import { CoreParameterNames } from '../constants/CoreParameterNames.js';
import type { IAnalysisContext } from '../interfaces/IAnalysisContext.js';
import type { GenerationCallback, IGeneratorModule } from '../interfaces/IGeneratorModule.js';
import type { IMusicRequest } from '../interfaces/IMusicRequest.js';
import type { IMusicUnit } from '../interfaces/IMusicUnit.js';
import type { IMusicalBody } from '../interfaces/IMusicalBody.js';
import type { IMusicalPostProcessor } from '../interfaces/IMusicalPostProcessor.js';
import type { IMusicalTrait } from '../interfaces/IMusicalTrait.js';
import type { IParameter } from '../interfaces/IParameter.js';
import type { IParametersList } from '../interfaces/IParametersList.js';

const NO_DURATION_MUSIC_UNIT =
  'An IMusicUnit instance was produced that has no musical duration. Check the relevant IMusicTrait instance in your generator.';
const NO_TRAITS_DEFINED = 'No IMusicalTrait instances are defined by this generator.';

/**
 * `IParameter.color` for this class's own default parameters. The AS3
 * original used `Colors.CHROME_COLOR_DARKER`, from a class
 * (`eu.stochastic.engine.legacy.Colors`) that isn't part of this
 * project's copied 133-file source snapshot at all (a genuinely missing
 * external dependency, not merely an unported file within scope). Since
 * the exact original value is unavailable and `color` only matters to a
 * UI that does color-coding (never to generation logic itself, per
 * `IParameter.color`'s own doc), a plausible placeholder is substituted
 * here instead of inventing a fake "port" of a class this project never
 * had access to.
 */
const DEFAULT_PARAMETER_COLOR = 0x4a4a4a;

/**
 * Yields control back to the event loop. Replaces the AS3 original's
 * `Time.advancedDelay`-based pacing between iterations — see this file's
 * top-of-class comment for the full rationale.
 *
 * Prefers `setImmediate` (Node-specific, runs as soon as the current
 * operation completes, before I/O callbacks) since that's the specific
 * mechanism settled on when this rearchitecture was discussed; falls
 * back to `setTimeout(fn, 0)` (available everywhere, including browsers)
 * if `setImmediate` isn't present in the running environment.
 */
function yieldToEventLoop(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof setImmediate === 'function') {
      setImmediate(resolve);
    } else {
      setTimeout(resolve, 0);
    }
  });
}

/**
 * Generic implementation for the app's music generator module base class.
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/ro/se/legacy/generators/core/abstracts/AbstractGeneratorModule.as`.
 *
 * **The generation loop's execution model was deliberately rearchitected,
 * not ported verbatim** (discussed and agreed before writing this file).
 * The AS3 original ran generation as a callback-driven pseudo-thread: a
 * generic `_executeAsyncWhile(iteration, condition, onComplete, delay)`
 * helper simulated a coroutine using `next()`/`exit()` closures and a
 * real `Time.advancedDelay` timer between iterations, so Flash's single
 * UI thread stayed responsive during a long generation run. A Node (or
 * browser) library has no such UI thread to protect, and there is no
 * meaningful "keep the UI painting" benefit to preserve — so rather than
 * port that closure machinery (which doesn't map onto async/await
 * cleanly, and would be an odd, hard-to-follow thing to carry into a
 * language that already has real coroutines via `async`/`await`), the
 * three nested loops here (raw-generation loop, per-unit trait loop,
 * post-processor loop) are plain `async` functions using ordinary
 * `while`/`for` loops and `await yieldToEventLoop()` between iterations.
 * `generate()` itself is `async`, returning a `Promise<void>` a caller
 * can `await`; progress/completion/error/abort are still reported
 * exclusively through `callback`, exactly as before.
 *
 * The original's exact abort/error semantics are preserved even though
 * the closures that implemented them are gone: if `abort()`/an error is
 * detected inside the deepest (trait) loop, generation stops immediately
 * — no further raw generation, no post-processing, `onAbort`/`onError`
 * fires exactly once, and no further generation logic runs. See
 * `runRawGenerationLoop`/`provideMusicUnit`/`runPostProcessorLoop` below.
 *
 * **Bug fixed**: the AS3 original's `parametersList` getter lazily
 * creates `_parameters` once, but then unconditionally `.push()`es its 4
 * default parameters (Analysis Window, Heterogeneity, Hazard, Error
 * Margin) on *every single call* — and `parametersList` is read
 * repeatedly during a single generation run (once per trait per music
 * unit, at minimum, via `_getUpdatedContext`/`_doMusicalTrait`). In the
 * original, this means the parameter list keeps silently growing with
 * duplicate default parameters throughout a run — a real, severe bug,
 * not a hypothetical one. Fixed here by moving the `push()` inside the
 * lazy-creation guard, so the 4 defaults are only ever added once,
 * matching what the class's own doc comment already says subclasses
 * should assume ("subclasses must ADD to this list rather than replace
 * it" implies a stable base list, not one that mutates on every read).
 */
export abstract class AbstractGeneratorModule implements IGeneratorModule {
  static readonly STATUS_IN_PROGRESS = 'in progress';
  static readonly STATUS_ABORTED = 'aborted';
  static readonly STATUS_COMPLETED = 'completed';
  /** @remarks Declared but never actually emitted anywhere in the AS3 original either — a pre-existing, verified gap, not invented here. */
  static readonly STATUS_POST_PROCESSING = 'processing';
  static readonly STATUS_ERROR = 'error';
  static readonly NO_DURATION_MUSIC_UNIT = NO_DURATION_MUSIC_UNIT;
  static readonly NO_TRAITS_DEFINED = NO_TRAITS_DEFINED;

  private instanceUidValue: string | undefined;
  private zeroFractionValue: IFraction | undefined;
  private requestValue: IMusicRequest | undefined;
  private callbackValue: GenerationCallback | undefined;
  private abortFlagValue = false;
  private errorFlagValue = false;
  private readonly errorMessages: string[] = [];
  private refinedMusicalBodyValue: IMusicalBody | null = null;
  private rawMusicalBodyValue: IMusicalBody | null = null;
  private currentMusicUnitValue: IMusicUnit | null = null;
  private percentCompletedValue = 0;
  private musicalPostProcessorsValue: IMusicalPostProcessor[] | null = null;
  private musicalPostProcessorsIdsValue: string[] | null = null;
  private parametersValue: IParametersList | undefined;

  /** @see IGeneratorModule.generate */
  async generate(request: IMusicRequest): Promise<void> {
    // Reset/revert session variables
    this.abortFlagValue = false;
    this.errorFlagValue = false;
    this.percentCompletedValue = 0;
    this.errorMessages.length = 0;

    if (this.musicalPostProcessorsValue) {
      this.musicalPostProcessorsValue.length = 0;
    }
    if (this.musicalPostProcessorsIdsValue) {
      this.musicalPostProcessorsIdsValue.length = 0;
    }
    this.refinedMusicalBodyValue = null;

    // Prepare
    this.requestValue = request;
    this.rawMusicalBodyValue = new MusicalBody();

    // MAIN LOOP: runs until the "expected" and "actual" generated music
    // durations match as close as possible (subject to the available
    // musical durations' granularity).
    await this.runRawGenerationLoop();

    if (this.abortFlagValue) {
      this.onAbort();
      return;
    }
    if (this.errorFlagValue) {
      this.onError();
      return;
    }

    // If there were any post-processors collected along the way,
    // asynchronously run them before finalizing.
    if (this.musicalPostProcessorsValue) {
      await this.runPostProcessorLoop();
      if (this.abortFlagValue) {
        this.onAbort();
        return;
      }
      if (this.errorFlagValue) {
        this.onError();
        return;
      }
    }

    this.finalizeGeneration();
  }

  /** @see IGeneratorModule.abort */
  abort(): void {
    this.abortFlagValue = true;
  }

  /** @see IGeneratorModule.callback */
  set callback(value: GenerationCallback) {
    this.callbackValue = value;
  }

  /**
   * @see IGeneratorModule.lastResult
   * Returns an empty `IMusicalBody` if no generation has completed yet,
   * rather than the AS3 original's `null` (which would violate this
   * property's own declared non-nullable type) — same reasoning as
   * `AnalysisContext`'s defaults elsewhere in this project.
   */
  get lastResult(): IMusicalBody {
    if (!this.refinedMusicalBodyValue) {
      this.refinedMusicalBodyValue = new MusicalBody();
    }
    return this.refinedMusicalBodyValue;
  }

  /** @see IGeneratorModule.moduleUid */
  abstract get moduleUid(): string;

  /** @see IGeneratorModule.instanceUid */
  get instanceUid(): string {
    if (this.instanceUidValue === undefined) {
      this.instanceUidValue = generateRFC4122GUID();
    }
    return this.instanceUidValue;
  }

  /** @see IGeneratorModule.info */
  get info(): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    data.moduleUid = this.moduleUid;

    const BASELINE = {
      label: '',
      borderColor: '#ffffff',
      backgroundColor: '#ffffff',
      data: [0],
    };

    const settings = (this.requestValue as IMusicRequest).userSettings;
    const coreParamNames = getAllValues(CoreParameterNames) as string[];
    const datasets: Record<string, unknown>[] = [BASELINE];
    const labels: number[] = [];
    data.chartSource = { labels, datasets };

    // Provide a 1/100 reference grid
    for (let i = 0; i <= 100; i += 1) {
      labels.push(i);
    }

    // Create one dataset for each custom parameter
    for (let j = 0; j < this.parametersList.length; j++) {
      const param = this.parametersList.getAt(j);

      // We will not render core parameters
      if (isAny(param.name, ...coreParamNames)) {
        continue;
      }

      // There is no point rendering single-value parameters in the chart
      if (param.type !== CoreOperationKeys.TYPE_ARRAY) {
        continue;
      }

      // Rendering each parameter. Array typed parameters hold unsigned
      // integers (e.g. 1 to 100) instead of Numbers (e.g. 0.01 to 1), so
      // no further conversion is needed here.
      const values: number[] = [];
      for (const pointInTime of labels) {
        const rawValue = settings.getValueAt(param, pointInTime);
        values.push(typeof rawValue === 'number' ? rawValue : NaN);
      }

      datasets.push({
        label: param.name,
        borderColor: `#${generateRandomColor().toString(16)}`,
        data: values,
      });
    }

    // Create one dataset for each analysis criteria
    if (this.lastResult.length > 0) {
      const due = (this.requestValue as IMusicRequest).timeMap.duration;
      const criteriaDatasets: Record<string, { label: string; borderColor: string; data: number[] }> = {};
      this.lastResult.forEach((unit) => {
        const scores = unit.analysisScores;
        if (!scores.isEmpty()) {
          scores.forEach((criteria, value) => {
            if (!(criteria in criteriaDatasets)) {
              criteriaDatasets[criteria] = {
                label: `CRITERIA: ${criteria}`,
                borderColor: `#${generateRandomColor().toString(16)}`,
                data: [],
              };
            }
            const criteriaDataSet = criteriaDatasets[criteria] as { data: number[] };
            // Approximate each IMusicUnit span with respect to the reference grid
            let unitSpan = Math.round(unit.duration.getPercentageOf(due) * labels.length);
            while (unitSpan > 0) {
              criteriaDataSet.data.push(value);
              unitSpan--;
            }
            return true;
          });
        }
      });
      for (const datasetName of Object.keys(criteriaDatasets)) {
        datasets.push(criteriaDatasets[datasetName] as Record<string, unknown>);
      }
    }

    return data;
  }

  /**
   * @see IGeneratorModule.parametersList
   * Note subclasses must ADD to this list rather than replace it, e.g.:
   *
   * ```ts
   * override get parametersList(): IParametersList {
   *   super.parametersList.push(
   *     // subclass parameters must be defined here
   *   );
   *   return super.parametersList;
   * }
   * ```
   */
  get parametersList(): IParametersList {
    if (!this.parametersValue) {
      this.parametersValue = new ParametersList();
      this.parametersValue.push(
        // Analysis Window: how many previously generated music units to
        // observe when deciding what music unit to add next; by default `7`.
        ((): IParameter => {
          const parameter = new Parameter();
          parameter.type = CoreOperationKeys.TYPE_INT;
          parameter.name = CoreParameterNames.ANALYSIS_WINDOW;
          parameter.uid = 'd4a81aa1-f9a2-4c92-be0a-5f7911747be0';
          parameter.color = DEFAULT_PARAMETER_COLOR;
          parameter.payload = 7;
          parameter.minValue = 5;
          parameter.maxValue = 50;
          parameter.description =
            'How many of the previously generated structures to observe when deciding what structure to add next.';
          return parameter;
        })(),

        // Heterogeneity: how much diversity to incur in the raw material
        // (the more diversity, the more chances to find suitable material
        // in there). Expressed as a factor of the `Analysis window`; by
        // default `40`.
        ((): IParameter => {
          const parameter = new Parameter();
          parameter.type = CoreOperationKeys.TYPE_INT;
          parameter.name = CoreParameterNames.HETEROGENEITY;
          parameter.uid = '0165fdda-c082-4f09-b101-0c1b3a35cb92';
          parameter.color = DEFAULT_PARAMETER_COLOR;
          parameter.payload = 40;
          parameter.minValue = 1;
          parameter.description =
            'How much diversity to incur in the raw generated material. The more diversity, the more chances to find suitable choices in there. Value is a factor of the "Analysis window" parameter.';
          return parameter;
        })(),

        // Hazard: a way to balance deterministics and chance. The smaller
        // the value, the more the generated music will sound orderly and
        // more "thought out". Defaults to `0`.
        ((): IParameter => {
          const parameter = new Parameter();
          parameter.type = CoreOperationKeys.TYPE_INT;
          parameter.name = CoreParameterNames.HAZARD;
          parameter.uid = '03268056-d977-4c62-a33d-268d445a3bb7';
          parameter.color = DEFAULT_PARAMETER_COLOR;
          parameter.payload = 0;
          parameter.minValue = 0;
          parameter.maxValue = 25;
          parameter.description =
            'A way to balance deterministics and chance. The smaller the value, the higher the odds that the generated music will sound more "orderly". Value is a factor of the full range of the generated structures.';
          return parameter;
        })(),

        ((): IParameter => {
          const parameter = new Parameter();
          parameter.type = CoreOperationKeys.TYPE_INT;
          parameter.name = CoreParameterNames.ERROR_MARGIN;
          parameter.uid = '1ce62acd-4fb6-4d3d-94d0-862a776d5997';
          parameter.color = DEFAULT_PARAMETER_COLOR;
          parameter.payload = 45;
          parameter.minValue = 1;
          parameter.maxValue = 100;
          parameter.description =
            'Controls a preliminary validation device, which only accepts those structures whose calculated fit score is within certain margin to the expected value. The smaller the value, the more CPU time is invested to closely match every parameter value.';
          return parameter;
        })(),
      );
    }
    return this.parametersValue;
  }

  /** @see IGeneratorModule.musicalTraits */
  abstract get musicalTraits(): IMusicalTrait[];

  /**
   * The number of milliseconds to wait between asynchronous iterations
   * in the AS3 original. Default is `10`. Subclasses can override to
   * return another value.
   *
   * @remarks Kept for API/override compatibility with the AS3 original,
   * but no longer has any actual timing effect: the rearchitected
   * generation loop yields via `yieldToEventLoop()` every iteration
   * regardless of this value (see the class comment above for why a
   * real delay no longer serves any purpose here).
   */
  protected get ASYNCH_DELAY(): number {
    return 10;
  }

  /** Determines whether available musical durations can fit the remaining musical body duration or not. */
  private canFill(_duration: IFraction): boolean {
    // TODO: implement (matches the AS3 original's own stub, which always returns true)
    return true;
  }

  /**
   * Runs the main generation loop: repeatedly produces one `IMusicUnit`
   * at a time (via `provideMusicUnit`) for as long as `isContentNeeded()`
   * says more material is required, yielding to the event loop between
   * units. Stops immediately (without finishing the current unit, if an
   * error/abort was raised while producing it) once either flag is set.
   */
  private async runRawGenerationLoop(): Promise<void> {
    while (!this.abortFlagValue && !this.errorFlagValue && this.isContentNeeded()) {
      await this.provideMusicUnit();
      await yieldToEventLoop();
    }
  }

  /**
   * Produces one `IMusicUnit` instance and adds it to the (raw)
   * `IMusicalBody` instance, by running every registered musical trait
   * against a fresh unit in turn, yielding to the event loop between
   * traits.
   */
  private async provideMusicUnit(): Promise<void> {
    this.currentMusicUnitValue = new MusicUnit();

    const traits = this.musicalTraits;
    if (traits.length === 0) {
      this.errorMessages.push(NO_TRAITS_DEFINED);
      this.errorFlagValue = true;
      return;
    }

    for (let i = 0; i < traits.length; i++) {
      if (this.abortFlagValue || this.errorFlagValue) {
        return;
      }
      const trait = traits[i] as IMusicalTrait;

      // Collect any post processors the trait might carry
      if (trait.musicalPostProcessors && trait.musicalPostProcessors.length > 0) {
        if (!this.musicalPostProcessorsValue) {
          this.musicalPostProcessorsValue = [];
        }
        if (!this.musicalPostProcessorsIdsValue) {
          this.musicalPostProcessorsIdsValue = [];
        }
        for (const processor of trait.musicalPostProcessors) {
          const pId = processor.uid;
          if ((this.musicalPostProcessorsIdsValue as string[]).indexOf(pId) === -1) {
            (this.musicalPostProcessorsIdsValue as string[]).push(pId);
            (this.musicalPostProcessorsValue as IMusicalPostProcessor[]).push(processor);
          }
        }
      }

      // Apply the trait to the current music unit
      trait.execute(
        this.currentMusicUnitValue,
        this.getUpdatedContext(),
        this.parametersList,
        this.requestValue as IMusicRequest,
      );
      await yieldToEventLoop();
    }

    if (this.abortFlagValue || this.errorFlagValue) {
      return;
    }

    const unit = this.currentMusicUnitValue;
    if (!unit.duration || unit.duration.equals(this.zeroFraction)) {
      this.errorMessages.push(NO_DURATION_MUSIC_UNIT);
      this.errorFlagValue = true;
      return;
    }

    // Add a clone of the just-populated IMusicUnit instance to the raw musical body
    (this.rawMusicalBodyValue as IMusicalBody).push(unit.clone());

    // Report progress to the outside world
    this.callbackValue?.({
      state: AbstractGeneratorModule.STATUS_IN_PROGRESS,
      percentComplete: this.percentCompletedValue,
      error: null,
    });
  }

  /**
   * Runs each of the available musical post-processors against the
   * generated raw material in order to refine it. Changes are
   * destructive and permanent (later processors receive the material in
   * the form earlier processors left it).
   */
  private async runPostProcessorLoop(): Promise<void> {
    const processors = this.musicalPostProcessorsValue as IMusicalPostProcessor[];
    for (let i = 0; i < processors.length; i++) {
      if (this.abortFlagValue || this.errorFlagValue) {
        return;
      }
      const processor = processors[i] as IMusicalPostProcessor;
      // TODO: report post-processor progress as part of the global progress (matches the AS3 original's own TODO)
      processor.execute(this.rawMusicalBodyValue as IMusicalBody, this.requestValue as IMusicRequest);
      await yieldToEventLoop();
    }
  }

  /**
   * Returns an `IAnalysisContext` instance that holds information
   * potentially useful to `IMusicalContentAnalyzer` instances, such as
   * the last `n` `IMusicUnit` instances that were added to the raw
   * musical body, or the current `percentCompleted`.
   */
  private getUpdatedContext(): IAnalysisContext {
    // Produce a slice of the last `n` IMusicUnit instances added to the
    // raw musical body, where `n` is given by the `Analysis Window`
    // parameter (provided it was defined).
    let contentSlice: IMusicUnit[] = [];
    const match = this.parametersList.getByName(CoreParameterNames.ANALYSIS_WINDOW);
    if (match.length > 0) {
      const windowParam = match[0] as IParameter;
      const rawWindowSize = (this.requestValue as IMusicRequest).userSettings.getValueAt(windowParam, 0);
      let windowSize = typeof rawWindowSize === 'number' ? rawWindowSize : 0;
      const rawBody = this.rawMusicalBodyValue as IMusicalBody;
      windowSize = Math.min(rawBody.length, windowSize);
      contentSlice = [];
      let c = rawBody.length - 1;
      for (let i = 0; i < windowSize; i++) {
        contentSlice.unshift(rawBody.getAt(c--));
      }
    }
    const context = new AnalysisContext();
    context.previousContent = contentSlice;
    context.percentTime = this.percentCompletedValue;
    return context;
  }

  /**
   * Determines whether a new `IMusicUnit` instance needs to be added to
   * the `IMusicalBody` instance currently being filled. Also updates
   * `percentCompleted` as a side effect, matching the AS3 original.
   */
  private isContentNeeded(): boolean {
    const due = (this.requestValue as IMusicRequest).timeMap.duration;
    const actual = (this.rawMusicalBodyValue as IMusicalBody).duration;
    this.percentCompletedValue = Math.min(1, actual.getPercentageOf(due));
    const leftToDo = due.subtract(actual);
    return leftToDo.greaterThan(this.zeroFraction) && this.canFill(leftToDo);
  }

  /**
   * Called once the `IMusicalBody` instance has been (roughly) filled
   * with musical units and any post-processors have run without error or
   * abort: safeguards the final form of the generated music, prepares
   * the generator for a new run, and invokes `callback` to let the
   * outer world know the process is complete.
   */
  private finalizeGeneration(): void {
    if (!this.refinedMusicalBodyValue) {
      this.refinedMusicalBodyValue = new MusicalBody();
    }
    const raw = this.rawMusicalBodyValue as IMusicalBody;
    while (raw.length > 0) {
      this.refinedMusicalBodyValue.insertAt(this.refinedMusicalBodyValue.length, raw.removeAt(raw.length - 1));
    }
    this.refinedMusicalBodyValue.reverse();
    this.rawMusicalBodyValue = null;
    this.currentMusicUnitValue = null;
    this.musicalPostProcessorsValue = null;
    this.musicalPostProcessorsIdsValue = null;
    this.callbackValue?.({ state: AbstractGeneratorModule.STATUS_COMPLETED, percentComplete: 1, error: null });
  }

  /** Called when the generation process has been externally aborted. */
  private onAbort(): void {
    this.callbackValue?.({ state: AbstractGeneratorModule.STATUS_ABORTED, percentComplete: 0, error: null });
  }

  /** Called when the generation process halts because of an error. */
  private onError(): void {
    const errorDetails = this.errorMessages.join('\n');
    this.callbackValue?.({ state: AbstractGeneratorModule.STATUS_ERROR, percentComplete: 0, error: errorDetails });
  }

  /**
   * Convenience getter for an `IFraction` instance that equals "0".
   * Matches the AS3 original's own comment about not wanting to couple
   * this class with the concrete `Fraction` class — even though this
   * file does construct concrete `Fraction`/`MusicUnit`/etc. instances
   * elsewhere (since something has to), this specific value is cached
   * independently rather than reused from another already-constructed
   * fraction, preserved as a small, harmless nod to the original's
   * intent.
   */
  private get zeroFraction(): IFraction {
    if (!this.zeroFractionValue) {
      this.zeroFractionValue = Fraction.ZERO;
    }
    return this.zeroFractionValue;
  }
}
