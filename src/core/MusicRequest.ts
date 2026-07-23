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

  get instruments(): IMusicalInstrument[] {
    return this.instrumentsValue;
  }

  set instruments(value: IMusicalInstrument[]) {
    this.instrumentsValue = value;
  }

  get timeMap(): ITimeSignatureMap {
    return this.timeMapValue;
  }

  set timeMap(value: ITimeSignatureMap) {
    this.timeMapValue = value;
  }

  get userSettings(): ISettingsList {
    return this.userSettingsValue;
  }

  set userSettings(value: ISettingsList) {
    this.userSettingsValue = value;
  }
}
