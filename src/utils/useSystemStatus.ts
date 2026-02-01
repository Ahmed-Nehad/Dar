import { useObservable } from "dexie-react-hooks";
import { db } from "../db";

export function useSystemStatus() {
  // 1. Monitor Cloud Sync State
  const syncState = useObservable(db.cloud.syncState);
  
  // 2. Monitor User Auth
  const user = useObservable(db.cloud.currentUser);

  // 3. Derive Status
  const isOnline = navigator.onLine; // Basic browser check
  const isSyncing = syncState?.phase === 'pushing' || syncState?.phase === 'pulling';
  const isError = syncState?.status === 'error';
  
  // 4. Get Error Message (if any)
  let errorMessage = null;
  if (syncState?.error) {
    errorMessage = syncState.error.message || "خطأ في المزامنة";
  } else if (!isOnline) {
    errorMessage = "لا يوجد اتصال بالإنترنت";
  }

  return {
    isOnline,
    isSyncing,
    isError,
    errorMessage,
    user,
    phase: syncState?.phase || 'idle',
    progress: syncState?.progress
  };
}