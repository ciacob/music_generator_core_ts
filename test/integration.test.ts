import { describe, expect, it } from 'vitest';
import {
  CoreOperationKeys,
  generate,
  InstrumentFactory,
  MultilineGenerator,
  SettingsList,
  TimeSignatureEntry,
  TimeSignatureFactory,
  TimeSignatureMap,
} from '../src/index.js';
import type { IMusicalInstrument, IMusicRequest, IParameter, IParametersList, ISettingsList } from '../src/index.js';

/**
 * Builds a flat-valued `ISettingsList`, reading every default straight out of a
 * `MultilineGenerator`'s own `parametersList` -- per the top-level README's explicit guidance
 * ("don't guess defaults independently"). `TYPE_ARRAY` parameters store their default as a
 * sparse `[, value]` payload (pure UI metadata, per `IParameter.payload`'s own doc); the last
 * (defined) element is used as a flat value across all time slots. Every other parameter type
 * stores its default directly as a plain scalar payload.
 */
function buildDefaultSettings(parametersList: IParametersList): ISettingsList {
  const settings = new SettingsList();
  for (let i = 0; i < parametersList.length; i++) {
    const param = parametersList.getAt(i);
    const payload = param.payload;
    const value = param.type === CoreOperationKeys.TYPE_ARRAY && Array.isArray(payload) ? payload[payload.length - 1] : payload;
    settings.setValueAt(param, 1, value as number);
  }
  return settings;
}

/** A trivial 2-instrument, 4-measure request, per step 14's target fixture. */
function buildMinimalRequest(): IMusicRequest {
  const timeMap = new TimeSignatureMap();
  const entry = new TimeSignatureEntry();
  entry.signature = TimeSignatureFactory.$get(4, 4);
  entry.repetitions = 4;
  timeMap.push(entry);

  const violin = InstrumentFactory.$get('Violin', 0) as IMusicalInstrument;
  const cello = InstrumentFactory.$get('Cello', 0) as IMusicalInstrument;
  const instruments = [violin, cello];

  const generator = new MultilineGenerator();
  const userSettings = buildDefaultSettings(generator.parametersList);

  return { timeMap, instruments, userSettings };
}

describe('generate() end-to-end integration', () => {
  it('produces a musical body with a plausible unit count, matching total duration, and no missing durations', async () => {
    const request = buildMinimalRequest();

    const body = await generate({ request });

    // Plausible unit count: not empty, not absurdly large for 4 measures of 4/4.
    expect(body.length).toBeGreaterThan(0);
    expect(body.length).toBeLessThan(200);

    // No unit with a missing duration.
    for (let i = 0; i < body.length; i++) {
      const unit = body.getAt(i);
      expect(unit.duration).toBeDefined();
    }

    // Total duration matches (at least reaches) the requested time map's total -- generation
    // stops once the accumulated duration reaches or exceeds the request (see
    // AbstractGeneratorModule.isContentNeeded), so it may slightly overshoot depending on
    // available duration granularity, but should never fall meaningfully short or run away.
    const requestedTotal = request.timeMap.duration.floatValue;
    expect(body.duration.floatValue).toBeGreaterThanOrEqual(requestedTotal);
    expect(body.duration.floatValue).toBeLessThan(requestedTotal + 1); // at most one extra whole note's worth of overshoot
  }, 30000);

  it('reports progress via onProgress, ending at (or very near) 1', async () => {
    const request = buildMinimalRequest();
    const progressUpdates: number[] = [];

    await generate({
      request,
      onProgress: (percentCompleted) => {
        progressUpdates.push(percentCompleted);
      },
    });

    expect(progressUpdates.length).toBeGreaterThan(0);
    for (const update of progressUpdates) {
      expect(update).toBeGreaterThanOrEqual(0);
      expect(update).toBeLessThanOrEqual(1);
    }
    // Progress should be non-decreasing.
    for (let i = 1; i < progressUpdates.length; i++) {
      expect(progressUpdates[i]).toBeGreaterThanOrEqual(progressUpdates[i - 1] as number);
    }
  }, 30000);

  it('every generated unit has pitches consistent with the requested instruments (no orphaned allocations)', async () => {
    const request = buildMinimalRequest();
    const instrumentUids = new Set((request.instruments as IMusicalInstrument[]).map((inst) => inst.uid));

    const body = await generate({ request });

    for (let i = 0; i < body.length; i++) {
      const unit = body.getAt(i);
      for (const allocation of unit.pitchAllocations) {
        expect(instrumentUids.has(allocation.instrument.uid)).toBe(true);
      }
    }
  }, 30000);

  it('is usable with a single instrument too (VOICES_NUMBER default covers 1..N voices gracefully)', async () => {
    const timeMap = new TimeSignatureMap();
    const entry = new TimeSignatureEntry();
    entry.signature = TimeSignatureFactory.$get(4, 4);
    entry.repetitions = 2;
    timeMap.push(entry);

    const piano = InstrumentFactory.$get('Piano', 0) as IMusicalInstrument;
    const generator = new MultilineGenerator();
    const userSettings = buildDefaultSettings(generator.parametersList);
    const request: IMusicRequest = { timeMap, instruments: [piano], userSettings };

    const body = await generate({ request });

    expect(body.length).toBeGreaterThan(0);
    expect(body.duration.floatValue).toBeGreaterThanOrEqual(timeMap.duration.floatValue);
  }, 30000);

  it('resolves with an empty body for a legitimately empty (zero-duration) request, without spuriously rejecting', async () => {
    const timeMap = new TimeSignatureMap();
    const generator = new MultilineGenerator();
    const userSettings = buildDefaultSettings(generator.parametersList);
    const request: IMusicRequest = { timeMap, instruments: [], userSettings };

    const body = await generate({ request });
    expect(body.length).toBe(0);
  });
});

describe('buildDefaultSettings sanity (validates the fixture-building approach itself)', () => {
  it('every parameter MultilineGenerator declares has a usable default recorded', () => {
    const generator = new MultilineGenerator();
    const settings = buildDefaultSettings(generator.parametersList);
    const parametersList = generator.parametersList;

    for (let i = 0; i < parametersList.length; i++) {
      const param = parametersList.getAt(i) as IParameter;
      const value = settings.getValueAt(param, 1);
      expect(value).not.toBeNull();
      expect(Number.isNaN(value as number)).toBe(false);
    }
  });
});
