import { describe, expect, it } from 'vitest';
import {
  GMPartMidiPatches,
  getAllPatches,
  getGMPatchInfo,
} from '../../../../src/generators/constants/parts/GMPartMidiPatches.js';

describe('GMPartMidiPatches', () => {
  it('has 28 members, spot-checked against real GM patch numbers', () => {
    expect(Object.keys(GMPartMidiPatches)).toHaveLength(28);
    expect(GMPartMidiPatches.PIANO).toBe(1);
    expect(GMPartMidiPatches.VIOLIN).toBe(41);
  });
});

describe('getAllPatches', () => {
  it('returns all 28 patches sorted ascending by patch number', () => {
    const patches = getAllPatches();
    expect(patches).toHaveLength(28);
    for (let i = 1; i < patches.length; i++) {
      expect(patches[i]!.gmPatch).toBeGreaterThanOrEqual(patches[i - 1]!.gmPatch);
    }
  });

  it('pairs PIANO with its GM name', () => {
    const patches = getAllPatches();
    const piano = patches.find((p) => p.gmPatch === 1);
    expect(piano?.gmName).toBe('Acoustic Grand Piano');
  });

  it('returns the same cached array across repeated calls', () => {
    expect(getAllPatches()).toBe(getAllPatches());
  });
});

describe('getGMPatchInfo', () => {
  it('returns name and patch for a known instrument', () => {
    expect(getGMPatchInfo('VIOLIN')).toEqual({ gmName: 'Violin', gmPatch: 41 });
  });

  it('returns null for an unknown instrument', () => {
    expect(getGMPatchInfo('KAZOO')).toBeNull();
  });
});
