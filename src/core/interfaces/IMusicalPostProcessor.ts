import type { IMusicalBody } from './IMusicalBody.js';
import type { IMusicRequest } from './IMusicRequest.js';

/**
 * Entity that provides refining mechanisms for generated musical bodies.
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/ro/se/legacy/generators/core/interfaces/IMusicalPostProcessor.as`.
 */
export interface IMusicalPostProcessor {
  /** Globally unique, readonly identifier for this post-processor. */
  readonly uid: string;

  /**
   * Operates discretionary changes on `rawMusicalBody`. Changes are
   * performed DIRECTLY on the instance and are PERMANENT. Each
   * post-processor defines and implements its own filtering/altering
   * techniques; they are not standardized.
   *
   * @param rawMusicalBody The musical body to alter.
   * @param request The musical request the parent generator was invoked
   * with — contains essential context, such as the values the user
   * provided for each parameter.
   */
  execute(rawMusicalBody: IMusicalBody, request: IMusicRequest): void;
}
