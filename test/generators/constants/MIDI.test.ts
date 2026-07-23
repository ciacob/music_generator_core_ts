import { describe, expect, it } from 'vitest';
import { MIDI, isPercussionChannel } from '../../../src/generators/constants/MIDI.js';

describe('MIDI constants', () => {
  it('defines the expected values', () => {
    expect(MIDI.PERCUSSION_RESERVED_CHANNEL_INDEX).toBe(10);
    expect(MIDI.CHANNELS_STACK_SIZE).toBe(16);
    expect(MIDI.MAX).toBe(127);
    expect(MIDI.MIN).toBe(0);
  });
});

describe('isPercussionChannel', () => {
  it('is true for channel 10 (the base GM percussion channel)', () => {
    expect(isPercussionChannel(10)).toBe(true);
  });

  it('is true for subsequent stacked GM sets (26, 42, ...)', () => {
    expect(isPercussionChannel(26)).toBe(true);
    expect(isPercussionChannel(42)).toBe(true);
  });

  it('is false for a non-percussion channel', () => {
    expect(isPercussionChannel(1)).toBe(false);
    expect(isPercussionChannel(11)).toBe(false);
  });
});
