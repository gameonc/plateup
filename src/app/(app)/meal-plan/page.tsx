'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { addWeeks, subWeeks, startOfWeek, endOfWeek, format, getISOWeek, getYear } from 'date-fns';
import { searchRecipes, getRandomRecipes, getRecipeById, getRecipesByCuisine, spoonacularToRecipeData, type SpoonacularRecipe, type SpoonacularSearchResult } from '@/lib/spoonacular';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  X, 
  Sparkles, 
  Trash2, 
  Search, 
  Clock, 
  ChefHat, 
  ShoppingBag, 
  Leaf,
  Sliders,
  Loader2
} from 'lucide-react';
import { useMealPlan } from '@/hooks/useMealPlan';
import { useRecipes } from '@/hooks/useRecipes';
import { useCookingLog } from '@/hooks/useCookingLog';
import { useProfile } from '@/hooks/useProfile';
import { generateMealPlan, DAYS_OF_WEEK, MEAL_TIMES, formatDayName, formatMealTime, createEmptyWeekMeals } from '@/lib/meal-planner';
import { getDietaryBadgeClass } from '@/components/recipe/RecipeCard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/toast';
import { MealPlanSkeleton } from '@/components/ui/skeleton';
import { DIETARY_OPTIONS, type DayOfWeek, type MealTime, type Recipe, type DietaryRestriction } from '@/types';
import { cn } from '@/lib/utils';

function getISOWeekId(date: Date): string {
  return `${getYear(date)}-W${getISOWeek(date).toString().padStart(2, '0')}`;
}

const DAY_ABBREVIATIONS: Record<DayOfWeek, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

