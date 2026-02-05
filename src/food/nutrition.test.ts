import { describe, it, expect } from 'vitest';
import { nutrition } from './nutrition.js';

describe('nutrition', () => {
  describe('basic nutrition calculation', () => {
    it('should calculate total recipe weight', () => {
      const result = nutrition({
        servingSize: 100,
        ingredients: [
          {
            amountG: 200,
            calories: 100,
            totalFat: 5,
            saturatedFat: 2,
            transFat: 0,
            cholesterol: 10,
            sodium: 100,
            totalCarbs: 20,
            dietaryFiber: 3,
            sugars: 5,
            protein: 5,
          },
          {
            amountG: 100,
            calories: 200,
            totalFat: 10,
            saturatedFat: 3,
            transFat: 0.5,
            cholesterol: 20,
            sodium: 200,
            totalCarbs: 30,
            dietaryFiber: 2,
            sugars: 10,
            protein: 8,
          },
        ],
      });

      expect(result.totalRecipeWeightG).toBe(300);
    });

    it('should calculate per serving values correctly', () => {
      // Single ingredient: 100g with 200 cal/100g, serving size 50g
      const result = nutrition({
        servingSize: 50,
        ingredients: [
          {
            amountG: 100,
            calories: 200,
            totalFat: 10,
            saturatedFat: 3,
            transFat: 0,
            cholesterol: 30,
            sodium: 500,
            totalCarbs: 25,
            dietaryFiber: 5,
            sugars: 10,
            protein: 15,
          },
        ],
      });

      // Total: 200 cal, serving is half → 100 cal
      expect(result.perServing.calories).toBe(100);
      expect(result.perServing.totalFat).toBe(5);
      expect(result.perServing.protein).toBe(7.5);
    });
  });

  describe('daily value percentages', () => {
    it('should calculate daily value percentages', () => {
      const result = nutrition({
        servingSize: 100,
        ingredients: [
          {
            amountG: 100,
            calories: 300,
            totalFat: 39, // 50% of 78g DV
            saturatedFat: 10, // 50% of 20g DV
            transFat: 0,
            cholesterol: 150, // 50% of 300mg DV
            sodium: 1150, // 50% of 2300mg DV
            totalCarbs: 137.5, // 50% of 275g DV
            dietaryFiber: 14, // 50% of 28g DV
            sugars: 20,
            protein: 25, // 50% of 50g DV
          },
        ],
      });

      expect(result.dailyValues.totalFat).toBe(50);
      expect(result.dailyValues.saturatedFat).toBe(50);
      expect(result.dailyValues.cholesterol).toBe(50);
      expect(result.dailyValues.sodium).toBe(50);
      expect(result.dailyValues.totalCarbs).toBe(50);
      expect(result.dailyValues.dietaryFiber).toBe(50);
      expect(result.dailyValues.protein).toBe(50);
    });
  });

  describe('multiple ingredients', () => {
    it('should sum nutrients from multiple ingredients', () => {
      const result = nutrition({
        servingSize: 300, // Full recipe
        ingredients: [
          {
            amountG: 100,
            calories: 100,
            totalFat: 5,
            saturatedFat: 1,
            transFat: 0,
            cholesterol: 10,
            sodium: 100,
            totalCarbs: 10,
            dietaryFiber: 2,
            sugars: 3,
            protein: 5,
          },
          {
            amountG: 200,
            calories: 150, // Per 100g → 300 cal for 200g
            totalFat: 8, // Per 100g → 16g for 200g
            saturatedFat: 2,
            transFat: 0,
            cholesterol: 15,
            sodium: 150,
            totalCarbs: 20,
            dietaryFiber: 3,
            sugars: 5,
            protein: 10,
          },
        ],
      });

      // Total calories: 100 (from 100g) + 300 (from 200g) = 400
      expect(result.perServing.calories).toBe(400);
      // Total fat: 5 + 16 = 21g
      expect(result.perServing.totalFat).toBe(21);
    });
  });

  describe('edge cases', () => {
    it('should handle empty ingredients list', () => {
      const result = nutrition({
        servingSize: 100,
        ingredients: [],
      });

      expect(result.totalRecipeWeightG).toBe(0);
      expect(result.perServing.calories).toBe(0);
    });

    it('should handle zero total recipe weight', () => {
      const result = nutrition({
        servingSize: 100,
        ingredients: [
          {
            amountG: 0,
            calories: 200,
            totalFat: 10,
            saturatedFat: 3,
            transFat: 0,
            cholesterol: 30,
            sodium: 500,
            totalCarbs: 25,
            dietaryFiber: 5,
            sugars: 10,
            protein: 15,
          },
        ],
      });

      expect(result.totalRecipeWeightG).toBe(0);
      expect(result.perServing.calories).toBe(0);
    });

    it('should handle serving size larger than recipe', () => {
      const result = nutrition({
        servingSize: 200, // Double the recipe
        ingredients: [
          {
            amountG: 100,
            calories: 200,
            totalFat: 10,
            saturatedFat: 3,
            transFat: 0,
            cholesterol: 30,
            sodium: 500,
            totalCarbs: 25,
            dietaryFiber: 5,
            sugars: 10,
            protein: 15,
          },
        ],
      });

      // Serving is 2x recipe, so values are 2x
      expect(result.perServing.calories).toBe(400);
    });
  });

  describe('real-world recipe example', () => {
    it('should calculate nutrition for simple pasta dish', () => {
      const result = nutrition({
        servingSize: 250, // One serving
        ingredients: [
          // Pasta (100g dry)
          {
            amountG: 100,
            calories: 371,
            totalFat: 1.5,
            saturatedFat: 0.3,
            transFat: 0,
            cholesterol: 0,
            sodium: 6,
            totalCarbs: 75,
            dietaryFiber: 3,
            sugars: 2.7,
            protein: 13,
          },
          // Tomato sauce (150g)
          {
            amountG: 150,
            calories: 29,
            totalFat: 0.2,
            saturatedFat: 0,
            transFat: 0,
            cholesterol: 0,
            sodium: 260,
            totalCarbs: 6.5,
            dietaryFiber: 1.5,
            sugars: 4,
            protein: 1.3,
          },
        ],
      });

      // Total recipe: 250g, serving: 250g (full recipe)
      expect(result.totalRecipeWeightG).toBe(250);
      // Pasta: 371 cal, Sauce: 29 * 1.5 = 43.5 cal → 414.5 → rounded to 415
      expect(result.perServing.calories).toBe(415);
    });
  });
});
