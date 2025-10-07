import { create } from 'zustand';
import { OutputData } from '@editorjs/editorjs';
import Fuse from 'fuse.js';

export interface Note {
  id: string;
  name: string;
  content: OutputData;
  tags: string[];
  createdAt: number;
  modifiedAt: number;
  isPinned: boolean;
  wordCount: number;
}

export interface Link {
  from: string; // note id
  to: string;   // note id
  type: 'internal' | 'tag';
}

interface EnhancedNoteState {
  // Notes management
  notes: Record<string, Note>;
  currentNoteId: string | null;
  
  // UI state
  mode: 'full' | 'light';
  showBacklinks: boolean;
  showTags: boolean;
  showGraphView: boolean;
  searchQuery: string;
  
  // Search and filtering
  searchResults: Note[];
  tagFilter: string | null;
  
  // Actions
  createNote: (name: string, initialContent?: OutputData) => string;
  deleteNote: (id: string) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  setCurrentNote: (id: string | null) => void;
  
  // UI actions
  setMode: (mode: 'full' | 'light') => void;
  toggleBacklinks: () => void;
  toggleTags: () => void;
  toggleGraphView: () => void;
  setSearchQuery: (query: string) => void;
  setTagFilter: (tag: string | null) => void;
  
  // Advanced features
  searchNotes: (query: string) => Note[];
  getBacklinks: (noteId: string) => Note[];
  getBacklinksWithDOM: (noteId: string) => Note[];
  getAllTags: () => string[];
  getLinkedNotes: (noteId: string) => Note[];
  extractLinks: (content: OutputData) => string[];
  extractTags: (content: OutputData) => string[];
  
  // Pin/unpin
  togglePin: (id: string) => void;
  getPinnedNotes: () => Note[];
}

const STORAGE_KEY = 'vcw:enhancedNotes';
const CURRENT_NOTE_KEY = 'vcw:currentNoteId';

// Helper functions
const generateId = () => Math.random().toString(36).substr(2, 9);

const calculateWordCount = (content: OutputData): number => {
  if (!content.blocks) return 0;
  
  return content.blocks.reduce((count, block) => {
    if (block.data?.text) {
      const text = typeof block.data.text === 'string' ? block.data.text : '';
      const words = text.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(word => word.length > 0);
      return count + words.length;
    }
    return count;
  }, 0);
};

// Extract WikiLink IDs and names from content
const extractLinksFromContent = (content: OutputData): Array<{id: string | null, name: string}> => {
  if (!content.blocks) return [];
  
  const links: Array<{id: string | null, name: string}> = [];
  const linkRegex = /\[\[([^\]]+)\]\]/g;
  const wikiLinkRegex = /<wiki-link[^>]*data-note-name="([^"]*)"[^>]*>/g;
  
  content.blocks.forEach(block => {
    let textToCheck = '';
    
    // Handle different block types
    if (block.data?.text) {
      textToCheck = typeof block.data.text === 'string' ? block.data.text : '';
    }
    
    // Check for links in the main text
    if (textToCheck) {
      // Check for plain [[]] syntax
      linkRegex.lastIndex = 0;
      let match;
      while ((match = linkRegex.exec(textToCheck)) !== null) {
        const linkName = match[1].trim();
        if (linkName) {
          links.push({ id: null, name: linkName });
        }
      }
      
      // Check for HTML wiki-link elements
      wikiLinkRegex.lastIndex = 0;
      let htmlMatch;
      while ((htmlMatch = wikiLinkRegex.exec(textToCheck)) !== null) {
        const linkName = htmlMatch[1].trim();
        if (linkName) {
          links.push({ id: null, name: linkName });
        }
      }
    }
    
    // Also check for links in list items
    if (block.type === 'list' && block.data?.items && Array.isArray(block.data.items)) {
      block.data.items.forEach((item: any) => {
        const itemText = typeof item === 'string' ? item : '';
        if (itemText) {
          // Check for plain [[]] syntax
          linkRegex.lastIndex = 0;
          let match;
          while ((match = linkRegex.exec(itemText)) !== null) {
            const linkName = match[1].trim();
            if (linkName) {
              links.push({ id: null, name: linkName });
            }
          }
          
          // Check for HTML wiki-link elements
          wikiLinkRegex.lastIndex = 0;
          let htmlMatch;
          while ((htmlMatch = wikiLinkRegex.exec(itemText)) !== null) {
            const linkName = htmlMatch[1].trim();
            if (linkName) {
              links.push({ id: null, name: linkName });
            }
          }
        }
      });
    }
  });
  
  // Remove duplicates by name
  const uniqueLinks = links.filter((link, index, self) => 
    index === self.findIndex(l => l.name === link.name)
  );
  
  return uniqueLinks;
};

