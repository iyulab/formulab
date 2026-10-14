import type { InjectionCycleInput, InjectionCycleResult, InjectionCyclePhase, ResinType } from './types.js';
import { roundTo, requireFinite } from '../utils.js';

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
 * Cooling time formula (one-dimensional plate, mean temperature reaching the ejection temperature):
 * tc = (s^2 / (PI^2 * alpha)) * ln((8/PI^2) * (Tm - Tw) / (Te - Tw))
 *
 * where:
 * - s = wall thickness (mm), the full thickness between the two mold walls
 *   (the first term of the plate series decays as exp(-PI^2 * alpha * t / s^2))
 * - alpha = thermal diffusivity (mm^2/s)
 * - Tm = melt temperature
 * - Tw = mold wall temperature
 * - Te = ejection temperature
 *
 * @param input - Injection cycle input with resin type and dimensions
 * @returns Cycle time breakdown and total
 * @throws RangeError if wallThickness or shotWeight is not greater than 0, moldOpenCloseTime or
 *   ejectionTime is negative, the resin density is
 *   not greater than 0, or injectionRate is given and not greater than 0
 */
export function injectionCycle(input: InjectionCycleInput): InjectionCycleResult {
  requireFinite('injectionCycle', input);
  const {
    resin,
    wallThickness,
    shotWeight,
    injectionRate,
    moldOpenCloseTime = 3,
    ejectionTime = 0.5,
  } = input;

  // Cooling time goes with the square of the thickness, which would hide a negative one; a part
  // with no wall has nothing to cool.
  if (!(wallThickness > 0)) {
    throw new RangeError('wallThickness must be greater than 0');
  }
  // A shot with no material fills nothing — a cycle rate for it is a rate for no parts. A negative
  // weight or phase time subtracts from the cycle it is meant to add to.
  if (!(shotWeight > 0)) {
    throw new RangeError('shotWeight must be greater than 0');
  }
  if (!(moldOpenCloseTime >= 0)) {
    throw new RangeError('moldOpenCloseTime must not be negative');
  }
  if (!(ejectionTime >= 0)) {
    throw new RangeError('ejectionTime must not be negative');
  }

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

  // Volume = shot weight / density (g / (g/cm^3) = cm^3); fill time then divides by the rate.
  if (!(props.density > 0)) {
    throw new RangeError('density must be greater than 0');
  }
  if (injectionRate !== undefined && !(injectionRate > 0)) {
    throw new RangeError('injectionRate must be greater than 0');
  }

  // Calculate cooling time
  // tc = (s^2 / (PI^2 * alpha)) * ln((8/PI^2) * (Tm - Tw) / (Te - Tw)), s = full wall thickness
  const s = wallThickness;
  const piSquared = Math.PI * Math.PI;
  const tempRatioNumerator = props.meltTemp - props.moldTemp;
  const tempRatioDenominator = props.ejectionTemp - props.moldTemp;

  if (!(props.thermalDiffusivity > 0)) {
    throw new RangeError('thermalDiffusivity must be greater than 0');
  }
  if (!(tempRatioDenominator > 0)) {
    throw new RangeError('ejectionTemp must be higher than moldTemp');
  }
  // The cooling-time model is the first term of the slab conduction series; it is positive only when
  // (8/π²)·(Tm − Tw)/(Te − Tw) > 1. A melt temperature at or barely above the ejection temperature
  // falls outside it and gave a negative cooling time.
  const tempRatio = (8 / piSquared) * (tempRatioNumerator / tempRatioDenominator);
  if (!(tempRatio > 1)) {
    throw new RangeError('meltTemp is too close to ejectionTemp for the cooling-time model ((8/π²)·(Tm − Tw)/(Te − Tw) must exceed 1)');
  }
  const coolingTime = (s * s / (piSquared * props.thermalDiffusivity)) * Math.log(tempRatio);

  // Calculate fill time
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
