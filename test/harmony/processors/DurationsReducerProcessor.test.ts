import { describe, expect, it } from 'vitest';
import { $get } from '../../../src/knowledge/instruments/InstrumentFactory.js';
import { DurationsReducerProcessor } from '../../../src/harmony/processors/DurationsReducerProcessor.js';
import { Fraction } from '../../../src/math/Fraction.js';
import { MusicPitch } from '../../../src/core/MusicPitch.js';
import { MusicUnit } from '../../../src/core/MusicUnit.js';
import { MusicalBody } from '../../../src/core/MusicalBody.js';
import { PitchAllocation } from '../../../src/core/PitchAllocation.js';
import type { IMusicRequest } from '../../../src/core/interfaces/IMusicRequest.js';
import type { IMusicUnit } from '../../../src/core/interfaces/IMusicUnit.js';
import type { IMusicalInstrument } from '../../../src/knowledge/instruments/IMusicalInstrument.js';

/** Builds a music unit with one pitch per `{midiNote, voiceIndex}` entry, allocated to `instrument`. */
function unitOf(instrument: IMusicalInstrument, ...notes: Array<{ midiNote: number; voiceIndex: number }>): IMusicUnit {
  const unit = new MusicUnit();
  unit.duration = Fraction.WHOLE;
  for (const { midiNote, voiceIndex } of notes) {
    const pitch = new MusicPitch();
    pitch.midiNote = midiNote;
    unit.pitches.push(pitch);
    unit.pitchAllocations.push(new PitchAllocation(instrument, voiceIndex, pitch));
  }
  return unit;
}

const dummyRequest = {} as IMusicRequest;

