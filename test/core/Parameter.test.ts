import { describe, expect, it } from 'vitest';
import { Parameter } from '../../src/core/Parameter.js';

describe('Parameter defaults', () => {
  it('defaults to sensible zero/false/empty values', () => {
    const parameter = new Parameter();
    expect(parameter.type).toBe(0);
    expect(parameter.name).toBe('');
    expect(parameter.isTweenable).toBe(false);
    expect(parameter.isOptional).toBe(false);
    expect(parameter.isContextual).toBe(false);
    expect(parameter.description).toBe('');
    expect(parameter.documentationUrl).toBe('');
    expect(parameter.color).toBe(0);
  });
});

describe('Parameter.uid', () => {
  it('lazily generates a UID on first read', () => {
    const parameter = new Parameter();
    expect(parameter.uid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('returns the same UID across repeated reads', () => {
    const parameter = new Parameter();
    expect(parameter.uid).toBe(parameter.uid);
  });

  it('can be explicitly set', () => {
    const parameter = new Parameter();
    parameter.uid = 'custom-uid';
    expect(parameter.uid).toBe('custom-uid');
  });
});

describe('Parameter get/set round-trips', () => {
  it('round-trips every simple property', () => {
    const parameter = new Parameter();
    parameter.type = 100;
    parameter.name = 'Hazard';
    parameter.payload = 0.5;
    parameter.minValue = 0;
    parameter.maxValue = 1;
    parameter.isTweenable = true;
    parameter.isOptional = true;
    parameter.isContextual = true;
    parameter.description = 'A test parameter';
    parameter.documentationUrl = 'https://example.com';
    parameter.color = 0xff0000;
    parameter.icon = 'some-icon';

    expect(parameter.type).toBe(100);
    expect(parameter.name).toBe('Hazard');
    expect(parameter.payload).toBe(0.5);
    expect(parameter.minValue).toBe(0);
    expect(parameter.maxValue).toBe(1);
    expect(parameter.isTweenable).toBe(true);
    expect(parameter.isOptional).toBe(true);
    expect(parameter.isContextual).toBe(true);
    expect(parameter.description).toBe('A test parameter');
    expect(parameter.documentationUrl).toBe('https://example.com');
    expect(parameter.color).toBe(0xff0000);
    expect(parameter.icon).toBe('some-icon');
  });
});
