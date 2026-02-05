import type { BatchInput, BatchResult } from './types.js';

/**
 * Calculate batch scaling for recipe ingredients.
 *
 * Scales all ingredients proportionally based on the ratio between
 * target batch size and original batch size.
 *
 * @param input - Batch scaling input with original size, target size, and ingredients
 * @returns Batch result with scale factor and scaled ingredients
 */
export function batch(input: BatchInput): BatchResult {
  const { originalBatchSize, targetBatchSize, ingredients } = input;

  // Handle edge case: original batch size is 0
  if (originalBatchSize === 0) {
    return {
      scaleFactor: 0,
      scaledIngredients: ingredients.map((ing) => ({
        name: ing.name,
        originalAmount: ing.amount,
        scaledAmount: 0,
        unit: ing.unit,
      })),
    };
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
