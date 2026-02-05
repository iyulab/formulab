import { describe, it, expect } from 'vitest';
import { batch } from './batch.js';

describe('batch', () => {
  describe('scaling up', () => {
    it('should scale ingredients correctly when doubling batch', () => {
      const result = batch({
        originalBatchSize: 100,
        targetBatchSize: 200,
        ingredients: [
          { name: 'Flour', amount: 500, unit: 'g' },
          { name: 'Sugar', amount: 200, unit: 'g' },
          { name: 'Butter', amount: 100, unit: 'g' },
        ],
      });

      expect(result.scaleFactor).toBe(2);
      expect(result.scaledIngredients).toHaveLength(3);
      expect(result.scaledIngredients[0].scaledAmount).toBe(1000);
      expect(result.scaledIngredients[1].scaledAmount).toBe(400);
      expect(result.scaledIngredients[2].scaledAmount).toBe(200);
    });

    it('should preserve original amounts', () => {
      const result = batch({
        originalBatchSize: 100,
        targetBatchSize: 200,
        ingredients: [
          { name: 'Flour', amount: 500, unit: 'g' },
        ],
      });

      expect(result.scaledIngredients[0].originalAmount).toBe(500);
      expect(result.scaledIngredients[0].scaledAmount).toBe(1000);
    });

    it('should preserve ingredient names and units', () => {
      const result = batch({
        originalBatchSize: 10,
        targetBatchSize: 50,
        ingredients: [
          { name: 'Water', amount: 1, unit: 'L' },
        ],
      });

      expect(result.scaledIngredients[0].name).toBe('Water');
      expect(result.scaledIngredients[0].unit).toBe('L');
    });
  });

  describe('scaling down', () => {
    it('should scale ingredients correctly when halving batch', () => {
      const result = batch({
        originalBatchSize: 100,
        targetBatchSize: 50,
        ingredients: [
          { name: 'Flour', amount: 500, unit: 'g' },
          { name: 'Water', amount: 300, unit: 'mL' },
        ],
      });

      expect(result.scaleFactor).toBe(0.5);
      expect(result.scaledIngredients[0].scaledAmount).toBe(250);
      expect(result.scaledIngredients[1].scaledAmount).toBe(150);
    });
  });

  describe('fractional scaling', () => {
    it('should handle non-integer scale factors', () => {
      const result = batch({
        originalBatchSize: 12,
        targetBatchSize: 8,
        ingredients: [
          { name: 'Eggs', amount: 6, unit: 'pcs' },
        ],
      });

      expect(result.scaleFactor).toBeCloseTo(0.6667, 3);
      expect(result.scaledIngredients[0].scaledAmount).toBe(4);
    });

    it('should handle scaling by 1.5x', () => {
      const result = batch({
        originalBatchSize: 100,
        targetBatchSize: 150,
        ingredients: [
          { name: 'Salt', amount: 10, unit: 'g' },
        ],
      });

      expect(result.scaleFactor).toBe(1.5);
      expect(result.scaledIngredients[0].scaledAmount).toBe(15);
    });
  });

  describe('edge cases', () => {
    it('should handle original batch size of zero', () => {
      const result = batch({
        originalBatchSize: 0,
        targetBatchSize: 100,
        ingredients: [
          { name: 'Flour', amount: 500, unit: 'g' },
        ],
      });

      expect(result.scaleFactor).toBe(0);
      expect(result.scaledIngredients[0].scaledAmount).toBe(0);
    });

    it('should handle target batch size of zero', () => {
      const result = batch({
        originalBatchSize: 100,
        targetBatchSize: 0,
        ingredients: [
          { name: 'Flour', amount: 500, unit: 'g' },
        ],
      });

      expect(result.scaleFactor).toBe(0);
      expect(result.scaledIngredients[0].scaledAmount).toBe(0);
    });

    it('should handle empty ingredients list', () => {
      const result = batch({
        originalBatchSize: 100,
        targetBatchSize: 200,
        ingredients: [],
      });

      expect(result.scaleFactor).toBe(2);
      expect(result.scaledIngredients).toHaveLength(0);
    });

    it('should handle same batch size (1:1)', () => {
      const result = batch({
        originalBatchSize: 100,
        targetBatchSize: 100,
        ingredients: [
          { name: 'Sugar', amount: 250, unit: 'g' },
        ],
      });

      expect(result.scaleFactor).toBe(1);
      expect(result.scaledIngredients[0].scaledAmount).toBe(250);
    });
  });

  describe('real-world recipes', () => {
    it('should scale a bread recipe', () => {
      const result = batch({
        originalBatchSize: 1, // 1 loaf
        targetBatchSize: 4, // 4 loaves
        ingredients: [
          { name: 'Bread Flour', amount: 500, unit: 'g' },
          { name: 'Water', amount: 350, unit: 'mL' },
          { name: 'Salt', amount: 10, unit: 'g' },
          { name: 'Yeast', amount: 7, unit: 'g' },
        ],
      });

      expect(result.scaleFactor).toBe(4);
      expect(result.scaledIngredients[0].scaledAmount).toBe(2000); // 2kg flour
      expect(result.scaledIngredients[1].scaledAmount).toBe(1400); // 1.4L water
      expect(result.scaledIngredients[2].scaledAmount).toBe(40); // 40g salt
      expect(result.scaledIngredients[3].scaledAmount).toBe(28); // 28g yeast
    });

    it('should scale a chemical solution', () => {
      const result = batch({
        originalBatchSize: 1000, // 1L
        targetBatchSize: 5000, // 5L
        ingredients: [
          { name: 'NaCl', amount: 9, unit: 'g' },
          { name: 'Distilled Water', amount: 991, unit: 'mL' },
        ],
      });

      expect(result.scaleFactor).toBe(5);
      expect(result.scaledIngredients[0].scaledAmount).toBe(45); // 45g NaCl
      expect(result.scaledIngredients[1].scaledAmount).toBe(4955); // ~5L water
    });
  });
});
