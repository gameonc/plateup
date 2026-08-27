/**
 * In-Memory Test Context and Engine for PlateUp Opaque-Box E2E Testing
 */

import type { TestRecipe } from './recipe-fixtures.ts';

export type DietaryRestriction = 
  | 'vegetarian'
  | 'vegan'
  | 'gluten-free'
  | 'dairy-free'
  | 'keto'
  | 'low-carb'
  | 'pescatarian'
  | 'nut-free';

export interface UserPreferences {
  repeatWindowDays: number;
  mealsPerDay: ('breakfast' | 'lunch' | 'dinner')[];
  dietaryRestrictions: DietaryRestriction[];
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  preferences: UserPreferences;
}

export interface CookingLogEntry {
  id: string;
  recipeId: string;
  recipeName: string;
  cookedAt: Date;
  rating?: number;
}

export interface MealSlot {
  recipeId: string;
  recipeName: string;
  thumbnailUrl?: string;
}

export interface DayMeals {
  breakfast?: MealSlot;
  lunch?: MealSlot;
  dinner?: MealSlot;
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

export interface MealPlan {
  id: string; // "2026-W35"
  userId: string;
  weekStart: Date;
  meals: WeekMeals;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ShoppingListItem {
  id: string;
  name: string;
  amount: number | null;
  unit: string;
  displayAmount: string;
  category: string;
  checked: boolean;
  recipeIds: string[];
  recipeTitles: string[];
  isCustom?: boolean;
}

export interface ShoppingList {
  id: string;
  userId: string;
  weekId: string;
  items: ShoppingListItem[];
  updatedAt: Date;
}

// 8 Store departments per PROJECT.md
export const GROCERY_DEPARTMENTS = [
  'Produce',
  'Dairy',
  'Meat/Seafood',
  'Pantry',
  'Spices/Seasonings',
  'Bakery',
  'Frozen',
  'Other'
] as const;

export type GroceryDepartment = typeof GROCERY_DEPARTMENTS[number];

/**
 * Unit math and normalization engine
 */
export interface ParsedQuantity {
  numericValue: number;
  displayString: string;
}

export function parseFractionOrAmount(input: string | number | null | undefined): number {
  if (input === null || input === undefined || input === '') return 1;
  if (typeof input === 'number') return isNaN(input) ? 1 : input;
  
  const trimmed = input.trim();
  if (!trimmed) return 1;

  // Mixed fractions e.g. "1 1/2" or "2 3/4"
  const mixedMatch = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const whole = parseFloat(mixedMatch[1]);
    const num = parseFloat(mixedMatch[2]);
    const den = parseFloat(mixedMatch[3]);
    if (den !== 0) return whole + num / den;
  }

  // Simple fraction e.g. "1/2", "3/4"
  const fractionMatch = trimmed.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const num = parseFloat(fractionMatch[1]);
    const den = parseFloat(fractionMatch[2]);
    if (den !== 0) return num / den;
  }

  // Plain number e.g. "2", "1.5"
  const parsed = parseFloat(trimmed);
  return isNaN(parsed) ? 1 : parsed;
}

export function formatQuantityDisplay(amount: number | null, unit: string): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return unit ? unit : '';
  }

  // Round small floating-point errors
  const rounded = Math.round(amount * 100) / 100;
  
  // Format clean fractions if close
  const whole = Math.floor(rounded);
  const frac = Math.round((rounded - whole) * 100) / 100;

  let fracStr = '';
  if (Math.abs(frac - 0.5) < 0.05) fracStr = '1/2';
  else if (Math.abs(frac - 0.25) < 0.05) fracStr = '1/4';
  else if (Math.abs(frac - 0.75) < 0.05) fracStr = '3/4';
  else if (Math.abs(frac - 0.33) < 0.05) fracStr = '1/3';
  else if (Math.abs(frac - 0.67) < 0.05) fracStr = '2/3';

  let qtyStr = '';
  if (fracStr) {
    qtyStr = whole > 0 ? `${whole} ${fracStr}` : fracStr;
  } else if (rounded % 1 === 0) {
    qtyStr = `${rounded}`;
  } else {
    qtyStr = `${rounded}`;
  }

  return unit ? `${qtyStr} ${unit}`.trim() : qtyStr;
}

