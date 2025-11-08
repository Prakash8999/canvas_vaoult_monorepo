import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useEnhancedNoteStore } from '@/stores/enhancedNoteStore';
import { useNoteMutations, useNote } from '@/hooks/useNotes';
import { convertApiNoteToLocal } from '@/lib/api/notesApi';
import NoteEditor from '../components/editor/NoteEditor';
import { EditorSkeleton } from '../components/editor/EditorSkeleton';

export default function NoteEditorPage() {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  // We'll fetch the single note directly instead of relying on full notes cache
  const { createNote } = useNoteMutations();
  const { setCurrentNote } = useEnhancedNoteStore();

  console.log('NoteEditorPage loaded with id:', uid);
  
  // If no id param: create a new note then navigate
  useEffect(() => {
    if (!uid) {
      const noteName = `Untitled Note ${new Date().toLocaleTimeString()}`;
      createNote({ name: noteName, content: { blocks: [] } })
        .then((newApiNote) => {
          const localNote = convertApiNoteToLocal(newApiNote);
            navigate(`/note/${localNote.note_uid}`, { replace: true });
        })
        .catch((error) => {
          console.error('Failed to create note:', error);
          navigate('/notes');
        });
    }
  }, [uid, createNote, navigate]);

  // Validate numeric id early
  const numericId = uid ? parseInt(uid, 10) : null;
  const invalidId = uid && (uid.length === 0 || uid.length !== 36); // Example: check for UUID length; 
  const { data: fetchedNote, isLoading, error } = useNote(uid && !invalidId ? uid : '');
console.log('useNote fetch result:', { fetchedNote, isLoading, error, uid, invalidId });
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

  // Redirect on invalid id or hard fetch error (e.g., 404)
  useEffect(() => {
    console.log('Checking for navigation due to invalidId or error:', { invalidId, error, uid });
    if (invalidId) {
      navigate('/notes', { replace: true });
    } else if (error) {
      console.warn('Failed to fetch note', uid, error);
      navigate('/notes', { replace: true });
    }
  }, [invalidId, error, uid, navigate]);

  if (!uid) return null; // interim while creating & navigating
  if (invalidId) return null;
  
  return <NoteEditor isLoadingNote={isLoading} />;
}
