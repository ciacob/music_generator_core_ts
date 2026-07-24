import { AbstractGeneratorModule } from '../core/abstracts/AbstractGeneratorModule.js';
import { CoreOperationKeys } from '../core/constants/CoreOperationKeys.js';
import { Duration } from './traits/Duration.js';
import { Harmony } from './traits/Harmony.js';
import { Parameter } from '../core/Parameter.js';
import { ParameterNames } from './constants/ParameterNames.js';
import type { IGeneratorModule } from '../core/interfaces/IGeneratorModule.js';
import type { IMusicalTrait } from '../core/interfaces/IMusicalTrait.js';
import type { IParameter } from '../core/interfaces/IParameter.js';
import type { IParametersList } from '../core/interfaces/IParametersList.js';

const UID = 'MULTILINE GENERATOR v.2';

/**
 * `IGeneratorModule` implementation that produces homophonic chorals.
 *
 * Ported from
 * `as-sources/legacy-generators-harmony/ro/se/legacy/generators/harmony/MultilineGenerator.as`.
 *
 * This is the facade tying together everything ported in steps 1-12: it defines the full
 * parameter catalog consumed by every analyzer/source/trait ported so far (previously only
 * approximated in each of those files' own test fixtures), and lists `Duration`/`Harmony` as
 * this module's musical traits.
 *
 * **`payload`/`color`/`minValue`/`maxValue` transcribed verbatim, including AS3's sparse-array
 * literals.** Per `IParameter.ts`'s own doc comment (already established in step 5): these four
 * fields are pure Flash-UI metadata, never consumed by generation logic, only by the excluded
 * parameter-editor UI. So `parameter.payload = [, 50]` is transcribed exactly as `[, 50]` — a
 * sparse two-element array literal, valid identical syntax in both AS3 and JS/TS (index `0` is a
 * hole, index `1` is `50`) — rather than reinterpreted into some "more meaningful" shape; there
 * is no meaning to recover beyond what the original UI happened to store.
 *
 * **The subclass-level `_parameters`/`_traits` caching fields are redundant with the base
 * class's own caching, but kept for fidelity.** `super.parametersList` (accessed once, on first
 * call) already lazily initializes and caches the 4 core parameters in the base class's own
 * private field; capturing that same reference into this class's own `cachedParametersList`
 * field before `.push()`-ing the 13 harmony-specific parameters onto it doesn't change what's
 * stored (same object, same reference) — it just mirrors the AS3 original's own redundant local
 * cache exactly, so a side-by-side diff of the two sources stays easy to follow.
 */
export class MultilineGenerator extends AbstractGeneratorModule implements IGeneratorModule {
  private traitsValue: IMusicalTrait[] | undefined;
  private cachedParametersList: IParametersList | undefined;

  /** @see IGeneratorModule.moduleUid */
  override get moduleUid(): string {
    return UID;
  }

