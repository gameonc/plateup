// Dietary taxonomy and restrictions (R4)
export type DietaryRestriction = 
  | 'vegetarian'
  | 'vegan'
  | 'gluten-free'
  | 'dairy-free'
  | 'keto'
  | 'low-carb'
  | 'pescatarian'
  | 'nut-free';

export const STANDARD_DIETARY_RESTRICTIONS: DietaryRestriction[] = [
  'vegetarian',
  'vegan',
  'gluten-free',
  'dairy-free',
  'keto',
  'low-carb',
  'pescatarian',
  'nut-free',
];

export interface DietaryOptionInfo {
  id: DietaryRestriction;
  label: string;
  description: string;
  badgeClass: string;
}

export const DIETARY_OPTIONS: DietaryOptionInfo[] = [
  { id: 'vegetarian', label: 'Vegetarian', description: 'No meat, poultry, or seafood', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'vegan', label: 'Vegan', description: '100% plant-based, no animal derivatives', badgeClass: 'bg-green-100 text-green-800 border-green-200' },
  { id: 'gluten-free', label: 'Gluten-Free', description: 'No wheat, barley, rye, or gluten', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'dairy-free', label: 'Dairy-Free', description: 'No milk, butter, cheese, or lactose', badgeClass: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'keto', label: 'Keto', description: 'High-fat, ultra low-carb (<15g net carbs)', badgeClass: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'low-carb', label: 'Low-Carb', description: 'Reduced carbohydrate content', badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { id: 'pescatarian', label: 'Pescatarian', description: 'Vegetarian plus seafood and fish', badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  { id: 'nut-free', label: 'Nut-Free', description: 'No peanuts or tree nuts', badgeClass: 'bg-rose-100 text-rose-800 border-rose-200' },
];

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
  dietaryTags?: DietaryRestriction[] | string[];
  ingredients: Ingredient[];
  instructions: string[];
  rating?: number; // 1-5
  notes?: string;
  lastMadeAt?: Date;
  timesMade: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Ingredient {
  item: string;
  name?: string;
  amount: string;
  unit: string;
  category?: string;
}

// Shopping list — stored at users/{userId}/shoppingList/current or users/{userId}/shoppingLists/{weekId}
export const GROCERY_DEPARTMENTS = [
  'Produce',
  'Dairy',
  'Meat/Seafood',
  'Pantry',
  'Spices/Seasonings',
  'Bakery',
  'Frozen',
  'Other',
] as const;

export type GroceryDepartment = typeof GROCERY_DEPARTMENTS[number];

export interface ShoppingListItem {
  id: string;
  name: string;
  item?: string;
  rawItem?: string;
  amount: number | null;
  unit: string;
  displayAmount: string;
  category: GroceryDepartment | string;
  checked: boolean;
  recipeIds: string[];
  recipeTitles: string[];
  isCustom?: boolean;
  createdAt?: Date;
}

export interface ShoppingList {
  id: string;
  userId?: string;
  weekId?: string;
  items: ShoppingListItem[];
  updatedAt?: Date;
  createdAt?: Date;
}

// Meal plan — stored at users/{userId}/mealPlans/{weekId}
export interface MealPlan {
  id: string; // ISO week format: "2026-W35"
  weekStart: Date;
  meals: WeekMeals;
  createdAt: Date;
  updatedAt?: Date;
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

export type SubscriptionPlan = 'free' | 'pro';

export const FREE_TIER_MONTHLY_LIMIT = 5;

// User profile — stored at users/{userId}
export interface UserProfile {
  uid?: string;
  displayName: string;
  email: string;
  photoURL?: string;
  preferences: UserPreferences;
  plan?: SubscriptionPlan;
  extractionsThisMonth?: number;
  extractionMonth?: string; // "YYYY-MM"
  subscriptionId?: string;
  subscriptionStatus?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface UserPreferences {
  repeatWindowDays: number; // default 5 — don't repeat a meal within this many days (1-14)
  mealsPerDay: MealTime[]; // which meals to plan, default: ['breakfast', 'lunch', 'dinner']
  dietaryRestrictions: DietaryRestriction[]; // R4: standard dietary restrictions
  allergies?: string[];
  favoriteCuisines?: string[];
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
