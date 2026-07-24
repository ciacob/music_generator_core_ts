import { describe, expect, it } from 'vitest';
import { Fraction } from '../../../src/math/Fraction.js';
import { AbstractGeneratorModule } from '../../../src/core/abstracts/AbstractGeneratorModule.js';
import { SettingsList } from '../../../src/core/SettingsList.js';
import type { GenerationStatus } from '../../../src/core/interfaces/IGeneratorModule.js';
import type { IMusicRequest } from '../../../src/core/interfaces/IMusicRequest.js';
import type { IMusicUnit } from '../../../src/core/interfaces/IMusicUnit.js';
import type { IMusicalTrait } from '../../../src/core/interfaces/IMusicalTrait.js';
import type { ITimeSignatureMap } from '../../../src/knowledge/timesignature/ITimeSignatureMap.js';

/** A trait that gives every music unit a fixed duration. */
function makeFixedDurationTrait(numerator: number, denominator: number): IMusicalTrait {
  return {
    musicalPostProcessors: [],
    execute(unit: IMusicUnit) {
      unit.duration = new Fraction(numerator, denominator);
    },
  };
}

/** A trait that never sets a duration -- used to trigger the NO_DURATION_MUSIC_UNIT error path. */
const noDurationTrait: IMusicalTrait = {
  musicalPostProcessors: [],
  execute() {
    /* deliberately does not set unit.duration */
  },
};

function makeRequest(dueNumerator: number, dueDenominator: number): IMusicRequest {
  return {
    timeMap: { duration: new Fraction(dueNumerator, dueDenominator) } as ITimeSignatureMap,
    instruments: [],
    userSettings: new SettingsList(),
  };
}

class QuarterNoteGenerator extends AbstractGeneratorModule {
  get moduleUid(): string {
    return 'quarter-note-generator';
  }
  get musicalTraits(): IMusicalTrait[] {
    return [makeFixedDurationTrait(1, 4)];
  }
}

class NoTraitsGenerator extends AbstractGeneratorModule {
  get moduleUid(): string {
    return 'no-traits-generator';
  }
  get musicalTraits(): IMusicalTrait[] {
    return [];
  }
}

class NoDurationGenerator extends AbstractGeneratorModule {
  get moduleUid(): string {
    return 'no-duration-generator';
  }
  get musicalTraits(): IMusicalTrait[] {
    return [noDurationTrait];
  }
}

function collectStatuses(generator: AbstractGeneratorModule): GenerationStatus[] {
  const statuses: GenerationStatus[] = [];
  generator.callback = (status) => {
    statuses.push({ ...status });
  };
  return statuses;
}

describe('AbstractGeneratorModule.instanceUid', () => {
  it('lazily generates and caches an instance UID', () => {
    const generator = new QuarterNoteGenerator();
    const uid = generator.instanceUid;
    expect(uid).toMatch(/^[0-9a-f-]{36}$/);
    expect(generator.instanceUid).toBe(uid);
  });

  it('gives distinct instances distinct instance UIDs', () => {
    expect(new QuarterNoteGenerator().instanceUid).not.toBe(new QuarterNoteGenerator().instanceUid);
  });
});

describe('AbstractGeneratorModule.lastResult defaults', () => {
  it('is an empty IMusicalBody before any generation has run', () => {
    const generator = new QuarterNoteGenerator();
    expect(generator.lastResult.length).toBe(0);
  });
});

describe('AbstractGeneratorModule.parametersList (bug fix verification)', () => {
  it('exposes exactly the 4 default parameters', () => {
    const generator = new QuarterNoteGenerator();
    expect(generator.parametersList.length).toBe(4);
  });

  it('does not duplicate the default parameters across repeated reads (the fixed bug)', () => {
    const generator = new QuarterNoteGenerator();
    generator.parametersList;
    generator.parametersList;
    generator.parametersList;
    expect(generator.parametersList.length).toBe(4);
  });

  it('the same underlying list instance is returned every time', () => {
    const generator = new QuarterNoteGenerator();
    expect(generator.parametersList).toBe(generator.parametersList);
  });
});

