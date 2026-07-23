import { describe, expect, it } from 'vitest';
import { PartAbbreviatedNames } from '../../../../src/generators/constants/parts/PartAbbreviatedNames.js';
import { PartDefaultBrackets } from '../../../../src/generators/constants/parts/PartDefaultBrackets.js';
import { PartDefaultClefs } from '../../../../src/generators/constants/parts/PartDefaultClefs.js';
import { PartDefaultStavesNumber } from '../../../../src/generators/constants/parts/PartDefaultStavesNumber.js';
import { PartIdealHarmonicRange } from '../../../../src/generators/constants/parts/PartIdealHarmonicRange.js';
import { PartMaxAutonomousVoices } from '../../../../src/generators/constants/parts/PartMaxAutonomousVoices.js';
import { PartMaxPoliphony } from '../../../../src/generators/constants/parts/PartMaxPoliphony.js';
import { PartMidiPatches } from '../../../../src/generators/constants/parts/PartMidiPatches.js';
import { PartRanges } from '../../../../src/generators/constants/parts/PartRanges.js';
import { PartTranspositions } from '../../../../src/generators/constants/parts/PartTranspositions.js';
import { ClefTypes } from '../../../../src/generators/constants/ClefTypes.js';
import { BracketTypes } from '../../../../src/generators/constants/BracketTypes.js';

describe('PartAbbreviatedNames', () => {
  it('has 29 members, spot-checked', () => {
    expect(Object.keys(PartAbbreviatedNames)).toHaveLength(29);
    expect(PartAbbreviatedNames.PIANO).toBe('Pno.');
    expect(PartAbbreviatedNames.VIOLIN).toBe('Vln.');
  });
});

describe('PartDefaultBrackets', () => {
  it('assigns brace-first-two to keyboards, none to solo strings', () => {
    expect(PartDefaultBrackets.PIANO).toBe(BracketTypes.BRACE_FIRST_TWO);
    expect(PartDefaultBrackets.VIOLIN).toBe(BracketTypes.NONE);
    expect(PartDefaultBrackets.FRENCH_HORNS).toBe(BracketTypes.BRACKET_ALL);
  });
});

describe('PartDefaultClefs', () => {
  it('assigns the expected clef(s) per instrument', () => {
    expect(PartDefaultClefs.PIANO).toEqual([ClefTypes.TREBLE, ClefTypes.BASS]);
    expect(PartDefaultClefs.VIOLA).toEqual([ClefTypes.ALTO]);
    expect(PartDefaultClefs.CHOIR).toHaveLength(4);
  });
});

describe('PartDefaultStavesNumber', () => {
  it('assigns 2 staves to piano, 1 to violin, 4 to choir', () => {
    expect(PartDefaultStavesNumber.PIANO).toBe(2);
    expect(PartDefaultStavesNumber.VIOLIN).toBe(1);
    expect(PartDefaultStavesNumber.CHOIR).toBe(4);
  });
});

describe('PartIdealHarmonicRange', () => {
  it('gives each entry a [low, high] pair with low < high', () => {
    for (const [low, high] of Object.values(PartIdealHarmonicRange)) {
      expect(low).toBeLessThan(high);
    }
  });
});

describe('PartMaxAutonomousVoices / PartMaxPoliphony', () => {
  it('gives piano a higher max polyphony than max autonomous voices', () => {
    expect(PartMaxPoliphony.PIANO).toBeGreaterThan(PartMaxAutonomousVoices.PIANO);
  });
});

describe('PartMidiPatches', () => {
  it('has 28 members, all within the valid velocity/patch byte range', () => {
    expect(Object.keys(PartMidiPatches)).toHaveLength(28);
    for (const value of Object.values(PartMidiPatches)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(127);
    }
  });
});

describe('PartRanges', () => {
  it('gives each entry a [low, high] MIDI pair with low < high', () => {
    for (const [low, high] of Object.values(PartRanges)) {
      expect(low).toBeLessThan(high);
    }
  });
});

describe('PartTranspositions', () => {
  it('transposes contrabass down an octave and celesta up an octave', () => {
    expect(PartTranspositions.CONTRABASS).toBe(-12);
    expect(PartTranspositions.CELESTA).toBe(12);
    expect(PartTranspositions.PIANO).toBe(0);
  });
});
