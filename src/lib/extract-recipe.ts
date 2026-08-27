import { recipeModel, YOUTUBE_RECIPE_PROMPT, IMAGE_RECIPE_PROMPT } from './ai';

export interface ExtractedRecipe {
  name: string;
  description?: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  ingredients: {
    item: string;
    amount: string;
    unit: string;
  }[];
  instructions: string[];
}

/**
 * Extract recipe from YouTube video transcript using Gemini AI
 */
export async function extractRecipeFromTranscript(
  title: string,
  description: string,
  transcript: string
): Promise<ExtractedRecipe> {
  const prompt = YOUTUBE_RECIPE_PROMPT
    .replace('{title}', title)
    .replace('{description}', description)
    .replace('{transcript}', transcript.substring(0, 15000)); // Limit transcript length to avoid token limits
  
  const result = await recipeModel.generateContent(prompt);
  const jsonText = result.response.text();
  
  try {
    return JSON.parse(jsonText) as ExtractedRecipe;
  } catch (error) {
    console.error('Failed to parse Gemini recipe output:', jsonText);
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
  // Check MIME type is supported
  if (!mimeType.startsWith('image/')) {
    throw new Error('Invalid file type. Please provide an image.');
  }

  const imagePart = {
    inlineData: {
      data: imageBase64,
      mimeType,
    },
  };
  
  const result = await recipeModel.generateContent([IMAGE_RECIPE_PROMPT, imagePart]);
  const jsonText = result.response.text();
  
  try {
    return JSON.parse(jsonText) as ExtractedRecipe;
  } catch (error) {
    console.error('Failed to parse Gemini recipe output:', jsonText);
    throw new Error('Failed to parse the recipe from the AI response.');
  }
}
