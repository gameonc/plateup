"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Star, Clock, Users, ChefHat, Trash2, Check, 
  CookingPot, ExternalLink, StickyNote, Loader2, CirclePlay, Camera, ShoppingBag
} from "lucide-react";
import { useRecipes } from "@/hooks/useRecipes";
import { useShoppingList } from "@/hooks/useShoppingList";
import { OrderIngredientsButton } from "@/components/shopping/OrderIngredientsButton";
import { AFFILIATE_DISCLOSURE_TEXT } from "@/lib/affiliate";
import { scaleIngredientAmount } from "@/lib/ingredient-parser";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { RecipeDetailSkeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogClose,
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
  const { addRecipeToList } = useShoppingList();
  
  const recipe = recipes?.find((r) => r.id === id);
  const [editedNotes, setEditedNotes] = useState<string | null>(null);
  const notes = editedNotes !== null ? editedNotes : (recipe?.notes || "");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMarkingMade, setIsMarkingMade] = useState(false);
  const [isAddingToList, setIsAddingToList] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});
  const [adjustedServings, setAdjustedServings] = useState<number | null>(null);

  const originalServings = recipe?.servings || 4;
  const currentServings = adjustedServings ?? originalServings;
  const scale = currentServings / originalServings;

  // Scale an ingredient amount string (e.g., "2" → "4", "½" → "1", "1 1/2" → "3")
  const scaleAmount = (amount: string, customScale: number = scale): string => {
    return scaleIngredientAmount(amount, customScale);
  };

  const handleAddToList = async () => {
    if (!recipe) return;
    setIsAddingToList(true);
    try {
      await addRecipeToList(recipe);
      toast.create({
        title: "Added to Shopping List! 🛒",
        description: `Added all ingredients from "${recipe.name}" to your shopping list.`,
        type: "success",
      });
    } catch (err) {
      console.error(err);
      toast.create({
        title: "Error",
        description: "Failed to add ingredients to shopping list.",
        type: "error",
      });
    } finally {
      setIsAddingToList(false);
    }
  };

  const handleNotesBlur = () => {
    if (recipe && notes !== (recipe.notes || "")) {
      updateRecipe(id, { notes });
      toast.create({
        title: "Notes Saved",
        description: "Your recipe notes have been updated.",
        type: "success",
      });
    }
  };

  const handleRate = async (rating: number) => {
    if (recipe) {
      await rateRecipe(id, rating);
      toast.create({
        title: "Rating Updated",
        description: `You rated this recipe ${rating} stars!`,
        type: "success",
      });
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteRecipe(id);
      toast.create({
        title: "Recipe Deleted",
        description: "The recipe has been removed from your collection.",
        type: "info",
      });
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
      toast.create({
        title: "Cook Logged! 🎉",
        description: `Great job! You've cooked this ${(recipe?.timesMade || 0) + 1} times.`,
        type: "success",
      });
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
    return <RecipeDetailSkeleton />;
  }

  if (!recipe) {
    return (
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center mt-20 space-y-4">
        <h1 className="text-2xl font-bold text-stone-900">Recipe not found</h1>
        <p className="text-stone-500">This recipe may have been removed or does not exist.</p>
        <Link href="/recipes">
          <Button variant="outline" className="rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to recipes
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-20 pt-4">
      {/* Header / Nav */}
      <div className="flex items-center gap-2 mb-2">
        <Link href="/recipes" className="text-stone-500 hover:text-stone-900 transition-colors inline-flex items-center text-sm font-medium">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Recipes
        </Link>
      </div>

      {/* Hero Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="w-full aspect-video md:aspect-square bg-stone-100 rounded-2xl overflow-hidden relative shadow-sm border border-stone-200/80">
          {recipe.thumbnailUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={recipe.thumbnailUrl} alt={recipe.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
              <ChefHat className="w-24 h-24 text-primary/20" />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {recipe.source === "youtube" && (
                <Badge className="bg-red-500 hover:bg-red-600 text-white shadow-2xs">
                  <CirclePlay className="w-3 h-3 mr-1"/> YouTube
                </Badge>
              )}
              {recipe.source === "image" && (
                <Badge className="bg-blue-500 hover:bg-blue-600 text-white shadow-2xs">
                  <Camera className="w-3 h-3 mr-1"/> Photo
                </Badge>
              )}
              {recipe.sourceUrl && (
                <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">
                  Original Source <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-stone-900 leading-tight">
              {recipe.name}
            </h1>

            {recipe.description && (
              <p className="text-stone-600 text-sm leading-relaxed">{recipe.description}</p>
            )}

            <div className="flex items-center gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button 
                  key={star} 
                  type="button"
                  onClick={() => handleRate(star)} 
                  className="focus:outline-none focus-visible:ring-2 rounded-full p-1 transition-transform hover:scale-125 active:scale-95 cursor-pointer"
                  aria-label={`Rate ${star} stars`}
                >
                  <Star className={`w-6 h-6 transition-colors ${recipe.rating && recipe.rating >= star ? "fill-amber-500 text-amber-500" : "text-stone-300"}`} />
                </button>
              ))}
              <span className="ml-2 text-xs font-medium text-stone-500">
                {recipe.rating ? `${recipe.rating} of 5 stars` : 'Rate this recipe'}
              </span>
            </div>

            {recipe.dietaryTags && recipe.dietaryTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {recipe.dietaryTags.map((dTag, i) => (
                  <Badge key={i} variant="outline" className="px-3 py-1 text-xs font-bold bg-emerald-50 text-emerald-800 border-emerald-300 capitalize shadow-2xs">
                    🌱 {dTag}
                  </Badge>
                ))}
              </div>
            )}

            {recipe.tags && recipe.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {recipe.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="px-3 py-1 text-xs font-semibold bg-stone-100 text-stone-800">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-stone-200">
            <div className="flex flex-col items-center justify-center p-3 bg-stone-50 rounded-xl border border-stone-100">
              <Clock className="w-5 h-5 text-primary mb-1" />
              <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Prep</span>
              <span className="font-bold text-stone-900 text-sm">{recipe.prepTimeMinutes || 0} min</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-stone-50 rounded-xl border border-stone-100">
              <CookingPot className="w-5 h-5 text-amber-600 mb-1" />
              <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Cook</span>
              <span className="font-bold text-stone-900 text-sm">{recipe.cookTimeMinutes || 0} min</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-stone-50 rounded-xl border border-stone-100">
              <Users className="w-5 h-5 text-blue-600 mb-1" />
              <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Servings</span>
              <div className="flex items-center gap-2 mt-0.5">
                <button
                  type="button"
                  onClick={() => setAdjustedServings(Math.max(1, currentServings - 1))}
                  className="w-6 h-6 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-sm flex items-center justify-center cursor-pointer transition-colors"
                >
                  −
                </button>
                <span className="font-bold text-stone-900 text-sm min-w-[2ch] text-center">{currentServings}</span>
                <button
                  type="button"
                  onClick={() => setAdjustedServings(currentServings + 1)}
                  className="w-6 h-6 rounded-full bg-primary hover:bg-orange-600 text-white font-bold text-sm flex items-center justify-center cursor-pointer transition-colors"
                >
                  +
                </button>
              </div>
              {scale !== 1 && (
                <button
                  type="button"
                  onClick={() => setAdjustedServings(null)}
                  className="text-[9px] text-primary font-semibold mt-1 hover:underline cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-stone-50 rounded-xl border border-stone-100">
              <ChefHat className="w-5 h-5 text-purple-600 mb-1" />
              <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Level</span>
              <span className="font-bold text-stone-900 text-sm capitalize">{recipe.difficulty || "Medium"}</span>
            </div>
          </div>
          
          {(recipe.timesMade !== undefined && recipe.timesMade > 0) && (
            <div className="text-xs text-stone-600 flex items-center gap-2 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 font-medium">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Made <strong>{recipe.timesMade}</strong> times. {recipe.lastMadeAt && `Last cooked: ${new Date(recipe.lastMadeAt).toLocaleDateString()}`}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6">
        {/* Left Column: Ingredients */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-stone-200/80 shadow-xs bg-white rounded-2xl">
            <CardHeader className="pb-3 border-b border-stone-100 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-stone-900">
                <StickyNote className="w-4 h-4 text-primary" />
                Ingredients ({recipe.ingredients?.length || 0})
              </CardTitle>
              <div className="flex items-center gap-1.5">
                <OrderIngredientsButton
                  ingredients={recipe.ingredients || []}
                  size="sm"
                  variant="outline"
                  label="Order"
                  disabled={!recipe.ingredients?.length}
                  className="h-8 px-2.5 text-xs font-semibold bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 rounded-lg"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAddToList}
                  disabled={isAddingToList || !recipe.ingredients?.length}
                  className="h-8 px-2 text-xs font-semibold text-primary hover:bg-orange-50 hover:text-orange-700 rounded-lg"
                >
                  {isAddingToList ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                  ) : (
                    <ShoppingBag className="w-3.5 h-3.5 mr-1" />
                  )}
                  + List
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-2">
                {recipe.ingredients?.map((ingredient, idx) => (
                  <li 
                    key={idx} 
                    className="flex items-start gap-3 p-2 hover:bg-stone-50 rounded-xl transition-colors cursor-pointer group select-none"
                    onClick={() => toggleIngredient(idx)}
                  >
                    <div className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${checkedIngredients[idx] ? 'bg-primary border-primary text-primary-foreground' : 'border-stone-300 group-hover:border-primary'}`}>
                      {checkedIngredients[idx] && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <span className={`text-sm transition-colors ${checkedIngredients[idx] ? 'line-through text-stone-400' : 'text-stone-800'}`}>
                      {ingredient.amount && <span className={`font-semibold mr-1 ${scale !== 1 ? 'text-primary' : ''}`}>{scaleAmount(ingredient.amount)}</span>}
                      {ingredient.unit && <span className="text-stone-500 mr-1">{ingredient.unit}</span>}
                      {ingredient.item}
                    </span>
                  </li>
                ))}
                {(!recipe.ingredients || recipe.ingredients.length === 0) && (
                  <p className="text-stone-400 text-sm italic py-2">No ingredients listed.</p>
                )}
              </ul>

              {recipe.ingredients && recipe.ingredients.length > 0 && (
                <div className="pt-3 mt-3 border-t border-stone-100">
                  <p className="text-[10px] text-stone-400 text-center leading-snug">
                    {AFFILIATE_DISCLOSURE_TEXT}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Notes Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-primary" /> Personal Cooking Notes
            </h3>
            <Textarea 
              placeholder="Add your tweaks, substitute ingredients, or wine pairings..."
              className="min-h-[120px] resize-y bg-white rounded-xl border-stone-300 text-sm leading-relaxed focus-visible:ring-primary"
              value={notes}
              onChange={(e) => setEditedNotes(e.target.value)}
              onBlur={handleNotesBlur}
            />
            <p className="text-[11px] text-stone-400">Notes auto-save when you click away.</p>
          </div>
        </div>

        {/* Right Column: Instructions */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-stone-900 border-b border-stone-200 pb-3">
            Step-by-Step Instructions
          </h2>
          <div className="space-y-3">
            {recipe.instructions?.map((step, idx) => (
              <Card key={idx} className="border-stone-200/80 shadow-2xs bg-white rounded-2xl overflow-hidden hover:border-orange-200 transition-colors">
                <CardContent className="p-5 flex gap-4">
                  <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-primary font-bold text-sm">
                    {idx + 1}
                  </div>
                  <p className="text-stone-800 text-sm sm:text-base leading-relaxed pt-0.5">
                    {step}
                  </p>
                </CardContent>
              </Card>
            ))}
            {(!recipe.instructions || recipe.instructions.length === 0) && (
              <p className="text-stone-400 italic py-4">No instructions provided.</p>
            )}
          </div>
        </div>
      </div>

      {/* Action Bar / Bottom Actions */}
      <div className="pt-8 mt-8 border-t border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <Dialog>
          <DialogTrigger className="w-full sm:w-auto order-3 sm:order-1 inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold bg-red-50 text-red-600 px-5 py-3 hover:bg-red-100 transition-colors cursor-pointer border border-red-200">
            <Trash2 className="w-4 h-4" />
            Delete Recipe
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Delete Recipe</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &quot;{recipe.name}&quot;? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button variant="outline" className="rounded-xl" disabled={isDeleting}>Cancel</Button>
              </DialogClose>
              <Button variant="destructive" className="rounded-xl" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Yes, delete it
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 order-1 sm:order-2">
          <OrderIngredientsButton
            ingredients={recipe.ingredients || []}
            size="lg"
            variant="outline"
            label="Order Ingredients"
            disabled={!recipe.ingredients?.length}
            className="w-full sm:w-auto rounded-xl border-emerald-300 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-900 font-bold px-6 h-13 transition-all cursor-pointer shadow-xs"
          />

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full sm:w-auto rounded-xl border-orange-200 bg-orange-50/60 hover:bg-orange-100 text-primary font-bold px-6 h-13 transition-all cursor-pointer"
            onClick={handleAddToList}
            disabled={isAddingToList || !recipe.ingredients?.length}
          >
            {isAddingToList ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <ShoppingBag className="w-5 h-5 mr-2" />
            )}
            Add to Shopping List
          </Button>

          <Button 
            size="lg" 
            className="w-full sm:w-auto bg-primary hover:bg-orange-700 text-primary-foreground shadow-lg shadow-orange-600/20 text-base font-bold px-8 h-13 rounded-xl transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
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

      {/* Affiliate Partner Disclosure */}
      {recipe.ingredients && recipe.ingredients.length > 0 && (
        <div className="pt-2 text-center sm:text-right">
          <p className="text-[11px] text-stone-400">
            {AFFILIATE_DISCLOSURE_TEXT}
          </p>
        </div>
      )}
    </div>
  );
}
