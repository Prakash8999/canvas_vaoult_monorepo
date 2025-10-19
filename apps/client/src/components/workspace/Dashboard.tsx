import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Palette, 
  Plus, 
  Clock, 
  Pin,
  Sparkles,
  TrendingUp,
  Calendar,
  Search,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWorkspaceStore } from '@/stores/workspace';
import { useCanvasDocumentStore } from '@/stores/canvasDocument';
import { format } from 'date-fns';
import { useEnhancedNoteStore } from '@/stores/enhancedNoteStore';
import { useNotes, useNoteMutations } from '@/hooks/useNotes';
import { convertApiNoteToLocal } from '@/lib/api/notesApi';
import { getWelcomeContent } from '../CommonContent/getWelcomeContent';

export function Dashboard() {
  const navigate = useNavigate();
  const { 
    currentWorkspace, 
    setCurrentNote,
    addToRecent,
    toggleQuickCapture,
    toggleAiDrawer 
  } = useWorkspaceStore();

  const { data: notes = {} } = useNotes();
  const { createNote } = useNoteMutations();
  const { getPinnedNotes } = useEnhancedNoteStore();
  const { canvases } = useCanvasDocumentStore();

  const handleNoteClick = (note: any) => {
    navigate(`/note/${note.id}`);
  };

  // Get actual notes data from enhanced note store
  const allNotes = Object.values(notes).sort((a, b) => b.modifiedAt - a.modifiedAt);
  
  // Recent items: combine canvases and notes, sort by modified time
  const allCanvases = Object.values(canvases || {}).map((c: any) => ({
    id: c.id,
    title: c.name,
    updatedAt: c.modifiedAt,
    type: 'canvas'
  }));

  // Normalize notes and combine with canvases for a mixed recent list
  const noteItems = allNotes.map(n => ({
    id: n.id,
    title: n.name || 'Untitled Note',
    updatedAt: n.modifiedAt,
    note_uid: n.note_uid,
    type: 'note'
  }));

  const recentNotes = [...allCanvases, ...noteItems]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 3);

  // Combine pinned notes and pinned canvases for the Pinned panel
  const pinnedNoteItems = getPinnedNotes().map(note => ({
    id: note.id,
    title: note.name,
    updatedAt: note.modifiedAt,
    type: 'note'
  }));

  const pinnedCanvasItems = Object.values(canvases || {})
    .filter((c: any) => c.pinned)
    .map((c: any) => ({
      id: c.id,
      title: c.name,
      updatedAt: c.modifiedAt,
      type: 'canvas'
    }));

  const pinnedNotes = [...pinnedNoteItems, ...pinnedCanvasItems]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 3);

  const totalNotes = allNotes.length;
  const totalDocuments = 0; // No documents in enhanced store yet
  const totalCanvases = Object.keys(canvases || {}).length;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  
  const handleCreateNote = async () => {
    const currentNotesCount = Object.keys(notes).length;
    try {
      if (currentNotesCount === 0) {
        // First note - create with welcome content
        const apiNote = await createNote({
          name: 'Welcome to Your Knowledge Base',
          content: getWelcomeContent()
        });
        const localNote = convertApiNoteToLocal(apiNote);
        navigate(`/note/${localNote.note_uid}`);
      } else {
        // Regular note
        const noteName = `Untitled Note ${new Date().toLocaleTimeString()}`;
        const apiNote = await createNote({ name: noteName });
        const localNote = convertApiNoteToLocal(apiNote);
        navigate(`/note/${localNote.note_uid}`);
      }
    } catch (error) {
      console.error('Failed to create note:', error);
      // Handle error - maybe show a toast
    }
  };
  const handleItemClick = (item: any) => {
    if (item.type === 'canvas') {
      navigate(`/canvas/${item.id}`);
    } else {
      console.log('Navigating to note:', item);
      navigate(`/note/${item.note_uid}`);
    }
  };

  return (
    <div className="h-full overflow-auto bg-workspace-bg">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto p-8 space-y-8"
      >
        {/* Welcome Header */}
        <motion.div variants={itemVariants} className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-12 h-12 bg-ai-gradient rounded-2xl flex items-center justify-center shadow-glow">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">
              Welcome to {currentWorkspace?.name || 'CanvasVault'}
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your local-first workspace for notes, canvases, and AI-powered creativity. 
            Everything stays on your device, syncs seamlessly, and works offline.
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants} className="flex justify-center space-x-4">
          <Button
            onClick={handleCreateNote}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Note
          </Button>
          
          <Button
            onClick={() => navigate('/canvas')}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          >
            <Palette className="mr-2 h-4 w-4" />
            New Canvas
            <ExternalLink className="ml-2 h-3 w-3" />
          </Button>
          
          <Button
            onClick={toggleQuickCapture}
            variant="outline"
            className="border-workspace-border hover:bg-workspace-hover"
          >
            <Search className="mr-2 h-4 w-4" />
            Quick Capture
          </Button>
          
          <Button
            onClick={toggleAiDrawer}
            variant="outline"
            className="border-workspace-border hover:bg-workspace-hover"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            AI Assistant
          </Button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-workspace-panel border-workspace-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Total Notes</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalNotes}</div>
              <p className="text-xs text-muted-foreground">
                {totalNotes > 0 ? '+2 from last week' : 'Start writing your first note'}
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-workspace-panel border-workspace-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Canvases</CardTitle>
              <Palette className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalCanvases}</div>
              <p className="text-xs text-muted-foreground">
                {totalCanvases > 0 ? 'Visual thinking space' : 'Create your first canvas'}
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-workspace-panel border-workspace-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Activity</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {recentNotes.length > 0 ? 'Active' : 'Start'}
              </div>
              <p className="text-xs text-muted-foreground">
                {recentNotes.length > 0 ? 'Working on ideas' : 'Begin your journey'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Notes */}
          <motion.div variants={itemVariants}>
            <Card className="bg-workspace-panel border-workspace-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <CardTitle className="text-foreground">Recent</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {recentNotes.length > 0 && (
                      <Badge variant="secondary">{recentNotes.length}</Badge>
                    )}
                    {totalNotes > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/notes')}
                        className="text-xs"
                      >
                        View All
                      </Button>
                    )}
                  </div>
                </div>
                <CardDescription>Continue where you left off</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentNotes.length > 0 ? (
                  recentNotes.map((item) => (
                    <motion.div
                      key={item.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleItemClick(item)}
                      className="flex items-center space-x-3 p-3 rounded-lg bg-workspace-hover hover:bg-workspace-border cursor-pointer transition-colors"
                    >
                      {item.type === 'canvas' ? (
                        <Palette className="h-4 w-4 text-primary" />
                      ) : (
                        <FileText className="h-4 w-4 text-primary" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{item.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(item.updatedAt), 'MMM d, HH:mm')}
                        </p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recent notes yet</p>
                    <p className="text-sm">Create your first note to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Pinned Notes */}
          <motion.div variants={itemVariants}>
            <Card className="bg-workspace-panel border-workspace-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Pin className="h-5 w-5 text-primary" />
                    <CardTitle className="text-foreground">Pinned</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {pinnedNotes.length > 0 && (
                      <Badge variant="secondary">{pinnedNotes.length}</Badge>
                    )}
                    {pinnedNotes.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/notes')}
                        className="text-xs"
                      >
                        View All
                      </Button>
                    )}
                  </div>
                </div>
                <CardDescription>Your most important notes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pinnedNotes.length > 0 ? (
                  pinnedNotes.map((item) => (
                    <motion.div
                      key={item.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleItemClick(item)}
                      className="flex items-center space-x-3 p-3 rounded-lg bg-workspace-hover hover:bg-workspace-border cursor-pointer transition-colors"
                    >
                      {item.type === 'canvas' ? (
                        <Palette className="h-4 w-4 text-primary" />
                      ) : (
                        <FileText className="h-4 w-4 text-primary" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{item.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(item.updatedAt), 'MMM d, HH:mm')}
                        </p>
                      </div>
                      <div>
                        <Pin className="h-4 w-4 text-warning" />
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Pin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No pinned notes yet</p>
                    <p className="text-sm">Pin important notes for quick access</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Getting Started */}
        {totalNotes === 0 && totalCanvases === 0 && (
          <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span>Getting Started</span>
                </CardTitle>
                <CardDescription>Tips to make the most of CanvasVault</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">📝 Create Notes</h4>
                    <p className="text-sm text-muted-foreground">
                      Use the block editor to write, organize ideas, and embed canvases
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">🎨 Draw on Canvas</h4>
                    <p className="text-sm text-muted-foreground">
                      Sketch diagrams, mind maps, and visual concepts with infinite space
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">🤖 AI Assistant</h4>
                    <p className="text-sm text-muted-foreground">
                      Get help summarizing, organizing, and expanding your ideas
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">🔍 Quick Capture</h4>
                    <p className="text-sm text-muted-foreground">
                      Rapidly capture thoughts and ideas without losing focus
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}