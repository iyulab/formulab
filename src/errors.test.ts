import { describe, it, expect } from 'vitest';
import { inputRangeError, type InputRangeError } from './errors.js';
import { bendAllowance } from './metal/bendAllowance.js';
import { bolt } from './metal/bolt.js';
import { controlChart } from './quality/controlChart.js';
import { weibull } from './quality/weibull.js';
import { regression } from './utility/regression.js';
import { triangleSolver } from './machining/triangleSolver.js';
import { lineBalancing } from './quality/lineBalancing.js';
import { cmk } from './quality/cmk.js';

/** What a refusal says as data — the properties a consumer reads instead of the message. */
function refusal(fn: () => unknown): Record<string, unknown> {
  try {
    fn();
  } catch (e) {
    expect(Object.getPrototypeOf(e)).toBe(RangeError.prototype);
    const { code, parameter, min, max, exclusive_min, exclusive_max, got, expected, id } = e as InputRangeError;
    return Object.fromEntries(
      Object.entries({ code, parameter, min, max, exclusive_min, exclusive_max, got, expected, id }).filter(([, v]) => v !== undefined),
    );
  }
  throw new Error('expected a refusal');
}

describe('inputRangeError()', () => {
  it('is a plain RangeError with the message unchanged', () => {
    const e = inputRangeError('x must be greater than 0', { code: 'parameter_out_of_range', parameter: 'x', exclusive_min: 0, got: -1 });
    expect(Object.getPrototypeOf(e)).toBe(RangeError.prototype);
    expect(e.name).toBe('RangeError');
    expect(e.message).toBe('x must be greater than 0');
  });

  it('compares as the error it replaced — the facts are non-enumerable, like message', () => {
    const e = inputRangeError('x must be greater than 0', { code: 'parameter_out_of_range', parameter: 'x', exclusive_min: 0, got: -1 });
    expect(Object.keys(e)).toEqual([]);
    expect(() => { throw e; }).toThrow(new RangeError('x must be greater than 0'));
    expect(e.code).toBe('parameter_out_of_range');
    expect(e.got).toBe(-1);
  });

  it('sets only the facts that apply', () => {
    const e = inputRangeError('data must not be empty', { code: 'empty_input', parameter: 'data' });
    expect(Object.getOwnPropertyNames(e)).toContain('parameter');
    expect(Object.getOwnPropertyNames(e)).not.toContain('min');
    expect(Object.getOwnPropertyNames(e)).not.toContain('got');
  });
});

describe('refusals carry the input, the bound and the value given', () => {
  const bend = { thickness: 2, insideRadius: 3, bendAngle: 90, material: 'mildSteel' as const };

  it('an open lower bound (> 0)', () => {
    expect(refusal(() => bendAllowance({ ...bend, thickness: -5 }))).toEqual({
      code: 'parameter_out_of_range', parameter: 'thickness', exclusive_min: 0, got: -5,
    });
  });

  it('a closed lower bound (≥ 0)', () => {
    expect(refusal(() => bendAllowance({ ...bend, insideRadius: -1 }))).toEqual({
      code: 'parameter_out_of_range', parameter: 'insideRadius', min: 0, got: -1,
    });
  });

  it('an open and a closed bound (a closed hem bends to 180°)', () => {
    expect(refusal(() => bendAllowance({ ...bend, bendAngle: 200 }))).toEqual({
      code: 'parameter_out_of_range', parameter: 'bendAngle', exclusive_min: 0, max: 180, got: 200,
    });
  });

  it('names the input as the message does, not the local it was read into', () => {
    expect(refusal(() => bolt({ mode: 'preloadToTorque', diameter: 10, pitch: 1.5, kFactor: 0.2, tensileStrength: 800, preload: 0 }))).toEqual({
      code: 'parameter_out_of_range', parameter: 'preload', exclusive_min: 0, got: 0,
    });
  });

  it('a count below the least the calculation needs', () => {
    expect(refusal(() => weibull({ failureTimes: [100] }))).toEqual({
      code: 'insufficient_data', parameter: 'failureTimes', min: 2, got: 1,
    });
  });

  it('an empty list', () => {
    expect(refusal(() => controlChart({ type: 'xbar-r', subgroups: [] }))).toMatchObject({ parameter: 'subgroups' });
  });

  it('a non-finite number anywhere in the input', () => {
    expect(refusal(() => bendAllowance({ ...bend, thickness: Number.NaN }))).toEqual({
      code: 'value_not_finite', parameter: 'thickness', got: Number.NaN,
    });
  });
});

describe('refusals about the input as a whole', () => {
  const task = (id: string, predecessors: string[] = []) => ({ id, time: 2, predecessors });

  it('a dependency loop', () => {
    expect(refusal(() => lineBalancing({ cycleTime: 10, tasks: [task('A', ['B']), task('B', ['A'])] }))).toEqual({
      code: 'cyclic_dependency', parameter: 'tasks',
    });
  });

  it('a repeated id, by path and by id', () => {
    expect(refusal(() => lineBalancing({ cycleTime: 10, tasks: [task('A'), task('A')] }))).toEqual({
      code: 'duplicate_id', parameter: 'tasks[1].id', id: 'A',
    });
  });

  it('a list with no variation', () => {
    expect(refusal(() => weibull({ failureTimes: [5, 5, 5] }))).toEqual({ code: 'degenerate_data', parameter: 'failureTimes' });
    expect(refusal(() => regression({ x: [2, 2, 2], y: [1, 2, 3] }))).toEqual({ code: 'degenerate_data', parameter: 'x' });
  });

  it('sides that cannot meet', () => {
    // SSA: sin B = 10 · sin 30° / 2 = 2.5 > 1
    expect(refusal(() => triangleSolver({ a: 2, b: 10, A: 30 }))).toEqual({ code: 'invalid_geometry' });
  });

  it('too few readings is a count, not a range', () => {
    expect(refusal(() => cmk({ measurements: [1], lsl: 0, usl: 2 }))).toEqual({
      code: 'insufficient_data', parameter: 'measurements', min: 2, got: 1,
    });
  });
});

