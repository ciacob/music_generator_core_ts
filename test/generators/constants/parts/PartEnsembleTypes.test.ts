import { describe, expect, it } from 'vitest';
import {
  PartEnsembleTypes,
  getAllEnsembles,
} from '../../../../src/generators/constants/parts/PartEnsembleTypes.js';
import { OTHER_INSTRUMENTS } from '../../../../src/generators/constants/parts/PartFamilies.js';
import { PartNames } from '../../../../src/generators/constants/parts/PartNames.js';

describe('PartEnsembleTypes', () => {
  it('includes the generic OTHER_INSTRUMENTS sentinel in the ORCHESTRA$ ensemble', () => {
    expect(PartEnsembleTypes['ORCHESTRA$']).toContain(OTHER_INSTRUMENTS);
  });

  it('defines the string quartet as 2 violins, viola, cello', () => {
    expect(PartEnsembleTypes['$STRING_QUARTET']).toEqual([
      PartNames.VIOLIN,
      PartNames.VIOLIN,
      PartNames.VIOLA,
      PartNames.CELLO,
    ]);
  });

  it('has 21 ensembles total', () => {
    expect(Object.keys(PartEnsembleTypes)).toHaveLength(21);
  });
});

describe('getAllEnsembles', () => {
  it('returns all 21 ensemble names', () => {
    expect(getAllEnsembles()).toHaveLength(21);
  });

  it('returns the same cached array across repeated calls', () => {
    expect(getAllEnsembles()).toBe(getAllEnsembles());
  });
});
