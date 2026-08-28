'use client';

import { detectDietaryTags } from './dietary.ts';

// TheMealDB API client — https://www.themealdb.com/api.php
// Uses the free test API key (1) for development

const BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

export interface MealDBMeal {
  idMeal: string;
  strMeal: string;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strMealThumb: string;
  strTags: string | null;
  strYoutube: string | null;
  strSource: string | null;
  // Ingredients and measures are strIngredient1..20, strMeasure1..20
  [key: string]: string | null;
}

export interface MealDBCategory {
  idCategory: string;
  strCategory: string;
  strCategoryThumb: string;
  strCategoryDescription: string;
}

export interface MealDBIngredient {
  item: string;
  amount: string;
  unit: string;
}

// Parse the 20 ingredient/measure pairs from a MealDB meal
export function parseMealIngredients(meal: MealDBMeal): MealDBIngredient[] {
  const ingredients: MealDBIngredient[] = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ingredient && ingredient.trim()) {
      const measureStr = (measure || '').trim();
      // Try to split measure into amount and unit
      const match = measureStr.match(/^([\d\/.\s]+)\s*(.*)$/);
      ingredients.push({
        item: ingredient.trim(),
        amount: match ? match[1].trim() : measureStr,
        unit: match ? match[2].trim() : '',
      });
    }
  }
  return ingredients;
}

// Parse instructions into steps
export function parseMealInstructions(instructions: string | null | undefined): string[] {
  return (instructions || '')
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(s => s.replace(/^(?:STEP\s*)?\d+[\.\)\:]?\s*/i, '').trim())
    .filter(s => s.length > 0);
}

// Parse tags string into array
export function parseMealTags(tags: string | null): string[] {
  if (!tags) return [];
  return tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
}

// Estimate difficulty from number of ingredients and instruction length
export function estimateDifficulty(meal: MealDBMeal): 'easy' | 'medium' | 'hard' {
  const ingredients = parseMealIngredients(meal);
  const steps = parseMealInstructions(meal.strInstructions);
  const total = ingredients.length + steps.length;
  if (total <= 10) return 'easy';
  if (total <= 20) return 'medium';
  return 'hard';
}

// API functions

export async function searchMealsByName(query: string): Promise<MealDBMeal[]> {
  const res = await fetch(`${BASE_URL}/search.php?s=${encodeURIComponent(query)}`);
  const data = await res.json();
  return data.meals || [];
}

export async function getMealById(id: string): Promise<MealDBMeal | null> {
  const res = await fetch(`${BASE_URL}/lookup.php?i=${id}`);
  const data = await res.json();
  return data.meals?.[0] || null;
}

export async function getRandomMeal(): Promise<MealDBMeal | null> {
  const res = await fetch(`${BASE_URL}/random.php`);
  const data = await res.json();
  return data.meals?.[0] || null;
}

export async function getRandomMeals(count: number = 8): Promise<MealDBMeal[]> {
  // TheMealDB only returns 1 random meal at a time, so we fetch multiple
  const promises = Array.from({ length: count }, () => getRandomMeal());
  const results = await Promise.all(promises);
  // Deduplicate by ID
  const seen = new Set<string>();
  return results.filter((meal): meal is MealDBMeal => {
    if (!meal || seen.has(meal.idMeal)) return false;
    seen.add(meal.idMeal);
    return true;
  });
}

export async function getCategories(): Promise<MealDBCategory[]> {
  const res = await fetch(`${BASE_URL}/categories.php`);
  const data = await res.json();
  return data.categories || [];
}

export async function filterByCategory(category: string): Promise<{ idMeal: string; strMeal: string; strMealThumb: string }[]> {
  const res = await fetch(`${BASE_URL}/filter.php?c=${encodeURIComponent(category)}`);
  const data = await res.json();
  return data.meals || [];
}

export async function filterByArea(area: string): Promise<{ idMeal: string; strMeal: string; strMealThumb: string }[]> {
  const res = await fetch(`${BASE_URL}/filter.php?a=${encodeURIComponent(area)}`);
  const data = await res.json();
  return data.meals || [];
}

export async function listAreas(): Promise<string[]> {
  const res = await fetch(`${BASE_URL}/list.php?a=list`);
  const data = await res.json();
  return (data.meals || []).map((m: { strArea: string }) => m.strArea);
}

// Convert a MealDB meal to our app's recipe format for saving
export function mealToRecipeData(meal: MealDBMeal) {
  const ingredients = parseMealIngredients(meal);
  const instructions = parseMealInstructions(meal.strInstructions);
  const tags = parseMealTags(meal.strTags);
  
  // Add category and area as tags
  if (meal.strCategory) tags.push(meal.strCategory.toLowerCase());
  if (meal.strArea) tags.push(meal.strArea.toLowerCase());

  const dietaryTags = detectDietaryTags(ingredients, instructions);
  
  return {
    name: meal.strMeal,
    description: `${meal.strArea || ''} ${meal.strCategory || ''} dish`.trim(),
    source: 'manual' as const,
    sourceUrl: meal.strSource || meal.strYoutube || undefined,
    thumbnailUrl: meal.strMealThumb,
    prepTimeMinutes: 15, // MealDB doesn't provide these, so estimate
    cookTimeMinutes: 30,
    servings: 4,
    difficulty: estimateDifficulty(meal),
    tags: [...new Set(tags)],
    dietaryTags,
    ingredients,
    instructions,
  };
}
