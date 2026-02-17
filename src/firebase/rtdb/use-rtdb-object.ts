'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { useDatabase } from '@/firebase/provider';

export interface UseRtdbObjectResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

export function useRtdbObject<T = any>(path: string | null | undefined): UseRtdbObjectResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { database } = useDatabase();

  useEffect(() => {
    if (!path || !database) {
      setIsLoading(false);
      setData(null);
      return;
    }

    setIsLoading(true);
    const dbRef = ref(database, path);

    const listener = onValue(
      dbRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setData(snapshot.val() as T);
        } else {
          setData(null); // Path does not exist
        }
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error(err);
        setError(err);
        setIsLoading(false);
        setData(null);
      }
    );

    // Cleanup listener on unmount
    return () => {
      off(dbRef, 'value', listener);
    };
  }, [path, database]);

  return { data, isLoading, error };
}
