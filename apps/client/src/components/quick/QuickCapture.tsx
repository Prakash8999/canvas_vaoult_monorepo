import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useWorkspaceStore } from '@/stores/workspace';
import { useNoteMutations, useInfiniteNotes } from '@/hooks/useNotes';
import { convertApiNoteToLocal } from '@/lib/api/notesApi';
import { Mic, Image, Pin, Loader2 } from 'lucide-react';
import RichTextEditor from './RichTextEditor';

export default function QuickCapture() {
  const quickOpen = useWorkspaceStore((s) => s.quickCaptureOpen);
  const toggleQuick = useWorkspaceStore((s) => s.toggleQuickCapture);
  const { createNote, updateNote } = useNoteMutations();
  const { data: notesData, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading: isLoadingNotes } = useInfiniteNotes(20);

  const [activeTab, setActiveTab] = useState<'create' | 'read'>('create');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(''); // HTML string
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const titleRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (quickOpen) {
      // Default to create view
      setActiveTab('create');
      // Focus title if creating new
      if (!editingNoteId) {
        setTimeout(() => titleRef.current?.focus(), 50);
      }
    } else {
      // Reset state on close
      resetForm();
    }
  }, [quickOpen]);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setPinned(false);
    setSaving(false);
    setEditingNoteId(null);
  };

  const handleCreateNew = () => {
    resetForm();
    setActiveTab('create');
    setTimeout(() => titleRef.current?.focus(), 50);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);

    try {
      const noteContent = {
        blocks: [
          {
            type: 'paragraph',
            data: { text: content || '' },
          },
        ],
        version: '2.28.2',
      };

      if (editingNoteId) {
        // Update existing note
        await updateNote({
          id: editingNoteId,
          updates: {
            title: title || 'Untitled',
            content: noteContent,
            isPinned: pinned ? 1 : 0,
          }
        });
      } else {
        // Create new note
        const apiNote = await createNote({
          title: title || 'Quick Note',
          content: noteContent
        });

        const localNote = convertApiNoteToLocal(apiNote);

        if (pinned) {
          await updateNote({
            id: localNote.id,
            updates: { isPinned: 1 }
          });
        }
      }

      handleDiscard(); // Close modal
    } catch (error) {
      console.error('Failed to save quick note:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    toggleQuick();
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // For now attach a placeholder text to content. 
    setContent((c) => c + `<br/><i>[Image attached: ${file.name}]</i>`);
    e.currentTarget.value = '';
  };

  const handleNoteClick = (note: any) => {
    setTitle(note.title);
    // Attempt to extract text/html from blocks
    let htmlContent = '';
    if (note.content && note.content.blocks) {
      htmlContent = note.content.blocks.map((b: any) => {
        if (b.type === 'paragraph') return b.data.text;
        if (b.type === 'header') return `<h${b.data.level}>${b.data.text}</h${b.data.level}>`;
        if (b.type === 'list') {
          const tag = b.data.style === 'ordered' ? 'ol' : 'ul';
          const items = b.data.items.map((i: string) => `<li>${i}</li>`).join('');
          return `<${tag}>${items}</${tag}>`;
        }
        return `<div>[${b.type}]</div>`;
      }).join('<br/>');
    }
    setContent(htmlContent);
    setPinned(note.isPinned);
    setEditingNoteId(note.id);
    setActiveTab('create');
  };

  // Helper to render extra actions in the editor toolbar
  const EditorActions = (
    <>
      <button
        type="button"
        onClick={() => setPinned(!pinned)}
        className={`inline-flex items-center justify-center h-8 w-8 rounded-md text-sm text-muted-foreground hover:text-foreground transition-colors ${pinned ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/50'}`}
        aria-pressed={pinned}
        title="Pin"
      >
        <Pin className="h-4 w-4" />
      </button>

      <button type="button" onClick={() => { /* placeholder for voice */ }} className="inline-flex items-center justify-center h-8 w-8 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors" title="Voice">
        <Mic className="h-4 w-4" />
      </button>

      <button type="button" onClick={handleImageClick} className="inline-flex items-center justify-center h-8 w-8 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors" title="Image">
        <Image className="h-4 w-4" />
      </button>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
    </>
  );

  const allNotes = notesData?.pages.flatMap(p => Object.values(p.notes)) || [];

  return (
    <Dialog open={quickOpen} onOpenChange={() => toggleQuick()}>
      <DialogContent className="max-w-xl h-[80vh] flex flex-col p-0 gap-0">
        <div className="px-6 pt-6 pb-2">
          {/* Accessible title for screen readers */}
          <DialogTitle className="sr-only">Quick Capture</DialogTitle>

          <Tabs value={activeTab} onValueChange={(v) => {
            if (v === 'create' && activeTab === 'read' && !editingNoteId) {
              handleCreateNew();
            } else {
              setActiveTab(v as any);
            }
          }} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">{editingNoteId ? 'Edit Note' : 'Create'}</TabsTrigger>
              <TabsTrigger value="read">Read All</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-hidden px-6 pb-6">
          {activeTab === 'create' ? (
            <div className="flex flex-col h-full gap-4">
              {/* Added gap removal or adjustment if needed, removed gap-3 for tighter control */}
              <Input
                ref={titleRef}
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-transparent border rounded-md px-3 text-lg font-semibold focus-visible:ring-1 focus-visible:ring-ring transition-all"
              />

              {/* Divider removed as we are boxing elements */}

              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Write your note here..."
                className="flex-1 shadow-sm"
                actions={EditorActions}
              />

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-muted-foreground">
                  {editingNoteId ? 'Editing existing note' : new Date().toLocaleString()}
                </div>
                <div className="flex space-x-2">
                  {editingNoteId && (
                    <Button variant="ghost" onClick={handleCreateNew}>Cancel Edit</Button>
                  )}
                  <Button variant="ghost" onClick={handleDiscard}>Discard</Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? (editingNoteId ? 'Updating...' : 'Saving...') : (editingNoteId ? 'Update Note' : 'Save to Notes')}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {isLoadingNotes && allNotes.length === 0 ? (
                  <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                ) : allNotes.length === 0 ? (
                  <div className="text-center p-4 text-muted-foreground">No notes found.</div>
                ) : (
                  allNotes.map((note: any) => (
                    <div
                      key={note.id}
                      onClick={() => handleNoteClick(note)}
                      className="p-3 border rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors group"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-medium truncate pr-2">{note.title || 'Untitled'}</h4>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(note.modifiedAt || note.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {/* Simple text preview extraction */}
                        {note.content?.blocks?.[0]?.data?.text?.replace(/<[^>]*>/g, '') || 'No content'}
                      </div>
                    </div>
                  ))
                )}
                {hasNextPage && (
                  <Button variant="ghost" className="w-full mt-2" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                    {isFetchingNextPage ? 'Loading...' : 'Load More'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogClose className="right-4 top-4" />
      </DialogContent>
    </Dialog>
  );
}
