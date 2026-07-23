import type { IMusicRequest } from './IMusicRequest.js';
import type { IMusicalBody } from './IMusicalBody.js';
import type { IMusicalTrait } from './IMusicalTrait.js';
import type { IParametersList } from './IParametersList.js';

/** The possible states reported via `IGeneratorModule.callback`. */
export type GenerationState = 'in progress' | 'aborted' | 'completed' | 'error';

/**
 * Status payload delivered to `IGeneratorModule.callback`, matching the
 * shape documented in the AS3 original.
 */
export interface GenerationStatus {
  state: GenerationState;
  /** Progresses in `0.01` increments. */
  percentComplete: number;
  /** Error description, or `null`. */
  error: string | null;
  /** General purpose field; may or may not be used, depending on implementation. */
  data?: unknown;
}

/**
 * Receives status information during an asynchronous generation run. Any
 * change in at least one of `GenerationStatus`'s fields triggers a call.
 */
export type GenerationCallback = (status: GenerationStatus) => void;

/**
 * Generic contract for a music generator module base class.
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/ro/se/legacy/generators/core/interfaces/IGeneratorModule.as`.
 * `callback` is write-only in the AS3 original (only a setter is
 * declared, no getter) — expressed here via a `set`-only interface
 * accessor, same pattern used for `ITimeSignatureEntry.signature` in
 * step 4.
 */
export interface IGeneratorModule {
  /**
   * Begins the generation process. The process is asynchronous.
   * @param request Describes the music that needs to be created.
   */
  generate(request: IMusicRequest): void;

  /** Stops the in-progress generation and discards any (raw) music already created. */
  abort(): void;

  /** Receives generation status updates. Required, since generation is asynchronous. */
  set callback(value: GenerationCallback);

  /**
   * The last music generated. Accessible from the module instance for as
   * long as it is alive.
   */
  readonly lastResult: IMusicalBody;

  /**
   * The readonly, externally defined unique ID for this module. Each
   * implementation must override this to return a globally unique,
   * descriptive string.
   */
  readonly moduleUid: string;

  /** The readonly, internally defined unique GUID automatically assigned to this instance upon creation. */
  readonly instanceUid: string;

  /**
   * Readonly information about this module. The default implementation
   * returns an object with `moduleUid`; subclasses may add their own
   * keys. The structure is not standardized.
   */
  readonly info: Record<string, unknown>;

  /** Structured information about all the parameters available for this module. */
  readonly parametersList: IParametersList;

  /** Information about all the musical traits that define this module. */
  readonly musicalTraits: IMusicalTrait[];
}
