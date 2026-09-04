/**
 * Spoonacular API client for PlateUp
 * Provides beautiful food photos + 380K+ recipes
 * Free tier: 3,000 requests/month (150/day)
 */

export interface SpoonacularRecipe {
  id: number;
  title: string;
  image: string;
  imageType: string;
  servings: number;
  readyInMinutes: number;
  preparationMinutes?: number;
  cookingMinutes?: number;
  sourceUrl?: string;
  summary?: string;
  cuisines: string[];
  dishTypes: string[];
  diets: string[];
  instructions?: string;
  extendedIngredients?: {
    id: number;
    original: string;
    name: string;
    amount: number;
    unit: string;
  }[];
  analyzedInstructions?: {
    name: string;
    steps: {
      number: number;
      step: string;
    }[];
  }[];
}

export interface SpoonacularSearchResult {
  id: number;
  title: string;
  image: string;
  imageType: string;
}

/**
 * Fetch from our server-side Spoonacular proxy
 */
async function spoonacularFetch(endpoint: string, params: Record<string, string> = {}) {
  const searchParams = new URLSearchParams({ endpoint, ...params });
  const response = await fetch(`/api/spoonacular?${searchParams}`);

  if (!response.ok) {
    throw new Error(`Spoonacular API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Search recipes by query (e.g., "chicken pasta")
 */
export async function searchRecipes(query: string, number = 12): Promise<SpoonacularSearchResult[]> {
  const data = await spoonacularFetch('/recipes/complexSearch', {
    query,
    number: number.toString(),
  });
  return data.results || [];
}

/**
 * Get random recipes, optionally filtered by tags
 */
export async function getRandomRecipes(number = 12, tags?: string): Promise<SpoonacularRecipe[]> {
  const params: Record<string, string> = { number: number.toString() };
  if (tags) params.tags = tags;
  const data = await spoonacularFetch('/recipes/random', params);
  return data.recipes || [];
}

/**
 * Get full recipe details by ID
 */
export async function getRecipeById(id: number): Promise<SpoonacularRecipe | null> {
  try {
    const data = await spoonacularFetch(`/recipes/${id}/information`, {
      includeNutrition: 'false',
    });
    return data;
  } catch {
    return null;
  }
}

/**
 * Search recipes by cuisine
 */
export async function getRecipesByCuisine(cuisine: string, number = 15): Promise<SpoonacularSearchResult[]> {
  const data = await spoonacularFetch('/recipes/complexSearch', {
    cuisine,
    number: number.toString(),
    sort: 'popularity',
  });
  return data.results || [];
}

/**
 * Convert Spoonacular recipe to PlateUp recipe format
 */
export function spoonacularToRecipeData(recipe: SpoonacularRecipe) {
  const ingredients = (recipe.extendedIngredients || []).map((ing) => ({
    item: ing.name,
    amount: ing.amount.toString(),
    unit: ing.unit,
  }));

  const instructions: string[] = [];
  if (recipe.analyzedInstructions?.length) {
    for (const group of recipe.analyzedInstructions) {
      for (const step of group.steps) {
        instructions.push(step.step);
      }
    }
  }

  const dietaryTags = recipe.diets?.map((d) => d.toLowerCase()) || [];

  return {
    name: recipe.title,
    description: recipe.summary?.replace(/<[^>]*>/g, '').substring(0, 300) || '',
    prepTimeMinutes: recipe.preparationMinutes || Math.round(recipe.readyInMinutes * 0.3),
    cookTimeMinutes: recipe.cookingMinutes || Math.round(recipe.readyInMinutes * 0.7),
    servings: recipe.servings,
    difficulty: (recipe.readyInMinutes <= 30 ? 'easy' : recipe.readyInMinutes <= 60 ? 'medium' : 'hard') as 'easy' | 'medium' | 'hard',
    tags: [...(recipe.cuisines || []), ...(recipe.dishTypes || [])],
    dietaryTags,
    ingredients,
    instructions,
    thumbnailUrl: recipe.image,
    sourceUrl: recipe.sourceUrl,
    source: 'discover' as const,
    rating: 0,
  };
}
