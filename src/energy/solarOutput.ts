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
 * The tilt/azimuth correction factors are floored at 0.5 (model bound). When an input hits
 * that floor — north-facing roofs do — `tiltEfficiencyFloored` is set and the produced
 * figures are an optimistic upper bound, not an estimate (real north-facing yield can be
 * 30-40% of south-facing, below the floored 50%).
 *
 * @throws {RangeError} Panel wattage must be positive
 * @throws {RangeError} Panel count must be positive
 * @throws {RangeError} Peak sun hours must be positive
 * @throws {RangeError} System efficiency must be between 0 and 1
 * @param input - panel specs, sun hours, orientation
 * @returns energy production estimates
 */
export function solarOutput(input: SolarOutputInput): SolarOutputResult {
  const {
    panelWattage, panelCount, peakSunHours,
    systemEfficiency, tiltAngle, latitude, azimuthOffset,
  } = input;

  if (panelWattage <= 0) throw new RangeError('Panel wattage must be positive');
  if (panelCount <= 0) throw new RangeError('Panel count must be positive');
  if (peakSunHours <= 0) throw new RangeError('Peak sun hours must be positive');
  if (systemEfficiency <= 0 || systemEfficiency > 1) throw new RangeError('System efficiency must be between 0 and 1');

  // System size in kW
  const systemSizeKw = (panelWattage * panelCount) / 1000;

  // Tilt efficiency factor
  // Optimal tilt ≈ latitude (simplified PVWatts model)
  // Deviation from optimal reduces output by ~cos(deviation)
  const optimalTilt = Math.abs(latitude);
  const tiltDeviation = Math.abs(tiltAngle - optimalTilt);
  // For every degree off optimal, roughly 0.5% loss (simplified)
  // But cap at cos-based model
  // Both factors are floored at 0.5 — a model bound, not a physical result. North-facing or
  // steeply misaligned arrays hit it (azimuthOffset 180° gives cos ≈ -0.31 → floored to 0.5),
  // making the output an optimistic bound rather than an estimate, so disclose the floor.
  const tiltDeviationRad = (tiltDeviation * Math.PI) / 180;
  const rawTiltFactor = Math.cos(tiltDeviationRad * 0.5);
  const tiltFactor = Math.max(0.5, rawTiltFactor);

  // Azimuth efficiency (0° = due south in northern hemisphere)
  // Every degree off south reduces by ~cos(azimuth) for large offsets
  const azimuthRad = (Math.abs(azimuthOffset) * Math.PI) / 180;
  const rawAzimuthFactor = Math.cos(azimuthRad * 0.6);
  const azimuthFactor = Math.max(0.5, rawAzimuthFactor);

  const tiltEfficiency = tiltFactor * azimuthFactor;
  const tiltEfficiencyFloored = rawTiltFactor < 0.5 || rawAzimuthFactor < 0.5;

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
    tiltEfficiencyFloored,
  };
}
