import { describe, it, expect } from 'vitest';
import { InputRangeError } from './errors.js';
import { bendAllowance } from './metal/bendAllowance.js';
import { bolt } from './metal/bolt.js';
import { controlChart } from './quality/controlChart.js';
import { weibull } from './quality/weibull.js';
import { InputRangeError as RootExport } from './index.js';

/** What a refusal says as data — the properties a consumer reads instead of the message. */
function refusal(fn: () => unknown): Record<string, unknown> {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(RangeError);
    expect(e).toBeInstanceOf(InputRangeError);
    const { code, parameter, min, max, exclusive_min, exclusive_max, got } = e as InputRangeError;
    return Object.fromEntries(
      Object.entries({ code, parameter, min, max, exclusive_min, exclusive_max, got }).filter(([, v]) => v !== undefined),
    );
  }
  throw new Error('expected a refusal');
}

describe('InputRangeError', () => {
  it('is a RangeError named RangeError, so existing checks keep holding', () => {
    const e = new InputRangeError('x must be greater than 0', { code: 'parameter_out_of_range', parameter: 'x', exclusive_min: 0, got: -1 });
    expect(e).toBeInstanceOf(RangeError);
    expect(e.name).toBe('RangeError');
    expect(e.message).toBe('x must be greater than 0');
  });

  it('sets only the facts that apply', () => {
    const e = new InputRangeError('data must not be empty', { code: 'empty_input', parameter: 'data' });
    expect(Object.keys(e)).not.toContain('min');
    expect(Object.keys(e)).not.toContain('got');
  });

  it('is exported from the package root', () => {
    expect(RootExport).toBe(InputRangeError);
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
