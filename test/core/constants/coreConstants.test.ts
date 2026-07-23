import { describe, expect, it } from 'vitest';
import { CoreParameterNames } from '../../../src/core/constants/CoreParameterNames.js';
import { CoreOperationKeys } from '../../../src/core/constants/CoreOperationKeys.js';
import { DurationFractions } from '../../../src/generators/constants/duration/DurationFractions.js';

describe('CoreParameterNames', () => {
  it('defines ANALYSIS_WINDOW, HETEROGENEITY, HAZARD, ERROR_MARGIN', () => {
    expect(CoreParameterNames).toEqual({
      ANALYSIS_WINDOW: 'Analysis Window',
      HETEROGENEITY: 'Heterogeneity',
      HAZARD: 'Hazard',
      ERROR_MARGIN: 'Error Margin',
    });
  });
});

describe('CoreOperationKeys', () => {
  it('defines the 5 parameter type constants', () => {
    expect(CoreOperationKeys.TYPE_INT).toBe(100);
    expect(CoreOperationKeys.TYPE_BOOLEAN).toBe(103);
    expect(CoreOperationKeys.TYPE_STRING).toBe(104);
    expect(CoreOperationKeys.TYPE_OBJECT).toBe(105);
    expect(CoreOperationKeys.TYPE_ARRAY).toBe(106);
  });

  it('references the actual DurationFractions instances in DURATIONS_IN_USE', () => {
    expect(CoreOperationKeys.DURATIONS_IN_USE).toEqual([
      DurationFractions.WHOLE,
      DurationFractions.HALF,
      DurationFractions.QUARTER,
      DurationFractions.EIGHT,
      DurationFractions.SIXTEENTH,
    ]);
  });

  it('defines the 5 chart-values tables with the expected sizes', () => {
    expect(CoreOperationKeys.WHOLE_CHART_VALUES).toHaveLength(4);
    expect(CoreOperationKeys.QUARTER_CHART_VALUES).toHaveLength(5);
  });
});
