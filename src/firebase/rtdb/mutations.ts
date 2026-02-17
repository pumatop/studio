'use client';

import { ref, set, update, push, remove, Database } from 'firebase/database';

export function setRtdb(db: Database, path: string, data: any): Promise<void> {
  const dbRef = ref(db, path);
  return set(dbRef, data);
}

export function updateRtdb(db: Database, path: string, data: object): Promise<void> {
  const dbRef = ref(db, path);
  return update(dbRef, data);
}

export function pushRtdb(db: Database, path: string, data: any): Promise<string | null> {
    const dbRef = ref(db, path);
    const newRef = push(dbRef, data);
    return Promise.resolve(newRef.key);
}

export function removeRtdb(db: Database, path: string): Promise<void> {
  const dbRef = ref(db, path);
  return remove(dbRef);
}
