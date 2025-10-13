import { useEffect, useState } from 'react';
import { 
  Command, 
  Search, 
  FileText, 
  Plus, 
  Settings, 
  Palette,
  Book,
  Sparkles,
  Archive
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useWorkspaceStore } from '@/stores/workspace';
import { useNoteMutations } from '@/hooks/useNotes';
import { convertApiNoteToLocal } from '@/lib/api/notesApi';

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  keywords: string[];
  category: 'create' | 'navigate' | 'action' | 'search';
}

export function CommandPalette() {
  const { 
    commandPaletteOpen, 
    toggleCommandPalette, 
    currentWorkspace,
    setCurrentNote,
    toggleAiDrawer,
    setActiveContentType 
  } = useWorkspaceStore();
  
  const { createNote } = useNoteMutations();
  
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: CommandItem[] = [
    {
      id: 'create-note',
      title: 'Create Note',
      description: 'Create a new note with Editor.js',
      icon: <FileText className="h-4 w-4" />,
      action: async () => {
        try {
          const apiNote = await createNote({ name: 'Untitled Note' });
          const localNote = convertApiNoteToLocal(apiNote);
          setCurrentNote(localNote.id);
          toggleCommandPalette();
        } catch (error) {
          console.error('Failed to create note:', error);
        }
      },
      keywords: ['create', 'new', 'note', 'document', 'write'],
      category: 'create'
    },
    {
      id: 'create-document',
      title: 'Create Document',
      description: 'Create a new document',
      icon: <Book className="h-4 w-4" />,
      action: async () => {
        try {
          const apiNote = await createNote({ name: 'Untitled Document' });
          const localNote = convertApiNoteToLocal(apiNote);
          setCurrentNote(localNote.id);
          toggleCommandPalette();
        } catch (error) {
          console.error('Failed to create document:', error);
        }
      },
      keywords: ['create', 'new', 'document', 'doc', 'write'],
      category: 'create'
    },
    {
      id: 'create-canvas',
      title: 'Create Canvas',
      description: 'Create a new Excalidraw canvas',
      icon: <Palette className="h-4 w-4" />,
      action: async () => {
        try {
          const apiNote = await createNote({ name: 'Untitled Canvas' });
          const localNote = convertApiNoteToLocal(apiNote);
          setCurrentNote(localNote.id);
          toggleCommandPalette();
        } catch (error) {
          console.error('Failed to create canvas:', error);
        }
      },
      keywords: ['create', 'new', 'canvas', 'draw', 'excalidraw', 'diagram'],
      category: 'create'
    },
    {
      id: 'view-all',
      title: 'View All',
      description: 'Show all content types',
      icon: <Archive className="h-4 w-4" />,
      action: () => {
        setActiveContentType('all');
        toggleCommandPalette();
      },
      keywords: ['view', 'all', 'content', 'everything'],
      category: 'navigate'
    },
    {
      id: 'view-notes',
      title: 'View Notes',
      description: 'Show only notes',
      icon: <FileText className="h-4 w-4" />,
      action: () => {
        setActiveContentType('notes');
        toggleCommandPalette();
      },
      keywords: ['view', 'notes', 'filter'],
      category: 'navigate'
    },
    {
      id: 'view-documents',
      title: 'View Documents',
      description: 'Show only documents',
      icon: <Book className="h-4 w-4" />,
      action: () => {
        setActiveContentType('documents');
        toggleCommandPalette();
      },
      keywords: ['view', 'documents', 'docs', 'filter'],
      category: 'navigate'
    },
    {
      id: 'view-canvas',
      title: 'View Canvas',
      description: 'Show only canvases',
      icon: <Palette className="h-4 w-4" />,
      action: () => {
        setActiveContentType('canvas');
        toggleCommandPalette();
      },
      keywords: ['view', 'canvas', 'diagrams', 'filter'],
      category: 'navigate'
    },
    {
      id: 'ai-assistant',
      title: 'AI Assistant',
      description: 'Open AI assistant drawer',
      icon: <Sparkles className="h-4 w-4" />,
      action: () => {
        toggleAiDrawer();
        toggleCommandPalette();
      },
      keywords: ['ai', 'assistant', 'help', 'generate'],
      category: 'action'
    },
  ];

  // Add recent notes to commands (default to empty when workspace missing)
  const recentNoteCommands: CommandItem[] = (
    currentWorkspace?.recentNotes
      ?.slice(0, 5)
      ?.map((noteId) => {
        const note = currentWorkspace?.notes?.find((n) => n.id === noteId);
        if (!note) return null;
        
        return {
          id: `open-${note.id}`,
          title: note.title,
          description: `Open ${note.type}`,
          icon:
            note.type === 'canvas' ? (
              <Palette className="h-4 w-4" />
            ) : note.type === 'document' ? (
              <Book className="h-4 w-4" />
            ) : (
              <FileText className="h-4 w-4" />
            ),
          action: () => {
            setCurrentNote(note);
            toggleCommandPalette();
          },
          keywords: [note.title.toLowerCase(), note.type, 'open', 'recent'],
          category: 'navigate' as const
        };
      })
      ?.filter(Boolean) as CommandItem[]
  ) || [];
  
  const allCommands = [...commands, ...recentNoteCommands];

  const filteredCommands = query
    ? allCommands.filter(command =>
        command.title.toLowerCase().includes(query.toLowerCase()) ||
        command.description?.toLowerCase().includes(query.toLowerCase()) ||
        command.keywords.some(keyword => 
          keyword.toLowerCase().includes(query.toLowerCase())
        )
      )
    : allCommands;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'create': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'navigate': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'action': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'search': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
      }

      if (!commandPaletteOpen) return;

      if (e.key === 'Escape') {
        toggleCommandPalette();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, toggleCommandPalette, filteredCommands, selectedIndex]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  return (
    <Dialog open={commandPaletteOpen} onOpenChange={toggleCommandPalette}>
      <DialogContent className="max-w-2xl p-0 glass-effect backdrop-blur-xl border-workspace-border shadow-elegant">
        <div className="flex items-center border-b border-workspace-border/50 px-4 py-3 bg-gradient-to-r from-workspace-panel/50 to-workspace-panel/30">
          <Search className="h-4 w-4 text-primary mr-3" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="border-none bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:ring-0 text-sm"
            autoFocus
          />
          <div className="flex items-center space-x-1 ml-auto">
            <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted/50 px-1.5 font-mono text-[10px] font-medium opacity-100 flex backdrop-blur-sm">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Search className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No commands found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try searching for "create", "note", or "canvas"
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredCommands.map((command, index) => (
                <div
                  key={command.id}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    index === selectedIndex
                      ? 'bg-workspace-accent border border-primary/30 shadow-sm'
                      : 'hover:bg-workspace-hover/50 hover:scale-[1.02]'
                  }`}
                  onClick={command.action}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-muted-foreground">
                      {command.icon}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {command.title}
                      </div>
                      {command.description && (
                        <div className="text-xs text-muted-foreground">
                          {command.description}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Badge 
                    variant="secondary" 
                    className={`text-xs capitalize ${getCategoryColor(command.category)}`}
                  >
                    {command.category}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-workspace-border px-4 py-2 text-xs text-muted-foreground">
          Use ↑↓ to navigate, ↵ to select, ESC to close
        </div>
      </DialogContent>
    </Dialog>
  );
}