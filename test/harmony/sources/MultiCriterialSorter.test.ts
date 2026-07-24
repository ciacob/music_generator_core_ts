import { describe, expect, it } from 'vitest';
import { CoreOperationKeys } from '../../../src/core/constants/CoreOperationKeys.js';
import { MultiCriterialSorter } from '../../../src/harmony/sources/MultiCriterialSorter.js';
import { MusicUnit } from '../../../src/core/MusicUnit.js';
import { Parameter } from '../../../src/core/Parameter.js';
import { ParametersList } from '../../../src/core/ParametersList.js';
import { SettingsList } from '../../../src/core/SettingsList.js';
import type { IAnalysisContext } from '../../../src/core/interfaces/IAnalysisContext.js';
import type { IMusicRequest } from '../../../src/core/interfaces/IMusicRequest.js';
import type { IMusicUnit } from '../../../src/core/interfaces/IMusicUnit.js';
import type { IParametersList } from '../../../src/core/interfaces/IParametersList.js';

/** Builds a single numeric, non-tweenable parameter (a flat "ideal value") plus its owning list/settings. */
function buildIdealValueFixture(
  criteriaName: string,
  idealValue: number,
): { parametersList: IParametersList; request: IMusicRequest } {
  const parametersList = new ParametersList();
  const settings = new SettingsList();

  const param = new Parameter();
  param.type = CoreOperationKeys.TYPE_INT;
  param.isTweenable = false;
  param.name = criteriaName;
  parametersList.push(param);
  settings.setValueAt(param, 1, idealValue);

  const request = { instruments: [], userSettings: settings } as IMusicRequest;
  return { parametersList, request };
}

function unitWithScore(criteriaName: string, value: number): IMusicUnit {
  const unit = new MusicUnit();
  unit.analysisScores.add(criteriaName, value);
  return unit;
}

const context = (previousContent: IMusicUnit[]): IAnalysisContext => ({
  previousContent,
  proposedContent: [],
  percentTime: 0.5,
});

describe('MultiCriterialSorter', () => {
  it('ranks the unit closer to the ideal/expected value first', () => {
    const { parametersList, request } = buildIdealValueFixture('criteriaA', 50);
    const closeToIdeal = unitWithScore('criteriaA', 52);
    const farFromIdeal = unitWithScore('criteriaA', 10);

    const sorter = new MultiCriterialSorter();
    const [best] = sorter.output(new MusicUnit(), context([farFromIdeal, closeToIdeal]), parametersList, request);

    expect(best).toBe(closeToIdeal);
  });

  it('sorts more than two units by increasing distance from ideal', () => {
    const { parametersList, request } = buildIdealValueFixture('criteriaA', 50);
    const unitA = unitWithScore('criteriaA', 51); // distance 1
    const unitB = unitWithScore('criteriaA', 80); // distance 30
    const unitC = unitWithScore('criteriaA', 45); // distance 5

    const sorter = new MultiCriterialSorter();
    const sorted = sorter.output(new MusicUnit(), context([unitB, unitA, unitC]), parametersList, request);

    expect(sorted).toEqual([unitA, unitC, unitB]);
  });

  it('treats a unit with no recorded scores as a tie with everything (comparison is driven by the first unit\'s own criteria)', () => {
    const { parametersList, request } = buildIdealValueFixture('criteriaA', 50);
    const empty = new MusicUnit(); // analysisScores lazily created, but never `.add()`-ed to
    const scored = unitWithScore('criteriaA', 999); // very far from ideal

    const sorter = new MultiCriterialSorter();
    const sorted = sorter.output(new MusicUnit(), context([empty, scored]), parametersList, request);

    // `empty` has no criteria to iterate, so its forEach never runs and the comparison
    // short-circuits to "tied" (0) -- a stable sort therefore preserves input order.
    expect(sorted).toEqual([empty, scored]);
  });

  it('aborts the comparison (ranks as a tie) when a scored criteria has no matching parameter', () => {
    const parametersList = new ParametersList(); // deliberately empty: no parameter named "unknownCriteria"
    const settings = new SettingsList();
    const request = { instruments: [], userSettings: settings } as IMusicRequest;

    const unitA = unitWithScore('unknownCriteria', 1);
    const unitB = unitWithScore('unknownCriteria', 2);

    const sorter = new MultiCriterialSorter();
    const sorted = sorter.output(new MusicUnit(), context([unitA, unitB]), parametersList, request);

    expect(sorted).toEqual([unitA, unitB]);
  });

  it('aborts the comparison (ranks as a tie) when the matching parameter is not numeric', () => {
    const parametersList = new ParametersList();
    const settings = new SettingsList();
    const param = new Parameter();
    param.type = CoreOperationKeys.TYPE_STRING; // neither TYPE_INT nor TYPE_ARRAY
    param.isTweenable = false;
    param.name = 'criteriaA';
    parametersList.push(param);
    const request = { instruments: [], userSettings: settings } as IMusicRequest;

    const unitA = unitWithScore('criteriaA', 1);
    const unitB = unitWithScore('criteriaA', 2);

    const sorter = new MultiCriterialSorter();
    const sorted = sorter.output(new MusicUnit(), context([unitA, unitB]), parametersList, request);

    expect(sorted).toEqual([unitA, unitB]);
  });

  it('returns (and sorts) the same array instance passed as previousContent', () => {
    const { parametersList, request } = buildIdealValueFixture('criteriaA', 50);
    const unitA = unitWithScore('criteriaA', 51);
    const unitB = unitWithScore('criteriaA', 80);
    const previousContent = [unitB, unitA];

    const sorter = new MultiCriterialSorter();
    const result = sorter.output(new MusicUnit(), context(previousContent), parametersList, request);

    expect(result).toBe(previousContent);
  });
});
