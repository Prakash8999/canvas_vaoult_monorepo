import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useEnhancedNoteStore } from '@/stores/enhancedNoteStore';
import NoteEditor from '../components/editor/NoteEditor';

export default function NoteEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { notes, setCurrentNote, createNote } = useEnhancedNoteStore();
  
  useEffect(() => {
    if (id) {
      // Check if note exists
      if (notes[id]) {
        setCurrentNote(id);
      } else {
        // Note doesn't exist, redirect to notes list
        navigate('/notes');
      }
    } else {
      // No ID provided, create a new note and redirect
      const noteName = `Untitled Note ${new Date().toLocaleTimeString()}`;
      const newNoteId = createNote(noteName);
      navigate(`/note/${newNoteId}`, { replace: true });
    }
  }, [id, notes, setCurrentNote, createNote, navigate]);
  
  return <NoteEditor />;
}
