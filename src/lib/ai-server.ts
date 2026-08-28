// Server-side Gemini AI configuration
// This file runs ONLY on the server — the API key never reaches the client

import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// Server-side only key — NOT prefixed with NEXT_PUBLIC_
const API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

// Recipe JSON schema for structured output
const recipeSchema = {
  type: SchemaType.OBJECT,
  properties: {
    name: { type: SchemaType.STRING },
    description: { type: SchemaType.STRING },
    prepTimeMinutes: { type: SchemaType.INTEGER },
    cookTimeMinutes: { type: SchemaType.INTEGER },
    servings: { type: SchemaType.INTEGER },
    difficulty: { type: SchemaType.STRING, enum: ['easy', 'medium', 'hard'] },
    tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    dietaryTags: { 
      type: SchemaType.ARRAY, 
      items: { type: SchemaType.STRING },
    },
    ingredients: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          item: { type: SchemaType.STRING },
          amount: { type: SchemaType.STRING },
          unit: { type: SchemaType.STRING },
        },
        required: ['item', 'amount', 'unit'],
      },
    },
    instructions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
  },
  required: ['name', 'prepTimeMinutes', 'cookTimeMinutes', 'servings', 'difficulty', 'tags', 'ingredients', 'instructions'],
};

export const recipeModel = genAI.getGenerativeModel({
  model: 'gemini-3.6-flash',
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: recipeSchema as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    temperature: 0.3,
  },
});

export const YOUTUBE_RECIPE_PROMPT = `You are a professional chef and recipe extractor. Watch this YouTube cooking video and extract the complete recipe.

Extract:
- Recipe name
- Description of the dish
- Prep time and cook time in minutes
- Number of servings
- Difficulty (easy/medium/hard)
- All ingredients with exact amounts and units
- Step-by-step cooking instructions
- Relevant tags (cuisine type, meal type)
- Dietary tags from: 'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'low-carb', 'pescatarian', 'nut-free'

Watch the entire video carefully and extract every ingredient and instruction.`;

export const IMAGE_RECIPE_PROMPT = `You are a professional chef and food identifier. Look at this image of food or a restaurant menu item and:

1. Identify the dish/food in the image
2. Provide the complete recipe to recreate it at home
3. Include precise ingredient measurements
4. Write clear, step-by-step cooking instructions
5. Estimate prep time, cook time, servings, and difficulty
6. Analyze all ingredients and instructions to accurately tag dietary attributes in dietaryTags ('vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'low-carb', 'pescatarian', 'nut-free')
7. Add relevant cuisine and meal tags

If this is a menu, extract the dish name and provide a recipe for it.`;

export const TRANSCRIPT_RECIPE_PROMPT = `You are a professional chef and recipe extractor. Given the following YouTube video transcript from a cooking video, extract the complete recipe with precise measurements and clear instructions.

If the transcript does not contain a cooking recipe, still try to identify any food or dish mentioned and provide a reasonable recipe for it.

Video Title: {title}
Video Description: {description}

Transcript:
{transcript}

Analyze all ingredients and instructions carefully to accurately populate dietaryTags matching the standard taxonomy:
- 'vegetarian': contains no meat, poultry, or fish/seafood
- 'vegan': 100% plant-based; contains no meat, fish, dairy (milk/butter/cheese), eggs, or animal derivatives
- 'gluten-free': contains no wheat, flour, bread, pasta, barley, rye, or gluten
- 'dairy-free': contains no milk, cream, butter, cheese, yogurt, or dairy
- 'keto': high-fat, ultra low-carbohydrate
- 'low-carb': reduced total carbohydrates
- 'pescatarian': no meat/poultry, but contains fish/seafood
- 'nut-free': contains no peanuts or tree nuts (almond, walnut, cashew, pecan, etc.)

Extract the complete recipe with accurate ingredient amounts, clear step-by-step instructions, and appropriate tags and dietaryTags.`;
