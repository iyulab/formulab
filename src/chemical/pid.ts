import { roundTo } from '../utils.js';
import type { PidInput, PidResult } from './types.js';

/**
 * PID Tuning Calculator — Ziegler-Nichols / Cohen-Coon
 *
 * @formula
 *   Z-N Step Response: Kp = T/(K×L), Ti = 2L, Td = 0.5L (for PID)
 *   Z-N Ultimate:      Kp = 0.6×Ku, Ti = 0.5×Pu, Td = 0.125×Pu (for PID)
 *   Cohen-Coon:        Kp/K × (T/L) × f(L/T) with dead-time ratio corrections
 *
 * @reference Ziegler, J.G. & Nichols, N.B. (1942). Optimum Settings for Automatic Controllers.
 * @reference Cohen, G.H. & Coon, G.A. (1953). Theoretical Consideration of Retarded Control.
 */
export function pid(input: PidInput): PidResult {
  const { method, controllerType } = input;

  let kp = 0;
  let ti = Infinity;
  let td = 0;
  let methodName = method;

  if (method === 'ziegler-nichols-step') {
    const K = input.processGain ?? 1;
    const L = input.deadTime ?? 1;
    const T = input.timeConstant ?? 1;

    if (K <= 0 || L <= 0 || T <= 0) {
      return { kp: 0, ki: 0, kd: 0, ti: 0, td: 0, method: methodName };
    }

    if (controllerType === 'P') {
      kp = T / (K * L);
      ti = Infinity;
      td = 0;
    } else if (controllerType === 'PI') {
      kp = 0.9 * T / (K * L);
      ti = L / 0.3;
      td = 0;
    } else {
      // PID
      kp = 1.2 * T / (K * L);
      ti = 2 * L;
      td = 0.5 * L;
    }

  } else if (method === 'ziegler-nichols-ultimate') {
    const Ku = input.ultimateGain ?? 1;
    const Pu = input.ultimatePeriod ?? 1;

    if (Ku <= 0 || Pu <= 0) {
      return { kp: 0, ki: 0, kd: 0, ti: 0, td: 0, method: methodName };
    }

    if (controllerType === 'P') {
      kp = 0.5 * Ku;
      ti = Infinity;
      td = 0;
    } else if (controllerType === 'PI') {
      kp = 0.45 * Ku;
      ti = Pu / 1.2;
      td = 0;
    } else {
      // PID
      kp = 0.6 * Ku;
      ti = 0.5 * Pu;
      td = 0.125 * Pu;
    }

  } else if (method === 'cohen-coon') {
    const K = input.processGain ?? 1;
    const L = input.deadTime ?? 1;
    const T = input.timeConstant ?? 1;

    if (K <= 0 || L <= 0 || T <= 0) {
      return { kp: 0, ki: 0, kd: 0, ti: 0, td: 0, method: methodName };
    }

    const r = L / T; // dead time ratio

    if (controllerType === 'P') {
      kp = (1 / K) * (T / L) * (1 + r / 3);
      ti = Infinity;
      td = 0;
    } else if (controllerType === 'PI') {
      kp = (1 / K) * (T / L) * (0.9 + r / 12);
      ti = L * (30 + 3 * r) / (9 + 20 * r);
      td = 0;
    } else {
      // PID
      kp = (1 / K) * (T / L) * (4 / 3 + r / 4);
      ti = L * (32 + 6 * r) / (13 + 8 * r);
      td = L * 4 / (11 + 2 * r);
    }
  }

  // Ki = Kp / Ti, Kd = Kp × Td
  const ki = ti > 0 && Number.isFinite(ti) ? kp / ti : 0;
  const kd = kp * td;

  return {
    kp: roundTo(kp, 4),
    ki: roundTo(ki, 6),
    kd: roundTo(kd, 4),
    ti: Number.isFinite(ti) ? roundTo(ti, 4) : 0,
    td: roundTo(td, 4),
    method: methodName,
  };
}