export function normalizeUnit(unitStr: string): { normalizedUnit: string; type: 'volume' | 'weight' | 'count' | 'other' } {
  const u = (unitStr || '').trim().toLowerCase();
  
  if (['tsp', 'teaspoon', 'teaspoons'].includes(u)) return { normalizedUnit: 'tsp', type: 'volume' };
  if (['tbsp', 'tablespoon', 'tablespoons', 'tbs'].includes(u)) return { normalizedUnit: 'tbsp', type: 'volume' };
  if (['cup', 'cups', 'c'].includes(u)) return { normalizedUnit: 'cups', type: 'volume' };
  if (['fl oz', 'fluid ounce', 'fluid ounces'].includes(u)) return { normalizedUnit: 'fl oz', type: 'volume' };
  if (['pint', 'pints', 'pt'].includes(u)) return { normalizedUnit: 'pints', type: 'volume' };
  if (['quart', 'quarts', 'qt'].includes(u)) return { normalizedUnit: 'quarts', type: 'volume' };
  if (['gal', 'gallon', 'gallons'].includes(u)) return { normalizedUnit: 'gallons', type: 'volume' };
  if (['ml', 'milliliter', 'milliliters'].includes(u)) return { normalizedUnit: 'ml', type: 'volume' };
  if (['l', 'liter', 'liters'].includes(u)) return { normalizedUnit: 'liters', type: 'volume' };

  if (['oz', 'ounce', 'ounces'].includes(u)) return { normalizedUnit: 'oz', type: 'weight' };
  if (['lb', 'lbs', 'pound', 'pounds'].includes(u)) return { normalizedUnit: 'lbs', type: 'weight' };
  if (['g', 'gram', 'grams'].includes(u)) return { normalizedUnit: 'g', type: 'weight' };
  if (['kg', 'kilogram', 'kilograms'].includes(u)) return { normalizedUnit: 'kg', type: 'weight' };

  if (['item', 'items', 'piece', 'pieces', 'clove', 'cloves', 'slice', 'slices', 'can', 'cans', 'head', 'heads', 'bunch', 'bunches', 'sprig', 'sprigs'].includes(u)) {
    return { normalizedUnit: u, type: 'count' };
  }

  return { normalizedUnit: u, type: 'other' };
}

export function categorizeIngredientDepartment(ingredientName: string, category?: string): GroceryDepartment {
  if (category) {
    const c = category.toLowerCase();
    if (c.includes('produce')) return 'Produce';
    if (c.includes('dairy')) return 'Dairy';
    if (c.includes('meat') || c.includes('seafood') || c.includes('poultry')) return 'Meat/Seafood';
    if (c.includes('pantry') || c.includes('grain') || c.includes('oil')) return 'Pantry';
    if (c.includes('spice') || c.includes('season')) return 'Spices/Seasonings';
    if (c.includes('bakery') || c.includes('bread')) return 'Bakery';
    if (c.includes('frozen')) return 'Frozen';
  }

  const name = ingredientName.toLowerCase();
  
  if (name.match(/\b(bread|sourdough|tortilla|tortillas|bun|buns|pita|bagel|bagels|croissant|croissants)\b/)) {
    return 'Bakery';
  }
  if (name.match(/\b(onion|garlic|tomato|potato|carrot|spinach|avocado|lemon|lime|cilantro|basil|parsley|thyme|rosemary|pepper|asparagus|broccoli|lettuce|cucumber|apple|banana|berry|ginger|mushroom)\b/)) {
    return 'Produce';
  }
  if (name.match(/\b(milk|cream|butter|cheese|egg|eggs|yogurt|parmesan|pecorino|cheddar|mozzarella|ricotta)\b/)) {
    return 'Dairy';
  }
  if (name.match(/\b(beef|chicken|pork|bacon|guanciale|steak|salmon|fish|shrimp|turkey|sausage|lamb|tuna|tofu)\b/)) {
    return 'Meat/Seafood';
  }
  if (name.match(/\b(flour|sugar|rice|pasta|spaghetti|noodle|oil|olive oil|vinegar|quinoa|chickpeas|beans|broth|stock|tomato paste|canned|tahini|honey)\b/)) {
    return 'Pantry';
  }
  if (name.match(/\b(salt|black pepper|cumin|paprika|chili powder|oregano|cinnamon|nutmeg|bay leaf|garlic powder|onion powder|red pepper flakes)\b/)) {
    return 'Spices/Seasonings';
  }
  if (name.match(/\b(frozen|ice cream|puff pastry|peas)\b/)) {
    return 'Frozen';
  }

  return 'Other';
}

