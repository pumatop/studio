'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, off, Database, query } from 'firebase/database';
import { useDatabase } from '@/firebase/provider';

export type WithId<T> = T & { id: string };

export interface UseRtdbListResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: Error | null;
}

export function useRtdbList<T = any>(path: string | null | undefined): UseRtdbListResult<T> {
  const [data, setData] = useState<WithId<T>[] | null>(null);
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
          const val = snapshot.val();
          // RTDB returns an object, convert it to an array of objects with ids
          const list = Object.keys(val).map((key) => ({
            id: key,
            ...val[key],
          }));
          setData(list as WithId<T>[]);
        } else {
          setData([]); // Path does not exist, return empty array
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
