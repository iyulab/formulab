import { roundTo } from '../utils.js';
import type { SolarOutputInput, SolarOutputResult } from './types.js';

// Annual-average share of global horizontal irradiance that is diffuse (temperate climates).
// Documented model assumption; the diffuse component is what keeps an away-facing array
// above zero (real north-facing yield is ~35-50% of optimal, not the 50% a hard floor gives).
const DIFFUSE_FRACTION = 0.3;
// Ground reflectance for the reflected component (grass/roof average).
const GROUND_ALBEDO = 0.2;

const DEG = Math.PI / 180;

/**
 * Relative annual plane-of-array insolation index (arbitrary units) via the isotropic-sky
 * transposition (Liu & Jordan) integrated over the year with standard solar geometry
 * (declination and hour-angle sweep; Duffie & Beckman, Solar Engineering of Thermal
 * Processes, eq. 1.6.2/1.6.5). Constant-sky simplification: DNI is constant while the sun
 * is up and GHI splits into a fixed beam/diffuse ratio — adequate for a RELATIVE
 * tilt/orientation factor, not for absolute yield (peak sun hours carry the climate).
 * (An air-mass-attenuated variant was evaluated and rejected: it shifts the flat-array
 * anchor away from published PVWatts-derived values without improving the others.)
 *
 * @param tiltDeg   panel tilt from horizontal, 0-90
 * @param azimuthDeg panel azimuth offset from equator-facing, degrees (±180)
 * @param latDeg    site latitude; the geometry uses |lat| with azimuth measured from
 *                  the equator-facing direction (south in the northern hemisphere,
 *                  north in the southern)
 */
function poaIndex(tiltDeg: number, azimuthDeg: number, latDeg: number): number {
  const phi = Math.abs(latDeg) * DEG;
  const beta = tiltDeg * DEG;
  const gamma = azimuthDeg * DEG;
  const sinPhi = Math.sin(phi), cosPhi = Math.cos(phi);
  const sinBeta = Math.sin(beta), cosBeta = Math.cos(beta);
  const cosGamma = Math.cos(gamma), sinGamma = Math.sin(gamma);
  const diffuseSky = DIFFUSE_FRACTION * (1 + cosBeta) / 2;
  const groundRefl = GROUND_ALBEDO * (1 - cosBeta) / 2;

  let sum = 0;
  for (let day = 2; day < 365; day += 5) {
    const delta = 23.45 * DEG * Math.sin((2 * Math.PI * (284 + day)) / 365);
    const sinDelta = Math.sin(delta), cosDelta = Math.cos(delta);
    // hour angle sweep, 15-minute steps
    for (let omegaDeg = -180; omegaDeg < 180; omegaDeg += 3.75) {
      const omega = omegaDeg * DEG;
      const cosZ = sinPhi * sinDelta + cosPhi * cosDelta * Math.cos(omega);
      if (cosZ <= 0) continue; // sun below horizon

      // Angle of incidence on the tilted plane (Duffie & Beckman eq. 1.6.2)
      const cosTheta =
        sinDelta * sinPhi * cosBeta
        - sinDelta * cosPhi * sinBeta * cosGamma
        + cosDelta * cosPhi * cosBeta * Math.cos(omega)
        + cosDelta * sinPhi * sinBeta * cosGamma * Math.cos(omega)
        + cosDelta * sinBeta * sinGamma * Math.sin(omega);

      // GHI ∝ cosZ with a fixed beam/diffuse split; DNI ∝ (1 - Fd)
      const beam = (1 - DIFFUSE_FRACTION) * Math.max(0, cosTheta);
      sum += beam + (diffuseSky + groundRefl) * cosZ;
    }
  }
  return sum;
}

/**
 * Annual tilt/orientation efficiency relative to the best equator-facing tilt at this
 * latitude (the normalizer scans tilt 0-90° at azimuth 0, so the ratio is ≤ 1 by
 * construction — no clamping involved).
 */
function tiltOrientationEfficiency(tiltDeg: number, azimuthDeg: number, latDeg: number): number {
  let best = 0;
  for (let t = 0; t <= 90; t += 1) {
    const v = poaIndex(t, 0, latDeg);
    if (v > best) best = v;
  }
  return best > 0 ? poaIndex(tiltDeg, azimuthDeg, latDeg) / best : 0;
}

/**
 * Solar Panel Output Calculator (PVWatts-style estimation)
 *
 * Estimates daily/monthly/annual energy production from a photovoltaic system. Peak sun
 * hours carry the site's climate; the tilt/orientation factor is computed physically via
 * the isotropic-sky transposition (Liu & Jordan) integrated over the year, normalized to
 * the best equator-facing tilt.
 *
 * Reference: NREL PVWatts methodology (concept); Liu & Jordan (1963) isotropic sky;
 * Duffie & Beckman, Solar Engineering of Thermal Processes (solar geometry).
 *
 * Replaces the former cos-approximation with a 0.5 floor, which pinned any away-facing
 * array at exactly 50% of optimal regardless of tilt. Under this model a north-facing 30°
 * array at latitude 37 lands near 0.61 and a steep (60°) north array near 0.38 —
 * consistent with fixed-orientation literature (Lave & Kleissl 2011: north at latitude
 * tilt ≈ 0.6-0.7 across CONUS) and PVWatts-derived tables for E/W (≈ 0.75-0.85, here
 * 0.85) and flat (≈ 0.88, here 0.88). Tilt now matters for away-facing arrays instead of
 * every one reporting exactly 50%.
 *
 * @throws {RangeError} panelWattage/panelCount/peakSunHours ≤ 0
 * @throws {RangeError} systemEfficiency outside (0, 1]
 * @throws {RangeError} tiltAngle outside [0, 90], or |latitude| > 90
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
  if (tiltAngle < 0 || tiltAngle > 90) throw new RangeError('tiltAngle must be between 0 and 90 degrees');
  if (latitude < -90 || latitude > 90) throw new RangeError('latitude must be between -90 and 90 degrees');

  // System size in kW
  const systemSizeKw = (panelWattage * panelCount) / 1000;

  const tiltEfficiency = tiltOrientationEfficiency(tiltAngle, azimuthOffset, latitude);

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
