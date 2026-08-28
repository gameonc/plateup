import type { DietaryRestriction } from '@/types';

export interface ExtractedRecipe {
  name: string;
  description?: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  dietaryTags?: string[];
  ingredients: {
    item: string;
    amount: string;
    unit: string;
  }[];
  instructions: string[];
}

/**
 * Deterministic dietary tag detector to complement and validate AI extraction
 */
export function detectDietaryTags(
  ingredients: { item: string }[],
  instructions: string[] = []
): DietaryRestriction[] {
  const text = (
    ingredients.map((i) => i.item).join(' ') +
    ' ' +
    instructions.join(' ')
  ).toLowerCase();

  const tags: DietaryRestriction[] = [];

  const hasMeat = /\b(beef|pork|chicken|guanciale|bacon|turkey|lamb|veal|prosciutto|pancetta|sausage|duck|venison|meat)\b/.test(text);
  const hasFish = /\b(salmon|tuna|fish|shrimp|cod|anchov|tilapia|halibut|trout|crab|lobster|scallop|clam|mussel|calamari|squid|seafood)\b/.test(text);
  const hasDairy = /\b(milk|cream|butter|cheese|pecorino|parmesan|cheddar|mozzarella|yogurt|whey|ricotta|ghee|sour cream|half and half)\b/.test(text);
  const hasGluten = /\b(flour|wheat|spaghetti|pasta|sourdough|bread|bun|buns|tortilla|tortillas|soy sauce|barley|rye|noodle|noodles|panko|couscous)\b/.test(text);
  const hasNuts = /\b(peanut|peanuts|almond|almonds|walnut|walnuts|cashew|cashews|pecan|pecans|hazelnut|hazelnuts|macadamia|pistachio|pistachios|nut|nuts)\b/.test(text);

  if (!hasMeat && !hasFish) tags.push('vegetarian');
  if (!hasMeat && !hasFish && !hasDairy) tags.push('vegan');
  if (!hasGluten) tags.push('gluten-free');
  if (!hasDairy) tags.push('dairy-free');
  if (!hasNuts) tags.push('nut-free');
  if (!hasMeat && hasFish) tags.push('pescatarian');

  return tags;
}

function processExtractedRecipe(raw: Record<string, unknown>): ExtractedRecipe {
  const ingredients = Array.isArray(raw.ingredients)
    ? (raw.ingredients as { item: string; amount: string; unit: string }[])
    : [];
  const instructions = Array.isArray(raw.instructions)
    ? (raw.instructions as string[])
    : [];

  const detected = detectDietaryTags(ingredients, instructions);
  const rawDietary = Array.isArray(raw.dietaryTags)
    ? (raw.dietaryTags as string[]).map((t) => t.toLowerCase())
    : [];

  const combinedDietaryTags = Array.from(new Set([...rawDietary, ...detected]));

  return {
    name: (raw.name as string) || 'Extracted Recipe',
    description: (raw.description as string) || '',
    prepTimeMinutes: typeof raw.prepTimeMinutes === 'number' ? raw.prepTimeMinutes : 15,
    cookTimeMinutes: typeof raw.cookTimeMinutes === 'number' ? raw.cookTimeMinutes : 20,
    servings: typeof raw.servings === 'number' ? raw.servings : 4,
    difficulty: (['easy', 'medium', 'hard'].includes(raw.difficulty as string)
      ? raw.difficulty
      : 'medium') as 'easy' | 'medium' | 'hard',
    tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : [],
    dietaryTags: combinedDietaryTags,
    ingredients,
    instructions,
  };
}

/**
 * Call our server-side API route which uses the Gemini API key securely.
 */
async function callExtractAPI(body: Record<string, unknown>): Promise<ExtractedRecipe> {
  const response = await fetch('/api/extract-recipe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to extract recipe.');
  }

  return processExtractedRecipe(data.recipe);
}

/**
 * Extract recipe from YouTube video — Gemini watches the video directly (server-side).
 */
export async function extractRecipeFromYouTubeUrl(
  youtubeUrl: string
): Promise<ExtractedRecipe> {
  return callExtractAPI({ type: 'youtube-video', youtubeUrl });
}

/**
 * Extract recipe from YouTube video transcript (server-side).
 */
export async function extractRecipeFromTranscript(
  title: string,
  description: string,
  transcript: string
): Promise<ExtractedRecipe> {
  return callExtractAPI({ type: 'youtube-transcript', title, description, transcript });
}

/**
 * Extract recipe from food image (server-side).
 */
export async function extractRecipeFromImage(
  imageBase64: string,
  mimeType: string
): Promise<ExtractedRecipe> {
  if (!mimeType.startsWith('image/')) {
    throw new Error('Invalid file type. Please provide an image.');
  }
  return callExtractAPI({ type: 'image', imageBase64, mimeType });
}

/**
 * Measurement vocabulary for detecting recipe content in descriptions.
 */
const MEASUREMENT_PATTERN =
  /\d+\s*(?:cups?|tbsp|tsp|tablespoons?|teaspoons?|oz|ounces?|lbs?|pounds?|cloves?|grams?|ml|sticks?|pints?|quarts?)\b/gi;

function hasRecipeSignal(text: string): boolean {
  return (text.match(MEASUREMENT_PATTERN) || []).length >= 3;
}

function isThinRecipe(recipe: ExtractedRecipe): boolean {
  return recipe.ingredients.length < 3 || recipe.instructions.length === 0;
}

/**
 * Layered YouTube extraction — try description first (cheap), fall back to video (thorough).
 */
export async function extractRecipeFromYouTube(
  youtubeUrl: string,
  onEscalate?: () => void
): Promise<ExtractedRecipe> {
  try {
    const response = await fetch('/api/youtube-recipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: youtubeUrl }),
    });

    if (response.ok) {
      const data = await response.json();

      if (typeof data?.transcript === 'string' && hasRecipeSignal(data.transcript)) {
        const recipe = await extractRecipeFromTranscript(
          data.title ?? '',
          data.description ?? '',
          data.transcript
        );

        if (!isThinRecipe(recipe)) return recipe;
      }
    }
  } catch (error) {
    console.warn('Description path unavailable, escalating to video:', error);
  }

  onEscalate?.();
  return extractRecipeFromYouTubeUrl(youtubeUrl);
}
