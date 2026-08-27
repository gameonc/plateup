import type { Recipe, WeekMeals, DayOfWeek, MealTime, DietaryRestriction } from '@/types';

export const DAYS_OF_WEEK: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
export const MEAL_TIMES: MealTime[] = ['breakfast', 'lunch', 'dinner'];

export function createEmptyWeekMeals(): WeekMeals {
  return {
    monday: {}, tuesday: {}, wednesday: {}, thursday: {},
    friday: {}, saturday: {}, sunday: {},
  };
}

export function formatDayName(day: DayOfWeek): string {
  return day.charAt(0).toUpperCase() + day.slice(1);
}

export function formatMealTime(meal: MealTime): string {
  return meal.charAt(0).toUpperCase() + meal.slice(1);
}

export function generateMealPlan(
  allRecipes: Recipe[],
  recentRecipeIds: Set<string>,
  lockedSlots: Partial<WeekMeals>,
  _repeatWindowDays?: number,
  dietaryRestrictions?: DietaryRestriction[]
): WeekMeals {
  void _repeatWindowDays;
  const plan = createEmptyWeekMeals();
  
  // Initialize with locked slots
  for (const day of DAYS_OF_WEEK) {
    if (lockedSlots[day]) {
      plan[day] = { ...lockedSlots[day] };
    }
  }

  // 1. Strictly filter candidate recipes by dietary restrictions (R4)
  let candidateRecipes = allRecipes;
  if (dietaryRestrictions && dietaryRestrictions.length > 0) {
    candidateRecipes = allRecipes.filter((recipe) => {
      const recipeDietTags = [
        ...(Array.isArray(recipe.dietaryTags) ? recipe.dietaryTags.map((t) => t.toLowerCase()) : []),
        ...(Array.isArray(recipe.tags) ? recipe.tags.map((t) => t.toLowerCase()) : []),
      ];
      return dietaryRestrictions.every((req) => recipeDietTags.includes(req.toLowerCase()));
    });
  }

  if (candidateRecipes.length === 0) {
    // If 0 recipes match the requested dietary restrictions, preserve locked slots and return
    return plan;
  }

  // 2. Filter out recently cooked recipes
  let availableRecipes = candidateRecipes.filter((r) => !recentRecipeIds.has(r.id));
  if (availableRecipes.length === 0) {
    availableRecipes = candidateRecipes; // Fallback to all compliant if all are recently cooked
  }
  if (availableRecipes.length === 0) return plan; // No recipes at all
  
  // Group by tags for variety
  const tagsMap = new Map<string, Recipe[]>();
  const untagged: Recipe[] = [];
  
  for (const r of availableRecipes) {
    if (!r.tags || r.tags.length === 0) {
      untagged.push(r);
    } else {
      for (const tag of r.tags) {
        if (!tagsMap.has(tag)) tagsMap.set(tag, []);
        tagsMap.get(tag)!.push(r);
      }
    }
  }
  
  const tagGroups = Array.from(tagsMap.values());
  if (untagged.length > 0) tagGroups.push(untagged);
  if (tagGroups.length === 0) tagGroups.push(availableRecipes);
  
  let currentGroupIndex = 0;
  
  const getNextRecipe = (day: DayOfWeek, excludeIds: Set<string>): Recipe | null => {
    let attempts = 0;
    while (attempts < tagGroups.length * 2) {
      const group = tagGroups[currentGroupIndex];
      const isWeekend = day === 'saturday' || day === 'sunday';
      
      const validRecipes = group.filter(r => !excludeIds.has(r.id));
      if (validRecipes.length === 0) {
        currentGroupIndex = (currentGroupIndex + 1) % tagGroups.length;
        attempts++;
        continue;
      }
      
      // Prefer easy for weekdays, harder for weekends
      let preferred = validRecipes.filter(r => isWeekend ? r.difficulty !== 'easy' : r.difficulty === 'easy');
      if (preferred.length === 0) preferred = validRecipes;
      
      const recipe = preferred[Math.floor(Math.random() * preferred.length)];
      
      // Move to next group for variety
      currentGroupIndex = (currentGroupIndex + 1) % tagGroups.length;
      return recipe;
    }
    
    // Fallback to random available recipe not excluded
    const randomFallback = availableRecipes.filter(r => !excludeIds.has(r.id));
    if (randomFallback.length > 0) {
      return randomFallback[Math.floor(Math.random() * randomFallback.length)];
    }
    
    return null;
  };

  const usedInPlan = new Set<string>();

  for (let i = 0; i < DAYS_OF_WEEK.length; i++) {
    const day = DAYS_OF_WEEK[i];
    const prevDay = i > 0 ? DAYS_OF_WEEK[i - 1] : null;
    
    const previousDayRecipeIds = new Set<string>();
    if (prevDay) {
      Object.values(plan[prevDay]).forEach(slot => {
        if (slot) previousDayRecipeIds.add(slot.recipeId);
      });
    }

    for (const meal of MEAL_TIMES) {
      if (!plan[day][meal]) {
        // Try to avoid recipes already used in this plan AND previous day
        const excludeIds = new Set([...previousDayRecipeIds, ...usedInPlan]);
        
        let recipe = getNextRecipe(day, excludeIds);
        
        if (!recipe) { 
          // Relax constraint: allow reusing from earlier in the week, but still avoid yesterday
          recipe = getNextRecipe(day, previousDayRecipeIds);
        }
        
        if (!recipe) {
          // Ultimate fallback: any available recipe
          recipe = getNextRecipe(day, new Set());
        }
        
        if (recipe) {
          plan[day][meal] = {
            recipeId: recipe.id,
            recipeName: recipe.name || 'Unknown',
            thumbnailUrl: recipe.thumbnailUrl,
          };
          usedInPlan.add(recipe.id);
        }
      }
    }
  }

  return plan;
}