/**
 * Aggregates all ingredients across a meal plan
 */
export function aggregateMealPlanIngredients(
  mealPlan: MealPlan,
  recipesMap: Map<string, TestRecipe>
): ShoppingListItem[] {
  const aggregatedMap = new Map<string, {
    name: string;
    totalAmount: number;
    unit: string;
    category: GroceryDepartment;
    recipeIds: Set<string>;
    recipeTitles: Set<string>;
  }>();

  const days: (keyof WeekMeals)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const mealTimes: ('breakfast' | 'lunch' | 'dinner')[] = ['breakfast', 'lunch', 'dinner'];

  for (const day of days) {
    for (const time of mealTimes) {
      const slot = mealPlan.meals[day]?.[time];
      if (slot && slot.recipeId) {
        const recipe = recipesMap.get(slot.recipeId);
        if (recipe) {
          for (const ing of recipe.ingredients) {
            const ingName = (ing.item || ing.name || '').trim();
            if (!ingName) continue;

            const { normalizedUnit } = normalizeUnit(ing.unit);
            const key = `${ingName.toLowerCase()}_${normalizedUnit.toLowerCase()}`;
            const amountNum = parseFractionOrAmount(ing.amount);
            const dept = categorizeIngredientDepartment(ingName, ing.category);

            if (!aggregatedMap.has(key)) {
              aggregatedMap.set(key, {
                name: ingName,
                totalAmount: amountNum,
                unit: normalizedUnit,
                category: dept,
                recipeIds: new Set([recipe.id]),
                recipeTitles: new Set([recipe.title || recipe.name]),
              });
            } else {
              const entry = aggregatedMap.get(key)!;
              entry.totalAmount += amountNum;
              entry.recipeIds.add(recipe.id);
              entry.recipeTitles.add(recipe.title || recipe.name);
            }
          }
        }
      }
    }
  }

  const items: ShoppingListItem[] = [];
  let index = 1;
  for (const data of aggregatedMap.values()) {
    items.push({
      id: `item_agg_${index++}`,
      name: data.name,
      amount: data.totalAmount,
      unit: data.unit,
      displayAmount: formatQuantityDisplay(data.totalAmount, data.unit),
      category: data.category,
      checked: false,
      recipeIds: Array.from(data.recipeIds),
      recipeTitles: Array.from(data.recipeTitles),
      isCustom: false,
    });
  }

  return items;
}

/**
 * ISO Week Utilities
 */
