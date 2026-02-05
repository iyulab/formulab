import type { ContainerFitInput, ContainerFitResult, BoxOrientation } from './types.js';

/**
 * Generate all possible orientations for a box
 * If allowRotation is false, only return the original orientation
 */
function getOrientations(l: number, w: number, h: number, allowRotation: boolean): BoxOrientation[] {
  if (!allowRotation) {
    return [{ length: l, width: w, height: h }];
  }

  // Generate all 6 orientations (permutations of l, w, h)
  const dims = [l, w, h];
  const orientations: BoxOrientation[] = [];

  // All permutations of [l, w, h]
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (i === j) continue;
      for (let k = 0; k < 3; k++) {
        if (k === i || k === j) continue;
        orientations.push({
          length: dims[i],
          width: dims[j],
          height: dims[k],
        });
      }
    }
  }

  return orientations;
}

/**
 * Calculate how many boxes fit in a container
 *
 * This function calculates the optimal number of boxes that can fit
 * in a container, considering different orientations if rotation is allowed.
 *
 * @param input - Container and cargo dimensions
 * @returns Number of units that fit
 */
export function containerFit(input: ContainerFitInput): ContainerFitResult {
  const { container, cargo, allowRotation } = input;

  // Get all possible orientations
  const orientations = getOrientations(cargo.length, cargo.width, cargo.height, allowRotation);

  let bestResult: ContainerFitResult = {
    unitsPerLayer: 0,
    layers: 0,
    totalUnits: 0,
    bestOrientation: { length: cargo.length, width: cargo.width, height: cargo.height },
  };

  // Try each orientation and find the best fit
  for (const orient of orientations) {
    // Check if box fits at all
    if (orient.length > container.length || orient.width > container.width || orient.height > container.height) {
      continue;
    }

    // Calculate how many boxes fit in each dimension
    const cols = Math.floor(container.length / orient.length);
    const rows = Math.floor(container.width / orient.width);
    const layers = Math.floor(container.height / orient.height);

    const unitsPerLayer = cols * rows;
    const totalUnits = unitsPerLayer * layers;

    // Keep the orientation that fits the most boxes
    if (totalUnits > bestResult.totalUnits) {
      bestResult = {
        unitsPerLayer,
        layers,
        totalUnits,
        bestOrientation: orient,
      };
    }
  }

  return bestResult;
}
