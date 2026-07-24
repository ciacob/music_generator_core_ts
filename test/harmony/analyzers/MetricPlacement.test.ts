import { describe, expect, it } from 'vitest';
import { Fraction } from '../../../src/math/Fraction.js';
import { MetricPlacement } from '../../../src/harmony/analyzers/MetricPlacement.js';
import { MusicUnit } from '../../../src/core/MusicUnit.js';
import { ParameterNames } from '../../../src/harmony/constants/ParameterNames.js';
import { TimeSignatureEntry } from '../../../src/knowledge/timesignature/TimeSignatureEntry.js';
import { TimeSignatureMap } from '../../../src/knowledge/timesignature/TimeSignatureMap.js';
import * as TimeSignatureFactory from '../../../src/knowledge/timesignature/TimeSignatureFactory.js';
import type { IAnalysisContext } from '../../../src/core/interfaces/IAnalysisContext.js';
import type { IMusicRequest } from '../../../src/core/interfaces/IMusicRequest.js';
import type { IMusicUnit } from '../../../src/core/interfaces/IMusicUnit.js';
import type { IParametersList } from '../../../src/core/interfaces/IParametersList.js';
import type { ITimeSignatureMap } from '../../../src/knowledge/timesignature/ITimeSignatureMap.js';

/** Builds a time map from `[numerator, denominator, repetitions]` triplets. */
function buildTimeMap(...measures: Array<[number, number, number]>): ITimeSignatureMap {
  const map = new TimeSignatureMap();
  for (const [num, den, reps] of measures) {
    const entry = new TimeSignatureEntry();
    entry.signature = TimeSignatureFactory.$get(num, den);
    entry.repetitions = reps;
    map.push(entry);
  }
  return map;
}

const dummyParameters = {} as IParametersList;

/**
 * `percentTime` here is the real `IAnalysisContext.percentTime` -- a `[0, 1)` ratio of the
 * `timeMap`'s total duration, per the file header's bug fix. `duration` is the target unit's own
 * `IFraction` duration (constructed directly, never through a lossy decimal conversion, so
 * sub-beat positions land exactly where intended -- unlike `percentTime` itself, which is a
 * plain JS `Number` and can't exactly represent non-binary fractions like thirds or ninths;
 * every fixture below only ever uses `percentTime` values that ARE exactly representable in
 * IEEE754 double precision (0, 0.125, 0.5, 1.5), pairing the target unit's `duration` alone to
 * reach any ternary/sub-beat position that needs exactness).
 */
function scoreOf(timeMap: ITimeSignatureMap, percentTime: number, duration: Fraction): number {
  const unit: IMusicUnit = new MusicUnit();
  unit.duration = duration;
  const context: IAnalysisContext = { percentTime, previousContent: [], proposedContent: [] };
  const request = { timeMap, instruments: [], userSettings: {} } as unknown as IMusicRequest;
  new MetricPlacement().analyze(unit, context, dummyParameters, request);
  return unit.analysisScores.getValueFor(ParameterNames.METRIC_PLACEMENT);
}

