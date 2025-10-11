import { useEffect, useState } from 'react';
import { useEnhancedNoteStore } from '../stores/enhancedNoteStore';
import { getAllNotes, getMeta, setMeta } from '../lib/dexieClient';
import { migrateLocalStorageToDexie, DEXIE_PERSISTENCE_ENABLED } from '../utils/migration/localStorageToDexie';

export function useDexieHydration() {
  const [hydrationComplete, setHydrationComplete] = useState(false);
  const [migrationError, setMigrationError] = useState<string | null>(null);

  const {
    setNotesFromRecords,
    setCurrentNote,
  } = useEnhancedNoteStore();

  useEffect(() => {
    const hydrateFromDexie = async () => {
      if (!DEXIE_PERSISTENCE_ENABLED) {
        console.log('[Hydration] Dexie persistence disabled, skipping hydration');
        setHydrationComplete(true);
        return;
      }

      try {
        console.log('[Hydration] Starting Dexie hydration');

        // Run migration if needed
        const migrationResult = await migrateLocalStorageToDexie();
        if (!migrationResult.success) {
          setMigrationError(migrationResult.error || 'Migration failed');
          setHydrationComplete(true);
          return;
        }

        // Load notes from Dexie
        const noteRecords = await getAllNotes();
        console.log(`[Hydration] Loaded ${noteRecords.length} notes from Dexie`);

        // Convert NoteRecord[] to the store's expected format
        const notesMap: Record<string, any> = {};
        noteRecords.forEach(record => {
          notesMap[record.id] = {
            id: record.id,
            name: record.title, // title -> name
            content: record.content,
            tags: record.tags,
            createdAt: record.meta?.createdAt || record.updatedAt,
            modifiedAt: record.updatedAt,
            isPinned: record.pinned || false,
            wordCount: record.meta?.wordCount || 0,
          };
        });

        // Hydrate the store
        setNotesFromRecords(notesMap);

        // Load current note ID
        const currentNoteId = await getMeta('currentNoteId');
        if (currentNoteId) {
          setCurrentNote(currentNoteId);
        }

        // Trigger backlink/tag/graph updates for all notes
        // This will call the existing parsing functions
        Object.values(notesMap).forEach(note => {
          // The store's updateNote will trigger parsing
          useEnhancedNoteStore.getState().updateNote(note.id, { content: note.content });
        });

        console.log('[Hydration] Dexie hydration completed successfully');
        setHydrationComplete(true);

      } catch (error) {
        console.error('[Hydration] Failed to hydrate from Dexie:', error);
        setMigrationError(error instanceof Error ? error.message : 'Hydration failed');
        setHydrationComplete(true);
      }
    };

    hydrateFromDexie();
  }, [setNotesFromRecords, setCurrentNote]);

  return {
    hydrationComplete,
    migrationError,
  };
}