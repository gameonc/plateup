import { getGenerativeModel, Schema } from 'firebase/ai';
import { ai } from './firebase';

// Define the recipe JSON schema for structured output
const recipeSchema = Schema.object({
  properties: {
    name: Schema.string(),
    description: Schema.string(),
    prepTimeMinutes: Schema.integer(),
    cookTimeMinutes: Schema.integer(),
    servings: Schema.integer(),
    difficulty: Schema.enumString({ enum: ['easy', 'medium', 'hard'] }),
    tags: Schema.array({ items: Schema.string() }),
    ingredients: Schema.array({
      items: Schema.object({
        properties: {
          item: Schema.string(),
          amount: Schema.string(),
          unit: Schema.string(),
        },
        optionalProperties: [],
      }),
    }),
    instructions: Schema.array({ items: Schema.string() }),
  },
  optionalProperties: ['description'],
});

// Create the model configured for recipe JSON output
export const recipeModel = getGenerativeModel(ai, {
  model: 'gemini-2.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: recipeSchema,
    temperature: 0.3, // Lower temperature for more accurate recipe extraction
  },
});

// Create a general model for meal planning suggestions
export const chatModel = getGenerativeModel(ai, {
  model: 'gemini-2.5-flash',
  generationConfig: {
    temperature: 0.7,
  },
});

// Prompts
export const YOUTUBE_RECIPE_PROMPT = `You are a professional chef and recipe extractor. Given the following YouTube video transcript from a cooking video, extract the complete recipe with precise measurements and clear instructions.

If the transcript does not contain a cooking recipe, still try to identify any food or dish mentioned and provide a reasonable recipe for it.

Video Title: {title}
Video Description: {description}

Transcript:
{transcript}

Extract the complete recipe with accurate ingredient amounts, clear step-by-step instructions, and appropriate tags (cuisine type, meal type, dietary info).`;

export const IMAGE_RECIPE_PROMPT = `You are a professional chef and food identifier. Look at this image of food or a restaurant menu item and:

1. Identify the dish/food in the image
2. Provide the complete recipe to recreate it at home
3. Include precise ingredient measurements
4. Write clear, step-by-step cooking instructions
5. Estimate prep time, cook time, servings, and difficulty
6. Add relevant tags (cuisine type, meal type, dietary info)

If this is a menu, extract the dish name and provide a recipe for it.`;

export const MEAL_PLAN_PROMPT = `You are a meal planning assistant. Given the user's saved recipes and their recent cooking history, create a balanced weekly meal plan.

Rules:
- Do NOT suggest any recipe that was cooked in the last {repeatWindow} days
- Vary cuisine types across the week (don't put similar cuisines on consecutive days)
- Balance difficulty levels (easier meals on weekdays, more involved on weekends)
- Respect any locked/pre-filled meal slots

Available Recipes:
{recipes}

Recently Cooked (avoid these):
{recentlyCooked}

Locked Slots (keep these as-is):
{lockedSlots}

Create a 7-day meal plan for {mealTimes}. Return the plan as a JSON object.`;
