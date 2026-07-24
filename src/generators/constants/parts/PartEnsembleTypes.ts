import { getAllNames } from '../../../utils/ConstantUtils.js';
import { OTHER_INSTRUMENTS } from './PartFamilies.js';
import { PartNames } from './PartNames.js';

/**
 * Ported from
 * `as-sources/legacy-generators-base-library/ro/se/legacy/generators/constants/parts/PartEnsembleTypes.as`.
 *
 * Ensemble names starting with a dollar sign must be either matched
 * exactly, or dropped. They also must be exempt from the quantizer
 * token, because their name implies a quantity in itself.
 *
 * `PartFamilies.se::OTHER_INSTRUMENTS` (the AS3 namespace-qualified
 * access) becomes the plain `OTHER_INSTRUMENTS` export from
 * `PartFamilies.ts` — see that file's comment for why the namespace trick
 * isn't needed in TypeScript.
 */
export const PartEnsembleTypes = {
  // -----------------
  // GENERIC ENSEMBLES
  // -----------------
  WOODWINDS: [
    PartNames.PICCOLO,
    PartNames.RECORDER,
    PartNames.FLUTE,
    PartNames.OBOE,
    PartNames.ENGLISH_HORN,
    PartNames.CLARINET,
    PartNames.FRENCH_HORNS,
    PartNames.BASSOON,
  ],

  STRINGS: [PartNames.VIOLIN, PartNames.VIOLA, PartNames.CELLO, PartNames.CONTRABASS],

  BRASS: [PartNames.TRUMPET, PartNames.FRENCH_HORNS, PartNames.TROMBONE, PartNames.TUBA],

  PERCUSSION: [
    PartNames.VIBRAPHONE,
    PartNames.MARIMBA,
    PartNames.GLOCKENSPIEL,
    PartNames.XYLOPHONE,
    PartNames.TUBULAR_BELLS,
  ],

  // -------------------------------
  // GENERIC UNQUANTIZABLE ENSEMBLES
  // -------------------------------
  'ORCHESTRA$': [
    PartNames.PICCOLO,
    PartNames.FLUTE,
    PartNames.OBOE,
    PartNames.ENGLISH_HORN,
    PartNames.CLARINET,
    PartNames.BASSOON,
    PartNames.FRENCH_HORNS,
    PartNames.TRUMPET,
    PartNames.TROMBONE,
    PartNames.TUBA,
    PartNames.HARP,
    PartNames.PIANO,
    PartNames.HARPSICHORD,
    PartNames.ORGAN,
    OTHER_INSTRUMENTS,
    PartNames.VIOLIN,
    PartNames.VIOLA,
    PartNames.CELLO,
    PartNames.CONTRABASS,
  ],

  'BAND$': [
    PartNames.FLUTE,
    PartNames.OBOE,
    PartNames.BASSOON,
    PartNames.CLARINET,
    PartNames.TRUMPET,
    PartNames.FRENCH_HORNS,
    PartNames.TROMBONE,
    PartNames.TUBA,
    OTHER_INSTRUMENTS,
  ],

  // ------------------
  // SPECIFIC ENSEMBLES
  // ------------------
  '$VIOLIN_AND_PIANO_DUO': [PartNames.VIOLIN, PartNames.PIANO],

  '$CELLO_AND_PIANO_DUO': [PartNames.CELLO, PartNames.PIANO],

  '$FLUTE_AND_PIANO_DUO': [PartNames.FLUTE, PartNames.PIANO],

  '$STRING_TRIO': [PartNames.VIOLIN, PartNames.VIOLA, PartNames.CELLO],

  '$PIANO_TRIO': [PartNames.VIOLIN, PartNames.CELLO, PartNames.PIANO],

  '$STRING_QUARTET': [PartNames.VIOLIN, PartNames.VIOLIN, PartNames.VIOLA, PartNames.CELLO],

  '$DOUBLE_STRING_QUARTET': [
    PartNames.VIOLIN,
    PartNames.VIOLIN,
    PartNames.VIOLIN,
    PartNames.VIOLIN,
    PartNames.VIOLA,
    PartNames.VIOLA,
    PartNames.CELLO,
    PartNames.CELLO,
  ],

  '$PIANO_QUARTET': [PartNames.VIOLIN, PartNames.VIOLA, PartNames.CELLO, PartNames.PIANO],

  '$STRING_QUINTET': [
    PartNames.VIOLIN,
    PartNames.VIOLIN,
    PartNames.VIOLA,
    PartNames.VIOLA,
    PartNames.CELLO,
  ],

  '$PIANO_QUINTET': [
    PartNames.VIOLIN,
    PartNames.VIOLIN,
    PartNames.VIOLA,
    PartNames.CELLO,
    PartNames.PIANO,
  ],

  '$BRASS_QUINTET': [
    PartNames.TRUMPET,
    PartNames.TRUMPET,
    PartNames.TROMBONE,
    PartNames.FRENCH_HORNS,
    PartNames.TUBA,
  ],

  '$WOODWIND_QUINTET': [
    PartNames.FLUTE,
    PartNames.OBOE,
    PartNames.CLARINET,
    PartNames.FRENCH_HORNS,
    PartNames.BASSOON,
  ],

  '$STRING_SEXTET': [
    PartNames.VIOLIN,
    PartNames.VIOLIN,
    PartNames.VIOLA,
    PartNames.VIOLA,
    PartNames.CELLO,
    PartNames.CELLO,
  ],

  '$WIND_SEPTET': [
    PartNames.VIOLIN,
    PartNames.VIOLA,
    PartNames.CLARINET,
    PartNames.FRENCH_HORNS,
    PartNames.BASSOON,
    PartNames.CELLO,
    PartNames.CONTRABASS,
  ],

  '$OCTET': [
    PartNames.CLARINET,
    PartNames.FRENCH_HORNS,
    PartNames.BASSOON,
    PartNames.VIOLIN,
    PartNames.VIOLIN,
    PartNames.VIOLA,
    PartNames.CELLO,
    PartNames.CONTRABASS,
  ],
} as const;

let allEnsemblesCache: string[] | null = null;

/** Returns all `PartEnsembleTypes` names, cached after the first call. */
export function getAllEnsembles(): string[] {
  if (!allEnsemblesCache) {
    allEnsemblesCache = getAllNames(PartEnsembleTypes);
  }
  return allEnsemblesCache;
}
