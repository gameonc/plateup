// Recipe type — stored in Firestore at users/{userId}/recipes/{recipeId}
export interface Recipe {
  id: string;
  name: string;
  description: string;
  source: 'youtube' | 'image' | 'manual';
  sourceUrl?: string;
  thumbnailUrl?: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  ingredients: Ingredient[];
  instructions: string[];
  rating?: number; // 1-5
  notes?: string;
  lastMadeAt?: Date;
  timesMade: number;
  createdAt: Date;
}

export interface Ingredient {
  item: string;
  amount: string;
  unit: string;
}

// Meal plan — stored at users/{userId}/mealPlans/{weekId}
export interface MealPlan {
  id: string; // ISO week format: "2026-W35"
  weekStart: Date;
  meals: WeekMeals;
  createdAt: Date;
}

export interface WeekMeals {
  monday: DayMeals;
  tuesday: DayMeals;
  wednesday: DayMeals;
  thursday: DayMeals;
  friday: DayMeals;
  saturday: DayMeals;
  sunday: DayMeals;
}

export type DayOfWeek = keyof WeekMeals;

export interface DayMeals {
  breakfast?: MealSlot;
  lunch?: MealSlot;
  dinner?: MealSlot;
}

export type MealTime = keyof DayMeals;

export interface MealSlot {
  recipeId: string;
  recipeName: string;
  thumbnailUrl?: string;
}

// Cooking log — stored at users/{userId}/cookingLog/{logId}
export interface CookingLogEntry {
  id: string;
  recipeId: string;
  recipeName: string;
  cookedAt: Date;
  rating?: number;
}

// User profile — stored at users/{userId}
export interface UserProfile {
  displayName: string;
  email: string;
  photoURL?: string;
  preferences: UserPreferences;
  createdAt: Date;
}

export interface UserPreferences {
  repeatWindowDays: number; // default 5 — don't repeat a meal within this many days
  mealsPerDay: MealTime[]; // which meals to plan, default: ['breakfast', 'lunch', 'dinner']
}

// API request/response types
export interface YouTubeRecipeRequest {
  url: string;
}

export interface ImageRecipeRequest {
  imageBase64: string;
  mimeType: string;
}

export interface RecipeResponse {
  recipe: Omit<Recipe, 'id' | 'createdAt' | 'timesMade' | 'source'>;
  videoTitle?: string;
  thumbnailUrl?: string;
}

export interface MealPlanRequest {
  weekId: string;
  lockedSlots?: Partial<WeekMeals>;
}
