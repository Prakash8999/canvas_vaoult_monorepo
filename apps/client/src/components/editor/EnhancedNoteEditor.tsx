import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { EnhancedEditorJS } from './EnhancedEditorJS';
import { BacklinksPanel } from './panels/BacklinksPanel';
import { TagsPanel } from './panels/TagsPanel';
import { GraphPanel } from './panels/GraphPanel';
import { TemplateModal } from './TemplateModal';
import { SearchResultsSkeleton, PanelSkeleton } from './EditorSkeleton';
import { toast } from 'sonner';

import type { OutputData } from '@editorjs/editorjs';

import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { AiDrawer } from '@/components/ai/AiDrawer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

import { useWorkspaceStore } from '@/stores/workspace';
import { useEnhancedNoteStore } from '@/stores/enhancedNoteStore';
import { useNotes, useNoteMutations } from '@/hooks/useNotes';
import { useAutoSave } from '@/hooks/useAutoSave';
import { notesApi } from '@/lib/api/notesApi';

import {
  Network,
  Hash,
  Link2,
  Pin,
  PinOff,
  Plus,
  Search,
  Calendar,
  FileText,
  BookOpen,
  Lightbulb,
  Settings,
  Eye,
  EyeOff,
  X,
  LayoutTemplate,
  LucideBookTemplate,
  Save,
} from 'lucide-react';

interface EnhancedNoteEditorProps {
  embedded?: boolean;
  mode?: 'full' | 'light';
  isLoadingNote?: boolean;
}

