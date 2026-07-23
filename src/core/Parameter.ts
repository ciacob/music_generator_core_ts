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

  get uid(): string {
    if (this.uidValue === undefined) {
      this.uidValue = generateRFC4122GUID();
    }
    return this.uidValue;
  }

  set uid(value: string) {
    this.uidValue = value;
  }

  get type(): number {
    return this.typeValue;
  }

  set type(value: number) {
    this.typeValue = value;
  }

  get name(): string {
    return this.nameValue;
  }

  set name(value: string) {
    this.nameValue = value;
  }

  get payload(): unknown {
    return this.payloadValue;
  }

  set payload(value: unknown) {
    this.payloadValue = value;
  }

  get isTweenable(): boolean {
    return this.isTweenableValue;
  }

  set isTweenable(value: boolean) {
    this.isTweenableValue = value;
  }

  get isOptional(): boolean {
    return this.isOptionalValue;
  }

  set isOptional(value: boolean) {
    this.isOptionalValue = value;
  }

  get isContextual(): boolean {
    return this.isContextualValue;
  }

  set isContextual(value: boolean) {
    this.isContextualValue = value;
  }

  get minValue(): unknown {
    return this.minValueValue;
  }

  set minValue(value: unknown) {
    this.minValueValue = value;
  }

  get maxValue(): unknown {
    return this.maxValueValue;
  }

  set maxValue(value: unknown) {
    this.maxValueValue = value;
  }

  get description(): string {
    return this.descriptionValue;
  }

  set description(value: string) {
    this.descriptionValue = value;
  }

  get documentationUrl(): string {
    return this.documentationUrlValue;
  }

  set documentationUrl(value: string) {
    this.documentationUrlValue = value;
  }

  get color(): number {
    return this.colorValue;
  }

  set color(value: number) {
    this.colorValue = value;
  }

  get icon(): unknown {
    return this.iconValue;
  }

  set icon(value: unknown) {
    this.iconValue = value;
  }
}
