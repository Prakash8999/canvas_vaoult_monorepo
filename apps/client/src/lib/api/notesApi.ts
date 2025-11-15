import axios from 'axios';
import { OutputData } from '@editorjs/editorjs';

const API_BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';

// Types matching the server response format
export interface ApiNote {
  id: number;
  note_uid: string;
  user_id: number;
  title: string;
  content: any; // Can be null or EditorJS content
  tags: any; // Can be null or array
  version: number;
  attachment_ids: any;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateNoteRequest {
  title: string;
  content: OutputData;
  tags?: string[];
  pinned?: boolean;
  is_wiki_link?: boolean;
  parent_note_id?: number | null;
}

export interface UpdateNoteRequest {
  title?: string;
  content?: OutputData;
  tags?: string[];
  pinned?: number;
}

export interface NotesListResponse {
  notes: ApiNote[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
    pageNum: number;
  };
}

// API client with authentication
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

console.log('API_BASE_URL:', API_BASE_URL);

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
});

// Add auth interceptor
api.interceptors.request.use((config) => {
  const headers = getAuthHeaders();
  Object.assign(config.headers, headers);
  return config;
});

// Auto-save tracking
interface AutoSaveState {
  [noteId: string]: {
    lastSaved: Date;
    isDirty: boolean;
    pendingSave?: Promise<any>;
  };
}

let autoSaveState: AutoSaveState = {};

// Notes API functions
export const notesApi = {
  // Get all notes with pagination
  getAllNotes: async (limit = 100, offset = 0): Promise<NotesListResponse> => {
    const response = await api.get(`/note/notes?limit=${limit}&offset=${offset}`);
    // Handle both response formats: array directly or wrapped in object
    const notesData = response.data.data;
    if (Array.isArray(notesData)) {
      // Legacy format: data is array of notes
      console.log('Legacy notes format detected' , notesData);
      return {
        notes: notesData,
        pagination: {
          total: notesData.length,
          limit,
          offset,
          hasMore: false,
          pageNum: Math.floor(offset / limit) + 1
        }
      };
    } else if (notesData && notesData.notes) {
      // New format: data has notes and pagination
      return notesData;
    } else {
      return {
        notes: [],
        pagination: {
          pageNum: 1,
          total: 0,
          limit,
          offset,
          hasMore: false
        }
      };
    }
  },

  // Get a specific note by ID
  getNote: async (uid: string): Promise<ApiNote> => {
    const response = await api.get(`/note/${uid}`);
    return response.data.data;
  },

  // Check if a note exists by note_uid (returns boolean)
  checkNoteExists: async (noteUid: string): Promise<boolean> => {
    try {
      await api.get(`/note/${noteUid}`);
      return true;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return false;
      }
      throw error; // Re-throw other errors
    }
  },

  // Create a new note
  createNote: async (noteData: CreateNoteRequest): Promise<ApiNote> => {
    const response = await api.post('/note', noteData);
    return response.data.data;
  },

  // Update an existing note
  updateNote: async (id: number, noteData: UpdateNoteRequest): Promise<ApiNote> => {
    const response = await api.patch(`/note/${id}`, noteData);
    return response.data.data;
  },

  // Delete a note
  deleteNote: async (id: number): Promise<{ deletedId: number }> => {
    const response = await api.delete(`/note/${id}`);
    return response.data.data;
  },

  // Auto-save utilities
  markNoteDirty: (noteId: string) => {
    if (!autoSaveState[noteId]) {
      autoSaveState[noteId] = {
        lastSaved: new Date(),
        isDirty: false
      };
    }
    autoSaveState[noteId].isDirty = true;
  },

  markNoteClean: (noteId: string) => {
    if (autoSaveState[noteId]) {
      autoSaveState[noteId].isDirty = false;
      autoSaveState[noteId].lastSaved = new Date();
    }
  },

  isNoteDirty: (noteId: string): boolean => {
    return autoSaveState[noteId]?.isDirty || false;
  },

  getLastSaved: (noteId: string): Date | null => {
    return autoSaveState[noteId]?.lastSaved || null;
  },

  cleanupNoteState: (noteId: string) => {
    delete autoSaveState[noteId];
  }
};

// Helper function to convert API note to local note format
export const convertApiNoteToLocal = (apiNote: any) => {
  if (!apiNote || typeof apiNote !== 'object') {
    console.error('Invalid apiNote received:', apiNote);
    throw new Error('Invalid API note data');
  }

  return {
    id: String(apiNote.id || ''),
    name: apiNote.title || '',
    content: apiNote.content || { blocks: [] },
    tags: Array.isArray(apiNote.tags) ? apiNote.tags : [],
    createdAt: apiNote.created_at ? new Date(apiNote.created_at).getTime() : Date.now(),
    modifiedAt: apiNote.updated_at ? new Date(apiNote.updated_at).getTime() : Date.now(),
    isPinned: Boolean(apiNote.pinned),
    version: apiNote.version ,
    note_uid: apiNote.note_uid,
    wordCount: calculateWordCount(apiNote.content || { blocks: [] }),
  };
};

// Helper function to convert local note to API format
export const convertLocalNoteToApi = (localNote: any): CreateNoteRequest | UpdateNoteRequest => {
  const result: any = {
    title: localNote.name,
    content: localNote.content,
    tags: localNote.tags || [],
    pinned: localNote.isPinned || false,
  };
  
  // Add WikiLink-specific fields if present
  if (localNote.is_wiki_link !== undefined) {
    result.is_wiki_link = localNote.is_wiki_link;
  }
  if (localNote.parent_note_id !== undefined) {
    result.parent_note_id = localNote.parent_note_id;
  }
  
  return result;
};

// Calculate word count from EditorJS content
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