import { describe, expect, it } from 'vitest';
import { TimeSignatureDefinition } from '../../../src/knowledge/timesignature/TimeSignatureDefinition.js';
import { TimeSignatureEntry } from '../../../src/knowledge/timesignature/TimeSignatureEntry.js';

describe('TimeSignatureEntry defaults', () => {
  it('has a duration of 0/1 before signature/repetitions are set', () => {
    const entry = new TimeSignatureEntry();
    expect(entry.duration.toString()).toBe('0/1');
  });

  it('has undefined signature before it is set', () => {
    expect(new TimeSignatureEntry().signature).toBeUndefined();
  });

  it('has a duration of 0/1 when signature is set but repetitions is still 0', () => {
    const entry = new TimeSignatureEntry();
    entry.signature = new TimeSignatureDefinition(4, 4);
    expect(entry.duration.toString()).toBe('0/1');
  });

  it('has a duration of 0/1 when repetitions is set but signature is unset', () => {
    const entry = new TimeSignatureEntry();
    entry.repetitions = 4;
    expect(entry.duration.toString()).toBe('0/1');
  });
});

describe('TimeSignatureEntry.duration', () => {
  it('computes duration as signature.fraction * repetitions', () => {
    const entry = new TimeSignatureEntry();
    entry.signature = new TimeSignatureDefinition(4, 4); // fraction 1/1
    entry.repetitions = 8;
    expect(entry.duration.toString()).toBe('8/1');
  });

  it('recomputes duration after repetitions changes', () => {
    const entry = new TimeSignatureEntry();
    entry.signature = new TimeSignatureDefinition(4, 4);
    entry.repetitions = 2;
    expect(entry.duration.toString()).toBe('2/1');
    entry.repetitions = 5;
    expect(entry.duration.toString()).toBe('5/1');
  });

  it('recomputes duration after signature changes', () => {
    const entry = new TimeSignatureEntry();
    entry.repetitions = 4;
    entry.signature = new TimeSignatureDefinition(3, 4); // fraction 3/4
    expect(entry.duration.toString()).toBe('3/1');
    entry.signature = new TimeSignatureDefinition(7, 8); // fraction 7/8
    expect(entry.duration.toString()).toBe('7/2');
  });

  it('caches duration across repeated reads with no changes', () => {
    const entry = new TimeSignatureEntry();
    entry.signature = new TimeSignatureDefinition(4, 4);
    entry.repetitions = 3;
    expect(entry.duration).toBe(entry.duration);
  });
});

describe('TimeSignatureEntry accessors', () => {
  it('reflects repetitions/signature via their getters', () => {
    const entry = new TimeSignatureEntry();
    const sig = new TimeSignatureDefinition(6, 8);
    entry.repetitions = 3;
    entry.signature = sig;
    expect(entry.repetitions).toBe(3);
    expect(entry.signature).toBe(sig);
  });
});

describe('TimeSignatureEntry.toString', () => {
  it('describes repetitions, time signature, and duration', () => {
    const entry = new TimeSignatureEntry();
    entry.signature = new TimeSignatureDefinition(3, 4);
    entry.repetitions = 4;
    const str = entry.toString();
    expect(str).toContain('4');
    expect(str).toContain('3/4');
    expect(str).toContain('3/1');
  });
});
