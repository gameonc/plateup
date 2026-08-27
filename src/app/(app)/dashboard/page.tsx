"use client";

import Link from "next/link";
import { format, isSameMonth } from "date-fns";
import { 
  CirclePlay, 
  Camera, 
  BookOpen, 
  Clock, 
  ChevronRight, 
  Loader2,
  UtensilsCrossed,
  Plus
} from "lucide-react";

import { useRecipes } from "@/hooks/useRecipes";
import { useMealPlan } from "@/hooks/useMealPlan";
import { useCookingLog } from "@/hooks/useCookingLog";
import type { DayOfWeek, MealTime } from "@/types";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-12">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome Back</h1>
        <p className="text-slate-500 mt-1">Here is what is on your plate today.</p>
      </header>

      {/* Quick Actions */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/extract">
            <Card className="hover:shadow-md transition-shadow cursor-pointer bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100">
              <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                <div className="p-3 bg-orange-100 text-orange-600 rounded-full">
                  <CirclePlay className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-orange-900">Extract from YouTube</h3>
                  <p className="text-sm text-orange-700/80 mt-1">Paste a video URL</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/extract?tab=photo">
            <Card className="hover:shadow-md transition-shadow cursor-pointer bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-100">
              <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                <div className="p-3 bg-amber-100 text-amber-600 rounded-full">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-900">Snap a Photo</h3>
                  <p className="text-sm text-amber-700/80 mt-1">Identify a dish</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/recipes">
            <Card className="hover:shadow-md transition-shadow cursor-pointer bg-gradient-to-br from-rose-50 to-orange-50 border-rose-100">
              <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                <div className="p-3 bg-rose-100 text-rose-600 rounded-full">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-rose-900">Browse Recipes</h3>
                  <p className="text-sm text-rose-700/80 mt-1">View your collection</p>
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
            <h2 className="text-xl font-semibold text-slate-900">Today&apos;s Menu</h2>
            <p className="text-sm text-slate-500">{displayDate}</p>
          </div>
          <Link href="/meal-plan">
            <Button variant="ghost" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50">
              View Week <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mealTimes.map((time) => {
            const slot = todayMeals[time];
            const recipe = slot ? recipes?.find(r => r.id === slot.recipeId) : null;
            
            return (
              <Card key={time} className="flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                    {time}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  {slot && recipe ? (
                    <div className="space-y-4">
                      {recipe.thumbnailUrl ? (
                        <div 
                          className="w-full h-32 rounded-md bg-cover bg-center"
                          style={{ backgroundImage: `url(${recipe.thumbnailUrl})` }}
                        />
                      ) : (
                        <div className="w-full h-32 rounded-md bg-slate-100 flex items-center justify-center text-slate-400">
                          <UtensilsCrossed className="w-8 h-8" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-slate-900 line-clamp-2 leading-tight">
                          {recipe.name}
                        </h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {recipe.prepTimeMinutes + (recipe.cookTimeMinutes || 0)} min
                          </span>
                        </div>
                      </div>
                      <Link href={`/recipes/${recipe.id}`} className="block mt-4">
                        <Button variant="outline" className="w-full">View Recipe</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center py-8 space-y-3 bg-slate-50 rounded-md border border-dashed border-slate-200">
                      <p className="text-sm text-slate-500">No meal planned</p>
                      <Link href="/meal-plan">
                        <Button size="sm" variant="secondary" className="gap-1">
                          <Plus className="w-4 h-4" /> Add Meal
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
            <h2 className="text-xl font-semibold text-slate-900">Recently Added</h2>
            <Link href="/recipes">
              <Button variant="ghost" className="text-slate-500 hover:text-slate-900">View All</Button>
            </Link>
          </div>
          <Card>
            <CardContent className="p-0">
              {recentRecipes.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {recentRecipes.map((recipe) => (
                    <Link key={recipe.id} href={`/recipes/${recipe.id}`} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        {recipe.thumbnailUrl ? (
                          <div 
                            className="w-12 h-12 rounded bg-cover bg-center flex-shrink-0"
                            style={{ backgroundImage: `url(${recipe.thumbnailUrl})` }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                            <UtensilsCrossed className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-slate-900 line-clamp-1">{recipe.name}</p>
                          <p className="text-xs text-slate-500">
                            Added {format(recipe.createdAt, "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="capitalize shrink-0">
                        {recipe.source === "youtube" && <CirclePlay className="w-3 h-3 mr-1 inline-block" />}
                        {recipe.source === "image" && <Camera className="w-3 h-3 mr-1 inline-block" />}
                        {recipe.source}
                      </Badge>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <p>No recipes added yet.</p>
                  <Link href="/extract">
                    <Button variant="link" className="text-amber-600 mt-2">Extract your first recipe</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Stats */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Your Stats</h2>
          <div className="flex flex-col gap-4">
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-900">{totalRecipes}</p>
                  <p className="text-sm font-medium text-slate-500">Total recipes saved</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full">
                  <UtensilsCrossed className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-900">{mealsPlannedThisWeek}</p>
                  <p className="text-sm font-medium text-slate-500">Meals planned this week</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-full">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-900">{recipesMadeThisMonth}</p>
                  <p className="text-sm font-medium text-slate-500">Recipes made this month</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
