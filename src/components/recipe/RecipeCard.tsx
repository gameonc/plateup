'use client';

import React from 'react';
import Link from 'next/link';
import { Star, Clock, ChefHat, CirclePlay, Camera, ImageIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Recipe, DietaryRestriction } from '@/types';
import { DIETARY_OPTIONS } from '@/types';

interface RecipeCardProps {
  recipe: Recipe;
}

export function getDietaryBadgeClass(tag: string): string {
  const normalized = tag.toLowerCase().trim();
  const option = DIETARY_OPTIONS.find((opt) => opt.id === normalized);
  if (option) return option.badgeClass;

  if (normalized.includes('veg')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (normalized.includes('gluten')) return 'bg-amber-100 text-amber-800 border-amber-200';
  if (normalized.includes('dairy')) return 'bg-blue-100 text-blue-800 border-blue-200';
  if (normalized.includes('keto')) return 'bg-purple-100 text-purple-800 border-purple-200';
  if (normalized.includes('carb')) return 'bg-indigo-100 text-indigo-800 border-indigo-200';
  if (normalized.includes('fish') || normalized.includes('pesc')) return 'bg-cyan-100 text-cyan-800 border-cyan-200';
  if (normalized.includes('nut')) return 'bg-rose-100 text-rose-800 border-rose-200';

  return 'bg-stone-100 text-stone-700 border-stone-200';
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const totalTime = (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0);
  const dietaryTags = (recipe.dietaryTags || []) as DietaryRestriction[];

  return (
    <Link href={`/recipes/${recipe.id}`} className="group block h-full">
      <Card className="h-full hover:shadow-lg hover:border-orange-300 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col rounded-2xl border-stone-200/80 bg-white group-hover:-translate-y-1">
        <div className="aspect-video relative bg-stone-100 flex items-center justify-center overflow-hidden">
          {recipe.thumbnailUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={recipe.thumbnailUrl}
              alt={recipe.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
              <ChefHat className="w-12 h-12 text-primary/30" />
            </div>
          )}
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            {recipe.source === 'youtube' && (
              <Badge className="bg-red-500 hover:bg-red-600 border-none shadow-xs gap-1 text-white text-xs">
                <CirclePlay className="w-3 h-3" /> YouTube
              </Badge>
            )}
            {recipe.source === 'image' && (
              <Badge className="bg-blue-500 hover:bg-blue-600 border-none shadow-xs gap-1 text-white text-xs">
                <Camera className="w-3 h-3" /> Photo
              </Badge>
            )}
            {recipe.source === 'manual' && (
              <Badge className="bg-emerald-500 hover:bg-emerald-600 border-none shadow-xs gap-1 text-white text-xs">
                <ImageIcon className="w-3 h-3" /> Manual
              </Badge>
            )}
          </div>
        </div>

        <CardContent className="p-5 flex-grow flex flex-col justify-between space-y-4">
          <div>
            <div className="flex justify-between items-start mb-2 gap-2">
              <h3 className="font-bold text-stone-900 text-lg line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                {recipe.name}
              </h3>
              <div className="flex items-center gap-1 shrink-0 text-amber-500">
                <Star
                  className={`w-4 h-4 ${recipe.rating && recipe.rating > 0 ? 'fill-amber-500' : 'text-stone-300'}`}
                />
                <span className="text-sm font-bold text-stone-800">{recipe.rating || '—'}</span>
              </div>
            </div>

            <div className="flex items-center text-xs font-medium text-stone-500 mb-2">
              <Clock className="w-3.5 h-3.5 mr-1.5 text-primary" />
              <span>{totalTime} min total</span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-stone-100">
            {/* Dietary Tags Badges */}
            {dietaryTags && dietaryTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {dietaryTags.map((dTag, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-md capitalize ${getDietaryBadgeClass(dTag)}`}
                  >
                    {dTag}
                  </Badge>
                ))}
              </div>
            )}

            {/* General Tags */}
            {recipe.tags && recipe.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {recipe.tags.slice(0, 3).map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-xs font-normal bg-stone-100 text-stone-700">
                    {tag}
                  </Badge>
                ))}
                {recipe.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs font-normal text-stone-500">
                    +{recipe.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
