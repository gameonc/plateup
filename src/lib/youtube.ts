// YouTube video metadata extraction.
//
// Note on transcripts: YouTube's timedtext endpoint now returns HTTP 200 with an
// empty body unless the request carries a PO (proof-of-origin) token, so caption
// text is not retrievable by any plain fetch — the `youtube-transcript` package,
// the InnerTube player API, and watch-page scraping all fail the same way. We
// therefore fetch only title/description here and let the caller escalate to
// Gemini (which watches the video directly) when the description is not enough.

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

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

// oembed is lightweight, unauthenticated and not bot-blocked, but it never
// returns a description — only the title.
async function fetchTitleViaOembed(videoId: string): Promise<string | null> {
  try {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const data = await resp.json();
    return typeof data?.title === 'string' ? data.title : null;
  } catch {
    return null;
  }
}

// Decode a raw JSON string body (handles \n, \", \uXXXX) without eval.
function decodeJsonStringLiteral(raw: string): string {
  try {
    return JSON.parse(`"${raw}"`);
  } catch {
    return raw.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
}

// The watch page is the only source that carries the full description.
// `shortDescription` is the stable field; the older "description":{"simpleText"}
// shape is not always present.
async function scrapeWatchPage(
  videoId: string
): Promise<{ title: string | null; description: string }> {
  try {
    const resp = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': BROWSER_UA,
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    if (!resp.ok) return { title: null, description: '' };

    const html = await resp.text();

    const descMatch = html.match(/"shortDescription":"(.*?)","isCrawlable"/);
    const description = descMatch ? decodeJsonStringLiteral(descMatch[1]) : '';

    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    const title = titleMatch
      ? titleMatch[1].replace(/ - YouTube$/, '').trim()
      : null;

    return { title, description };
  } catch {
    return { title: null, description: '' };
  }
}

/**
 * Fetch what we can about a video. Never throws and never returns a transcript —
 * an empty `transcript` is the normal signal for the caller to escalate to the
 * Gemini video path.
 */
export async function extractYouTubeData(videoId: string): Promise<YouTubeVideoData> {
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  // Both sources are independent; run them concurrently and merge.
  const [oembedTitle, page] = await Promise.all([
    fetchTitleViaOembed(videoId),
    scrapeWatchPage(videoId),
  ]);

  const title = oembedTitle || page.title || 'Unknown Video';
  const description = page.description;

  return {
    title,
    description,
    thumbnailUrl,
    transcript: description
      ? `VIDEO TITLE: ${title}\n\nVIDEO DESCRIPTION:\n${description}`
      : '',
  };
}
