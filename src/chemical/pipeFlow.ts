import { roundTo } from '../utils.js';
import type { PipeFlowInput, PipeFlowResult, PipeMaterial } from './types.js';

/**
 * Pipe roughness values in mm
 * Source: Engineering Toolbox, Pipe Flow Software, ASTM
 */
const PIPE_ROUGHNESS: Record<Exclude<PipeMaterial, 'custom'>, number> = {
  commercialSteel: 0.045,
  stainlessSteel: 0.015,
  castIron: 0.26,
  copper: 0.0015,
  pvc: 0.0015,
  concrete: 1.0,
  galvanizedSteel: 0.15,
};

/**
 * Swamee-Jain explicit friction factor for turbulent flow
 *
 * f = 0.25 / [log10(ε/(3.7D) + 5.74/Re^0.9)]²
 *
 * Valid for: 5000 ≤ Re ≤ 10⁸, 10⁻⁶ ≤ ε/D ≤ 10⁻²
 * Accuracy: ±1% vs Colebrook-White
 *
 * Reference: Swamee & Jain (1976), J. Hydraulics Division, ASCE
 */
function swameeJainFriction(Re: number, epsilonM: number, diameterM: number): number {
  const relativeRoughness = epsilonM / diameterM;
  const term = relativeRoughness / 3.7 + 5.74 / Math.pow(Re, 0.9);
  const logTerm = Math.log10(term);
  return 0.25 / (logTerm * logTerm);
}

/**
 * Pipe Flow Calculator (Darcy-Weisbach + Swamee-Jain)
 *
 * Calculates pressure drop and head loss for fluid flow through pipes.
 * Uses:
 * - Laminar: f = 64/Re (Re < 2300)
 * - Turbulent: Swamee-Jain explicit formula (Re > 4000)
 * - Transitional: Linear interpolation (2300 ≤ Re ≤ 4000)
 *
 * Darcy-Weisbach: ΔP = f × (L/D) × (ρv²/2)
 *
 * @throws {RangeError} Flow rate must be positive
 * @throws {RangeError} Pipe diameter must be positive
 * @throws {RangeError} Pipe length must be positive
 * @throws {RangeError} Fluid density must be positive
 * @throws {RangeError} Fluid viscosity must be positive
 * @throws {RangeError} Custom roughness must be provided and non-negative
 * @param input - flow rate, pipe geometry, fluid properties
 * @returns pressure drop, velocity, Reynolds number, flow regime
 */
export function pipeFlow(input: PipeFlowInput): PipeFlowResult {
  const { flowRate, pipeDiameter, pipeLength, pipeMaterial, fluidDensity, fluidViscosity, customRoughness } = input;

  if (flowRate <= 0) throw new RangeError('Flow rate must be positive');
  if (pipeDiameter <= 0) throw new RangeError('Pipe diameter must be positive');
  if (pipeLength <= 0) throw new RangeError('Pipe length must be positive');
  if (fluidDensity <= 0) throw new RangeError('Fluid density must be positive');
  if (fluidViscosity <= 0) throw new RangeError('Fluid viscosity must be positive');

  // Get pipe roughness
  let roughnessMm: number;
  if (pipeMaterial === 'custom') {
    if (customRoughness == null || customRoughness < 0) {
      throw new RangeError('Custom roughness must be provided and non-negative');
    }
    roughnessMm = customRoughness;
  } else {
    roughnessMm = PIPE_ROUGHNESS[pipeMaterial];
  }

  // Unit conversions
  const diameterM = pipeDiameter / 1000;        // mm → m
  const epsilonM = roughnessMm / 1000;           // mm → m
  const flowRateM3s = flowRate / 60000;           // L/min → m³/s

  // Velocity: v = Q / A = 4Q / (πD²)
  const area = (Math.PI * diameterM * diameterM) / 4;
  const velocity = flowRateM3s / area;

  // Reynolds number: Re = ρvD / μ
  const Re = (fluidDensity * velocity * diameterM) / fluidViscosity;

  // Determine flow regime and friction factor
  let frictionFactor: number;
  let flowRegime: 'laminar' | 'transitional' | 'turbulent';

  if (Re < 2300) {
    flowRegime = 'laminar';
    frictionFactor = 64 / Re;
  } else if (Re > 4000) {
    flowRegime = 'turbulent';
    frictionFactor = swameeJainFriction(Re, epsilonM, diameterM);
  } else {
    // Transitional: linear interpolation
    flowRegime = 'transitional';
    const fLam = 64 / 2300;
    const fTurb = swameeJainFriction(4000, epsilonM, diameterM);
    const t = (Re - 2300) / (4000 - 2300);
    frictionFactor = fLam + t * (fTurb - fLam);
  }

  // Darcy-Weisbach: ΔP = f × (L/D) × (ρv²/2)
  const pressureDrop = frictionFactor * (pipeLength / diameterM) * (fluidDensity * velocity * velocity / 2);

  // Head loss: h_f = ΔP / (ρg)
  const g = 9.81;
  const headLoss = pressureDrop / (fluidDensity * g);

  return {
    velocity: roundTo(velocity, 4),
    reynoldsNumber: roundTo(Re, 0),
    flowRegime,
    frictionFactor: roundTo(frictionFactor, 6),
    pressureDrop: roundTo(pressureDrop, 2),
    pressureDropKpa: roundTo(pressureDrop / 1000, 4),
    pressureDropBar: roundTo(pressureDrop / 100000, 6),
    headLoss: roundTo(headLoss, 4),
  };
}
