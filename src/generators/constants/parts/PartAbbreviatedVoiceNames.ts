import { CommonStrings } from '../../../utils/constants/CommonStrings.js';
import { toAS3ConstantCase } from '../../../utils/Strings.js';

/**
 * Ported from
 * `as-sources/legacy-generators-base-library/ro/se/legacy/generators/constants/parts/PartAbbreviatedVoiceNames.as`.
 * `getNames`'s dynamic `partName in PartAbbreviatedVoiceNames` / bracket-
 * access lookup translates directly to plain-object `in`/index access.
 * `HARPSICHORD` shares the same array reference as `PIANO` in the
 * original (`HARPSICHORD:Array = PIANO;`), preserved here via a shared
 * local constant rather than duplicating the literal.
 */

const PIANO_VOICES = ['R.H.', 'L.H.'] as const;

export const PartAbbreviatedVoiceNames = {
  // Piano
  PIANO: PIANO_VOICES,
  PIANO_2: ['(Pno.) R.H. ', 'L.H.'],
  PIANO_3: ['(Pno.) R.H. ', 'L.H. I', 'L.H. II'],
  PIANO_4: ['(Pno.) R.H. I ', 'R.H. II', 'L.H. I', 'L.H. II'],

  // Harpsichord
  HARPSICHORD: PIANO_VOICES,
  HARPSICHORD_2: ['(Hps.) R.H.', 'L.H.'],
  HARPSICHORD_3: ['(Hps.) R.H.', 'L.H. I', 'L.H. II'],
  HARPSICHORD_4: ['(Hps.) R.H. I', 'R.H. II', 'L.H. I', 'L.H. II'],

  // Organ
  ORGAN: ['R.H.', 'L.H.', 'Ped.'],
  ORGAN_3: ['(Org.) R.H.', 'L.H.', 'Ped.'],
  ORGAN_4: ['(Org.) R.H.', 'L.H. I', 'L.H. II', 'Ped.'],
  ORGAN_5: ['(Org.) R.H. I', 'R.H. II', 'L.H. I', 'L.H. II', 'Ped.'],
  ORGAN_6: ['(Org.) R.H. I', 'R.H. II', 'L.H. I', 'L.H. II', 'Ped. I', 'Ped. II'],

  // French Horns
  FRENCH_HORNS: ['I, II', 'III'],
  FRENCH_HORNS_2: ['F. Hn. I, II', 'F. Hn. III'],
  FRENCH_HORNS_3: ['F. Hn. I', 'F. Hn. II', 'F. Hn. III'],

  // Choir
  CHOIR: ['S.', 'A.', 'T.', 'B.'],
  CHOIR_2: ['S./A.', 'T./B.'],
  CHOIR_3: ['S.', 'A.', 'T./B.'],
  CHOIR_4: ['S.', 'A.', 'T.', 'B.'],
} as const;

/**
 * @param partName An AS3-constant-case-able part name (e.g. `"piano"` or
 * `"PIANO"`).
 * @param numStaves Optional. If given, looks up `<PART_NAME>_<numStaves>`
 * instead of the bare part name.
 * @returns The matching voice-name list, or `null` if none is defined.
 */
export function getNames(partName: string, numStaves = -1): readonly string[] | null {
  let key = toAS3ConstantCase(partName);
  if (numStaves !== -1) {
    key = key.concat(CommonStrings.UNDERSCORE, String(numStaves));
  }
  if (key in PartAbbreviatedVoiceNames) {
    return PartAbbreviatedVoiceNames[key as keyof typeof PartAbbreviatedVoiceNames];
  }
  return null;
}