describe('DurationsReducerProcessor', () => {
  it('ties two adjacent units with the same pitch, instrument, and voiceIndex', () => {
    const piano = $get('Piano', 0) as IMusicalInstrument;
    const unitA = unitOf(piano, { midiNote: 60, voiceIndex: 1 });
    const unitB = unitOf(piano, { midiNote: 60, voiceIndex: 1 });
    const body = new MusicalBody();
    body.push(unitA, unitB);

    new DurationsReducerProcessor().execute(body, dummyRequest);

    expect(unitA.pitches[0]?.tieNext).toBe(true);
    expect(unitB.pitches[0]?.tieNext).toBe(false); // only the LEFT (earlier) pitch is ever tied
  });

  it('does not tie when the pitch differs', () => {
    const piano = $get('Piano', 0) as IMusicalInstrument;
    const unitA = unitOf(piano, { midiNote: 60, voiceIndex: 1 });
    const unitB = unitOf(piano, { midiNote: 62, voiceIndex: 1 });
    const body = new MusicalBody();
    body.push(unitA, unitB);

    new DurationsReducerProcessor().execute(body, dummyRequest);

    expect(unitA.pitches[0]?.tieNext).toBe(false);
  });

  it('does not tie when the voiceIndex differs, even with the same pitch and instrument', () => {
    const piano = $get('Piano', 0) as IMusicalInstrument;
    const unitA = unitOf(piano, { midiNote: 60, voiceIndex: 1 });
    const unitB = unitOf(piano, { midiNote: 60, voiceIndex: 2 });
    const body = new MusicalBody();
    body.push(unitA, unitB);

    new DurationsReducerProcessor().execute(body, dummyRequest);

    expect(unitA.pitches[0]?.tieNext).toBe(false);
  });

  it('does not tie when the instrument differs, even with the same pitch and voiceIndex', () => {
    const piano = $get('Piano', 0) as IMusicalInstrument;
    const violin = $get('Violin', 0) as IMusicalInstrument;
    const unitA = unitOf(piano, { midiNote: 60, voiceIndex: 1 });
    const unitB = unitOf(violin, { midiNote: 60, voiceIndex: 1 });
    const body = new MusicalBody();
    body.push(unitA, unitB);

    new DurationsReducerProcessor().execute(body, dummyRequest);

    expect(unitA.pitches[0]?.tieNext).toBe(false);
  });

  it('matches pitches by index, not by voiceIndex, across multi-voice units', () => {
    // unitA has pitch[0]=voice1(60), pitch[1]=voice2(64). unitB has pitch[0]=voice1(60),
    // pitch[1]=voice2(65). Only the index-0 pair (both voice1, both midi60) should tie.
    const piano = $get('Piano', 0) as IMusicalInstrument;
    const unitA = unitOf(piano, { midiNote: 60, voiceIndex: 1 }, { midiNote: 64, voiceIndex: 2 });
    const unitB = unitOf(piano, { midiNote: 60, voiceIndex: 1 }, { midiNote: 65, voiceIndex: 2 });
    const body = new MusicalBody();
    body.push(unitA, unitB);

    new DurationsReducerProcessor().execute(body, dummyRequest);

    expect(unitA.pitches[0]?.tieNext).toBe(true);
    expect(unitA.pitches[1]?.tieNext).toBe(false);
  });

  it('does not tie when the right unit has fewer pitches than the matching index', () => {
    const piano = $get('Piano', 0) as IMusicalInstrument;
    const unitA = unitOf(piano, { midiNote: 60, voiceIndex: 1 }, { midiNote: 64, voiceIndex: 2 });
    const unitB = unitOf(piano, { midiNote: 60, voiceIndex: 1 }); // only 1 pitch
    const body = new MusicalBody();
    body.push(unitA, unitB);

    expect(() => new DurationsReducerProcessor().execute(body, dummyRequest)).not.toThrow();
    expect(unitA.pitches[0]?.tieNext).toBe(true);
    expect(unitA.pitches[1]?.tieNext).toBe(false); // no corresponding right pitch at index 1
  });

  it('ties across a chain of 3+ units, comparing only consecutive pairs', () => {
    const piano = $get('Piano', 0) as IMusicalInstrument;
    const unitA = unitOf(piano, { midiNote: 60, voiceIndex: 1 });
    const unitB = unitOf(piano, { midiNote: 60, voiceIndex: 1 });
    const unitC = unitOf(piano, { midiNote: 60, voiceIndex: 1 });
    const body = new MusicalBody();
    body.push(unitA, unitB, unitC);

    new DurationsReducerProcessor().execute(body, dummyRequest);

    expect(unitA.pitches[0]?.tieNext).toBe(true); // ties into unitB
    expect(unitB.pitches[0]?.tieNext).toBe(true); // ties into unitC
    expect(unitC.pitches[0]?.tieNext).toBe(false); // nothing follows unitC
  });

  it('does nothing for an empty or single-unit body (no adjacent pair to compare)', () => {
    const piano = $get('Piano', 0) as IMusicalInstrument;
    const emptyBody = new MusicalBody();
    expect(() => new DurationsReducerProcessor().execute(emptyBody, dummyRequest)).not.toThrow();

    const singleUnit = unitOf(piano, { midiNote: 60, voiceIndex: 1 });
    const singleBody = new MusicalBody();
    singleBody.push(singleUnit);
    new DurationsReducerProcessor().execute(singleBody, dummyRequest);
    expect(singleUnit.pitches[0]?.tieNext).toBe(false);
  });

  it('treats a rest (midiNote 0) matching another rest as a tie, matching the AS3 original (no rest-exclusion check)', () => {
    // The AS3 original never special-cases midiNote === 0 here -- two adjacent rests in the
    // same voice/instrument satisfy every condition (equal midiNote, equal instrument, equal
    // voiceIndex) and get tied, same as any other matching pair. Ported faithfully.
    const piano = $get('Piano', 0) as IMusicalInstrument;
    const unitA = unitOf(piano, { midiNote: 0, voiceIndex: 1 });
    const unitB = unitOf(piano, { midiNote: 0, voiceIndex: 1 });
    const body = new MusicalBody();
    body.push(unitA, unitB);

    new DurationsReducerProcessor().execute(body, dummyRequest);

    expect(unitA.pitches[0]?.tieNext).toBe(true);
  });
});
