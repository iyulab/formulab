import { describe, it, expect } from 'vitest';
import { calorie } from './calorie.js';

describe('calorie', () => {
  describe('BMR calculation - male', () => {
    it('should calculate BMR for average male', () => {
      // Mifflin-St Jeor: BMR = 10×70 + 6.25×175 - 5×30 + 5 = 700 + 1093.75 - 150 + 5 = 1648.75 → 1649
      const result = calorie({
        gender: 'male',
        age: 30,
        weightKg: 70,
        heightCm: 175,
        activityLevel: 'sedentary',
      });

      expect(result.bmr).toBe(1649);
    });

    it('should calculate BMR for heavier male', () => {
      const result = calorie({
        gender: 'male',
        age: 30,
        weightKg: 90,
        heightCm: 180,
        activityLevel: 'sedentary',
      });

      // BMR = 10×90 + 6.25×180 - 5×30 + 5 = 1880
      expect(result.bmr).toBe(1880);
    });
  });

  describe('BMR calculation - female', () => {
    it('should calculate BMR for average female', () => {
      // Mifflin-St Jeor: BMR = 10×55 + 6.25×165 - 5×25 - 161 = 550 + 1031.25 - 125 - 161 = 1295.25 → 1295
      const result = calorie({
        gender: 'female',
        age: 25,
        weightKg: 55,
        heightCm: 165,
        activityLevel: 'sedentary',
      });

      expect(result.bmr).toBe(1295);
    });

    it('should calculate lower BMR for female than male (same stats)', () => {
      const male = calorie({
        gender: 'male',
        age: 30,
        weightKg: 70,
        heightCm: 170,
        activityLevel: 'sedentary',
      });

      const female = calorie({
        gender: 'female',
        age: 30,
        weightKg: 70,
        heightCm: 170,
        activityLevel: 'sedentary',
      });

      expect(female.bmr).toBeLessThan(male.bmr);
      // Difference should be 166 (5 - (-161))
      expect(male.bmr - female.bmr).toBe(166);
    });
  });

  describe('TDEE calculation', () => {
    it('should calculate TDEE for sedentary activity', () => {
      const result = calorie({
        gender: 'male',
        age: 30,
        weightKg: 70,
        heightCm: 175,
        activityLevel: 'sedentary',
      });

      // TDEE = BMR × 1.2
      expect(result.tdee).toBeCloseTo(result.bmr * 1.2, 0);
    });

    it('should calculate TDEE for moderate activity', () => {
      const result = calorie({
        gender: 'male',
        age: 30,
        weightKg: 70,
        heightCm: 175,
        activityLevel: 'moderate',
      });

      // TDEE = BMR × 1.55
      expect(result.tdee).toBeCloseTo(result.bmr * 1.55, 0);
    });

    it('should calculate TDEE for very active', () => {
      const result = calorie({
        gender: 'male',
        age: 30,
        weightKg: 70,
        heightCm: 175,
        activityLevel: 'veryActive',
      });

      // TDEE = BMR × 1.9
      expect(result.tdee).toBeCloseTo(result.bmr * 1.9, 0);
    });
  });

  describe('calorie goals', () => {
    it('should calculate weight loss goal (TDEE - 500)', () => {
      const result = calorie({
        gender: 'male',
        age: 30,
        weightKg: 70,
        heightCm: 175,
        activityLevel: 'moderate',
      });

      expect(result.weightLoss).toBe(result.tdee - 500);
    });

    it('should calculate weight maintain goal (= TDEE)', () => {
      const result = calorie({
        gender: 'male',
        age: 30,
        weightKg: 70,
        heightCm: 175,
        activityLevel: 'moderate',
      });

      expect(result.weightMaintain).toBe(result.tdee);
    });

    it('should calculate weight gain goal (TDEE + 500)', () => {
      const result = calorie({
        gender: 'male',
        age: 30,
        weightKg: 70,
        heightCm: 175,
        activityLevel: 'moderate',
      });

      expect(result.weightGain).toBe(result.tdee + 500);
    });
  });

  describe('edge cases', () => {
    it('should return zeros for zero weight', () => {
      const result = calorie({
        gender: 'male',
        age: 30,
        weightKg: 0,
        heightCm: 175,
        activityLevel: 'moderate',
      });

      expect(result.bmr).toBe(0);
      expect(result.tdee).toBe(0);
    });

    it('should return zeros for zero height', () => {
      const result = calorie({
        gender: 'male',
        age: 30,
        weightKg: 70,
        heightCm: 0,
        activityLevel: 'moderate',
      });

      expect(result.bmr).toBe(0);
    });

    it('should return zeros for zero age', () => {
      const result = calorie({
        gender: 'male',
        age: 0,
        weightKg: 70,
        heightCm: 175,
        activityLevel: 'moderate',
      });

      expect(result.bmr).toBe(0);
    });

    it('should return zeros for negative weight', () => {
      const result = calorie({
        gender: 'male',
        age: 30,
        weightKg: -70,
        heightCm: 175,
        activityLevel: 'moderate',
      });

      expect(result.bmr).toBe(0);
    });
  });

  describe('age impact', () => {
    it('should show BMR decreases with age', () => {
      const young = calorie({
        gender: 'male',
        age: 25,
        weightKg: 70,
        heightCm: 175,
        activityLevel: 'moderate',
      });

      const older = calorie({
        gender: 'male',
        age: 55,
        weightKg: 70,
        heightCm: 175,
        activityLevel: 'moderate',
      });

      expect(older.bmr).toBeLessThan(young.bmr);
      // Each year reduces BMR by 5 calories
      expect(young.bmr - older.bmr).toBe(150); // 30 years × 5
    });
  });
});
