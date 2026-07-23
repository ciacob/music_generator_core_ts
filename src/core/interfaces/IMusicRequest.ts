import type { IMusicalInstrument } from '../../knowledge/instruments/IMusicalInstrument.js';
import type { ITimeSignatureMap } from '../../knowledge/timesignature/ITimeSignatureMap.js';
import type { ISettingsList } from './ISettingsList.js';

/**
 * Container for information related to a music generation task.
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/ro/se/legacy/generators/core/interfaces/IMusicRequest.as`.
 */
export interface IMusicRequest {
  /** The musical time span to be filled by this music generation task. */
  timeMap: ITimeSignatureMap;

  /** The list of musical instruments music is to be generated for. */
  instruments: IMusicalInstrument[];

  /** The values/settings the user has provided for various parameters. */
  userSettings: ISettingsList;
}