// Legacy function for backward compatibility
const extractLinksFromContentLegacy = (content: OutputData): string[] => {
  if (!content.blocks) return [];
  
  const links: string[] = [];
  const linkRegex = /\[\[([^\]]+)\]\]/g;
  const wikiLinkRegex = /<wiki-link[^>]*data-note-name="([^"]*)"[^>]*>/g;
  
  content.blocks.forEach(block => {
    let textToCheck = '';
    
    if (block.data?.text) {
      textToCheck = typeof block.data.text === 'string' ? block.data.text : '';
    }
    
    if (textToCheck) {
      // Check for plain [[]] syntax
      linkRegex.lastIndex = 0;
      let match;
      while ((match = linkRegex.exec(textToCheck)) !== null) {
        const linkName = match[1].trim();
        if (linkName) {
          links.push(linkName);
        }
      }
      
      // Check for HTML wiki-link elements
      wikiLinkRegex.lastIndex = 0;
      let htmlMatch;
      while ((htmlMatch = wikiLinkRegex.exec(textToCheck)) !== null) {
        const linkName = htmlMatch[1].trim();
        if (linkName) {
          links.push(linkName);
        }
      }
    }
    
    // Also check list items
    if (block.type === 'list' && block.data?.items && Array.isArray(block.data.items)) {
      block.data.items.forEach((item: any) => {
        const itemText = typeof item === 'string' ? item : '';
        if (itemText) {
          // Check for plain [[]] syntax
          linkRegex.lastIndex = 0;
          let match;
          while ((match = linkRegex.exec(itemText)) !== null) {
            const linkName = match[1].trim();
            if (linkName) {
              links.push(linkName);
            }
          }
          
          // Check for HTML wiki-link elements
          wikiLinkRegex.lastIndex = 0;
          let htmlMatch;
          while ((htmlMatch = wikiLinkRegex.exec(itemText)) !== null) {
            const linkName = htmlMatch[1].trim();
            if (linkName) {
              links.push(linkName);
            }
          }
        }
      });
    }
  });
  
  // Remove duplicates
  return [...new Set(links)];
};

const extractTagsFromContent = (content: OutputData): string[] => {
  if (!content.blocks) return [];
  
  const tags: string[] = [];
  const tagRegex = /#([a-zA-Z0-9_]+)/g;
  
  content.blocks.forEach(block => {
    let textToCheck = '';
    
    // Handle different block types
    if (block.data?.text) {
      textToCheck = typeof block.data.text === 'string' ? block.data.text : '';
    }
    
    // Check for tags in the main text
    if (textToCheck) {
      tagRegex.lastIndex = 0;
      let match;
      while ((match = tagRegex.exec(textToCheck)) !== null) {
        tags.push(match[1].toLowerCase());
      }
    }
    
    // Also check for tags in list items
    if (block.type === 'list' && block.data?.items && Array.isArray(block.data.items)) {
      block.data.items.forEach((item: any) => {
        const itemText = typeof item === 'string' ? item : '';
        if (itemText) {
          tagRegex.lastIndex = 0;
          let match;
          while ((match = tagRegex.exec(itemText)) !== null) {
            tags.push(match[1].toLowerCase());
          }
        }
      });
    }
  });
  
  return [...new Set(tags)]; // Remove duplicates
};

