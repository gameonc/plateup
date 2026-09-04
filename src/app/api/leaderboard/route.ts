import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Leaderboard API — returns the most cooked recipes this week.
 * 
 * For now, this returns an empty array which triggers the seeded/placeholder
 * data on the landing page. Once we have enough real cooking data,
 * we can query Firestore server-side here.
 * 
 * Future: Add Firebase Admin SDK to aggregate cooking_logs by weekId.
 */
export async function GET() {
  try {
    // Return empty — landing page shows beautiful seed data instead
    return NextResponse.json({ entries: [], weekId: '' });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ entries: [], weekId: '' });
  }
}
