import type { IFraction } from '../../math/IFraction.js';

/**
 * Contains information that helps define a tuplet.
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/ro/se/legacy/generators/core/interfaces/ITupletDefinition.as`.
 *
 * Per the README's "Known Incomplete or Unused Pieces" note: this
 * interface has no concrete implementation anywhere in the original
 * engine (verified, not just suspected) — `IMusicUnit.tupletDefinition`
 * is typed against it and faithfully stored/cloned, but nothing ever
 * constructs one. Tuplet support is an interface-only stub in the
 * original AS3 engine too; ported here for fidelity, with no
 * corresponding `TupletDefinition` class invented.
 */
export interface ITupletDefinition {
  /** Tuplet NOMINAL beats number, e.g. `3` for a "3 eighths instead of 2" tuplet. */
  tupletBeatsNumber: number;

  /** Tuplet NOMINAL beat duration, e.g. `1/8` for a "3 eighths instead of 2" tuplet. */
  tupletBeatDuration: IFraction;

  /** Regular NOMINAL beats number, e.g. `2` for a "3 eighths instead of 2" tuplet. */
  regularBeatsNumber: number;

  /** Regular NOMINAL beat duration, e.g. `1/8` for a "3 eighths instead of 2" tuplet. */
  regularBeatDuration: IFraction;
}