describe('MetricPlacement', () => {
  describe('single 4/4 measure (total duration = 1 whole)', () => {
    const oneMeasure = buildTimeMap([4, 4, 1]);

    it('downbeat -> beat 2 (both full-beat aligned; only the downbeat is PRIMARY)', () => {
      // start=0 (rank1, primary, "1a"=100); stop=1/4 (rank1, secondary, "1b"=90).
      // geometric mean(100, 90) ~= 94.868 -> rounds to 95.
      expect(scoreOf(oneMeasure, 0, new Fraction(1, 4))).toBe(95);
    });

    it('beat 3 -> a first-division offbeat within beat 3', () => {
      // start=0.5 (rank1, secondary, "1b"=90); stop=0.625 (rank2, secondary, "2b"=63).
      // geometric mean(90, 63) ~= 75.3 -> rounds to 75.
      expect(scoreOf(oneMeasure, 0.5, new Fraction(1, 8))).toBe(75);
    });

    it('a first-division offbeat -> a second-division offbeat', () => {
      // start=1/8 (rank2, secondary, "2b"=63); stop=3/16 (rank3, secondary, "3b"=44).
      // geometric mean(63, 44) ~= 52.65 -> rounds to 53.
      expect(scoreOf(oneMeasure, 0.125, new Fraction(1, 16))).toBe(53);
    });

    it('downbeat -> a position with no clear alignment at all', () => {
      // start=0 (rank1, primary, "1a"=100); stop=1/32 (rank4, secondary, "4b"=30).
      // geometric mean(100, 30) ~= 54.77 -> rounds to 55.
      expect(scoreOf(oneMeasure, 0, new Fraction(1, 32))).toBe(55);
    });
  });

  describe('two 4/4 measures (total duration = 2 wholes): cross-measure and beyond-map behavior', () => {
    const twoMeasures = buildTimeMap([4, 4, 1], [4, 4, 1]);

    it('a position exactly at a measure boundary is attributed to the PRECEDING measure', () => {
      // stop lands at position 2, exactly the end of the second (and last) measure. The
      // boundary check (`lessThan(next) || equals(next)`) is inclusive, so it resolves to
      // that measure rather than falling through to "beyond the map".
      // start=0 ("1a"=100); stop=2, positionInMeasure=1 ("1b"=90). geometric mean ~= 94.868 -> 95.
      expect(scoreOf(twoMeasures, 0, new Fraction(2, 1))).toBe(95);
    });

    it('a duration that pushes the stop position past the end of the time map falls back to a neutral score', () => {
      // start=0 ("1a"=100); stop=3, beyond the total duration of 2 -> NEUTRAL_SCORE (50).
      // geometric mean(100, 50) ~= 70.71 -> rounds to 71.
      expect(scoreOf(twoMeasures, 0, new Fraction(3, 1))).toBe(71);
    });
  });

  describe('single 3/4 (ternary) measure', () => {
    const oneMeasure3_4 = buildTimeMap([3, 4, 1]);

    it('uses thirds/ninths (not halves/quarters) for its division ranks', () => {
      // start=0 ("1a"=100); stop=1/12, exactly the ternary first-division point
      // (beatDuration/3 = (3/4 / 3) / 3 = 1/12) -> rank2, secondary, "2b"=63.
      // geometric mean(100, 63) ~= 79.37 -> rounds to 79.
      expect(scoreOf(oneMeasure3_4, 0, new Fraction(1, 12))).toBe(79);
    });
  });

  describe('edge cases', () => {
    it('reports a neutral score when the position is entirely beyond the time map', () => {
      // A synthetic percentTime of 1.5 on a total=1 map isn't reachable through real
      // generation (percentTime is always < 1 there), but exercises getCurrentMeasure's
      // "beyond the time map" branch directly for the START position too, not just the stop
      // position (the only one reachable in practice, per the other describe block above).
      expect(scoreOf(buildTimeMap([4, 4, 1]), 1.5, new Fraction(1, 4))).toBe(50);
    });

    it('reports a neutral score for a measure whose signature was never set', () => {
      // ITimeSignatureEntry.signature is honestly typed as possibly `undefined` in this port
      // (see file header) -- exercise that guard directly.
      const map = new TimeSignatureMap();
      const bareEntry = new TimeSignatureEntry();
      bareEntry.repetitions = 1; // signature deliberately left unset
      map.push(bareEntry);
      expect(scoreOf(map, 0, new Fraction(1, 4))).toBe(50);
    });
  });

  describe('percentTime/timeSlot bug fix regression guard', () => {
    it('does NOT divide percentTime by 100 (the fixed bug): distinct percentTime values genuinely resolve to distinct positions', () => {
      // With the original (buggy) `/ 100`, EVERY realistic percentTime (always < 1) would have
      // been divided down to a minuscule fraction of a percent, collapsing every call
      // indistinguishably close to "the very start of the piece" regardless of true position.
      // With the fix, percentTime is used directly, so genuinely different percentTimes must
      // resolve to genuinely different (and correctly rank/hierarchy-scored) positions.
      const twoMeasures = buildTimeMap([4, 4, 1], [4, 4, 1]);

      // percentTime=0: start=0 -> rank1, PRIMARY ("1a"=100); stop=1/4 -> rank1, secondary
      // ("1b"=90). geometric mean(100, 90) ~= 94.868 -> 95.
      expect(scoreOf(twoMeasures, 0, new Fraction(1, 4))).toBe(95);

      // percentTime=0.5: start=1 (total 2 * 0.5) -- exactly the measure boundary, which (per
      // the "attributed to the preceding measure" quirk exercised above) resolves to
      // positionInMeasure=1 in measure 1, rank1/secondary ("1b"=90), NOT measure 2's downbeat
      // ("1a"=100) as a naive reading of "position 1 = start of measure 2" might suggest.
      // stop=1.25 similarly resolves to rank1/secondary ("1b"=90) in measure 2.
      // geometric mean(90, 90) = 90 -- a real, correctly-computed, DIFFERENT score from the
      // percentTime=0 case above, proving percentTime=0.5 is genuinely read as "halfway"
      // rather than collapsed toward 0 the way the /100 bug would have caused.
      expect(scoreOf(twoMeasures, 0.5, new Fraction(1, 4))).toBe(90);

      // A percentTime the old buggy code would have divided down to an indistinguishable
      // sliver near 0 (0.0025 / 100 = 0.000025) instead resolves, correctly, to a real
      // position (0.005 of the total duration) with its own independently-computed score.
      const atTinyFraction = scoreOf(twoMeasures, 0.0025, new Fraction(1, 4));
      expect(Number.isNaN(atTinyFraction)).toBe(false);
      expect(atTinyFraction).toBeGreaterThanOrEqual(1);
      expect(atTinyFraction).toBeLessThanOrEqual(100);
    });
  });
});
