import { roundTo } from '../utils.js';
import type { ThreadOverWiresInput, ThreadOverWiresResult } from './types.js';

/**
 * Calculate thread measurement over wires (3-wire method).
 *
 * @formula (for 60° thread angle — metric/unified):
 *   bestWire = P / √3 ≈ 0.57735 × P
 *   d₂ = d − 0.6495 × P  (pitch diameter for 60°)
 *   M = d₂ + 3W − 1.5155 × P
 *
 * General formula:
 *   bestWire = P / (2 × cos(α/2))
 *   For 55° (Whitworth): bestWire = P / (2 × cos(27.5°))
 *   For 29° (Acme): bestWire = P / (2 × cos(14.5°))
 *
 * @reference Oberg, E. et al. "Machinery's Handbook", 31st Ed. — Thread measurement.
 *
 * @param input - Thread over wires parameters
 * @returns ThreadOverWiresResult with measurement, best wire, and pitch diameter
 */
export function threadOverWires(input: ThreadOverWiresInput): ThreadOverWiresResult {
  const { majorDiameter, pitch, threadAngle = 60 } = input;

  const halfAngleRad = ((threadAngle / 2) * Math.PI) / 180;
  const cosHalfAngle = Math.cos(halfAngleRad);

  // Best wire size
  const bestWire = pitch / (2 * cosHalfAngle);
  const wireSize = input.wireSize ?? bestWire;

  // Pitch diameter
  let pitchDiameter: number;
  if (threadAngle === 60) {
    pitchDiameter = majorDiameter - 0.6495 * pitch;
  } else if (threadAngle === 55) {
    pitchDiameter = majorDiameter - 0.6403 * pitch;
  } else if (threadAngle === 29) {
    pitchDiameter = majorDiameter - 0.5 * pitch;
  } else {
    // 30° (trapezoidal)
    pitchDiameter = majorDiameter - 0.5 * pitch;
  }

  // Measurement over wires (M)
  // General: M = d₂ + W × (1 + 1/sin(α/2)) - P × cot(α/2) / 2
  // For 60°: M = d₂ + 3W - 1.5155P
  const sinHalfAngle = Math.sin(halfAngleRad);
  const M = pitchDiameter + wireSize * (1 + 1 / sinHalfAngle) - (pitch * cosHalfAngle) / (2 * sinHalfAngle);

  return {
    measurementOverWires: roundTo(M, 4),
    bestWireSize: roundTo(bestWire, 4),
    pitchDiameter: roundTo(pitchDiameter, 4),
    wireSize: roundTo(wireSize, 4),
  };
}
