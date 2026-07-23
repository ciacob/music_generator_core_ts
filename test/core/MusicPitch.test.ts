import { describe, expect, it } from 'vitest';
import { MusicPitch } from '../../src/core/MusicPitch.js';

describe('MusicPitch', () => {
  it('defaults to midiNote 0 and tieNext false', () => {
    const pitch = new MusicPitch();
    expect(pitch.midiNote).toBe(0);
    expect(pitch.tieNext).toBe(false);
  });

  it('gets/sets midiNote and tieNext', () => {
    const pitch = new MusicPitch();
    pitch.midiNote = 60;
    pitch.tieNext = true;
    expect(pitch.midiNote).toBe(60);
    expect(pitch.tieNext).toBe(true);
  });

  it('toString appends "=" when tied, nothing when not', () => {
    const pitch = new MusicPitch();
    pitch.midiNote = 60;
    expect(pitch.toString()).toBe('60');
    pitch.tieNext = true;
    expect(pitch.toString()).toBe('60=');
  });
});
