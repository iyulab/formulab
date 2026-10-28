import { roundTo, requireFinite } from '../utils.js';
import type { PidStepResponseInput, PidStepResponseResult } from './types.js';
import { inputRangeError } from '../errors.js';

/** Derivative filter ratio: the derivative acts through a first-order filter with time constant Td / N. */
const DERIVATIVE_FILTER_N = 10;
/** The simulation stops here: |PV| beyond this many setpoint-steps means the loop is diverging. */
const DIVERGENCE_LIMIT = 1e6;
/** Upper bound on simulation steps; a coarser step is used (and disclosed) beyond it. */
const MAX_STEPS = 200_000;

function positive(value: number, name: string): void {
  if (!(value > 0)) {
    throw inputRangeError(`${name} must be greater than 0`, {
      code: 'parameter_out_of_range', parameter: name, exclusive_min: 0, got: value,
    });
  }
}

function nonNegative(value: number, name: string): void {
  if (!(value >= 0)) {
    throw inputRangeError(`${name} must be 0 or greater`, {
      code: 'parameter_out_of_range', parameter: name, min: 0, got: value,
    });
  }
}

/**
 * Closed-loop setpoint step response of a PID-controlled first-order-plus-dead-time process.
 *
 * Plant (FOPDT): G(s) = K · e^(−L·s) / (T·s + 1), starting at rest. Controller (ideal/standard form):
 * u = Kp · (e + (1/Ti)·∫e dt − Td · dy_f/dt), with the derivative taken on the measurement through a
 * first-order filter of time constant Td/10 (no derivative kick on the setpoint step). The loop is
 * unconstrained: no actuator saturation or rate limit is modelled, so a high gain shows the response the
 * linear model predicts, not what a limited actuator would do. The plant is discretised exactly for a
 * constant input over each step and the dead time is a whole number of steps.
 *
 * `ti` of 0 (what `pid()` returns for a P controller) means no integral action; `td` of 0 means no
 * derivative action — so the output of `pid()` can be passed straight in.
 *
 * @formula
 *   y[k+1] = a·y[k] + K·(1 − a)·u[k − L/dt],  a = e^(−dt/T)
 *   u[k] = Kp · (e[k] + I[k] − N·(y[k] − y_f[k])),  I += e·dt/Ti
 *
 * @units time in the same unit for processGain-independent inputs (seconds by convention); the response
 *   is in the process-variable unit, per `stepSize` of setpoint.
 *
 * @reference Åström, K.J. & Hägglund, T. (2006). Advanced PID Control. ISA — ideal PID form, derivative
 *   on measurement with filter N≈10, FOPDT step-response metrics.
 * @reference Ziegler, J.G. & Nichols, N.B. (1942); Cohen, G.H. & Coon, G.A. (1953) — the tuning rules
 *   `pid()` applies to the same FOPDT model.
 *
 * @throws {RangeError} processGain, timeConstant, deadTime or stepSize not greater than 0; kp not greater
 *   than 0; ti or td negative; duration not greater than 0; points not an integer from 10 to 2000.
 */
