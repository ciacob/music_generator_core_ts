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

const INTERNAL_NAME = 'PIANO';

/** Mirrors the AS3 abstract base's own not-implemented error message/behavior for a member `Piano` never overrides. */
function notImplemented(member: string): never {
  throw new Error(
    `Piano does not implement '${member}'; this member was never overridden in the original AS3 source either.`,
  );
}

/**
 * A hardcoded, single-instrument specialization of `MusicalInstrument`
 * (`internalName` is always `"PIANO"`, no constructor arguments).
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/eu/stochastic/engine/music/knowledge/instruments/Piano.as`.
 *
 * **Verified dead code**: nothing else anywhere in the copied 133-file
 * engine snapshot references this class (confirmed by grep) —
 * `InstrumentFactory` only ever constructs generic `MusicalInstrument`
 * instances. Ported anyway since the README's package map includes
 * `knowledge/**` in full.
 *
 * **Same `staffNames`/`abbreviatedStaffNames` bug fixed here as in
 * `MusicalInstrument.ts`** (see that file's comment): `staffNames` now
 * sources from `PartVoiceNames` rather than `PartAbbreviatedVoiceNames`,
 * and `abbreviatedStaffNames` is now actually implemented.
 *
 * **Two gaps deliberately preserved, not invented-around**: the AS3
 * original never overrides `ordinalIndex` or the `stavesNumber` *setter*
 * (only the getter), so both fall through to the abstract base's
 * not-implemented error in AS3 — `new Piano()` itself succeeds, but
 * touching either of these throws. TypeScript's `abstract` keyword
 * doesn't allow a concrete subclass to simply omit an abstract member the
 * way AS3's runtime-checked simulation did (an incompletely-overridden
 * class stays abstract and can't be `new`'d at all), so — rather than
 * inventing a plausible `ordinalIndex` value or silently accepting
 * `stavesNumber` writes, neither of which the original ever specified —
 * both are implemented here as explicit throws, preserving the same
 * "constructs fine, throws only if you touch this specific member"
 * behavior the original actually had.
 */
export class Piano extends AbstractMusicalInstrument implements IMusicalInstrument {
  private static abbreviatedStaffNamesCache: readonly string[] | undefined;
  private static staffNamesCache: readonly string[] | undefined;
  private static clefsCache: readonly string[] | undefined;
  private static partFamilyCache: string | undefined;
  private static midiRangeCache: readonly number[] | undefined;

  override get internalName(): string {
    return INTERNAL_NAME;
  }

  override get name(): string {
    return (PartNames as Record<string, string>)[INTERNAL_NAME] as string;
  }

  override get abbreviatedName(): string {
    return (PartAbbreviatedNames as Record<string, string>)[INTERNAL_NAME] as string;
  }

  override get ordinalIndex(): number {
    return notImplemented('ordinalIndex');
  }

  override get staffNames(): readonly string[] {
    if (!Piano.staffNamesCache) {
      Piano.staffNamesCache = (PartVoiceNames as Record<string, readonly string[]>)[
        INTERNAL_NAME
      ] as readonly string[];
    }
    return Piano.staffNamesCache;
  }

  override get abbreviatedStaffNames(): readonly string[] {
    if (!Piano.abbreviatedStaffNamesCache) {
      Piano.abbreviatedStaffNamesCache = (PartAbbreviatedVoiceNames as Record<string, readonly string[]>)[
        INTERNAL_NAME
      ] as readonly string[];
    }
    return Piano.abbreviatedStaffNamesCache;
  }

  override get stavesNumber(): number {
    return (PartDefaultStavesNumber as Record<string, number>)[INTERNAL_NAME] as number;
  }

  override set stavesNumber(_value: number) {
    notImplemented('stavesNumber (setter)');
  }

  override get clefs(): readonly string[] {
    if (!Piano.clefsCache) {
      Piano.clefsCache = (PartDefaultClefs as Record<string, readonly string[]>)[
        INTERNAL_NAME
      ] as readonly string[];
    }
    return Piano.clefsCache;
  }

  override get bracket(): string {
    return (PartDefaultBrackets as Record<string, string>)[INTERNAL_NAME] as string;
  }

  override get partFamily(): string {
    if (!Piano.partFamilyCache) {
      Piano.partFamilyCache = getPartFamily(INTERNAL_NAME);
    }
    return Piano.partFamilyCache;
  }

  override get midiPatch(): number {
    return (PartMidiPatches as Record<string, number>)[INTERNAL_NAME] as number;
  }

  override get midiRange(): readonly number[] {
    if (!Piano.midiRangeCache) {
      Piano.midiRangeCache = (PartRanges as Record<string, readonly number[]>)[
        INTERNAL_NAME
      ] as readonly number[];
    }
    return Piano.midiRangeCache;
  }

  override get idealHarmonicRange(): readonly number[] {
    return (PartIdealHarmonicRange as Record<string, readonly number[]>)[INTERNAL_NAME] as readonly number[];
  }

  override get maximumPoliphony(): number {
    return (PartMaxPoliphony as Record<string, number>)[INTERNAL_NAME] as number;
  }

  override get maximumAutonomousVoices(): number {
    return (PartMaxAutonomousVoices as Record<string, number>)[INTERNAL_NAME] as number;
  }

  override get transposition(): number {
    return (PartTranspositions as Record<string, number>)[INTERNAL_NAME] as number;
  }
}