export default function MealPlanPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentWeekId = getISOWeekId(currentDate);
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  
  const { preferences, loading: profileLoading } = useProfile();
  const repeatWindowDays = preferences?.repeatWindowDays ?? 5;
  const userDietaryRestrictions = preferences?.dietaryRestrictions || [];
  
  const { mealPlan, loading: mealPlanLoading, setMealSlot, clearMealSlot, saveMealPlan } = useMealPlan(currentWeekId);
  const { recipes, loading: recipesLoading, addRecipe } = useRecipes();
  const { getRecentRecipeIds, loading: logsLoading } = useCookingLog(repeatWindowDays);

  const [activeSlot, setActiveSlot] = useState<{ day: DayOfWeek; meal: MealTime } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pickerDietaryFilter, setPickerDietaryFilter] = useState<string>('all');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerTab, setPickerTab] = useState<'saved' | 'discover'>('discover');
  const [discoverMeals, setDiscoverMeals] = useState<(SpoonacularRecipe | SpoonacularSearchResult)[]>([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [cuisineFilter, setCuisineFilter] = useState<string>('all');
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

  // Cuisines available in Spoonacular
  const CUISINES = [
    { id: 'all', label: '🌍 All', flag: '' },
    { id: 'American', label: '🇺🇸 American', flag: '🇺🇸' },
    { id: 'Italian', label: '🇮🇹 Italian', flag: '🇮🇹' },
    { id: 'Mexican', label: '🇲🇽 Mexican', flag: '🇲🇽' },
    { id: 'Indian', label: '🇮🇳 Indian', flag: '🇮🇳' },
    { id: 'Japanese', label: '🇯🇵 Japanese', flag: '🇯🇵' },
    { id: 'Chinese', label: '🇨🇳 Chinese', flag: '🇨🇳' },
    { id: 'French', label: '🇫🇷 French', flag: '🇫🇷' },
    { id: 'British', label: '🇬🇧 British', flag: '🇬🇧' },
    { id: 'Caribbean', label: '🇯🇲 Caribbean', flag: '🇯🇲' },
    { id: 'Thai', label: '🇹🇭 Thai', flag: '🇹🇭' },
    { id: 'Greek', label: '🇬🇷 Greek', flag: '🇬🇷' },
    { id: 'Spanish', label: '🇪🇸 Spanish', flag: '🇪🇸' },
    { id: 'Middle Eastern', label: '🇱🇧 Middle Eastern', flag: '🇱🇧' },
    { id: 'Korean', label: '🇰🇷 Korean', flag: '🇰🇷' },
    { id: 'Vietnamese', label: '🇻🇳 Vietnamese', flag: '🇻🇳' },
    { id: 'African', label: '🌍 African', flag: '🌍' },
    { id: 'Mediterranean', label: '🫒 Mediterranean', flag: '🫒' },
  ];

  // Load Spoonacular recipes — by cuisine, search, or random popular
  const loadDiscoverMeals = useCallback(async (query?: string, cuisine?: string) => {
    setDiscoverLoading(true);
    try {
      if (query && query.trim()) {
        const results = await searchRecipes(query.trim(), 15);
        setDiscoverMeals(results);
      } else if (cuisine && cuisine !== 'all') {
        const results = await getRecipesByCuisine(cuisine, 15);
        setDiscoverMeals(results);
      } else {
        // Default: load random popular recipes
        const results = await getRandomRecipes(15);
        setDiscoverMeals(results);
      }
    } catch {
      console.warn('Failed to load discover meals');
    } finally {
      setDiscoverLoading(false);
    }
  }, []);

  // Mobile selected day (defaults to current day of week)
  const [selectedMobileDay, setSelectedMobileDay] = useState<DayOfWeek>(() => {
    const today = format(new Date(), 'EEEE').toLowerCase() as DayOfWeek;
    return DAYS_OF_WEEK.includes(today) ? today : 'monday';
  });

  const handleNextWeek = () => setCurrentDate(prev => addWeeks(prev, 1));
  const handlePrevWeek = () => setCurrentDate(prev => subWeeks(prev, 1));

  const handleAutoFill = async () => {
    if (isAutoFilling) return;
    if (!mealPlan || !recipes.length) {
      toast.create({
        title: "No Recipes Available",
        description: "Save some recipes first to auto-fill your meal plan.",
        type: "warning",
      });
      return;
    }

    // Check if user has active dietary restrictions and if any recipes match
    if (userDietaryRestrictions.length > 0) {
      const compliantRecipes = recipes.filter((recipe) => {
        const recipeDietTags = [
          ...(Array.isArray(recipe.dietaryTags) ? recipe.dietaryTags.map((t) => t.toLowerCase()) : []),
          ...(Array.isArray(recipe.tags) ? recipe.tags.map((t) => t.toLowerCase()) : []),
        ];
        return userDietaryRestrictions.every((req: string) => recipeDietTags.includes(req.toLowerCase()));
      });

      if (compliantRecipes.length === 0) {
        toast.create({
          title: "No Compliant Recipes Found",
          description: `You have active dietary restrictions (${userDietaryRestrictions.join(', ')}), but no saved recipes match. Extract or tag recipes with these dietary requirements first.`,
          type: "warning",
        });
        return;
      }
    }

    setIsAutoFilling(true);
    try {
      const recentRecipeIds = getRecentRecipeIds(repeatWindowDays);
      const lockedSlots = mealPlan.meals || createEmptyWeekMeals();
      const newPlan = generateMealPlan(recipes, recentRecipeIds, lockedSlots, repeatWindowDays, userDietaryRestrictions);
      await saveMealPlan(newPlan);
      
      toast.create({
        title: "Week Auto-Filled! 🗓️",
        description: userDietaryRestrictions.length > 0
          ? `7-day plan filled with variety, complying with ${userDietaryRestrictions.join(', ')}.`
          : "Your 7-day meal plan has been generated with variety.",
        type: "success",
      });
    } catch {
      toast.create({
        title: "Auto-Fill Failed",
        description: "Could not generate meal plan. Please try again.",
        type: "error",
      });
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleClearAll = async () => {
    if (isClearingAll) return;
    setIsClearingAll(true);
    try {
      await saveMealPlan(createEmptyWeekMeals());
      toast.create({
        title: "Meal Plan Cleared",
        description: "All meal slots have been reset.",
        type: "info",
      });
      setIsClearDialogOpen(false);
    } catch {
      toast.create({
        title: "Clear Failed",
        description: "Could not clear meal plan. Please try again.",
        type: "error",
      });
    } finally {
      setIsClearingAll(false);
    }
  };

  const handleSelectRecipe = async (recipe: Recipe) => {
    if (!activeSlot) return;
    await setMealSlot(activeSlot.day, activeSlot.meal, {
      recipeId: recipe.id,
      recipeName: recipe.name,
      thumbnailUrl: recipe.thumbnailUrl,
    });
    toast.create({
      title: "Meal Assigned",
      description: `Added ${recipe.name} to ${formatDayName(activeSlot.day)} ${formatMealTime(activeSlot.meal)}.`,
      type: "success",
    });
    setIsPickerOpen(false);
    setActiveSlot(null);
  };

  // Handle selecting a TheMealDB meal — save it first, then assign
  // Handle selecting a Spoonacular recipe — fetch full details, save, then assign
  const handleSelectDiscoverMeal = async (meal: SpoonacularRecipe | SpoonacularSearchResult) => {
    if (!activeSlot) return;
    try {
      // If it's a search result (no ingredients), fetch full details
      let fullRecipe: SpoonacularRecipe;
      if ('extendedIngredients' in meal && meal.extendedIngredients) {
        fullRecipe = meal as SpoonacularRecipe;
      } else {
        const fetched = await getRecipeById(meal.id);
        if (!fetched) throw new Error('Failed to load recipe details');
        fullRecipe = fetched;
      }
      const recipeData = spoonacularToRecipeData(fullRecipe);
      const recipeId = await addRecipe(recipeData);
      await setMealSlot(activeSlot.day, activeSlot.meal, {
        recipeId,
        recipeName: recipeData.name,
        thumbnailUrl: recipeData.thumbnailUrl,
      });
      toast.create({
        title: "Meal Assigned! 🍽️",
        description: `Saved "${recipeData.name}" and added to ${formatDayName(activeSlot.day)} ${formatMealTime(activeSlot.meal)}.`,
        type: "success",
      });
      setIsPickerOpen(false);
      setActiveSlot(null);
    } catch (error) {
      console.error('Failed to add discover meal:', error);
      toast.create({
        title: "Error",
        description: "Failed to add this recipe. Please try again.",
        type: "error",
      });
    }
  };

  const openPicker = (day: DayOfWeek, meal: MealTime) => {
    setActiveSlot({ day, meal });
    setSearchQuery('');
    setPickerDietaryFilter('all');
    setPickerTab(recipes.length > 0 ? 'saved' : 'discover');
    setIsPickerOpen(true);
    // Pre-load discover meals
    if (discoverMeals.length === 0) {
      loadDiscoverMeals();
    }
  };

  const recentIds = useMemo(() => getRecentRecipeIds(repeatWindowDays), [getRecentRecipeIds, repeatWindowDays]);

  const filteredRecipes = useMemo(() => {
    return recipes.filter(r => {
      const q = searchQuery.toLowerCase().trim();
      const matchName = !q || r.name.toLowerCase().includes(q);
      const matchTags = !q || r.tags?.some(tag => tag.toLowerCase().includes(q));
      const matchDietTags = !q || r.dietaryTags?.some(tag => tag.toLowerCase().includes(q));
      const matchesSearch = matchName || matchTags || matchDietTags;

      if (!matchesSearch) return false;

      if (pickerDietaryFilter === 'all') return true;

      const recipeDietTags = [
        ...(Array.isArray(r.dietaryTags) ? r.dietaryTags.map(t => t.toLowerCase()) : []),
        ...(Array.isArray(r.tags) ? r.tags.map(t => t.toLowerCase()) : []),
      ];

      return recipeDietTags.includes(pickerDietaryFilter.toLowerCase());
    });
  }, [recipes, searchQuery, pickerDietaryFilter]);

  const isLoading = mealPlanLoading || recipesLoading || logsLoading || profileLoading;

  if (isLoading) {
    return <MealPlanSkeleton />;
  }

  const renderMealSlot = (day: DayOfWeek, meal: MealTime) => {
    const slot = mealPlan?.meals?.[day]?.[meal];
    return (
      <Card 
        key={meal} 
        className={cn(
          "relative overflow-hidden group flex flex-col h-[140px] transition-all rounded-2xl",
          slot ? "border-primary/30 bg-orange-50/30 shadow-xs" : "border-dashed border-stone-200 hover:border-primary/50 bg-white"
        )}
      >
        <div className="p-2.5 text-xs font-bold text-stone-500 uppercase tracking-wider flex justify-between items-center z-10 bg-white/90 backdrop-blur-xs border-b border-stone-100">
          <span className="text-[11px]">{formatMealTime(meal)}</span>
          {slot && (
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clearMealSlot(day, meal);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600 p-0.5 rounded cursor-pointer"
              title="Remove meal"
              aria-label="Remove meal"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        
        <div className="flex-1 flex flex-col p-2.5 pt-0 h-full justify-center">
          {slot ? (
            <div 
              className="flex flex-col h-full cursor-pointer justify-center relative" 
              onClick={() => openPicker(day, meal)}
            >
              {slot.thumbnailUrl ? (
                <div className="absolute inset-0 opacity-15 transition-opacity group-hover:opacity-25 rounded-b-xl overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={slot.thumbnailUrl} alt={slot.recipeName} className="w-full h-full object-cover" />
                </div>
              ) : null}
              <div className="relative z-10 flex-1 flex items-center justify-center text-center font-semibold text-xs sm:text-sm text-stone-900 p-1 line-clamp-3">
                {slot.recipeName}
              </div>
            </div>
          ) : (
            <button 
              type="button"
              onClick={() => openPicker(day, meal)}
              className="flex-1 flex flex-col items-center justify-center text-stone-400 hover:text-primary hover:bg-orange-50/50 rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">Add Meal</span>
            </button>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl space-y-6 py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-orange-100 rounded-xl flex items-center justify-center text-primary shadow-xs">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">Meal Plan</h1>
            <p className="text-xs text-stone-500">Plan your week, balance variety, and shop smarter</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/shopping-list">
            <Button variant="outline" className="w-full sm:w-auto rounded-xl border-orange-200 bg-orange-50/60 hover:bg-orange-100 text-primary font-semibold cursor-pointer">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Shopping List
            </Button>
          </Link>
          
          <Button 
            variant="outline" 
            className="w-full sm:w-auto rounded-xl border-stone-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200 cursor-pointer"
            disabled={isClearingAll || isAutoFilling}
            onClick={() => setIsClearDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear All
          </Button>

          <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
            <DialogContent className="rounded-2xl sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-stone-900 font-bold">Clear All Meals</DialogTitle>
                <DialogDescription className="text-stone-600 text-sm">
                  Are you sure you want to clear your meal plan for this entire week? All 21 meal slots will be reset.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-2 mt-4">
                <Button 
                  variant="outline" 
                  className="rounded-xl" 
                  disabled={isClearingAll}
                  onClick={() => setIsClearDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="rounded-xl bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                  onClick={handleClearAll}
                  disabled={isClearingAll}
                >
                  {isClearingAll ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Clearing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Yes, Clear All
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button 
            onClick={handleAutoFill} 
            disabled={isAutoFilling || isClearingAll}
            className="w-full sm:w-auto bg-primary hover:bg-orange-700 text-primary-foreground font-semibold rounded-xl shadow-xs cursor-pointer disabled:opacity-70"
          >
            {isAutoFilling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Auto-Filling...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Auto-Fill Week
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Active Dietary Restrictions Banner (R4) */}
      {userDietaryRestrictions.length > 0 && (
        <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
              <Leaf className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-900">
                Active Dietary Preferences Enforced
              </p>
              <p className="text-[11px] text-emerald-700">
                Auto-fill strictly selects recipes matching: {userDietaryRestrictions.map((r: string) => (
                  <span key={r} className="font-semibold capitalize underline decoration-emerald-400 mr-1">{r}</span>
                ))}
              </p>
            </div>
          </div>
          <Link href="/profile" className="shrink-0 text-xs font-bold text-emerald-800 hover:text-emerald-950 underline flex items-center gap-1">
            <Sliders className="h-3.5 w-3.5" /> Adjust in Settings
          </Link>
        </div>
      )}

      {/* Week Navigation */}
      <div className="flex items-center justify-between sm:justify-center gap-4 bg-white border border-stone-200/80 p-2.5 rounded-2xl shadow-xs">
        <Button variant="ghost" size="icon" onClick={handlePrevWeek} aria-label="Previous week" className="rounded-xl hover:bg-stone-100">
          <ChevronLeft className="h-5 w-5 text-stone-700" />
        </Button>
        <div className="font-bold text-stone-900 text-base sm:text-lg min-w-[200px] text-center">
          {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
        </div>
        <Button variant="ghost" size="icon" onClick={handleNextWeek} aria-label="Next week" className="rounded-xl hover:bg-stone-100">
          <ChevronRight className="h-5 w-5 text-stone-700" />
        </Button>
      </div>

      {/* Mobile Day Selector (< md: Segmented 7 Day Tabs) */}
      <div className="block md:hidden space-y-4">
        {/* Segmented Day Selector Bar */}
        <div className="grid grid-cols-7 gap-1 bg-stone-200/70 p-1 rounded-xl">
          {DAYS_OF_WEEK.map((day) => {
            const isSelected = selectedMobileDay === day;
            const hasMeals = mealPlan?.meals?.[day] && Object.keys(mealPlan.meals[day] || {}).length > 0;
            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedMobileDay(day)}
                className={cn(
                  "py-2 px-1 rounded-lg text-xs font-bold transition-all text-center flex flex-col items-center justify-center relative cursor-pointer",
                  isSelected 
                    ? "bg-white text-primary shadow-xs" 
                    : "text-stone-600 hover:text-stone-900"
                )}
              >
                <span>{DAY_ABBREVIATIONS[day]}</span>
                {hasMeals && (
                  <span className={cn("w-1.5 h-1.5 rounded-full mt-0.5", isSelected ? "bg-primary" : "bg-stone-400")} />
                )}
              </button>
            );
          })}
        </div>

        {/* Active Selected Day Meals for Mobile */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-lg text-stone-900">
              {formatDayName(selectedMobileDay)}
            </h3>
            <span className="text-xs font-medium text-stone-500">3 Meals</span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {MEAL_TIMES.map((meal) => renderMealSlot(selectedMobileDay, meal))}
          </div>
        </div>
      </div>

      {/* Desktop Calendar Grid (>= md: 7 Columns × 3 Meals) */}
      <div className="hidden md:grid md:grid-cols-7 gap-3">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="flex flex-col gap-3">
            <h3 className="font-bold text-center py-2 bg-stone-100 text-stone-800 rounded-xl text-sm border border-stone-200/60">
              {formatDayName(day)}
            </h3>
            <div className="flex flex-col gap-3">
              {MEAL_TIMES.map((meal) => renderMealSlot(day, meal))}
            </div>
          </div>
        ))}
      </div>

      {/* Recipe Picker Dialog */}
      <Dialog open={isPickerOpen} onOpenChange={setIsPickerOpen}>
        <DialogContent className="sm:max-w-[540px] h-[85vh] flex flex-col rounded-2xl">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-stone-900 font-bold">
              Choose recipe for {activeSlot ? `${formatDayName(activeSlot.day)} ${formatMealTime(activeSlot.meal)}` : ''}
            </DialogTitle>
          </DialogHeader>
          
          {/* Tabs: My Recipes / Discover */}
          <div className="flex gap-1 bg-stone-100 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setPickerTab('saved')}
              className={cn(
                "flex-1 text-sm font-semibold py-1.5 rounded-md transition-all cursor-pointer",
                pickerTab === 'saved' ? "bg-white text-stone-900 shadow-xs" : "text-stone-500 hover:text-stone-700"
              )}
            >
              My Recipes ({recipes.length})
            </button>
            <button
              type="button"
              onClick={() => { setPickerTab('discover'); if (discoverMeals.length === 0) loadDiscoverMeals(); }}
              className={cn(
                "flex-1 text-sm font-semibold py-1.5 rounded-md transition-all cursor-pointer",
                pickerTab === 'discover' ? "bg-white text-stone-900 shadow-xs" : "text-stone-500 hover:text-stone-700"
              )}
            >
              Discover
            </button>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <Input
                type="search"
                placeholder={pickerTab === 'saved' ? "Search your recipes..." : "Search thousands of recipes..."}
                className="pl-9 rounded-xl border-stone-300 focus-visible:ring-primary"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (pickerTab === 'discover') {
                    // Debounce search for TheMealDB
                    const q = e.target.value;
                    setTimeout(() => loadDiscoverMeals(q), 500);
                  }
                }}
              />
            </div>

            {/* Dietary Filter Pills (saved tab only) */}
            {pickerTab === 'saved' && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                <button
                  type="button"
                  onClick={() => setPickerDietaryFilter('all')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 cursor-pointer border select-none text-[11px]",
                    pickerDietaryFilter === 'all'
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
                  )}
                >
                  All
                </button>
                {DIETARY_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPickerDietaryFilter(opt.id)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 cursor-pointer border select-none text-[11px]",
                      pickerDietaryFilter === opt.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {/* Cuisine Filter Pills (discover tab only) */}
            {pickerTab === 'discover' && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                {CUISINES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { setCuisineFilter(c.id); loadDiscoverMeals(undefined, c.id); }}
                    className={cn(
                      "px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 cursor-pointer border select-none text-[11px]",
                      cuisineFilter === c.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <Separator className="my-1" />
          
          <div className="flex-1 overflow-y-auto pr-1 space-y-2">
            {/* Saved Recipes Tab */}
            {pickerTab === 'saved' && (
              <>
                {filteredRecipes.length === 0 ? (
                  <div className="text-center text-stone-500 py-12 space-y-2">
                    <ChefHat className="w-8 h-8 mx-auto text-stone-300" />
                    <p className="text-sm">No saved recipes found.</p>
                    <button
                      type="button"
                      onClick={() => setPickerTab('discover')}
                      className="text-primary text-sm font-semibold hover:underline cursor-pointer"
                    >
                      Browse Discover recipes →
                    </button>
                  </div>
                ) : (
                  filteredRecipes.map(recipe => {
                    const isRecent = recentIds.has(recipe.id);
                    const dietaryTags = (recipe.dietaryTags || []) as DietaryRestriction[];

                    return (
                      <div 
                        key={recipe.id}
                        onClick={() => handleSelectRecipe(recipe)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border border-stone-200/80 cursor-pointer transition-all hover:bg-orange-50/60 hover:border-orange-200",
                          isRecent ? "opacity-80 bg-stone-50" : "bg-white"
                        )}
                      >
                        {recipe.thumbnailUrl ? (
                          <div className="h-12 w-12 rounded-lg overflow-hidden shrink-0 border border-stone-200/60">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={recipe.thumbnailUrl} alt={recipe.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center shrink-0 text-primary">
                            <ChefHat className="h-6 w-6" />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-stone-900 truncate">{recipe.name}</div>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <div className="flex items-center text-xs text-stone-500 font-medium mr-1">
                              <Clock className="mr-1 h-3 w-3 text-primary" />
                              {(recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0)}m
                            </div>
                            {dietaryTags.slice(0, 2).map((dTag, idx) => (
                              <Badge key={idx} variant="outline" className={`text-[10px] h-4 px-1.5 font-semibold capitalize ${getDietaryBadgeClass(dTag)}`}>
                                {dTag}
                              </Badge>
                            ))}
                            {isRecent && (
                              <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-amber-100 text-amber-800 border-none font-medium">
                                Recently cooked
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}

            {/* Discover Tab — Spoonacular recipes */}
            {pickerTab === 'discover' && (
              <>
                {discoverLoading ? (
                  <div className="text-center py-12 space-y-2">
                    <div className="w-6 h-6 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-stone-500">Loading recipes...</p>
                  </div>
                ) : discoverMeals.length === 0 ? (
                  <div className="text-center text-stone-500 py-12 space-y-2">
                    <ChefHat className="w-8 h-8 mx-auto text-stone-300" />
                    <p className="text-sm">No recipes found. Try a different search.</p>
                  </div>
                ) : (
                  discoverMeals.map(meal => (
                    <div 
                      key={meal.id}
                      onClick={() => handleSelectDiscoverMeal(meal)}
                      className="flex items-center gap-3 p-3 rounded-xl border border-stone-200/80 cursor-pointer transition-all hover:bg-orange-50/60 hover:border-orange-200 bg-white"
                    >
                      <div className="h-12 w-12 rounded-lg overflow-hidden shrink-0 border border-stone-200/60">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={meal.image} alt={meal.title} className="w-full h-full object-cover" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-stone-900 truncate">{meal.title}</div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {'readyInMinutes' in meal && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-medium text-stone-600 border-stone-200">
                              {(meal as SpoonacularRecipe).readyInMinutes} min
                            </Badge>
                          )}
                          {'servings' in meal && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-medium text-orange-700 border-orange-200 bg-orange-50">
                              {(meal as SpoonacularRecipe).servings} servings
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                
                {!discoverLoading && discoverMeals.length > 0 && (
                  <button
                    type="button"
                    onClick={() => loadDiscoverMeals(searchQuery || undefined)}
                    className="w-full py-2 text-sm text-primary font-semibold hover:underline cursor-pointer"
                  >
                    Shuffle — load more recipes
                  </button>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
