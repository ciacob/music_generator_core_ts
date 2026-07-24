import { generateRFC4122GUID } from '../../utils/Strings.js';
import type { IMusicalInstrument } from './IMusicalInstrument.js';

/**
 * Container to store information about a musical instrument.
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/eu/stochastic/engine/music/knowledge/instruments/abstracts/AbstractMusicalInstrument.as`.
 *
 * Simplified relative to the AS3 original using a real TypeScript
 * `abstract class`, same as `AbstractTimeSignatureDefinition` in step 4 —
 * see that file's comment for the full explanation of why the original's
 * runtime self-instance-check-and-throw workaround isn't needed here.
 *
 * `uid` is the one member the AS3 original implements concretely rather
 * than leaving abstract (a `final` getter/setter pair, lazily generating
 * a GUID on first read if never explicitly set) — preserved here as the
 * one concrete member on this class, matching exactly.
 */
export abstract class AbstractMusicalInstrument implements IMusicalInstrument {
  private uidValue: string | undefined;

  /** @see IMusicalInstrument.abbreviatedName */
  abstract get abbreviatedName(): string;
  /** @see IMusicalInstrument.ordinalIndex */
  abstract get ordinalIndex(): number;
  /** @see IMusicalInstrument.abbreviatedStaffNames */
  abstract get abbreviatedStaffNames(): readonly string[];
  /** @see IMusicalInstrument.bracket */
  abstract get bracket(): string;
  /** @see IMusicalInstrument.clefs */
  abstract get clefs(): readonly string[];
  /** @see IMusicalInstrument.internalName */
  abstract get internalName(): string;
  /** @see IMusicalInstrument.midiPatch */
  abstract get midiPatch(): number;
  /** @see IMusicalInstrument.midiRange */
  abstract get midiRange(): readonly number[];
  /** @see IMusicalInstrument.idealHarmonicRange */
  abstract get idealHarmonicRange(): readonly number[];
  /** @see IMusicalInstrument.maximumPoliphony */
  abstract get maximumPoliphony(): number;
  /** @see IMusicalInstrument.maximumAutonomousVoices */
  abstract get maximumAutonomousVoices(): number;
  /** @see IMusicalInstrument.name */
  abstract get name(): string;
  /** @see IMusicalInstrument.partFamily */
  abstract get partFamily(): string;
  /** @see IMusicalInstrument.staffNames */
  abstract get staffNames(): readonly string[];
  /** @see IMusicalInstrument.stavesNumber */
  abstract get stavesNumber(): number;
  /** @see IMusicalInstrument.stavesNumber */
  abstract set stavesNumber(value: number);
  /** @see IMusicalInstrument.transposition */
  abstract get transposition(): number;

  /** @see IMusicalInstrument.uid */
  get uid(): string {
    if (!this.uidValue) {
      this.uidValue = generateRFC4122GUID();
    }
    return this.uidValue;
  }

  /** @see IMusicalInstrument.uid */
  set uid(value: string) {
    this.uidValue = value;
  }
}
