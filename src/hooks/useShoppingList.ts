'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import type {
  ShoppingList,
  ShoppingListItem,
  MealPlan,
  Recipe,
  GroceryDepartment,
} from '@/types';
import {
  aggregateMealPlanIngredients,
  aggregateRecipeIngredients,
  mergeShoppingListWithCustomItems,
} from '@/lib/shopping-aggregator';
import {
  parseFractionOrAmount,
  formatQuantityDisplay,
  normalizeUnit,
  categorizeIngredientDepartment,
} from '@/lib/ingredient-parser';
import { getISOWeek, getYear } from 'date-fns';

function getISOWeekId(date: Date = new Date()): string {
  return `${getYear(date)}-W${getISOWeek(date).toString().padStart(2, '0')}`;
}

export function useShoppingList(weekId?: string) {
  const { user } = useAuth();
  const currentWeekId = weekId || getISOWeekId();

  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Firestore sync listener
  useEffect(() => {
    if (!user) {
      return;
    }

    const listRef = doc(db, 'users', user.uid, 'shoppingLists', currentWeekId);

    const unsubscribe = onSnapshot(
      listRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const items: ShoppingListItem[] = (data.items || []).map(
            (item: Record<string, unknown>) => ({
              id: String(item.id || ''),
              name: String(item.name || ''),
              item: typeof item.item === 'string' ? item.item : undefined,
              rawItem: typeof item.rawItem === 'string' ? item.rawItem : undefined,
              amount: typeof item.amount === 'number' ? item.amount : null,
              unit: String(item.unit || ''),
              displayAmount: String(item.displayAmount || ''),
              category: (item.category as GroceryDepartment) || 'Other',
              checked: Boolean(item.checked),
              recipeIds: Array.isArray(item.recipeIds) ? item.recipeIds.map(String) : [],
              recipeTitles: Array.isArray(item.recipeTitles) ? item.recipeTitles.map(String) : [],
              isCustom: Boolean(item.isCustom),
              createdAt:
                item.createdAt instanceof Timestamp
                  ? item.createdAt.toDate()
                  : item.createdAt
                  ? new Date(item.createdAt as string | number | Date)
                  : new Date(),
            })
          );

          setShoppingList({
            id: snapshot.id,
            userId: user.uid,
            weekId: data.weekId || currentWeekId,
            items,
            updatedAt:
              data.updatedAt instanceof Timestamp
                ? data.updatedAt.toDate()
                : data.updatedAt
                ? new Date(data.updatedAt)
                : new Date(),
            createdAt:
              data.createdAt instanceof Timestamp
                ? data.createdAt.toDate()
                : data.createdAt
                ? new Date(data.createdAt)
                : new Date(),
          });
        } else {
          // Initialize empty default state
          setShoppingList({
            id: currentWeekId,
            userId: user.uid,
            weekId: currentWeekId,
            items: [],
            updatedAt: new Date(),
            createdAt: new Date(),
          });
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error syncing shopping list:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, currentWeekId]);

  const activeShoppingList = useMemo(() => (user ? shoppingList : null), [user, shoppingList]);
  const activeLoading = useMemo(() => (user ? loading : false), [user, loading]);
  const items = useMemo(() => activeShoppingList?.items || [], [activeShoppingList]);

  const uncheckedCount = useMemo(
    () => items.filter((i) => !i.checked).length,
    [items]
  );

  const checkedCount = useMemo(
    () => items.filter((i) => i.checked).length,
    [items]
  );

  // Group items by grocery departments
  const departmentGroups = useMemo(() => {
    const groups: Record<GroceryDepartment, ShoppingListItem[]> = {
      Produce: [],
      Dairy: [],
      'Meat/Seafood': [],
      Pantry: [],
      'Spices/Seasonings': [],
      Bakery: [],
      Frozen: [],
      Other: [],
    };

    for (const item of items) {
      const cat = (item.category as GroceryDepartment) || 'Other';
      if (groups[cat]) {
        groups[cat].push(item);
      } else {
        groups['Other'].push(item);
      }
    }

    return groups;
  }, [items]);

  // Persist items to Firestore
  const saveItems = useCallback(
    async (newItems: ShoppingListItem[]) => {
      if (!user) throw new Error('Must be logged in to modify shopping list');

      // Optimistic local state update
      setShoppingList((prev) => ({
        id: currentWeekId,
        userId: user.uid,
        weekId: currentWeekId,
        items: newItems,
        updatedAt: new Date(),
        createdAt: prev?.createdAt || new Date(),
      }));

      const listRef = doc(db, 'users', user.uid, 'shoppingLists', currentWeekId);
      const currentListRef = doc(db, 'users', user.uid, 'shoppingList', 'current');

      const payload = {
        userId: user.uid,
        weekId: currentWeekId,
        items: newItems.map((item) => ({
          ...item,
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
        })),
        updatedAt: serverTimestamp(),
      };

      await Promise.all([
        setDoc(listRef, payload, { merge: true }),
        setDoc(currentListRef, payload, { merge: true }),
      ]);
    },
    [user, currentWeekId]
  );

  // Generate or refresh list from meal plan
  const generateFromMealPlan = useCallback(
    async (mealPlan: MealPlan | null | undefined, recipes: Recipe[] | Map<string, Recipe>) => {
      const generatedItems = aggregateMealPlanIngredients(mealPlan, recipes);
      const existing = items;
      const merged = mergeShoppingListWithCustomItems(existing, generatedItems);
      await saveItems(merged);
      return merged;
    },
    [items, saveItems]
  );

  // Add all ingredients from a single recipe to the active list
  const addRecipeToList = useCallback(
    async (recipe: Recipe) => {
      const recipeItems = aggregateRecipeIngredients(recipe);
      if (recipeItems.length === 0) return items;

      const currentItems = [...items];
      for (const rItem of recipeItems) {
        const key = `${rItem.name.toLowerCase()}_${rItem.unit.toLowerCase()}`;
        const existingIdx = currentItems.findIndex(
          (i) => `${i.name.toLowerCase()}_${i.unit.toLowerCase()}` === key && !i.isCustom
        );

        if (existingIdx !== -1) {
          const exist = currentItems[existingIdx];
          const combinedAmount = (exist.amount || 0) + (rItem.amount || 0);
          currentItems[existingIdx] = {
            ...exist,
            amount: combinedAmount,
            displayAmount: formatQuantityDisplay(combinedAmount, exist.unit),
            recipeIds: Array.from(new Set([...exist.recipeIds, ...rItem.recipeIds])),
            recipeTitles: Array.from(new Set([...exist.recipeTitles, ...rItem.recipeTitles])),
          };
        } else {
          currentItems.push(rItem);
        }
      }

      await saveItems(currentItems);
      return currentItems;
    },
    [items, saveItems]
  );

  // Add custom manual item
  const addItem = useCallback(
    async (
      name: string,
      category?: GroceryDepartment | string,
      amount?: number | string | null,
      unit?: string
    ) => {
      const cleanName = name.trim();
      if (!cleanName) return null;

      const parsedAmount = amount !== undefined && amount !== null && amount !== ''
        ? parseFractionOrAmount(amount)
        : null;

      const { normalizedUnit } = normalizeUnit(unit);
      const dept =
        (category as GroceryDepartment) ||
        categorizeIngredientDepartment(cleanName);

      const newItem: ShoppingListItem = {
        id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: cleanName,
        amount: parsedAmount,
        unit: normalizedUnit,
        displayAmount: formatQuantityDisplay(parsedAmount, normalizedUnit),
        category: dept,
        checked: false,
        recipeIds: [],
        recipeTitles: [],
        isCustom: true,
        createdAt: new Date(),
      };

      const updated = [...items, newItem];
      await saveItems(updated);
      return newItem;
    },
    [items, saveItems]
  );

  // Toggle item checked state
  const toggleItemCheck = useCallback(
    async (itemId: string) => {
      const updated = items.map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      );
      await saveItems(updated);
    },
    [items, saveItems]
  );

  // Remove single item
  const removeItem = useCallback(
    async (itemId: string) => {
      const updated = items.filter((item) => item.id !== itemId);
      await saveItems(updated);
    },
    [items, saveItems]
  );

  // Clear all checked (completed) items
  const clearCheckedItems = useCallback(async () => {
    const updated = items.filter((item) => !item.checked);
    await saveItems(updated);
    return updated;
  }, [items, saveItems]);

  // Clear all items in current list
  const clearList = useCallback(async () => {
    await saveItems([]);
  }, [saveItems]);

  return {
    shoppingList: activeShoppingList,
    items,
    loading: activeLoading,
    error,
    currentWeekId,
    uncheckedCount,
    checkedCount,
    departmentGroups,
    generateFromMealPlan,
    addRecipeToList,
    addItem,
    toggleItemCheck,
    removeItem,
    clearCheckedItems,
    clearList,
  };
}
