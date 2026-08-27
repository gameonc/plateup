'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRecipes } from '@/hooks/useRecipes';
import {
  searchMealsByName,
  getRandomMeals,
  getCategories,
  filterByCategory,
  getMealById,
  mealToRecipeData,
  parseMealIngredients,
  parseMealInstructions,
  parseMealTags,
  estimateDifficulty,
  type MealDBMeal,
  type MealDBCategory,
} from '@/lib/mealdb';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Compass,
  Search,
  Shuffle,
  Clock,
  Users,
  ChefHat,
  BookmarkPlus,
  Check,
  Loader2,
  ExternalLink,
  CirclePlay,
  Globe,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

export default function DiscoverPage() {
  const { addRecipe } = useRecipes();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [meals, setMeals] = useState<MealDBMeal[]>([]);
  const [categories, setCategories] = useState<MealDBCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<MealDBMeal | null>(null);
  const [mealDetailLoading, setMealDetailLoading] = useState(false);
  const [savingMealId, setSavingMealId] = useState<string | null>(null);
  const [savedMealIds, setSavedMealIds] = useState<Set<string>>(new Set());

  // Load initial data
  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const [randomMeals, cats] = await Promise.all([
          getRandomMeals(12),
          getCategories(),
        ]);
        setMeals(randomMeals);
        setCategories(cats);
      } catch (err) {
        console.error('Failed to load discover data:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Search
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      // Reset to random meals
      setSearching(true);
      setSelectedCategory(null);
      const randomMeals = await getRandomMeals(12);
      setMeals(randomMeals);
      setSearching(false);
      return;
    }
    setSearching(true);
    setSelectedCategory(null);
    try {
      const results = await searchMealsByName(query);
      setMeals(results);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  }, []);

  // Category filter
  const handleCategoryClick = useCallback(async (category: string) => {
    if (selectedCategory === category) {
      // Deselect — show random
      setSelectedCategory(null);
      setSearching(true);
      const randomMeals = await getRandomMeals(12);
      setMeals(randomMeals);
      setSearching(false);
      return;
    }
    setSelectedCategory(category);
    setSearchQuery('');
    setSearching(true);
    try {
      const filtered = await filterByCategory(category);
      // filterByCategory returns summary, we need full details for first 12
      const detailPromises = filtered.slice(0, 12).map(m => getMealById(m.idMeal));
      const details = await Promise.all(detailPromises);
      setMeals(details.filter((m): m is MealDBMeal => m !== null));
    } catch (err) {
      console.error('Category filter failed:', err);
    } finally {
      setSearching(false);
    }
  }, [selectedCategory]);

  // Shuffle — get new random meals
  const handleShuffle = useCallback(async () => {
    setSearching(true);
    setSearchQuery('');
    setSelectedCategory(null);
    try {
      const randomMeals = await getRandomMeals(12);
      setMeals(randomMeals);
    } catch (err) {
      console.error('Shuffle failed:', err);
    } finally {
      setSearching(false);
    }
  }, []);

  // View meal detail
  const handleViewMeal = useCallback(async (meal: MealDBMeal) => {
    // If we already have full data (strInstructions), use it directly
    if (meal.strInstructions) {
      setSelectedMeal(meal);
      return;
    }
    // Otherwise fetch full details
    setMealDetailLoading(true);
    try {
      const full = await getMealById(meal.idMeal);
      setSelectedMeal(full);
    } catch (err) {
      console.error('Failed to load meal details:', err);
    } finally {
      setMealDetailLoading(false);
    }
  }, []);

  // Save meal to recipes
  const handleSaveMeal = useCallback(async (meal: MealDBMeal) => {
    setSavingMealId(meal.idMeal);
    try {
      const recipeData = mealToRecipeData(meal);
      await addRecipe(recipeData);
      setSavedMealIds(prev => new Set(prev).add(meal.idMeal));
    } catch (err) {
      console.error('Failed to save recipe:', err);
    } finally {
      setSavingMealId(null);
    }
  }, [addRecipe]);

  // Search on Enter
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery);
    }
  };

  return (
    <div className="container max-w-6xl py-6 px-4 sm:px-6 lg:px-8 mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-orange-500 to-amber-500 text-white p-2.5 rounded-xl shadow-md">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Discover Recipes</h1>
            <p className="text-sm text-stone-500">Browse thousands of recipes from around the world</p>
          </div>
        </div>
        <Button
          onClick={handleShuffle}
          variant="outline"
          className="gap-2 border-orange-200 text-orange-700 hover:bg-orange-50"
          disabled={searching}
        >
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shuffle className="w-4 h-4" />}
          Surprise Me
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        <Input
          placeholder="Search recipes... (e.g. pasta, chicken curry, chocolate cake)"
          className="pl-10 h-11 bg-white border-stone-200"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
        />
        {searchQuery && (
          <Button
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-orange-600 hover:bg-orange-700 text-white h-7 px-3"
            onClick={() => handleSearch(searchQuery)}
            disabled={searching}
          >
            {searching ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Search'}
          </Button>
        )}
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3">Categories</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.idCategory}
                onClick={() => handleCategoryClick(cat.strCategory)}
                className={`
                  inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all
                  ${selectedCategory === cat.strCategory
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'bg-stone-100 text-stone-700 hover:bg-orange-50 hover:text-orange-700'
                  }
                `}
              >
                {cat.strCategory}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="bg-orange-100 p-4 rounded-full">
            <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
          </div>
          <p className="text-stone-500">Loading delicious recipes...</p>
        </div>
      ) : (
        <>
          {/* Results header */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-stone-500">
              {searchQuery
                ? `${meals.length} result${meals.length !== 1 ? 's' : ''} for "${searchQuery}"`
                : selectedCategory
                ? `${meals.length} ${selectedCategory} recipes`
                : `${meals.length} recipes to discover`}
            </p>
          </div>

          {/* Meal Grid */}
          {meals.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-stone-100 p-4 rounded-full inline-block mb-4">
                <Search className="w-8 h-8 text-stone-400" />
              </div>
              <h3 className="text-lg font-semibold text-stone-700 mb-2">No recipes found</h3>
              <p className="text-stone-500 mb-4">Try a different search term or browse by category</p>
              <Button onClick={handleShuffle} className="bg-orange-600 hover:bg-orange-700 text-white gap-2">
                <Shuffle className="w-4 h-4" /> Show Random Recipes
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {meals.map((meal) => (
                <Card
                  key={meal.idMeal}
                  className="overflow-hidden border-stone-200/80 hover:border-orange-200 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                  onClick={() => handleViewMeal(meal)}
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={meal.strMealThumb}
                      alt={meal.strMeal}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2 flex gap-1.5">
                      {meal.strArea && (
                        <Badge className="bg-white/90 text-stone-800 text-xs border-none backdrop-blur-sm">
                          <Globe className="w-3 h-3 mr-1" />
                          {meal.strArea}
                        </Badge>
                      )}
                      {meal.strCategory && (
                        <Badge className="bg-orange-500/90 text-white text-xs border-none backdrop-blur-sm">
                          {meal.strCategory}
                        </Badge>
                      )}
                    </div>
                    {/* Save button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!savedMealIds.has(meal.idMeal)) handleSaveMeal(meal);
                      }}
                      className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-sm transition-all ${
                        savedMealIds.has(meal.idMeal)
                          ? 'bg-green-500 text-white'
                          : 'bg-white/80 text-stone-700 hover:bg-orange-500 hover:text-white'
                      }`}
                      disabled={savingMealId === meal.idMeal}
                    >
                      {savingMealId === meal.idMeal ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : savedMealIds.has(meal.idMeal) ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <BookmarkPlus className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-semibold text-stone-900 line-clamp-1 group-hover:text-orange-700 transition-colors">
                      {meal.strMeal}
                    </h3>
                    {meal.strTags && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {parseMealTags(meal.strTags).slice(0, 3).map((tag) => (
                          <span key={tag} className="text-xs px-1.5 py-0.5 bg-stone-100 text-stone-500 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Meal Detail Dialog */}
      {selectedMeal && (
        <Dialog open={!!selectedMeal} onOpenChange={(open) => !open && setSelectedMeal(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">{selectedMeal.strMeal}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 flex-wrap">
                {selectedMeal.strArea && (
                  <Badge variant="outline" className="gap-1">
                    <Globe className="w-3 h-3" /> {selectedMeal.strArea}
                  </Badge>
                )}
                {selectedMeal.strCategory && (
                  <Badge className="bg-orange-100 text-orange-800 border-orange-200 gap-1">
                    <ChefHat className="w-3 h-3" /> {selectedMeal.strCategory}
                  </Badge>
                )}
                <Badge variant="outline" className="gap-1">
                  <Clock className="w-3 h-3" /> ~45 min
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Users className="w-3 h-3" /> 4 servings
                </Badge>
              </DialogDescription>
            </DialogHeader>

            {/* Image */}
            <div className="relative rounded-lg overflow-hidden aspect-video">
              <img
                src={selectedMeal.strMealThumb}
                alt={selectedMeal.strMeal}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Links */}
            <div className="flex gap-2">
              {selectedMeal.strYoutube && (
                <a
                  href={selectedMeal.strYoutube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700"
                >
                  <CirclePlay className="w-4 h-4" /> Watch on YouTube
                </a>
              )}
              {selectedMeal.strSource && (
                <a
                  href={selectedMeal.strSource}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700"
                >
                  <ExternalLink className="w-4 h-4" /> Original Source
                </a>
              )}
            </div>

            {/* Ingredients */}
            <div>
              <h3 className="font-semibold text-stone-900 mb-2">Ingredients</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {parseMealIngredients(selectedMeal).map((ing, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm py-1 px-2 rounded bg-stone-50">
                    <span className="text-orange-600 font-medium min-w-[60px]">
                      {ing.amount} {ing.unit}
                    </span>
                    <span className="text-stone-700">{ing.item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div>
              <h3 className="font-semibold text-stone-900 mb-2">Instructions</h3>
              <ol className="space-y-2">
                {parseMealInstructions(selectedMeal.strInstructions).map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-stone-700 leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Tags */}
            {selectedMeal.strTags && (
              <div className="flex flex-wrap gap-1.5">
                {parseMealTags(selectedMeal.strTags).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                ))}
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <DialogClose className="text-sm text-stone-500 hover:text-stone-700 px-4 py-2">
                Close
              </DialogClose>
              <Button
                onClick={() => handleSaveMeal(selectedMeal)}
                disabled={savingMealId === selectedMeal.idMeal || savedMealIds.has(selectedMeal.idMeal)}
                className={
                  savedMealIds.has(selectedMeal.idMeal)
                    ? 'bg-green-600 hover:bg-green-600 text-white gap-2'
                    : 'bg-orange-600 hover:bg-orange-700 text-white gap-2'
                }
              >
                {savingMealId === selectedMeal.idMeal ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : savedMealIds.has(selectedMeal.idMeal) ? (
                  <><Check className="w-4 h-4" /> Saved to My Recipes</>
                ) : (
                  <><BookmarkPlus className="w-4 h-4" /> Save to My Recipes</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
