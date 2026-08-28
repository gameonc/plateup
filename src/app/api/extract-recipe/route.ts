import { NextRequest, NextResponse } from 'next/server';
import { recipeModel, YOUTUBE_RECIPE_PROMPT, IMAGE_RECIPE_PROMPT, TRANSCRIPT_RECIPE_PROMPT } from '@/lib/ai-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, youtubeUrl, imageBase64, mimeType, title, description, transcript } = body;

    let result;

    if (type === 'youtube-video') {
      // Pass YouTube URL directly to Gemini — it watches the video
      result = await recipeModel.generateContent({
        contents: [{
          role: 'user',
          parts: [
            { text: YOUTUBE_RECIPE_PROMPT + `\n\nYouTube Video URL: ${youtubeUrl}` },
            {
              fileData: {
                fileUri: youtubeUrl,
                mimeType: 'video/*',
              },
            },
          ],
        }],
      });
    } else if (type === 'youtube-transcript') {
      // Use transcript text to extract recipe
      const prompt = TRANSCRIPT_RECIPE_PROMPT
        .replace('{title}', title || '')
        .replace('{description}', description || '')
        .replace('{transcript}', (transcript || '').substring(0, 15000));
      
      result = await recipeModel.generateContent(prompt);
    } else if (type === 'image') {
      // Analyze food image
      if (!imageBase64 || !mimeType) {
        return NextResponse.json({ error: 'Image data and MIME type are required' }, { status: 400 });
      }
      
      result = await recipeModel.generateContent({
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
    } else {
      return NextResponse.json({ error: 'Invalid extraction type' }, { status: 400 });
    }

    const jsonText = result.response.text();
    const cleanJson = jsonText.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim();
    
    try {
      const recipe = JSON.parse(cleanJson);
      return NextResponse.json({ recipe });
    } catch {
      console.error('Failed to parse Gemini output:', jsonText);
      return NextResponse.json({ error: 'Failed to parse the recipe from the AI response.' }, { status: 500 });
    }
  } catch (error) {
    console.error('Recipe extraction error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
