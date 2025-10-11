import { setMeta, getMeta, bulkPutNotes, NoteRecord } from '../../lib/dexieClient';
import { OutputData } from '@editorjs/editorjs';

// Feature flag for enabling Dexie persistence
export const DEXIE_PERSISTENCE_ENABLED = true; // Set to false to disable

// Migration function - runs once per user
export async function migrateLocalStorageToDexie(): Promise<{ success: boolean; error?: string }> {
  if (!DEXIE_PERSISTENCE_ENABLED) {
    return { success: true }; // Skip if disabled
  }

  try {
    // Check if already migrated
    const migrated = await getMeta('migrated');
    if (migrated === true) {
      console.log('[Migration] Already migrated, skipping');
      return { success: true };
    }

    console.log('[Migration] Starting localStorage to Dexie migration');

    // Read existing localStorage data
    const notesKey = 'vcw:enhancedNotes';
    const currentNoteKey = 'vcw:currentNoteId';

    const storedNotesJson = localStorage.getItem(notesKey);
    const currentNoteId = localStorage.getItem(currentNoteKey);

    if (!storedNotesJson) {
      console.log('[Migration] No localStorage notes found, marking as migrated');
      await setMeta('migrated', true);
      await setMeta('currentNoteId', currentNoteId);
      return { success: true };
    }

    // Parse and convert notes
    const storedNotes = JSON.parse(storedNotesJson);
    const noteRecords: NoteRecord[] = [];

    for (const [id, note] of Object.entries(storedNotes) as [string, any][]) {
      // Convert legacy Note to NoteRecord
      const noteRecord: NoteRecord = {
        id: note.id,
        title: note.name, // name -> title
        content: note.content || { blocks: [] },
        tags: note.tags || [],
        backlinks: [], // Will be calculated later
        pinned: note.isPinned || false,
        version: 1, // Initial version
        updatedAt: note.modifiedAt || note.createdAt || new Date().toISOString(),
        meta: {
          createdAt: note.createdAt,
          wordCount: note.wordCount,
        },
      };
      noteRecords.push(noteRecord);
    }

    // Create backup of localStorage data
    const backupData = {
      notes: storedNotes,
      currentNoteId,
      migratedAt: new Date().toISOString(),
    };
    await setMeta('backup_localStorage', JSON.stringify(backupData));

    // Store current note ID
    await setMeta('currentNoteId', currentNoteId);

    // Bulk insert notes into Dexie
    await bulkPutNotes(noteRecords);

    // Mark as migrated
    await setMeta('migrated', true);

    console.log(`[Migration] Successfully migrated ${noteRecords.length} notes from localStorage to Dexie`);
    return { success: true };

  } catch (error) {
    console.error('[Migration] Failed to migrate:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Rollback function - restores from backup
export async function rollbackFromDexieToLocalStorage(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[Migration] Starting rollback from Dexie to localStorage');

    // Get backup data
    const backupJson = await getMeta('backup_localStorage');
    if (!backupJson) {
      return { success: false, error: 'No backup found' };
    }

    const backup = JSON.parse(backupJson);

    // Restore localStorage
    localStorage.setItem('vcw:enhancedNotes', JSON.stringify(backup.notes));
    if (backup.currentNoteId) {
      localStorage.setItem('vcw:currentNoteId', backup.currentNoteId);
    }

    // Clear migration flag
    await setMeta('migrated', false);

    console.log('[Migration] Successfully rolled back to localStorage');
    return { success: true };

  } catch (error) {
    console.error('[Migration] Failed to rollback:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Check migration status
export async function getMigrationStatus(): Promise<{
  migrated: boolean;
  hasBackup: boolean;
  currentNoteId?: string;
}> {
  const migrated = await getMeta('migrated');
  const backup = await getMeta('backup_localStorage');
  const currentNoteId = await getMeta('currentNoteId');

  return {
    migrated: migrated === true,
    hasBackup: !!backup,
    currentNoteId: currentNoteId || undefined,
  };
}

// Clear localStorage after successful migration (optional, delayed)
export async function clearLocalStorageBackup(): Promise<void> {
  const status = await getMigrationStatus();
  if (status.migrated && status.hasBackup) {
    // Only clear if migrated and we have a backup
    localStorage.removeItem('vcw:enhancedNotes');
    localStorage.removeItem('vcw:currentNoteId');
    await setMeta('localStorage_cleared', true);
    console.log('[Migration] Cleared localStorage backup');
  }
}