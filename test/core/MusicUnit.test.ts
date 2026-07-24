import { describe, expect, it } from 'vitest';
import { Fraction } from '../../src/math/Fraction.js';
import { MusicPitch } from '../../src/core/MusicPitch.js';
import { MusicUnit } from '../../src/core/MusicUnit.js';
import type { IPerformanceInstruction } from '../../src/core/interfaces/IPerformanceInstruction.js';

describe('MusicUnit.uid', () => {
  it('lazily generates a UID on first read', () => {
    const unit = new MusicUnit();
    expect(unit.uid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('returns the same UID across repeated reads', () => {
    const unit = new MusicUnit();
    expect(unit.uid).toBe(unit.uid);
  });
});

describe('MusicUnit properties', () => {
  it('gets/sets duration', () => {
    const unit = new MusicUnit();
    unit.duration = new Fraction(1, 4);
    expect(unit.duration.toString()).toBe('1/4');
  });

  it('gets/sets tupletRootUid', () => {
    const unit = new MusicUnit();
    unit.tupletRootUid = 'root-1';
    expect(unit.tupletRootUid).toBe('root-1');
  });

  it('starts with empty pitches/pitchAllocations/performanceInstructions', () => {
    const unit = new MusicUnit();
    expect(unit.pitches).toEqual([]);
    expect(unit.pitchAllocations).toEqual([]);
    expect(unit.performanceInstructions).toEqual([]);
  });

  it('pitches array is mutable in place (push works)', () => {
    const unit = new MusicUnit();
    const pitch = new MusicPitch();
    pitch.midiNote = 60;
    unit.pitches.push(pitch);
    expect(unit.pitches).toEqual([pitch]);
  });
});

describe('MusicUnit.analysisScores', () => {
  it('lazily creates an AnalysisScores instance', () => {
    const unit = new MusicUnit();
    expect(unit.analysisScores.isEmpty()).toBe(true);
  });

  it('returns the same instance across repeated reads', () => {
    const unit = new MusicUnit();
    expect(unit.analysisScores).toBe(unit.analysisScores);
  });
});

describe('MusicUnit.clone', () => {
  it('produces a distinct instance with a different uid', () => {
    const unit = new MusicUnit();
    const clone = unit.clone();
    expect(clone).not.toBe(unit);
    expect(clone.uid).not.toBe(unit.uid);
  });

  it('copies duration/tupletRootUid/tupletDefinition', () => {
    const unit = new MusicUnit();
    unit.duration = new Fraction(3, 8);
    unit.tupletRootUid = 'root-1';
    unit.tupletDefinition = {
      tupletBeatsNumber: 3,
      tupletBeatDuration: new Fraction(1, 8),
      regularBeatsNumber: 2,
      regularBeatDuration: new Fraction(1, 8),
    };
    const clone = unit.clone();
    expect(clone.duration.toString()).toBe('3/8');
    expect(clone.tupletRootUid).toBe('root-1');
    expect(clone.tupletDefinition.tupletBeatsNumber).toBe(3);
  });

  it('copies pitches by reference (shallow clone)', () => {
    const unit = new MusicUnit();
    const pitch = new MusicPitch();
    unit.pitches.push(pitch);
    const clone = unit.clone();
    expect(clone.pitches).toHaveLength(1);
    expect(clone.pitches[0]).toBe(pitch);
  });

  it('copies a real, populated performanceInstructions entry (by reference, shallow clone)', () => {
    // IPerformanceInstruction has no concrete implementation anywhere in the engine (like
    // ITupletDefinition, it's an interface-only stub) -- exercised here with a plain object
    // literal matching its shape, the same treatment already given to tupletDefinition above.
    const unit = new MusicUnit();
    const instruction: IPerformanceInstruction = {
      uid: 'instr-1',
      name: 'Allegro',
      category: 'tempo',
      value: 132,
    };
    unit.performanceInstructions.push(instruction);
    const clone = unit.clone();
    expect(clone.performanceInstructions).toHaveLength(1);
    expect(clone.performanceInstructions[0]).toBe(instruction);
    expect(clone.performanceInstructions[0]?.category).toBe('tempo');
  });

  it('copies non-empty analysis scores', () => {
    const unit = new MusicUnit();
    unit.analysisScores.add('consonance', 80);
    const clone = unit.clone();
    expect(clone.analysisScores.getValueFor('consonance')).toBe(80);
  });

  it('does not create an AnalysisScores on the clone if the original never had one read', () => {
    const unit = new MusicUnit();
    const clone = unit.clone();
    // Reading .analysisScores lazily creates one on the clone too, but it
    // must be empty since the original was never populated.
    expect(clone.analysisScores.isEmpty()).toBe(true);
  });
});

describe('MusicUnit.toString', () => {
  it('includes the uid and pitches', () => {
    const unit = new MusicUnit();
    unit.duration = new Fraction(1, 4);
    const pitch = new MusicPitch();
    pitch.midiNote = 60;
    unit.pitches.push(pitch);
    const str = unit.toString();
    expect(str).toContain(unit.uid);
    expect(str).toContain('60');
  });
});
