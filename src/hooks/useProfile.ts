'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, onSnapshot, setDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getCurrentMonthKey } from '@/lib/usage';
import { useAuth } from './useAuth';
import type { UserProfile, UserPreferences, SubscriptionPlan } from '@/types';

const defaultPreferences: UserPreferences = {
  repeatWindowDays: 5,
  mealsPerDay: ['breakfast', 'lunch', 'dinner'],
  dietaryRestrictions: [],
};

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    const userRef = doc(db, 'users', user.uid);

    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const prefs = data.preferences || {};

          setProfile({
            uid: user.uid,
            displayName: data.displayName || user.displayName || 'Chef',
            email: data.email || user.email || '',
            photoURL: data.photoURL || user.photoURL || undefined,
            plan: (data.plan as SubscriptionPlan) || 'free',
            extractionsThisMonth: typeof data.extractionsThisMonth === 'number' ? data.extractionsThisMonth : 0,
            extractionMonth: typeof data.extractionMonth === 'string' ? data.extractionMonth : getCurrentMonthKey(),
            subscriptionId: data.subscriptionId || undefined,
            subscriptionStatus: data.subscriptionStatus || undefined,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : undefined,
            preferences: {
              repeatWindowDays: typeof prefs.repeatWindowDays === 'number' ? prefs.repeatWindowDays : defaultPreferences.repeatWindowDays,
              mealsPerDay: Array.isArray(prefs.mealsPerDay) ? prefs.mealsPerDay : defaultPreferences.mealsPerDay,
              dietaryRestrictions: Array.isArray(prefs.dietaryRestrictions) ? prefs.dietaryRestrictions : defaultPreferences.dietaryRestrictions,
              allergies: prefs.allergies || [],
              favoriteCuisines: prefs.favoriteCuisines || [],
            },
          });
        } else {
          // Initialize fallback profile object
          setProfile({
            uid: user.uid,
            displayName: user.displayName || 'Chef',
            email: user.email || '',
            photoURL: user.photoURL || undefined,
            plan: 'free',
            extractionsThisMonth: 0,
            extractionMonth: getCurrentMonthKey(),
            createdAt: new Date(),
            preferences: defaultPreferences,
          });
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching profile:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const activeProfile = useMemo(() => (user ? profile : null), [user, profile]);
  const activeLoading = useMemo(() => (user ? loading : false), [user, loading]);

  const updatePreferences = useCallback(
    async (newPreferences: Partial<UserPreferences>) => {
      if (!user) throw new Error('Must be logged in to update preferences');

      const userRef = doc(db, 'users', user.uid);
      const mergedPreferences = {
        ...(profile?.preferences || defaultPreferences),
        ...newPreferences,
      };

      await setDoc(
        userRef,
        {
          preferences: mergedPreferences,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Optimistic update
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              preferences: mergedPreferences,
            }
          : null
      );
    },
    [user, profile]
  );

  const updateUserProfile = useCallback(
    async (profileData: Partial<{ displayName: string; photoURL?: string }>) => {
      if (!user) throw new Error('Must be logged in to update profile');

      const userRef = doc(db, 'users', user.uid);

      await setDoc(
        userRef,
        {
          ...profileData,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Optimistic update
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              ...profileData,
            }
          : null
      );
    },
    [user]
  );

  return {
    profile: activeProfile,
    preferences: activeProfile?.preferences || defaultPreferences,
    loading: activeLoading,
    error,
    updatePreferences,
    updateUserProfile,
  };
}
