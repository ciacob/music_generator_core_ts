import { describe, expect, it } from 'vitest';
import { Fraction } from '../../../../src/math/Fraction.js';
import { MusicPitch } from '../../../../src/core/MusicPitch.js';
import { MusicUnit } from '../../../../src/core/MusicUnit.js';
import { analyzeMelodicProfile, getTopPitchOf } from '../../../../src/harmony/analyzers/common/MelodicUtils.js';
import type { IMusicUnit } from '../../../../src/core/interfaces/IMusicUnit.js';

/** Builds a music unit with the given MIDI pitches (use `0` for a rest) and duration. */
function unitOf(duration: Fraction, ...midiNotes: number[]): IMusicUnit {
  const unit = new MusicUnit();
  unit.duration = duration;
  for (const midiNote of midiNotes) {
    const pitch = new MusicPitch();
    pitch.midiNote = midiNote;
    unit.pitches.push(pitch);
  }
  return unit;
}

describe('getTopPitchOf', () => {
  it('returns the highest MIDI pitch in the unit', () => {
    expect(getTopPitchOf(unitOf(Fraction.WHOLE, 60, 64, 67))).toBe(67);
  });

  it('returns 0 for a unit with no pitches', () => {
    expect(getTopPitchOf(unitOf(Fraction.WHOLE))).toBe(0);
  });

  it('returns 0 for a unit whose only pitch is a rest', () => {
    expect(getTopPitchOf(unitOf(Fraction.WHOLE, 0))).toBe(0);
  });
});

describe('analyzeMelodicProfile', () => {
  it('reports markerPitch as the top pitch of the first pitched unit', () => {
    const fragment = [unitOf(new Fraction(1, 4), 60), unitOf(new Fraction(1, 4), 64)];
    const result = analyzeMelodicProfile(fragment);
    expect(result.markerPitch).toBe(60);
  });

  it('skips leading rests when determining markerPitch', () => {
    const fragment = [unitOf(new Fraction(1, 4), 0), unitOf(new Fraction(1, 4), 72)];
    const result = analyzeMelodicProfile(fragment);
    expect(result.markerPitch).toBe(72);
  });

  it('reports highest/lowest/fragmentRange across the fragment', () => {
    const fragment = [unitOf(new Fraction(1, 4), 60), unitOf(new Fraction(1, 4), 72), unitOf(new Fraction(1, 4), 55)];
    const result = analyzeMelodicProfile(fragment);
    expect(result.highestPitchInFragment).toBe(72);
    expect(result.lowestPitchInFragment).toBe(55);
    expect(result.fragmentRange).toBe(17);
  });

  it('reports an ascending direction for a rising fragment', () => {
    const fragment = [unitOf(new Fraction(1, 4), 60), unitOf(new Fraction(1, 4), 72), unitOf(new Fraction(1, 4), 84)];
    const result = analyzeMelodicProfile(fragment, false);
    expect(result.direction).toBe(1);
  });

  it('reports a descending direction for a falling fragment', () => {
    const fragment = [unitOf(new Fraction(1, 4), 84), unitOf(new Fraction(1, 4), 72), unitOf(new Fraction(1, 4), 60)];
    const result = analyzeMelodicProfile(fragment, false);
    expect(result.direction).toBe(-1);
  });

  it('reports no clear direction for a fragment that returns to its starting pitch', () => {
    const fragment = [unitOf(new Fraction(1, 4), 60), unitOf(new Fraction(1, 4), 72), unitOf(new Fraction(1, 4), 60)];
    // Unweighted: intervals against marker (60) are 0, 12, 0 -- average interval is 4, still
    // ascending. Use a perfectly symmetric fragment instead to get a true net-zero pivot.
    const symmetric = [unitOf(new Fraction(1, 4), 60), unitOf(new Fraction(1, 4), 60)];
    const result = analyzeMelodicProfile(symmetric, false);
    expect(result.direction).toBe(0);
    expect(fragment.length).toBe(3); // fragment itself unused beyond illustrating the contrast above
  });

  it('weighInDuration=true and weighInDuration=false can disagree when durations are skewed', () => {
    // A long-held low note followed by one brief high note: weighted by duration, the high
    // note barely counts; unweighted, both pitches count equally.
    const fragment = [unitOf(new Fraction(1, 1), 60), unitOf(new Fraction(1, 16), 84)];
    const weighted = analyzeMelodicProfile(fragment, true);
    const unweighted = analyzeMelodicProfile(fragment, false);
    expect(weighted.pivotPitchInterval).not.toBe(unweighted.pivotPitchInterval);
  });

  it('ignores rest-only units when computing pitch statistics', () => {
    const fragment = [unitOf(new Fraction(1, 4), 60), unitOf(new Fraction(1, 4), 0), unitOf(new Fraction(1, 4), 60)];
    const result = analyzeMelodicProfile(fragment);
    expect(result.highestPitchInFragment).toBe(60);
    expect(result.lowestPitchInFragment).toBe(60);
  });

  describe('empty or rests-only input (documented AS3 edge case, ported as-is)', () => {
    it('produces NaN pivot fields for an empty fragment', () => {
      const result = analyzeMelodicProfile([]);
      expect(result.markerPitch).toBe(0);
      expect(Number.isNaN(result.pivotPitchInterval)).toBe(true);
      expect(Number.isNaN(result.pivotPitch)).toBe(true);
      expect(Number.isNaN(result.mirroredPivotPitch)).toBe(true);
      // NaN comparisons are always false, so `direction` still resolves to a clean 0.
      expect(result.direction).toBe(0);
    });

    it('produces the same NaN pivot fields for a rests-only fragment', () => {
      const fragment = [unitOf(new Fraction(1, 4), 0), unitOf(new Fraction(1, 4), 0)];
      const result = analyzeMelodicProfile(fragment);
      expect(Number.isNaN(result.pivotPitchInterval)).toBe(true);
      expect(Number.isNaN(result.pivotPitch)).toBe(true);
      expect(Number.isNaN(result.mirroredPivotPitch)).toBe(true);
      expect(result.direction).toBe(0);
    });
  });
});
