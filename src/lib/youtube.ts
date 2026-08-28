// YouTube transcript extraction using youtube-transcript package
// This works reliably on both local and serverless (Vercel) environments

import { YoutubeTranscript } from 'youtube-transcript';

// Parse video ID from any YouTube URL format
export function extractVideoId(url: string): string | null {
  const regex = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([-\w]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

export interface YouTubeVideoData {
  title: string;
  description: string;
  thumbnailUrl: string;
  transcript: string;
}

// Get video title and description from YouTube's oembed endpoint (lightweight, no auth)
async function fetchVideoMeta(videoId: string): Promise<{ title: string; description: string }> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const resp = await fetch(oembedUrl);
    if (resp.ok) {
      const data = await resp.json();
      return { title: data.title || 'Unknown Video', description: '' };
    }
  } catch {
    // ignore
  }

  // Fallback: try scraping the page for title
  try {
    const resp = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    const html = await resp.text();
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    const title = titleMatch ? titleMatch[1].replace(' - YouTube', '').trim() : 'Unknown Video';
    
    // Try to get description
    const descMatch = html.match(/"description":\{"simpleText":"([\s\S]*?)"\}/);
    const description = descMatch 
      ? descMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
      : '';
    
    return { title, description };
  } catch {
    return { title: 'Unknown Video', description: '' };
  }
}

export async function extractYouTubeData(videoId: string): Promise<YouTubeVideoData> {
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  // Get video metadata
  const meta = await fetchVideoMeta(videoId);

  // Get transcript using youtube-transcript package
  let transcript = '';
  try {
    const segments = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
    transcript = segments.map(s => s.text).join(' ').trim();
  } catch (err) {
    console.warn('youtube-transcript failed:', err);
    
    // Try without language preference
    try {
      const segments = await YoutubeTranscript.fetchTranscript(videoId);
      transcript = segments.map(s => s.text).join(' ').trim();
    } catch (err2) {
      console.warn('youtube-transcript fallback also failed:', err2);
    }
  }

  // If transcript is too short, try using description as supplement
  if ((!transcript || transcript.length < 50) && meta.description && meta.description.length >= 30) {
    transcript = `VIDEO TITLE: ${meta.title}\n\nVIDEO DESCRIPTION:\n${meta.description}`;
  }

  if (!transcript || transcript.length < 30) {
    throw new Error(
      'Could not extract content from this video. The video may not have captions or a detailed description. ' +
      'Try a different cooking video with captions enabled.'
    );
  }

  return {
    title: meta.title,
    description: meta.description,
    thumbnailUrl,
    transcript,
  };
}
