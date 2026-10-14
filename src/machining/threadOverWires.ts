import { roundTo, requireFinite } from '../utils.js';
import type { ThreadAngle, ThreadOverWiresInput, ThreadOverWiresResult } from './types.js';

/** d₂ = d − k·P: the pitch-diameter factor k for each supported thread form. */
const PITCH_DIAMETER_FACTOR: Readonly<Record<ThreadAngle, number>> = {
  60: 0.6495, // metric / unified
  55: 0.6403, // Whitworth
  29: 0.5, // Acme
  30: 0.5, // trapezoidal (ISO)
};

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
 * @reference Oberg, E. et al. "Machinery's Handbook", 31st Ed. — Thread measurement; ASME
 *   B1.2 — Gages and Gaging for Unified Inch Screw Threads (formalizes the 3-wire method this
 *   implements). The pitch-diameter-relative form used here (M = E + 3W − P·cot(α/2)/2) is
 *   algebraically identical to the more commonly quoted major-diameter-relative form for 60°
 *   threads (M = D − 1.5155P + 3W): substituting E = D − 0.6495P into the latter reduces to the
 *   former, since 0.6495 + 0.866025 ≈ 1.5155.
 *
 * @param input - Thread over wires parameters
 * @returns ThreadOverWiresResult with measurement, best wire, and pitch diameter
 * @throws {RangeError} majorDiameter, pitch or a given wireSize not a positive finite number; a
 *   threadAngle other than 60, 55, 29 or 30; a pitch so coarse for the diameter that the pitch
 *   diameter would not be positive (60°: P ≥ d / 0.6495 — no such thread exists).
 */
export function threadOverWires(input: ThreadOverWiresInput): ThreadOverWiresResult {
  requireFinite('threadOverWires', input);
  const { majorDiameter, pitch, threadAngle = 60 } = input;

  if (!Number.isFinite(majorDiameter) || majorDiameter <= 0) {
    throw new RangeError('majorDiameter must be a positive finite number');
  }
  if (!Number.isFinite(pitch) || pitch <= 0) {
    throw new RangeError('pitch must be a positive finite number');
  }
  if (input.wireSize !== undefined && (!Number.isFinite(input.wireSize) || input.wireSize <= 0)) {
    throw new RangeError('wireSize must be a positive finite number');
  }
  const depthFactor = PITCH_DIAMETER_FACTOR[threadAngle];
  if (depthFactor === undefined) {
    throw new RangeError(`threadAngle must be 60, 55, 29 or 30 (got ${threadAngle})`);
  }

  const halfAngleRad = ((threadAngle / 2) * Math.PI) / 180;
  const cosHalfAngle = Math.cos(halfAngleRad);

  // Best wire size
  const bestWire = pitch / (2 * cosHalfAngle);
  const wireSize = input.wireSize ?? bestWire;

  // Pitch diameter
  const pitchDiameter = majorDiameter - depthFactor * pitch;
  // Judged on the value the result reports (4 decimals): at P = d/k the subtraction leaves a
  // floating-point residue (6.495 − 0.6495 × 10 = 8.9e-16) that would pass as a positive diameter.
  if (roundTo(pitchDiameter, 4) <= 0) {
    throw new RangeError(
      `pitch ${pitch} is too coarse for majorDiameter ${majorDiameter}: the pitch diameter would be ${roundTo(pitchDiameter, 4)} (pitch must be below ${roundTo(majorDiameter / depthFactor, 4)})`,
    );
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
