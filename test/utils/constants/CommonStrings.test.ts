import { describe, expect, it } from 'vitest';
import { CommonStrings } from '../../../src/utils/constants/CommonStrings.js';

describe('CommonStrings', () => {
  it('matches the values used elsewhere in the engine', () => {
    expect(CommonStrings.EMPTY).toBe('');
    expect(CommonStrings.EQUAL).toBe('=');
    expect(CommonStrings.NEW_LINE).toBe('\n');
    expect(CommonStrings.SLASH).toBe('/');
    expect(CommonStrings.UNDERSCORE).toBe('_');
  });

  it('is usable with ConstantUtils, like any other constants object', async () => {
    const { getAllNames } = await import('../../../src/utils/ConstantUtils.js');
    const names = getAllNames(CommonStrings);
    expect(names).toContain('EMPTY');
    expect(names).toContain('SLASH');
    expect(names).toEqual([...names].sort());
  });

  it('defines all 48 members from the original AS3 constants class', () => {
    expect(Object.keys(CommonStrings)).toHaveLength(48);
  });
});
