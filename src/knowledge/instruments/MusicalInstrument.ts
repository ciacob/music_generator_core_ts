import { toAS3ConstantCase } from '../../utils/Strings.js';
import { AbstractMusicalInstrument } from './AbstractMusicalInstrument.js';
import type { IMusicalInstrument } from './IMusicalInstrument.js';
import { PartAbbreviatedNames } from '../../generators/constants/parts/PartAbbreviatedNames.js';
import { PartAbbreviatedVoiceNames } from '../../generators/constants/parts/PartAbbreviatedVoiceNames.js';
import { PartDefaultBrackets } from '../../generators/constants/parts/PartDefaultBrackets.js';
import { PartDefaultClefs } from '../../generators/constants/parts/PartDefaultClefs.js';
import { PartDefaultStavesNumber } from '../../generators/constants/parts/PartDefaultStavesNumber.js';
import { getPartFamily } from '../../generators/constants/parts/PartFamilies.js';
import { PartIdealHarmonicRange } from '../../generators/constants/parts/PartIdealHarmonicRange.js';
import { PartMaxAutonomousVoices } from '../../generators/constants/parts/PartMaxAutonomousVoices.js';
import { PartMaxPoliphony } from '../../generators/constants/parts/PartMaxPoliphony.js';
import { PartMidiPatches } from '../../generators/constants/parts/PartMidiPatches.js';
import { PartNames } from '../../generators/constants/parts/PartNames.js';
import { PartRanges } from '../../generators/constants/parts/PartRanges.js';
import { PartTranspositions } from '../../generators/constants/parts/PartTranspositions.js';
import { PartVoiceNames } from '../../generators/constants/parts/PartVoiceNames.js';

/**
 * Represents a musical instrument. Its properties are compiled from the
 * dedicated music knowledge tables in `generators/constants/parts/`.
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/eu/stochastic/engine/music/knowledge/instruments/MusicalInstrument.as`.
 *
 * **Bug fixed, verified zero downstream impact** (same cost/benefit
 * standard as the `ColorUtils`/`TimeSignatureMap` fixes earlier in this
 * project — `staffNames`/`abbreviatedStaffNames` are never called
 * anywhere else in the engine, confirmed by grep): the AS3 original's
 * `get staffNames()` actually reads from `PartAbbreviatedVoiceNames`
 * (the *abbreviated* table — its own local variable is even named
 * `_abbreviatedStaffNames`, just returned from the wrong getter), while
 * `get abbreviatedStaffNames()` is never overridden at all, so calling it
 * would hit the abstract base's not-implemented error. This port sources
 * `staffNames` from `PartVoiceNames` (matching the interface's own
 * documented intent) and implements `abbreviatedStaffNames` properly from
 * `PartAbbreviatedVoiceNames`.
 *
 * Every lazily-computed getter here uses `undefined`-based caching
 * (rather than the AS3 original's mix of `== 0` and
 * `int.MAX_VALUE`-as-"not yet computed" sentinels) — behaviorally
 * identical for this data (none of these fields are ever legitimately
 * `0` in the underlying tables) but more honest/idiomatic in TS, and
 * consistent with how lazy caching is done everywhere else in this port.
 */
export class MusicalInstrument extends AbstractMusicalInstrument implements IMusicalInstrument {
  private readonly internalNameValue: string;
  private readonly ordinalIndexValue: number;

  private abbreviatedStaffNamesCache: readonly string[] | undefined;
  private staffNamesCache: readonly string[] | undefined;
  private clefsCache: readonly string[] | undefined;
  private partFamilyCache: string | undefined;
  private midiRangeCache: readonly number[] | undefined;
  private idealHarmonicRangeCache: readonly number[] | undefined;
  private nameCache: string | undefined;
  private abbreviatedNameCache: string | undefined;
  private bracketCache: string | undefined;
  private stavesNumberCache: number | undefined;
  private midiPatchCache: number | undefined;
  private maximumPoliphonyCache: number | undefined;
  private maximumAutonomousVoicesCache: number | undefined;
  private transpositionCache: number | undefined;

  /**
   * @param instrumentName One of the names defined in `PartNames`, e.g.
   * `"Piano"` or `"Acoustic bass guitar"`. Converted internally to
   * `"PIANO"`/`"ACOUSTIC_BASS_GUITAR"`.
   * @param ordinalIndex Distinguishes this instance among several of the
   * same instrument in a score (e.g. the second Violin has index `1`).
   */
  constructor(instrumentName: string, ordinalIndex: number) {
    super();
    this.internalNameValue = toAS3ConstantCase(instrumentName);
    this.ordinalIndexValue = ordinalIndex;
  }

