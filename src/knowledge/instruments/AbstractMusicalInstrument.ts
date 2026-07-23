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

  abstract get abbreviatedName(): string;
  abstract get ordinalIndex(): number;
  abstract get abbreviatedStaffNames(): readonly string[];
  abstract get bracket(): string;
  abstract get clefs(): readonly string[];
  abstract get internalName(): string;
  abstract get midiPatch(): number;
  abstract get midiRange(): readonly number[];
  abstract get idealHarmonicRange(): readonly number[];
  abstract get maximumPoliphony(): number;
  abstract get maximumAutonomousVoices(): number;
  abstract get name(): string;
  abstract get partFamily(): string;
  abstract get staffNames(): readonly string[];
  abstract get stavesNumber(): number;
  abstract set stavesNumber(value: number);
  abstract get transposition(): number;

  get uid(): string {
    if (!this.uidValue) {
      this.uidValue = generateRFC4122GUID();
    }
    return this.uidValue;
  }

  set uid(value: string) {
    this.uidValue = value;
  }
}
