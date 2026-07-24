import { CommonStrings } from '../../../utils/constants/CommonStrings.js';
import { toAS3ConstantCase } from '../../../utils/Strings.js';

/**
 * Ported from
 * `as-sources/legacy-generators-base-library/ro/se/legacy/generators/constants/parts/PartVoiceNames.as`.
 * See `PartAbbreviatedVoiceNames.ts` for the array-aliasing note
 * (`HARPSICHORD` sharing `PIANO`'s array) and the `getNames` translation
 * note.
 */

const PIANO_VOICES = ['Right Hand', 'Left Hand'] as const;

/** Full voice names for each supported instrument/ensemble part, keyed by part name. */
export const PartVoiceNames = {
  // Piano
  PIANO: PIANO_VOICES,
  PIANO_2: ['(Piano) Right Hand', 'Left Hand'],
  PIANO_3: ['(Piano) Right Hand', 'Left Hand I', 'Left Hand II'],
  PIANO_4: ['(Piano) Right Hand I', 'Right Hand II', 'Left Hand I', 'Left Hand II'],

  // Harpsichord
  HARPSICHORD: PIANO_VOICES,
  HARPSICHORD_2: ['(Harpsichord) Right Hand', 'Left Hand'],
  HARPSICHORD_3: ['(Harpsichord) Right Hand', 'Left Hand I', 'Left Hand II'],
  HARPSICHORD_4: ['(Harpsichord) Right Hand I', 'Right Hand II', 'Left Hand I', 'Left Hand II'],

  // Organ
  ORGAN: ['Right Hand', 'Left Hand', 'Pedal'],
  ORGAN_3: ['(Organ) Right Hand', 'Left Hand', 'Pedal'],
  ORGAN_4: ['(Organ) Right Hand', 'Left Hand I', 'Left Hand II', 'Pedal'],
  ORGAN_5: ['(Organ) Right Hand I', 'Right Hand II', 'Left Hand I', 'Left Hand II', 'Pedal'],
  ORGAN_6: [
    '(Organ) Right Hand I',
    'Right Hand II',
    'Left Hand I',
    'Left Hand II',
    'Pedal I',
    'Pedal II',
  ],

  // French Horns
  FRENCH_HORNS: ['I, II', 'III'],
  FRENCH_HORNS_2: ['French Horn I, II', 'French Horn III'],
  FRENCH_HORNS_3: ['French Horn I', 'French Horn II', 'French Horn III'],

  // Choir
  CHOIR: ['Soprano', 'Alto', 'Tenor', 'Bass'],
  CHOIR_2: ['Soprano/Alto', 'Tenor/Bass'],
  CHOIR_3: ['Soprano', 'Alto', 'Tenor/Bass '],
  CHOIR_4: ['Soprano', 'Alto', 'Tenor', 'Bass'],

  // Vibraphone
  VIBRAPHONE: ['Vibraphone'],
  VIBRAPHONE_2: ['(Vibraphone) Right Hand', 'Left Hand'],
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
  if (key in PartVoiceNames) {
    return PartVoiceNames[key as keyof typeof PartVoiceNames];
  }
  return null;
}
