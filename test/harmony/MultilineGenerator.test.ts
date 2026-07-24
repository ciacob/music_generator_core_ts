import { describe, expect, it } from 'vitest';
import { CoreOperationKeys } from '../../src/core/constants/CoreOperationKeys.js';
import { CoreParameterNames } from '../../src/core/constants/CoreParameterNames.js';
import { Duration } from '../../src/harmony/traits/Duration.js';
import { Harmony } from '../../src/harmony/traits/Harmony.js';
import { MultilineGenerator } from '../../src/harmony/MultilineGenerator.js';
import { ParameterNames } from '../../src/harmony/constants/ParameterNames.js';
import type { IParameter } from '../../src/core/interfaces/IParameter.js';
import type { IParametersList } from '../../src/core/interfaces/IParametersList.js';

/** IParametersList has no `getAll()`; collect its contents via `length`/`getAt`. */
function toArray(list: IParametersList): IParameter[] {
  const result: IParameter[] = [];
  for (let i = 0; i < list.length; i++) {
    result.push(list.getAt(i));
  }
  return result;
}

const CORE_PARAM_NAMES = [
  CoreParameterNames.ANALYSIS_WINDOW,
  CoreParameterNames.HETEROGENEITY,
  CoreParameterNames.HAZARD,
  CoreParameterNames.ERROR_MARGIN,
];

const HARMONY_PARAM_NAMES = [
  ParameterNames.HIGHEST_PITCH,
  ParameterNames.LOWEST_PITCH,
  ParameterNames.DURATIONS,
  ParameterNames.METRIC_PLACEMENT,
  ParameterNames.VOICE_COHESION,
  ParameterNames.VOICES_NUMBER,
  ParameterNames.USE_MELODIC_MODEL,
  ParameterNames.MELODIC_DIRECTION_BALANCE,
  ParameterNames.INTRINSIC_CONSONANCE,
  ParameterNames.ENFORCE_CONSONANCE,
  ParameterNames.CHORD_PROGRESSION,
  ParameterNames.VOICE_RESTLESSNESS,
  ParameterNames.HARMONIC_DISTRIBUTION,
];

describe('MultilineGenerator', () => {
  it('reports the correct moduleUid', () => {
    expect(new MultilineGenerator().moduleUid).toBe('MULTILINE GENERATOR v.2');
  });

  describe('parametersList', () => {
    it('includes all 4 core parameters plus all 13 harmony-specific parameters, exactly once each', () => {
      const generator = new MultilineGenerator();
      const params = generator.parametersList;
      const names = toArray(params).map((p) => p.name);

      expect(names).toHaveLength(17);
      for (const expectedName of [...CORE_PARAM_NAMES, ...HARMONY_PARAM_NAMES]) {
        expect(names.filter((n) => n === expectedName)).toHaveLength(1);
      }
    });

    it('is cached: repeated access returns the exact same array reference, without duplicating entries', () => {
      const generator = new MultilineGenerator();
      const first = generator.parametersList;
      const second = generator.parametersList;

      expect(second).toBe(first);
      expect(toArray(second)).toHaveLength(17);
    });

    it('every parameter has a distinct, non-empty uid', () => {
      const generator = new MultilineGenerator();
      const uids = toArray(generator.parametersList).map((p) => p.uid);

      expect(uids.every((uid) => typeof uid === 'string' && uid.length > 0)).toBe(true);
      expect(new Set(uids).size).toBe(uids.length);
    });

    it('every parameter has a non-empty description', () => {
      const generator = new MultilineGenerator();
      for (const param of toArray(generator.parametersList)) {
        expect(param.description.length).toBeGreaterThan(0);
      }
    });

    describe('specific parameter shapes (spot checks against the AS3 original)', () => {
      const generator = new MultilineGenerator();
      const params = generator.parametersList;

      function byName(name: string) {
        const [param] = params.getByName(name);
        return param;
      }

      it('USE_MELODIC_MODEL: TYPE_INT, non-tweenable, 0/1 bounded, payload 1 (on by default)', () => {
        const p = byName(ParameterNames.USE_MELODIC_MODEL);
        expect(p?.type).toBe(CoreOperationKeys.TYPE_INT);
        expect(p?.isTweenable).toBe(false);
        expect(p?.minValue).toBe(0);
        expect(p?.maxValue).toBe(1);
        expect(p?.payload).toBe(1);
      });

      it('ENFORCE_CONSONANCE: TYPE_INT, non-tweenable, 0/1 bounded, payload 0 (off by default)', () => {
        const p = byName(ParameterNames.ENFORCE_CONSONANCE);
        expect(p?.type).toBe(CoreOperationKeys.TYPE_INT);
        expect(p?.isTweenable).toBe(false);
        expect(p?.minValue).toBe(0);
        expect(p?.maxValue).toBe(1);
        expect(p?.payload).toBe(0);
      });

      it('CHORD_PROGRESSION: the only harmony-specific parameter marked isContextual', () => {
        const contextualNames = toArray(params)
          .filter((p) => p.isContextual)
          .map((p) => p.name);
        expect(contextualNames).toEqual([ParameterNames.CHORD_PROGRESSION]);
      });

      it('all TYPE_ARRAY harmony parameters are tweenable', () => {
        for (const name of HARMONY_PARAM_NAMES) {
          const p = byName(name);
          if (p?.type === CoreOperationKeys.TYPE_ARRAY) {
            expect(p.isTweenable).toBe(true);
          }
        }
      });

      it('the 4 core parameters carry their own established defaults (from AbstractGeneratorModule)', () => {
        const analysisWindow = byName(CoreParameterNames.ANALYSIS_WINDOW);
        const heterogeneity = byName(CoreParameterNames.HETEROGENEITY);
        const hazard = byName(CoreParameterNames.HAZARD);
        const errorMargin = byName(CoreParameterNames.ERROR_MARGIN);
        expect(analysisWindow?.payload).toBe(7);
        expect(heterogeneity?.payload).toBe(40);
        expect(hazard?.payload).toBe(0);
        expect(errorMargin?.payload).toBe(45);
      });
    });
  });

  describe('musicalTraits', () => {
    it('returns exactly one Duration instance followed by one Harmony instance', () => {
      const generator = new MultilineGenerator();
      const traits = generator.musicalTraits;

      expect(traits).toHaveLength(2);
      expect(traits[0]).toBeInstanceOf(Duration);
      expect(traits[1]).toBeInstanceOf(Harmony);
    });

    it('is cached: repeated access returns the exact same array reference', () => {
      const generator = new MultilineGenerator();
      const first = generator.musicalTraits;
      const second = generator.musicalTraits;
      expect(second).toBe(first);
    });
  });

  describe('per-instance isolation', () => {
    it('two separate MultilineGenerator instances do not share cached parametersList/musicalTraits state', () => {
      const generatorA = new MultilineGenerator();
      const generatorB = new MultilineGenerator();

      expect(generatorA.parametersList).not.toBe(generatorB.parametersList);
      expect(generatorA.musicalTraits).not.toBe(generatorB.musicalTraits);
      // But both still carry the same logical content.
      expect(toArray(generatorA.parametersList).map((p) => p.name).sort()).toEqual(
        toArray(generatorB.parametersList).map((p) => p.name).sort(),
      );
    });
  });
});
