import { create } from 'zustand';
import { OutputData } from '@editorjs/editorjs';
import Fuse from 'fuse.js';
import { notesApi, convertApiNoteToLocal, convertLocalNoteToApi } from '../lib/api/notesApi';
// import { putNote, deleteNote as deleteNoteFromDexie, getAllNotes, setMeta, getMeta } from '../lib/dexieClient';
// import { DEXIE_PERSISTENCE_ENABLED } from '../utils/migration/localStorageToDexie';
// import { addNoteCreateEvent, addNoteUpdateEvent, addNoteDeleteEvent } from '../lib/outbox';

export interface Note {
  id: string;
  title: string;
  note_uid: string;
  content: OutputData;
  tags: string[];
  createdAt: number;
  parent_wikilinks?: [];
  child_wikilinks?: [];
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

  // UI F
  mode: 'full' | 'light';
  showBacklinks: boolean;
  showTags: boolean;
  showGraphView: boolean;
  searchQuery: string;

  // Search and filtering
  searchResults: Note[];
  tagFilter: string | null;

  // Actions
  setCurrentNote: (note_uid: string | null) => void;
  setNotesFromRecords: (notes: Record<string, Note>) => void; // For hydration

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
  frontLinks: (noteId: string) => Note[];
  getBacklinksWithDOM: (noteId: string) => Note[];
  getAllTags: () => string[];
  getCurrentNoteId: () => string | null;
  getLinkedNotes: (noteId: string) => Note[];
  extractLinks: (content: OutputData) => string[];
  extractTags: (content: OutputData) => string[];

  getPinnedNotes: () => Note[];
}

const CURRENT_NOTE_KEY = 'vcw:currentNoteId';

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
const extractLinksFromContent = (content: OutputData): Array<{ id: string | null, title: string }> => {
  if (!content.blocks) return [];

  const links: Array<{ id: string | null, title: string }> = [];
  const linkRegex = /\[\[([^\]]+)\]\]/g;
  const wikiLinkRegex = /<wiki-link[^>]*data-note-title="([^"]*)"[^>]*>/g;

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
          links.push({ id: null, title: linkName });
        }
      }

      // Check for HTML wiki-link elements
      wikiLinkRegex.lastIndex = 0;
      let htmlMatch;
      while ((htmlMatch = wikiLinkRegex.exec(textToCheck)) !== null) {
        const linkName = htmlMatch[1].trim();
        if (linkName) {
          links.push({ id: null, title: linkName });
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
              links.push({ id: null, title: linkName });
            }
          }

          // Check for HTML wiki-link elements
          wikiLinkRegex.lastIndex = 0;
          let htmlMatch;
          while ((htmlMatch = wikiLinkRegex.exec(itemText)) !== null) {
            const linkName = htmlMatch[1].trim();
            if (linkName) {
              links.push({ id: null, title: linkName });
            }
          }
        }
      });
    }
  });

  // Remove duplicates by title
  const uniqueLinks = links.filter((link, index, self) =>
    index === self.findIndex(l => l.title === link.title)
  );

  return uniqueLinks;
};

// Legacy function for backward compatibility
const extractLinksFromContentLegacy = (content: OutputData): string[] => {
  if (!content.blocks) return [];

  const links: string[] = [];
  const linkRegex = /\[\[([^\]]+)\]\]/g;
  const wikiLinkRegex = /<wiki-link[^>]*data-note-title="([^"]*)"[^>]*>/g;

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

const loadCurrentNoteId = (): string | null => {
  try {
    return localStorage.getItem(CURRENT_NOTE_KEY);
  } catch (e) {
    console.warn('Failed to load current note ID:', e);
    return null;
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
  const initialCurrentNoteId = loadCurrentNoteId();

  return {
    // Initial state
    notes: {},
    currentNoteId: initialCurrentNoteId,
    mode: 'full',
    showBacklinks: false,
    showTags: false,
    showGraphView: false,
    searchQuery: '',
    searchResults: [],
    tagFilter: null,

    setNotesFromRecords: (notes: Record<string, Note>) => {
      set({ notes });
      // Don't save to localStorage here, as this is for hydration from Dexie
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
        keys: ['title', 'content.blocks.data.text'],
        threshold: 0.4,
        includeScore: true,
      });

      const results = fuse.search(query);
      return results.map(result => result.item);
    },
    

    getBacklinks: (noteId: string) => {
      const { notes } = get();
      const note = notes[noteId];
      if (!note) return [];

      const backendLinks = note.parent_wikilinks || [];

      const unique = new Map();

      backendLinks.forEach((link: any) => {
        const parent = link.parent_note;   // ← USE THIS
        if (parent && !unique.has(parent.id)) {
          unique.set(parent.id, parent);
        }
      });

      return Array.from(unique.values());
    },

    frontLinks: (noteId: string) => {
      const { notes } = get();
      const note = notes[noteId];
      if (!note) return [];

      const frontLinks = note.child_wikilinks || [];

      const unique = new Map();

      frontLinks.forEach((link: any) => {
        const child = link.child_note;      // ← USE THIS
        if (child && !unique.has(child.id)) {
          unique.set(child.id, child);
        }
      });

      return Array.from(unique.values());
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
          const hasContentLink = extractLinksFromContentLegacy(note.content).includes(targetNote.title);

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

    getCurrentNoteId: () => {
      return get().currentNoteId;
    },

    getLinkedNotes: (noteId: string) => {
      const { notes } = get();
      const note = notes[noteId];
      if (!note) return [];

      const linkedNoteNames = extractLinksFromContentLegacy(note.content);
      const linkedNotes: Note[] = [];

      Object.values(notes).forEach(n => {
        if (linkedNoteNames.includes(n.title)) {
          linkedNotes.push(n);
        }
      });

      return linkedNotes;
    },

    extractLinks: extractLinksFromContentLegacy,
    extractTags: extractTagsFromContent,

    getPinnedNotes: () => {
      const { notes } = get();
      return Object.values(notes)
        .filter(note => note.isPinned)
        .sort((a, b) => b.modifiedAt - a.modifiedAt);
    },
  };
});