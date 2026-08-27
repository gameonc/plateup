"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Star, Clock, Users, ChefHat, Trash2, Check, 
  CookingPot, ExternalLink, StickyNote, Loader2, CirclePlay, Camera, ImageIcon
} from "lucide-react";
import { useRecipes } from "@/hooks/useRecipes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { recipes, loading, rateRecipe, updateRecipe, markAsMade, deleteRecipe } = useRecipes();
  
  const recipe = recipes?.find((r) => r.id === id);
  const [notes, setNotes] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMarkingMade, setIsMarkingMade] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (recipe) {
      setNotes(recipe.notes || "");
    }
  }, [recipe]);

  const handleNotesBlur = () => {
    if (recipe && notes !== recipe.notes) {
      updateRecipe(id, { notes });
    }
  };

  const handleRate = (rating: number) => {
    if (recipe) {
      rateRecipe(id, rating);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteRecipe(id);
      router.push("/recipes");
    } catch (e) {
      console.error(e);
      setIsDeleting(false);
    }
  };

  const handleMadeThis = async () => {
    setIsMarkingMade(true);
    try {
      await markAsMade(id);
      // Optional: Add confetti logic here
    } finally {
      setIsMarkingMade(false);
    }
  };

  const toggleIngredient = (index: number) => {
    setCheckedIngredients(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  if (loading) {
    return <div className="p-8 flex justify-center items-center h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!recipe) {
    return (
      <div className="container max-w-4xl mx-auto p-4 text-center mt-20">
        <h1 className="text-2xl font-bold mb-4">Recipe not found</h1>
        <Link href="/recipes"><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" /> Back to recipes</Button></Link>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto p-4 md:p-6 lg:p-8 space-y-8 pb-20">
      {/* Header / Nav */}
      <div className="flex items-center gap-2 mb-4">
        <Link href="/recipes" className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Recipes
        </Link>
      </div>

      {/* Hero Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="w-full aspect-video md:aspect-square bg-muted rounded-2xl overflow-hidden relative shadow-sm">
          {recipe.thumbnailUrl ? (
            <img src={recipe.thumbnailUrl} alt={recipe.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
              <ChefHat className="w-24 h-24 text-primary/20" />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {recipe.source === "youtube" && (
                <Badge className="bg-red-500 hover:bg-red-600 text-white">
                  <CirclePlay className="w-3 h-3 mr-1"/> YouTube
                </Badge>
              )}
              {recipe.source === "image" && (
                <Badge className="bg-blue-500 hover:bg-blue-600 text-white">
                  <Camera className="w-3 h-3 mr-1"/> Photo
                </Badge>
              )}
              {recipe.sourceUrl && (
                <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                  Original Source <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight">
              {recipe.name}
            </h1>

            <div className="flex items-center gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => handleRate(star)} className="focus:outline-none focus-visible:ring-2 rounded-full p-1 transition-transform hover:scale-110">
                  <Star className={`w-6 h-6 ${recipe.rating && recipe.rating >= star ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30"}`} />
                </button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground">Rate this recipe</span>
            </div>

            {recipe.tags && recipe.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {recipe.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="px-3 py-1 text-sm font-medium">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t">
            <div className="flex flex-col items-center justify-center p-3 bg-secondary/50 rounded-xl">
              <Clock className="w-5 h-5 text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Prep</span>
              <span className="font-semibold">{recipe.prepTimeMinutes || 0} min</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-secondary/50 rounded-xl">
              <CookingPot className="w-5 h-5 text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Cook</span>
              <span className="font-semibold">{recipe.cookTimeMinutes || 0} min</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-secondary/50 rounded-xl">
              <Users className="w-5 h-5 text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Yield</span>
              <span className="font-semibold">{recipe.servings || "-"}</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-secondary/50 rounded-xl">
              <ChefHat className="w-5 h-5 text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Level</span>
              <span className="font-semibold capitalize">{recipe.difficulty || "Medium"}</span>
            </div>
          </div>
          
          {(recipe.timesMade !== undefined && recipe.timesMade > 0) && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>Made <strong>{recipe.timesMade}</strong> times.</span>
              {recipe.lastMadeAt && <span>Last made: {new Date(recipe.lastMadeAt).toLocaleDateString()}</span>}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8">
        {/* Left Column: Ingredients */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-md bg-card/50">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-xl flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-primary" />
                Ingredients
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-3">
                {recipe.ingredients?.map((ingredient, idx) => (
                  <li 
                    key={idx} 
                    className="flex items-start gap-3 p-2 hover:bg-secondary/40 rounded-lg transition-colors cursor-pointer group"
                    onClick={() => toggleIngredient(idx)}
                  >
                    <div className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${checkedIngredients[idx] ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/40 group-hover:border-primary/50'}`}>
                      {checkedIngredients[idx] && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <span className={`text-base transition-colors ${checkedIngredients[idx] ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {ingredient.amount && <span className="font-semibold mr-1">{ingredient.amount}</span>}
                      {ingredient.unit && <span className="text-muted-foreground mr-1">{ingredient.unit}</span>}
                      {ingredient.item}
                    </span>
                  </li>
                ))}
                {(!recipe.ingredients || recipe.ingredients.length === 0) && (
                  <p className="text-muted-foreground text-sm italic">No ingredients listed.</p>
                )}
              </ul>
            </CardContent>
          </Card>
          
          {/* Notes Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <StickyNote className="w-4 h-4" /> Personal Notes
            </h3>
            <Textarea 
              placeholder="Jot down tweaks, variations, or serving ideas..."
              className="min-h-[120px] resize-y bg-secondary/20"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesBlur}
            />
          </div>
        </div>

        {/* Right Column: Instructions */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold border-b pb-4">Instructions</h2>
          <div className="space-y-4">
            {recipe.instructions?.map((step, idx) => (
              <Card key={idx} className="border-none shadow-sm bg-card/40 relative overflow-hidden group hover:bg-card/80 transition-colors">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/20 group-hover:bg-primary/50 transition-colors"></div>
                <CardContent className="p-5 pl-6 sm:pl-8 flex gap-4 sm:gap-6">
                  <div className="shrink-0 flex flex-col items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-lg">
                    {idx + 1}
                  </div>
                  <p className="text-foreground text-base leading-relaxed pt-1">
                    {step}
                  </p>
                </CardContent>
              </Card>
            ))}
            {(!recipe.instructions || recipe.instructions.length === 0) && (
              <p className="text-muted-foreground italic">No instructions provided.</p>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Bar / Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t z-10 sm:relative sm:bg-transparent sm:backdrop-blur-none sm:border-t-0 sm:p-0 sm:mt-12 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Dialog>
          <DialogTrigger className="w-full sm:w-auto order-2 sm:order-1 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium bg-destructive text-white px-6 py-3 hover:bg-destructive/90 transition-colors">
              <Trash2 className="w-4 h-4" />
              Delete Recipe
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Recipe</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{recipe.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button variant="outline" disabled={isDeleting}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Yes, delete it
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button 
          size="lg" 
          className="w-full sm:w-auto order-1 sm:order-2 bg-orange-500 hover:bg-orange-600 text-white shadow-lg text-lg px-8 h-14 rounded-full"
          onClick={handleMadeThis}
          disabled={isMarkingMade}
        >
          {isMarkingMade ? (
             <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <ChefHat className="w-5 h-5 mr-2" />
          )}
          I Made This!
        </Button>
      </div>
    </div>
  );
}
