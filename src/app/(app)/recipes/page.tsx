"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { BookOpen, Search, Plus, Sparkles, X, Filter, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRecipes } from "@/hooks/useRecipes";
import { useProfile } from "@/hooks/useProfile";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { RecipeGridSkeleton } from "@/components/ui/skeleton";
import { DIETARY_OPTIONS, type DietaryRestriction } from "@/types";
import { cn } from "@/lib/utils";

type FilterCategory = 'all' | 'my-diet' | 'quick' | DietaryRestriction;

export default function RecipesPage() {
  const { recipes, loading, error } = useRecipes();
  const { preferences } = useProfile();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');

  const userDietaryRestrictions = useMemo(
    () => preferences?.dietaryRestrictions || [],
    [preferences?.dietaryRestrictions]
  );

  const filterChips = useMemo(() => [
    { id: 'all' as FilterCategory, label: 'All Recipes' },
    ...(userDietaryRestrictions.length > 0
      ? [{ id: 'my-diet' as FilterCategory, label: 'Matches My Preferences ✨' }]
      : []),
    { id: 'quick' as FilterCategory, label: 'Quick (<30m) ⚡' },
    ...DIETARY_OPTIONS.map((opt) => ({
      id: opt.id as FilterCategory,
      label: opt.label,
    })),
  ], [userDietaryRestrictions]);

  const filteredAndSortedRecipes = useMemo(() => {
    if (!recipes) return [];
    
    const filtered = recipes.filter((recipe) => {
      // 1. Text search
      const q = searchQuery.toLowerCase().trim();
      const matchName = !q || recipe.name?.toLowerCase().includes(q);
      const matchTags = !q || recipe.tags?.some((tag) => tag.toLowerCase().includes(q));
      const matchDietaryTags = !q || recipe.dietaryTags?.some((tag) => tag.toLowerCase().includes(q));
      const matchIngredients = !q || recipe.ingredients?.some((ing) => (ing.item || ing.name || '')?.toLowerCase().includes(q));
      const matchesSearch = matchName || matchTags || matchDietaryTags || matchIngredients;

      if (!matchesSearch) return false;

      // 2. Dietary Category Filter
      const recipeDietTags = [
        ...(Array.isArray(recipe.dietaryTags) ? recipe.dietaryTags.map(t => t.toLowerCase()) : []),
        ...(Array.isArray(recipe.tags) ? recipe.tags.map(t => t.toLowerCase()) : [])
      ];

      if (activeFilter === 'all') {
        return true;
      }

      if (activeFilter === 'quick') {
        const totalTime = (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0);
        return totalTime > 0 && totalTime <= 30;
      }

      if (activeFilter === 'my-diet') {
        if (userDietaryRestrictions.length === 0) return true;
        return userDietaryRestrictions.every((req: string) => recipeDietTags.includes(req.toLowerCase()));
      }

      // Specific dietary restriction
      return recipeDietTags.includes(activeFilter.toLowerCase());
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "highest-rated":
          return (b.rating || 0) - (a.rating || 0);
        case "most-made":
          return (b.timesMade || 0) - (a.timesMade || 0);
        case "recently-made":
          return new Date(b.lastMadeAt || 0).getTime() - new Date(a.lastMadeAt || 0).getTime();
        default:
          return 0;
      }
    });
  }, [recipes, searchQuery, sortBy, activeFilter, userDietaryRestrictions]);

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-100 text-primary rounded-2xl shadow-xs">
            <BookOpen className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">My Recipes</h1>
            <p className="text-xs text-stone-500 mt-0.5">Your personal culinary knowledge base</p>
          </div>
          <Badge variant="secondary" className="ml-1 rounded-full px-3 py-0.5 bg-orange-100 text-orange-900 font-bold text-sm" aria-label={`${recipes?.length || 0} recipes total`}>
            {recipes?.length || 0}
          </Badge>
        </div>
        <Link href="/extract" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto bg-primary hover:bg-orange-700 text-primary-foreground shadow-sm rounded-xl font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label="Extract New Recipe">
            <Plus className="w-4 h-4 mr-2 shrink-0" aria-hidden="true" />
            New Recipe
          </Button>
        </Link>
      </div>

      {loading ? (
        <RecipeGridSkeleton count={6} />
      ) : error ? (
        <div className="p-8 text-destructive text-center bg-red-50 rounded-2xl border border-red-200" role="alert">
          Error loading recipes. Please refresh the page.
        </div>
      ) : recipes?.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-8 sm:p-12 text-center border-dashed border-2 border-stone-200 rounded-2xl bg-white">
          <div className="p-4 bg-orange-50 text-primary rounded-full mb-4">
            <Sparkles className="w-8 h-8" aria-hidden="true" />
          </div>
          <h3 className="text-xl font-bold text-stone-900 mb-2">No recipes yet</h3>
          <p className="text-stone-500 mb-6 max-w-sm text-sm">
            Extract recipes from YouTube videos or photos to get started.
          </p>
          <Link href="/extract">
            <Button size="lg" className="bg-primary hover:bg-orange-700 text-primary-foreground font-semibold rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label="Extract Your First Recipe">
              Extract Your First Recipe
            </Button>
          </Link>
        </Card>
      ) : (
        <>
          {/* Controls: Search, Sort, and Dietary Filter Pills */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="relative flex-1 md:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" aria-hidden="true" />
                <Input 
                  placeholder="Search recipes, ingredients, or tags..." 
                  aria-label="Search recipes, ingredients, or tags"
                  className="pl-9 pr-8 w-full rounded-xl border-stone-300 focus-visible:ring-primary bg-white shadow-xs text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button 
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search input"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full p-1 touch-manipulation cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={(v) => v && setSortBy(v)}>
                  <SelectTrigger 
                    className="w-full md:w-[190px] rounded-xl border-stone-300 bg-white shadow-xs focus-visible:ring-primary"
                    aria-label="Sort recipes by"
                  >
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="highest-rated">Highest Rated</SelectItem>
                    <SelectItem value="most-made">Most Made</SelectItem>
                    <SelectItem value="recently-made">Recently Made</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Interactive Dietary Filter Chips Bar (R4) */}
            <div 
              className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none pt-1 touch-pan-x"
              role="group"
              aria-label="Filter recipes by category"
            >
              <div className="flex items-center gap-1.5 shrink-0 text-stone-400 mr-1 text-xs font-bold uppercase tracking-wider select-none">
                <Filter className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Filter:</span>
              </div>
              {filterChips.map((chip) => {
                const isActive = activeFilter === chip.id;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setActiveFilter(chip.id)}
                    aria-pressed={isActive}
                    aria-label={`Filter by ${chip.label}`}
                    className={cn(
                      "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary touch-manipulation",
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50 hover:border-stone-300"
                    )}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium px-1 flex-wrap gap-2">
            <span>
              Showing <strong>{filteredAndSortedRecipes.length}</strong> of <strong>{recipes.length}</strong> recipes
              {activeFilter !== 'all' && ` • Filter: ${activeFilter}`}
            </span>
            {(searchQuery || activeFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveFilter('all');
                }}
                aria-label="Reset all search and category filters"
                className="text-primary hover:underline font-semibold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xs px-1"
              >
                Reset filters
              </button>
            )}
          </div>

          {filteredAndSortedRecipes.length === 0 ? (
            <div className="text-center py-12 sm:py-16 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-3 px-4">
              <Zap className="w-8 h-8 mx-auto text-stone-400" aria-hidden="true" />
              <p className="text-stone-700 font-bold text-base sm:text-lg">No recipes found matching your filters</p>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Try selecting &ldquo;All Recipes&rdquo; or adjusting your search term.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setSearchQuery("");
                  setActiveFilter('all');
                }}
                aria-label="Clear all active filters"
                className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Clear All Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredAndSortedRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

