import { getRandomInteger } from './NumberUtil.js';

/**
 * Ported from `as-sources/utils-library/ro/se/utils/ColorUtils.as`.
 *
 * Only `generateRandomColor` is referenced elsewhere in the copied
 * 133-file engine snapshot (verified by grep — both call sites are in
 * `AbstractGeneratorModule.as`, called with no arguments). The rest of the
 * original file (HSV/RGB conversions, channel extraction/combination
 * helpers, `Sprite` tinting via `ColorTransform` — Flash-display-object
 * specific and inapplicable outside a Flash runtime, hex-notation
 * formatting, postscript RGB formatting) is not used anywhere in the
 * engine, so it is not ported.
 */

/**
 * Combines individual red/green/blue channel values into a 24-bit color
 * value. Private helper used only by `generateRandomColor` below; not
 * exported since nothing outside this file needs it.
 */
function combineRGB(red: number, green: number, blue: number): number {
  return (red << 16) | (green << 8) | blue;
}

/**
 * Generates a random, unique 24-bit color (alpha channel not included).
 *
 * N.B.: this fixes a bug present in the original AS3 source, so it is
 * *not* a byte-for-byte behavioral port — flagged here since it deviates
 * from this project's usual "preserve original behavior" convention. In
 * the original, the per-channel `red/green/blueLowerLimit`/
 * `red/green/blueHigherLimit` parameters were unconditionally overwritten
 * with `lowerLimit`/`higherLimit` before use (`redLowerLimit =
 * Math.max(lowerLimit, 0)` rather than `Math.max(redLowerLimit, 0)`, and
 * so on for all six), so any explicit per-channel limit a caller passed
 * was silently discarded — even though the ASDoc explicitly says each one
 * "takes precedence over" the generic limit. This port clamps each
 * per-channel limit against its own bound instead, restoring the
 * documented "takes precedence" behavior. This has zero effect on the
 * engine's only two call sites (both call this with no arguments, so
 * every per-channel limit is `0` — treated as "not provided" — either
 * way), but it does mean a future caller that actually passes per-channel
 * limits will get the documented behavior rather than the original bug.
 *
 * @param pool Optional; an array to populate with colors already
 * generated, to avoid repeating colors. If `null` (the default), nothing
 * is done to ensure generated colors' uniqueness.
 * @param lowerLimit Optional; if provided, none of the red, green, and
 * blue channels can take values smaller than this limit.
 * @param higherLimit Optional; if provided, none of the red, green, and
 * blue channels can take values greater than this limit.
 * @param redLowerLimit Optional; same as `lowerLimit`, but for the red
 * channel. Takes precedence over `lowerLimit`, which is generic.
 * @param redHigherLimit Optional; same as `higherLimit`, but for the red
 * channel. Takes precedence over `higherLimit`, which is generic.
 * @param greenLowerLimit Optional; same as `redLowerLimit`, for the green channel.
 * @param greenHigherLimit Optional; same as `redHigherLimit`, for the green channel.
 * @param blueLowerLimit Optional; same as `redLowerLimit`, for the blue channel.
 * @param blueHigherLimit Optional; same as `redHigherLimit`, for the blue channel.
 * @param randomFn A function producing a random floating point value in
 * `[0, 1)`. Optional, defaults to `Math.random`. Not present in the
 * original AS3 signature; threaded through to `NumberUtil.getRandomInteger`
 * per this project's convention of favoring injectable randomness.
 * @returns The generated color, as an unsigned 24-bit integer.
 */
export function generateRandomColor(
  pool: number[] | null = null,
  lowerLimit = 0,
  higherLimit = 0xff,
  redLowerLimit = 0,
  redHigherLimit = 0,
  greenLowerLimit = 0,
  greenHigherLimit = 0,
  blueLowerLimit = 0,
  blueHigherLimit = 0,
  randomFn: () => number = Math.random,
): number {
  const effectiveLower = Math.max(lowerLimit, 0);
  redLowerLimit = Math.max(redLowerLimit, 0);
  greenLowerLimit = Math.max(greenLowerLimit, 0);
  blueLowerLimit = Math.max(blueLowerLimit, 0);

  const effectiveHigher = Math.min(higherLimit, 0xff);
  redHigherLimit = Math.min(redHigherLimit, 0xff);
  greenHigherLimit = Math.min(greenHigherLimit, 0xff);
  blueHigherLimit = Math.min(blueHigherLimit, 0xff);

  const doGenerate = (
    lower = 0,
    higher = 0xff,
    redLow = 0,
    redHigh = 0,
    greenLow = 0,
    greenHigh = 0,
    blueLow = 0,
    blueHigh = 0,
  ): number => {
    const r = getRandomInteger(redLow || lower, redHigh || higher, randomFn);
    const g = getRandomInteger(greenLow || lower, greenHigh || higher, randomFn);
    const b = getRandomInteger(blueLow || lower, blueHigh || higher, randomFn);
    return combineRGB(r, g, b);
  };

  let color = doGenerate(
    effectiveLower,
    effectiveHigher,
    redLowerLimit,
    redHigherLimit,
    greenLowerLimit,
    greenHigherLimit,
    blueLowerLimit,
    blueHigherLimit,
  );

  if (pool != null) {
    while (pool.indexOf(color) >= 0) {
      color = doGenerate();
    }
    pool.push(color);
  }

  return color;
}
