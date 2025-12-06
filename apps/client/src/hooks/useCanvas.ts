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
            return {};
        },
        onSuccess: (newCanvas) => {
            // Invalidate to fetch fresh data with correct pagination/sorting
            queryClient.invalidateQueries({ queryKey: canvasKeys.lists() });

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

            // Snapshot previous values (not perfect for generic rollback but okay for most cases)
            // Ideally we'd rollback all queries, but invalidation on error is safer

            // Determine UID if possible for detail update
            let targetUid = uid;
            if (!targetUid) {
                // Try to find it in any list
                const queries = queryClient.getQueriesData<CanvasListResponse>({ queryKey: canvasKeys.lists() });
                for (const [, list] of queries) {
                    const found = list?.canvases.find(c => c.id === id);
                    if (found) {
                        targetUid = found.canvas_uid;
                        break;
                    }
                }
            }

            // Get previous detail if we have a UID
            const previousDetail = targetUid
                ? queryClient.getQueryData<Canvas>(canvasKeys.detail(targetUid))
                : undefined;

            // Optimistically update ALL list caches
            queryClient.setQueriesData<CanvasListResponse>({ queryKey: canvasKeys.lists() }, (old) => {
                if (!old) return old;
                return {
                    ...old,
                    canvases: old.canvases.map((canvas) =>
                        canvas.id === id
                            ? { ...canvas, ...data, updated_at: new Date().toISOString() }
                            : canvas
                    ),
                };
            });

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

            return { previousDetail, canvasUid: targetUid };
        },
        onError: (error, variables, context) => {
            // Invalidate on error to restore state
            queryClient.invalidateQueries({ queryKey: canvasKeys.lists() });
            if (context?.previousDetail && context.canvasUid) {
                queryClient.setQueryData(
                    canvasKeys.detail(context.canvasUid),
                    context.previousDetail
                );
            }
        },
        onSuccess: (updatedCanvas) => {
            // Update detail cache
            queryClient.setQueryData(
                canvasKeys.detail(updatedCanvas.canvas_uid),
                updatedCanvas
            );

            // Invalidate lists to ensure consistency (e.g. if pinning changed order)
            queryClient.invalidateQueries({ queryKey: canvasKeys.lists() });
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
        { canvasUid?: string }
    >) => {
    const queryClient = useQueryClient();

    return useMutation<{ deletedId: number }, Error, number, { canvasUid?: string }>({
        mutationFn: deleteCanvas,
        onMutate: async (id) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: canvasKeys.lists() });

            // Optimistically remove from ALL lists
            queryClient.setQueriesData<CanvasListResponse>({ queryKey: canvasKeys.lists() }, (old) => {
                if (!old) return old;
                return {
                    ...old,
                    canvases: old.canvases.filter((canvas) => canvas.id !== id),
                    pagination: {
                        ...old.pagination,
                        total: Math.max(0, old.pagination.total - 1),
                    },
                };
            });

            return {};
        },
        onError: (error, variables, context) => {
            // Invalidate to restore
            queryClient.invalidateQueries({ queryKey: canvasKeys.lists() });
        },
        onSuccess: () => {
            // Always invalidate for consistency
            queryClient.invalidateQueries({ queryKey: canvasKeys.lists() });
        },
        ...options,
    });
};