export function getISOWeekString(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export function getWeekStartDate(isoWeekStr: string): Date {
  const match = isoWeekStr.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return new Date();
  const year = parseInt(match[1], 10);
  const week = parseInt(match[2], 10);
  
  // 4th of January is always in week 1
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7; // Monday = 1, Sunday = 7
  const monWeek1 = new Date(jan4.getTime() - (dayOfWeek - 1) * 86400000);
  
  return new Date(monWeek1.getTime() + (week - 1) * 7 * 86400000);
}

export function shiftISOWeek(isoWeekStr: string, offset: number): string {
  const startDate = getWeekStartDate(isoWeekStr);
  const shifted = new Date(startDate.getTime() + offset * 7 * 86400000);
  return getISOWeekString(shifted);
}

/**
 * Smart Auto-fill algorithm with strict dietary filtering
 */
export function generateSmartMealPlan(
  allRecipes: TestRecipe[],
  existingPlan: Partial<WeekMeals> = {},
  preferences: UserPreferences = { repeatWindowDays: 5, mealsPerDay: ['breakfast', 'lunch', 'dinner'], dietaryRestrictions: [] },
  cookingLogs: CookingLogEntry[] = []
): WeekMeals {
  const plan: WeekMeals = {
    monday: { ...existingPlan.monday },
    tuesday: { ...existingPlan.tuesday },
    wednesday: { ...existingPlan.wednesday },
    thursday: { ...existingPlan.thursday },
    friday: { ...existingPlan.friday },
    saturday: { ...existingPlan.saturday },
    sunday: { ...existingPlan.sunday },
  };

  // 1. Filter recipes by dietary restrictions (must satisfy ALL restrictions in user profile)
  let dietCompliant = allRecipes;
  if (preferences.dietaryRestrictions && preferences.dietaryRestrictions.length > 0) {
    dietCompliant = allRecipes.filter(r => {
      const recipeDietTags = (r.dietaryTags || []).map(t => t.toLowerCase());
      return preferences.dietaryRestrictions.every(req => recipeDietTags.includes(req.toLowerCase()));
    });
  }

  if (dietCompliant.length === 0) {
    // If no recipe matches, return plan as is
    return plan;
  }

  // 2. Identify recently cooked recipe IDs within repeatWindowDays
  const now = new Date();
  const cutoffTime = now.getTime() - (preferences.repeatWindowDays || 5) * 86400000;
  const recentCookedIds = new Set(
    cookingLogs
      .filter(log => new Date(log.cookedAt).getTime() >= cutoffTime)
      .map(log => log.recipeId)
  );

  let candidates = dietCompliant.filter(r => !recentCookedIds.has(r.id));
  if (candidates.length === 0) {
    candidates = dietCompliant; // Fallback to all compliant if all are recently cooked
  }

  const days: (keyof WeekMeals)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const meals: ('breakfast' | 'lunch' | 'dinner')[] = preferences.mealsPerDay || ['breakfast', 'lunch', 'dinner'];
  const usedInPlan = new Set<string>();

  // Collect recipes already locked
  for (const day of days) {
    for (const m of ['breakfast', 'lunch', 'dinner'] as const) {
      if (plan[day]?.[m]?.recipeId) {
        usedInPlan.add(plan[day]![m]!.recipeId);
      }
    }
  }

  let index = 0;
  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    const prevDay = i > 0 ? days[i - 1] : null;
    const prevDayRecipeIds = new Set<string>();
    if (prevDay) {
      Object.values(plan[prevDay] || {}).forEach(slot => {
        if (slot) prevDayRecipeIds.add(slot.recipeId);
      });
    }

    for (const meal of meals) {
      if (!plan[day][meal]) {
        // Pick recipe avoiding previous day and already used in plan
        let available = candidates.filter(r => !prevDayRecipeIds.has(r.id) && !usedInPlan.has(r.id));
        if (available.length === 0) {
          available = candidates.filter(r => !prevDayRecipeIds.has(r.id));
        }
        if (available.length === 0) {
          available = candidates;
        }

        // Prefer easy on weekdays, harder on weekends
        const isWeekend = day === 'saturday' || day === 'sunday';
        const difficultyMatches = available.filter(r => isWeekend ? r.difficulty !== 'easy' : r.difficulty === 'easy');
        const pool = difficultyMatches.length > 0 ? difficultyMatches : available;

        const selected = pool[index % pool.length];
        index++;

        plan[day][meal] = {
          recipeId: selected.id,
          recipeName: selected.name || selected.title || 'Recipe',
          thumbnailUrl: selected.thumbnailUrl,
        };
        usedInPlan.add(selected.id);
      }
    }
  }

  return plan;
}

