import { describe, expect, it } from 'vitest';
import { AbstractContentAnalyzer } from '../../../src/core/abstracts/AbstractContentAnalyzer.js';

class MinimalAnalyzer extends AbstractContentAnalyzer {
  analyze(): void {
    // no-op for this test
  }
  get name(): string {
    return 'MinimalAnalyzer';
  }
}

describe('AbstractContentAnalyzer', () => {
  // Note: `abstract` is enforced by TypeScript at *compile* time only (a
  // direct `new AbstractContentAnalyzer()` fails `tsc`, which this whole
  // project compiles under `strict` mode as part of its build) -- there
  // is nothing meaningful to assert about it in a runtime test.

  it('a concrete subclass can be instantiated', () => {
    expect(() => new MinimalAnalyzer()).not.toThrow();
  });

  it('weight defaults to DEFAULT_WEIGHT (1)', () => {
    expect(new MinimalAnalyzer().weight).toBe(AbstractContentAnalyzer.DEFAULT_WEIGHT);
    expect(AbstractContentAnalyzer.DEFAULT_WEIGHT).toBe(1);
  });

  it('threshold gets/sets', () => {
    const analyzer = new MinimalAnalyzer();
    analyzer.threshold = 75;
    expect(analyzer.threshold).toBe(75);
  });

  it('uid lazily generates and caches a UID', () => {
    const analyzer = new MinimalAnalyzer();
    const uid = analyzer.uid;
    expect(uid).toMatch(/^[0-9a-f-]{36}$/);
    expect(analyzer.uid).toBe(uid);
  });

  it('toString includes the analyzer name', () => {
    expect(new MinimalAnalyzer().toString()).toBe('[ANALYZER: MinimalAnalyzer]');
  });
});
