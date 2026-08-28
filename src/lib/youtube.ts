// YouTube video data extraction
// Extracts video title, description, and transcript for recipe extraction
// Uses YouTube's Innertube API with page scrape fallback

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

// Extract full description and any available transcript from YouTube page
async function scrapeYouTubePage(videoId: string): Promise<{
  title: string;
  description: string;
  transcript: string;
}> {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  
  const response = await fetch(watchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml',
    },
  });

  if (!response.ok) throw new Error(`YouTube returned ${response.status}`);
  const html = await response.text();

  // Extract title
  const titleMatch = html.match(/<title>(.*?)<\/title>/);
  const title = titleMatch ? titleMatch[1].replace(' - YouTube', '').trim() : 'Unknown Video';

  // Extract full description from ytInitialData (more complete than meta tag)
  let description = '';
  
  // Try to get description from playerResponse
  const descMatch = html.match(/"description":\{"simpleText":"([\s\S]*?)"\}/);
  if (descMatch) {
    description = descMatch[1]
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }
  
  // Fallback: meta description
  if (!description) {
    const metaMatch = html.match(/<meta name="description" content="(.*?)"/);
    description = metaMatch ? metaMatch[1] : '';
  }

  // Try to get transcript from engagementPanels (auto-generated transcript)
  let transcript = '';
  
  // Look for transcript in ytInitialData
  const transcriptMatch = html.match(/"transcriptRenderer":\{[\s\S]*?"body":\{[\s\S]*?"initial_segments":\[([\s\S]*?)\]/);
  if (transcriptMatch) {
    const segTexts = transcriptMatch[1].matchAll(/"text":"(.*?)"/g);
    const parts: string[] = [];
    for (const m of segTexts) {
      parts.push(m[1]);
    }
    transcript = parts.join(' ');
  }

  return { title, description, transcript };
}

// Try Innertube API for captions
async function fetchCaptionsViaInnertube(videoId: string): Promise<string> {
  const apiUrl = 'https://www.youtube.com/youtubei/v1/player';
  
  const resp = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    body: JSON.stringify({
      videoId,
      context: {
        client: {
          clientName: 'WEB',
          clientVersion: '2.20240101.00.00',
          hl: 'en',
          gl: 'US',
        },
      },
    }),
  });

  if (!resp.ok) return '';
  
  const data = await resp.json();
  const captionTracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
  
  if (captionTracks.length === 0) return '';

  const track = captionTracks.find((t: { languageCode?: string }) => t.languageCode?.startsWith('en'))
    || captionTracks[0];
  
  if (!track?.baseUrl) return '';

  try {
    // Try JSON format
    const captResp = await fetch(track.baseUrl + '&fmt=json3', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    
    if (captResp.ok) {
      const captData = await captResp.json();
      if (captData?.events) {
        return captData.events
          .filter((e: { segs?: { utf8?: string }[] }) => e.segs)
          .map((e: { segs: { utf8?: string }[] }) => 
            e.segs.map((s: { utf8?: string }) => s.utf8 || '').join('')
          )
          .join(' ')
          .replace(/\n/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      }
    }
  } catch {
    // Ignore caption fetch errors
  }

  return '';
}

export async function extractYouTubeData(videoId: string): Promise<YouTubeVideoData> {
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  // Try to get captions via Innertube API (works for some videos)
  let transcript = '';
  try {
    transcript = await fetchCaptionsViaInnertube(videoId);
  } catch (err) {
    console.warn('Innertube caption fetch failed:', err);
  }

  // Always scrape the page for title and description
  let pageData: { title: string; description: string; transcript: string };
  try {
    pageData = await scrapeYouTubePage(videoId);
  } catch (err) {
    console.warn('Page scrape failed:', err);
    pageData = { title: 'Unknown Video', description: '', transcript: '' };
  }

  // Use page transcript if Innertube didn't work
  if (!transcript && pageData.transcript) {
    transcript = pageData.transcript;
  }

  // If still no transcript, use description as content for AI to analyze
  // Video descriptions often contain full recipes, ingredient lists, etc.
  if (!transcript || transcript.length < 50) {
    if (pageData.description && pageData.description.length >= 30) {
      transcript = `VIDEO TITLE: ${pageData.title}\n\nVIDEO DESCRIPTION:\n${pageData.description}`;
    } else {
      throw new Error(
        'Could not extract content from this video. The video may not have captions or a detailed description. ' +
        'Try a different cooking video.'
      );
    }
  }

  return {
    title: pageData.title,
    description: pageData.description,
    thumbnailUrl,
    transcript,
  };
}
