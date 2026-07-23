import { describe, expect, it } from 'vitest';
import { $get } from '../../../src/knowledge/instruments/InstrumentFactory.js';

describe('$get', () => {
  it('returns a MusicalInstrument for a known part name', () => {
    const violin = $get('Violin', 0);
    expect(violin).not.toBeNull();
    expect(violin?.internalName).toBe('VIOLIN');
    expect(violin?.ordinalIndex).toBe(0);
  });

  it('returns null for an unrecognized instrument name', () => {
    expect($get('Kazoo', 0)).toBeNull();
  });

  it('caches and recycles the same instance for the same name+ordinalIndex', () => {
    const a = $get('Flute', 0);
    const b = $get('Flute', 0);
    expect(a).toBe(b);
  });

  it('returns distinct instances for the same name at different ordinal indices', () => {
    const first = $get('Violin', 5);
    const second = $get('Violin', 6);
    expect(first).not.toBe(second);
    expect(first?.ordinalIndex).toBe(5);
    expect(second?.ordinalIndex).toBe(6);
  });

  it('does not confuse "Oboe"@10 with "Oboe1"@0 (the fixed cache-key collision)', () => {
    // Under the original AS3's raw "name + ordinalIndex" string
    // concatenation, both of these produce the same key ("Oboe10"). The
    // fixed cache key must keep them distinct.
    const a = $get('Oboe', 10);
    const b = $get('Oboe1', 0);
    expect(a?.ordinalIndex).toBe(10);
    // "Oboe1" is not a recognized PartNames entry, so it must resolve to
    // null -- not the cached "Oboe"@10 instance.
    expect(b).toBeNull();
  });
});
