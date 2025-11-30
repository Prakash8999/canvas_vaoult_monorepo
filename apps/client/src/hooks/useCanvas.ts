import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import {
    fetchCanvasList,
    fetchCanvasByUid,
    createCanvas,
    updateCanvas,
    deleteCanvas,
    Canvas,
    CanvasListResponse,
    CreateCanvasDto,
    UpdateCanvasDto,
    CanvasFilters,
} from '../lib/api/canvasApi';

// ============================================================================
// Query Key Factory
// ============================================================================

export const canvasKeys = {
    all: ['canvas'] as const,
    lists: () => [...canvasKeys.all, 'list'] as const,
    list: (filters?: CanvasFilters) => [...canvasKeys.lists(), filters] as const,
    details: () => [...canvasKeys.all, 'detail'] as const,
    detail: (uid: string) => [...canvasKeys.details(), uid] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook to fetch list of canvases with optional filters
 */
export const useCanvasList = (
    filters?: CanvasFilters,
    options?: Omit<UseQueryOptions<CanvasListResponse, Error>, 'queryKey' | 'queryFn'>
) => {
    return useQuery<CanvasListResponse, Error>({
        queryKey: canvasKeys.list(filters),
        queryFn: () => fetchCanvasList(filters),
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        ...options,
    });
};

/**
 * Hook to fetch a single canvas by UID
 */
export const useCanvas = (
    uid: string,
    options?: Omit<UseQueryOptions<Canvas, Error>, 'queryKey' | 'queryFn'>
) => {
    return useQuery<Canvas, Error>({
        queryKey: canvasKeys.detail(uid),
        queryFn: () => fetchCanvasByUid(uid),
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        enabled: !!uid,
        ...options,
    });
};

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Hook to create a new canvas with optimistic update
 */
export const useCreateCanvas = (
    options?: UseMutationOptions<Canvas, Error, CreateCanvasDto, { previousCanvases?: CanvasListResponse }>
) => {
    const queryClient = useQueryClient();

    return useMutation<Canvas, Error, CreateCanvasDto, { previousCanvases?: CanvasListResponse }>({
        mutationFn: createCanvas,
        onMutate: async (newCanvas) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: canvasKeys.lists() });

            // Snapshot previous value
            const previousCanvases = queryClient.getQueryData<CanvasListResponse>(
                canvasKeys.list()
            );

            // Optimistically update cache
            if (previousCanvases) {
                const optimisticCanvas: Canvas = {
                    id: Date.now(), // Temporary ID
                    canvas_uid: `temp-${Date.now()}`,
                    user_id: 0,
                    title: newCanvas.title,
                    canvas_data: newCanvas.canvas_data,
                    document_data: newCanvas.document_data,
                    viewport: newCanvas.viewport,
                    pinned: newCanvas.pinned || false,
                    note_id: newCanvas.note_id,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    note: null,
                };

                queryClient.setQueryData<CanvasListResponse>(canvasKeys.list(), {
                    ...previousCanvases,
                    canvases: [optimisticCanvas, ...previousCanvases.canvases],
                    pagination: {
                        ...previousCanvases.pagination,
                        total: previousCanvases.pagination.total + 1,
                    },
                });
            }

            return { previousCanvases };
        },
        onError: (error, variables, context) => {
            // Rollback on error
            if (context?.previousCanvases) {
                queryClient.setQueryData(canvasKeys.list(), context.previousCanvases);
            }
        },
        onSuccess: (newCanvas) => {
            // Update cache with real data
            queryClient.setQueryData<CanvasListResponse>(
                canvasKeys.list(),
                (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        canvases: old.canvases.map((canvas) =>
                            canvas.id === newCanvas.id ? newCanvas : canvas
                        ),
                    };
                }
            );

            // Set detail cache
            queryClient.setQueryData(canvasKeys.detail(newCanvas.canvas_uid), newCanvas);
        },
        ...options,
    });
};

/**
 * Hook to update a canvas with cache patching
 */
