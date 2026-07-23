import { describe, expect, it } from 'vitest';
import { Common } from '../../../src/generators/constants/Common.js';
import { BracketTypes } from '../../../src/generators/constants/BracketTypes.js';
import { GeneratorBaseKeys } from '../../../src/generators/constants/GeneratorBaseKeys.js';
import { GeneratorKeys } from '../../../src/generators/constants/GeneratorKeys.js';
import { GeneratorSupportedTypes } from '../../../src/generators/constants/GeneratorSupportedTypes.js';
import { MusicTypes } from '../../../src/generators/constants/MusicTypes.js';
import { StemDirection } from '../../../src/generators/constants/StemDirection.js';

describe('Common', () => {
  it('defines NONE, LABEL, VALUE', () => {
    expect(Common.NONE).toBe('≈');
    expect(Common.LABEL).toBe('label');
    expect(Common.VALUE).toBe('value');
  });
});

describe('BracketTypes', () => {
  it('defines BRACE_FIRST_TWO, BRACKET_ALL, and NONE (sourced from Common.NONE)', () => {
    expect(BracketTypes.BRACE_FIRST_TWO).toBe('∙');
    expect(BracketTypes.BRACKET_ALL).toBe('');
    expect(BracketTypes.NONE).toBe(Common.NONE);
  });
});

describe('GeneratorBaseKeys', () => {
  it('has 25 members, with spot-checked values', () => {
    expect(Object.keys(GeneratorBaseKeys)).toHaveLength(25);
    expect(GeneratorBaseKeys.ADVANCED).toBe('Advanced');
    expect(GeneratorBaseKeys.API_ARGUMENTS).toBe('apiArguments');
    expect(GeneratorBaseKeys.DEPENDS_ON).toBe('DependsOn');
  });

  it('preserves the stray-space typo in NEED_API_AVAILABILITY (a lookup-key value, not fixed)', () => {
    expect(GeneratorBaseKeys.NEED_API_AVAILABILITY).toBe('needApiA vailability');
  });
});

describe('GeneratorKeys', () => {
  it('has 56 members, with spot-checked values', () => {
    expect(Object.keys(GeneratorKeys)).toHaveLength(56);
    expect(GeneratorKeys.ALL_GENERATION_DONE).toBe('allGenerationDone');
    expect(GeneratorKeys.UNRECOGNIZED_GENERATOR).toBe(
      'The current project contains an unknown generator "%s" that could not be initialized.',
    );
    expect(GeneratorKeys.GENERATION_ERROR).toBe('%s encountered an error.');
  });
});

describe('GeneratorSupportedTypes', () => {
  it('defines the 6 supported type names', () => {
    expect(GeneratorSupportedTypes).toEqual({
      BOOLEAN: 'Boolean',
      ARRAY: 'Array',
      NUMBER: 'Number',
      INT: 'int',
      STRING: 'String',
      OBJECT: 'Object',
    });
  });
});

describe('MusicTypes', () => {
  it('defines FRACTION and FRACTIONS_VECTOR', () => {
    expect(MusicTypes.FRACTION).toBe(100);
    expect(MusicTypes.FRACTIONS_VECTOR).toBe(101);
  });
});

describe('StemDirection', () => {
  it('defines DOWN, UP, AUTO', () => {
    expect(StemDirection).toEqual({ DOWN: 'stemDown', UP: 'stemUp', AUTO: 'stemAuto' });
  });
});
