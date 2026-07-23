import { describe, expect, it } from 'vitest';
import { MusicalInstrument } from '../../../src/knowledge/instruments/MusicalInstrument.js';

describe('MusicalInstrument construction', () => {
  it('normalizes the given instrument name to AS3-constant-case internally', () => {
    const violin = new MusicalInstrument('Violin', 0);
    expect(violin.internalName).toBe('VIOLIN');
  });

  it('accepts a name that already looks AS3-constant-cased', () => {
    const violin = new MusicalInstrument('VIOLIN', 0);
    expect(violin.internalName).toBe('VIOLIN');
  });

  it('exposes ordinalIndex as given', () => {
    const secondViolin = new MusicalInstrument('Violin', 1);
    expect(secondViolin.ordinalIndex).toBe(1);
  });
});

describe('MusicalInstrument data-sourced properties', () => {
  it('reads name/abbreviatedName from PartNames/PartAbbreviatedNames', () => {
    const piano = new MusicalInstrument('Piano', 0);
    expect(piano.name).toBe('Piano');
    expect(piano.abbreviatedName).toBe('Pno.');
  });

  it('reads midiRange/midiPatch/transposition correctly', () => {
    const piano = new MusicalInstrument('Piano', 0);
    expect(piano.midiRange).toEqual([21, 108]);
    expect(piano.midiPatch).toBe(113);
    expect(piano.transposition).toBe(0);
  });

  it('reads a negative transposition correctly (contrabass, -12)', () => {
    const contrabass = new MusicalInstrument('Contrabass', 0);
    expect(contrabass.transposition).toBe(-12);
  });

  it('reads partFamily via PartFamilies.getPartFamily', () => {
    const violin = new MusicalInstrument('Violin', 0);
    expect(violin.partFamily).toBe('BOWED_STRINGS');
  });

  it('reads clefs/bracket from the Part* default tables', () => {
    const viola = new MusicalInstrument('Viola', 0);
    expect(viola.clefs).toEqual(['∞']); // ClefTypes.ALTO
  });

  it('reads maximumPoliphony/maximumAutonomousVoices', () => {
    const piano = new MusicalInstrument('Piano', 0);
    expect(piano.maximumPoliphony).toBe(88);
    expect(piano.maximumAutonomousVoices).toBe(4);
  });
});

describe('MusicalInstrument.staffNames / abbreviatedStaffNames (bug fix verification)', () => {
  it('staffNames sources from the full (non-abbreviated) voice names table', () => {
    const piano = new MusicalInstrument('Piano', 0);
    expect(piano.staffNames).toEqual(['Right Hand', 'Left Hand']);
  });

  it('abbreviatedStaffNames sources from the abbreviated voice names table', () => {
    const piano = new MusicalInstrument('Piano', 0);
    expect(piano.abbreviatedStaffNames).toEqual(['R.H.', 'L.H.']);
  });

  it('staffNames and abbreviatedStaffNames are distinct', () => {
    const piano = new MusicalInstrument('Piano', 0);
    expect(piano.staffNames).not.toEqual(piano.abbreviatedStaffNames);
  });
});

describe('MusicalInstrument.stavesNumber', () => {
  it('defaults to the value in PartDefaultStavesNumber', () => {
    const piano = new MusicalInstrument('Piano', 0);
    expect(piano.stavesNumber).toBe(2);
  });

  it('can be overridden by the caller', () => {
    const piano = new MusicalInstrument('Piano', 0);
    piano.stavesNumber = 3;
    expect(piano.stavesNumber).toBe(3);
  });
});

describe('MusicalInstrument.uid', () => {
  it('lazily generates a UID on first read', () => {
    const piano = new MusicalInstrument('Piano', 0);
    expect(piano.uid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('returns the same UID across repeated reads', () => {
    const piano = new MusicalInstrument('Piano', 0);
    expect(piano.uid).toBe(piano.uid);
  });

  it('can be explicitly set', () => {
    const piano = new MusicalInstrument('Piano', 0);
    piano.uid = 'custom-uid';
    expect(piano.uid).toBe('custom-uid');
  });

  it('gives distinct instruments distinct UIDs', () => {
    const a = new MusicalInstrument('Piano', 0);
    const b = new MusicalInstrument('Piano', 1);
    expect(a.uid).not.toBe(b.uid);
  });
});

describe('MusicalInstrument.toString', () => {
  it('includes the name and MIDI range', () => {
    const piano = new MusicalInstrument('Piano', 0);
    expect(piano.toString()).toBe('Musical Instrument: Piano (21, 108)');
  });
});
