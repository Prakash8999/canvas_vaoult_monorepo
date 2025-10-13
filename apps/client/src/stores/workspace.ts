import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { createJSONStorage } from 'zustand/middleware';

export interface Note {
  id: string;
  title: string;
  content: any; // Editor.js data
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  type: 'note' | 'document' | 'canvas';
  canvasData?: any; // Excalidraw data
}

export interface Workspace {
  id: string;
  name: string;
  notes: Note[];
  recentNotes: string[];
  pinnedNotes: string[];
}

interface WorkspaceState {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  sidebarOpen: boolean;
  aiDrawerOpen: boolean;
  quickCaptureOpen: boolean;
  commandPaletteOpen: boolean;
  currentNote: Note | null;
  searchQuery: string;
  activeContentType: 'all' | 'notes' | 'documents' | 'canvas';
  
  // Actions
  createWorkspace: (name: string) => void;
  setCurrentWorkspace: (workspace: Workspace) => void;
  createNote: (title: string, type?: 'note' | 'document' | 'canvas') => Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  toggleSidebar: () => void;
  toggleAiDrawer: () => void;
  toggleQuickCapture: () => void;
  toggleCommandPalette: () => void;
  setCurrentNote: (note: Note | null) => void;
  setSearchQuery: (query: string) => void;
  setActiveContentType: (type: 'all' | 'notes' | 'documents' | 'canvas') => void;
  addToRecent: (noteId: string) => void;
  togglePin: (noteId: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  devtools(
    persist(
      (set, get) => ({
        currentWorkspace: null,
        workspaces: [],
        sidebarOpen: true,
        aiDrawerOpen: false,
        quickCaptureOpen: false,
        commandPaletteOpen: false,
        currentNote: null,
        searchQuery: '',
        activeContentType: 'all',

        createWorkspace: (name: string) => {
          const newWorkspace: Workspace = {
            id: crypto.randomUUID(),
            name,
            notes: [],
            recentNotes: [],
            pinnedNotes: [],
          };
          
          set((state) => ({
            workspaces: [...state.workspaces, newWorkspace],
            currentWorkspace: newWorkspace,
          }));
        },

        setCurrentWorkspace: (workspace: Workspace) => {
          set({ currentWorkspace: workspace });
        },

        createNote: (title: string, type: 'note' | 'document' | 'canvas' = 'note') => {
          const note: Note = {
            id: crypto.randomUUID(),
            title,
            content: type === 'canvas' ? null : { blocks: [], version: '2.28.2' },
            canvasData: type === 'canvas' ? { elements: [], appState: {} } : undefined,
            tags: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            type,
          };

          set((state) => {
            if (!state.currentWorkspace) return state;
            
            const updatedWorkspace = {
              ...state.currentWorkspace,
              notes: [...state.currentWorkspace.notes, note],
              recentNotes: [note.id, ...state.currentWorkspace.recentNotes.slice(0, 9)],
            };

            return {
              currentWorkspace: updatedWorkspace,
              workspaces: state.workspaces.map(w => 
                w.id === updatedWorkspace.id ? updatedWorkspace : w
              ),
              currentNote: note,
            };
          });

          return note;
        },

        updateNote: (id: string, updates: Partial<Note>) => {
          set((state) => {
            if (!state.currentWorkspace) return state;
            
            const updatedWorkspace = {
              ...state.currentWorkspace,
              notes: state.currentWorkspace.notes.map(note =>
                note.id === id ? { ...note, ...updates, updatedAt: new Date() } : note
              ),
            };

            return {
              currentWorkspace: updatedWorkspace,
              workspaces: state.workspaces.map(w => 
                w.id === updatedWorkspace.id ? updatedWorkspace : w
              ),
              currentNote: state.currentNote?.id === id 
                ? { ...state.currentNote, ...updates, updatedAt: new Date() }
                : state.currentNote,
            };
          });
        },

        deleteNote: (id: string) => {
          set((state) => {
            if (!state.currentWorkspace) return state;
            
            const updatedWorkspace = {
              ...state.currentWorkspace,
              notes: state.currentWorkspace.notes.filter(note => note.id !== id),
              recentNotes: state.currentWorkspace.recentNotes.filter(noteId => noteId !== id),
              pinnedNotes: state.currentWorkspace.pinnedNotes.filter(noteId => noteId !== id),
            };

            return {
              currentWorkspace: updatedWorkspace,
              workspaces: state.workspaces.map(w => 
                w.id === updatedWorkspace.id ? updatedWorkspace : w
              ),
              currentNote: state.currentNote?.id === id ? null : state.currentNote,
            };
          });
        },

        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        toggleAiDrawer: () => set((state) => ({ aiDrawerOpen: !state.aiDrawerOpen })),
        toggleQuickCapture: () => set((state) => ({ quickCaptureOpen: !state.quickCaptureOpen })),
        toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
        setCurrentNote: (note: Note | null) => set({ currentNote: note }),
        setSearchQuery: (query: string) => set({ searchQuery: query }),
        setActiveContentType: (type: 'all' | 'notes' | 'documents' | 'canvas') => set({ activeContentType: type }),

        addToRecent: (noteId: string) => {
          set((state) => {
            if (!state.currentWorkspace) return state;
            
            const recentNotes = [
              noteId,
              ...state.currentWorkspace.recentNotes.filter(id => id !== noteId)
            ].slice(0, 10);

            const updatedWorkspace = {
              ...state.currentWorkspace,
              recentNotes,
            };

            return {
              currentWorkspace: updatedWorkspace,
              workspaces: state.workspaces.map(w => 
                w.id === updatedWorkspace.id ? updatedWorkspace : w
              ),
            };
          });
        },

        togglePin: (noteId: string) => {
          set((state) => {
            if (!state.currentWorkspace) return state;
            
            const isPinned = state.currentWorkspace.pinnedNotes.includes(noteId);
            const pinnedNotes = isPinned
              ? state.currentWorkspace.pinnedNotes.filter(id => id !== noteId)
              : [...state.currentWorkspace.pinnedNotes, noteId];

            const updatedWorkspace = {
              ...state.currentWorkspace,
              pinnedNotes,
            };

            return {
              currentWorkspace: updatedWorkspace,
              workspaces: state.workspaces.map(w => 
                w.id === updatedWorkspace.id ? updatedWorkspace : w
              ),
            };
          });
        },
      }),
      {
        name: 'canvas-vault-workspace',
        partialize: (state) => ({
          workspaces: state.workspaces,
          currentWorkspace: state.currentWorkspace,
        }),
        storage: createJSONStorage(() => {
          let memory: Record<string, string> = {};
          return {
            getItem: (key) => memory[key] ?? null,
            setItem: (key, value) => { memory[key] = value; },
            removeItem: (key) => { delete memory[key]; },
          };
        }),
      }
    )
  )
);