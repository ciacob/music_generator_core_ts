import { AbstractRawMusicSource } from '../../core/abstracts/AbstractRawMusicSource.js';
import { CoreOperationKeys } from '../../core/constants/CoreOperationKeys.js';
import { DurationFractions } from '../../generators/constants/duration/DurationFractions.js';
import { MusicUnit } from '../../core/MusicUnit.js';
import { Parameter } from '../../core/Parameter.js';
import { ParameterNames } from '../constants/ParameterNames.js';
import { SettingsList } from '../../core/SettingsList.js';
import { WRPickerConfig } from '../../stochastic/random/WRPickerConfig.js';
import { WeightedRandomPicker } from '../../stochastic/random/WeightedRandomPicker.js';
import { getRandomInteger } from '../../utils/NumberUtil.js';
import type { IAnalysisContext } from '../../core/interfaces/IAnalysisContext.js';
import type { IFraction } from '../../math/IFraction.js';
import type { IMusicRequest } from '../../core/interfaces/IMusicRequest.js';
import type { IMusicUnit } from '../../core/interfaces/IMusicUnit.js';
import type { IParameter } from '../../core/interfaces/IParameter.js';
import type { IParametersList } from '../../core/interfaces/IParametersList.js';
import type { IRawMusicSource } from '../../core/interfaces/IRawMusicSource.js';
import type { ISettingsList } from '../../core/interfaces/ISettingsList.js';

const WHOLE = 'whole';
const HALF = 'half';
const QUARTER = 'quarter';
const EIGHT = 'eight';
const SIXTEENTH = 'sixteenth';

/** One `{fraction, weight}` entry, as inferred from the distribution chart for a given interpolation position. */
interface DurationInfo {
  fraction: IFraction;
  weight: number;
}

/**
 * Concrete `IRawMusicSource` implementation that outputs one duration candidate
 * based on a weighted distribution guided by the DURATIONS parameter.
 *
 * Ported from
 * `as-sources/legacy-generators-harmony/ro/se/legacy/generators/harmony/sources/RawDuration.as`.
 *
 * **`PRIVATE_DURATION_PARAMETERS` kept as a module-level map**, matching
 * the AS3 original's `private static const PRIVATE_DURATION_PARAMETERS`
 * — a field shared across every `RawDuration` instance (unlike
 * `_durationsDistributionChart`, which is per-instance). This is
 * preserved faithfully: it's always fully repopulated by
 * `initializeDurationsChart()` before being read, so the sharing has no
 * observable effect in practice, but changing its scope would be an
 * unrequested behavioral divergence from the source.
 *
 * **Injectable `randomFn`** (per this project's standing convention, see
 * `RandomChord.ts`): threaded through to the internal
 * `WeightedRandomPicker`, defaulting to `Math.random` so behavior is
 * unchanged unless a caller opts in. Two seams need it, not one:
 * `WeightedRandomPicker`'s constructor only seeds its pool-*shuffling*
 * step (see that file's own header) — the actual index-*picking* step
 * separately falls back to `NumberUtil.getRandomInteger`'s own default
 * `Math.random` unless a `WRPickerConfig.$setRandomIntegerFunction` is
 * supplied. Both are wired to the same `randomFn` here, so a single
 * injected seed fully determines this class's output.
 */
export class RawDuration extends AbstractRawMusicSource implements IRawMusicSource {
  private static readonly privateDurationParameters: Record<string, IParameter> = {};

  /**
   * Holds a table of envelopes that describe an aggregated distribution for the five
   * supported musical durations: wholes, halves, quarters, eights and sixteenths.
   *
   * For more details, see the "DURATIONS" parameter's description in class
   * "MultilineGenerator".
   */
  private durationsDistributionChart: ISettingsList | undefined;

  constructor(private readonly randomFn: () => number = Math.random) {
    super();
  }

  /**
   * Generates one duration candidate based on the DURATIONS parameter value.
   * Returns an array containing ONE `IMusicUnit` instance with only its duration property set.
   *
   * @see IRawMusicSource.output
   */
  override output(
    _targetMusicUnit: IMusicUnit,
    analysisContext: IAnalysisContext,
    parameters: IParametersList,
    request: IMusicRequest,
  ): IMusicUnit[] {
    // Obtain current time slot and retrieve DURATIONS parameter value
    const timeSlot = Math.round(analysisContext.percentTime * 100);
    const duration = parameters.getByName(ParameterNames.DURATIONS)[0] as IParameter;
    const durationValue = request.userSettings.getValueAt(duration, timeSlot) as number;

    // Infer available durations and their weights from distribution chart
    const durationsInfo = this.inferDurationsTableFor(durationValue);

    // Configure a WeightedRandomPicker to select one duration based on computed weights
    const cfg = WRPickerConfig.$create()
      .$setExhaustible(false)
      .$setNumPicks(1)
      .$setRandomIntegerFunction((a, b) => getRandomInteger(a, b, this.randomFn));
    for (let i = 0; i < durationsInfo.length; i++) {
      const dInfo = durationsInfo[i] as DurationInfo;
      cfg.$add(dInfo.fraction, dInfo.weight);
    }
    const picker = new WeightedRandomPicker(this.randomFn);
    picker.configure(cfg);
    const selectedDuration = picker.pick()[0] as IFraction;

    // Create a MusicUnit candidate with only the duration property set
    const candidate: IMusicUnit = new MusicUnit();
    candidate.duration = selectedDuration;

    // Return as an array for consistency with IRawMusicSource
    return [candidate];
  }

