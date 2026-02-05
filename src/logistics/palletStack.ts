import type { PalletStackInput, PalletStackResult, BoxOrientation } from './types.js';

/**
 * Generate floor placement orientations for a box
 * Height dimension stays vertical (boxes must remain upright for stability)
 * Only floor rotation (yaw) is allowed - swap L and W
 */
function getFloorOrientations(l: number, w: number, h: number, allowRotation: boolean): BoxOrientation[] {
  if (!allowRotation) {
    return [{ length: l, width: w, height: h }];
  }

  // For pallet stacking, boxes must stay upright (height stays fixed)
  // Only allow 90-degree rotation on the floor plane
  return [
    { length: l, width: w, height: h },
    { length: w, width: l, height: h },
  ];
}

/**
 * Calculate optimal pallet stacking configuration
 *
 * Determines how many boxes can be stacked on a pallet,
 * considering box dimensions, pallet dimensions, and maximum stack height.
 *
 * @param input - Pallet dimensions, box dimensions, and constraints
 * @returns Stacking configuration
 */
export function palletStack(input: PalletStackInput): PalletStackResult {
  const { pallet, box, maxHeight, allowRotation } = input;

  // Get all possible orientations
  const orientations = getFloorOrientations(box.length, box.width, box.height, allowRotation);

  let bestResult: PalletStackResult = {
    boxesPerLayer: 0,
    layers: 0,
    totalBoxes: 0,
    bestOrientation: { length: box.length, width: box.width, height: box.height },
  };

  // Try each orientation and find the best fit
  for (const orient of orientations) {
    // Check if box fits on pallet (floor dimensions)
    if (orient.length > pallet.length || orient.width > pallet.width) {
      continue;
    }

    // Check if at least one layer fits in height
    if (orient.height > maxHeight) {
      continue;
    }

    // Calculate how many boxes fit per layer
    const cols = Math.floor(pallet.length / orient.length);
    const rows = Math.floor(pallet.width / orient.width);
    const boxesPerLayer = cols * rows;

    // Calculate number of layers
    const layers = Math.floor(maxHeight / orient.height);

    const totalBoxes = boxesPerLayer * layers;

    // Keep the orientation that fits the most boxes
    if (totalBoxes > bestResult.totalBoxes) {
      bestResult = {
        boxesPerLayer,
        layers,
        totalBoxes,
        bestOrientation: orient,
      };
    }
  }

  return bestResult;
}
