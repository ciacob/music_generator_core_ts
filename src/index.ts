/**
 * Public API entry point for `music-generation-engine`.
 *
 * This file has no AS3 original — the excluded `MultilineGeneratorFacade.as`
 * wired the engine into the original desktop app's data/preset model, which
 * this port deliberately does not replicate (see the top-level README's
 * "Explicitly NOT Included" section). Instead, this exposes a small,
 * self-contained `generate()` wrapper on top of the ported `MultilineGenerator`
 * (an `IGeneratorModule`), plus the building-block types/classes a caller
 * needs to construct an `IMusicRequest` and consume the resulting
 * `IMusicalBody` — matching the README's own "Suggested Public API" sketch.
 */

import { MultilineGenerator } from './harmony/MultilineGenerator.js';
import type { GenerationStatus } from './core/interfaces/IGeneratorModule.js';
import type { IMusicRequest } from './core/interfaces/IMusicRequest.js';
import type { IMusicalBody } from './core/interfaces/IMusicalBody.js';

/** Options accepted by {@link generate}. */
export interface GenerationOptions {
  /** Describes the music that needs to be created. */
  request: IMusicRequest;
  /** Optional progress callback, invoked with a `0`-`1` completion ratio as generation proceeds. */
  onProgress?: (percentCompleted: number) => void;
}

/**
 * Runs a full music generation pass against `options.request` and resolves with the resulting
 * `IMusicalBody`.
 *
 * Internally creates and drives a private `MultilineGenerator` instance (never exposed to the
 * caller), bridging its `callback`-based progress/completion/error reporting onto a single
 * `Promise`: `onProgress` (if provided) is invoked for every `"in progress"` update, and the
 * promise rejects if generation ends in an `"error"` or `"aborted"` state (the latter isn't
 * reachable through this function alone, since it never calls `abort()` itself, but is still
 * handled defensively rather than silently resolving with a possibly-empty body).
 *
 * @param options See {@link GenerationOptions}.
 * @returns The generated `IMusicalBody`.
 */
export async function generate(options: GenerationOptions): Promise<IMusicalBody> {
  const generator = new MultilineGenerator();
  let finalStatus: GenerationStatus | undefined;

  generator.callback = (status) => {
    if (status.state === 'in progress') {
      options.onProgress?.(status.percentComplete);
    } else {
      finalStatus = status;
    }
  };

  await generator.generate(options.request);

  if (finalStatus?.state === 'error') {
    throw new Error(finalStatus.error ?? 'Generation failed with an unknown error.');
  }
  if (finalStatus?.state === 'aborted') {
    throw new Error('Generation was aborted.');
  }

  return generator.lastResult;
}

// --- Generator module -------------------------------------------------------------------------
export { MultilineGenerator };
export type { GenerationCallback, GenerationState, GenerationStatus, IGeneratorModule } from './core/interfaces/IGeneratorModule.js';

// --- Requests, results, and their building blocks ---------------------------------------------
export { MusicRequest } from './core/MusicRequest.js';
export type { IMusicRequest } from './core/interfaces/IMusicRequest.js';
export { MusicalBody } from './core/MusicalBody.js';
export type { IMusicalBody } from './core/interfaces/IMusicalBody.js';
export { MusicUnit } from './core/MusicUnit.js';
export type { IMusicUnit } from './core/interfaces/IMusicUnit.js';
export { MusicPitch } from './core/MusicPitch.js';
export type { IMusicPitch } from './core/interfaces/IMusicPitch.js';
export { PitchAllocation } from './core/PitchAllocation.js';
export type { IPitchAllocation } from './core/interfaces/IPitchAllocation.js';
export { AnalysisContext } from './core/AnalysisContext.js';
export type { IAnalysisContext } from './core/interfaces/IAnalysisContext.js';
export type { IAnalysisScores } from './core/interfaces/IAnalysisScores.js';

// --- Parameters and settings ------------------------------------------------------------------
export { Parameter } from './core/Parameter.js';
export type { IParameter } from './core/interfaces/IParameter.js';
export { ParametersList } from './core/ParametersList.js';
export type { IParametersList } from './core/interfaces/IParametersList.js';
export { SettingsList } from './core/SettingsList.js';
export type { ISettingsList } from './core/interfaces/ISettingsList.js';
export { ParameterNames } from './harmony/constants/ParameterNames.js';
export { CoreParameterNames } from './core/constants/CoreParameterNames.js';
export { CoreOperationKeys } from './core/constants/CoreOperationKeys.js';

// --- Time signatures ---------------------------------------------------------------------------
export { TimeSignatureMap } from './knowledge/timesignature/TimeSignatureMap.js';
export type { ITimeSignatureMap } from './knowledge/timesignature/ITimeSignatureMap.js';
export { TimeSignatureEntry } from './knowledge/timesignature/TimeSignatureEntry.js';
export type { ITimeSignatureEntry } from './knowledge/timesignature/ITimeSignatureEntry.js';
export type { ITimeSignatureDefinition } from './knowledge/timesignature/ITimeSignatureDefinition.js';
export * as TimeSignatureFactory from './knowledge/timesignature/TimeSignatureFactory.js';
export { CommonTime } from './knowledge/timesignature/CommonTime.js';

// --- Instruments ---------------------------------------------------------------------------------
export type { IMusicalInstrument } from './knowledge/instruments/IMusicalInstrument.js';
export { MusicalInstrument } from './knowledge/instruments/MusicalInstrument.js';
export * as InstrumentFactory from './knowledge/instruments/InstrumentFactory.js';

// --- Exact rational arithmetic (durations, time positions) -------------------------------------
export { Fraction } from './math/Fraction.js';
export type { IFraction } from './math/IFraction.js';
