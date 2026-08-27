'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import type { Recipe } from '@/types';

export function useRecipes() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    const recipesRef = collection(db, 'users', user.uid, 'recipes');
    const q = query(recipesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedRecipes = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
            lastMadeAt: data.lastMadeAt instanceof Timestamp ? data.lastMadeAt.toDate() : data.lastMadeAt || undefined,
          } as unknown as Recipe;
        });
        setRecipes(fetchedRecipes);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching recipes:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const activeRecipes = useMemo(() => (user ? recipes : []), [user, recipes]);
  const activeLoading = useMemo(() => (user ? loading : false), [user, loading]);

  const addRecipe = useCallback(
    async (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'timesMade'>) => {
      if (!user) throw new Error('Must be logged in to add recipe');
      const recipesRef = collection(db, 'users', user.uid, 'recipes');
      const docRef = await addDoc(recipesRef, {
        ...recipe,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        timesMade: 0,
      });
      return docRef.id;
    },
    [user]
  );

  const updateRecipe = useCallback(
    async (id: string, updates: Partial<Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>>) => {
      if (!user) throw new Error('Must be logged in to update recipe');
      const recipeRef = doc(db, 'users', user.uid, 'recipes', id);
      await updateDoc(recipeRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    },
    [user]
  );

  const deleteRecipe = useCallback(
    async (id: string) => {
      if (!user) throw new Error('Must be logged in to delete recipe');
      const recipeRef = doc(db, 'users', user.uid, 'recipes', id);
      await deleteDoc(recipeRef);
    },
    [user]
  );

  const rateRecipe = useCallback(
    async (id: string, rating: number) => {
      if (rating < 1 || rating > 5) throw new Error('Rating must be between 1 and 5');
      return updateRecipe(id, { rating });
    },
    [updateRecipe]
  );

  const markAsMade = useCallback(
    async (id: string) => {
      if (!user) throw new Error('Must be logged in to mark recipe as made');
      
      const recipeRef = doc(db, 'users', user.uid, 'recipes', id);
      const recipe = activeRecipes.find(r => r.id === id);
      
      if (!recipe) throw new Error('Recipe not found');

      // Update recipe
      await updateDoc(recipeRef, {
        lastMadeAt: serverTimestamp(),
        timesMade: (recipe.timesMade || 0) + 1,
        updatedAt: serverTimestamp(),
      });

      // Add to cooking log
      const logRef = collection(db, 'users', user.uid, 'cookingLog');
      await addDoc(logRef, {
        recipeId: id,
        recipeName: recipe.name,
        cookedAt: serverTimestamp(),
      });
    },
    [user, activeRecipes]
  );

  return {
    recipes: activeRecipes,
    loading: activeLoading,
    error,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    rateRecipe,
    markAsMade,
  };
}
