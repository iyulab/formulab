import type { InjectionCycleInput, InjectionCycleResult, InjectionCyclePhase, ResinType } from './types.js';
import { roundTo } from '../utils.js';

/**
 * Resin properties for cooling time calculation
 * thermalDiffusivity: mm^2/s
 * meltTemp: Celsius (Tm)
 * moldTemp: Celsius (Tw)
 * ejectionTemp: Celsius (Te)
 * density: g/cm^3
 */
interface ResinProperties {
  thermalDiffusivity: number;
  meltTemp: number;
  moldTemp: number;
  ejectionTemp: number;
  density: number;
}

const RESIN_PROPERTIES: Record<Exclude<ResinType, 'custom'>, ResinProperties> = {
  abs: {
    thermalDiffusivity: 0.12,
    meltTemp: 230,
    moldTemp: 60,
    ejectionTemp: 100,
    density: 1.02,
  },
  pp: {
    thermalDiffusivity: 0.10,
    meltTemp: 220,
    moldTemp: 40,
    ejectionTemp: 80,
    density: 0.90,
  },
  pc: {
    thermalDiffusivity: 0.13,
    meltTemp: 290,
    moldTemp: 90,
    ejectionTemp: 130,
    density: 1.20,
  },
  pa: {
    thermalDiffusivity: 0.11,
    meltTemp: 260,
    moldTemp: 80,
    ejectionTemp: 120,
    density: 1.13,
  },
  pmma: {
    thermalDiffusivity: 0.11,
    meltTemp: 240,
    moldTemp: 70,
    ejectionTemp: 95,
    density: 1.18,
  },
  pet: {
    thermalDiffusivity: 0.10,
    meltTemp: 280,
    moldTemp: 70,
    ejectionTemp: 100,
    density: 1.35,
  },
  pom: {
    thermalDiffusivity: 0.13,
    meltTemp: 200,
    moldTemp: 80,
    ejectionTemp: 120,
    density: 1.41,
  },
  ps: {
    thermalDiffusivity: 0.11,
    meltTemp: 220,
    moldTemp: 45,
    ejectionTemp: 85,
    density: 1.05,
  },
};

/**
 * Calculate injection molding cycle time.
 *
 * Cooling time formula (simplified from Fourier equation):
 * tc = (h^2 / (PI^2 * alpha)) * ln((8/PI^2) * (Tm - Tw) / (Te - Tw))
 *
 * where:
 * - h = half wall thickness (mm)
 * - alpha = thermal diffusivity (mm^2/s)
 * - Tm = melt temperature
 * - Tw = mold wall temperature
 * - Te = ejection temperature
 *
 * @param input - Injection cycle input with resin type and dimensions
 * @returns Cycle time breakdown and total
 */
export function injectionCycle(input: InjectionCycleInput): InjectionCycleResult {
  const {
    resin,
    wallThickness,
    shotWeight,
    injectionRate,
    moldOpenCloseTime = 3,
    ejectionTime = 0.5,
  } = input;

  // Get resin properties
  let props: ResinProperties;
  if (resin === 'custom') {
    props = {
      thermalDiffusivity: input.thermalDiffusivity ?? 0.12,
      meltTemp: input.meltTemp ?? 230,
      moldTemp: input.moldTemp ?? 60,
      ejectionTemp: input.ejectionTemp ?? 100,
      density: input.density ?? 1.0,
    };
  } else {
    props = RESIN_PROPERTIES[resin];
  }

  // Half wall thickness
  const h = wallThickness / 2;

  // Calculate cooling time
  // tc = (h^2 / (PI^2 * alpha)) * ln((8/PI^2) * (Tm - Tw) / (Te - Tw))
  const piSquared = Math.PI * Math.PI;
  const tempRatioNumerator = props.meltTemp - props.moldTemp;
  const tempRatioDenominator = props.ejectionTemp - props.moldTemp;

  let coolingTime: number;
  if (tempRatioDenominator <= 0 || props.thermalDiffusivity <= 0) {
    coolingTime = 0;
  } else {
    const tempRatio = (8 / piSquared) * (tempRatioNumerator / tempRatioDenominator);
    if (tempRatio <= 0) {
      coolingTime = 0;
    } else {
      coolingTime = (h * h / (piSquared * props.thermalDiffusivity)) * Math.log(tempRatio);
    }
  }

  // Calculate fill time
  // Volume = shot weight / density (g / (g/cm^3) = cm^3)
  const volume = shotWeight / props.density;
  // Default injection rate: estimate based on typical machine (~50-150 cm^3/s)
  const effectiveInjectionRate = injectionRate ?? 80;
  const fillTime = volume / effectiveInjectionRate;

  // Packing time: typically 30-50% of cooling time
  const packingTime = coolingTime * 0.4;

  // Total cycle time
  const totalCycleTime = coolingTime + fillTime + packingTime + moldOpenCloseTime + ejectionTime;

  // Parts per hour
  const partsPerHour = totalCycleTime > 0 ? Math.floor(3600 / totalCycleTime) : 0;

  // Build breakdown
  const breakdown: InjectionCyclePhase[] = [];
  if (totalCycleTime > 0) {
    breakdown.push({
      phase: 'Fill',
      time: roundTo(fillTime, 2),
      percentage: roundTo((fillTime / totalCycleTime) * 100, 1),
    });
    breakdown.push({
      phase: 'Packing',
      time: roundTo(packingTime, 2),
      percentage: roundTo((packingTime / totalCycleTime) * 100, 1),
    });
    breakdown.push({
      phase: 'Cooling',
      time: roundTo(coolingTime, 2),
      percentage: roundTo((coolingTime / totalCycleTime) * 100, 1),
    });
    breakdown.push({
      phase: 'Mold Open/Close',
      time: roundTo(moldOpenCloseTime, 2),
      percentage: roundTo((moldOpenCloseTime / totalCycleTime) * 100, 1),
    });
    breakdown.push({
      phase: 'Ejection',
      time: roundTo(ejectionTime, 2),
      percentage: roundTo((ejectionTime / totalCycleTime) * 100, 1),
    });
  }

  return {
    coolingTime: roundTo(coolingTime, 2),
    fillTime: roundTo(fillTime, 2),
    packingTime: roundTo(packingTime, 2),
    moldOpenClose: roundTo(moldOpenCloseTime, 2),
    ejectionTime: roundTo(ejectionTime, 2),
    totalCycleTime: roundTo(totalCycleTime, 2),
    partsPerHour,
    breakdown,
  };
}

/**
 * Round to specified decimal places
 */
