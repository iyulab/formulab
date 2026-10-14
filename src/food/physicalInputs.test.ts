import { describe, it, expect } from 'vitest';
import { calorie } from './calorie.js';
import { expiry } from './expiry.js';
import { nutrition } from './nutrition.js';
import { waterActivity } from './waterActivity.js';

// A negative physical quantity used to come back as a sign-flipped "result"; each is refused now.
describe('food physical-input domains', () => {
  describe('calorie', () => {
    it('refuses a non-positive or NaN age', () => {
      expect(() => calorie({ gender: 'male', age: -30, weightKg: 70, heightCm: 175, activityLevel: 'sedentary' })).toThrow(RangeError);
      expect(() => calorie({ gender: 'male', age: NaN, weightKg: 70, heightCm: 175, activityLevel: 'sedentary' })).toThrow(RangeError);
    });

    it('accepts a real adult: Mifflin-St Jeor BMR 1649 kcal', () => {
      expect(calorie({ gender: 'male', age: 30, weightKg: 70, heightCm: 175, activityLevel: 'sedentary' }).bmr).toBe(1649);
    });
  });

  describe('expiry', () => {
    it('refuses a negative shelf life when computing the expiry date', () => {
      expect(() => expiry({ mode: 'calculateExpiry', productionDate: '2025-01-01', shelfLifeDays: -30, expiryDate: '', today: '2025-01-15' })).toThrow(RangeError);
    });

    it('accepts a zero shelf life: expires on the production day', () => {
      const result = expiry({ mode: 'calculateExpiry', productionDate: '2025-01-01', shelfLifeDays: 0, expiryDate: '', today: '2025-01-01' });
      expect(result.expiryDate).toBe('2025-01-01');
      expect(result.percentUsed).toBe(100);
    });
  });

  describe('nutrition', () => {
    it('refuses a negative ingredient amount or nutrient value', () => {
      expect(() => nutrition({ servingSize: 100, servingsPerContainer: 1, ingredients: [{ name: 'Oats', amountG: -200, calories: 100, totalFat: 5, saturatedFat: 2, transFat: 0, cholesterol: 10, sodium: 100, totalCarbs: 20, dietaryFiber: 3, sugars: 5, protein: 5 }] })).toThrow(RangeError);
      expect(() => nutrition({ servingSize: 100, servingsPerContainer: 1, ingredients: [{ name: 'Oats', amountG: 200, calories: 100, totalFat: 5, saturatedFat: 2, transFat: 0, cholesterol: 10, sodium: -100, totalCarbs: 20, dietaryFiber: 3, sugars: 5, protein: 5 }] })).toThrow(RangeError);
    });

    it('refuses a non-positive serving size', () => {
      expect(() => nutrition({ servingSize: -100, servingsPerContainer: 1, ingredients: [{ name: 'Oats', amountG: 200, calories: 100, totalFat: 5, saturatedFat: 2, transFat: 0, cholesterol: 10, sodium: 100, totalCarbs: 20, dietaryFiber: 3, sugars: 5, protein: 5 }] })).toThrow(RangeError);
      expect(() => nutrition({ servingSize: 0, servingsPerContainer: 1, ingredients: [{ name: 'Oats', amountG: 200, calories: 100, totalFat: 5, saturatedFat: 2, transFat: 0, cholesterol: 10, sodium: 100, totalCarbs: 20, dietaryFiber: 3, sugars: 5, protein: 5 }] })).toThrow(RangeError);
    });

    it('accepts zero nutrients: 100 kcal/100 g × 200 g, served 100 g → 100 kcal', () => {
      const result = nutrition({ servingSize: 100, servingsPerContainer: 1, ingredients: [{ name: 'Oats', amountG: 200, calories: 100, totalFat: 0, saturatedFat: 0, transFat: 0, cholesterol: 0, sodium: 0, totalCarbs: 20, dietaryFiber: 3, sugars: 5, protein: 5 }] });
      expect(result.perServing.calories).toBe(100);
      expect(result.perServing.totalFat).toBe(0);
    });
  });

  describe('waterActivity', () => {
    it('refuses aw outside [0, 1]', () => {
      expect(() => waterActivity({ aw: -0.1 })).toThrow(RangeError);
      expect(() => waterActivity({ aw: 1.1 })).toThrow(RangeError);
      expect(() => waterActivity({ aw: NaN })).toThrow(RangeError);
    });

    it('accepts both ends: 0 is stable, 1 (pure water) is high risk', () => {
      expect(waterActivity({ aw: 0 }).riskLevel).toBe('safe');
      expect(waterActivity({ aw: 1 }).riskLevel).toBe('high');
    });
  });
});
