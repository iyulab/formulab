import { roundTo, requireFinite } from '../utils.js';
import type { FlowControlInput, FlowControlResult } from './types.js';
import { inputRangeError } from '../errors.js';

/**
 * Control Valve Cv Calculator
 *
 * @formula
 *   - Liquid: Kv = Q × √(SG / ΔP)  (Q m³/h, ΔP bar) — the same as Cv = Q × √(SG / ΔP) in gpm and psi
 *   - Gas/steam: Kv = Q / (N9 × P1 × Y) × √(M × T × Z / x), N9 = 2460 (Q m³/h at 0 °C and
 *     101.325 kPa, P1 bar absolute, T K); x = ΔP / P1 limited to Fk × xT; Y = 1 − x / (3 Fk xT)
 *   - Cv = Kv / 0.865 (1 Cv = 0.865 Kv)
 *
 * N9 follows from the mass-flow form W = N6 × Kv × Y × √(x × P1 × ρ1) with N6 = 31.6 and the
 * ideal-gas densities at inlet and at 0 °C, 101.325 kPa.
 *
 * @reference ISA-75.01.01-2012 — Flow equations for sizing control valves
 * @reference IEC 60534-2-1 — Industrial-process control valves
 * @throws RangeError if flowRate is not greater than 0, inletPressure or fluidDensity is not greater than 0,
 *   or outletPressure is negative or not below inletPressure; for gas/steam, if molecularWeight is given and not greater than 0, or temperature is not above -273.15 °C
 */
export function flowControl(input: FlowControlInput): FlowControlResult {
  requireFinite('flowControl', input);
  const {
    flowRate, inletPressure, outletPressure, fluidDensity, fluidType,
    temperature = 20, molecularWeight, specificHeatRatio = 1.4,
  } = input;

  // A valve is sized for a flow; with none every coefficient is 0 (and a negative one is negative).
  if (!(flowRate > 0)) {
    throw inputRangeError('flowRate must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'flowRate', exclusive_min: 0, got: flowRate,
    });
  }
  // The pressure ratio divides by the inlet pressure and the sizing coefficient takes the
  // square root of the specific gravity, so neither may be zero or negative.
  if (!(inletPressure > 0)) {
    throw inputRangeError('inletPressure must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'inletPressure', exclusive_min: 0, got: inletPressure,
    });
  }
  if (!(fluidDensity > 0)) {
    throw inputRangeError('fluidDensity must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'fluidDensity', exclusive_min: 0, got: fluidDensity,
    });
  }
  // Gas sizing takes the square root of MW × absolute temperature.
  if (fluidType !== 'liquid') {
    if (molecularWeight !== undefined && !(molecularWeight > 0)) {
      throw inputRangeError('molecularWeight must be greater than 0', {
        code: 'parameter_out_of_range', parameter: 'molecularWeight', exclusive_min: 0, got: molecularWeight,
      });
    }
    if (!(temperature > -273.15)) {
      throw inputRangeError('temperature must be above absolute zero (-273.15 °C)', {
        code: 'parameter_out_of_range', parameter: 'temperature', exclusive_min: -273.15, got: temperature,
      });
    }
  }

  // The pressure ratio ΔP/P1 is taken on absolute pressures; below vacuum there is no pressure.
  if (!(outletPressure >= 0)) {
    throw inputRangeError('outletPressure must not be negative (absolute pressure)', {
      code: 'parameter_out_of_range', parameter: 'outletPressure', min: 0, got: outletPressure,
    });
  }

  const pressureDrop = inletPressure - outletPressure; // kPa
  // Flow through a valve needs a pressure drop across it; none (or a reversed one) has no Cv.
  if (!(pressureDrop > 0)) {
    throw new RangeError('outletPressure must be lower than inletPressure');
  }

  // Reference density: water = 999 kg/m³
  const sg = fluidDensity / 999;
  const pressureRatio = pressureDrop / inletPressure;

  let cv: number;
  let isChoked = false;

  if (fluidType === 'liquid') {
    // IEC 60534 liquid sizing in metric units gives Kv: Kv = Q(m³/h) × √(SG / ΔP(bar))
    const dpBar = pressureDrop / 100;
    cv = (flowRate * Math.sqrt(sg / dpBar)) / 0.865;
  } else {
    // Gas/Steam sizing
    // Critical pressure ratio for choked flow
    const xT = 0.7; // typical for globe valve
    const Fk = specificHeatRatio / 1.4;
    const xCritical = Fk * xT;
    const x = pressureDrop / inletPressure;

    if (x >= xCritical) {
      isChoked = true;
    }

    const xEffective = Math.min(x, xCritical);
    const p1Bar = inletPressure / 100;
    const T = temperature + 273.15;
    const MW = molecularWeight ?? 29; // default air

    // N9 for Kv with Q in m³/h at 0 °C, 101.325 kPa, pressure in bar (IEC 60534-2-1)
    const N9 = 2460;
    const Y = 1 - xEffective / (3 * xCritical); // Expansion factor
    const Z = 1.0;

    cv = (flowRate / (N9 * p1Bar * Y)) * Math.sqrt((MW * T * Z) / xEffective) / 0.865;
  }

  const kv = cv * 0.865;

  // Estimate pipe velocity (assuming DN50 pipe)
  const pipeArea = Math.PI * (0.05 / 2) ** 2; // m²
  const velocity = (flowRate / 3600) / pipeArea; // m/s

  return {
    cv: roundTo(cv, 2),
    kv: roundTo(kv, 2),
    pressureDrop: roundTo(pressureDrop, 2),
    pressureRatio: roundTo(pressureRatio, 4),
    isChoked,
    velocity: roundTo(velocity, 2),
  };
}
