import EnhancedNoteEditor from './EnhancedNoteEditor';

interface NoteEditorProps {
	embedded?: boolean;
	isLoadingNote?: boolean;
}

export default function NoteEditor({ embedded = false, isLoadingNote = false }: NoteEditorProps) {
	// Use the enhanced note editor with full features
	return <EnhancedNoteEditor embedded={embedded} mode="full" isLoadingNote={isLoadingNote} />;
}
