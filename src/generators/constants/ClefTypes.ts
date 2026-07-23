import { getAllValues } from '../../utils/ConstantUtils.js';

/**
 * Ported from
 * `as-sources/legacy-generators-base-library/ro/se/legacy/generators/constants/ClefTypes.as`.
 * `getAllTypes` used inline `flash.utils.describeType` reflection in the
 * original; here it uses the already-ported `ConstantUtils.getAllValues`
 * (see that file for the reflection -> plain-object adaptation note).
 */
export const ClefTypes = {
  BASS: '±',
  TREBLE: 'Ø',
  TENOR: '¥',
  TENOR_MODERN: '≤',
  CONTRABASS: '≥',
  ALTO: '∞',
} as const;

export function getAllTypes(): string[] {
  return getAllValues(ClefTypes) as string[];
}
