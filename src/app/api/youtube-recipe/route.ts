import { NextResponse } from 'next/server';
import { extractVideoId, extractYouTubeData } from '@/lib/youtube';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Valid YouTube URL is required' },
        { status: 400 }
      );
    }

    const videoId = extractVideoId(url);
    
    if (!videoId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL. Could not parse video ID.' },
        { status: 400 }
      );
    }

    const data = await extractYouTubeData(videoId);
    
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('YouTube extraction error:', error);
    
    // Provide a friendly error message for missing captions or invalid videos
    const err = error instanceof Error ? error : (error as { message?: string });
    const message = err?.message || 'Failed to extract video data';
    const status = message.includes('captions enabled') ? 404 : 500;
    
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
