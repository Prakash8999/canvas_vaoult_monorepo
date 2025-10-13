import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useEnhancedNoteStore } from '@/stores/enhancedNoteStore';
import { usePaginatedNotes, useNoteMutations } from '@/hooks/useNotes';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { AiDrawer } from '@/components/ai/AiDrawer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useWorkspaceStore } from '@/stores/workspace';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Pin,
  PinOff,
  Trash2,
  FileText,
  Calendar,
  Hash,
  BookOpen
} from 'lucide-react';
import { toast } from 'sonner';
import { getWelcomeContent } from '@/components/CommonContent/getWelcomeContent';

export default function NotesListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const sidebarOpen = useWorkspaceStore(state => state.sidebarOpen);

  // Pagination state: pageIndex starts at 0
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 10;


  const {
    data: pagedData,
    isLoading: loading,
    error: queryError,
  } = usePaginatedNotes(pageIndex, pageSize);
  const { createNote, updateNote, deleteNote: deleteNoteMutation, isCreating, isUpdating, isDeleting } = useNoteMutations();

  const {
    searchQuery,
    setSearchQuery,
    searchResults
  } = useEnhancedNoteStore();

  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [creatingNote, setCreatingNote] = useState(false);

  // Notes for the current page
  const pageNotes = pagedData?.notes || [];
  const allNotes = pageNotes.slice().sort((a, b) => b.modifiedAt - a.modifiedAt);
  const pinnedNotes = allNotes.filter(note => note.isPinned);

  // Create a notes map for quick lookup by id
  const notes: Record<string, typeof pageNotes[0]> = Object.fromEntries(allNotes.map(note => [note.id, note]));

  // Get notes to display based on filters
  const getDisplayedNotes = () => {
    let notesToShow = searchQuery ? searchResults : allNotes;
    if (showPinnedOnly) {
      notesToShow = notesToShow.filter(note => note.isPinned);
    }
    return notesToShow;
  };

  const displayedNotes = getDisplayedNotes();

  // Refresh notes when returning to this page (in case notes were created)
  useEffect(() => {
    // Invalidate queries when component mounts to ensure fresh data
    queryClient.invalidateQueries({ queryKey: ['notes'] });
  }, [queryClient]);

  console.log("displayedNotes ", displayedNotes)
  // Welcome content for first note
  const handleCreateNote = async () => {
    // Stronger guard against concurrent execution
    if (creatingNote || isCreating || loading) return;

    // Wait for data to load before allowing creation
    if (!pagedData) {
      toast.warning("Please wait, loading notes...");
      return;
    }

    setCreatingNote(true);


    try {
      const totalFromAPI = pagedData?.total ?? 0;
      const currentPageNotes = pagedData?.notes?.length ?? 0;
      const hasExistingNotes = totalFromAPI > 0 || currentPageNotes > 0;

      console.log('Creating note - Total:', totalFromAPI, 'Current page:', currentPageNotes, 'Has existing:', hasExistingNotes);

      let apiNote;
      const WELCOME_SEEDED_KEY = 'vcw:welcomeNoteSeeded';
      const alreadySeeded = !!localStorage.getItem(WELCOME_SEEDED_KEY);
      if (!hasExistingNotes) {
        // Even if already seeded, ensure at least one note exists
        apiNote = await createNote({
          name: "Welcome to Your Knowledge Base",
          content: getWelcomeContent(),
        });
        console.log('Created first welcome note:', apiNote);
        localStorage.setItem(WELCOME_SEEDED_KEY, '1');
      } else if (!alreadySeeded) {
        // Optional: handle other first-time setup actions if needed
        localStorage.setItem(WELCOME_SEEDED_KEY, '1');
      }
      else {
        // Regular note
        const noteName = `Untitled Note ${new Date().toLocaleTimeString()}`;
        apiNote = await createNote({ name: noteName });
        console.log('Created new note:', apiNote);
      }

      console.log('Created new note:', apiNote.note_uid);

      // Navigate using numeric id (API expects numeric) with fallback to uuid if somehow id missing
      // if (apiNote?.id !== undefined) {
        navigate(`/note/${apiNote.note_uid}`);
      // } else if (apiNote?.note_uid) {
      //   console.warn('Numeric id missing; falling back to note_uid navigation. This may break editor fetch.', apiNote);
      //   navigate(`/note/${apiNote.note_uid}`);
      // } else {
      //   console.error('Cannot navigate to created note: missing id fields', apiNote);
      //   toast.error('Could not open new note');
      // }


    } catch (error) {
      console.error("Failed to create note:", error);
      toast.error("Failed to create note");
    } finally {
      setCreatingNote(false);
    }
  };


  const handleOpenNote = (noteId: string) => {
    console.log('handleOpenNote called with id:', noteId);
    if (!noteId) {
      console.warn('handleOpenNote called with empty id');
      return;
    }
    const seeded = !!localStorage.getItem('vcw:welcomeNoteSeeded');
    console.log('Opening note (list click):', noteId, 'welcomeSeeded?', seeded);
    navigate(`/note/${noteId}`);
  };

  const handleDeleteNote = async (noteId: string, noteName: string) => {
    if (window.confirm(`Are you sure you want to delete "${noteName}"?`)) {
      try {
        await deleteNoteMutation(noteId);
        toast.success('Note deleted successfully');
      } catch (error) {
        toast.error('Failed to delete note');
      }
    }
  };

  const handleTogglePin = async (noteId: string) => {
    try {
      const note = notes[noteId];
      if (note) {
        await updateNote({
          id: noteId,
          updates: { isPinned: !note.isPinned }
        });
        toast.success(note.isPinned ? 'Note unpinned' : 'Note pinned');
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast.error('Failed to update note');
    }
  };

  // Small helper to extract a plain-text preview from EditorJS OutputData
  const getNotePreview = (content: any, maxLen = 180) => {
    if (!content || !content.blocks || content.blocks.length === 0) return '';
    // find first block with text
    for (const block of content.blocks) {
      const text = block?.data?.text || block?.data?.message || '';
      if (text && typeof text === 'string') {
        // strip HTML tags
        const stripped = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        return stripped.length > maxLen ? stripped.slice(0, maxLen) + '…' : stripped;
      }
    }
    return '';
  };

  return (
    <div className="h-screen bg-workspace-bg flex flex-col overflow-hidden w-full">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto" style={{ paddingRight: sidebarOpen ? undefined : 0 }}>
          <div className="max-w-6xl mx-auto p-8 space-y-8">
            {/* Header Section */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-ai-gradient rounded-2xl flex items-center justify-center shadow-glow">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-foreground">
                  Your Notes
                </h1>
              </div>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Manage and organize your knowledge base
              </p>

              <div className="flex items-center justify-center gap-3">
                <Badge variant="secondary" className="text-sm">
                  {displayedNotes.length} notes
                </Badge>
                {pinnedNotes.length > 0 && (
                  <Badge variant="outline" className="text-sm">
                    <Pin size={12} className="mr-1" />
                    {pinnedNotes.length} pinned
                  </Badge>
                )}
              </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="relative max-w-md w-full">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-workspace-panel border-workspace-border"
                />
              </div>

              <Button
                variant={showPinnedOnly ? "default" : "outline"}
                onClick={() => setShowPinnedOnly(!showPinnedOnly)}
                className="flex items-center gap-2 border-workspace-border hover:bg-workspace-hover"
              >
                <Filter size={16} />
                Pinned Only
              </Button>
            </div>

            {/* Create New Note Card */}
            <Card
              className={`border-2 border-dashed border-workspace-border transition-all group bg-workspace-panel glow-hover ${creatingNote || isCreating || loading || !pagedData
                ? "opacity-60 pointer-events-none"
                : "hover:border-primary/40 cursor-pointer"
                }`}
              onClick={!creatingNote && !isCreating && !loading && pagedData ? handleCreateNote : undefined}
              aria-disabled={creatingNote || isCreating || loading || !pagedData}
            >
              <CardContent className="p-8 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-ai-gradient rounded-2xl flex items-center justify-center transition-all group-hover:scale-105 shadow-glow">
                    <Plus size={28} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                      Create New Note
                    </h3>
                    <p className="text-muted-foreground">
                      Start writing your thoughts and ideas
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes Grid */}
            <div className="flex-1 overflow-hidden">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <Card className="bg-workspace-panel border-workspace-border p-8">
                    <div className="text-center text-muted-foreground">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
                      <div className="text-xl font-medium mb-2 text-foreground">
                        Loading notes...
                      </div>
                    </div>
                  </Card>
                </div>
              ) : queryError ? (
                <div className="h-full flex items-center justify-center">
                  <Card className="bg-workspace-panel border-workspace-border p-8">
                    <div className="text-center text-muted-foreground">
                      <div className="text-xl font-medium mb-2 text-destructive">
                        Error loading notes
                      </div>
                      <div className="text-sm mb-4">
                        {queryError.message}
                      </div>
                      <Button onClick={() => window.location.reload()} variant="outline">
                        Try Again
                      </Button>
                    </div>
                  </Card>
                </div>
              ) : displayedNotes.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <Card className="bg-workspace-panel border-workspace-border p-8">
                    <div className="text-center text-muted-foreground">
                      <BookOpen size={64} className="mx-auto mb-6 opacity-30" />
                      <div className="text-xl font-medium mb-2 text-foreground">
                        {searchQuery ? 'No notes found' : 'No notes yet'}
                      </div>
                      <div className="text-sm">
                        {searchQuery
                          ? 'Try adjusting your search terms'
                          : 'Create your first note to get started'
                        }
                      </div>
                    </div>
                  </Card>
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
                    {displayedNotes.map((note) => (
                      <Card
                        key={note.id}
                        className="group bg-workspace-panel border-workspace-border hover:border-primary/40 transition-all cursor-pointer glow-hover"
                        onClick={() => handleOpenNote(note.note_uid)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpenNote(note.note_uid); } }}
                        aria-label={`Open note ${note.name}`}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                {note.isPinned && (
                                  <Pin size={14} className="text-warning flex-shrink-0" />
                                )}
                                <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors text-lg">
                                  {note.name}
                                </h3>
                              </div>
                              {note.content && (
                                <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                                  {getNotePreview(note.content)}
                                </p>
                              )}

                              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                <div className="flex items-center gap-1">
                                  <Calendar size={14} />
                                  {new Date(note.modifiedAt).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-1">
                                  <FileText size={14} />
                                  {note.wordCount} words
                                </div>
                              </div>

                              {note.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {note.tags.slice(0, 3).map((tag) => (
                                    <Badge key={tag} variant="secondary" className="text-xs bg-workspace-accent">
                                      <Hash size={10} className="mr-1" />
                                      {tag}
                                    </Badge>
                                  ))}
                                  {note.tags.length > 3 && (
                                    <Badge variant="outline" className="text-xs border-workspace-border">
                                      +{note.tags.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Three dots menu */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 hover:bg-workspace-hover"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-workspace-panel border-workspace-border">
                                <DropdownMenuItem
                                  onClick={() => handleOpenNote(note.note_uid)}
                                  className="flex items-center gap-2 hover:bg-workspace-hover"
                                >
                                  <FileText size={14} />
                                  Open
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleTogglePin(note.id)}
                                  className="flex items-center gap-2 hover:bg-workspace-hover"
                                >
                                  {note.isPinned ? (
                                    <>
                                      <PinOff size={14} />
                                      Unpin
                                    </>
                                  ) : (
                                    <>
                                      <Pin size={14} />
                                      Pin
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id, note.name); }}
                                  className="flex items-center gap-2 text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 size={14} />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {/* Load More Button */}
                    {/* Pagination controls */}
                    <div className="col-span-full flex flex-col items-center gap-4 py-8">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                          disabled={pageIndex === 0}
                          variant="outline"
                          className="border-workspace-border hover:bg-workspace-hover"
                        >
                          Prev
                        </Button>

                        {/* Page numbers - derive total pages when total is available */}
                        <div className="flex items-center gap-2">
                          {(() => {
                            const total = pagedData?.total;
                            const totalPages = typeof total === 'number' && total > 0 ? Math.ceil(total / pageSize) : 0;
                            if (totalPages > 0) {
                              return Array.from({ length: totalPages }).map((_, idx) => (
                                <Button
                                  key={idx}
                                  onClick={() => setPageIndex(idx)}
                                  variant={idx === pageIndex ? 'default' : 'outline'}
                                  className={`h-8 w-8 p-0 ${idx === pageIndex ? 'bg-primary text-white' : ''}`}
                                >
                                  {idx + 1}
                                </Button>
                              ));
                            }

                            // Fallback: show current page number
                            return (
                              <div className="px-3 py-1 text-sm text-muted-foreground">Page {pageIndex + 1}</div>
                            );
                          })()}
                        </div>

                        <Button
                          onClick={() => setPageIndex((p) => p + 1)}
                          disabled={(() => {
                            const total = pagedData?.total;
                            const totalPages = typeof total === 'number' && total > 0 ? Math.ceil(total / pageSize) : 0;
                            return pageIndex >= totalPages - 1;
                          })()}
                          variant="outline"
                          className="border-workspace-border hover:bg-workspace-hover"
                        >
                          Next
                        </Button>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        Showing {displayedNotes.length} notes on this page
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        </main>
      </div>
      <AiDrawer />
    </div>
  );
}