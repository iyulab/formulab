import { roundTo } from '../utils.js';
import type { BoltCircleInput, BoltCircleResult, BoltHole } from './types.js';

/**
 * Calculate bolt hole circle pattern coordinates.
 *
 * @formula
 *   θᵢ = startAngle + i × (360 / n)
 *   xᵢ = r × cos(θᵢ)
 *   yᵢ = r × sin(θᵢ)
 *
 * @reference Oberg, E. et al. "Machinery's Handbook", 31st Ed.
 *
 * @param input - Bolt circle parameters
 * @returns BoltCircleResult with hole coordinates and angular spacing
 */
export function boltCircle(input: BoltCircleInput): BoltCircleResult {
  const { boltCircleDiameter, numberOfHoles, startAngle = 0 } = input;

  const radius = boltCircleDiameter / 2;
  const angularSpacing = 360 / numberOfHoles;

  const holes: BoltHole[] = [];
  for (let i = 0; i < numberOfHoles; i++) {
    const angleDeg = startAngle + i * angularSpacing;
    const angleRad = (angleDeg * Math.PI) / 180;
    holes.push({
      holeNumber: i + 1,
      angle: roundTo(angleDeg % 360, 4),
      x: roundTo(radius * Math.cos(angleRad), 4),
      y: roundTo(radius * Math.sin(angleRad), 4),
    });
  }

  return {
    radius: roundTo(radius, 4),
    holes,
    angularSpacing: roundTo(angularSpacing, 4),
  };
}
