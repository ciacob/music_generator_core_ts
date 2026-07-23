import { toAS3ConstantCase } from '../../utils/Strings.js';
import { MusicalInstrument } from './MusicalInstrument.js';
import { PartNames } from '../../generators/constants/parts/PartNames.js';

/**
 * Compiles and caches `MusicalInstrument` instances.
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/eu/stochastic/engine/music/knowledge/instruments/InstrumentFactory.as`.
 * A static-only AS3 class, translated as a plain module of functions per
 * this project's established convention (see `utils/` in step 2, and
 * `TimeSignatureFactory.ts` in step 4).
 *
 * **Bug fixed**: the AS3 original builds its cache key via plain string
 * concatenation (`instrumentName + ordinalIndex`), which can collide —
 * e.g. `"Violin1"` at ordinal `0` and `"Violin"` at ordinal `10` both
 * produce the key `"Violin10"`. No evidence this ever caused a real
 * problem (nothing in the engine currently constructs instrument names
 * with embedded digits), but it's a one-line fix with no downstream risk,
 * so a delimiter (`\u0000`, which cannot appear in a `PartNames` key or a
 * reasonable instrument name) is used instead of raw concatenation.
 */
const instrumentsCache = new Map<string, MusicalInstrument | null>();

function cacheKeyFor(instrumentName: string, ordinalIndex: number): string {
  return `${instrumentName}\u0000${ordinalIndex}`;
}

/**
 * Compiles and returns a `MusicalInstrument` instance, provided
 * `instrumentName` matches one of the constants defined in `PartNames`.
 *
 * Created instruments are cached, so only a single instance of every
 * requested instrument is ever returned (also honoring `ordinalIndex`, so
 * that if there are two Violins in a score, two separate instances are
 * maintained in the cache).
 *
 * @param instrumentName The instrument name. Accepted values are one of
 * the constants defined in `PartNames`.
 * @param ordinalIndex The ordinal number of this instrument instance in
 * the score, e.g. if this is the first Violin playing, `0`; the second,
 * `1`.
 * @returns The instrument instance, or `null` if `instrumentName` doesn't
 * match any known part name.
 */
export function $get(instrumentName: string, ordinalIndex: number): MusicalInstrument | null {
  const cacheKey = cacheKeyFor(instrumentName, ordinalIndex);
  if (!instrumentsCache.has(cacheKey)) {
    const canonicalName = toAS3ConstantCase(instrumentName);
    if (canonicalName in PartNames) {
      instrumentsCache.set(cacheKey, new MusicalInstrument(instrumentName, ordinalIndex));
    } else {
      instrumentsCache.set(cacheKey, null);
    }
  }
  return instrumentsCache.get(cacheKey) ?? null;
}
