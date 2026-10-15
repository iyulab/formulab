import type { BatchInput, BatchResult } from './types.js';
import { requireFinite } from '../utils.js';
import { InputRangeError } from '../errors.js';

/**
 * Calculate batch scaling for recipe ingredients.
 *
 * Scales all ingredients proportionally based on the ratio between
 * target batch size and original batch size.
 *
 * @param input - Batch scaling input with original size, target size, and ingredients
 * @returns Batch result with scale factor and scaled ingredients
 * @throws {RangeError} originalBatchSize not a positive finite number (nothing to scale from), or
 *   targetBatchSize negative or non-finite, or an ingredient amount is negative.
 */
export function batch(input: BatchInput): BatchResult {
  requireFinite('batch', input);
  const { originalBatchSize, targetBatchSize, ingredients } = input;

  if (!Number.isFinite(originalBatchSize) || originalBatchSize <= 0) {
    throw new InputRangeError('originalBatchSize must be a positive finite number', {
      code: 'parameter_out_of_range', parameter: 'originalBatchSize', exclusive_min: 0, got: originalBatchSize,
    });
  }
  if (!Number.isFinite(targetBatchSize) || targetBatchSize < 0) {
    throw new InputRangeError('targetBatchSize must be a non-negative finite number', {
      code: 'parameter_out_of_range', parameter: 'targetBatchSize', min: 0, got: targetBatchSize,
    });
  }
  // A negative amount scales to a negative quantity to weigh out.
  for (const ing of ingredients) {
    if (!(ing.amount >= 0)) {
      throw new RangeError(`ingredient "${ing.name}" amount must not be negative`);
    }
  }

  const scaleFactor = targetBatchSize / originalBatchSize;

  const scaledIngredients = ingredients.map((ing) => ({
    name: ing.name,
    originalAmount: ing.amount,
    scaledAmount: ing.amount * scaleFactor,
    unit: ing.unit,
  }));

  return {
    scaleFactor,
    scaledIngredients,
  };
}
