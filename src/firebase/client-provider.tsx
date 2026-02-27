'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase/init';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // تهيئة Firebase على جانب العميل مرة واحدة فقط عند تركيب المكون.
    return initializeFirebase();
  }, []);

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      database={firebaseServices.database}
      functions={firebaseServices.functions}
      storage={firebaseServices.storage}
    >
      {children}
    </FirebaseProvider>
  );
}
