import { describe, it, expect } from 'vitest';
import { pid } from './pid.js';
import { pidStepResponse } from './pidStepResponse.js';

const plant = { processGain: 2, timeConstant: 10, deadTime: 1 };

describe('pidStepResponse', () => {
  it('holds the process at rest until the dead time has passed', () => {
    const r = pidStepResponse({ ...plant, kp: 1, ti: 0, td: 0, duration: 40, points: 400 });
    const beforeDelay = r.time.map((t, i) => ({ t, y: r.processVariable[i] })).filter((p) => p.t <= plant.deadTime);
    expect(beforeDelay.length).toBeGreaterThan(5);
    for (const p of beforeDelay) expect(p.y).toBe(0);
    expect(r.processVariable[r.processVariable.length - 1]).toBeGreaterThan(0);
  });

  it('settles a proportional-only loop at Kc·K / (1 + Kc·K) of the setpoint', () => {
    // K = 2, Kc = 0.25 -> loop gain 0.5 -> 0.5 / 1.5 = 1/3 of the setpoint (the classic offset)
    const r = pidStepResponse({ ...plant, kp: 0.25, ti: 0, td: 0, duration: 200 });
    expect(r.finalValue).toBeCloseTo(1 / 3, 3);
    expect(r.overshootPercent).toBe(0);
    expect(r.settlingTime).toBeNull(); // never within 2 % of the setpoint
  });

  it('removes the offset with integral action', () => {
    const r = pidStepResponse({ ...plant, kp: 0.25, ti: 8, td: 0, duration: 400 });
    expect(r.finalValue).toBeCloseTo(1, 3);
    expect(r.settlingTime).not.toBeNull();
  });

  it('follows the first-order closed loop when integral time cancels the process lag', () => {
    // Ti = T, Kc·K = 1.5: the loop is y = 1 - exp(-Kc·K·t/T) when the dead time is negligible
    const T = 10;
    const r = pidStepResponse({ processGain: 2, timeConstant: T, deadTime: T * 1e-3, kp: 0.75, ti: T, td: 0, duration: 30, points: 301 });
    const i = r.time.findIndex((t) => Math.abs(t - T) < 1e-9);
    expect(i).toBeGreaterThan(0);
    expect(r.processVariable[i]).toBeCloseTo(1 - Math.exp(-1.5), 2);
  });

  it('scales with the setpoint step', () => {
    const one = pidStepResponse({ ...plant, kp: 2, ti: 4, td: 1 });
    const five = pidStepResponse({ ...plant, kp: 2, ti: 4, td: 1, stepSize: 5 });
    expect(five.processVariable[100]).toBeCloseTo(5 * one.processVariable[100], 4);
    expect(five.overshootPercent).toBeCloseTo(one.overshootPercent, 1);
  });

  it('shows the overshoot of a Ziegler-Nichols step-response PID loop', () => {
    const gains = pid({ method: 'ziegler-nichols-step', controllerType: 'PID', processGain: 1, deadTime: 1, timeConstant: 10 });
    const r = pidStepResponse({ processGain: 1, timeConstant: 10, deadTime: 1, kp: gains.kp, ti: gains.ti, td: gains.td, duration: 60 });
    // Kp = 12, Ti = 2, Td = 0.5 (pid() golden) -> a lively loop: it overshoots, then settles
    expect(r.overshootPercent).toBeGreaterThan(10);
    expect(r.finalValue).toBeCloseTo(1, 1);
    expect(r.peakValue).toBeGreaterThan(1);
    expect(r.riseTime).not.toBeNull();
    expect(r.diverged).toBe(false);
  });

  it('stops and says so when the loop diverges', () => {
    const r = pidStepResponse({ ...plant, kp: 40, ti: 0, td: 0, duration: 200 });
    expect(r.diverged).toBe(true);
    expect(r.settlingTime).toBeNull();
    expect(r.processVariable.every(Number.isFinite)).toBe(true);
  });

  it('discloses a coarser step when the dead time is tiny against the span', () => {
    const r = pidStepResponse({ processGain: 1, timeConstant: 1e5, deadTime: 1e-3, kp: 1, ti: 0, td: 0 });
    expect(r.resolutionLimited).toBe(true);
    const fine = pidStepResponse({ ...plant, kp: 1, ti: 0, td: 0 });
    expect(fine.resolutionLimited).toBe(false);
  });

  it('returns the requested number of samples', () => {
    expect(pidStepResponse({ ...plant, kp: 1, ti: 0, td: 0, points: 50 }).time).toHaveLength(50);
  });

  describe('refusals', () => {
    const base = { ...plant, kp: 1, ti: 2, td: 0.5 };
    it.each([
      ['processGain', { processGain: 0 }],
      ['timeConstant', { timeConstant: -1 }],
      ['deadTime', { deadTime: 0 }],
      ['kp', { kp: 0 }],
      ['ti', { ti: -1 }],
      ['td', { td: -0.1 }],
      ['stepSize', { stepSize: 0 }],
      ['duration', { duration: 0 }],
      ['points', { points: 5 }],
      ['points', { points: 20.5 }],
    ])('refuses %s out of range', (parameter, patch) => {
      try {
        pidStepResponse({ ...base, ...patch });
        throw new Error('expected a RangeError');
      } catch (e) {
        expect(e).toBeInstanceOf(RangeError);
        expect((e as { parameter?: string }).parameter).toBe(parameter);
      }
    });
    it('refuses a non-finite number', () => {
      expect(() => pidStepResponse({ ...base, kp: Number.NaN })).toThrow(RangeError);
      expect(() => pidStepResponse({ ...base, ti: Number.POSITIVE_INFINITY })).toThrow(RangeError);
    });
  });
});
