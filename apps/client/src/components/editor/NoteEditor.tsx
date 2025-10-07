import EnhancedNoteEditor from './EnhancedNoteEditor';

export default function NoteEditor({ embedded = false }: { embedded?: boolean }) {
	// Use the enhanced note editor with full features
	return <EnhancedNoteEditor embedded={embedded} mode="full" />;
}
