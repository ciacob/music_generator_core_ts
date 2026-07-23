import { describe, expect, it } from 'vitest';
import { AnalysisContext } from '../../src/core/AnalysisContext.js';
import { MusicUnit } from '../../src/core/MusicUnit.js';

describe('AnalysisContext defaults', () => {
  it('defaults to empty previousContent/proposedContent and percentTime 0', () => {
    const context = new AnalysisContext();
    expect(context.previousContent).toEqual([]);
    expect(context.proposedContent).toEqual([]);
    expect(context.percentTime).toBe(0);
  });
});

describe('AnalysisContext get/set', () => {
  it('gets/sets previousContent', () => {
    const context = new AnalysisContext();
    const unit = new MusicUnit();
    context.previousContent = [unit];
    expect(context.previousContent).toEqual([unit]);
  });

  it('gets/sets proposedContent', () => {
    const context = new AnalysisContext();
    context.proposedContent = [60, 64, 67];
    expect(context.proposedContent).toEqual([60, 64, 67]);
  });

  it('gets/sets percentTime', () => {
    const context = new AnalysisContext();
    context.percentTime = 42;
    expect(context.percentTime).toBe(42);
  });
});

describe('AnalysisContext.toString', () => {
  it('includes percentTime and previousContent', () => {
    const context = new AnalysisContext();
    context.percentTime = 50;
    const str = context.toString();
    expect(str).toContain('50');
  });
});
