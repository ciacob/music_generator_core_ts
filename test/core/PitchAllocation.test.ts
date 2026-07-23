import { describe, expect, it } from 'vitest';
import { PitchAllocation } from '../../src/core/PitchAllocation.js';
import { MusicPitch } from '../../src/core/MusicPitch.js';
import type { IMusicalInstrument } from '../../src/knowledge/instruments/IMusicalInstrument.js';

function makeInstrumentStub(internalName: string, uid: string): IMusicalInstrument {
  return {
    uid,
    internalName,
    name: internalName,
    abbreviatedName: internalName,
    ordinalIndex: 0,
    staffNames: [],
    abbreviatedStaffNames: [],
    stavesNumber: 1,
    clefs: [],
    bracket: '',
    partFamily: '',
    midiPatch: 0,
    midiRange: [0, 127],
    idealHarmonicRange: [0, 127],
    maximumPoliphony: 1,
    maximumAutonomousVoices: 1,
    transposition: 0,
  };
}

describe('PitchAllocation', () => {
  it('exposes instrument/voiceIndex/allocatedPitch as given via the constructor', () => {
    const instrument = makeInstrumentStub('VIOLIN', 'uid-1');
    const pitch = new MusicPitch();
    pitch.midiNote = 67;
    const allocation = new PitchAllocation(instrument, 1, pitch);

    expect(allocation.instrument).toBe(instrument);
    expect(allocation.voiceIndex).toBe(1);
    expect(allocation.allocatedPitch).toBe(pitch);
  });

  it('allows updating instrument/voiceIndex/allocatedPitch', () => {
    const allocation = new PitchAllocation(makeInstrumentStub('VIOLIN', 'uid-1'), 1, new MusicPitch());
    const newInstrument = makeInstrumentStub('VIOLA', 'uid-2');
    const newPitch = new MusicPitch();
    allocation.instrument = newInstrument;
    allocation.voiceIndex = 2;
    allocation.allocatedPitch = newPitch;

    expect(allocation.instrument).toBe(newInstrument);
    expect(allocation.voiceIndex).toBe(2);
    expect(allocation.allocatedPitch).toBe(newPitch);
  });

  it('toString includes instrument name/uid, voice index, and pitch', () => {
    const instrument = makeInstrumentStub('VIOLIN', 'uid-1');
    const pitch = new MusicPitch();
    pitch.midiNote = 67;
    const allocation = new PitchAllocation(instrument, 1, pitch);
    const str = allocation.toString();
    expect(str).toContain('VIOLIN');
    expect(str).toContain('uid-1');
    expect(str).toContain('voice 1');
    expect(str).toContain('67');
  });
});
