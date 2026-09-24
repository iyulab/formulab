import { roundTo } from '../utils.js';
import type { FlowControlInput, FlowControlResult } from './types.js';

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
 * @throws RangeError if inletPressure or fluidDensity is not greater than 0; for gas/steam, if molecularWeight is given and not greater than 0, or temperature is not above -273.15 °C
 */
export function flowControl(input: FlowControlInput): FlowControlResult {
  const {
    flowRate, inletPressure, outletPressure, fluidDensity, fluidType,
    temperature = 20, molecularWeight, specificHeatRatio = 1.4,
  } = input;

  // The pressure ratio divides by the inlet pressure and the sizing coefficient takes the
  // square root of the specific gravity, so neither may be zero or negative.
  if (!(inletPressure > 0)) {
    throw new RangeError('inletPressure must be greater than 0');
  }
  if (!(fluidDensity > 0)) {
    throw new RangeError('fluidDensity must be greater than 0');
  }
  // Gas sizing takes the square root of MW × absolute temperature.
  if (fluidType !== 'liquid') {
    if (molecularWeight !== undefined && !(molecularWeight > 0)) {
      throw new RangeError('molecularWeight must be greater than 0');
    }
    if (!(temperature > -273.15)) {
      throw new RangeError('temperature must be above absolute zero (-273.15 °C)');
    }
  }

  const pressureDrop = inletPressure - outletPressure; // kPa

  // Reference density: water = 999 kg/m³
  const sg = fluidDensity / 999;
  const pressureRatio = pressureDrop / inletPressure;

  let cv: number;
  let isChoked = false;

  if (fluidType === 'liquid') {
    // IEC 60534 liquid sizing in metric units gives Kv: Kv = Q(m³/h) × √(SG / ΔP(bar))
    const dpBar = pressureDrop / 100;
    cv = dpBar <= 0 ? 0 : (flowRate * Math.sqrt(sg / dpBar)) / 0.865;
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

    cv = p1Bar <= 0 || xEffective <= 0
      ? 0
      : (flowRate / (N9 * p1Bar * Y)) * Math.sqrt((MW * T * Z) / xEffective) / 0.865;
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