const loadStoredNotes = (): Record<string, Note> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const notes = stored ? JSON.parse(stored) : {};
    console.log('[NoteStore] Loaded notes from localStorage:', Object.keys(notes));
    return notes;
  } catch (e) {
    console.warn('Failed to load stored notes:', e);
    return {};
  }
};

const loadCurrentNoteId = (): string | null => {
  try {
    return localStorage.getItem(CURRENT_NOTE_KEY);
  } catch (e) {
    console.warn('Failed to load current note ID:', e);
    return null;
  }
};

const saveNotes = (notes: Record<string, Note>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    console.log('[NoteStore] Saved notes to localStorage:', Object.keys(notes));
  } catch (e) {
    console.warn('Failed to save notes:', e);
  }
};

const saveCurrentNoteId = (id: string | null) => {
  try {
    if (id) {
      localStorage.setItem(CURRENT_NOTE_KEY, id);
    } else {
      localStorage.removeItem(CURRENT_NOTE_KEY);
    }
  } catch (e) {
    console.warn('Failed to save current note ID:', e);
  }
};

export const useEnhancedNoteStore = create<EnhancedNoteState>((set, get) => {
  const initialNotes = loadStoredNotes();
  const initialCurrentNoteId = loadCurrentNoteId();
  
  return {
    // Initial state
    notes: initialNotes,
    currentNoteId: initialCurrentNoteId,
    mode: 'full',
    showBacklinks: false,
    showTags: false,
    showGraphView: false,
    searchQuery: '',
    searchResults: [],
    tagFilter: null,
    
    // Note management
    createNote: (name: string, initialContent?: OutputData) => {
      const id = generateId();
      const now = Date.now();
      const content = initialContent || { blocks: [] };
      
      const note: Note = {
        id,
        name,
        content,
        tags: extractTagsFromContent(content),
        createdAt: now,
        modifiedAt: now,
        isPinned: false,
        wordCount: calculateWordCount(content),
      };
      
      console.log(`[NoteStore] Creating new note: ${name} with ID: ${id}`);
      
      set(state => {
        const newNotes = { ...state.notes, [id]: note };
        saveNotes(newNotes);
        console.log(`[NoteStore] Notes after creation:`, Object.keys(newNotes));
        return { notes: newNotes };
      });
      
      return id;
    },
    
    deleteNote: (id: string) => {
      set(state => {
        const { [id]: deleted, ...remainingNotes } = state.notes;
        saveNotes(remainingNotes);
        
        return {
          notes: remainingNotes,
          currentNoteId: state.currentNoteId === id ? null : state.currentNoteId,
        };
      });
    },
    
    updateNote: (id: string, updates: Partial<Note>) => {
      set(state => {
        const existingNote = state.notes[id];
        if (!existingNote) return state;
        
        const updatedNote = { 
          ...existingNote, 
          ...updates, 
          modifiedAt: Date.now(),
        };
        
        // Update derived fields if content changed
        if (updates.content) {
          updatedNote.tags = extractTagsFromContent(updates.content);
          updatedNote.wordCount = calculateWordCount(updates.content);
        }
        
        const newNotes = { ...state.notes, [id]: updatedNote };
        saveNotes(newNotes);
        
        return { notes: newNotes };
      });
    },
    
    setCurrentNote: (id: string | null) => {
      set({ currentNoteId: id });
      saveCurrentNoteId(id);
    },
    
    // UI actions
    setMode: (mode: 'full' | 'light') => set({ mode }),
    toggleBacklinks: () => set(state => ({ showBacklinks: !state.showBacklinks })),
    toggleTags: () => set(state => ({ showTags: !state.showTags })),
    toggleGraphView: () => set(state => ({ showGraphView: !state.showGraphView })),
    setSearchQuery: (query: string) => {
      set({ searchQuery: query });
      if (query.trim()) {
        const results = get().searchNotes(query);
        set({ searchResults: results });
      } else {
        set({ searchResults: [] });
      }
    },
    setTagFilter: (tag: string | null) => set({ tagFilter: tag }),
    
    // Advanced features
    searchNotes: (query: string) => {
      const { notes } = get();
      const noteArray = Object.values(notes);
      
      if (!query.trim()) return noteArray;
      
      const fuse = new Fuse(noteArray, {
        keys: ['name', 'content.blocks.data.text'],
        threshold: 0.4,
        includeScore: true,
      });
      
      const results = fuse.search(query);
      return results.map(result => result.item);
    },
    
    getBacklinks: (noteId: string) => {
      const { notes } = get();
      const targetNote = notes[noteId];
      if (!targetNote) return [];
      
      console.log(`[Backlinks] Getting backlinks for: ${targetNote.name} (${noteId})`);
      
      const backlinks: Note[] = [];
      
      Object.values(notes).forEach(note => {
        if (note.id === noteId) return;
        
        // Check if this note contains links to the target note
        const linksByName = extractLinksFromContentLegacy(note.content);
        console.log(`[Backlinks] Note "${note.name}" has links:`, linksByName);
        
        // Check for exact name match and also trimmed name match
        const hasLink = linksByName.some(linkName => 
          linkName === targetNote.name || 
          linkName.trim() === targetNote.name.trim()
        );
        
        console.log(`[Backlinks] Note "${note.name}" has link to "${targetNote.name}":`, hasLink);
        
        if (hasLink) {
          backlinks.push(note);
          console.log(`[Backlinks] ✅ Added backlink: ${note.name} -> ${targetNote.name}`);
        }
      });
      
      console.log(`[Backlinks] Total backlinks found for "${targetNote.name}":`, backlinks.length);
      return backlinks;
    },

    // Enhanced backlinks that also check DOM-based wiki links
    getBacklinksWithDOM: (noteId: string) => {
      const { notes, getBacklinks } = get();
      const targetNote = notes[noteId];
      if (!targetNote) return [];
      
      // Start with content-based backlinks
      const contentBacklinks = getBacklinks(noteId);
      const backlinkIds = new Set(contentBacklinks.map(note => note.id));
      
      // For each note, check if it contains links to our target note
      Object.values(notes).forEach(note => {
        if (note.id !== noteId && !backlinkIds.has(note.id)) {
          // Check if this note's content contains links to our target
          const hasContentLink = extractLinksFromContentLegacy(note.content).includes(targetNote.name);
          
          if (hasContentLink) {
            contentBacklinks.push(note);
            backlinkIds.add(note.id);
          }
        }
      });
      
      return contentBacklinks;
    },
    
    getAllTags: () => {
      const { notes } = get();
      const allTags = new Set<string>();
      
      Object.values(notes).forEach(note => {
        note.tags.forEach(tag => allTags.add(tag));
      });
      
      return Array.from(allTags).sort();
    },
    
    getLinkedNotes: (noteId: string) => {
      const { notes } = get();
      const note = notes[noteId];
      if (!note) return [];
      
      const linkedNoteNames = extractLinksFromContentLegacy(note.content);
      const linkedNotes: Note[] = [];
      
      Object.values(notes).forEach(n => {
        if (linkedNoteNames.includes(n.name)) {
          linkedNotes.push(n);
        }
      });
      
      return linkedNotes;
    },
    
    extractLinks: extractLinksFromContentLegacy,
    extractTags: extractTagsFromContent,
    
    // Pin/unpin
    togglePin: (id: string) => {
      const { updateNote, notes } = get();
      const note = notes[id];
      if (note) {
        updateNote(id, { isPinned: !note.isPinned });
      }
    },
    
    getPinnedNotes: () => {
      const { notes } = get();
      return Object.values(notes)
        .filter(note => note.isPinned)
        .sort((a, b) => b.modifiedAt - a.modifiedAt);
    },
  };
});