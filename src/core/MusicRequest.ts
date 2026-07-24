import type { IMusicalInstrument } from '../knowledge/instruments/IMusicalInstrument.js';
import type { ITimeSignatureMap } from '../knowledge/timesignature/ITimeSignatureMap.js';
import type { IMusicRequest } from './interfaces/IMusicRequest.js';
import type { ISettingsList } from './interfaces/ISettingsList.js';

/**
 * Container for information related to a music generation task.
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/ro/se/legacy/generators/core/MusicRequest.as`.
 *
 * `timeMap`/`userSettings` use definite-assignment (`!`) since the AS3
 * original leaves them uninitialized too (set by the caller before use,
 * never read beforehand by any real code path).
 */
export class MusicRequest implements IMusicRequest {
  private instrumentsValue: IMusicalInstrument[] = [];
  private timeMapValue!: ITimeSignatureMap;
  private userSettingsValue!: ISettingsList;

  /** @see IMusicRequest.instruments */
  get instruments(): IMusicalInstrument[] {
    return this.instrumentsValue;
  }

  /** @see IMusicRequest.instruments */
  set instruments(value: IMusicalInstrument[]) {
    this.instrumentsValue = value;
  }

  /** @see IMusicRequest.timeMap */
  get timeMap(): ITimeSignatureMap {
    return this.timeMapValue;
  }

  /** @see IMusicRequest.timeMap */
  set timeMap(value: ITimeSignatureMap) {
    this.timeMapValue = value;
  }

  /** @see IMusicRequest.userSettings */
  get userSettings(): ISettingsList {
    return this.userSettingsValue;
  }

  /** @see IMusicRequest.userSettings */
  set userSettings(value: ISettingsList) {
    this.userSettingsValue = value;
  }
}