  /**
   * Lists the parameters available for this `IGeneratorModule` implementation.
   * @see IGeneratorModule.parametersList
   */
  override get parametersList(): IParametersList {
    if (!this.cachedParametersList) {
      this.cachedParametersList = super.parametersList;
      this.cachedParametersList.push(
        // Expressed as a percent, where 1% means the upper limit of the average
        // middle range of all involved instruments, while 100% means the
        // highest pitch playable by any of the involved instruments.
        // NOTE: this approach guarantees a `common` middle range to always be
        // available.
        ((): IParameter => {
          const parameter = new Parameter();
          parameter.type = CoreOperationKeys.TYPE_ARRAY;
          parameter.name = ParameterNames.HIGHEST_PITCH;
          parameter.uid = 'cb1095bf-6914-4002-838c-b0d179227cb9';
          parameter.color = 0xff0000;
          parameter.payload = [, 50];
          parameter.isTweenable = true;
          parameter.description =
            'The highest pitch to consider including. Expressed as a percent, 1% means the upper limit of the average middle range of all involved instruments, while 100% means the highest pitch playable by any of the involved instruments.';
          return parameter;
        })(),

        // Expressed as a percent, 1% means the lowest pitch playable by any of
        // the involved instruments, while 100% means the lower limit of the
        // average middle range of all involved instruments.
        // NOTE: this approach guarantees a `common` middle range to always be
        // available.
        ((): IParameter => {
          const parameter = new Parameter();
          parameter.type = CoreOperationKeys.TYPE_ARRAY;
          parameter.name = ParameterNames.LOWEST_PITCH;
          parameter.uid = '848f53aa-a47f-4e6f-86aa-8dbe79843f7d';
          parameter.color = 0xff80ed;
          parameter.payload = [, 50];
          parameter.isTweenable = true;
          parameter.description =
            'The lowest pitch to consider including. Expressed as a percent, 1% means the lowest pitch playable by any of the involved instruments, while 100% means the lower limit of the average middle range of all involved instruments.';
          return parameter;
        })(),

        // Expressed as a percent, where 1% generally means the shortest durations
        // available, while 100% means the longest durations available.
        //
        // NOTES: The value actually slides horizontally through a distribution
        // chart, where the likeliness of use for each of the supported durations
        // evolves on its own curve, and each duration's curve picks at a
        // different point with respect to the horizontal chart axis.
        //
        // For instance, at 50% the quarters are prevalent, while eights and
        // halves are much scarcer; with sixteenths and wholes being even less
        // present.
        //
        // Eights pick at 25%, halves at 75%, sixteenths at 1%, wholes at 100%.
        //
        // The constants `..._CHART_VALUES` in the `Constants` class describe the
        // exact chart used.
        ((): IParameter => {
          const parameter = new Parameter();
          parameter.type = CoreOperationKeys.TYPE_ARRAY;
          parameter.name = ParameterNames.DURATIONS;
          parameter.uid = '4bca6e0c-c2d7-4969-916f-31ea01f47e05';
          parameter.color = 0xff7373;
          parameter.payload = [, 70];
          parameter.isTweenable = true;
          parameter.description =
            'The dominant durations to use when generating structures. Expressed as a percent, 1% generally favors the shortest durations available, while 100% favors the longest durations available.';
          return parameter;
        })(),

        // Metric placement quality of generated durations.
        // Expressed as a percent, where 1% permits durations placed anywhere in the measure,
        // while 100% strongly favors durations that align naturally with beat strength and
        // metric structure.
        ((): IParameter => {
          const parameter = new Parameter();
          parameter.type = CoreOperationKeys.TYPE_ARRAY;
          parameter.name = ParameterNames.METRIC_PLACEMENT;
          parameter.uid = 'a7f8e3d2-9b4c-4a1e-8f5d-6c2b9e7a3f1d';
          parameter.color = 0x4a90e2;
          parameter.payload = [, 50];
          parameter.isTweenable = true;
          parameter.description =
            'How naturally durations align with metric structure. Expressed as a percent, where 1% permits durations placed anywhere in the measure, while 100% strongly favors durations that align naturally with beat strength and metric structure.';
          return parameter;
        })(),

        // Voice cohesion in polyphonic textures.
        // Expressed as a percent, where 0% favors fragmented Klangfarbenmelodie-style
        // textures with scattered pitch activity, while 100% favors natural voice arcs
        // where individual voices emerge, build, and recede organically.
        ((): IParameter => {
          const parameter = new Parameter();
          parameter.type = CoreOperationKeys.TYPE_ARRAY;
          parameter.name = ParameterNames.VOICE_COHESION;
          parameter.uid = 'b3e9c2f1-4d7a-4b8e-9c6f-2a5d8e1b7c4a';
          parameter.color = 0x9b59b6;
          parameter.payload = [, 50];
          parameter.isTweenable = true;
          parameter.description =
            'Controls voice continuity patterns. 0% favors fragmented textures where pitches scatter across voices (Klangfarbenmelodie). 100% favors cohesive voice arcs where individual voices emerge, peak, and recede naturally before yielding to others.';
          return parameter;
        })(),

        // How many voices to use, by default `4`
        // Expressed as a percent, 0% means, by convention, 2 voices (provided
        // that the involved instruments can sustain 2 voices), whereas 100%
        // means the full polyphony that all involved instruments are able,
        // together, to sustain (the sum of the `maximumAutonomousVoices`
        // property of each involved instrument).
        ((): IParameter => {
          const parameter = new Parameter();
          parameter.type = CoreOperationKeys.TYPE_ARRAY;
          parameter.name = ParameterNames.VOICES_NUMBER;
          parameter.uid = '15e63b26-59ba-48f1-be04-14d0b0a0fcc7';
          parameter.color = 0x800000;
          parameter.payload = [, 100];
          parameter.isTweenable = true;
          parameter.description =
            'How many "voices" to use (i.e., autonomous pitches). Expressed as a percent, 1% means, by convention, 1 "voice", whereas 100% means the full polyphony that all involved instruments are able, together, to sustain.';
          return parameter;
        })(),

        // Only exists to add an on/off switch in the generated UI. When the switch is in its "on"
        // position, the MelodicProfile analyzer is engaged; when the switch is in its "off"
        // position, the MelodicProfile analyzer is bypassed.
        // TODO: see if there is a better way to implement a bypass mechanism for parameters.
        ((): IParameter => {
          const parameter = new Parameter();
          parameter.type = CoreOperationKeys.TYPE_INT;
          parameter.name = ParameterNames.USE_MELODIC_MODEL;
          parameter.uid = 'e0e088c3-3546-4ee1-a152-cf09ee89b3b2';
          parameter.color = 0x881100;
          parameter.payload = 1;
          parameter.isTweenable = false;
          parameter.minValue = 0;
          parameter.maxValue = 1;
          parameter.description = 'Switch on to engage the "Melodic profile balance" parameter; switch off to bypass it.';
          return parameter;
        })(),

        //
        ((): IParameter => {
          const parameter = new Parameter();
          parameter.type = CoreOperationKeys.TYPE_ARRAY;
          parameter.name = ParameterNames.MELODIC_DIRECTION_BALANCE;
          parameter.uid = '611a25c9-c701-4d3f-bd13-bdd15ef53f4d';
          parameter.color = 0x881100;
          parameter.payload = [, 100];
          parameter.isTweenable = true;
          parameter.description =
            'Applies a melodic model to the top-most voice of the structures being generated, where direction and magnitude of melodic motion self-balance (e.g., upward motion is compensated by downward motion). The greater the value, the closer the generated melodies will abide to the model; smaller values encourage unbalanced lines that defy/contradict the model.';
          return parameter;
        })(),

        // Context independent consonance of each chord. Expressed as a percent,
        // 0% means very dissonant, whereas 100% means very consonant.
        ((): IParameter => {
          const parameter = new Parameter();
          parameter.type = CoreOperationKeys.TYPE_ARRAY;
          parameter.name = ParameterNames.INTRINSIC_CONSONANCE;
          parameter.uid = '6e0f7fde-b04e-401f-8244-d53f613da0c0';
          parameter.color = 0x800080;
          parameter.payload = [, 100];
          parameter.isTweenable = true;
          parameter.description =
            'Context-independent, harmonic consonance of each structure. Only relevant when there are several "voices" involved. Expressed as a percent, 1% favors harsh dissonances, whereas 100% favors most consonant chords (usually triads).';
          return parameter;
        })(),

        //
        ((): IParameter => {
          const parameter = new Parameter();
          parameter.type = CoreOperationKeys.TYPE_INT;
          parameter.name = ParameterNames.ENFORCE_CONSONANCE;
          parameter.uid = '4a1a0aa8-e7a0-4271-955a-0849b0ef7ebf';
          parameter.color = 0x800060;
          parameter.payload = 0;
          parameter.isTweenable = false;
          parameter.minValue = 0;
          parameter.maxValue = 1;
          parameter.description =
            'Very CPU-intensive. Adds a pre-filter to the harmonic structures being generated, ensuring that each of them is at least as consonant as the current value of the "Intrinsic Consonance" parameter demands.';
          return parameter;
        })(),

        // Motion profile of individual voices in two subsequent chords.
        // Expressed as a percent, 100% favors step motion and small skips, more
        // in the external voices, less in internal ones, while 0% does the
        // opposite.
        ((): IParameter => {
          const parameter = new Parameter();
          parameter.type = CoreOperationKeys.TYPE_ARRAY;
          parameter.name = ParameterNames.CHORD_PROGRESSION;
          parameter.uid = 'c0ac4f9c-237f-4bb8-aced-fc7071da0fbe';
          parameter.color = 0x990000;
          parameter.payload = [, 100];
          parameter.isTweenable = true;
          parameter.isContextual = true;
          parameter.description =
            'Motion profile of individual voices in two subsequent structures. Expressed as a percent, 100% favors more motion in the external "voices" and less in internal ones, while 1% imposes no such restrictions.';
          return parameter;
        })(),

        // Tendency of each individual note of a chord to progress to a different
        // pitch in the chord immediately following it, rather than holding the
        // same pitch. Higher values favor homophony, while lower values favor
        // polyphony. Extreme values yield textures of long, held notes (0%) or
        // isomorphic chorals (100%).
        ((): IParameter => {
          const parameter = new Parameter();
          parameter.type = CoreOperationKeys.TYPE_ARRAY;
          parameter.name = ParameterNames.VOICE_RESTLESSNESS;
          parameter.uid = 'bd8bfb06-450b-4a88-a97b-0144e39bdf95';
          parameter.color = 0x3cb44b;
          parameter.payload = [, 75];
          parameter.isTweenable = true;
          parameter.description =
            'Tendency of each individual note of a structure to progress to a different pitch in the structure immediately following it, rather than holding the same pitch. Higher values favor homophony, while lower values favor polyphony. The values in the extremes yield textures of long, held notes (1%) or isomorphic chorals (100%).';
          return parameter;
        })(),

        ((): IParameter => {
          const parameter = new Parameter();
          parameter.type = CoreOperationKeys.TYPE_ARRAY;
          parameter.name = ParameterNames.HARMONIC_DISTRIBUTION;
          parameter.uid = '23f7f892-c2e8-4d61-937f-04b137bffcdd';
          parameter.color = 0x000075;
          parameter.payload = [, 50];
          parameter.isTweenable = true;
          parameter.description =
            'Distribution of individual notes inside of a given structure. Higher values favor pyramidal shapes, e.g., notes tend to crowd in the upper part of the structure and dilute toward the bass; lower values favor the opposite (reversed pyramids). Around the middle setting notes tend to distribute evenly.';
          return parameter;
        })(),
      );
    }
    return this.cachedParametersList;
  }

  /**
   * Lists the musical traits available for this `IGeneratorModule` implementation.
   * @see IGeneratorModule.musicalTraitsList
   */
  override get musicalTraits(): IMusicalTrait[] {
    if (!this.traitsValue) {
      this.traitsValue = [new Duration(), new Harmony()];
    }
    return this.traitsValue;
  }
}
