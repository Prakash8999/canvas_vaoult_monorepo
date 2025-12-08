import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWorkspaceStore } from '@/stores/workspace';
import {
  useCreateQuickCapture,
  useUpdateQuickCapture,
  useQuickCaptureList
} from '@/hooks/useQuickCapture';
import { Mic, Image, Pin, Loader2, RefreshCw, Search, X } from 'lucide-react';
import RichTextEditor from './RichTextEditor';

export default function QuickCapture() {
  const quickOpen = useWorkspaceStore((s) => s.quickCaptureOpen);
  const toggleQuick = useWorkspaceStore((s) => s.toggleQuickCapture);

  // Tracker for pending updates to minimize reads
  const [hasPendingUpdates, setHasPendingUpdates] = useState(false);

  // Pagination state
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 10;

  // Search state
  const [searchInput, setSearchInput] = useState(''); // User's input
  const [debouncedSearch, setDebouncedSearch] = useState(''); // Debounced value sent to API

  // New Hooks
  const { mutateAsync: createQC } = useCreateQuickCapture();
  const { mutateAsync: updateQC } = useUpdateQuickCapture();

  // Standard query for list (fetching 10 items per page for "Read All")
  // DISABLED by default to prevent auto-fetching
  const {
    data: listData,
    isLoading: isLoadingList,
    refetch,
    isFetched,
    isRefetching
  } = useQuickCaptureList(
    {
      limit: pageSize,
      page: pageIndex + 1,
      search: debouncedSearch || undefined,
      sort_by: 'updated_at',
      sort: 'desc'
    } as any,
    { enabled: false } // Prevent auto-fetch
  );

  const [activeTab, setActiveTab] = useState<'create' | 'read'>('create');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(''); // HTML string
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const titleRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounce search input: wait 2 seconds after user stops typing
  useEffect(() => {
    // Only debounce if search has at least 3 characters
    if (searchInput.length >= 3) {
      const timer = setTimeout(() => {
        setDebouncedSearch(searchInput);
        setPageIndex(0); // Reset to first page when search changes
      }, 2000); // 2 second debounce

      return () => clearTimeout(timer);
    }
    // If search is cleared (empty), immediately update debounced value but don't trigger refetch
    else if (searchInput.length === 0 && debouncedSearch !== '') {
      setDebouncedSearch('');
      setPageIndex(0);
    }
  }, [searchInput, debouncedSearch]);

  useEffect(() => {
    if (quickOpen) {
      // Default to create view
      setActiveTab('create');
      // Focus title if creating new
      if (!editingId) {
        setTimeout(() => titleRef.current?.focus(), 50);
      }
    } else {
      // Reset state on close
      resetForm();
      setSearchInput(''); // Clear search when modal closes
      setDebouncedSearch('');
    }
  }, [quickOpen]);

  // Sync logic: Fetch when switching to Read tab if needed
  useEffect(() => {
    if (activeTab === 'read') {
      const shouldFetch = !isFetched || hasPendingUpdates;

      if (shouldFetch) {
        // Reset to first page when fetching fresh data
        setPageIndex(0);
        refetch().then(() => {
          setHasPendingUpdates(false);
        });
      }
    }
  }, [activeTab, hasPendingUpdates, isFetched, refetch]);

  // Refetch when page changes or search changes (only if already on Read tab and has been fetched before)
  // BUT: Don't refetch if search was just cleared (going from something to empty)
  const prevDebouncedSearchRef = useRef(debouncedSearch);
  useEffect(() => {
    const wasCleared = prevDebouncedSearchRef.current !== '' && debouncedSearch === '';
    prevDebouncedSearchRef.current = debouncedSearch;

    if (activeTab === 'read' && isFetched && !hasPendingUpdates && !wasCleared) {
      refetch();
    }
  }, [pageIndex, debouncedSearch]);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setPinned(false);
    setSaving(false);
    setEditingId(null);
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

      if (editingId) {
        // Update existing
        await updateQC({
          id: editingId,
          data: {
            title: title || 'Untitled',
            content: noteContent,
            pinned: pinned,
          }
        });
      } else {
        // Create new
        await createQC({
          title: title || 'Quick Note',
          content: noteContent,
          pinned: pinned
        });
      }

      setHasPendingUpdates(true); // Mark as pending update
      handleDiscard(); // Close modal
    } catch (error) {
      console.error('Failed to save quick capture:', error);
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
    setPinned(note.pinned);
    setEditingId(note.id);
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

  const allNotes = listData?.quickCaptures || [];

  return (
    <Dialog open={quickOpen} onOpenChange={() => toggleQuick()}>
      <DialogContent className="max-w-xl h-[80vh] flex flex-col p-0 gap-0">
        <div className="px-6 pt-6 pb-2">
          {/* Accessible title for screen readers */}
          <DialogTitle className="sr-only">Quick Capture</DialogTitle>

          <Tabs value={activeTab} onValueChange={(v) => {
            if (v === 'create' && activeTab === 'read' && !editingId) {
              handleCreateNew();
            } else {
              setActiveTab(v as any);
            }
          }} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">{editingId ? 'Edit Note' : 'Create'}</TabsTrigger>
              <TabsTrigger value="read">Read All</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-hidden px-6 pb-6">
          {activeTab === 'create' ? (
            <div className="flex flex-col h-full gap-4">
              <Input
                ref={titleRef}
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-transparent border rounded-md px-3 text-lg font-semibold focus-visible:ring-1 focus-visible:ring-ring transition-all"
              />

              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Write your note here..."
                className="flex-1 shadow-sm"
                actions={EditorActions}
              />

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-muted-foreground">
                  {editingId ? 'Editing existing note' : new Date().toLocaleString()}
                </div>
                <div className="flex space-x-2">
                  {editingId && (
                    <Button variant="ghost" onClick={handleCreateNew}>Cancel Edit</Button>
                  )}
                  <Button variant="ghost" onClick={handleDiscard}>Discard</Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? (editingId ? 'Updating...' : 'Saving...') : (editingId ? 'Update Note' : 'Save to Notes')}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {/* Search Bar */}
              <div className="mb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by title (min 3 characters)..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-10 pr-10 bg-background border-border"
                  />
                  {searchInput && (
                    <button
                      onClick={() => setSearchInput('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {searchInput.length > 0 && searchInput.length < 3 && (
                  <p className="text-xs text-muted-foreground mt-1 ml-1">
                    Type {3 - searchInput.length} more character{3 - searchInput.length !== 1 ? 's' : ''} to search
                  </p>
                )}
                {searchInput.length >= 3 && searchInput !== debouncedSearch && (
                  <p className="text-xs text-muted-foreground mt-1 ml-1">
                    Searching in 2 seconds...
                  </p>
                )}
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {(isLoadingList || isRefetching) && allNotes.length === 0 ? (
                  <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                ) : allNotes.length === 0 ? (
                  <div className="text-center p-4 text-muted-foreground">No notes found.</div>
                ) : (
                  <div className="space-y-2">
                    {isRefetching && allNotes.length > 0 && (
                      <div className="flex justify-center py-1">
                        <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    {allNotes.map((note) => (
                      <div
                        key={note.id}
                        onClick={() => handleNoteClick(note)}
                        className="p-3 border rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors group"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-medium truncate pr-2">{note.title || 'Untitled'}</h4>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(note.updated_at || note.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {/* Simple text preview extraction */}
                          {note.content?.blocks?.[0]?.data?.text?.replace(/<[^>]*>/g, '') || 'No content'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pagination Controls */}
              {listData && listData.pagination.totalPages > 0 && (
                <div className="flex flex-col items-center gap-3 pt-4 border-t mt-4">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                      disabled={pageIndex === 0 || isRefetching}
                      variant="outline"
                      size="sm"
                      className="h-8"
                    >
                      Prev
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: listData.pagination.totalPages }).map((_, idx) => (
                        <Button
                          key={idx}
                          onClick={() => setPageIndex(idx)}
                          disabled={isRefetching}
                          variant={idx === pageIndex ? 'default' : 'outline'}
                          size="sm"
                          className={`h-8 w-8 p-0 ${idx === pageIndex ? 'bg-primary text-white' : ''}`}
                        >
                          {idx + 1}
                        </Button>
                      ))}
                    </div>

                    <Button
                      onClick={() => setPageIndex((p) => p + 1)}
                      disabled={pageIndex >= listData.pagination.totalPages - 1 || isRefetching}
                      variant="outline"
                      size="sm"
                      className="h-8"
                    >
                      Next
                    </Button>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Page {pageIndex + 1} of {listData.pagination.totalPages} • {listData.pagination.total} total notes
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogClose className="right-4 top-4" />
      </DialogContent>
    </Dialog>
  );
}
