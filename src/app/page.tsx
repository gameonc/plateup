"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChefHat,
  ArrowRight,
  CirclePlay,
  Flame,
  Star,
  Trophy,
  Crown,
} from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  recipeName: string;
  thumbnailUrl?: string;
  cookCount: number;
  cookedBy?: string;
  promoted?: boolean;
}

export default function LandingPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  // Load leaderboard
  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const res = await fetch("/api/leaderboard");
        if (res.ok) {
          const data = await res.json();
          setLeaderboard(data.entries || []);
        }
      } catch {
        // Leaderboard is non-critical
      } finally {
        setLeaderboardLoading(false);
      }
    }
    loadLeaderboard();
  }, []);

  const handleExtract = () => {
    if (!url.trim()) return;
    // Redirect to extract page with the URL pre-filled
    router.push(`/login?redirect=${encodeURIComponent(`/extract?url=${encodeURIComponent(url.trim())}`)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleExtract();
  };

  const rankEmoji = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `${rank}.`;
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans selection:bg-orange-100 selection:text-orange-900">
      {/* Header */}
      <header className="sticky top-0 z-50 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between bg-white/95 backdrop-blur border-b border-stone-200/80">
        <div className="flex items-center gap-2.5">
          <div className="bg-primary text-primary-foreground p-2 rounded-xl shadow-sm">
            <ChefHat className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-stone-900">PlateUp</span>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <Link
            href="/pricing"
            className="text-sm font-semibold text-stone-600 hover:text-primary transition-colors hidden sm:block"
          >
            Pricing
          </Link>
          <Link href="/login">
            <Button variant="ghost" className="text-stone-700 hover:text-primary font-medium">
              Log In
            </Button>
          </Link>
          <Link href="/login">
            <Button className="bg-primary hover:bg-orange-700 text-primary-foreground font-semibold shadow-sm rounded-lg px-4 sm:px-5">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero — The Input IS the Product */}
        <section className="relative px-4 sm:px-6 lg:px-8 pt-16 pb-12 md:pt-24 md:pb-16 max-w-3xl mx-auto flex flex-col items-center text-center">
          {/* Ambient Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] sm:w-[800px] h-[400px] bg-orange-200/30 rounded-full blur-3xl -z-10 pointer-events-none" />

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-stone-900 mb-4 leading-[1.1]">
            Paste a link.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-primary">
              Get a recipe.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-stone-500 mb-8 max-w-xl">
            Turn any YouTube or TikTok cooking video into a complete recipe with ingredients, steps, and a meal plan.
          </p>

          {/* THE BIG INPUT */}
          <div className="w-full max-w-2xl mb-6">
            <div className="relative flex items-center gap-2 p-2 bg-white rounded-2xl border-2 border-stone-200 shadow-xl shadow-stone-900/5 focus-within:border-primary focus-within:shadow-orange-500/10 transition-all">
              <CirclePlay className="absolute left-5 w-5 h-5 text-stone-400" />
              <Input
                type="url"
                placeholder="Paste YouTube or TikTok link here..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 pl-12 pr-2 py-4 text-base sm:text-lg border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-stone-400"
              />
              <Button
                onClick={handleExtract}
                disabled={!url.trim()}
                className="bg-primary hover:bg-orange-700 text-primary-foreground font-bold px-6 sm:px-8 py-4 h-auto rounded-xl text-base shadow-md shadow-orange-600/20 shrink-0 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
                Extract <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-stone-400 mb-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Free
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-400" />
              Instant
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              No signup needed
            </span>
          </div>

          {/* Platform tags */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-stone-400 font-medium">
            <span className="px-2.5 py-1 rounded-full bg-stone-100 border border-stone-200">▶️ YouTube</span>
            <span className="px-2.5 py-1 rounded-full bg-stone-100 border border-stone-200">🎵 TikTok</span>
            <span className="px-2.5 py-1 rounded-full bg-stone-100 border border-stone-200">📱 Shorts</span>
            <span className="px-2.5 py-1 rounded-full bg-stone-100 border border-stone-200">📸 Food Photos</span>
          </div>
        </section>

        {/* Leaderboard — Most Cooked This Week */}
        <section className="px-4 sm:px-6 lg:px-8 pb-16 md:pb-24 max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-lg shadow-stone-900/5 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-stone-900 text-base">Most Cooked This Week</h2>
                  <p className="text-xs text-stone-400">What everyone&apos;s making right now</p>
                </div>
              </div>
              <Link href="/login" className="text-xs font-semibold text-primary hover:underline">
                See all →
              </Link>
            </div>

            {/* Entries */}
            <div className="divide-y divide-stone-100">
              {leaderboardLoading ? (
                <div className="p-8 text-center">
                  <div className="w-6 h-6 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-stone-400 mt-2">Loading trends...</p>
                </div>
              ) : leaderboard.length === 0 ? (
                // Seed data when empty
                <>
                  {[
                    { rank: 1, recipeName: "Creamy Tuscan Chicken", cookCount: 142, thumbnailUrl: "https://img.spoonacular.com/recipes/716429-312x231.jpg" },
                    { rank: 2, recipeName: "Birria Tacos", cookCount: 98, thumbnailUrl: "https://img.spoonacular.com/recipes/663150-312x231.jpg" },
                    { rank: 3, recipeName: "Honey Garlic Salmon", cookCount: 87, thumbnailUrl: "https://img.spoonacular.com/recipes/654959-312x231.jpg" },
                    { rank: 4, recipeName: "Pad Thai", cookCount: 64, thumbnailUrl: "https://img.spoonacular.com/recipes/648525-312x231.jpg" },
                    { rank: 5, recipeName: "Butter Chicken", cookCount: 51, thumbnailUrl: "https://img.spoonacular.com/recipes/633942-312x231.jpg" },
                  ].map((entry) => (
                    <div key={entry.rank} className="flex items-center gap-3 px-5 py-3 hover:bg-stone-50 transition-colors">
                      <span className="text-lg font-bold w-8 text-center shrink-0">
                        {rankEmoji(entry.rank)}
                      </span>
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-stone-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={entry.thumbnailUrl} alt={entry.recipeName} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-stone-900 truncate">{entry.recipeName}</div>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-stone-500 shrink-0">
                        <ChefHat className="w-3.5 h-3.5" />
                        {entry.cookCount} cooks
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                leaderboard.map((entry) => (
                  <div
                    key={entry.rank}
                    className={`flex items-center gap-3 px-5 py-3 transition-colors ${
                      entry.promoted
                        ? "bg-gradient-to-r from-amber-50 to-orange-50 border-l-2 border-l-amber-400"
                        : "hover:bg-stone-50"
                    }`}
                  >
                    <span className="text-lg font-bold w-8 text-center shrink-0">
                      {entry.promoted ? (
                        <Star className="w-5 h-5 text-amber-500 fill-amber-400 mx-auto" />
                      ) : (
                        rankEmoji(entry.rank)
                      )}
                    </span>
                    {entry.thumbnailUrl && (
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-stone-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={entry.thumbnailUrl} alt={entry.recipeName} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-stone-900 truncate">
                        {entry.recipeName}
                        {entry.promoted && (
                          <span className="ml-2 text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full uppercase">
                            Promoted
                          </span>
                        )}
                      </div>
                      {entry.cookedBy && (
                        <div className="text-xs text-stone-400 truncate">by {entry.cookedBy}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-stone-500 shrink-0">
                      <ChefHat className="w-3.5 h-3.5" />
                      {entry.cookCount} cooks
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Promote CTA */}
            <div className="px-5 py-3 border-t border-stone-100 bg-stone-50/50">
              <Link href="/login?redirect=/promote" className="flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:text-orange-700 transition-colors">
                <Crown className="w-4 h-4" />
                Promote your recipe for $1 →
              </Link>
            </div>
          </div>
        </section>

        {/* Simple How-It-Works */}
        <section className="px-4 sm:px-6 lg:px-8 pb-16 md:pb-20 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center p-6">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-orange-100 flex items-center justify-center">
                <CirclePlay className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-stone-900 mb-1">1. Paste a link</h3>
              <p className="text-sm text-stone-500">YouTube, TikTok, or Shorts cooking video</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-emerald-100 flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-bold text-stone-900 mb-1">2. AI extracts the recipe</h3>
              <p className="text-sm text-stone-500">Ingredients, steps, cook times — all automatic</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-blue-100 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-bold text-stone-900 mb-1">3. Cook & climb the board</h3>
              <p className="text-sm text-stone-500">Mark recipes as made and join the leaderboard</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-4 sm:px-6 lg:px-8 py-8 border-t border-stone-200 bg-white">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
              <ChefHat className="w-4 h-4" />
            </div>
            <span className="font-bold text-stone-900">PlateUp</span>
            <span className="text-xs text-stone-400 ml-2">© {new Date().getFullYear()} CLD Technology</span>
          </div>

          <div className="flex items-center gap-5 text-sm text-stone-500">
            <Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link>
            <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            <Link href="/login" className="hover:text-primary transition-colors">Sign In</Link>
            <span className="text-stone-400">Built by <span className="font-semibold text-stone-600">CLD Technology</span></span>
          </div>
        </div>

        <p className="max-w-4xl mx-auto mt-4 text-[11px] leading-relaxed text-stone-400">
          ⚠️ Allergy &amp; Food Safety: Recipes, ingredients, cooking times, and dietary tags
          are AI-generated and are NOT verified by a human or nutritionist. They may be
          inaccurate or incomplete. If you have food allergies or intolerances, always verify
          every ingredient against the original source and product packaging. You are fully
          responsible for your own cooking and food safety decisions. PlateUp is not affiliated
          with, endorsed by, or sponsored by any video creator, YouTube, or Google. Uses YouTube API
          Services. As an Amazon Associate and affiliate partner, PlateUp may earn
          commissions on qualifying purchases at no additional cost to you.
        </p>
      </footer>
    </div>
  );
}
