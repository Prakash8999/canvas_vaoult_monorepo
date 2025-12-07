import httpClient from './httpClient';

// ============================================================================
// TypeScript Types & Interfaces
// ============================================================================

export interface QuickCapture {
    id: number;
    note_uid: string;
    user_id: number;
    title: string;
    content?: any; // EditorJS blocks
    tags?: string[];
    version: number;
    pinned: boolean;
    note_type: 'quick_capture';
    created_at: string;
    updated_at: string;
}

export interface QuickCaptureListItem {
    id: number;
    note_uid: string;
    title: string;
    pinned: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateQuickCaptureDto {
    title: string;
    content?: any;
    pinned?: boolean;
    tags?: string[];
}

export interface UpdateQuickCaptureDto {
    title?: string;
    content?: any;
    pinned?: boolean;
    tags?: string[];
}

export interface QuickCaptureFilters {
    page?: number;
    limit?: number;
    search?: string;
    pinned?: boolean;
    id?: number;
    note_uid?: string;
}

export interface QuickCaptureListResponse {
    quickCaptures: QuickCapture[];
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
 * Fetch list of quick captures with optional filters
 */
export const fetchQuickCaptureList = async (
    filters?: QuickCaptureFilters
): Promise<QuickCaptureListResponse> => {
    const params = new URLSearchParams();

    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.pinned !== undefined) params.append('pinned', filters.pinned.toString());
    if (filters?.id) params.append('id', filters.id.toString());
    if (filters?.note_uid) params.append('note_uid', filters.note_uid);

    const response = await httpClient.get<{ data: QuickCaptureListResponse }>(
        `/api/v1/quick-capture?${params.toString()}`
    );

    return response.data.data;
};

/**
 * Fetch a single quick capture by ID
 */
export const fetchQuickCaptureById = async (id: number): Promise<QuickCapture> => {
    const response = await httpClient.get<{ data: QuickCapture }>(`/api/v1/quick-capture/${id}`);
    return response.data.data;
};

/**
 * Create a new quick capture
 */
export const createQuickCapture = async (payload: CreateQuickCaptureDto): Promise<QuickCapture> => {
    const response = await httpClient.post<{ data: QuickCapture }>('/api/v1/quick-capture', payload);
    return response.data.data;
};

/**
 * Update an existing quick capture by ID
 */
export const updateQuickCapture = async (
    id: number,
    payload: UpdateQuickCaptureDto
): Promise<QuickCapture> => {
    const response = await httpClient.patch<{ data: QuickCapture }>(
        `/api/v1/quick-capture/${id}`,
        payload
    );
    return response.data.data;
};

/**
 * Delete a quick capture by ID
 */
export const deleteQuickCapture = async (id: number): Promise<{ deletedId: number }> => {
    const response = await httpClient.delete<{ data: { deletedId: number } }>(
        `/api/v1/quick-capture/${id}`
    );
    return response.data.data;
};
