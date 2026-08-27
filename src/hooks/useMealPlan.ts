'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import type { MealPlan, WeekMeals, DayOfWeek, MealTime, MealSlot } from '@/types';
import { getISOWeek, getYear } from 'date-fns';

function getISOWeekId(date: Date): string {
  return `${getYear(date)}-W${getISOWeek(date).toString().padStart(2, '0')}`;
}

const emptyWeekMeals: WeekMeals = {
  monday: {},
  tuesday: {},
  wednesday: {},
  thursday: {},
  friday: {},
  saturday: {},
  sunday: {},
};

export function useMealPlan(weekId?: string) {
  const { user } = useAuth();
  
  const currentWeekId = weekId || getISOWeekId(new Date());
  
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchMealPlan() {
      if (!user) {
        if (isMounted) {
          setMealPlan(null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const planRef = doc(db, 'users', user.uid, 'mealPlans', currentWeekId);
        const snapshot = await getDoc(planRef);

        if (snapshot.exists()) {
          const data = snapshot.data();
          if (isMounted) {
            setMealPlan({
              id: snapshot.id,
              weekStart: data.weekStart instanceof Timestamp ? data.weekStart.toDate() : new Date(),
              meals: data.meals || emptyWeekMeals,
              createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
            });
          }
        } else {
          if (isMounted) {
            setMealPlan({
              id: currentWeekId,
              weekStart: new Date(),
              meals: emptyWeekMeals,
              createdAt: new Date(),
            });
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching meal plan:', err);
          setError(err as Error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchMealPlan();

    return () => {
      isMounted = false;
    };
  }, [user, currentWeekId]);

  const saveMealPlan = useCallback(
    async (meals: WeekMeals) => {
      if (!user) throw new Error('Must be logged in to save meal plan');

      const planRef = doc(db, 'users', user.uid, 'mealPlans', currentWeekId);
      
      const newPlanData = {
        weekStart: serverTimestamp(),
        meals,
      };

      const isNew = !mealPlan || mealPlan.createdAt instanceof Date && mealPlan.createdAt.getTime() > Date.now() - 10000;

      await setDoc(planRef, {
        ...newPlanData,
        ...(isNew ? { createdAt: serverTimestamp() } : {}),
      }, { merge: true });

      // Optimistic update
      setMealPlan(prev => prev ? { ...prev, meals } : {
        id: currentWeekId,
        weekStart: new Date(),
        meals,
        createdAt: new Date(),
      });
    },
    [user, currentWeekId, mealPlan]
  );

  const setMealSlot = useCallback(
    async (day: DayOfWeek, mealTime: MealTime, slot: MealSlot) => {
      const currentMeals = mealPlan?.meals || { ...emptyWeekMeals };
      const newMeals = {
        ...currentMeals,
        [day]: {
          ...currentMeals[day],
          [mealTime]: slot,
        },
      };
      return saveMealPlan(newMeals);
    },
    [mealPlan, saveMealPlan]
  );

  const clearMealSlot = useCallback(
    async (day: DayOfWeek, mealTime: MealTime) => {
      const currentMeals = mealPlan?.meals || { ...emptyWeekMeals };
      const newMeals = {
        ...currentMeals,
        [day]: {
          ...currentMeals[day],
        },
      };
      delete newMeals[day][mealTime];
      
      return saveMealPlan(newMeals);
    },
    [mealPlan, saveMealPlan]
  );

  return {
    mealPlan,
    loading,
    error,
    currentWeekId,
    setMealSlot,
    clearMealSlot,
    saveMealPlan,
  };
}
