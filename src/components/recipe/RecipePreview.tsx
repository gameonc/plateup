import React from 'react';
import { ExtractedRecipe } from '@/lib/extract-recipe';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Users, ChefHat, BookmarkPlus, Check, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface RecipePreviewProps {
  recipe: ExtractedRecipe;
  isSaving: boolean;
  isSaved: boolean;
  onSave: () => void;
}

export function RecipePreview({ recipe, isSaving, isSaved, onSave }: RecipePreviewProps) {
  return (
    <Card className="w-full max-w-2xl mx-auto shadow-md border-orange-100 overflow-hidden">
      <CardHeader className="bg-orange-50/50 pb-4">
        <div className="flex justify-between items-start gap-4">
          <div>
            <CardTitle className="text-2xl font-bold text-slate-800 mb-2">{recipe.name}</CardTitle>
            {recipe.description && (
              <p className="text-slate-600 text-sm">{recipe.description}</p>
            )}
          </div>
        </div>
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {recipe.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-200">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-lg">
            <Clock className="h-5 w-5 text-orange-500 mb-1" />
            <span className="text-xs text-slate-500 font-medium">Prep</span>
            <span className="text-sm font-semibold text-slate-700">{recipe.prepTimeMinutes} min</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-lg">
            <Clock className="h-5 w-5 text-red-500 mb-1" />
            <span className="text-xs text-slate-500 font-medium">Cook</span>
            <span className="text-sm font-semibold text-slate-700">{recipe.cookTimeMinutes} min</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-lg">
            <Users className="h-5 w-5 text-blue-500 mb-1" />
            <span className="text-xs text-slate-500 font-medium">Servings</span>
            <span className="text-sm font-semibold text-slate-700">{recipe.servings}</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-lg">
            <ChefHat className="h-5 w-5 text-purple-500 mb-1" />
            <span className="text-xs text-slate-500 font-medium">Difficulty</span>
            <span className="text-sm font-semibold text-slate-700 capitalize">{recipe.difficulty}</span>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded text-sm mr-2">
              {recipe.ingredients.length}
            </span>
            Ingredients
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4">
            {recipe.ingredients.map((ing, idx) => (
              <li key={idx} className="flex items-start text-sm border-b border-slate-100 pb-2">
                <span className="font-medium text-slate-800 min-w-[80px]">
                  {ing.amount} {ing.unit}
                </span>
                <span className="text-slate-600 ml-2">{ing.item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Instructions</h3>
          <ol className="space-y-4">
            {recipe.instructions.map((step, idx) => (
              <li key={idx} className="flex gap-4">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-600 font-bold text-xs mt-0.5">
                  {idx + 1}
                </span>
                <p className="text-slate-700 text-sm leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </CardContent>

      <CardFooter className="bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 py-4">
        {isSaved ? (
          <div className="w-full flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex items-center text-green-600 font-medium text-sm">
              <Check className="h-5 w-5 mr-1.5" />
              Saved to your recipes
            </div>
            <Link href="/recipes" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto flex items-center border-orange-200 text-orange-700 hover:bg-orange-50">
                View in My Recipes
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        ) : (
          <Button 
            onClick={onSave} 
            disabled={isSaving}
            className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-medium shadow-sm transition-all"
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <BookmarkPlus className="h-5 w-5 mr-2" />
                Save to My Recipes
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