  override get internalName(): string {
    return this.internalNameValue;
  }

  override get name(): string {
    if (this.nameCache === undefined) {
      this.nameCache = (PartNames as Record<string, string>)[this.internalNameValue] as string;
    }
    return this.nameCache;
  }

  override get abbreviatedName(): string {
    if (this.abbreviatedNameCache === undefined) {
      this.abbreviatedNameCache = (PartAbbreviatedNames as Record<string, string>)[
        this.internalNameValue
      ] as string;
    }
    return this.abbreviatedNameCache;
  }

  override get ordinalIndex(): number {
    return this.ordinalIndexValue;
  }

  override get staffNames(): readonly string[] {
    if (this.staffNamesCache === undefined) {
      this.staffNamesCache = (PartVoiceNames as Record<string, readonly string[]>)[
        this.internalNameValue
      ] as readonly string[];
    }
    return this.staffNamesCache;
  }

  override get abbreviatedStaffNames(): readonly string[] {
    if (this.abbreviatedStaffNamesCache === undefined) {
      this.abbreviatedStaffNamesCache = (PartAbbreviatedVoiceNames as Record<string, readonly string[]>)[
        this.internalNameValue
      ] as readonly string[];
    }
    return this.abbreviatedStaffNamesCache;
  }

  override get stavesNumber(): number {
    if (this.stavesNumberCache === undefined) {
      this.stavesNumberCache = (PartDefaultStavesNumber as Record<string, number>)[
        this.internalNameValue
      ] as number;
    }
    return this.stavesNumberCache;
  }

  override set stavesNumber(value: number) {
    this.stavesNumberCache = value;
  }

  override get clefs(): readonly string[] {
    if (this.clefsCache === undefined) {
      this.clefsCache = (PartDefaultClefs as Record<string, readonly string[]>)[
        this.internalNameValue
      ] as readonly string[];
    }
    return this.clefsCache;
  }

  override get bracket(): string {
    if (this.bracketCache === undefined) {
      this.bracketCache = (PartDefaultBrackets as Record<string, string>)[this.internalNameValue] as string;
    }
    return this.bracketCache;
  }

  override get partFamily(): string {
    if (this.partFamilyCache === undefined) {
      this.partFamilyCache = getPartFamily(this.internalNameValue);
    }
    return this.partFamilyCache;
  }

  override get midiPatch(): number {
    if (this.midiPatchCache === undefined) {
      this.midiPatchCache = (PartMidiPatches as Record<string, number>)[this.internalNameValue] as number;
    }
    return this.midiPatchCache;
  }

  override get midiRange(): readonly number[] {
    if (this.midiRangeCache === undefined) {
      this.midiRangeCache = (PartRanges as Record<string, readonly number[]>)[
        this.internalNameValue
      ] as readonly number[];
    }
    return this.midiRangeCache;
  }

  override get idealHarmonicRange(): readonly number[] {
    if (this.idealHarmonicRangeCache === undefined) {
      this.idealHarmonicRangeCache = (PartIdealHarmonicRange as Record<string, readonly number[]>)[
        this.internalNameValue
      ] as readonly number[];
    }
    return this.idealHarmonicRangeCache;
  }

  override get maximumPoliphony(): number {
    if (this.maximumPoliphonyCache === undefined) {
      this.maximumPoliphonyCache = (PartMaxPoliphony as Record<string, number>)[
        this.internalNameValue
      ] as number;
    }
    return this.maximumPoliphonyCache;
  }

  override get maximumAutonomousVoices(): number {
    if (this.maximumAutonomousVoicesCache === undefined) {
      this.maximumAutonomousVoicesCache = (PartMaxAutonomousVoices as Record<string, number>)[
        this.internalNameValue
      ] as number;
    }
    return this.maximumAutonomousVoicesCache;
  }

  override get transposition(): number {
    if (this.transpositionCache === undefined) {
      this.transpositionCache = (PartTranspositions as Record<string, number>)[
        this.internalNameValue
      ] as number;
    }
    return this.transpositionCache;
  }

  /** Useful for debugging purposes. */
  toString(): string {
    return `Musical Instrument: ${this.name} (${this.midiRange.join(', ')})`;
  }
}
