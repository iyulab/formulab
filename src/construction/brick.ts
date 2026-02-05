import type { BrickInput, BrickResult, BrickSize, BrickDimensions } from './types.js';
import { roundTo } from '../utils.js';

/**
 * Standard brick sizes in mm
 */
export const BRICK_SIZES: Record<Exclude<BrickSize, 'custom'>, BrickDimensions> = {
  modular: { length: 194, height: 57 },    // 7.625" x 2.25"
  standard: { length: 203, height: 57 },   // 8" x 2.25"
  queen: { length: 203, height: 70 },      // 8" x 2.75"
  king: { length: 244, height: 70 },       // 9.625" x 2.75"
};

/**
 * Calculate brick quantity for a wall
 *
 * Formulas:
 * - Bricks per m² = 1,000,000 / ((brick length + mortar) × (brick height + mortar))
 * - Total bricks = wall area × bricks per m² × (1 + waste factor)
 *
 * @param input - Brick input parameters
 * @returns Brick calculation results
 */
export function brick(input: BrickInput): BrickResult {
  const { wallArea, brickSize, customLength, customHeight, mortarThickness, wasteFactor } = input;

  // Get brick dimensions
  let length: number;
  let height: number;

  if (brickSize === 'custom') {
    length = customLength ?? 200;
    height = customHeight ?? 60;
  } else {
    const dims = BRICK_SIZES[brickSize as Exclude<BrickSize, 'custom'>];
    length = dims.length;
    height = dims.height;
  }

  // Bricks per m² = 1,000,000 / ((brick length + mortar) × (brick height + mortar))
  const brickWithMortarLength = length + mortarThickness;
  const brickWithMortarHeight = height + mortarThickness;
  const bricksPerSqMeter = 1000000 / (brickWithMortarLength * brickWithMortarHeight);

  // Total bricks without waste
  const bricksWithoutWaste = wallArea * bricksPerSqMeter;

  // Total bricks with waste factor
  const wasteMultiplier = 1 + (wasteFactor / 100);
  const totalBricks = bricksWithoutWaste * wasteMultiplier;

  // Wasted bricks
  const wastedBricks = totalBricks - bricksWithoutWaste;

  return {
    bricksPerSqMeter: roundTo(bricksPerSqMeter, 1),
    totalBricks: Math.ceil(totalBricks),
    bricksWithoutWaste: Math.ceil(bricksWithoutWaste),
    wastedBricks: Math.ceil(wastedBricks),
  };
}
