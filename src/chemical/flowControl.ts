import { roundTo } from '../utils.js';
import type { FlowControlInput, FlowControlResult } from './types.js';

/**
 * Control Valve Cv Calculator
 *
 * @formula
 *   - Liquid: Cv = Q × √(SG / ΔP)  (Q in GPM, ΔP in psi)
 *   - Gas: Cv = Q / (N × P1) × √(SG × T / ΔP)
 *   - Kv = 0.865 × Cv
 *
 * @reference ISA-75.01.01-2012 — Flow equations for sizing control valves
 * @reference IEC 60534-2-1 — Industrial-process control valves
 */
export function flowControl(input: FlowControlInput): FlowControlResult {
  const {
    flowRate, inletPressure, outletPressure, fluidDensity, fluidType,
    temperature = 20, molecularWeight, specificHeatRatio = 1.4,
  } = input;

  const pressureDrop = inletPressure - outletPressure; // kPa

  // Reference density: water = 999 kg/m³
  const sg = fluidDensity / 999;
  const pressureRatio = pressureDrop / inletPressure;

  let cv: number;
  let isChoked = false;

  if (fluidType === 'liquid') {
    // ISA liquid sizing: Cv = Q(m³/h) × √(SG / ΔP(bar))
    // Convert kPa to bar: 1 bar = 100 kPa
    const dpBar = pressureDrop / 100;
    if (dpBar <= 0) {
      cv = 0;
    } else {
      cv = flowRate * Math.sqrt(sg / dpBar);
    }
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

    // N8 = 94.8 for metric (m³/h, bar, K)
    const N8 = 94.8;
    const Y = 1 - xEffective / (3 * xCritical); // Expansion factor

    if (p1Bar <= 0 || xEffective <= 0) {
      cv = 0;
    } else {
      cv = flowRate / (N8 * p1Bar * Y) * Math.sqrt(MW * T / xEffective);
    }
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
