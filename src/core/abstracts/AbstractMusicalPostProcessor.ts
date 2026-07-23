import { generateRFC4122GUID } from '../../utils/Strings.js';
import type { IMusicRequest } from '../interfaces/IMusicRequest.js';
import type { IMusicalBody } from '../interfaces/IMusicalBody.js';
import type { IMusicalPostProcessor } from '../interfaces/IMusicalPostProcessor.js';

/**
 * Ported from
 * `as-sources/legacy-generators-core-library/ro/se/legacy/generators/core/abstracts/AbstractMusicalPostProcessor.as`.
 * Real TS `abstract class`; `uid` is the one concrete member, same
 * pattern as the other `Abstract*` base classes in this project.
 */
export abstract class AbstractMusicalPostProcessor implements IMusicalPostProcessor {
  private uidValue: string | undefined;

  get uid(): string {
    if (this.uidValue === undefined) {
      this.uidValue = generateRFC4122GUID();
    }
    return this.uidValue;
  }

  abstract execute(rawMusicalBody: IMusicalBody, request: IMusicRequest): void;
}
