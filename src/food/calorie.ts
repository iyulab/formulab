import { roundTo } from '../utils.js';
import type { CalorieInput, CalorieResult, ActivityLevel } from './types.js';

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
};

/**
 * Calculate daily calorie needs using Mifflin-St Jeor equation
 *
 * BMR (male) = 10 × weight(kg) + 6.25 × height(cm) - 5 × age + 5
 * BMR (female) = 10 × weight(kg) + 6.25 × height(cm) - 5 × age - 161
 * TDEE = BMR × activity multiplier
 *
 * @param input - Calorie input parameters
 * @returns Calorie result with BMR, TDEE, and calorie goals
 */
export function calorie(input: CalorieInput): CalorieResult {
  const { gender, age, weightKg, heightCm, activityLevel } = input;

  if (weightKg <= 0 || heightCm <= 0 || age <= 0) {
    return { bmr: 0, tdee: 0, weightLoss: 0, weightMaintain: 0, weightGain: 0 };
  }

  // Mifflin-St Jeor equation
  let bmr: number;
  if (gender === 'male') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }

  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel];
  const tdee = bmr * multiplier;

  return {
    bmr: roundTo(bmr, 0),
    tdee: roundTo(tdee, 0),
    weightLoss: roundTo(tdee - 500, 0),
    weightMaintain: roundTo(tdee, 0),
    weightGain: roundTo(tdee + 500, 0),
  };
}
