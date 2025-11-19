import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useEnhancedNoteStore } from '@/stores/enhancedNoteStore';
import { useNoteMutations, useNote } from '@/hooks/useNotes';
import { convertApiNoteToLocal } from '@/lib/api/notesApi';
import NoteEditor from '../components/editor/NoteEditor';
import { EditorSkeleton } from '../components/editor/EditorSkeleton';
import { getWelcomeContent } from '@/components/CommonContent/getWelcomeContent';

export default function NoteEditorPage() {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  // We'll fetch the single note directly instead of relying on full notes cache
  const { createNote } = useNoteMutations();
  const { setCurrentNote } = useEnhancedNoteStore();

  // console.log('NoteEditorPage loaded with id:', uid);
  
  // If no id param: create a new note then navigate
  useEffect(() => {
    if (!uid) {
      const WELCOME_SEEDED_KEY = 'vcw:welcomeNoteSeeded';
      const shouldCreateWelcome = location.state?.welcome;

      let notePromise;
      if (shouldCreateWelcome) {
        notePromise = createNote({
          title: 'Welcome to Your Knowledge Base',
          content: getWelcomeContent()
        });
        localStorage.setItem(WELCOME_SEEDED_KEY, '1');
      } else {
        const noteName = `Untitled Note ${new Date().toLocaleTimeString()}`;
        notePromise = createNote({ title: noteName, content: { blocks: [] } });
      }

      notePromise
        .then((newApiNote) => {
          const localNote = convertApiNoteToLocal(newApiNote);
            navigate(`/note/${localNote.note_uid}`, { replace: true });
        })
        .catch((error) => {
          console.error('Failed to create note:', error);
          navigate('/notes');
        });
    }
  }, [uid, createNote, navigate, location.state]);

  // Validate numeric id early
  const numericId = uid ? parseInt(uid, 10) : null;
  const invalidId = uid && (uid.length === 0 || uid.length !== 36); // Example: check for UUID length; 
  const { data: fetchedNote, isLoading, error } = useNote(uid && !invalidId ? uid : '');
// console.log('useNote fetch result:', { fetchedNote, isLoading, error, uid, invalidId });
  useEffect(() => {
    if (!uid || invalidId) return; // handled above
    if (fetchedNote) {
      // Convert the API note to local format and add it to the store
      const localNote = convertApiNoteToLocal(fetchedNote);
      const { setNotesFromRecords, setCurrentNote: setCurrentNoteInStore } = useEnhancedNoteStore.getState();
      
      // Get current notes and add the fetched note
      const currentNotes = useEnhancedNoteStore.getState().notes;
      const updatedNotes = { ...currentNotes, [localNote.id]: localNote };
      
      setNotesFromRecords(updatedNotes);
      setCurrentNoteInStore(localNote.id);
    }
  }, [uid, invalidId, fetchedNote]);

  // Show initial loading shimmer for better UX feedback
  // useEffect(() => {
  //   if (fetchedNote) {
  //     // Convert the note to check if it's in the store
  //     const localNote = convertApiNoteToLocal(fetchedNote);
  //     const store = useEnhancedNoteStore.getState();
      
  //     // Wait until the note is actually in the store
  //     const checkStore = () => {
  //       const currentStore = useEnhancedNoteStore.getState();
  //       if (currentStore.currentNoteId === localNote.id && currentStore.notes[localNote.id]) {
  //         setIsInitialLoading(false);
  //       } else {
  //         // Check again after a short delay
  //         setTimeout(checkStore, 10);
  //       }
  //     };
      
  //     // Brief minimum delay to show shimmer
  //     setTimeout(checkStore, 100);
  //   } else if (error) {
  //     setIsInitialLoading(false);
  //   }
  // }, [fetchedNote, error]);

// ... existing code ...
  
  // Show initial loading shimmer for better UX feedback
  useEffect(() => {
    if (fetchedNote) {
      const localNote = convertApiNoteToLocal(fetchedNote);
      
      // Helper to check if store is ready
      const checkStore = () => {
        const currentStore = useEnhancedNoteStore.getState();
        
        // Strict check: Store must have the ID as current AND the note object must exist in the record
        const isStoreReady = 
            currentStore.currentNoteId === localNote.id && 
            !!currentStore.notes[localNote.id];

        if (isStoreReady) {
          setIsInitialLoading(false);
        } else {
          // If not ready, check again very soon
          requestAnimationFrame(checkStore); // Better than setTimeout for UI updates
        }
      };
      
      checkStore();
    } else if (error) {
      setIsInitialLoading(false);
    }
  }, [fetchedNote, error]);














  // Redirect on invalid id or hard fetch error (e.g., 404)
  useEffect(() => {
    // console.log('Checking for navigation due to invalidId or error:', { invalidId, error, uid });
    if (invalidId) {
      navigate('/notes', { replace: true });
    } else if (error) {
      console.warn('Failed to fetch note', uid, error);
      navigate('/notes', { replace: true });
    }
  }, [invalidId, error, uid, navigate]);

  if (!uid) return null; // interim while creating & navigating
  if (invalidId) return null;
  
  return <NoteEditor isLoadingNote={isLoading || isInitialLoading} />;
}