  /**
   * Resets internal state, releasing the cached distribution chart.
   * @see IRawMusicSource.reset
   */
  override reset(): void {
    this.durationsDistributionChart = undefined;
  }

  /**
   * Uses a distribution chart to infer a list of durations to pick from, along with their weights.
   *
   * @param interpolationPosition The position (1-100) along the distribution chart to sample from.
   * @returns An array of `{fraction, weight}` entries.
   * @see documentation for parameter "DURATIONS" in class "MultilineGenerator" for more detail.
   */
  private inferDurationsTableFor(interpolationPosition: number): DurationInfo[] {
    // Initialize the chart on first use. We use private `SettingsList` and `Parameter`
    // instances to benefit from the interpolation services these classes provide.
    if (!this.durationsDistributionChart) {
      this.durationsDistributionChart = this.initializeDurationsChart();
    }

    // Compile a list with interpolated duration weights
    const durations: DurationInfo[] = [];
    for (let i = 0; i < CoreOperationKeys.DURATIONS_IN_USE.length; i++) {
      const fraction = CoreOperationKeys.DURATIONS_IN_USE[i] as IFraction;
      let parameter: IParameter | undefined;
      switch (fraction) {
        case DurationFractions.WHOLE:
          parameter = RawDuration.privateDurationParameters[WHOLE];
          break;
        case DurationFractions.HALF:
          parameter = RawDuration.privateDurationParameters[HALF];
          break;
        case DurationFractions.QUARTER:
          parameter = RawDuration.privateDurationParameters[QUARTER];
          break;
        case DurationFractions.EIGHT:
          parameter = RawDuration.privateDurationParameters[EIGHT];
          break;
        case DurationFractions.SIXTEENTH:
          parameter = RawDuration.privateDurationParameters[SIXTEENTH];
          break;
      }
      durations.push({
        fraction,
        weight: Math.round(this.durationsDistributionChart.getValueAt(
          parameter as IParameter,
          interpolationPosition,
        ) as number),
      });
    }
    return durations;
  }

  /**
   * Initializes the durations distribution chart used by `inferDurationsTableFor()`.
   * The actual chart values are stored in the `CoreOperationKeys` class.
   *
   * @returns An `ISettingsList` instance containing the distribution chart.
   * @see inferDurationsTableFor
   * @see documentation for parameter "DURATIONS" in class "MultilineGenerator" for more detail.
   */
  private initializeDurationsChart(): ISettingsList {
    const chart: ISettingsList = new SettingsList();
    for (let i = 0; i < CoreOperationKeys.DURATIONS_IN_USE.length; i++) {
      const fraction = CoreOperationKeys.DURATIONS_IN_USE[i] as IFraction;
      const parameter: IParameter = new Parameter();
      parameter.type = CoreOperationKeys.TYPE_ARRAY;
      parameter.isTweenable = true;
      let parameterValues: readonly (readonly number[])[];
      switch (fraction) {
        case DurationFractions.WHOLE:
          parameter.name = WHOLE;
          parameterValues = CoreOperationKeys.WHOLE_CHART_VALUES;
          RawDuration.privateDurationParameters[WHOLE] = parameter;
          break;
        case DurationFractions.HALF:
          parameter.name = HALF;
          parameterValues = CoreOperationKeys.HALF_CHART_VALUES;
          RawDuration.privateDurationParameters[HALF] = parameter;
          break;
        case DurationFractions.QUARTER:
          parameter.name = QUARTER;
          parameterValues = CoreOperationKeys.QUARTER_CHART_VALUES;
          RawDuration.privateDurationParameters[QUARTER] = parameter;
          break;
        case DurationFractions.EIGHT:
          parameter.name = EIGHT;
          parameterValues = CoreOperationKeys.EIGHT_CHART_VALUES;
          RawDuration.privateDurationParameters[EIGHT] = parameter;
          break;
        case DurationFractions.SIXTEENTH:
          parameter.name = SIXTEENTH;
          parameterValues = CoreOperationKeys.SIXTEENTH_CHART_VALUES;
          RawDuration.privateDurationParameters[SIXTEENTH] = parameter;
          break;
        default:
          parameterValues = [];
          break;
      }
      for (let j = 0; j < parameterValues.length; j++) {
        const pair = parameterValues[j] as readonly number[];
        const pairTime = pair[0] as number;
        const value = pair[1] as number;
        chart.setValueAt(parameter, pairTime, value);
      }
    }
    return chart;
  }
}
