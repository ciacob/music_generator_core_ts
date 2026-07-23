import type { IFraction } from '../../math/IFraction.js';

/**
 * Ported from
 * `as-sources/legacy-generators-core-library/eu/stochastic/engine/music/knowledge/timesignature/interfaces/IMetricAccent.as`.
 */
export interface IMetricAccent {
  /**
   * The amount of stress, expressed as a number between 0 and 1 inclusive,
   * a playback routine should add with respect to this metric accent,
   * e.g. `1` means the maximum available MIDI velocity, whereas `0.5`
   * means about half of it.
   *
   * To express the secondary metric accent of "common time" (4/4), you
   * would probably set this to something like `0.75`.
   */
  strength: number;

  /**
   * An `IFraction` that represents the beat of a measure this metric
   * accent refers to, e.g. to express the secondary metric accent of
   * "common time" (4/4), you would set this to `3/4`.
   */
  position: IFraction;
}
