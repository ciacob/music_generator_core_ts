/**
 * Ported from
 * `as-sources/legacy-generators-core-library/ro/se/legacy/generators/core/interfaces/IParameter.as`.
 *
 * `icon` was originally typed `flash.display.DisplayObject` — per this
 * project's gotcha table (#4), a pure Flash UI type meaningless outside a
 * Flex app, never used by generation logic (only by the excluded
 * parameter-editor UI). Typed here as `unknown`, a placeholder — same
 * treatment `IParameter.color`/`minValue`/`maxValue`/`payload` already
 * get, since their AS3 types (`Object`, `uint`) don't map onto anything
 * meaningfully more specific without deeper knowledge of each concrete
 * parameter's actual data shape.
 */
export interface IParameter {
  /** Internally or externally defined ID that globally identifies this parameter instance. */
  uid: string;

  /**
   * This parameter's data type. See `GeneratorSupportedTypes` for the
   * acceptable type constants.
   */
  type: number;

  /**
   * The name of this parameter; parameter names should be locally
   * unique, i.e. no two parameters by the same name should exist in any
   * given generator module.
   */
  name: string;

  /** The value or values for this parameter, depending on its `type`. */
  payload: unknown;

  /**
   * Only applicable if this parameter's `type` is an int/uint type.
   * Parameters of "number" type are assumed to express percents (implicit
   * minimum `0`); "array" type parameters are assumed to contain unsigned
   * integers ranging from `1` to `100`. The minimum numeric value this
   * parameter is allowed to take.
   */
  minValue: unknown;

  /**
   * Only applicable if this parameter's `type` is an int/uint type.
   * Parameters of "number" type are assumed to express percents (implicit
   * maximum `1`); "array" type parameters are assumed to contain unsigned
   * integers ranging from `1` to `100`. The maximum numeric value this
   * parameter is allowed to take.
   */
  maxValue: unknown;

  /**
   * Whether this parameter accepts multiple values, so it can be
   * "animated"/"tweened" as generation progresses.
   */
  isTweenable: boolean;

  /** Whether this parameter can be bypassed during the generation process. */
  isOptional: boolean;

  /**
   * Whether this parameter only has meaning in a musical context, i.e. it
   * does not point to an intrinsic musical feature, such as pitch.
   */
  isContextual: boolean;

  /** A short description (max. 256 chars) of this parameter's role in the generation process. */
  description: string;

  /** A URI segment pointing to a dedicated documentation page for this parameter. */
  documentationUrl: string;

  /** A color code to be associated with this parameter, for UIs that use color coding. */
  color: number;

  /**
   * A graphical asset to be associated with this parameter. See the file
   * comment above — this was Flash-UI-only in the original and is never
   * used by generation logic.
   */
  icon: unknown;
}
