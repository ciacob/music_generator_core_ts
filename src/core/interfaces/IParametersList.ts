import type { IParameter } from './IParameter.js';

/** Callback shape for `every`/`forEach`/`some`, mirroring `Array.prototype` callbacks but passing the `IParametersList` itself as the third argument. */
export type ParametersListCallback<R> = (parameter: IParameter, index: number, list: IParametersList) => R;

/**
 * Dedicated container to store named `IParameter` instances.
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/ro/se/legacy/generators/core/interfaces/IParametersList.as`.
 * Array-like, same design as `ITimeSignatureMap`/`IMusicalBody`.
 */
export interface IParametersList {
  /** @see Array.prototype.length */
  readonly length: number;

  /** @see Array.prototype.every */
  every(callback: ParametersListCallback<boolean>): boolean;

  /** @see Array.prototype.forEach */
  forEach(callback: ParametersListCallback<void>): void;

  /** Returns the parameter at the given index. */
  getAt(index: number): IParameter;

  /** Returns all parameters sharing the given name, in the order they were added. */
  getByName(parameterName: string): IParameter[];

  /** Returns the parameter matching the given unique ID, or `null` if there's no match. */
  getByUid(parameterUid: string): IParameter | null;

  /** @see Array.prototype.indexOf */
  indexOf(searchParameter: IParameter, fromIndex?: number): number;

  /** Inserts `parameter` at `index`, shifting subsequent parameters back. */
  insertAt(index: number, parameter: IParameter): void;

  /** @see Array.prototype.lastIndexOf */
  lastIndexOf(searchParameter: IParameter, fromIndex?: number): number;

  /** @see Array.prototype.pop */
  pop(): IParameter | undefined;

  /** @see Array.prototype.push */
  push(...parameters: IParameter[]): number;

  /** Removes and returns the parameter at `index`. */
  removeAt(index: number): IParameter;

  /** @see Array.prototype.reverse */
  reverse(): void;

  /** @see Array.prototype.shift */
  shift(): IParameter | undefined;

  /** @see Array.prototype.some */
  some(callback: ParametersListCallback<boolean>): boolean;

  /** @see Array.prototype.sort */
  sort(compareFn?: (a: IParameter, b: IParameter) => number): void;

  /** @see Array.prototype.splice */
  splice(startIndex: number, deleteCount?: number, ...parameters: IParameter[]): void;

  /** @see Object.prototype.toString */
  toString(): string;

  /** @see Array.prototype.unshift */
  unshift(...parameters: IParameter[]): number;
}
