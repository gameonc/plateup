"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { BookOpen, Search, Star, Clock, ChefHat, Plus, Sparkles, CirclePlay, Camera, ImageIcon } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRecipes } from "@/hooks/useRecipes";
import { Recipe } from "@/types";

export default function RecipesPage() {
  const { recipes, loading, error } = useRecipes();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const filteredAndSortedRecipes = useMemo(() => {
    if (!recipes) return [];
    
    let filtered = recipes.filter((recipe) => {
      const matchName = recipe.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchTags = recipe.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchName || matchTags;
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
  }, [recipes, searchQuery, sortBy]);

  if (loading) {
    return <div className="p-8 flex justify-center items-center h-full text-muted-foreground"><ChefHat className="w-8 h-8 animate-pulse" /></div>;
  }

  if (error) {
    return <div className="p-8 text-destructive text-center">Error loading recipes.</div>;
  }

  return (
    <div className="container max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">My Recipes</h1>
          <Badge variant="secondary" className="ml-2 rounded-full px-2.5">
            {recipes?.length || 0}
          </Badge>
        </div>
        <Link href="/extract">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Recipe
          </Button>
        </Link>
      </div>

      {recipes?.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-2">
          <Sparkles className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No recipes yet!</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Extract your first recipe from a YouTube video or photo to get started.
          </p>
          <Link href="/extract">
            <Button size="lg">Extract Recipe</Button>
          </Link>
        </Card>
      ) : (
        <>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name or tags..." 
                className="pl-9 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full md:w-auto ml-auto">
              <Select value={sortBy} onValueChange={(v) => v && setSortBy(v)}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="highest-rated">Highest Rated</SelectItem>
                  <SelectItem value="most-made">Most Made</SelectItem>
                  <SelectItem value="recently-made">Recently Made</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredAndSortedRecipes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No recipes found matching your search.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedRecipes.map((recipe) => (
                <Link key={recipe.id} href={`/recipes/${recipe.id}`}>
                  <Card className="h-full hover:shadow-md transition-shadow cursor-pointer overflow-hidden group flex flex-col">
                    <div className="aspect-video relative bg-muted flex items-center justify-center overflow-hidden">
                      {recipe.thumbnailUrl ? (
                        <img 
                          src={recipe.thumbnailUrl} 
                          alt={recipe.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                          <ChefHat className="w-12 h-12 text-primary/20" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        {recipe.source === "youtube" && (
                          <Badge className="bg-red-500 hover:bg-red-600 border-none shadow-sm gap-1 text-white"><CirclePlay className="w-3 h-3"/> YouTube</Badge>
                        )}
                        {recipe.source === "image" && (
                          <Badge className="bg-blue-500 hover:bg-blue-600 border-none shadow-sm gap-1 text-white"><Camera className="w-3 h-3"/> Photo</Badge>
                        )}
                        {recipe.source === "manual" && (
                          <Badge className="bg-green-500 hover:bg-green-600 border-none shadow-sm gap-1 text-white"><ImageIcon className="w-3 h-3"/> Manual</Badge>
                        )}
                      </div>
                    </div>
                    
                    <CardContent className="p-4 flex-grow">
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <h3 className="font-semibold text-lg line-clamp-2 leading-tight group-hover:text-primary transition-colors">{recipe.name}</h3>
                        <div className="flex items-center gap-1 shrink-0 text-amber-500">
                          <Star className={`w-4 h-4 ${recipe.rating && recipe.rating > 0 ? "fill-amber-500" : "text-muted-foreground/30"}`} />
                          <span className="text-sm font-medium text-foreground">{recipe.rating || "—"}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-sm text-muted-foreground mb-4">
                        <Clock className="w-4 h-4 mr-1.5" />
                        <span>{(recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0)} min total</span>
                      </div>

                      {recipe.tags && recipe.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-auto">
                          {recipe.tags.slice(0, 3).map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-xs font-normal">
                              {tag}
                            </Badge>
                          ))}
                          {recipe.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs font-normal">
                              +{recipe.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
