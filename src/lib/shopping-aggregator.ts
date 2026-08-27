import type { MealPlan, Recipe, ShoppingListItem, DayOfWeek, MealTime, GroceryDepartment } from '../types/index.ts';
import {
  parseFractionOrAmount,
  formatQuantityDisplay,
  normalizeUnit,
  categorizeIngredientDepartment,
  GROCERY_DEPARTMENTS,
} from './ingredient-parser.ts';

export {
  parseFractionOrAmount,
  formatQuantityDisplay,
  normalizeUnit,
  categorizeIngredientDepartment,
  GROCERY_DEPARTMENTS,
};

const DAYS_OF_WEEK: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const MEAL_TIMES: MealTime[] = ['breakfast', 'lunch', 'dinner'];

/**
 * Aggregates all ingredients across assigned meals in a weekly meal plan.
 * Duplicates with compatible units are normalized, summed, and attributed to source recipes.
 */
export function aggregateMealPlanIngredients(
  mealPlan: MealPlan | null | undefined,
  recipesInput: Map<string, Recipe> | Recipe[]
): ShoppingListItem[] {
  if (!mealPlan || !mealPlan.meals) {
    return [];
  }

  // Create recipe lookup map
  const recipesMap: Map<string, Recipe> =
    recipesInput instanceof Map
      ? recipesInput
      : new Map(recipesInput.map((r) => [r.id, r]));

  const aggregatedMap = new Map<
    string,
    {
      name: string;
      totalAmount: number;
      unit: string;
      category: GroceryDepartment;
      recipeIds: Set<string>;
      recipeTitles: Set<string>;
    }
  >();

  for (const day of DAYS_OF_WEEK) {
    const dayMeals = mealPlan.meals[day];
    if (!dayMeals) continue;

    for (const mealTime of MEAL_TIMES) {
      const slot = dayMeals[mealTime];
      if (!slot || !slot.recipeId) continue;

      const recipe = recipesMap.get(slot.recipeId);
      if (!recipe || !recipe.ingredients) continue;

      for (const ing of recipe.ingredients) {
        const rawName = (ing.name || ing.item || '').trim();
        if (!rawName) continue;

        const { normalizedUnit } = normalizeUnit(ing.unit);
        const amountNum = parseFractionOrAmount(ing.amount);
        const dept = categorizeIngredientDepartment(rawName, ing.category);

        const key = `${rawName.toLowerCase()}_${normalizedUnit.toLowerCase()}`;
        const recipeTitle =
          recipe.name ||
          ('title' in recipe && typeof (recipe as { title?: unknown }).title === 'string'
            ? (recipe as { title: string }).title
            : '') ||
          slot.recipeName ||
          'Recipe';

        if (!aggregatedMap.has(key)) {
          aggregatedMap.set(key, {
            name: rawName,
            totalAmount: amountNum,
            unit: normalizedUnit,
            category: dept,
            recipeIds: new Set([recipe.id]),
            recipeTitles: new Set([recipeTitle]),
          });
        } else {
          const entry = aggregatedMap.get(key)!;
          entry.totalAmount += amountNum;
          entry.recipeIds.add(recipe.id);
          entry.recipeTitles.add(recipeTitle);
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
      createdAt: new Date(),
    });
  }

  return items;
}

/**
 * Extracts and aggregates ingredients from a single recipe into shopping list items.
 */
export function aggregateRecipeIngredients(recipe: Recipe): ShoppingListItem[] {
  if (!recipe || !recipe.ingredients || recipe.ingredients.length === 0) {
    return [];
  }

  const items: ShoppingListItem[] = [];
  let index = 1;
  const recipeTitle =
    recipe.name ||
    ('title' in recipe && typeof (recipe as { title?: unknown }).title === 'string'
      ? (recipe as { title: string }).title
      : '') ||
    'Recipe';

  for (const ing of recipe.ingredients) {
    const rawName = (ing.name || ing.item || '').trim();
    if (!rawName) continue;

    const { normalizedUnit } = normalizeUnit(ing.unit);
    const amountNum = parseFractionOrAmount(ing.amount);
    const dept = categorizeIngredientDepartment(rawName, ing.category);

    items.push({
      id: `recipe_${recipe.id}_${index++}`,
      name: rawName,
      amount: amountNum,
      unit: normalizedUnit,
      displayAmount: formatQuantityDisplay(amountNum, normalizedUnit),
      category: dept,
      checked: false,
      recipeIds: [recipe.id],
      recipeTitles: [recipeTitle],
      isCustom: false,
      createdAt: new Date(),
    });
  }

  return items;
}

/**
 * Merges freshly generated meal plan items with existing items, preserving custom items
 * and existing checked states where applicable.
 */
export function mergeShoppingListWithCustomItems(
  existingItems: ShoppingListItem[],
  newPlanItems: ShoppingListItem[]
): ShoppingListItem[] {
  // Preserve all custom items
  const customItems = existingItems.filter((i) => i.isCustom);

  // Map of previously checked items by key
  const checkedKeys = new Set(
    existingItems
      .filter((i) => i.checked && !i.isCustom)
      .map((i) => `${i.name.toLowerCase()}_${i.unit.toLowerCase()}`)
  );

  const updatedPlanItems = newPlanItems.map((item) => {
    const key = `${item.name.toLowerCase()}_${item.unit.toLowerCase()}`;
    return {
      ...item,
      checked: checkedKeys.has(key),
    };
  });

  return [...updatedPlanItems, ...customItems];
}
