import { roundTo } from '../utils.js';
import type { HeatTransferInput, HeatTransferResult } from './types.js';

/**
 * Stefan-Boltzmann constant (W/(m²·K⁴))
 */
const STEFAN_BOLTZMANN = 5.670374419e-8;

/**
 * Heat Transfer Calculator
 *
 * Supports three modes of heat transfer:
 * - **Conduction** (Fourier's Law): Q = k × A × ΔT / L
 * - **Convection** (Newton's Law of Cooling): Q = h × A × ΔT
 * - **Radiation** (Stefan-Boltzmann Law): Q = ε × σ × A × (T_hot⁴ - T_cold⁴)
 *
 * All temperatures in °C internally converted to K for radiation.
 *
 * @throws {RangeError} Thermal conductivity must be positive
 * @throws {RangeError} Area must be positive
 * @throws {RangeError} Thickness must be positive
 * @throws {RangeError} Convection coefficient must be positive
 * @throws {RangeError} Emissivity must be between 0 and 1
 * @throws {RangeError} Absolute temperature must be positive
 * @param input - discriminated union by `mode`
 * @returns heat transfer rate and related quantities
 */
export function heatTransfer(input: HeatTransferInput): HeatTransferResult {
  let heatRate: number;
  let area: number;
  let tempDifference: number;
  let thermalResistance: number;

  switch (input.mode) {
    case 'conduction': {
      const { conductivity, thickness, tempHot, tempCold } = input;
      area = input.area;
      if (conductivity <= 0) throw new RangeError('Thermal conductivity must be positive');
      if (area <= 0) throw new RangeError('Area must be positive');
      if (thickness <= 0) throw new RangeError('Thickness must be positive');
      tempDifference = tempHot - tempCold;
      // Fourier's Law: Q = k × A × ΔT / L
      heatRate = (conductivity * area * tempDifference) / thickness;
      // Thermal resistance: R = L / (k × A)
      thermalResistance = thickness / (conductivity * area);
      break;
    }
    case 'convection': {
      const { coefficient, tempSurface, tempFluid } = input;
      area = input.area;
      if (coefficient <= 0) throw new RangeError('Convection coefficient must be positive');
      if (area <= 0) throw new RangeError('Area must be positive');
      tempDifference = tempSurface - tempFluid;
      // Newton's Law of Cooling: Q = h × A × ΔT
      heatRate = coefficient * area * tempDifference;
      // Thermal resistance: R = 1 / (h × A)
      thermalResistance = 1 / (coefficient * area);
      break;
    }
    case 'radiation': {
      const { emissivity, tempHot, tempCold } = input;
      area = input.area;
      if (emissivity <= 0 || emissivity > 1) throw new RangeError('Emissivity must be between 0 and 1');
      if (area <= 0) throw new RangeError('Area must be positive');
      tempDifference = tempHot - tempCold;
      // Convert to Kelvin for Stefan-Boltzmann
      const tHotK = tempHot + 273.15;
      const tColdK = tempCold + 273.15;
      if (tHotK <= 0 || tColdK <= 0) throw new RangeError('Absolute temperature must be positive');
      // Stefan-Boltzmann Law: Q = ε × σ × A × (T_h⁴ - T_c⁴)
      heatRate = emissivity * STEFAN_BOLTZMANN * area * (Math.pow(tHotK, 4) - Math.pow(tColdK, 4));
      // Linearized thermal resistance (approximate): R ≈ 1 / (h_rad × A)
      // where h_rad = ε × σ × (T_h² + T_c²) × (T_h + T_c)
      const hRad = emissivity * STEFAN_BOLTZMANN * (tHotK * tHotK + tColdK * tColdK) * (tHotK + tColdK);
      thermalResistance = 1 / (hRad * area);
      break;
    }
  }

  const heatFluxDensity = area > 0 ? heatRate / area : 0;

  return {
    heatRate: roundTo(heatRate, 4),
    heatFluxDensity: roundTo(heatFluxDensity, 4),
    tempDifference: roundTo(tempDifference, 2),
    thermalResistance: roundTo(thermalResistance, 6),
  };
}
