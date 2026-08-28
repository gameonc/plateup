import { recipeModel, YOUTUBE_RECIPE_PROMPT, IMAGE_RECIPE_PROMPT } from './ai';
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
 * Extract recipe from YouTube video by passing the URL directly to Gemini.
 * Gemini 2.5 Flash can watch YouTube videos natively — no transcript scraping needed.
 */
export async function extractRecipeFromYouTubeUrl(
  youtubeUrl: string
): Promise<ExtractedRecipe> {
  const prompt = `You are a professional chef and recipe extractor. Watch this YouTube cooking video and extract the complete recipe.

YouTube Video URL: ${youtubeUrl}

Extract:
- Recipe name
- Description of the dish
- Prep time and cook time in minutes
- Number of servings
- Difficulty (easy/medium/hard)
- All ingredients with exact amounts and units
- Step-by-step cooking instructions
- Relevant tags (cuisine type, meal type like breakfast/lunch/dinner)
- Dietary tags from: 'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'low-carb', 'pescatarian', 'nut-free'

Watch the entire video carefully and extract every ingredient and instruction.`;

  const result = await recipeModel.generateContent({
    contents: [{
      role: 'user',
      parts: [
        { text: prompt },
        {
          fileData: {
            fileUri: youtubeUrl,
            mimeType: 'video/*',
          },
        },
      ],
    }],
  });

  const jsonText = result.response.text();
  const cleanJson = jsonText.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim();
  
  try {
    const raw = JSON.parse(cleanJson);
    return processExtractedRecipe(raw);
  } catch (error) {
    console.error('Failed to parse Gemini recipe output:', jsonText, error);
    throw new Error('Failed to parse the recipe from the AI response.');
  }
}

/**
 * Extract recipe from YouTube video transcript using Gemini AI (legacy fallback)
 */
export async function extractRecipeFromTranscript(
  title: string,
  description: string,
  transcript: string
): Promise<ExtractedRecipe> {
  const prompt = YOUTUBE_RECIPE_PROMPT
    .replace('{title}', title)
    .replace('{description}', description)
    .replace('{transcript}', transcript.substring(0, 15000));
  
  const result = await recipeModel.generateContent(prompt);
  const jsonText = result.response.text();
  const cleanJson = jsonText.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim();
  
  try {
    const raw = JSON.parse(cleanJson);
    return processExtractedRecipe(raw);
  } catch (error) {
    console.error('Failed to parse Gemini recipe output:', jsonText, error);
    throw new Error('Failed to parse the recipe from the AI response.');
  }
}

/**
 * Extract recipe from food image using Gemini AI
 */
export async function extractRecipeFromImage(
  imageBase64: string,
  mimeType: string
): Promise<ExtractedRecipe> {
  if (!mimeType.startsWith('image/')) {
    throw new Error('Invalid file type. Please provide an image.');
  }

  const result = await recipeModel.generateContent({
    contents: [{
      role: 'user',
      parts: [
        { text: IMAGE_RECIPE_PROMPT },
        {
          inlineData: {
            data: imageBase64,
            mimeType,
          },
        },
      ],
    }],
  });
  const jsonText = result.response.text();
  const cleanJson = jsonText.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim();
  
  try {
    const raw = JSON.parse(cleanJson);
    return processExtractedRecipe(raw);
  } catch (error) {
    console.error('Failed to parse Gemini recipe output:', jsonText, error);
    throw new Error('Failed to parse the recipe from the AI response.');
  }
}

/**
 * Measurement vocabulary mirrors the ingredient terms already used by
 * detectDietaryTags, kept deliberately narrow so promo blurbs don't register.
 */
const MEASUREMENT_PATTERN =
  /\d+\s*(?:cups?|tbsp|tsp|tablespoons?|teaspoons?|oz|ounces?|lbs?|pounds?|cloves?|grams?|ml|sticks?|pints?|quarts?)\b/gi;

/** A description only counts as a recipe source if it carries real quantities. */
function hasRecipeSignal(text: string): boolean {
  return (text.match(MEASUREMENT_PATTERN) || []).length >= 3;
}

/** Guard against the cheap path returning a plausible-looking but empty recipe. */
function isThinRecipe(recipe: ExtractedRecipe): boolean {
  return recipe.ingredients.length < 3 || recipe.instructions.length === 0;
}

/**
 * Layered YouTube extraction.
 *
 * Many cooking channels publish the full ingredient list in the video
 * description, which is far cheaper and faster to read than having Gemini watch
 * the video. So: try the description first, and fall back to the video whenever
 * that path is unavailable, unconvincing, or produces a thin result.
 *
 * The description must be fetched server-side — the browser cannot fetch
 * youtube.com directly (CORS).
 *
 * @param onEscalate called when falling back to the (slower) video path, so the
 *                   UI can explain the wait.
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
    // A failure here is never fatal — it just means we take the video path.
    console.warn('Description path unavailable, escalating to video:', error);
  }

  onEscalate?.();
  return extractRecipeFromYouTubeUrl(youtubeUrl);
}
