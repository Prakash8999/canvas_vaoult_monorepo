import { create } from 'zustand';

interface CanvasDocument {
  id: string;
  name: string;
  canvasData: any;
  documentData: any;
  // last known viewport/viewport-like state for Excalidraw
  viewport?: {
    scrollX?: number;
    scrollY?: number;
    zoom?: number;
  } | null;
  pinned?: boolean;
  createdAt: number;
  modifiedAt: number;
}

interface CanvasDocumentState {
  // Legacy single canvas support (for backward compatibility)
  canvasData: any;
  setCanvasData: (data: any) => void;
  documentData: any;
  setDocumentData: (data: any) => void;
  docName: string;
  setDocName: (name: string) => void;

  // New multi-canvas support
  canvases: Record<string, CanvasDocument>;
  currentCanvasId: string | null;
  createCanvas: (name?: string, canvasData?: any, documentData?: any) => string;
  updateCanvas: (id: string, updates: Partial<CanvasDocument>) => void;
  deleteCanvas: (id: string) => void;
  setCurrentCanvas: (id: string) => void;
  getCurrentCanvas: () => CanvasDocument | null;
}

// Generate unique ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const useCanvasDocumentStore = create<CanvasDocumentState>()(
  (set, get) => ({
    // Legacy single canvas support (backward compatibility)
    canvasData: null,
    setCanvasData: (data) => {
      set({ canvasData: data });
    },
    documentData: null,
    setDocumentData: (data) => {
      set({ documentData: data });
    },
    docName: 'Untitled Document',
    setDocName: (name) => {
      set({ docName: name });
    },

    // New multi-canvas support
    canvases: {},
    currentCanvasId: null,

    createCanvas: (name?: string, canvasData?: any, documentData?: any) => {
      const id = generateId();
      const now = Date.now();
      const canvas: CanvasDocument = {
        id,
        name: name || `Canvas ${new Date().toLocaleTimeString()}`,
        // Ensure new canvases start with an empty elements array to avoid
        // inheriting previous canvas state stored in legacy `canvasData`.
        canvasData: canvasData ?? [],
        // Document data can be null or provided; keep as-is when omitted
        documentData: documentData ?? null,
        // start with no viewport so new canvases land at origin
        viewport: null,
        // new canvases are not pinned by default
        pinned: false,
        createdAt: now,
        modifiedAt: now,
      };

      set(state => ({
        canvases: { ...state.canvases, [id]: canvas },
        currentCanvasId: id
      }));

      return id;
    },

    updateCanvas: (id: string, updates: Partial<CanvasDocument>) => {
      set(state => {
        const canvas = state.canvases[id];
        if (!canvas) return state;

        const updatedCanvas = {
          ...canvas,
          ...updates,
          modifiedAt: Date.now()
        };

        return {
          canvases: { ...state.canvases, [id]: updatedCanvas }
        };
      });
    },

    deleteCanvas: (id: string) => {
      set(state => {
        const { [id]: deleted, ...remaining } = state.canvases;
        return {
          canvases: remaining,
          currentCanvasId: state.currentCanvasId === id ? null : state.currentCanvasId
        };
      });
    },

    setCurrentCanvas: (id: string) => {
      set({ currentCanvasId: id });
    },

    getCurrentCanvas: () => {
      const { canvases, currentCanvasId } = get();
      return currentCanvasId ? canvases[currentCanvasId] || null : null;
    },
  })
);
