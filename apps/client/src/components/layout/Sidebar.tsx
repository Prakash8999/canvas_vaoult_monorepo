import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Home,
  FileText,
  Palette,
  Search,
  Plus,
  Settings,
  Brain,
  User,
  Hash,
  Pin,
  Clock,
  ChevronDown,
  ChevronRight,
  Book,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useWorkspaceStore } from '@/stores/workspace';
import { useNoteMutations } from '@/hooks/useNotes';
import { convertApiNoteToLocal } from '@/lib/api/notesApi';
import { ContentTabs } from './ContentTabs';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    sidebarOpen,
    toggleSidebar,
    currentWorkspace,
    currentNote,
    setCurrentNote,
    toggleQuickCapture,
    toggleAiDrawer,
    searchQuery,
    setSearchQuery,
    addToRecent,
  } = useWorkspaceStore();

  const { createNote } = useNoteMutations();

  // determine active route to show focus in sidebar
  const path = location.pathname || '';
  const isDashboardActive = path === '/' || path.startsWith('/dashboard');
  const isNoteActive = path.startsWith('/notes') || path.startsWith('/note/');
  const isCanvasActive = path.startsWith('/canvases') || path.startsWith('/canvas/');

  const [expandedSections, setExpandedSections] = useState({
    recent: true,
    pinned: true,
    notes: true,
    canvases: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleNoteClick = (note: any) => {
    setCurrentNote(note);
    addToRecent(note.id);
  };

  const recentNotes = currentWorkspace?.recentNotes
    ?.map(id => currentWorkspace.notes?.find(note => note.id === id))
    ?.filter(Boolean)
    ?.slice(0, 5) || [];

  const pinnedNotes = currentWorkspace?.pinnedNotes
    ?.map(id => currentWorkspace.notes?.find(note => note.id === id))
    ?.filter(Boolean) || [];

  const regularNotes = currentWorkspace?.notes.filter(note => note.type === 'note') || [];
  const documents = currentWorkspace?.notes.filter(note => note.type === 'document') || [];
  const canvases = currentWorkspace?.notes.filter(note => note.type === 'canvas') || [];

  if (!sidebarOpen) {
    return (
      <motion.div
        initial={{ width: 240 }}
        animate={{ width: 60 }}
        className="h-full bg-sidebar border-r border-sidebar-border flex flex-col items-center py-4 space-y-4"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Separator />

        <Button
          variant="ghost"
          size="icon"
          // onClick={async () => {
          //   try {
          //     const apiNote = await createNote({ title: 'New Note' });
          //     const localNote = convertApiNoteToLocal(apiNote);
          //     navigate(`/note/${localNote.id}`);
          //   } catch (error) {
          //     console.error('Failed to create note:', error);
          //   }
          // }}
          // className={cn(
          //   "text-sidebar-foreground hover:bg-sidebar-accent",
          //   isNoteActive && "bg-sidebar-accent"
          // )}
          onClick={() => navigate('/dashboard')}
          className={cn(
            "text-sidebar-foreground transition-all duration-300",
            isDashboardActive ? "bg-black/5 dark:bg-white/10" : "",
            "hover:shadow hover:border hover:border-purple-400 hover:bg-black/5 dark:hover:bg-white/10"
          )}
        >
          <Home className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/notes')}
          className={cn(
            "text-sidebar-foreground transition-all duration-300",
            isNoteActive ? "bg-black/5 dark:bg-white/10" : "",
            "hover:shadow hover:border hover:border-purple-400 hover:bg-black/5 dark:hover:bg-white/10"
          )}        >
          <FileText className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/canvases')}
          className={cn(
            "text-sidebar-foreground transition-all duration-300",
            isCanvasActive ? "bg-black/5 dark:bg-white/10" : "",
            "hover:shadow hover:border hover:border-purple-400 hover:bg-black/5 dark:hover:bg-white/10"
          )}
        >
          <Palette className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleQuickCapture}
          className={cn(
            "text-sidebar-foreground transition-all duration-300",
            isNoteActive ? "bg-black/5 dark:bg-white/10" : "",
            "hover:shadow hover:border hover:border-purple-400 hover:bg-black/5 dark:hover:bg-white/10"
          )}        >
          <FileText className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleAiDrawer}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <Brain className="h-4 w-4" />
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ width: 60 }}
      animate={{ width: 240 }}
      className="h-full bg-sidebar border-r border-sidebar-border flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-sidebar-foreground">
            {currentWorkspace?.name || 'CanvasVault'}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-sidebar-accent border-sidebar-border text-sidebar-foreground"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 space-y-2 border-b border-sidebar-border">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className={cn(
            "w-full justify-start text-sm font-medium text-sidebar-foreground transition-all duration-300",
            isDashboardActive ? "bg-black/5 dark:bg-white/10" : "",
            "hover:shadow hover:border hover:border-purple-400 hover:bg-black/5 dark:hover:bg-white/10"
          )}
        >
          <Home className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
        {/* <Button
          variant="ghost"
          onClick={() => navigate('/note')}
          className={cn(
            "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent",
            isNoteActive && 'bg-sidebar-accent'
          )}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Note
        </Button>
         */}

        <Button
          variant="ghost"
          asChild
          className={cn(
            "w-full justify-start text-sm font-medium text-sidebar-foreground transition-all duration-300",
            isNoteActive ? "bg-black/5 dark:bg-white/10" : "",
            "hover:shadow hover:border hover:border-purple-400 hover:bg-black/5 dark:hover:bg-white/10"
          )}
        >
          <Link to="/notes" className="flex items-center">
            <FileText className="mr-2 h-4 w-4" />
            All Notes
            <Plus className="ml-auto h-3 w-3" />
          </Link>
        </Button>

        <Button
          variant="ghost"
          onClick={() => navigate('/canvases')}
          className={cn(
            "w-full justify-start text-sm font-medium text-sidebar-foreground transition-all duration-300",
            isCanvasActive ? "bg-black/5 dark:bg-white/10" : "",
            "hover:shadow hover:border hover:border-purple-400 hover:bg-black/5 dark:hover:bg-white/10"
          )}
        >
          <Palette className="mr-2 h-4 w-4" />
          All Canvases
          <Plus className="ml-auto h-3 w-3" />
        </Button>

        <Button
          variant="ghost"
          onClick={toggleQuickCapture}
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent  hover:shadow hover:border hover:border-purple-400 hover:bg-black/5 dark:hover:bg-white/10"
        >
          <FileText className="mr-2 h-4 w-4" />
          Quick Capture
        </Button>

        <Button
          variant="ghost"
          onClick={toggleAiDrawer}
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:shadow hover:border hover:border-purple-400 hover:bg-black/5 dark:hover:bg-white/10"
        >
          <Brain className="mr-2 h-4 w-4" />
          AI Assistant
        </Button>
      </div>

      {/* Content */}


      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Recent Notes */}
          {recentNotes.length > 0 && (
            <div>
              <Button
                variant="ghost"
                onClick={() => toggleSection('recent')}
                className="flex items-center w-full justify-start p-0 h-auto text-sm font-medium text-sidebar-foreground mb-2"
              >
                {expandedSections.recent ? (
                  <ChevronDown className="mr-1 h-3 w-3" />
                ) : (
                  <ChevronRight className="mr-1 h-3 w-3" />
                )}
                <Clock className="mr-2 h-3 w-3" />
                Recent
              </Button>

              {expandedSections.recent && (
                <div className="ml-6 space-y-1">
                  {recentNotes.map((note) => (
                    <Button
                      key={note.id}
                      variant="ghost"
                      onClick={() => handleNoteClick(note)}
                      className={cn(
                        "w-full justify-start text-sm text-sidebar-foreground hover:bg-sidebar-accent truncate",
                        currentNote?.id === note.id && "bg-sidebar-accent"
                      )}
                    >
                      {note.type === 'canvas' ? <Palette className="mr-2 h-3 w-3" /> : <FileText className="mr-2 h-3 w-3" />}
                      {note.title}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pinned Notes */}
          {pinnedNotes.length > 0 && (
            <div>
              <Button
                variant="ghost"
                onClick={() => toggleSection('pinned')}
                className="flex items-center w-full justify-start p-0 h-auto text-sm font-medium text-sidebar-foreground mb-2"
              >
                {expandedSections.pinned ? (
                  <ChevronDown className="mr-1 h-3 w-3" />
                ) : (
                  <ChevronRight className="mr-1 h-3 w-3" />
                )}
                <Pin className="mr-2 h-3 w-3" />
                Pinned
              </Button>

              {expandedSections.pinned && (
                <div className="ml-6 space-y-1">
                  {pinnedNotes.map((note) => (
                    <Button
                      key={note.id}
                      variant="ghost"
                      onClick={() => handleNoteClick(note)}
                      className={cn(
                        "w-full justify-start text-sm text-sidebar-foreground hover:bg-sidebar-accent truncate",
                        currentNote?.id === note.id && "bg-sidebar-accent"
                      )}
                    >
                      {note.type === 'canvas' ? <Palette className="mr-2 h-3 w-3" /> : <FileText className="mr-2 h-3 w-3" />}
                      {note.title}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* All Notes Link */}
          {/* <div className="mb-4">
            <Button
              variant="ghost"
              asChild
              className="w-full justify-start text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <Link to="/notes" className="flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                All Notes
                <Plus className="ml-auto h-3 w-3" />
              </Link>
            </Button>
          </div> */}

          {/* Notes */}
          <div>
            <Button
              variant="ghost"
              onClick={() => toggleSection('notes')}
              className="flex items-center w-full justify-start p-0 h-auto text-sm font-medium text-sidebar-foreground mb-2"
            >
              {expandedSections.notes ? (
                <ChevronDown className="mr-1 h-3 w-3" />
              ) : (
                <ChevronRight className="mr-1 h-3 w-3" />
              )}
              <FileText className="mr-2 h-3 w-3" />
              Notes ({regularNotes.length})
            </Button>

            {expandedSections.notes && (
              <div className="ml-6 space-y-1">
                {regularNotes.map((note) => (
                  <Button
                    key={note.id}
                    variant="ghost"
                    onClick={() => handleNoteClick(note)}
                    className={cn(
                      "w-full justify-start text-sm text-sidebar-foreground hover:bg-sidebar-accent truncate",
                      currentNote?.id === note.id && "bg-sidebar-accent"
                    )}
                  >
                    <FileText className="mr-2 h-3 w-3" />
                    {note.title}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Canvases */}
          <div>
            <Button
              variant="ghost"
              onClick={() => toggleSection('canvases')}
              className="flex items-center w-full justify-start p-0 h-auto text-sm font-medium text-sidebar-foreground mb-2"
            >
              {expandedSections.canvases ? (
                <ChevronDown className="mr-1 h-3 w-3" />
              ) : (
                <ChevronRight className="mr-1 h-3 w-3" />
              )}
              <Palette className="mr-2 h-3 w-3" />
              Canvases ({canvases.length})
            </Button>

            {expandedSections.canvases && (
              <div className="ml-6 space-y-1">
                {canvases.map((note) => (
                  <Button
                    key={note.id}
                    variant="ghost"
                    onClick={() => handleNoteClick(note)}
                    className={cn(
                      "w-full justify-start text-sm text-sidebar-foreground hover:bg-sidebar-accent truncate",
                      currentNote?.id === note.id && "bg-sidebar-accent"
                    )}
                  >
                    <Palette className="mr-2 h-3 w-3" />
                    {note.title}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          asChild
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <Link to="/profile" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}