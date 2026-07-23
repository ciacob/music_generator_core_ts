/**
 * Ported from
 * `as-sources/legacy-generators-base-library/ro/se/legacy/generators/constants/MIDI.as`.
 */
export const MIDI = {
  PERCUSSION_RESERVED_CHANNEL_INDEX: 10,
  CHANNELS_STACK_SIZE: 16,

  MAX: 127,
  MIN: 0,

  UNKNOWN_STATE: 0,
  PLAYING_STATE: 1,
  STOPPED_STATE: 2,
} as const;

/**
 * Returns `true` if `channelNum` is a General MIDI percussion reserved
 * channel number, such as 10, 26, 42, etc.
 *
 * Note that the General MIDI standard only provides one set of 16 MIDI
 * channels (thus, only one channel reserved for percussion, channel 10).
 * However, synths alleviate this limitation by stacking together several
 * GM sets, up to the current ensemble's instrumentation needs. This means
 * the 10th channel in each set of 16 is a percussion-reserved channel,
 * and its number progresses by the formula `i * 16 + 10`, where `i`
 * ranges from `0` up to the number of GM sets supported by the synth.
 */
export function isPercussionChannel(channelNum: number): boolean {
  return (channelNum - MIDI.PERCUSSION_RESERVED_CHANNEL_INDEX) % MIDI.CHANNELS_STACK_SIZE === 0;
}