export function pidStepResponse(input: PidStepResponseInput): PidStepResponseResult {
  requireFinite('pidStepResponse', input);
  const K = input.processGain;
  const T = input.timeConstant;
  const L = input.deadTime;
  const { kp, ti, td } = input;
  const r = input.stepSize ?? 1;
  const duration = input.duration ?? 10 * L + 3 * T;
  const points = input.points ?? 200;

  positive(K, 'processGain');
  positive(T, 'timeConstant');
  positive(L, 'deadTime');
  positive(kp, 'kp');
  positive(r, 'stepSize');
  positive(duration, 'duration');
  if (!(ti >= 0)) {
    throw inputRangeError('ti must be 0 or greater (0 = no integral action)', {
      code: 'parameter_out_of_range', parameter: 'ti', min: 0, got: ti,
    });
  }
  nonNegative(td, 'td');
  if (!Number.isInteger(points) || points < 10 || points > 2000) {
    throw inputRangeError('points must be an integer from 10 to 2000', {
      code: 'parameter_out_of_range', parameter: 'points', min: 10, max: 2000, got: points,
    });
  }

  // Step size: fine enough for the dead time, the lag and the whole span; whole steps of dead time.
  const dtWanted = Math.min(L / 20, T / 50, duration / 4000);
  const dtCoarsest = duration / MAX_STEPS;
  const dtChosen = Math.max(dtWanted, dtCoarsest);
  // A dead time shorter than half the coarsest allowed step cannot be a whole step: it is then 0 steps
  // (error below one step, and `resolutionLimited` says so).
  const delaySteps = Math.round(L / dtChosen);
  const dt = delaySteps > 0 ? L / delaySteps : dtChosen;
  const resolutionLimited = dt > dtWanted * 1.0001 || delaySteps === 0;
  const steps = Math.ceil(duration / dt);

  const a = Math.exp(-dt / T);
  const b = K * (1 - a);
  const integral = ti > 0;
  const hasDerivative = td > 0;
  const filterRate = hasDerivative ? 1 - Math.exp(-dt / (td / DERIVATIVE_FILTER_N)) : 0;

  const y = new Float64Array(steps + 1);
  const u = new Float64Array(steps + 1);
  let integralTerm = 0;
  let yFiltered = 0;
  let last = steps;
  let diverged = false;

  for (let k = 0; k <= steps; k++) {
    const e = r - y[k];
    if (integral) integralTerm += (e * dt) / ti;
    const derivative = hasDerivative ? -DERIVATIVE_FILTER_N * (y[k] - yFiltered) : 0;
    u[k] = kp * (e + integralTerm + derivative);
    if (hasDerivative) yFiltered += filterRate * (y[k] - yFiltered);
    if (k === steps) break;
    const delayed = k >= delaySteps ? u[k - delaySteps] : 0;
    y[k + 1] = a * y[k] + b * delayed;
    if (!(Math.abs(y[k + 1]) <= DIVERGENCE_LIMIT * r)) {
      diverged = true;
      last = k + 1;
      u[last] = u[k];
      break;
    }
  }

  // Metrics on the full-resolution series.
  let peak = 0;
  let peakIndex = 0;
  for (let k = 0; k <= last; k++) {
    if (y[k] > peak) { peak = y[k]; peakIndex = k; }
  }
  const crossing = (level: number): number | null => {
    for (let k = 1; k <= last; k++) {
      if (y[k - 1] < level && y[k] >= level) {
        return (k - 1 + (level - y[k - 1]) / (y[k] - y[k - 1])) * dt;
      }
    }
    return null;
  };
  const t10 = crossing(0.1 * r);
  const t90 = crossing(0.9 * r);
  let settlingTime: number | null = null;
  if (!diverged && Math.abs(y[last] - r) <= 0.02 * r) {
    let lastOutside = -1;
    for (let k = last; k >= 0; k--) {
      if (Math.abs(y[k] - r) > 0.02 * r) { lastOutside = k; break; }
    }
    settlingTime = (lastOutside + 1) * dt;
  }

  // Downsample for presentation.
  const count = Math.min(points, last + 1);
  const time: number[] = [];
  const processVariable: number[] = [];
  const controllerOutput: number[] = [];
  for (let i = 0; i < count; i++) {
    const k = count === 1 ? 0 : Math.round((i * last) / (count - 1));
    time.push(roundTo(k * dt, 6));
    processVariable.push(roundTo(y[k], 6));
    controllerOutput.push(roundTo(u[k], 6));
  }

  return {
    time,
    processVariable,
    controllerOutput,
    setpoint: r,
    peakValue: roundTo(peak, 6),
    peakTime: roundTo(peakIndex * dt, 6),
    overshootPercent: roundTo(Math.max(0, ((peak - r) / r) * 100), 2),
    riseTime: t10 !== null && t90 !== null ? roundTo(t90 - t10, 6) : null,
    settlingTime: settlingTime === null ? null : roundTo(settlingTime, 6),
    finalValue: roundTo(y[last], 6),
    diverged,
    resolutionLimited,
    timeStep: roundTo(dt, 9),
  };
}
