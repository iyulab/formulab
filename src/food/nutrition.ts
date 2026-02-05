import { roundTo } from '../utils.js';
import type { NutritionInput, NutritionResult, NutritionFacts, DailyValuePercents } from './types.js';

// FDA Daily Values (2020)
const DAILY_VALUES = {
  totalFat: 78,         // g
  saturatedFat: 20,     // g
  cholesterol: 300,     // mg
  sodium: 2300,         // mg
  totalCarbs: 275,      // g
  dietaryFiber: 28,     // g
  protein: 50,          // g
};

/**
 * Calculate nutrition facts per serving from ingredients
 *
 * Aggregates nutrition data from ingredients (per 100g values) and
 * calculates per-serving amounts and daily value percentages.
 *
 * @param input - Nutrition input with serving size and ingredients
 * @returns Nutrition result with per-serving facts and daily values
 */
export function nutrition(input: NutritionInput): NutritionResult {
  const { servingSize, ingredients } = input;

  // Sum all ingredients (nutrients per 100g × amountG / 100)
  const totals: NutritionFacts = {
    calories: 0, totalFat: 0, saturatedFat: 0, transFat: 0,
    cholesterol: 0, sodium: 0, totalCarbs: 0, dietaryFiber: 0,
    sugars: 0, protein: 0,
  };

  let totalRecipeWeightG = 0;

  for (const ing of ingredients) {
    const factor = ing.amountG / 100;
    totalRecipeWeightG += ing.amountG;
    totals.calories += ing.calories * factor;
    totals.totalFat += ing.totalFat * factor;
    totals.saturatedFat += ing.saturatedFat * factor;
    totals.transFat += ing.transFat * factor;
    totals.cholesterol += ing.cholesterol * factor;
    totals.sodium += ing.sodium * factor;
    totals.totalCarbs += ing.totalCarbs * factor;
    totals.dietaryFiber += ing.dietaryFiber * factor;
    totals.sugars += ing.sugars * factor;
    totals.protein += ing.protein * factor;
  }

  // Per serving = recipe total × (servingSize / totalWeight)
  const servingFactor = totalRecipeWeightG > 0 ? servingSize / totalRecipeWeightG : 0;

  const perServing: NutritionFacts = {
    calories: roundTo(totals.calories * servingFactor, 0),
    totalFat: roundTo(totals.totalFat * servingFactor, 1),
    saturatedFat: roundTo(totals.saturatedFat * servingFactor, 1),
    transFat: roundTo(totals.transFat * servingFactor, 1),
    cholesterol: roundTo(totals.cholesterol * servingFactor, 0),
    sodium: roundTo(totals.sodium * servingFactor, 0),
    totalCarbs: roundTo(totals.totalCarbs * servingFactor, 1),
    dietaryFiber: roundTo(totals.dietaryFiber * servingFactor, 1),
    sugars: roundTo(totals.sugars * servingFactor, 1),
    protein: roundTo(totals.protein * servingFactor, 1),
  };

  // Daily value percentages
  const dvPercent = (value: number, dv: number) => dv > 0 ? roundTo((value / dv) * 100, 1) : 0;

  const dailyValues: DailyValuePercents = {
    totalFat: dvPercent(perServing.totalFat, DAILY_VALUES.totalFat),
    saturatedFat: dvPercent(perServing.saturatedFat, DAILY_VALUES.saturatedFat),
    cholesterol: dvPercent(perServing.cholesterol, DAILY_VALUES.cholesterol),
    sodium: dvPercent(perServing.sodium, DAILY_VALUES.sodium),
    totalCarbs: dvPercent(perServing.totalCarbs, DAILY_VALUES.totalCarbs),
    dietaryFiber: dvPercent(perServing.dietaryFiber, DAILY_VALUES.dietaryFiber),
    protein: dvPercent(perServing.protein, DAILY_VALUES.protein),
  };

  return {
    totalRecipeWeightG: roundTo(totalRecipeWeightG, 0),
    perServing,
    dailyValues,
  };
}
