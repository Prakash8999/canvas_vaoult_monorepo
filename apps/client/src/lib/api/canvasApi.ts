import { OutputData } from '@editorjs/editorjs';
// Import the specific Excalidraw type
import { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import httpClient from './httpClient';

// ============================================================================
// TypeScript Types & Interfaces
// ============================================================================

export interface Canvas {
    id: number;
    canvas_uid: string;
    user_id: number;
    title: string;

    // STRICT TYPE: Excalidraw Elements Array
    canvas_data?: ExcalidrawElement[];

    // STRICT TYPE: EditorJS Output Data
    document_data?: OutputData;

    viewport?: {
        scrollX?: number;
        scrollY?: number;
        zoom?: number;
    } | null;
    pinned: boolean;
    created_at: string;
    updated_at: string;
    note_id?: number | null;
    note?: {
        id: number;
        title: string;
        note_uid: string;
        created_at: string;
        updated_at: string;
    } | null;
}

export interface CanvasListItem {
    id: number;
    canvas_uid: string;
    title: string;
    pinned: boolean;
    created_at: string;
    updated_at: string;
    note_id?: number | null;
}
// Update DTOs to match strict types
export interface CreateCanvasDto {
    title: string;
    note_id?: number | null;
    canvas_data?: ExcalidrawElement[];
    document_data?: OutputData;
    viewport?: {
        scrollX?: number;
        scrollY?: number;
        zoom?: number;
    } | null;
    pinned?: boolean;
}

export interface UpdateCanvasDto {
    title?: string;
    note_id?: number | null;
    canvas_data?: ExcalidrawElement[];
    document_data?: OutputData;
    viewport?: {
        scrollX?: number;
        scrollY?: number;
        zoom?: number;
    } | null;
    pinned?: boolean;
}
export interface CanvasFilters {
    page?: number;
    limit?: number;
    search?: string;
    pinned?: boolean;
    id?: number;
    canvas_uid?: string;
    note_id?: number;
}

export interface CanvasListResponse {
    canvases: Canvas[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasMore: boolean;
    };
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch list of canvases with optional filters
 */
export const fetchCanvasList = async (
    filters?: CanvasFilters
): Promise<CanvasListResponse> => {
    const params = new URLSearchParams();

    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.pinned !== undefined) params.append('pinned', filters.pinned.toString());
    if (filters?.id) params.append('id', filters.id.toString());
    if (filters?.canvas_uid) params.append('canvas_uid', filters.canvas_uid);
    if (filters?.note_id) params.append('note_id', filters.note_id.toString());

    const response = await httpClient.get<{ data: CanvasListResponse }>(
        `/api/v1/canvas?${params.toString()}`
    );

    return response.data.data;
};

/**
 * Fetch a single canvas by UID
 */
export const fetchCanvasByUid = async (uid: string): Promise<Canvas> => {
    const response = await httpClient.get<{ data: Canvas }>(`/api/v1/canvas/${uid}`);
    return response.data.data;
};

/**
 * Create a new canvas
 */
export const createCanvas = async (payload: CreateCanvasDto): Promise<Canvas> => {
    const response = await httpClient.post<{ data: Canvas }>('/api/v1/canvas', payload);
    return response.data.data;
};

/**
 * Update an existing canvas by ID
 */
export const updateCanvas = async (
    id: number,
    payload: UpdateCanvasDto
): Promise<Canvas> => {
    const response = await httpClient.patch<{ data: Canvas }>(
        `/api/v1/canvas/${id}`,
        payload
    );
    return response.data.data;
};

/**
 * Delete a canvas by ID
 */
export const deleteCanvas = async (id: number): Promise<{ deletedId: number }> => {
    const response = await httpClient.delete<{ data: { deletedId: number } }>(
        `/api/v1/canvas/${id}`
    );
    return response.data.data;
};
