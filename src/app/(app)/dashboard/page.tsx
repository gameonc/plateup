"use client";

import Link from "next/link";
import { format, isSameMonth } from "date-fns";
import { 
  CirclePlay, 
  Camera, 
  BookOpen, 
  Clock, 
  ChevronRight, 
  UtensilsCrossed,
  Plus,
  Flame,
  CalendarDays
} from "lucide-react";

import { useRecipes } from "@/hooks/useRecipes";
import { useMealPlan } from "@/hooks/useMealPlan";
import { useCookingLog } from "@/hooks/useCookingLog";
import type { DayOfWeek, MealTime } from "@/types";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardSkeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { recipes, loading: recipesLoading } = useRecipes();
  const { mealPlan, loading: mealPlanLoading } = useMealPlan();
  const { logs, loading: logsLoading } = useCookingLog(30);

  const todayDate = new Date();
  const dayOfWeek = format(todayDate, "EEEE").toLowerCase() as DayOfWeek;
  const displayDate = format(todayDate, "EEEE, MMMM d");

  const todayMeals = mealPlan?.meals?.[dayOfWeek] || {};
  const mealTimes: MealTime[] = ["breakfast", "lunch", "dinner"];

  // Stats calculation
  const totalRecipes = recipes?.length || 0;
  
  let mealsPlannedThisWeek = 0;
  if (mealPlan?.meals) {
    Object.values(mealPlan.meals).forEach((dayMeals) => {
      mealsPlannedThisWeek += Object.keys(dayMeals || {}).length;
    });
  }

  const recipesMadeThisMonth = logs?.filter(log => isSameMonth(log.cookedAt, todayDate)).length || 0;

  // Recently added recipes (last 5)
  const recentRecipes = [...(recipes || [])]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  const isLoading = recipesLoading || mealPlanLoading || logsLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-12 px-4 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-stone-900">Welcome Back</h1>
        <p className="text-stone-600 mt-1">Here is what is on your plate today.</p>
      </header>

      {/* Quick Actions */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/extract">
            <Card className="hover:shadow-md hover:border-orange-300 transition-all cursor-pointer bg-gradient-to-br from-orange-50/80 to-amber-50/50 border-orange-200/80 rounded-2xl">
              <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                <div className="p-3 bg-orange-100 text-primary rounded-2xl shadow-xs">
                  <CirclePlay className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-stone-900">Extract from YouTube</h3>
                  <p className="text-sm text-stone-600 mt-1">Paste any video URL</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/extract?tab=photo">
            <Card className="hover:shadow-md hover:border-amber-300 transition-all cursor-pointer bg-gradient-to-br from-amber-50/80 to-yellow-50/50 border-amber-200/80 rounded-2xl">
              <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl shadow-xs">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-stone-900">Snap a Photo</h3>
                  <p className="text-sm text-stone-600 mt-1">AI identifies any dish</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/recipes">
            <Card className="hover:shadow-md hover:border-orange-300 transition-all cursor-pointer bg-gradient-to-br from-stone-50 to-orange-50/40 border-stone-200/80 rounded-2xl">
              <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                <div className="p-3 bg-stone-100 text-stone-700 rounded-2xl shadow-xs">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-stone-900">Browse Recipes</h3>
                  <p className="text-sm text-stone-600 mt-1">View your saved collection</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>

      {/* Today's Menu Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-stone-900">Today&apos;s Menu</h2>
            <p className="text-sm text-stone-500">{displayDate}</p>
          </div>
          <Link href="/meal-plan">
            <Button variant="ghost" className="text-primary hover:text-orange-700 hover:bg-orange-50 font-medium">
              View Week <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mealTimes.map((time) => {
            const slot = todayMeals[time];
            const recipe = slot ? recipes?.find(r => r.id === slot.recipeId) : null;
            
            return (
              <Card key={time} className="flex flex-col border-stone-200/80 rounded-2xl overflow-hidden shadow-xs hover:shadow-sm transition-all">
                <CardHeader className="pb-2 bg-stone-50/60 border-b border-stone-100">
                  <CardTitle className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center justify-between">
                    <span>{time}</span>
                    {slot && <Badge variant="secondary" className="text-[10px] bg-orange-100 text-orange-900">Planned</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between pt-4">
                  {slot && recipe ? (
                    <div className="space-y-4">
                      {recipe.thumbnailUrl ? (
                        <div 
                          className="w-full h-32 rounded-xl bg-cover bg-center border border-stone-100"
                          style={{ backgroundImage: `url(${recipe.thumbnailUrl})` }}
                        />
                      ) : (
                        <div className="w-full h-32 rounded-xl bg-orange-50 flex items-center justify-center text-primary/40">
                          <UtensilsCrossed className="w-8 h-8" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-stone-900 line-clamp-2 leading-tight">
                          {recipe.name}
                        </h3>
                        <div className="flex items-center gap-4 mt-2 text-xs text-stone-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            {(recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0)} min
                          </span>
                        </div>
                      </div>
                      <Link href={`/recipes/${recipe.id}`} className="block mt-4">
                        <Button variant="outline" className="w-full rounded-xl border-stone-200 hover:bg-orange-50 hover:text-primary">
                          View Recipe
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center py-8 space-y-3 bg-stone-50/60 rounded-xl border border-dashed border-stone-200">
                      <p className="text-sm text-stone-500">No meal planned</p>
                      <Link href="/meal-plan">
                        <Button size="sm" variant="secondary" className="gap-1 bg-white hover:bg-stone-100 border border-stone-200 shadow-2xs text-stone-800">
                          <Plus className="w-4 h-4 text-primary" /> Add Meal
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Recent Activity */}
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-stone-900">Recently Added</h2>
            <Link href="/recipes">
              <Button variant="ghost" className="text-stone-600 hover:text-stone-900">View All</Button>
            </Link>
          </div>
          <Card className="border-stone-200/80 rounded-2xl overflow-hidden shadow-xs">
            <CardContent className="p-0">
              {recentRecipes.length > 0 ? (
                <div className="divide-y divide-stone-100">
                  {recentRecipes.map((recipe) => (
                    <Link key={recipe.id} href={`/recipes/${recipe.id}`} className="flex items-center justify-between p-4 hover:bg-stone-50/80 transition-colors">
                      <div className="flex items-center gap-4">
                        {recipe.thumbnailUrl ? (
                          <div 
                            className="w-12 h-12 rounded-xl bg-cover bg-center shrink-0 border border-stone-200/60"
                            style={{ backgroundImage: `url(${recipe.thumbnailUrl})` }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-orange-100 text-primary flex items-center justify-center shrink-0">
                            <UtensilsCrossed className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-stone-900 line-clamp-1">{recipe.name}</p>
                          <p className="text-xs text-stone-500">
                            Added {format(recipe.createdAt, "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="capitalize shrink-0 bg-stone-100 text-stone-700">
                        {recipe.source === "youtube" && <CirclePlay className="w-3 h-3 mr-1 inline-block text-red-500" />}
                        {recipe.source === "image" && <Camera className="w-3 h-3 mr-1 inline-block text-blue-500" />}
                        {recipe.source}
                      </Badge>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-stone-500 space-y-3">
                  <p>No recipes added yet.</p>
                  <Link href="/extract">
                    <Button className="bg-primary hover:bg-orange-700 text-white">Extract your first recipe</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Stats */}
        <section>
          <h2 className="text-xl font-bold text-stone-900 mb-4">Your Stats</h2>
          <div className="flex flex-col gap-4">
            <Card className="border-stone-200/80 rounded-2xl shadow-xs">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-orange-100 text-primary rounded-2xl shadow-2xs">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-stone-900">{totalRecipes}</p>
                  <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Total recipes saved</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-stone-200/80 rounded-2xl shadow-xs">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl shadow-2xs">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-stone-900">{mealsPlannedThisWeek}</p>
                  <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Meals planned this week</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-stone-200/80 rounded-2xl shadow-xs">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl shadow-2xs">
                  <Flame className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-stone-900">{recipesMadeThisMonth}</p>
                  <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Cooked this month</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
