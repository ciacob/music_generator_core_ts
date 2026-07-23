import { describe, expect, it } from 'vitest';
import { Direction } from '../../../../src/generators/constants/pitch/Direction.js';
import { IntervalNames } from '../../../../src/generators/constants/pitch/IntervalNames.js';
import { MiddleCMapping } from '../../../../src/generators/constants/pitch/MiddleCMapping.js';
import { OctaveIndexes } from '../../../../src/generators/constants/pitch/OctaveIndexes.js';
import { OctaveNames } from '../../../../src/generators/constants/pitch/OctaveNames.js';
import { PitchAlterationSymbols } from '../../../../src/generators/constants/pitch/PitchAlterationSymbols.js';
import { PitchAlterationTypes } from '../../../../src/generators/constants/pitch/PitchAlterationTypes.js';
import { PitchNames } from '../../../../src/generators/constants/pitch/PitchNames.js';

describe('Direction', () => {
  it('defines UP, DOWN, ABOVE, BELOW', () => {
    expect(Direction).toEqual({
      UP: 'directionUp',
      DOWN: 'directionDown',
      ABOVE: 'above',
      BELOW: 'below',
    });
  });
});

describe('IntervalNames', () => {
  it('has 13 members, spot-checked', () => {
    expect(Object.keys(IntervalNames)).toHaveLength(13);
    expect(IntervalNames.PERFECT_FIFTH).toBe('perfect fifth');
    expect(IntervalNames.MAJOR_SEVENTH).toBe('major seventh');
  });
});

describe('MiddleCMapping', () => {
  it('defines middle C as MIDI note 60, octave index 4', () => {
    expect(MiddleCMapping.MIDDLE_C_MIDI_VALUE).toBe(60);
    expect(MiddleCMapping.MIDDLE_C_OCTAVE_INDEX).toBe(4);
  });
});

describe('OctaveIndexes / OctaveNames', () => {
  it('agree on which index maps to the 1-line octave', () => {
    expect(OctaveIndexes.ONE_LINE_OCTAVE).toBe(4);
    expect(OctaveNames.ONE_LINE_OCTAVE).toBe('1-line octave');
  });

  it('has matching key sets between indexes and names', () => {
    expect(Object.keys(OctaveIndexes).sort()).toEqual(Object.keys(OctaveNames).sort());
  });
});

describe('PitchAlterationSymbols / PitchAlterationTypes', () => {
  it('have matching key sets', () => {
    const symbolKeys = Object.keys(PitchAlterationSymbols).sort();
    const typeKeys = Object.keys(PitchAlterationTypes).filter((k) => k !== 'HIDE').sort();
    expect(symbolKeys).toEqual(typeKeys);
  });

  it('spot-checks sharp/flat values', () => {
    expect(PitchAlterationTypes.SHARP).toBe(1);
    expect(PitchAlterationTypes.FLAT).toBe(-1);
    expect(PitchAlterationTypes.HIDE).toBe(0xff);
  });
});

describe('PitchNames', () => {
  it('defines the 7 natural pitch letters', () => {
    expect(Object.values(PitchNames)).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B']);
  });
});
