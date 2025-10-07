import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEnhancedNoteStore } from '@/stores/enhancedNoteStore';
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
  const sidebarOpen = useWorkspaceStore(state => state.sidebarOpen);
  
  const {
    notes,
    createNote,
    deleteNote,
    togglePin,
    searchQuery,
    setSearchQuery,
    searchResults
  } = useEnhancedNoteStore();
  
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  
  const allNotes = Object.values(notes).sort((a, b) => b.modifiedAt - a.modifiedAt);
  const pinnedNotes = allNotes.filter(note => note.isPinned);
  
  // Get notes to display based on filters
  const getDisplayedNotes = () => {
    let notesToShow = searchQuery ? searchResults : allNotes;
    if (showPinnedOnly) {
      notesToShow = notesToShow.filter(note => note.isPinned);
    }
    return notesToShow;
  };
  
  const displayedNotes = getDisplayedNotes();
  
  // Welcome content for first note
  
  
  const handleCreateNote = () => {
    const currentNotesCount = Object.keys(notes).length;
    if (currentNotesCount === 0) {
      // First note - create with welcome content
      const noteId = createNote('Welcome to Your Knowledge Base', getWelcomeContent());
      navigate(`/note/${noteId}`);
    } else {
      // Regular note
      const noteName = `Untitled Note ${new Date().toLocaleTimeString()}`;
      const noteId = createNote(noteName);
      navigate(`/note/${noteId}`);
    }
  };
  
  const handleOpenNote = (noteId: string) => {
    navigate(`/note/${noteId}`);
  };
  
  const handleDeleteNote = (noteId: string, noteName: string) => {
    if (window.confirm(`Are you sure you want to delete "${noteName}"?`)) {
      deleteNote(noteId);
      toast.success('Note deleted successfully');
    }
  };
  
  const handleTogglePin = (noteId: string) => {
    togglePin(noteId);
    const note = notes[noteId];
    toast.success(note?.isPinned ? 'Note unpinned' : 'Note pinned');
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
              className="border-2 border-dashed border-workspace-border hover:border-primary/40 transition-all cursor-pointer group bg-workspace-panel glow-hover"
              onClick={handleCreateNote}
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
              {displayedNotes.length === 0 ? (
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
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div 
                              className="flex-1 min-w-0"
                              onClick={() => handleOpenNote(note.id)}
                            >
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
                                  onClick={() => handleOpenNote(note.id)}
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
                                  onClick={() => handleDeleteNote(note.id, note.name)}
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