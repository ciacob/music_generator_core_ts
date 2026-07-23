import { describe, expect, it } from 'vitest';
import { Piano } from '../../../src/knowledge/instruments/Piano.js';

describe('Piano construction', () => {
  it('constructs without arguments', () => {
    expect(() => new Piano()).not.toThrow();
  });

  it('always has internalName "PIANO"', () => {
    expect(new Piano().internalName).toBe('PIANO');
  });
});

describe('Piano data-sourced properties', () => {
  it('reads name/abbreviatedName', () => {
    const piano = new Piano();
    expect(piano.name).toBe('Piano');
    expect(piano.abbreviatedName).toBe('Pno.');
  });

  it('reads midiRange/midiPatch/transposition/partFamily', () => {
    const piano = new Piano();
    expect(piano.midiRange).toEqual([21, 108]);
    expect(piano.midiPatch).toBe(113);
    expect(piano.transposition).toBe(0);
    expect(piano.partFamily).toBe('KEYBOARDS');
  });
});

describe('Piano.staffNames / abbreviatedStaffNames (bug fix verification)', () => {
  it('staffNames sources from the full voice names table', () => {
    expect(new Piano().staffNames).toEqual(['Right Hand', 'Left Hand']);
  });

  it('abbreviatedStaffNames sources from the abbreviated voice names table', () => {
    expect(new Piano().abbreviatedStaffNames).toEqual(['R.H.', 'L.H.']);
  });
});

describe('Piano.stavesNumber', () => {
  it('reads the default from PartDefaultStavesNumber', () => {
    expect(new Piano().stavesNumber).toBe(2);
  });

  it('throws on write, matching the original AS3 (which never overrode the setter)', () => {
    const piano = new Piano();
    expect(() => {
      piano.stavesNumber = 4;
    }).toThrow();
  });
});

describe('Piano.ordinalIndex (documented gap, not invented)', () => {
  it('throws on read, matching the original AS3 (which never overrode this member)', () => {
    const piano = new Piano();
    expect(() => piano.ordinalIndex).toThrow();
  });
});

describe('Piano.uid (inherited from AbstractMusicalInstrument)', () => {
  it('lazily generates a UID', () => {
    expect(new Piano().uid).toMatch(/^[0-9a-f-]{36}$/);
  });
});
