import type { PalletStackInput, PalletStackResult, BoxOrientation } from './types.js';
import { requireFinite, roundTo } from '../utils.js';
import { inputRangeError } from '../errors.js';
import { cargoOrientations, requirePositiveDimensions } from './containerFit.js';

/**
 * Calculate optimal pallet stacking configuration
 *
 * Determines how many boxes can be stacked on a pallet — by the deck and the maximum stack height, then by
 * the weight the pallet load may have. Boxes stay upright: `layered` turns them on the floor, `fixed` keeps
 * them as given.
 *
 * @formula boxesPerLayer = ⌊L/l⌋·⌊W/w⌋; layers = ⌊maxHeight/h⌋; totalBoxes = min(boxesPerLayer·layers, ⌊maxWeight/boxWeight⌋)
 * @units mm, kg, %
 * @param input - Pallet dimensions, box dimensions, and constraints
 * @returns Stacking configuration, what limited it, the loaded stack's height and weight
 * @throws RangeError if any box dimension, the pallet length or width, or maxHeight is not greater than 0
 *   (`parameter_out_of_range`, `parameter` `box.length` … `pallet.width`, `maxHeight`), or `boxWeight` /
 *   `maxWeight` is below 0 (`parameter_out_of_range`)
 */
export function palletStack(input: PalletStackInput): PalletStackResult {
  requireFinite('palletStack', input);
  const { pallet, box, maxHeight, rotation, boxWeight = 0, maxWeight } = input;

  // Each pallet dimension and the stack height are divided by a box dimension.
  requirePositiveDimensions('box', box, ['length', 'width', 'height'], 'box length, width and height must be greater than 0');
  // A pallet with no deck or no stack height holds nothing — 0 boxes is not a stacking result.
  requirePositiveDimensions('pallet', pallet, ['length', 'width'], 'pallet length and width must be greater than 0');
  if (!(maxHeight > 0)) {
    throw inputRangeError('maxHeight must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'maxHeight', exclusive_min: 0, got: maxHeight,
    });
  }
  if (boxWeight < 0) {
    throw inputRangeError('boxWeight must be 0 or more', { code: 'parameter_out_of_range', parameter: 'boxWeight', min: 0, got: boxWeight });
  }
  if (maxWeight !== undefined && maxWeight < 0) {
    throw inputRangeError('maxWeight must be 0 or more', { code: 'parameter_out_of_range', parameter: 'maxWeight', min: 0, got: maxWeight });
  }

  // A weightless box meets any weight limit.
  const boxesByWeight = maxWeight !== undefined && boxWeight > 0 ? Math.floor(maxWeight / boxWeight) : Infinity;

  let best: { orient: BoxOrientation; boxesPerLayer: number; layers: number; stacked: number; totalBoxes: number } | null = null;

  for (const orient of cargoOrientations(box.length, box.width, box.height, rotation)) {
    if (orient.length > pallet.length || orient.width > pallet.width || orient.height > maxHeight) continue;

    const boxesPerLayer = Math.floor(pallet.length / orient.length) * Math.floor(pallet.width / orient.width);
    const layers = Math.floor(maxHeight / orient.height);
    const stacked = boxesPerLayer * layers;
    const totalBoxes = Math.min(stacked, boxesByWeight);

    // Most boxes; when a weight limit makes orientations tie, the one with more room (a shorter stack).
    if (best === null || totalBoxes > best.totalBoxes || (totalBoxes === best.totalBoxes && stacked > best.stacked)) {
      best = { orient, boxesPerLayer, layers, stacked, totalBoxes };
    }
  }

  if (best === null) {
    return {
      boxesPerLayer: 0, layers: 0, totalBoxes: 0,
      bestOrientation: { length: box.length, width: box.width, height: box.height },
      stackHeight: 0, totalWeight: 0, limitedBy: 'space', volumeUtilization: 0,
    };
  }

  const { orient, boxesPerLayer, layers, stacked, totalBoxes } = best;
  // The loaded stack: full layers, and a part layer when the weight limit stops mid-layer.
  const loadedLayers = boxesPerLayer > 0 ? Math.ceil(totalBoxes / boxesPerLayer) : 0;

  return {
    boxesPerLayer,
    layers,
    totalBoxes,
    bestOrientation: orient,
    stackHeight: loadedLayers * orient.height,
    totalWeight: roundTo(totalBoxes * boxWeight, 3),
    limitedBy: totalBoxes < stacked ? 'weight' : 'space',
    volumeUtilization: roundTo((totalBoxes * orient.length * orient.width * orient.height / (pallet.length * pallet.width * maxHeight)) * 100, 2),
  };
}