export const useUpdateCanvas = (
    options?: UseMutationOptions<
        Canvas,
        Error,
        { id: number; uid?: string; data: UpdateCanvasDto },
        { previousList?: CanvasListResponse; previousDetail?: Canvas; canvasUid?: string } // <--- Context Type
    >
) => {
    const queryClient = useQueryClient();

    return useMutation<Canvas, Error, { id: number; uid?: string; data: UpdateCanvasDto }, { previousList?: CanvasListResponse; previousDetail?: Canvas; canvasUid?: string }>({
        mutationFn: ({ id, data }) => updateCanvas(id, data),
        onMutate: async ({ id, uid, data }) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: canvasKeys.all });

            // Snapshot previous values
            const previousList = queryClient.getQueryData<CanvasListResponse>(
                canvasKeys.list()
            );

            // Determine UID: use provided uid or try to find it in the list
            let targetUid = uid;
            if (!targetUid && previousList) {
                const canvasInList = previousList.canvases.find((c) => c.id === id);
                targetUid = canvasInList?.canvas_uid;
            }

            // Get previous detail if we have a UID
            const previousDetail = targetUid
                ? queryClient.getQueryData<Canvas>(canvasKeys.detail(targetUid))
                : undefined;

            // Optimistically update list cache
            if (previousList) {
                queryClient.setQueryData<CanvasListResponse>(canvasKeys.list(), {
                    ...previousList,
                    canvases: previousList.canvases.map((canvas) =>
                        canvas.id === id
                            ? { ...canvas, ...data, updated_at: new Date().toISOString() }
                            : canvas
                    ),
                });
            }

            // Optimistically update detail cache
            if (previousDetail && targetUid) {
                queryClient.setQueryData<Canvas>(
                    canvasKeys.detail(targetUid),
                    {
                        ...previousDetail,
                        ...data,
                        updated_at: new Date().toISOString(),
                    }
                );
            }

            return { previousList, previousDetail, canvasUid: targetUid };
        },
        onError: (error, variables, context) => {
            // Rollback on error
            if (context?.previousList) {
                queryClient.setQueryData(canvasKeys.list(), context.previousList);
            }
            if (context?.previousDetail && context.canvasUid) {
                queryClient.setQueryData(
                    canvasKeys.detail(context.canvasUid),
                    context.previousDetail
                );
            }
        },
        onSuccess: (updatedCanvas) => {
            // Update caches with real data
            queryClient.setQueryData<CanvasListResponse>(
                canvasKeys.list(),
                (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        canvases: old.canvases.map((canvas) =>
                            canvas.id === updatedCanvas.id ? updatedCanvas : canvas
                        ),
                    };
                }
            );

            queryClient.setQueryData(
                canvasKeys.detail(updatedCanvas.canvas_uid),
                updatedCanvas
            );
        },
        ...options,
    });
};

/**
 * Hook to delete a canvas with cache removal
 */
export const useDeleteCanvas = (
    options?: UseMutationOptions<
        { deletedId: number },
        Error,
        number,
        { previousList?: CanvasListResponse; canvasUid?: string } // <--- Context Type
    >) => {
    const queryClient = useQueryClient();

    return useMutation<{ deletedId: number }, Error, number, { previousList?: CanvasListResponse; canvasUid?: string }>({
        mutationFn: deleteCanvas,
        onMutate: async (id) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: canvasKeys.lists() });

            // Snapshot previous value
            const previousList = queryClient.getQueryData<CanvasListResponse>(
                canvasKeys.list()
            );

            // Find canvas UID for detail cache removal
            const canvasToDelete = previousList?.canvases.find((c) => c.id === id);

            // Optimistically remove from list
            if (previousList) {
                queryClient.setQueryData<CanvasListResponse>(canvasKeys.list(), {
                    ...previousList,
                    canvases: previousList.canvases.filter((canvas) => canvas.id !== id),
                    pagination: {
                        ...previousList.pagination,
                        total: previousList.pagination.total - 1,
                    },
                });
            }

            // Remove detail cache
            if (canvasToDelete) {
                queryClient.removeQueries({
                    queryKey: canvasKeys.detail(canvasToDelete.canvas_uid),
                });
            }

            return { previousList, canvasUid: canvasToDelete?.canvas_uid };
        },
        onError: (error, variables, context) => {
            // Rollback on error
            if (context?.previousList) {
                queryClient.setQueryData(canvasKeys.list(), context.previousList);
            }
        },
        ...options,
    });
};
