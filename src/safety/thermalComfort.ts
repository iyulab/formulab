import { roundTo } from '../utils.js';
import type { ThermalComfortInput, ThermalComfortResult } from './types.js';

/**
 * PMV/PPD Thermal Comfort — ISO 7730 / Fanger's Model
 *
 * @formula
 *   - PMV = f(M, W, Icl, ta, tr, var, pa) with iterative tcl solve
 *   - PPD = 100 − 95 × exp(−0.03353×PMV⁴ − 0.2179×PMV²)
 *
 * @reference ISO 7730:2005 — Ergonomics of the thermal environment
 * @reference ASHRAE Standard 55-2020
 * @reference pythermalcomfort reference implementation
 */
export function thermalComfort(input: ThermalComfortInput): ThermalComfortResult {
  const { airTemp, radiantTemp, airVelocity, relativeHumidity, metabolicRate, clothingInsulation } = input;

  const M = metabolicRate * 58.15;  // W/m²
  const W = 0;
  const Icl = clothingInsulation * 0.155;  // m²·K/W
  const ta = airTemp;
  const tr = radiantTemp;
  const vel = Math.max(airVelocity, 0);

  // Water vapor partial pressure (Pa)
  const pa = (relativeHumidity / 100) * satVaporPressure(ta);

  // Clothing area factor
  const fcl = clothingInsulation <= 0.5
    ? 1.0 + 0.2 * clothingInsulation
    : 1.05 + 0.1 * clothingInsulation;

  // Iterative solve for clothing surface temperature
  let tcl = (ta + tr) / 2 + 0.5; // initial guess
  for (let i = 0; i < 200; i++) {
    const hcn = 2.38 * Math.pow(Math.abs(tcl - ta), 0.25);
    const hcf = 12.1 * Math.sqrt(vel);
    const hc = Math.max(hcn, hcf);

    const tcl_new = 35.7 - 0.028 * (M - W) - Icl * (
      3.96e-8 * fcl * (Math.pow(tcl + 273, 4) - Math.pow(tr + 273, 4)) +
      fcl * hc * (tcl - ta)
    );

    if (Math.abs(tcl_new - tcl) < 1e-6) {
      tcl = tcl_new;
      break;
    }
    // damped update to prevent oscillation
    tcl = tcl + 0.5 * (tcl_new - tcl);
  }

  // Final hc
  const hcn = 2.38 * Math.pow(Math.abs(tcl - ta), 0.25);
  const hcf = 12.1 * Math.sqrt(vel);
  const hc = Math.max(hcn, hcf);

  // Heat loss components
  const hl1 = 3.05e-3 * (5733 - 6.99 * (M - W) - pa);  // skin diffusion
  const hl2 = (M - W) > 58.15 ? 0.42 * ((M - W) - 58.15) : 0;  // sweating
  const hl3 = 1.7e-5 * M * (5867 - pa);  // latent respiration
  const hl4 = 0.0014 * M * (34 - ta);    // dry respiration
  const hl5 = 3.96e-8 * fcl * (Math.pow(tcl + 273, 4) - Math.pow(tr + 273, 4));  // radiation
  const hl6 = fcl * hc * (tcl - ta);      // convection

  // PMV
  const ts = 0.303 * Math.exp(-0.036 * M) + 0.028;
  const pmv = ts * ((M - W) - hl1 - hl2 - hl3 - hl4 - hl5 - hl6);

  // PPD
  const ppd = 100 - 95 * Math.exp(-0.03353 * Math.pow(pmv, 4) - 0.2179 * Math.pow(pmv, 2));

  // Category
  const absPmv = Math.abs(pmv);
  let category: ThermalComfortResult['category'];
  if (absPmv < 0.2) category = 'A';
  else if (absPmv < 0.5) category = 'B';
  else if (absPmv < 0.7) category = 'C';
  else category = 'outside';

  // Sensation
  let sensation: ThermalComfortResult['sensation'];
  if (pmv < -2.5) sensation = 'cold';
  else if (pmv < -1.5) sensation = 'cool';
  else if (pmv < -0.5) sensation = 'slightly_cool';
  else if (pmv <= 0.5) sensation = 'neutral';
  else if (pmv <= 1.5) sensation = 'slightly_warm';
  else if (pmv <= 2.5) sensation = 'warm';
  else sensation = 'hot';

  return {
    pmv: roundTo(pmv, 2),
    ppd: roundTo(ppd, 1),
    category,
    sensation,
  };
}

/** Saturation vapor pressure (Pa) using Magnus formula */
function satVaporPressure(t: number): number {
  return 610.7 * Math.exp((17.269 * t) / (237.3 + t));
}
