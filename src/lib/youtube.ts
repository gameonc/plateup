import { Innertube } from 'youtubei.js';

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

export async function extractYouTubeData(videoId: string): Promise<YouTubeVideoData> {
  const youtube = await Innertube.create();
  const info = await youtube.getInfo(videoId);

  const title = info.basic_info.title || 'Unknown';
  const description = info.basic_info.short_description || '';
  const thumbnails = info.basic_info.thumbnail;
  const thumbnailUrl = thumbnails?.[thumbnails.length - 1]?.url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  // Extract transcript
  let transcript = '';
  try {
    const transcriptData = await info.getTranscript();
    const segments = transcriptData?.transcript?.content?.body?.initial_segments;
    if (segments) {
      transcript = segments
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((seg: any) => seg.snippet?.text)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((seg: any) => seg.snippet.text)
        .join(' ');
    }
  } catch (err) {
    // If transcript is not available, use the description as fallback
    console.warn(`Could not fetch transcript for ${videoId}. Falling back to description.`, err);
    transcript = description;
  }

  if (!transcript || transcript.trim().length < 50) {
    throw new Error('Could not extract a meaningful transcript from this video. The video may not have captions enabled.');
  }

  return { title, description, thumbnailUrl, transcript };
}