describe('AbstractGeneratorModule.generate -- successful completion', () => {
  it('produces enough quarter-note units to fill a 1/1 request and reports completion', async () => {
    const generator = new QuarterNoteGenerator();
    const statuses = collectStatuses(generator);

    await generator.generate(makeRequest(1, 1));

    expect(generator.lastResult.length).toBe(4);
    const last = statuses[statuses.length - 1];
    expect(last).toEqual({ state: 'completed', percentComplete: 1, error: null });
  });

  it('reports "in progress" status updates while generating', async () => {
    const generator = new QuarterNoteGenerator();
    const statuses = collectStatuses(generator);
    await generator.generate(makeRequest(1, 1));
    expect(statuses.filter((s) => s.state === 'in progress').length).toBeGreaterThan(0);
  });

  it('starts each new generate() call fresh, discarding the previous lastResult', async () => {
    const generator = new QuarterNoteGenerator();
    collectStatuses(generator);
    await generator.generate(makeRequest(1, 1));
    expect(generator.lastResult.length).toBe(4);

    await generator.generate(makeRequest(1, 2));
    expect(generator.lastResult.length).toBe(2);
  });
});

describe('AbstractGeneratorModule.generate -- error paths', () => {
  it('reports an error when no musical traits are defined', async () => {
    const generator = new NoTraitsGenerator();
    const statuses = collectStatuses(generator);
    await generator.generate(makeRequest(1, 1));

    const last = statuses[statuses.length - 1];
    expect(last?.state).toBe('error');
    expect(last?.error).toContain('No IMusicalTrait instances are defined');
  });

  it('reports an error when a produced music unit has no duration', async () => {
    const generator = new NoDurationGenerator();
    const statuses = collectStatuses(generator);
    await generator.generate(makeRequest(1, 1));

    const last = statuses[statuses.length - 1];
    expect(last?.state).toBe('error');
    expect(last?.error).toContain('no musical duration');
  });

  it('does not populate lastResult when generation ends in error', async () => {
    const generator = new NoTraitsGenerator();
    collectStatuses(generator);
    await generator.generate(makeRequest(1, 1));
    expect(generator.lastResult.length).toBe(0);
  });
});

describe('AbstractGeneratorModule.abort', () => {
  it('stops generation and reports "aborted" once abort() is called mid-generation', async () => {
    const generator = new QuarterNoteGenerator();
    const statuses: GenerationStatus[] = [];
    generator.callback = (status) => {
      statuses.push({ ...status });
      if (status.state === 'in progress') {
        generator.abort();
      }
    };

    // A large target duration ensures generation would otherwise run many iterations.
    await generator.generate(makeRequest(100, 1));

    const last = statuses[statuses.length - 1];
    expect(last).toEqual({ state: 'aborted', percentComplete: 0, error: null });
    expect(generator.lastResult.length).toBe(0);
  });

  it('abort() before generate() has no effect on a subsequent, unrelated generate() call', async () => {
    // abort() only affects the CURRENT/next generate() run; generate() itself resets the flag.
    const generator = new QuarterNoteGenerator();
    const statuses = collectStatuses(generator);
    generator.abort();
    await generator.generate(makeRequest(1, 1));
    const last = statuses[statuses.length - 1];
    expect(last?.state).toBe('completed');
  });
});

describe('AbstractGeneratorModule.info', () => {
  it('returns an object including moduleUid and chartSource', async () => {
    const generator = new QuarterNoteGenerator();
    collectStatuses(generator);
    await generator.generate(makeRequest(1, 1));
    const info = generator.info;
    expect(info.moduleUid).toBe('quarter-note-generator');
    expect(info.chartSource).toBeDefined();
  });
});
