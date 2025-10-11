import { useEffect, useState, useCallback, useRef } from 'react';
import { peekOutboxBatch, removeOutboxEvents, setMeta, getMeta, bulkPutNotes, NoteRecord } from '../lib/dexieClient';
import { hasPendingEvents } from '../lib/outbox';
import { DEXIE_PERSISTENCE_ENABLED } from '../utils/migration/localStorageToDexie';

export type SyncStatus = 'idle' | 'syncing' | 'online' | 'offline' | 'conflict' | 'error';

interface SyncState {
  status: SyncStatus;
  lastSyncAt?: string;
  error?: string;
  pendingEvents: number;
}

const SYNC_INTERVAL = 60000; // 60 seconds
const DEBOUNCE_DELAY = 2000; // 2 seconds
const MAX_BATCH_SIZE = 50;
const MAX_RETRIES = 6;
const RETRY_DELAYS = [1000, 2000, 5000, 10000, 30000]; // Progressive backoff

export function useSyncManager() {
  const [syncState, setSyncState] = useState<SyncState>({
    status: 'idle',
    pendingEvents: 0,
  });

  const syncTimeoutRef = useRef<NodeJS.Timeout>();
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const isOnlineRef = useRef(navigator.onLine);
  const leaderElectionRef = useRef<string | null>(null);

  // Leader election for multiple tabs
  const becomeLeader = useCallback(() => {
    const leaderKey = 'canvasvault_sync_leader';
    const myId = crypto.randomUUID();
    const timestamp = Date.now();

    try {
      const existing = localStorage.getItem(leaderKey);
      if (existing) {
        const [existingId, existingTime] = existing.split(':');
        if (Date.now() - parseInt(existingTime) < 30000) { // 30 seconds
          return false; // Someone else is leader
        }
      }

      localStorage.setItem(leaderKey, `${myId}:${timestamp}`);
      leaderElectionRef.current = myId;
      return true;
    } catch (e) {
      return false;
    }
  }, []);

  const isLeader = useCallback(() => {
    if (!leaderElectionRef.current) return false;
    try {
      const leaderKey = 'canvasvault_sync_leader';
      const existing = localStorage.getItem(leaderKey);
      if (!existing) return false;
      const [existingId] = existing.split(':');
      return existingId === leaderElectionRef.current;
    } catch (e) {
      return false;
    }
  }, []);

  // Check online status
  const updateOnlineStatus = useCallback(() => {
    const wasOnline = isOnlineRef.current;
    isOnlineRef.current = navigator.onLine;

    if (wasOnline !== isOnlineRef.current) {
      setSyncState(prev => ({
        ...prev,
        status: isOnlineRef.current ? 'online' : 'offline',
      }));

      if (isOnlineRef.current && DEXIE_PERSISTENCE_ENABLED) {
        // Trigger sync when coming back online
        triggerSyncNow();
      }
    }
  }, []);

  // Update pending events count
  const updatePendingEventsCount = useCallback(async () => {
    if (!DEXIE_PERSISTENCE_ENABLED) return;

    try {
      const events = await peekOutboxBatch(1000);
      setSyncState(prev => ({
        ...prev,
        pendingEvents: events.length,
        status: events.length > 0 ? (isOnlineRef.current ? 'online' : 'offline') : 'idle',
      }));
    } catch (e) {
      console.warn('Failed to check pending events:', e);
    }
  }, []);

  // Send batch to server
  const sendBatchToServer = useCallback(async (events: any[], clientId: string, retryCount = 0): Promise<any> => {
    const payload = {
      clientId,
      events: events.map(e => ({
        id: e.id,
        type: e.type,
        resourceId: e.resourceId,
        payload: e.payload,
        createdAt: e.createdAt,
        opSeq: e.opSeq,
      })),
    };

    try {
      const response = await fetch('/api/sync/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.warn(`[Sync] Batch send failed (attempt ${retryCount + 1}):`, error);

      if (retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAYS[retryCount] || 30000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return sendBatchToServer(events, clientId, retryCount + 1);
      }

      throw error;
    }
  }, []);

  // Process server response
  const processServerResponse = useCallback(async (response: any, appliedEventIds: string[]) => {
    try {
      // Update Dexie with server canonical data
      if (response.updatedResources) {
        const noteUpdates: NoteRecord[] = response.updatedResources
          .filter((r: any) => r.resourceType === 'note')
          .map((r: any) => ({
            id: r.id,
            title: r.title,
            content: r.content,
            tags: r.tags || [],
            backlinks: [], // Will be recalculated
            pinned: r.pinned || false,
            version: r.version || 1,
            updatedAt: r.updatedAt,
            meta: r.meta || {},
          }));

        if (noteUpdates.length > 0) {
          await bulkPutNotes(noteUpdates);
          console.log(`[Sync] Updated ${noteUpdates.length} notes from server`);
        }
      }

      // Handle conflicts
      if (response.conflicts && response.conflicts.length > 0) {
        setSyncState(prev => ({ ...prev, status: 'conflict' }));
        console.warn('[Sync] Conflicts detected:', response.conflicts);
        // TODO: Show conflict UI
      }

      // Remove processed events
      if (appliedEventIds.length > 0) {
        await removeOutboxEvents(appliedEventIds);
        console.log(`[Sync] Removed ${appliedEventIds.length} processed events`);
      }

      // Update last sync time
      await setMeta('lastSyncAt', new Date().toISOString());

    } catch (error) {
      console.error('[Sync] Failed to process server response:', error);
      throw error;
    }
  }, []);

  // Main sync function
  const performSync = useCallback(async () => {
    if (!DEXIE_PERSISTENCE_ENABLED || !isLeader() || !isOnlineRef.current) {
      return;
    }

    setSyncState(prev => ({ ...prev, status: 'syncing' }));

    try {
      const clientId = await getMeta('clientId');
      if (!clientId) {
        throw new Error('No client ID found');
      }

      const events = await peekOutboxBatch(MAX_BATCH_SIZE);
      if (events.length === 0) {
        setSyncState(prev => ({ ...prev, status: 'idle' }));
        return;
      }

      console.log(`[Sync] Sending ${events.length} events to server`);

      const response = await sendBatchToServer(events, clientId);
      const appliedEventIds = response.applied || [];

      await processServerResponse(response, appliedEventIds);

      setSyncState(prev => ({
        ...prev,
        status: 'idle',
        lastSyncAt: new Date().toISOString(),
      }));

      // Continue syncing if there are more events
      const remainingEvents = await peekOutboxBatch(1);
      if (remainingEvents.length > 0) {
        setTimeout(() => performSync(), 1000);
      }

    } catch (error) {
      console.error('[Sync] Sync failed:', error);
      setSyncState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, [sendBatchToServer, processServerResponse]);

  // Trigger immediate sync
  const triggerSyncNow = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    performSync();
  }, [performSync]);

  // Debounced sync trigger
  const triggerDebouncedSync = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      if (isOnlineRef.current && DEXIE_PERSISTENCE_ENABLED) {
        performSync();
      }
    }, DEBOUNCE_DELAY);
  }, [performSync]);

  // Start sync manager
  const startSyncManager = useCallback(() => {
    if (!DEXIE_PERSISTENCE_ENABLED) return;

    // Try to become leader
    if (!becomeLeader()) {
      console.log('[Sync] Not elected as leader, sync disabled');
      return;
    }

    console.log('[Sync] Starting sync manager as leader');

    // Set up periodic sync
    const scheduleNextSync = () => {
      syncTimeoutRef.current = setTimeout(async () => {
        if (await hasPendingEvents()) {
          await performSync();
        }
        scheduleNextSync();
      }, SYNC_INTERVAL);
    };

    scheduleNextSync();

    // Initial sync check
    updatePendingEventsCount();
  }, [becomeLeader, performSync, updatePendingEventsCount]);

  // Stop sync manager
  const stopSyncManager = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    console.log('[Sync] Stopped sync manager');
  }, []);

  // Page unload handler
  const handlePageUnload = useCallback(async () => {
    if (!DEXIE_PERSISTENCE_ENABLED) return;

    try {
      const events = await peekOutboxBatch(10); // Small batch for beacon
      if (events.length > 0 && navigator.sendBeacon) {
        const clientId = await getMeta('clientId');
        if (clientId) {
          const payload = {
            clientId,
            events: events.slice(0, 5), // Limit for beacon
          };

          navigator.sendBeacon('/api/sync/events', JSON.stringify(payload));
        }
      }
    } catch (e) {
      // Ignore beacon errors
    }
  }, []);

  // Set up event listeners
  useEffect(() => {
    if (!DEXIE_PERSISTENCE_ENABLED) return;

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    window.addEventListener('beforeunload', handlePageUnload);

    // Initial status
    updateOnlineStatus();
    updatePendingEventsCount();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      window.removeEventListener('beforeunload', handlePageUnload);
      stopSyncManager();
    };
  }, [updateOnlineStatus, updatePendingEventsCount, handlePageUnload, stopSyncManager]);

  // Debug logging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__CANVASVAULT_DEBUG__ = (window as any).__CANVASVAULT_DEBUG__ || [];
      (window as any).__CANVASVAULT_DEBUG__.push({
        timestamp: new Date().toISOString(),
        status: syncState.status,
        pendingEvents: syncState.pendingEvents,
        lastSyncAt: syncState.lastSyncAt,
        error: syncState.error,
      });

      // Keep only last 50 entries
      if ((window as any).__CANVASVAULT_DEBUG__.length > 50) {
        (window as any).__CANVASVAULT_DEBUG__ = (window as any).__CANVASVAULT_DEBUG__.slice(-50);
      }
    }
  }, [syncState]);

  return {
    status: syncState.status,
    lastSyncAt: syncState.lastSyncAt,
    error: syncState.error,
    pendingEvents: syncState.pendingEvents,
    startSyncManager,
    stopSyncManager,
    triggerSyncNow,
    triggerDebouncedSync,
  };
}