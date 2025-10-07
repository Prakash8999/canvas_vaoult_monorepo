import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  FileText,
  Image,
  Square,
  Circle,
  ArrowRight,
  Type,
  Palette,
  Download,
  Upload,
  Copy,
  Trash2,
  ZoomIn,
  ZoomOut,
  Grid3X3,
  Settings,
  Share,
  Save,
  FolderOpen,
  Plus,
  Command
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Command {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  category: string;
  shortcut?: string;
  action: () => void;
}

interface EraserCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onToolChange?: (tool: string) => void;
  onAction?: (action: string) => void;
}

export function EraserCommandPalette({
  isOpen,
  onClose,
  onToolChange,
  onAction
}: EraserCommandPaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: Command[] = [
    // Tools
    {
      id: 'select-tool',
      title: 'Select Tool',
      description: 'Switch to selection tool',
      icon: Search,
      category: 'Tools',
      shortcut: 'V',
      action: () => onToolChange?.('select')
    },
    {
      id: 'rectangle-tool',
      title: 'Rectangle Tool',
      description: 'Draw rectangles',
      icon: Square,
      category: 'Tools',
      shortcut: 'R',
      action: () => onToolChange?.('rectangle')
    },
    {
      id: 'circle-tool',
      title: 'Circle Tool',
      description: 'Draw circles and ellipses',
      icon: Circle,
      category: 'Tools',
      shortcut: 'O',
      action: () => onToolChange?.('ellipse')
    },
    {
      id: 'arrow-tool',
      title: 'Arrow Tool',
      description: 'Draw arrows and connectors',
      icon: ArrowRight,
      category: 'Tools',
      shortcut: 'A',
      action: () => onToolChange?.('arrow')
    },
    {
      id: 'text-tool',
      title: 'Text Tool',
      description: 'Add text to canvas',
      icon: Type,
      category: 'Tools',
      shortcut: 'T',
      action: () => onToolChange?.('text')
    },
    {
      id: 'image-tool',
      title: 'Image Tool',
      description: 'Insert images',
      icon: Image,
      category: 'Tools',
      shortcut: 'I',
      action: () => onToolChange?.('image')
    },

    // File Operations
    {
      id: 'new-document',
      title: 'New Document',
      description: 'Create a new document',
      icon: Plus,
      category: 'File',
      shortcut: 'Ctrl+N',
      action: () => onAction?.('new')
    },
    {
      id: 'open-document',
      title: 'Open Document',
      description: 'Open an existing document',
      icon: FolderOpen,
      category: 'File',
      shortcut: 'Ctrl+O',
      action: () => onAction?.('open')
    },
    {
      id: 'save-document',
      title: 'Save Document',
      description: 'Save current document',
      icon: Save,
      category: 'File',
      shortcut: 'Ctrl+S',
      action: () => onAction?.('save')
    },
    {
      id: 'export-png',
      title: 'Export as PNG',
      description: 'Export canvas as PNG image',
      icon: Download,
      category: 'Export',
      action: () => onAction?.('export-png')
    },
    {
      id: 'export-svg',
      title: 'Export as SVG',
      description: 'Export canvas as SVG vector',
      icon: Download,
      category: 'Export',
      action: () => onAction?.('export-svg')
    },

    // Edit Operations
    {
      id: 'copy',
      title: 'Copy',
      description: 'Copy selected elements',
      icon: Copy,
      category: 'Edit',
      shortcut: 'Ctrl+C',
      action: () => onAction?.('copy')
    },
    {
      id: 'delete',
      title: 'Delete',
      description: 'Delete selected elements',
      icon: Trash2,
      category: 'Edit',
      shortcut: 'Del',
      action: () => onAction?.('delete')
    },

    // View Operations
    {
      id: 'zoom-in',
      title: 'Zoom In',
      description: 'Increase canvas zoom',
      icon: ZoomIn,
      category: 'View',
      shortcut: 'Ctrl++',
      action: () => onAction?.('zoom-in')
    },
    {
      id: 'zoom-out',
      title: 'Zoom Out',
      description: 'Decrease canvas zoom',
      icon: ZoomOut,
      category: 'View',
      shortcut: 'Ctrl+-',
      action: () => onAction?.('zoom-out')
    },
    {
      id: 'toggle-grid',
      title: 'Toggle Grid',
      description: 'Show or hide grid',
      icon: Grid3X3,
      category: 'View',
      shortcut: 'Ctrl+G',
      action: () => onAction?.('toggle-grid')
    },

    // Share & Collaboration
    {
      id: 'share',
      title: 'Share Document',
      description: 'Share with team members',
      icon: Share,
      category: 'Share',
      action: () => onAction?.('share')
    },

    // Settings
    {
      id: 'preferences',
      title: 'Preferences',
      description: 'Open application settings',
      icon: Settings,
      category: 'Settings',
      shortcut: 'Ctrl+,',
      action: () => onAction?.('preferences')
    }
  ];

  const filteredCommands = commands.filter(command =>
    command.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    command.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    command.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedCommands = filteredCommands.reduce((acc, command) => {
    if (!acc[command.category]) {
      acc[command.category] = [];
    }
    acc[command.category].push(command);
    return acc;
  }, {} as Record<string, Command[]>);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 gap-0 bg-white/95 backdrop-blur-xl border-0 shadow-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-gray-500">
                <Command className="h-4 w-4" />
                <span className="text-sm font-medium">Command Palette</span>
              </div>
            </div>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search for commands, tools, or actions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-0 bg-gray-50 focus:bg-white transition-colors"
                autoFocus
              />
            </div>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {Object.keys(groupedCommands).length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No commands found</p>
                <p className="text-sm mt-1">Try a different search term</p>
              </div>
            ) : (
              <div className="py-2">
                {Object.entries(groupedCommands).map(([category, categoryCommands]) => (
                  <div key={category} className="mb-4 last:mb-0">
                    <div className="px-6 py-2">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {category}
                      </h3>
                    </div>
                    <div className="space-y-1 px-2">
                      {categoryCommands.map((command, index) => {
                        const globalIndex = filteredCommands.indexOf(command);
                        const isSelected = globalIndex === selectedIndex;
                        
                        return (
                          <motion.button
                            key={command.id}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-150 ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'hover:bg-gray-50 text-gray-700'
                            }`}
                            onClick={() => {
                              command.action();
                              onClose();
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <command.icon className={`h-5 w-5 flex-shrink-0 ${
                              isSelected ? 'text-white' : 'text-gray-400'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{command.title}</span>
                                {command.shortcut && (
                                  <Badge 
                                    variant="secondary" 
                                    className={`text-xs ${
                                      isSelected 
                                        ? 'bg-white/20 text-white' 
                                        : 'bg-gray-100 text-gray-500'
                                    }`}
                                  >
                                    {command.shortcut}
                                  </Badge>
                                )}
                              </div>
                              <p className={`text-sm ${
                                isSelected ? 'text-white/80' : 'text-gray-500'
                              }`}>
                                {command.description}
                              </p>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs">↑</kbd>
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs">↓</kbd>
                  to navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs">Enter</kbd>
                  to select
                </span>
              </div>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs">Esc</kbd>
                to close
              </span>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}