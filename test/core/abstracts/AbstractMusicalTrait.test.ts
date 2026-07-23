import { describe, expect, it } from 'vitest';
import { AbstractMusicalTrait } from '../../../src/core/abstracts/AbstractMusicalTrait.js';
import type { IAnalysisContext } from '../../../src/core/interfaces/IAnalysisContext.js';
import type { IMusicRequest } from '../../../src/core/interfaces/IMusicRequest.js';
import type { IMusicUnit } from '../../../src/core/interfaces/IMusicUnit.js';
import type { IMusicalPostProcessor } from '../../../src/core/interfaces/IMusicalPostProcessor.js';
import type { IParametersList } from '../../../src/core/interfaces/IParametersList.js';

class MinimalTrait extends AbstractMusicalTrait {
  public executed = false;
  get musicalPostProcessors(): IMusicalPostProcessor[] {
    return [];
  }
  execute(
    _targetMusicUnit: IMusicUnit,
    _analysisContext: IAnalysisContext,
    _parameters: IParametersList,
    _request: IMusicRequest,
  ): void {
    this.executed = true;
  }
}

describe('AbstractMusicalTrait', () => {
  it('a concrete subclass can be instantiated and its execute() runs', () => {
    const trait = new MinimalTrait();
    trait.execute({} as IMusicUnit, {} as IAnalysisContext, {} as IParametersList, {} as IMusicRequest);
    expect(trait.executed).toBe(true);
  });

  it('musicalPostProcessors reflects the subclass implementation', () => {
    expect(new MinimalTrait().musicalPostProcessors).toEqual([]);
  });
});
