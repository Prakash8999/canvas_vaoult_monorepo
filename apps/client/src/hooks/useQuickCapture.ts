import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import {
    fetchQuickCaptureList,
    fetchQuickCaptureById,
    createQuickCapture,
    updateQuickCapture,
    deleteQuickCapture,
    QuickCapture,
    QuickCaptureListResponse,
    CreateQuickCaptureDto,
    UpdateQuickCaptureDto,
    QuickCaptureFilters,
} from '../lib/api/quickCaptureApi';

// ============================================================================
// Query Key Factory
// ============================================================================

export const quickCaptureKeys = {
    all: ['quick-capture'] as const,
    lists: () => [...quickCaptureKeys.all, 'list'] as const,
    list: (filters?: QuickCaptureFilters) => [...quickCaptureKeys.lists(), filters] as const,
    details: () => [...quickCaptureKeys.all, 'detail'] as const,
    detail: (id: number) => [...quickCaptureKeys.details(), id] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook to fetch list of quick captures with optional filters
 */
export const useQuickCaptureList = (
    filters?: QuickCaptureFilters,
    options?: Omit<UseQueryOptions<QuickCaptureListResponse, Error>, 'queryKey' | 'queryFn'>
) => {
    return useQuery<QuickCaptureListResponse, Error>({
        queryKey: quickCaptureKeys.list(filters),
        queryFn: () => fetchQuickCaptureList(filters),
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        ...options,
    });
};

/**
 * Hook to fetch a single quick capture by ID
 */
export const useQuickCapture = (
    id: number,
    options?: Omit<UseQueryOptions<QuickCapture, Error>, 'queryKey' | 'queryFn'>
) => {
    return useQuery<QuickCapture, Error>({
        queryKey: quickCaptureKeys.detail(id),
        queryFn: () => fetchQuickCaptureById(id),
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        enabled: !!id,
        ...options,
    });
};

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Hook to create a new quick capture with optimistic update
 */
export const useCreateQuickCapture = (
    options?: UseMutationOptions<QuickCapture, Error, CreateQuickCaptureDto, { previousList?: QuickCaptureListResponse }>
) => {
    const queryClient = useQueryClient();

    return useMutation<QuickCapture, Error, CreateQuickCaptureDto, { previousList?: QuickCaptureListResponse }>({
        mutationFn: createQuickCapture,
        onMutate: async (newQC) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: quickCaptureKeys.lists() });
            return {};
        },
        onSuccess: (newQC) => {
            // Invalidate to fetch fresh data with correct pagination/sorting
            queryClient.invalidateQueries({ queryKey: quickCaptureKeys.lists() });

            // Set detail cache
            queryClient.setQueryData(quickCaptureKeys.detail(newQC.id), newQC);
        },
        ...options,
    });
};

/**
 * Hook to update a quick capture with cache patching
 */
export const useUpdateQuickCapture = (
    options?: UseMutationOptions<
        QuickCapture,
        Error,
        { id: number; data: UpdateQuickCaptureDto },
        { previousList?: QuickCaptureListResponse; previousDetail?: QuickCapture }
    >
) => {
    const queryClient = useQueryClient();

    return useMutation<QuickCapture, Error, { id: number; data: UpdateQuickCaptureDto }, { previousList?: QuickCaptureListResponse; previousDetail?: QuickCapture }>({
        mutationFn: ({ id, data }) => updateQuickCapture(id, data),
        onMutate: async ({ id, data }) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: quickCaptureKeys.all });

            // Get previous detail
            const previousDetail = queryClient.getQueryData<QuickCapture>(quickCaptureKeys.detail(id));

            // Optimistically update ALL list caches
            queryClient.setQueriesData<QuickCaptureListResponse>({ queryKey: quickCaptureKeys.lists() }, (old) => {
                if (!old) return old;
                return {
                    ...old,
                    quickCaptures: old.quickCaptures.map((qc) =>
                        qc.id === id
                            ? { ...qc, ...data, updated_at: new Date().toISOString() }
                            : qc
                    ),
                };
            });

            // Optimistically update detail cache
            if (previousDetail) {
                queryClient.setQueryData<QuickCapture>(
                    quickCaptureKeys.detail(id),
                    {
                        ...previousDetail,
                        ...data,
                        updated_at: new Date().toISOString(),
                    }
                );
            }

            return { previousDetail };
        },
        onError: (error, variables, context) => {
            // Invalidate on error to restore state
            queryClient.invalidateQueries({ queryKey: quickCaptureKeys.lists() });
            if (context?.previousDetail) {
                queryClient.setQueryData(
                    quickCaptureKeys.detail(variables.id),
                    context.previousDetail
                );
            }
        },
        onSuccess: (updatedQC) => {
            // Update detail cache
            queryClient.setQueryData(
                quickCaptureKeys.detail(updatedQC.id),
                updatedQC
            );

            // Invalidate lists to ensure consistency
            queryClient.invalidateQueries({ queryKey: quickCaptureKeys.lists() });
        },
        ...options,
    });
};

/**
 * Hook to delete a quick capture with cache removal
 */
export const useDeleteQuickCapture = (
    options?: UseMutationOptions<
        { deletedId: number },
        Error,
        number,
        unknown
    >) => {
    const queryClient = useQueryClient();

    return useMutation<{ deletedId: number }, Error, number, unknown>({
        mutationFn: deleteQuickCapture,
        onMutate: async (id) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: quickCaptureKeys.lists() });

            // Optimistically remove from ALL lists
            queryClient.setQueriesData<QuickCaptureListResponse>({ queryKey: quickCaptureKeys.lists() }, (old) => {
                if (!old) return old;
                return {
                    ...old,
                    quickCaptures: old.quickCaptures.filter((qc) => qc.id !== id),
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
            queryClient.invalidateQueries({ queryKey: quickCaptureKeys.lists() });
        },
        onSuccess: () => {
            // Always invalidate for consistency
            queryClient.invalidateQueries({ queryKey: quickCaptureKeys.lists() });
        },
        ...options,
    });
};
