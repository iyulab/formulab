/**
 * Calorie Calculator Types
 */
export type Gender = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'veryActive';

export interface CalorieInput {
  gender: Gender;
  age: number;
  weightKg: number;
  heightCm: number;
  activityLevel: ActivityLevel;
}

export interface CalorieResult {
  bmr: number;
  tdee: number;
  weightLoss: number;     // tdee - 500
  weightMaintain: number; // tdee
  weightGain: number;     // tdee + 500
}

/**
 * Expiry Date Calculator Types
 */
export type ExpiryMode = 'calculateExpiry' | 'calculateRemaining';

export interface ExpiryInput {
  mode: ExpiryMode;
  productionDate: string;   // ISO date string YYYY-MM-DD
  shelfLifeDays: number;
  expiryDate: string;       // ISO date string YYYY-MM-DD
  today: string;            // ISO date string, injected for testability
}

export interface ExpiryResult {
  expiryDate: string;       // ISO date
  remainingDays: number;
  shelfLifeDays: number;
  isExpired: boolean;
  percentUsed: number;      // 0-100
}

/**
 * Nutrition Facts Calculator Types
 */
export interface NutrientIngredient {
  name: string;
  amountG: number;         // grams used
  calories: number;        // per 100g
  totalFat: number;        // per 100g, g
  saturatedFat: number;    // per 100g, g
  transFat: number;        // per 100g, g
  cholesterol: number;     // per 100g, mg
  sodium: number;          // per 100g, mg
  totalCarbs: number;      // per 100g, g
  dietaryFiber: number;    // per 100g, g
  sugars: number;          // per 100g, g
  protein: number;         // per 100g, g
}

export interface NutritionInput {
  servingSize: number;             // g
  servingsPerContainer: number;    // default 1
  ingredients: NutrientIngredient[];
}

export interface NutritionFacts {
  calories: number;
  totalFat: number;
  saturatedFat: number;
  transFat: number;
  cholesterol: number;
  sodium: number;
  totalCarbs: number;
  dietaryFiber: number;
  sugars: number;
  protein: number;
}

export interface DailyValuePercents {
  totalFat: number;
  saturatedFat: number;
  cholesterol: number;
  sodium: number;
  totalCarbs: number;
  dietaryFiber: number;
  protein: number;
}

export interface NutritionResult {
  totalRecipeWeightG: number;
  perServing: NutritionFacts;
  dailyValues: DailyValuePercents;
}

/**
 * HACCP Checklist Types
 */
export type HaccpCategory = 'receiving' | 'storage' | 'preparation' | 'cooking' | 'cooling' | 'serving';

export interface HaccpInput {
  category: HaccpCategory;
}

export interface HaccpCheckItem {
  id: string;
  checkpoint: string;
  standard: string;
  corrective: string;
  critical: boolean;
}

export interface HaccpResult {
  category: HaccpCategory;
  items: HaccpCheckItem[];
}
