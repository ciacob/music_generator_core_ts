import { describe, expect, it } from 'vitest';
import { CoreOperationKeys } from '../../src/core/constants/CoreOperationKeys.js';
import { Parameter } from '../../src/core/Parameter.js';
import { SettingsList } from '../../src/core/SettingsList.js';

function makeArrayParameter(name = 'Hazard'): Parameter {
  const p = new Parameter();
  p.name = name;
  p.type = CoreOperationKeys.TYPE_ARRAY;
  p.isTweenable = true;
  return p;
}

function makeIntParameter(name = 'AnalysisWindow', minValue?: number, maxValue?: number): Parameter {
  const p = new Parameter();
  p.name = name;
  p.type = CoreOperationKeys.TYPE_INT;
  if (minValue !== undefined) p.minValue = minValue;
  if (maxValue !== undefined) p.maxValue = maxValue;
  return p;
}

describe('SettingsList basics', () => {
  it('getValueAt returns null for a parameter that was never set', () => {
    const settings = new SettingsList();
    expect(settings.getValueAt(makeArrayParameter(), 1)).toBeNull();
  });

  it('setValueAt / getValueAt round-trips a value for a TYPE_ARRAY parameter', () => {
    const settings = new SettingsList();
    const param = makeArrayParameter();
    settings.setValueAt(param, 1, 50);
    expect(settings.getValueAt(param, 1)).toBe(50);
  });

  it('setValueAt / getValueAt round-trips a value for a TYPE_INT parameter (timeSlot fixed at 1)', () => {
    const settings = new SettingsList();
    const param = makeIntParameter();
    settings.setValueAt(param, 1, 7);
    expect(settings.getValueAt(param, 1)).toBe(7);
  });
});

describe('SettingsList validation', () => {
  it('throws for a TYPE_ARRAY value outside [1, 100]', () => {
    const settings = new SettingsList();
    expect(() => settings.setValueAt(makeArrayParameter(), 1, 0)).toThrow();
    expect(() => settings.setValueAt(makeArrayParameter(), 1, 101)).toThrow();
  });

  it('throws for a non-integer TYPE_ARRAY value', () => {
    const settings = new SettingsList();
    expect(() => settings.setValueAt(makeArrayParameter(), 1, 5.5)).toThrow();
  });

  it('throws for timeSlot outside [1, 100]', () => {
    const settings = new SettingsList();
    expect(() => settings.setValueAt(makeArrayParameter(), 0, 50)).toThrow();
    expect(() => settings.setValueAt(makeArrayParameter(), 101, 50)).toThrow();
  });

  it('throws for a non-array parameter set at a timeSlot other than 1', () => {
    const settings = new SettingsList();
    expect(() => settings.setValueAt(makeIntParameter(), 50, 7)).toThrow();
  });

  it('enforces minValue/maxValue for TYPE_INT parameters', () => {
    const settings = new SettingsList();
    const param = makeIntParameter('Bounded', 5, 10);
    expect(() => settings.setValueAt(param, 1, 3)).toThrow();
    expect(() => settings.setValueAt(param, 1, 15)).toThrow();
    expect(() => settings.setValueAt(param, 1, 7)).not.toThrow();
  });
});

describe('SettingsList interpolation', () => {
  it('interpolates between two recorded values for a tweenable TYPE_ARRAY parameter', () => {
    const settings = new SettingsList();
    const param = makeArrayParameter();
    settings.setValueAt(param, 1, 1);
    settings.setValueAt(param, 100, 100);
    const midValue = settings.getValueAt(param, 50);
    expect(midValue).toBeGreaterThan(1);
    expect(midValue).toBeLessThan(100);
  });

  it('returns the exact recorded value without interpolation when isTweenable is false', () => {
    const settings = new SettingsList();
    const param = makeArrayParameter();
    param.isTweenable = false;
    settings.setValueAt(param, 1, 1);
    settings.setValueAt(param, 100, 100);
    expect(settings.getValueAt(param, 50)).toBe(1);
  });
});

describe('SettingsList.ERROR_CODE', () => {
  it('is exposed as a static constant matching the AS3 original', () => {
    expect(SettingsList.ERROR_CODE).toBe(404);
  });
});
