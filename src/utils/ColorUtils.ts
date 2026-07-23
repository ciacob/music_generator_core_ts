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
 * N.B.: ported verbatim, including a bug present in the original AS3:
 * the per-channel `red/green/blueLowerLimit`/`red/green/blueHigherLimit`
 * parameters are unconditionally overwritten with `lowerLimit`/
 * `higherLimit` before use (`redLowerLimit = Math.max(lowerLimit, 0)`
 * rather than `Math.max(redLowerLimit, 0)`, and so on for all six),
 * meaning the per-channel limits never actually take effect — only the
 * generic `lowerLimit`/`higherLimit` do. This is a faithful translation
 * of the engine's actual behavior; the only two call sites in the engine
 * invoke this with no arguments at all, so the bug has no practical
 * effect there, but it's flagged here rather than silently "fixed" per
 * this project's convention of preserving original behavior.
 *
 * @param pool Optional; an array to populate with colors already
 * generated, to avoid repeating colors. If `null` (the default), nothing
 * is done to ensure generated colors' uniqueness.
 * @param lowerLimit Optional; if provided, none of the red, green, and
 * blue channels can take values smaller than this limit.
 * @param higherLimit Optional; if provided, none of the red, green, and
 * blue channels can take values greater than this limit.
 * @param redLowerLimit See the note above: has no effect in the original
 * engine behavior, preserved here for fidelity.
 * @param redHigherLimit See the note above.
 * @param greenLowerLimit See the note above.
 * @param greenHigherLimit See the note above.
 * @param blueLowerLimit See the note above.
 * @param blueHigherLimit See the note above.
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
  // Preserving the original's overwrite-with-generic-limit behavior; see
  // the "N.B." above.
  redLowerLimit = effectiveLower;
  greenLowerLimit = effectiveLower;
  blueLowerLimit = effectiveLower;

  const effectiveHigher = Math.min(higherLimit, 0xff);
  redHigherLimit = effectiveHigher;
  greenHigherLimit = effectiveHigher;
  blueHigherLimit = effectiveHigher;

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
