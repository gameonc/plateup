import { NextRequest, NextResponse } from 'next/server';

const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;
const SPOONACULAR_BASE = 'https://api.spoonacular.com';

export async function GET(request: NextRequest) {
  if (!SPOONACULAR_API_KEY) {
    return NextResponse.json({ error: 'Spoonacular API key not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');

  if (!endpoint || !endpoint.startsWith('/recipes')) {
    return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
  }

  // Build the Spoonacular URL with the API key
  const url = new URL(`${SPOONACULAR_BASE}${endpoint}`);
  url.searchParams.set('apiKey', SPOONACULAR_API_KEY);

  // Forward all other params
  searchParams.forEach((value, key) => {
    if (key !== 'endpoint') {
      url.searchParams.set(key, value);
    }
  });

  try {
    const response = await fetch(url.toString(), {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 3600 }, // Cache for 1 hour to save quota
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Spoonacular API error:', error);
      return NextResponse.json({ error: 'Failed to fetch from Spoonacular' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    console.error('Spoonacular proxy error:', error);
    return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 });
  }
}