export default function EnhancedNoteEditor({ embedded = false, mode = 'full', isLoadingNote = false }: EnhancedNoteEditorProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarOpen = useWorkspaceStore(state => state.sidebarOpen);

  const { data: notes = {}, isLoading: notesLoading, error: notesError } = useNotes();
  const { createNote, updateNote: updateNoteMutation, isCreating, isUpdating } = useNoteMutations();

  const {
    currentNoteId,
    setCurrentNote,
    getPinnedNotes,
    showBacklinks,
    showTags,
    showGraphView,
    toggleBacklinks,
    toggleTags,
    toggleGraphView,
    searchQuery,
    setSearchQuery,
    searchResults
  } = useEnhancedNoteStore();

  // Debounced search states
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [apiSearchResults, setApiSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Auto-save hook
  const autoSave = useAutoSave({
    noteId: currentNoteId,
    updateNote: updateNoteMutation,
    intervalMs: 12000, // 12 seconds for periodic auto-save
    debounceMs: 2000, // 2 seconds debounce for keystroke changes
    enabled: mode === 'full' // Only enable auto-save in full mode
  });

    useEffect(() => {
    return () => {
      setSearchQuery('');
    };
  }, []);


  // Save before navigation/note switching
  const previousNoteIdRef = useRef<string | null>(null);
  useEffect(() => {
    const previousNoteId = previousNoteIdRef.current;

    // Save the previous note when switching to a new note
    if (previousNoteId && previousNoteId !== currentNoteId && notesApi.isNoteDirty(previousNoteId)) {
      console.log(`[Navigation] Saving note ${previousNoteId} before switching to ${currentNoteId}`);
      updateNoteMutation({
        id: previousNoteId,
        updates: { content: notes[previousNoteId]?.content }
      }).catch(error => {
        console.error('Failed to save note before navigation:', error);
      });
    }

    previousNoteIdRef.current = currentNoteId;
  }, [currentNoteId, updateNoteMutation, notes]);


  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S to save manually
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (currentNoteId && autoSave.isDirty) {
          autoSave.saveManually();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentNoteId, autoSave]);

  // Debounce search query
  useEffect(() => {
    if (searchQuery.length >= 3) {
      const timer = setTimeout(() => {
        setDebouncedSearchQuery(searchQuery);
      }, 500); // 500ms debounce after 3+ characters
      return () => clearTimeout(timer);
    } else {
      setDebouncedSearchQuery('');
    }
  }, [searchQuery]);

  // Fetch search results from API
  useEffect(() => {
    if (debouncedSearchQuery) {
      fetchNotesWithSearch(debouncedSearchQuery);
    } else {
      setApiSearchResults([]);
    }
  }, [debouncedSearchQuery]);

  // Function to fetch notes with search
  const fetchNotesWithSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/v1/note/notes?search=${encodeURIComponent(query)}&limit=50`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch search results');
      }
      const data = await response.json();
      // Handle the response format
      const notesData = data.data;
      if (Array.isArray(notesData)) {
        setApiSearchResults(notesData);
      } else if (notesData && notesData.notes) {
        setApiSearchResults(notesData.notes);
      } else {
        setApiSearchResults([]);
      }
    } catch (error) {
      console.error('Error fetching search results:', error);
      setApiSearchResults([]);
      toast.error('Failed to search notes');
    } finally {
      setIsSearching(false);
    }
  };

  // Helper function to navigate to a note
  const navigateToNote = async (noteId: string) => {
    // Save current note before navigation if it's dirty
    if (currentNoteId && autoSave.isDirty) {
      try {
        await autoSave.saveManually();
        console.log(`[Navigation] Saved note ${currentNoteId} before switching to ${noteId}`);
      } catch (error) {
        console.error('Failed to save before navigation:', error);
        toast.error('Failed to save current note');
        return; // Don't navigate if save fails
      }
    }

    if (embedded) {
      // If embedded, just change the current note
      setCurrentNote(noteId);
    } else {
      // If standalone, navigate to the note URL
      navigate(`/note/${noteId}`);
    }
  };

  const [editingName, setEditingName] = useState(false);
  const [newNoteName, setNewNoteName] = useState('');
  const [showNotesList, setShowNotesList] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const notesListRef = useRef<HTMLDivElement>(null);

  const currentNote = currentNoteId ? notes[currentNoteId] : null;
  const pinnedNotes = getPinnedNotes();
  const allNotes = Object.values(notes).sort((a, b) => b.modifiedAt - a.modifiedAt);

  // Handle click outside and escape key for notes list
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showNotesList && notesListRef.current && !notesListRef.current.contains(event.target as Node)) {
        setShowNotesList(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showNotesList) {
        setShowNotesList(false);
      }
    };

    if (showNotesList) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showNotesList]);



  // Temporary: Add clear storage function for testing
  const clearStorageForTesting = () => {
    localStorage.removeItem('vcw:enhancedNotes');
    localStorage.removeItem('vcw:currentNoteId');
    window.location.reload();
  };

  // Expose to global for testing
  (window as any).clearStorageForTesting = clearStorageForTesting;

  // Debug function to check backlinks
  const debugBacklinks = (noteId?: string) => {
    const targetId = noteId || currentNoteId;
    if (!targetId) {
      console.log('No note ID provided');
      return;
    }

    const targetNote = notes[targetId];
    if (!targetNote) {
      console.log('Note not found:', targetId);
      return;
    }

    console.log('=== BACKLINK DEBUG ===');
    console.log('Target Note:', targetNote.name, `(${targetId})`);
    console.log('All Notes:', Object.values(notes).map(n => ({ name: n.name, id: n.id })));

    // Special check for welcome note
    const welcomeNote = Object.values(notes).find(n => n.name.includes('Welcome') || n.name.includes('Knowledge Base'));
    if (welcomeNote) {
      console.log('\n🔍 SPECIAL WELCOME NOTE CHECK:');
      console.log('Welcome note:', welcomeNote.name, `(${welcomeNote.id})`);
      console.log('Welcome note content:', JSON.stringify(welcomeNote.content, null, 2));

      const welcomeLinks = useEnhancedNoteStore.getState().extractLinks(welcomeNote.content);
      console.log('Links from welcome note:', welcomeLinks);

      welcomeNote.content.blocks.forEach((block, index) => {
        if (block.data?.text) {
          console.log(`Welcome Block ${index}:`, block.data.text);

          // Check for both formats
          const hasPlainLink = block.data.text.includes(`[[${targetNote.name}]]`);
          const hasHtmlLink = block.data.text.includes(`data-note-name="${targetNote.name}"`);

          console.log(`  - Has plain [[${targetNote.name}]]:`, hasPlainLink);
          console.log(`  - Has HTML wiki-link:`, hasHtmlLink);
        }
      });
    }

    // Check each note for links to target
    Object.values(notes).forEach(note => {
      if (note.id === targetId) return;

      console.log(`\n--- Checking note: ${note.name} (${note.id}) ---`);

      const links = useEnhancedNoteStore.getState().extractLinks(note.content);
      console.log('Extracted links:', links);

      const hasLinkToTarget = links.includes(targetNote.name);
      console.log(`Has link to "${targetNote.name}":`, hasLinkToTarget);

      // Also check raw text for debugging
      note.content.blocks.forEach((block, index) => {
        if (block.data?.text) {
          const hasRawLink = block.data.text.includes(`[[${targetNote.name}]]`);
          const hasHtmlLink = block.data.text.includes(`data-note-name="${targetNote.name}"`);
          if (hasRawLink || hasHtmlLink) {
            console.log(`Block ${index} text:`, block.data.text);
            console.log(`Block ${index} has raw link:`, hasRawLink);
            console.log(`Block ${index} has HTML link:`, hasHtmlLink);
          }
        }
      });
    });

    const backlinks = useEnhancedNoteStore.getState().getBacklinksWithDOM(targetId);
    console.log('\nFinal backlinks:', backlinks.map(n => n.name));
  };

  (window as any).debugBacklinks = debugBacklinks;

  // Welcome content for first note
  const getWelcomeContent = () => ({
    blocks: [
      {
        type: 'paragraph',
        data: {
          text: 'Welcome to your enhanced note editor! Here are some features to get you started:'
        }
      },
      {
        type: 'list',
        data: {
          style: 'unordered',
          items: [
            'Create links between notes using [[Note Name]] syntax',
            'Add tags to organize your notes with #hashtag',
            'Use the graph view to visualize connections',
            'Run JavaScript and Python code in runnable blocks',
            'Create charts from your data',
            'Pin important notes for quick access'
          ]
        }
      },
      {
        type: 'paragraph',
        data: {
          text: 'Try creating a link to a new note: [[My First Note]] - click it to create and navigate!'
        }
      }
    ]
  });



  // Create initial note if none exists (guarded to avoid duplicates on refresh)
  const WELCOME_SEEDED_KEY = 'vcw:welcomeNoteSeeded';
  useEffect(() => {
    let cancelled = false;
    const createInitialNote = async () => {
      // Only seed when:
      // - full mode
      // - we currently have zero notes in state
      // - we have NOT previously seeded (localStorage flag)
      // - avoid race: wait a tick so any pending hydration can populate notes
      if (mode === 'full' && Object.keys(notes).length === 0 && !localStorage.getItem(WELCOME_SEEDED_KEY)) {
        // small defer to allow any async store hydration to run first
        await new Promise(r => setTimeout(r, 50));
        if (cancelled) return;
        if (Object.keys(notes).length > 0) return; // notes arrived meanwhile
        try {
          const apiNote = await createNote({
            name: 'Welcome to Your Knowledge Base',
            content: getWelcomeContent()
          });
          localStorage.setItem(WELCOME_SEEDED_KEY, '1');
          const initialNoteId = apiNote.id?.toString?.() || apiNote.id + '';
          if (embedded) {
            setCurrentNote(initialNoteId);
          } else {
            navigate(`/note/${initialNoteId}`, { replace: true });
          }
        } catch (error) {
          console.error('Failed to create initial note:', error);
        }
      }
    };
    createInitialNote();
    return () => { cancelled = true; };
  }, [mode, notes, createNote, embedded, setCurrentNote, navigate]);

  const handleCreateNote = async () => {
    if (newNoteName.trim()) {
      try {
        const currentNotesCount = Object.keys(notes).length;
        let apiNote;

        if (currentNotesCount === 0) {
          // First note - create with welcome content
          apiNote = await createNote({
            name: newNoteName.trim(),
            content: getWelcomeContent()
          });
        } else {
          // Regular note
          apiNote = await createNote({ name: newNoteName.trim() });
        }

        const noteId = apiNote.id.toString();
        navigateToNote(noteId);
        setNewNoteName('');
        setShowNotesList(false);
      } catch (error) {
        console.error('Failed to create note:', error);
        toast.error('Failed to create note');
      }
    }
  };

  const handleNoteChange = (data: OutputData) => {
    if (currentNoteId) {
      console.log(`[NoteChange] Content changed for note ${currentNoteId}`);
      autoSave.updateContent(data);

      // Force backlinks refresh after content change
      setTimeout(() => {
        if (currentNoteId) {
          console.log(`[NoteChange] Current note after update:`, notes[currentNoteId]);
        }
      }, 100);
    } else {
      console.log(`[NoteChange] No current note ID to update`);
    }
  };

  const handleNameChange = async (newName: string) => {
    if (currentNoteId && newName.trim()) {
      try {
        await autoSave.updateTitle(newName.trim());
        toast.success('Note title updated');
      } catch (error) {
        console.error('Failed to update note name:', error);
        toast.error('Failed to update note name');
      }
    }
  };

  const handleTogglePin = async () => {
    if (currentNote) {
      try {
        await autoSave.updatePinned(!currentNote.isPinned);
        toast.success(currentNote.isPinned ? 'Note unpinned' : 'Note pinned');
      } catch (error) {
        console.error('Failed to toggle pin:', error);
        toast.error('Failed to update note');
      }
    }
  };

  const handleTemplateSelect = async (templateContent: any, templateName: string) => {
    if (currentNoteId) {
      try {
        // Update content through auto-save system (will be saved automatically)
        autoSave.updateContent(templateContent);
        toast.success(`Applied template: ${templateName}`);
      } catch (error) {
        console.error('Failed to apply template:', error);
        toast.error('Failed to apply template');
      }
    }
  };

  // Check if we're in a loading state that should show skeleton
  const isInitialLoading = (notesLoading && Object.keys(notes).length === 0) || isLoadingNote;

  // Show simplified interface for light mode
  if (mode === 'light') {
    return (
      <div className="w-full h-full max-w-none bg-white rounded-none shadow-none p-6 border border-none">
        {/* Simple title */}
        <div className="mb-4">
          {isInitialLoading ? (
            <div className="animate-pulse h-8 bg-gray-200 rounded w-64 mb-2"></div>
          ) : (
            <h1 className="text-2xl font-bold text-gray-900">
              Canvas Document
            </h1>
          )}
        </div>

        <div className="w-full max-w-2xl mx-auto">
          {isInitialLoading ? (
            <div className="space-y-4">
              <div className="animate-pulse h-4 bg-gray-200 rounded w-full"></div>
              <div className="animate-pulse h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="animate-pulse h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="space-y-2 mt-4">
                <div className="animate-pulse h-3 bg-gray-200 rounded w-full"></div>
                <div className="animate-pulse h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ) : (
            <EnhancedEditorJS
              key={currentNote?.id}
              width={700}
              data={currentNote?.content}
              onChange={handleNoteChange}
              placeholder="Start writing your document..."
              alignLeft
              noBorder
              mode="light"
              onImageError={msg => toast.error(msg)}
              onNavigateToNote={navigateToNote}
              onSaveCurrentNote={autoSave.saveManually}
              onWikiLinkCreated={autoSave.saveContentNow}
            />
          )}
        </div>
      </div>
    );
  }

  // Main content for full editor
  const mainContent = (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      {/* Main Editor Area */}
      <ResizablePanel defaultSize={60} minSize={40}>
        <div className="h-full flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="relative flex text-black items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              {/* Notes list toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotesList(!showNotesList)}
                className="relative"
              >
                <FileText size={16} />
                <span className="ml-2">Notes ({allNotes.length})</span>
                {pinnedNotes.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {pinnedNotes.length} pinned
                  </Badge>
                )}
              </Button>

              {/* Enhanced Global Search */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search all notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setSearchQuery('');
                    }
                  }}
                  className="pl-9 pr-8 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}

                {/* Enhanced Search Results Dropdown */}
                {searchQuery && debouncedSearchQuery && apiSearchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                          Search Results
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {apiSearchResults.length} found
                        </Badge>
                      </div>
                    </div>

                    {/* Results */}
                    <div className="max-h-80 overflow-y-auto">
                      {apiSearchResults.map(note => (
                        <div
                          key={note.note_uid}
                          className="p-4 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-all duration-200"
                          onClick={() => {
                            navigateToNote(note.note_uid);
                            setSearchQuery(''); // Clear search after navigation
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {note.pinned && (
                                  <Pin size={12} className="text-amber-500 flex-shrink-0" />
                                )}
                                <span className="font-medium text-sm text-gray-900 truncate">
                                  {note.title}
                                </span>
                              </div>

                              <div className="text-xs text-gray-500 flex items-center gap-3 mb-2">
                                <span className="flex items-center gap-1">
                                  <FileText size={10} />
                                  {note.content?.blocks?.length || 0} blocks
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar size={10} />
                                  {new Date(note.updated_at).toLocaleDateString()}
                                </span>
                              </div>

                              {note.tags && note.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {note.tags.slice(0, 3).map(tag => (
                                    <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0 text-blue-600 border-blue-200">
                                      #{tag}
                                    </Badge>
                                  ))}
                                  {note.tags.length > 3 && (
                                    <Badge variant="outline" className="text-xs px-1.5 py-0 text-gray-500">
                                      +{note.tags.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="ml-3 flex-shrink-0">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Loading State */}
                {searchQuery && isSearching && (
                  <SearchResultsSkeleton />
                )}

                {/* Enhanced No Results Message */}
                {searchQuery && debouncedSearchQuery && !isSearching && apiSearchResults.length === 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="p-6 text-center">
                      <Search size={32} className="mx-auto mb-3 text-gray-300" />
                      <div className="text-gray-600 text-sm font-medium mb-1">
                        No notes found
                      </div>
                      <div className="text-gray-400 text-xs">
                        Try searching with different keywords or create a new note
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Panel toggles */}
              <Button
                variant={showBacklinks ? "default" : "ghost"}
                size="sm"
                onClick={toggleBacklinks}
              >
                <Link2 size={16} />
              </Button>

              <Button
                variant={showTags ? "default" : "ghost"}
                size="sm"
                onClick={toggleTags}
              >
                <Hash size={16} />
              </Button>

              <Button
                variant={showGraphView ? "default" : "ghost"}
                size="sm"
                onClick={toggleGraphView}
              >
                <Network size={16} />
              </Button>



              <Separator orientation="vertical" className="h-6" />

              {/* Note actions */}
              {currentNote && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleTogglePin}
                  className={currentNote.isPinned ? "text-yellow-600" : ""}
                >
                  {currentNote.isPinned ? <Pin size={16} /> : <PinOff size={16} />}
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTemplateModal(true)}
              >
                {/* <FileTemplate size={16} />
				 */}

                <LucideBookTemplate />
                <span className="ml-2">Template</span>
              </Button>

              {/* Manual Save Button */}
              {currentNote && (
                <Button
                  variant={autoSave.isDirty ? "default" : "ghost"}
                  size="sm"
                  onClick={autoSave.saveManually}
                  disabled={autoSave.isSaving || !autoSave.isDirty}
                  className="relative"
                >
                  {autoSave.isSaving ? (
                    <div className="animate-spin w-4 h-4 border border-gray-300 border-t-blue-500 rounded-full" />
                  ) : (
                    <Save size={16} />
                  )}
                  <span className="ml-2">
                    {autoSave.isSaving ? 'Saving...' : autoSave.isDirty ? 'Save' : 'Saved'}
                  </span>
                  {autoSave.isDirty && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" />
                  )}
                </Button>
              )}

              {/* Auto-save Status */}
              {currentNote && autoSave.lastSaved && !autoSave.isDirty && (
                <div className="text-xs text-green-600 flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  Last saved {autoSave.lastSaved.toLocaleTimeString()}
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const currentNotesCount = Object.keys(notes).length;
                  if (currentNotesCount === 0 && !localStorage.getItem(WELCOME_SEEDED_KEY)) {
                    // First note - create with welcome content (only once)
                    createNote({
                      name: 'Welcome to Your Knowledge Base',
                      content: getWelcomeContent()
                    }).then(apiNote => {
                      localStorage.setItem(WELCOME_SEEDED_KEY, '1');
                      const noteId = apiNote.id?.toString?.() || apiNote.id + '';
                      navigateToNote(noteId);
                    });
                  } else {
                    // Regular note
                    const noteName = `Note ${new Date().toLocaleTimeString()}`;
                    createNote({ name: noteName }).then(apiNote => {
                      const noteId = apiNote.id?.toString?.() || apiNote.id + '';
                      navigateToNote(noteId);
                    });
                  }
                }}
              >
                <Plus size={16} />
                <span className="ml-2">New</span>
              </Button>

              {/* Temporary debug button */}
              {/* <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  console.log('Storage Debug:', {
                    localStorage: localStorage.getItem('vcw:enhancedNotes'),
                    currentNoteId: localStorage.getItem('vcw:currentNoteId'),
                    notesInState: Object.keys(notes).length
                  });
                }}
              >
                Debug
              </Button> */}

              {/* <Button
                variant="ghost"
                size="sm"
                onClick={clearStorageForTesting}
                className="text-red-600"
              >
                Clear
              </Button> */}
            </div>
          </div>

          {/* Enhanced Notes List Panel - Absolute Positioned Overlay */}
          {showNotesList && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black/80 z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
                onClick={() => setShowNotesList(false)}
              />

              {/* Notes Panel */}
              <div
                ref={notesListRef}
                className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <FileText size={18} />
                      Your Notes
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNotesList(false)}
                      className="hover:bg-white/50"
                    >
                      <X size={16} />
                    </Button>
                  </div>

                  {/* Quick Create */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Create new note..."
                      value={newNoteName}
                      onChange={(e) => setNewNoteName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCreateNote();
                        } else if (e.key === 'Escape') {
                          setShowNotesList(false);
                        }
                      }}
                      className="flex-1 px-3 py-2 text-sm border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                    <Button
                      onClick={handleCreateNote}
                      disabled={!newNoteName.trim()}
                      size="sm"
                      className="px-3"
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                </div>

                {/* Notes List */}
                <ScrollArea className="h-80">
                  <div className="p-4 space-y-3">
                    {/* Pinned notes */}
                    {pinnedNotes.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                          <Pin size={12} className="text-amber-500" />
                          Pinned Notes
                        </h4>
                        <div className="space-y-2 mb-4">
                          {pinnedNotes.map(note => (
                            <NoteListItem
                              key={note.id}
                              note={note}
                              isActive={note.id === currentNoteId}
                              onClick={() => {
                                navigateToNote(note.id);
                                setShowNotesList(false);
                              }}
                            />
                          ))}
                        </div>
                        <Separator className="my-4" />
                      </div>
                    )}

                    {/* All notes */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                        <BookOpen size={12} />
                        All Notes ({allNotes.filter(n => !n.isPinned).length})
                      </h4>
                      <div className="space-y-2">
                        {allNotes.filter(n => !n.isPinned).map(note => (
                          <NoteListItem
                            key={note.id}
                            note={note}
                            isActive={note.id === currentNoteId}
                            onClick={() => {
                              navigateToNote(note.id);
                              setShowNotesList(false);
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Empty state */}
                    {allNotes.length === 0 && (
                      <div className="text-center py-8">
                        <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500 text-sm mb-2">No notes yet</p>
                        <p className="text-gray-400 text-xs">Create your first note above</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}

          {/* Note Editor */}
          <div className="flex-1 p-4 overflow-auto">
            {isInitialLoading ? (
              // Show shimmer skeleton while initial loading
              <div className="h-full space-y-6">
                {/* Title area skeleton */}
                <div className="flex items-center justify-between">
                  <div className="animate-pulse h-8 bg-gray-200 rounded w-80"></div>
                  <div className="flex items-center gap-4">
                    <div className="animate-pulse h-4 bg-gray-200 rounded w-24"></div>
                    <div className="animate-pulse h-4 bg-gray-200 rounded w-20"></div>
                    <div className="animate-pulse h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>

                {/* Content skeleton */}
                <div className="space-y-4">
                  <div className="animate-pulse h-4 bg-gray-200 rounded w-full"></div>
                  <div className="animate-pulse h-4 bg-gray-200 rounded w-5/6"></div>
                  <div className="animate-pulse h-4 bg-gray-200 rounded w-4/5"></div>
                  
                  <div className="space-y-3 mt-6">
                    <div className="animate-pulse h-6 bg-gray-200 rounded w-48"></div>
                    <div className="space-y-2">
                      <div className="animate-pulse h-3 bg-gray-200 rounded w-full"></div>
                      <div className="animate-pulse h-3 bg-gray-200 rounded w-3/4"></div>
                      <div className="animate-pulse h-3 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </div>

                  <div className="space-y-3 mt-6">
                    <div className="animate-pulse h-32 bg-gray-200 rounded-lg w-full"></div>
                  </div>

                  <div className="space-y-2 mt-6">
                    <div className="animate-pulse h-4 bg-gray-200 rounded w-full"></div>
                    <div className="animate-pulse h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ) : isCreating ? (
              // Show creation skeleton when creating a note
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <div className="text-lg mb-2">Creating note...</div>
                  <div className="text-sm text-muted-foreground">Please wait while we set up your new note</div>
                </div>
              </div>
            ) : notesError ? (
              // Show error state if notes failed to load
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center p-8">
                  <div className="text-xl font-medium mb-2 text-destructive">
                    Failed to load notes
                  </div>
                  <div className="text-sm text-muted-foreground mb-4">
                    {notesError.message || 'An error occurred while loading your notes'}
                  </div>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : currentNote ? (
              <div className="h-full overflow-auto">
                {/* Title area */}
                <div className="mb-4 flex-shrink-0">
                  {editingName ? (
                    <input
                      className="text-2xl font-bold text-gray-900 px-2 py-1 border-b border-gray-300 focus:outline-none w-full"
                      value={currentNote.name}
                      autoFocus
                      onChange={(e) => handleNameChange(e.target.value)}
                      onBlur={() => setEditingName(false)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setEditingName(false);
                        }
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-between">
                      <h1
                        className="text-2xl font-bold text-gray-900 cursor-text flex-1"
                        onDoubleClick={() => setEditingName(true)}
                      >
                        {currentNote.name}
                      </h1>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(currentNote.modifiedAt).toLocaleDateString()}
                        </div>
                        <div>{currentNote.wordCount} words</div>
                        {currentNote.tags.length > 0 && (
                          <div className="flex items-center gap-1">
                            {currentNote.tags.slice(0, 3).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                            {currentNote.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{currentNote.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-h-0 overflow-auto">
                  <EnhancedEditorJS
                    key={currentNote.id}
                    data={currentNote.content}
                    onChange={handleNoteChange}
                    placeholder="Start writing your note..."
                    alignLeft
                    noBorder
                    fullHeight={false}
                    mode="full"
                    onImageError={msg => toast.error(msg)}
                    onNavigateToNote={navigateToNote}
                    onSaveCurrentNote={autoSave.saveManually}
                    onWikiLinkCreated={autoSave.saveContentNow}

                  />
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
                  <div className="text-lg mb-2">No note selected</div>
                  <div className="text-sm mb-4">Create a new note or select an existing one to get started</div>
                  <Button onClick={() => setShowNotesList(true)}>
                    <FileText size={16} className="mr-2" />
                    Browse Notes
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </ResizablePanel>

      {/* Side Panels */}
      {(showBacklinks || showTags || showGraphView) && (
        <>
          <ResizableHandle />
          <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
            <div className="h-full border-l border-gray-200">
              <div className="h-full flex flex-col">
                {showGraphView && (
                  <div className="flex-1 border-b border-gray-200">
                    {notesLoading ? (
                      <PanelSkeleton title="Graph View" />
                    ) : (
                      <GraphPanel />
                    )}
                  </div>
                )}

                {showBacklinks && currentNoteId && (
                  <div className="flex-1 border-b border-gray-200">
                    {notesLoading ? (
                      <PanelSkeleton title="Backlinks" />
                    ) : (
                      <BacklinksPanel noteId={currentNoteId} />
                    )}
                  </div>
                )}

                {showTags && (
                  <div className="flex-1">
                    {notesLoading ? (
                      <PanelSkeleton title="Tags" />
                    ) : (
                      <TagsPanel />
                    )}
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );

  if (embedded) {
    return mainContent;
  }

  // Standalone mode
  return (
    <div className={`h-screen bg-white flex flex-col overflow-auto w-full`}>
      <Header />
      <div className="flex-1 flex overflow-auto">
        <Sidebar />
        <main className="flex-1" style={{ paddingRight: sidebarOpen ? undefined : 0 }}>
          {mainContent}
        </main>
      </div>
      <AiDrawer />

      {/* Template Modal */}
      <TemplateModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onSelectTemplate={handleTemplateSelect}
      />
    </div>
  );
}

// Helper component for note list items
interface NoteListItemProps {
  note: any;
  isActive?: boolean;
  onClick: () => void;
}

function NoteListItem({ note, isActive, onClick }: NoteListItemProps) {
  const previewText = note.content?.blocks?.[0]?.data?.text
    ? note.content.blocks[0].data.text.replace(/<[^>]*>/g, '').substring(0, 100)
    : 'No content';

  return (
    <div
      className={`group cursor-pointer p-4 rounded-xl border transition-all duration-200 ${isActive
        ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md'
        : 'border-gray-200 hover:border-blue-200 hover:shadow-lg hover:bg-gradient-to-br hover:from-white hover:to-blue-25'
        }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {note.isPinned && (
              <Pin size={14} className="text-amber-500 fill-amber-100" />
            )}
            <h4 className={`font-semibold text-base truncate transition-colors ${isActive ? 'text-blue-800' : 'text-gray-900 group-hover:text-blue-700'
              }`}>
              {note.name}
            </h4>
          </div>

          <p className={`text-sm text-gray-600 line-clamp-2 mb-2 ${isActive ? 'text-blue-600' : 'group-hover:text-gray-700'
            }`}>
            {previewText}
          </p>

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              <span>{new Date(note.modifiedAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText size={12} />
              <span>{note.wordCount} words</span>
            </div>
          </div>
        </div>
      </div>

      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {note.tags.slice(0, 3).map((tag: string) => (
            <Badge
              key={tag}
              variant="secondary"
              className={`text-xs px-2 py-0.5 rounded-full transition-colors ${isActive
                ? 'bg-blue-100 text-blue-700 border-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700'
                }`}
            >
              #{tag}
            </Badge>
          ))}
          {note.tags.length > 3 && (
            <Badge
              variant="outline"
              className="text-xs px-2 py-0.5 rounded-full border-gray-300 text-gray-500"
            >
              +{note.tags.length - 3}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}