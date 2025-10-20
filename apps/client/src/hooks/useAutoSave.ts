import { useCallback, useEffect, useRef, useState } from 'react';
import { OutputData } from '@editorjs/editorjs';
import { notesApi } from '@/lib/api/notesApi';

// Custom debounce function
function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );
}

interface UseAutoSaveOptions {
  noteId: string | null;
  updateNote: (updates: { id: string; updates: any }) => Promise<any>;
  intervalMs?: number; // Default: 12 seconds for periodic auto-save
  debounceMs?: number; // Default: 2 seconds for keystroke debouncing
  enabled?: boolean;
}

interface AutoSaveStatus {
  isSaving: boolean;
  lastSaved: Date | null;
  isDirty: boolean;
  saveManually: () => Promise<void>;
  markDirty: () => void;
  updateContent: (content: OutputData) => void;
  updateTitle: (title: string) => Promise<void>;
  updatePinned: (pinned: boolean) => Promise<void>;
  updateTags: (tags: string[]) => Promise<void>;
}

export const useAutoSave = (options: UseAutoSaveOptions): AutoSaveStatus => {
  const { noteId, updateNote, intervalMs = 12000, debounceMs = 2000, enabled = true } = options;
  
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout>();
  const pendingContentRef = useRef<OutputData | null>(null);
  const isUnloadingRef = useRef(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  // Clear interval when noteId changes or component unmounts
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [noteId]);

  // Auto-save interval
  useEffect(() => {
    if (!enabled || !noteId) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(async () => {
      if (notesApi.isNoteDirty(noteId) && pendingContentRef.current) {
        await performSave(pendingContentRef.current);
      }
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [noteId, enabled, intervalMs]);

  // Handle page unload/refresh
  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      if (noteId && notesApi.isNoteDirty(noteId) && pendingContentRef.current) {
        isUnloadingRef.current = true;
        e.preventDefault();
        e.returnValue = '';
        
        // Perform synchronous save
        try {
          await performSave(pendingContentRef.current);
        } catch (error) {
          console.error('Failed to save before unload:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [noteId]);

  const performSave = useCallback(async (content: OutputData) => {
    if (!noteId || isSaving || isUnloadingRef.current) return;

    setIsSaving(true);
    try {
      await updateNote({
        id: noteId,
        updates: { content }
      });
      
      notesApi.markNoteClean(noteId);
      setLastSaved(new Date());
      setIsDirty(false);
      pendingContentRef.current = null;
      
      console.log(`[AutoSave] Successfully saved note ${noteId}`);
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [noteId, updateNote, isSaving]);

  // Debounced save function for content changes
  const debouncedContentSave = useCallback(async (content: OutputData) => {
    if (!noteId || isSaving) return;

    setIsSaving(true);
    try {
      await updateNote({
        id: noteId,
        updates: { content }
      });
      
      notesApi.markNoteClean(noteId);
      setLastSaved(new Date());
      setIsDirty(false);
      pendingContentRef.current = null;
      
      console.log(`[AutoSave] Debounced save completed for note ${noteId}`);
    } catch (error) {
      console.error('Debounced auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [noteId, updateNote, isSaving]);

  const updateContent = useCallback((content: OutputData) => {
    if (!noteId) return;
    
    // Update local state immediately for responsive UI
    pendingContentRef.current = content;
    notesApi.markNoteDirty(noteId);
    setIsDirty(true);
    
    console.log(`[AutoSave] Content changed, starting debounce timer: ${noteId}`);
    
    // Clear existing debounce timer
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Set new debounce timer
    debounceTimeoutRef.current = setTimeout(() => {
      console.log(`[AutoSave] Debounce timer fired, saving note: ${noteId}`);
    //   debouncedContentSave(content);
    }, debounceMs);
  }, [noteId, debounceMs, debouncedContentSave]);

  const markDirty = useCallback(() => {
    if (!noteId) return;
    notesApi.markNoteDirty(noteId);
    setIsDirty(true);
  }, [noteId]);

  const saveManually = useCallback(async () => {
    // Clear any pending debounced save
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = undefined;
    }
    
    if (noteId && pendingContentRef.current) {
      console.log(`[AutoSave] Manual save triggered for note: ${noteId}`);
      await performSave(pendingContentRef.current);
    }
  }, [noteId, performSave]);

  // Instant save for title/tags/pinned changes
  const updateTitle = useCallback(async (title: string) => {
    if (!noteId) return;
    
    setIsSaving(true);
    try {
      await updateNote({
        id: noteId,
        updates: { name: title }
      });
      console.log(`[AutoSave] Title updated instantly: ${noteId}`);
    } catch (error) {
      console.error('Failed to update title:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [noteId, updateNote]);

  const updatePinned = useCallback(async (pinned: boolean) => {
    if (!noteId) return;
    
    setIsSaving(true);
    try {
      await updateNote({
        id: noteId,
        updates: { isPinned: pinned }
      });
      console.log(`[AutoSave] Pinned status updated instantly: ${noteId}`);
    } catch (error) {
      console.error('Failed to update pinned status:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [noteId, updateNote]);

  const updateTags = useCallback(async (tags: string[]) => {
    if (!noteId) return;
    
    setIsSaving(true);
    try {
      await updateNote({
        id: noteId,
        updates: { tags }
      });
      console.log(`[AutoSave] Tags updated instantly: ${noteId}`);
    } catch (error) {
      console.error('Failed to update tags:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [noteId, updateNote]);

  // Cleanup when switching notes
  useEffect(() => {
    return () => {
      if (noteId) {
        // Clear any pending debounced save before cleanup
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
        notesApi.cleanupNoteState(noteId);
      }
    };
  }, [noteId]);

  return {
    isSaving,
    lastSaved: lastSaved || notesApi.getLastSaved(noteId || ''),
    isDirty: isDirty || notesApi.isNoteDirty(noteId || ''),
    saveManually,
    markDirty,
    updateContent,
    updateTitle,
    updatePinned,
    updateTags
  };
};