import { describe, expect, it } from 'vitest';
import { AbstractMusicalPostProcessor } from '../../../src/core/abstracts/AbstractMusicalPostProcessor.js';
import type { IMusicRequest } from '../../../src/core/interfaces/IMusicRequest.js';
import type { IMusicalBody } from '../../../src/core/interfaces/IMusicalBody.js';

class MinimalPostProcessor extends AbstractMusicalPostProcessor {
  public executedWith: [IMusicalBody, IMusicRequest] | null = null;
  execute(rawMusicalBody: IMusicalBody, request: IMusicRequest): void {
    this.executedWith = [rawMusicalBody, request];
  }
}

describe('AbstractMusicalPostProcessor', () => {
  it('a concrete subclass can be instantiated and its execute() runs', () => {
    const processor = new MinimalPostProcessor();
    const body = {} as IMusicalBody;
    const request = {} as IMusicRequest;
    processor.execute(body, request);
    expect(processor.executedWith).toEqual([body, request]);
  });

  it('uid lazily generates and caches a UID', () => {
    const processor = new MinimalPostProcessor();
    const uid = processor.uid;
    expect(uid).toMatch(/^[0-9a-f-]{36}$/);
    expect(processor.uid).toBe(uid);
  });

  it('gives distinct instances distinct UIDs', () => {
    expect(new MinimalPostProcessor().uid).not.toBe(new MinimalPostProcessor().uid);
  });
});
