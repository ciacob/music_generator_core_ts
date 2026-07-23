import { describe, expect, it } from 'vitest';
import { AbstractRawMusicSource } from '../../../src/core/abstracts/AbstractRawMusicSource.js';
import type { IAnalysisContext } from '../../../src/core/interfaces/IAnalysisContext.js';
import type { IMusicRequest } from '../../../src/core/interfaces/IMusicRequest.js';
import type { IMusicUnit } from '../../../src/core/interfaces/IMusicUnit.js';
import type { IParametersList } from '../../../src/core/interfaces/IParametersList.js';

class MinimalSource extends AbstractRawMusicSource {
  public resetCallCount = 0;
  output(): IMusicUnit[] {
    return [];
  }
  override reset(): void {
    this.resetCallCount++;
  }
}

class DefaultResetSource extends AbstractRawMusicSource {
  output(): IMusicUnit[] {
    return [];
  }
}

describe('AbstractRawMusicSource', () => {
  it('a concrete subclass can be instantiated and output() runs', () => {
    const source = new MinimalSource();
    expect(
      source.output({} as IMusicUnit, {} as IAnalysisContext, {} as IParametersList, {} as IMusicRequest),
    ).toEqual([]);
  });

  it('uid lazily generates and caches a UID', () => {
    const source = new MinimalSource();
    const uid = source.uid;
    expect(uid).toMatch(/^[0-9a-f-]{36}$/);
    expect(source.uid).toBe(uid);
  });

  it('reset() defaults to a no-op unless overridden', () => {
    expect(() => new DefaultResetSource().reset()).not.toThrow();
  });

  it('a subclass can override reset()', () => {
    const source = new MinimalSource();
    source.reset();
    expect(source.resetCallCount).toBe(1);
  });
});
