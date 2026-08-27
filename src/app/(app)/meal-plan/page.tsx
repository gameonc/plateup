'use client';

import { useState, useMemo } from 'react';
import { addWeeks, subWeeks, startOfWeek, endOfWeek, format, getISOWeek, getYear } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, Plus, X, Sparkles, Trash2, Search, Clock, ChefHat, Loader2 } from 'lucide-react';
import { useMealPlan } from '@/hooks/useMealPlan';
import { useRecipes } from '@/hooks/useRecipes';
import { useCookingLog } from '@/hooks/useCookingLog';
import { generateMealPlan, DAYS_OF_WEEK, MEAL_TIMES, formatDayName, formatMealTime, createEmptyWeekMeals } from '@/lib/meal-planner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { DayOfWeek, MealTime, Recipe } from '@/types';
import { cn } from '@/lib/utils';

function getISOWeekId(date: Date): string {
  return `${getYear(date)}-W${getISOWeek(date).toString().padStart(2, '0')}`;
}

export default function MealPlanPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentWeekId = getISOWeekId(currentDate);
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  
  const repeatWindowDays = 5;
  
  const { mealPlan, loading: mealPlanLoading, setMealSlot, clearMealSlot, saveMealPlan } = useMealPlan(currentWeekId);
  const { recipes, loading: recipesLoading } = useRecipes();
  const { getRecentRecipeIds, loading: logsLoading } = useCookingLog(repeatWindowDays);

  const [activeSlot, setActiveSlot] = useState<{ day: DayOfWeek; meal: MealTime } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const handleNextWeek = () => setCurrentDate(prev => addWeeks(prev, 1));
  const handlePrevWeek = () => setCurrentDate(prev => subWeeks(prev, 1));

  const handleAutoFill = async () => {
    if (!mealPlan || !recipes.length) return;
    const recentRecipeIds = getRecentRecipeIds(repeatWindowDays);
    const lockedSlots = mealPlan.meals || createEmptyWeekMeals();
    const newPlan = generateMealPlan(recipes, recentRecipeIds, lockedSlots, repeatWindowDays);
    await saveMealPlan(newPlan);
  };

  const handleClearAll = async () => {
    await saveMealPlan(createEmptyWeekMeals());
  };

  const handleSelectRecipe = async (recipe: Recipe) => {
    if (!activeSlot) return;
    await setMealSlot(activeSlot.day, activeSlot.meal, {
      recipeId: recipe.id,
      recipeName: recipe.name,
      thumbnailUrl: recipe.thumbnailUrl,
    });
    setIsPickerOpen(false);
    setActiveSlot(null);
  };

  const openPicker = (day: DayOfWeek, meal: MealTime) => {
    setActiveSlot({ day, meal });
    setSearchQuery('');
    setIsPickerOpen(true);
  };

  const recentIds = useMemo(() => getRecentRecipeIds(repeatWindowDays), [getRecentRecipeIds, repeatWindowDays]);

  const filteredRecipes = useMemo(() => {
    return recipes.filter(r => 
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [recipes, searchQuery]);

  const isLoading = mealPlanLoading || recipesLoading || logsLoading;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <Calendar className="h-5 w-5" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Meal Plan</h1>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handleClearAll} className="w-full sm:w-auto">
            <Trash2 className="mr-2 h-4 w-4" />
            Clear All
          </Button>
          <Button onClick={handleAutoFill} className="w-full sm:w-auto">
            <Sparkles className="mr-2 h-4 w-4" />
            Auto-Fill Week
          </Button>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-center gap-4 bg-muted/30 p-2 rounded-lg">
        <Button variant="ghost" size="icon" onClick={handlePrevWeek}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="font-medium text-lg min-w-[200px] text-center">
          {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
        </div>
        <Button variant="ghost" size="icon" onClick={handleNextWeek}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="flex flex-col gap-3">
            <h3 className="font-semibold text-center py-2 bg-muted/50 rounded-md">
              {formatDayName(day)}
            </h3>
            <div className="flex flex-col gap-3">
              {MEAL_TIMES.map((meal) => {
                const slot = mealPlan?.meals?.[day]?.[meal];
                
                return (
                  <Card key={meal} className={cn(
                    "relative overflow-hidden group flex flex-col h-[140px] transition-all",
                    slot ? "border-primary/20 bg-primary/5" : "border-dashed hover:border-primary/50"
                  )}>
                    <div className="p-2 text-xs font-medium text-muted-foreground uppercase tracking-wider flex justify-between items-center z-10 bg-background/80 backdrop-blur-sm">
                      {formatMealTime(meal)}
                      {slot && (
                        <button 
                          onClick={() => clearMealSlot(day, meal)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="flex-1 flex flex-col p-2 pt-0 h-full">
                      {slot ? (
                        <div className="flex flex-col h-full cursor-pointer" onClick={() => openPicker(day, meal)}>
                          {slot.thumbnailUrl ? (
                            <div className="absolute inset-0 opacity-20 transition-opacity group-hover:opacity-10">
                              <img src={slot.thumbnailUrl} alt={slot.recipeName} className="w-full h-full object-cover" />
                            </div>
                          ) : null}
                          <div className="relative z-10 flex-1 flex items-center justify-center text-center font-medium p-1">
                            {slot.recipeName}
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={() => openPicker(day, meal)}
                          className="flex-1 flex flex-col items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-md transition-colors"
                        >
                          <Plus className="h-6 w-6 mb-1" />
                          <span className="text-sm">Add Recipe</span>
                        </button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Recipe Picker Dialog */}
      <Dialog open={isPickerOpen} onOpenChange={setIsPickerOpen}>
        <DialogContent className="sm:max-w-[500px] h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Choose recipe for {activeSlot ? `${formatDayName(activeSlot.day)} ${formatMealTime(activeSlot.meal)}` : ''}
            </DialogTitle>
          </DialogHeader>
          
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search recipes..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Separator className="my-2" />
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-2">
            {filteredRecipes.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No recipes found.
              </div>
            ) : (
              filteredRecipes.map(recipe => {
                const isRecent = recentIds.has(recipe.id);
                return (
                  <div 
                    key={recipe.id}
                    onClick={() => handleSelectRecipe(recipe)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted",
                      isRecent ? "opacity-75 bg-muted/50" : ""
                    )}
                  >
                    {recipe.thumbnailUrl ? (
                      <div className="h-12 w-12 rounded-md overflow-hidden flex-shrink-0">
                        <img src={recipe.thumbnailUrl} alt={recipe.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                        <ChefHat className="h-6 w-6" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{recipe.name}</div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="mr-1 h-3 w-3" />
                          {recipe.prepTimeMinutes + recipe.cookTimeMinutes}m
                        </div>
                        {isRecent && (
                          <Badge variant="secondary" className="text-[10px] h-4 px-1">
                            Recently made
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
