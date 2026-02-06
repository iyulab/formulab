import { roundTo } from '../utils.js';
import type { SolarOutputInput, SolarOutputResult } from './types.js';

/**
 * Solar Panel Output Calculator (PVWatts-based estimation)
 *
 * Estimates daily/monthly/annual energy production from a photovoltaic system.
 * Uses simplified NREL PVWatts methodology with tilt and azimuth corrections.
 *
 * Reference: NREL PVWatts Calculator methodology
 *
 * @param input - panel specs, sun hours, orientation
 * @returns energy production estimates
 */
export function solarOutput(input: SolarOutputInput): SolarOutputResult {
  const {
    panelWattage, panelCount, peakSunHours,
    systemEfficiency, tiltAngle, latitude, azimuthOffset,
  } = input;

  if (panelWattage <= 0) throw new Error('Panel wattage must be positive');
  if (panelCount <= 0) throw new Error('Panel count must be positive');
  if (peakSunHours <= 0) throw new Error('Peak sun hours must be positive');
  if (systemEfficiency <= 0 || systemEfficiency > 1) throw new Error('System efficiency must be between 0 and 1');

  // System size in kW
  const systemSizeKw = (panelWattage * panelCount) / 1000;

  // Tilt efficiency factor
  // Optimal tilt ≈ latitude (simplified PVWatts model)
  // Deviation from optimal reduces output by ~cos(deviation)
  const optimalTilt = Math.abs(latitude);
  const tiltDeviation = Math.abs(tiltAngle - optimalTilt);
  // For every degree off optimal, roughly 0.5% loss (simplified)
  // But cap at cos-based model
  const tiltDeviationRad = (tiltDeviation * Math.PI) / 180;
  const tiltFactor = Math.max(0.5, Math.cos(tiltDeviationRad * 0.5));

  // Azimuth efficiency (0° = due south in northern hemisphere)
  // Every degree off south reduces by ~cos(azimuth) for large offsets
  const azimuthRad = (Math.abs(azimuthOffset) * Math.PI) / 180;
  const azimuthFactor = Math.max(0.5, Math.cos(azimuthRad * 0.6));

  const tiltEfficiency = tiltFactor * azimuthFactor;

  // Daily output = system size (kW) × PSH × system efficiency × tilt efficiency
  const dailyOutputKwh = systemSizeKw * peakSunHours * systemEfficiency * tiltEfficiency;
  const monthlyOutputKwh = dailyOutputKwh * 30;
  const annualOutputKwh = dailyOutputKwh * 365;

  // Capacity factor = actual output / theoretical max (24h at rated power)
  const capacityFactor = dailyOutputKwh / (systemSizeKw * 24);

  return {
    systemSizeKw: roundTo(systemSizeKw, 2),
    dailyOutputKwh: roundTo(dailyOutputKwh, 2),
    monthlyOutputKwh: roundTo(monthlyOutputKwh, 1),
    annualOutputKwh: roundTo(annualOutputKwh, 0),
    capacityFactor: roundTo(capacityFactor, 4),
    tiltEfficiency: roundTo(tiltEfficiency, 4),
  };
}
