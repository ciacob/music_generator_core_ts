import { describe, expect, it } from 'vitest';
import { generateRandomColor } from '../../src/utils/ColorUtils.js';

describe('generateRandomColor', () => {
  it('produces a value within the 24-bit color range', () => {
    const color = generateRandomColor(null, 0, 0xff, 0, 0, 0, 0, 0, 0, () => 0.5);
    expect(color).toBeGreaterThanOrEqual(0);
    expect(color).toBeLessThanOrEqual(0xffffff);
  });

  it('is deterministic for a fixed RNG', () => {
    const a = generateRandomColor(null, 0, 0xff, 0, 0, 0, 0, 0, 0, () => 0.25);
    const b = generateRandomColor(null, 0, 0xff, 0, 0, 0, 0, 0, 0, () => 0.25);
    expect(a).toBe(b);
  });

  it('produces 0x000000 when the RNG always returns 0 and limits are [0, 0xff]', () => {
    expect(generateRandomColor(null, 0, 0xff, 0, 0, 0, 0, 0, 0, () => 0)).toBe(0x000000);
  });

  it('produces 0xffffff when the RNG approaches 1 and limits are [0, 0xff]', () => {
    expect(generateRandomColor(null, 0, 0xff, 0, 0, 0, 0, 0, 0, () => 0.9999999)).toBe(0xffffff);
  });

  it('honors the generic lowerLimit/higherLimit clamp', () => {
    // With lower=higher=0x80, every channel must be exactly 0x80,
    // regardless of RNG output.
    const color = generateRandomColor(null, 0x80, 0x80, 0, 0, 0, 0, 0, 0, () => 0.999);
    expect(color).toBe(0x808080);
  });

  it('lets an explicit per-channel limit take precedence over the generic one', () => {
    // Generic range is wide open [0, 0xff], but the red channel is
    // pinned to exactly 0x40 via redLowerLimit/redHigherLimit. Before the
    // fix, these per-channel values were silently discarded and the red
    // channel would have used the generic [0, 0xff] range instead.
    const color = generateRandomColor(null, 0, 0xff, 0x40, 0x40, 0, 0, 0, 0, () => 0.999);
    const red = (color >> 16) & 0xff;
    expect(red).toBe(0x40);
  });

  it('appends the generated color to the given pool and avoids repeats already in it', () => {
    const pool: number[] = [0x000000];
    // RNG sequence: first call would collide with the pre-seeded pool
    // entry, subsequent calls must be used to regenerate until unique.
    let callCount = 0;
    const randomFn = () => {
      callCount++;
      // First 3 calls (r, g, b of the first attempt) return 0 -> collides
      // with the pre-seeded 0x000000; afterwards return 0.5 so the retry
      // produces a different color.
      return callCount <= 3 ? 0 : 0.5;
    };
    const color = generateRandomColor(pool, 0, 0xff, 0, 0, 0, 0, 0, 0, randomFn);
    expect(color).not.toBe(0x000000);
    expect(pool).toContain(color);
    expect(pool).toHaveLength(2);
  });
});
