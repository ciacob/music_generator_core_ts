import { generateRFC4122GUID } from '../utils/Strings.js';
import type { IParameter } from './interfaces/IParameter.js';

/**
 * Default implementation of `IParameter`.
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/ro/se/legacy/generators/core/Parameter.as`.
 * The AS3 original's `_self` field is declared but never actually used
 * anywhere in the class body — a dead leftover field, not ported.
 */
export class Parameter implements IParameter {
  private uidValue: string | undefined;
  private typeValue = 0;
  private nameValue = '';
  private payloadValue: unknown;
  private minValueValue: unknown;
  private maxValueValue: unknown;
  private isTweenableValue = false;
  private isOptionalValue = false;
  private isContextualValue = false;
  private descriptionValue = '';
  private documentationUrlValue = '';
  private colorValue = 0;
  private iconValue: unknown;

  /** @see IParameter.uid */
  get uid(): string {
    if (this.uidValue === undefined) {
      this.uidValue = generateRFC4122GUID();
    }
    return this.uidValue;
  }

  /** @see IParameter.uid */
  set uid(value: string) {
    this.uidValue = value;
  }

  /** @see IParameter.type */
  get type(): number {
    return this.typeValue;
  }

  /** @see IParameter.type */
  set type(value: number) {
    this.typeValue = value;
  }

  /** @see IParameter.name */
  get name(): string {
    return this.nameValue;
  }

  /** @see IParameter.name */
  set name(value: string) {
    this.nameValue = value;
  }

  /** @see IParameter.payload */
  get payload(): unknown {
    return this.payloadValue;
  }

  /** @see IParameter.payload */
  set payload(value: unknown) {
    this.payloadValue = value;
  }

  /** @see IParameter.isTweenable */
  get isTweenable(): boolean {
    return this.isTweenableValue;
  }

  /** @see IParameter.isTweenable */
  set isTweenable(value: boolean) {
    this.isTweenableValue = value;
  }

  /** @see IParameter.isOptional */
  get isOptional(): boolean {
    return this.isOptionalValue;
  }

  /** @see IParameter.isOptional */
  set isOptional(value: boolean) {
    this.isOptionalValue = value;
  }

  /** @see IParameter.isContextual */
  get isContextual(): boolean {
    return this.isContextualValue;
  }

  /** @see IParameter.isContextual */
  set isContextual(value: boolean) {
    this.isContextualValue = value;
  }

  /** @see IParameter.minValue */
  get minValue(): unknown {
    return this.minValueValue;
  }

  /** @see IParameter.minValue */
  set minValue(value: unknown) {
    this.minValueValue = value;
  }

  /** @see IParameter.maxValue */
  get maxValue(): unknown {
    return this.maxValueValue;
  }

  /** @see IParameter.maxValue */
  set maxValue(value: unknown) {
    this.maxValueValue = value;
  }

  /** @see IParameter.description */
  get description(): string {
    return this.descriptionValue;
  }

  /** @see IParameter.description */
  set description(value: string) {
    this.descriptionValue = value;
  }

  /** @see IParameter.documentationUrl */
  get documentationUrl(): string {
    return this.documentationUrlValue;
  }

  /** @see IParameter.documentationUrl */
  set documentationUrl(value: string) {
    this.documentationUrlValue = value;
  }

  /** @see IParameter.color */
  get color(): number {
    return this.colorValue;
  }

  /** @see IParameter.color */
  set color(value: number) {
    this.colorValue = value;
  }

  /** @see IParameter.icon */
  get icon(): unknown {
    return this.iconValue;
  }

  /** @see IParameter.icon */
  set icon(value: unknown) {
    this.iconValue = value;
  }
}