/**
 * In-Memory Firestore & App State Simulator
 */
export class PlateUpTestEnvironment {
  public users: Map<string, UserProfile> = new Map();
  public recipes: Map<string, Map<string, TestRecipe>> = new Map(); // userId -> recipeId -> TestRecipe
  public mealPlans: Map<string, Map<string, MealPlan>> = new Map(); // userId -> weekId -> MealPlan
  public cookingLogs: Map<string, CookingLogEntry[]> = new Map(); // userId -> logs
  public shoppingLists: Map<string, ShoppingList> = new Map(); // `${userId}_${weekId}` -> ShoppingList
  public currentUser: UserProfile | null = null;
  public toastQueue: string[] = [];

  constructor() {
    this.reset();
  }

  public reset() {
    this.users.clear();
    this.recipes.clear();
    this.mealPlans.clear();
    this.cookingLogs.clear();
    this.shoppingLists.clear();
    this.currentUser = null;
    this.toastQueue = [];
  }

  public showToast(msg: string) {
    this.toastQueue.push(msg);
  }

  // Auth operations
  public register(email: string, password: string, displayName: string = 'Chef'): UserProfile {
    if (!email || !email.includes('@')) throw new Error('Invalid email format');
    if (!password || password.length < 6) throw new Error('Password must be at least 6 characters');
    
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        throw new Error('auth/email-already-in-use');
      }
    }

    const uid = `uid_${Math.random().toString(36).substring(2, 9)}`;
    const user: UserProfile = {
      uid,
      email,
      displayName,
      createdAt: new Date(),
      preferences: {
        repeatWindowDays: 5,
        mealsPerDay: ['breakfast', 'lunch', 'dinner'],
        dietaryRestrictions: [],
      }
    };

    this.users.set(uid, user);
    this.recipes.set(uid, new Map());
    this.mealPlans.set(uid, new Map());
    this.cookingLogs.set(uid, []);
    this.currentUser = user;
    return user;
  }

  public signIn(email: string, password: string): UserProfile {
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        if (password === 'wrong-pass') throw new Error('auth/wrong-password');
        this.currentUser = u;
        return u;
      }
    }
    throw new Error('auth/user-not-found');
  }

  public signInWithGoogle(email: string, displayName: string, photoURL?: string): UserProfile {
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        this.currentUser = u;
        return u;
      }
    }

    const uid = `uid_google_${Math.random().toString(36).substring(2, 9)}`;
    const user: UserProfile = {
      uid,
      email,
      displayName,
      photoURL,
      createdAt: new Date(),
      preferences: {
        repeatWindowDays: 5,
        mealsPerDay: ['breakfast', 'lunch', 'dinner'],
        dietaryRestrictions: [],
      }
    };

    this.users.set(uid, user);
    this.recipes.set(uid, new Map());
    this.mealPlans.set(uid, new Map());
    this.cookingLogs.set(uid, []);
    this.currentUser = user;
    return user;
  }

  public signOut() {
    this.currentUser = null;
  }

  public getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  // Recipe operations
  public saveRecipe(userId: string, recipe: Omit<TestRecipe, 'id' | 'userId' | 'timesMade' | 'createdAt'> & { id?: string; createdAt?: Date; timesMade?: number; updatedAt?: Date; dietaryTags?: string[] }): TestRecipe {
    const userRecipes = this.recipes.get(userId) || new Map();
    const id = recipe.id || `rec_${Math.random().toString(36).substring(2, 9)}`;
    const fullRecipe: TestRecipe = {
      ...recipe,
      id,
      userId,
      timesMade: recipe.timesMade ?? 0,
      createdAt: recipe.createdAt || new Date(),
      updatedAt: recipe.updatedAt || new Date(),
      dietaryTags: recipe.dietaryTags || [],
    };
    userRecipes.set(id, fullRecipe);
    this.recipes.set(userId, userRecipes);
    this.showToast('Recipe saved successfully');
    return fullRecipe;
  }

  public rateRecipe(userId: string, recipeId: string, rating: number): TestRecipe {
    if (rating < 1 || rating > 5) throw new Error('Rating must be between 1 and 5');
    const userRecipes = this.recipes.get(userId);
    if (!userRecipes || !userRecipes.has(recipeId)) throw new Error('Recipe not found');
    const recipe = userRecipes.get(recipeId)!;
    recipe.rating = rating;
    recipe.updatedAt = new Date();
    this.showToast('Rating updated');
    return recipe;
  }

  public markAsCooked(userId: string, recipeId: string, rating?: number): CookingLogEntry {
    const userRecipes = this.recipes.get(userId);
    if (!userRecipes || !userRecipes.has(recipeId)) throw new Error('Recipe not found');
    const recipe = userRecipes.get(recipeId)!;
    recipe.timesMade = (recipe.timesMade || 0) + 1;
    recipe.lastMadeAt = new Date();
    if (rating) recipe.rating = rating;

    const logEntry: CookingLogEntry = {
      id: `log_${Math.random().toString(36).substring(2, 9)}`,
      recipeId,
      recipeName: recipe.name || recipe.title || 'Recipe',
      cookedAt: new Date(),
      rating: rating || recipe.rating,
    };

    const logs = this.cookingLogs.get(userId) || [];
    logs.push(logEntry);
    this.cookingLogs.set(userId, logs);
    this.showToast('Marked as cooked!');
    return logEntry;
  }

  public updateNotes(userId: string, recipeId: string, notes: string): TestRecipe {
    const userRecipes = this.recipes.get(userId);
    if (!userRecipes || !userRecipes.has(recipeId)) throw new Error('Recipe not found');
    const recipe = userRecipes.get(recipeId)!;
    recipe.notes = notes;
    recipe.updatedAt = new Date();
    return recipe;
  }

  public deleteRecipe(userId: string, recipeId: string): boolean {
    const userRecipes = this.recipes.get(userId);
    if (!userRecipes || !userRecipes.has(recipeId)) return false;
    userRecipes.delete(recipeId);
    this.showToast('Recipe deleted');
    return true;
  }

  // Meal Plan operations
  public getOrCreateMealPlan(userId: string, weekId: string): MealPlan {
    let userPlans = this.mealPlans.get(userId);
    if (!userPlans) {
      userPlans = new Map();
      this.mealPlans.set(userId, userPlans);
    }

    if (userPlans.has(weekId)) {
      return userPlans.get(weekId)!;
    }

    const newPlan: MealPlan = {
      id: weekId,
      userId,
      weekStart: getWeekStartDate(weekId),
      meals: {
        monday: {}, tuesday: {}, wednesday: {}, thursday: {},
        friday: {}, saturday: {}, sunday: {},
      },
      createdAt: new Date(),
    };

    userPlans.set(weekId, newPlan);
    return newPlan;
  }

  public assignSlot(userId: string, weekId: string, day: keyof WeekMeals, mealTime: 'breakfast' | 'lunch' | 'dinner', recipe: TestRecipe): MealPlan {
    const plan = this.getOrCreateMealPlan(userId, weekId);
    if (!plan.meals[day]) plan.meals[day] = {};
    plan.meals[day][mealTime] = {
      recipeId: recipe.id,
      recipeName: recipe.name || recipe.title || 'Recipe',
      thumbnailUrl: recipe.thumbnailUrl,
    };
    plan.updatedAt = new Date();
    return plan;
  }

  public clearSlot(userId: string, weekId: string, day: keyof WeekMeals, mealTime: 'breakfast' | 'lunch' | 'dinner'): MealPlan {
    const plan = this.getOrCreateMealPlan(userId, weekId);
    if (plan.meals[day]) {
      delete plan.meals[day][mealTime];
    }
    plan.updatedAt = new Date();
    return plan;
  }

  public clearWeek(userId: string, weekId: string): MealPlan {
    const plan = this.getOrCreateMealPlan(userId, weekId);
    plan.meals = {
      monday: {}, tuesday: {}, wednesday: {}, thursday: {},
      friday: {}, saturday: {}, sunday: {},
    };
    plan.updatedAt = new Date();
    return plan;
  }

  public autoFillPlan(userId: string, weekId: string): MealPlan {
    const plan = this.getOrCreateMealPlan(userId, weekId);
    const user = this.users.get(userId);
    const userRecipes = Array.from(this.recipes.get(userId)?.values() || []);
    const logs = this.cookingLogs.get(userId) || [];
    const prefs = user?.preferences || { repeatWindowDays: 5, mealsPerDay: ['breakfast', 'lunch', 'dinner'], dietaryRestrictions: [] };

    const filledMeals = generateSmartMealPlan(userRecipes, plan.meals, prefs, logs);
    plan.meals = filledMeals;
    plan.updatedAt = new Date();
    this.showToast('Meal plan generated!');
    return plan;
  }

  // Shopping list operations
  public generateShoppingList(userId: string, weekId: string): ShoppingList {
    const plan = this.getOrCreateMealPlan(userId, weekId);
    const userRecipes = this.recipes.get(userId) || new Map();
    const items = aggregateMealPlanIngredients(plan, userRecipes);

    const listKey = `${userId}_${weekId}`;
    const existing = this.shoppingLists.get(listKey);
    const customItems = existing ? existing.items.filter(i => i.isCustom) : [];

    const shoppingList: ShoppingList = {
      id: `shop_${weekId}`,
      userId,
      weekId,
      items: [...items, ...customItems],
      updatedAt: new Date(),
    };

    this.shoppingLists.set(listKey, shoppingList);
    this.showToast('Shopping list updated from meal plan');
    return shoppingList;
  }

  public toggleShoppingItem(userId: string, weekId: string, itemId: string): ShoppingList {
    const listKey = `${userId}_${weekId}`;
    let list = this.shoppingLists.get(listKey);
    if (!list) {
      list = {
        id: `shop_${weekId}`,
        userId,
        weekId,
        items: [],
        updatedAt: new Date(),
      };
      this.shoppingLists.set(listKey, list);
    }

    const item = list.items.find(i => i.id === itemId);
    if (item) {
      item.checked = !item.checked;
      list.updatedAt = new Date();
    }
    return list;
  }

  public addCustomShoppingItem(userId: string, weekId: string, name: string, category: GroceryDepartment = 'Other', amount: number | null = null, unit: string = ''): ShoppingListItem {
    const listKey = `${userId}_${weekId}`;
    let list = this.shoppingLists.get(listKey);
    if (!list) {
      list = {
        id: `shop_${weekId}`,
        userId,
        weekId,
        items: [],
        updatedAt: new Date(),
      };
      this.shoppingLists.set(listKey, list);
    }

    const newItem: ShoppingListItem = {
      id: `custom_${Math.random().toString(36).substring(2, 9)}`,
      name,
      amount,
      unit,
      displayAmount: formatQuantityDisplay(amount, unit),
      category,
      checked: false,
      recipeIds: [],
      recipeTitles: [],
      isCustom: true,
    };

    list.items.push(newItem);
    list.updatedAt = new Date();
    return newItem;
  }

  public clearCheckedShoppingItems(userId: string, weekId: string): ShoppingList {
    const listKey = `${userId}_${weekId}`;
    const list = this.shoppingLists.get(listKey);
    if (list) {
      list.items = list.items.filter(i => !i.checked);
      list.updatedAt = new Date();
    }
    return list!;
  }
}
