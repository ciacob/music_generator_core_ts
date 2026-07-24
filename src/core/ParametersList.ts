import type { IParameter } from './interfaces/IParameter.js';
import type { IParametersList, ParametersListCallback } from './interfaces/IParametersList.js';

/**
 * Dedicated container to store named `IParameter` instances.
 *
 * Ported from
 * `as-sources/legacy-generators-core-library/ro/se/legacy/generators/core/ParametersList.as`.
 *
 * **Bug fixed** (same pattern as `TimeSignatureMap.splice` in step 4):
 * the AS3 original's `splice` passes the rest-arg `parameters` *array* as
 * a single third argument to the underlying `Vector.splice(startIndex,
 * deleteCount, parameters)`, instead of spreading it — inserting the
 * whole array as one bogus element rather than its individual parameters.
 * Fixed here via `...parameters`.
 *
 * `getByUid`'s AS3 original logs via `trace()` when no match is found;
 * translated to `console.debug`, the direct Node/browser equivalent.
 */
export class ParametersList implements IParametersList {
  private parameters: IParameter[] = [];

  /** Removes all stored parameters. */
  empty(): void {
    this.parameters.length = 0;
  }

  /** @see IParametersList.every */
  every(callback: ParametersListCallback<boolean>): boolean {
    return this.parameters.every((p, i) => callback(p, i, this));
  }

  /** @see IParametersList.forEach */
  forEach(callback: ParametersListCallback<void>): void {
    this.parameters.forEach((p, i) => callback(p, i, this));
  }

  /** @see IParametersList.getAt */
  getAt(index: number): IParameter {
    return this.parameters[index] as IParameter;
  }

  /** @see IParametersList.getByName */
  getByName(parameterName: string): IParameter[] {
    return this.searchFor('name', parameterName);
  }

  /** @see IParametersList.getByUid */
  getByUid(parameterUid: string): IParameter | null {
    const matches = this.searchFor('uid', parameterUid, true);
    const result = matches.length >= 1 ? (matches[0] as IParameter) : null;
    if (!result) {
      console.debug(
        `ParametersList.getByUid(): Could not find any parameter in the current set that matches: "${parameterUid}".`,
      );
    }
    return result;
  }

  /** @see IParametersList.indexOf */
  indexOf(searchParameter: IParameter, fromIndex = 0): number {
    return this.parameters.indexOf(searchParameter, fromIndex);
  }

  /** @see IParametersList.insertAt */
  insertAt(index: number, parameter: IParameter): void {
    this.parameters.splice(index, 0, parameter);
  }

  /** @see IParametersList.lastIndexOf */
  lastIndexOf(searchParameter: IParameter, fromIndex = 0x7fffffff): number {
    return this.parameters.lastIndexOf(searchParameter, fromIndex);
  }

  /** @see IParametersList.length */
  get length(): number {
    return this.parameters.length;
  }

  /** @see IParametersList.pop */
  pop(): IParameter | undefined {
    return this.parameters.pop();
  }

  /** @see IParametersList.push */
  push(...parameters: IParameter[]): number {
    return this.parameters.push(...parameters);
  }

  /** @see IParametersList.removeAt */
  removeAt(index: number): IParameter {
    const parameter = this.parameters[index] as IParameter;
    this.parameters.splice(index, 1);
    return parameter;
  }

  /** @see IParametersList.reverse */
  reverse(): void {
    this.parameters.reverse();
  }

  /** @see IParametersList.shift */
  shift(): IParameter | undefined {
    return this.parameters.shift();
  }

  /** @see IParametersList.some */
  some(callback: ParametersListCallback<boolean>): boolean {
    return this.parameters.some((p, i) => callback(p, i, this));
  }

  /** @see IParametersList.sort */
  sort(compareFn?: (a: IParameter, b: IParameter) => number): void {
    this.parameters.sort(compareFn);
  }

  /** @see IParametersList.splice */
  splice(startIndex: number, deleteCount = 0xffffffff, ...parameters: IParameter[]): void {
    this.parameters.splice(startIndex, deleteCount, ...parameters);
  }

  /** @see IParametersList.toString */
  toString(): string {
    return this.parameters.toString();
  }

  /** @see IParametersList.unshift */
  unshift(...parameters: IParameter[]): number {
    return this.parameters.unshift(...parameters);
  }

  /**
   * Traverses all registered parameters looking for matches on a given
   * string-valued field.
   *
   * @param fieldName The name of a string `IParameter` field to search by.
   * @param fieldValue The string to search for.
   * @param singleResult Optional, default `false`. Whether to stop after the first match.
   * @returns A (possibly empty) array of matching parameters.
   */
  private searchFor(
    fieldName: 'name' | 'uid',
    fieldValue: string,
    singleResult = false,
  ): IParameter[] {
    const buffer: IParameter[] = [];
    for (const parameter of this.parameters) {
      if (parameter[fieldName] === fieldValue) {
        buffer.push(parameter);
        if (singleResult) {
          break;
        }
      }
    }
    return buffer;
  }
}
