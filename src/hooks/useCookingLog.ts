'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import type { CookingLogEntry } from '@/types';
import { subDays } from 'date-fns';

export function useCookingLog(days: number = 14) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<CookingLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setLogs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const startDate = subDays(new Date(), days);
    
    const logsRef = collection(db, 'users', user.uid, 'cookingLog');
    const q = query(
      logsRef,
      where('cookedAt', '>=', Timestamp.fromDate(startDate)),
      orderBy('cookedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedLogs = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            cookedAt: data.cookedAt instanceof Timestamp ? data.cookedAt.toDate() : new Date(),
          } as CookingLogEntry;
        });
        setLogs(fetchedLogs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching cooking log:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, days]);

  const getRecentRecipeIds = useCallback(
    (recentDays: number = days) => {
      const thresholdDate = subDays(new Date(), recentDays);
      const recentIds = logs
        .filter(log => log.cookedAt >= thresholdDate)
        .map(log => log.recipeId);
      return new Set(recentIds);
    },
    [logs, days]
  );

  return {
    logs,
    loading,
    error,
    getRecentRecipeIds,
  };
}
