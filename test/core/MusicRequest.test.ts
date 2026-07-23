import { describe, expect, it } from 'vitest';
import { MusicRequest } from '../../src/core/MusicRequest.js';
import { TimeSignatureMap } from '../../src/knowledge/timesignature/TimeSignatureMap.js';
import { SettingsList } from '../../src/core/SettingsList.js';

describe('MusicRequest', () => {
  it('defaults instruments to an empty array', () => {
    expect(new MusicRequest().instruments).toEqual([]);
  });

  it('gets/sets instruments', () => {
    const request = new MusicRequest();
    const instruments = [{}] as never;
    request.instruments = instruments;
    expect(request.instruments).toBe(instruments);
  });

  it('gets/sets timeMap', () => {
    const request = new MusicRequest();
    const timeMap = new TimeSignatureMap();
    request.timeMap = timeMap;
    expect(request.timeMap).toBe(timeMap);
  });

  it('gets/sets userSettings', () => {
    const request = new MusicRequest();
    const settings = new SettingsList();
    request.userSettings = settings;
    expect(request.userSettings).toBe(settings);
  });
});
