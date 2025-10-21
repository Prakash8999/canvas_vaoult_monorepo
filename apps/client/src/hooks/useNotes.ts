import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { notesApi, convertApiNoteToLocal, convertLocalNoteToApi, ApiNote } from '../lib/api/notesApi';
import { OutputData } from '@editorjs/editorjs';

// Query keys
export const notesQueryKeys = {
  all: ['notes'] as const,
  lists: () => [...notesQueryKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...notesQueryKeys.lists(), filters] as const,
  infinite: () => [...notesQueryKeys.all, 'infinite'] as const,
  infiniteList: (filters: Record<string, any>) => [...notesQueryKeys.infinite(), filters] as const,
  details: () => [...notesQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...notesQueryKeys.details(), id] as const,
};

// Hook to fetch all notes with pagination
export const useInfiniteNotes = (pageSize = 10) => {
  return useInfiniteQuery({
    queryKey: notesQueryKeys.infiniteList({ pageSize }),
    queryFn: async ({ pageParam = 0 }: { pageParam?: number }) => {
      const response = await notesApi.getAllNotes(pageSize, pageParam as number);
      const notesRecord: Record<string, any> = {};

      response.notes.forEach((apiNote: ApiNote) => {
        const localNote = convertApiNoteToLocal(apiNote);
        notesRecord[localNote.id] = localNote;
      });

      // Defensive hasMore calculation:
      // - Prefer explicit server-provided flag
      // - Fallback to comparing returned page length with pageSize
      const explicitHasMore = response.pagination?.hasMore;
      const inferredHasMore = response.notes.length === pageSize;
      const hasMore = explicitHasMore !== undefined ? explicitHasMore : inferredHasMore;

      return {
        notes: notesRecord,
        nextOffset: hasMore ? (pageParam as number) + pageSize : undefined,
        total: typeof response.pagination?.total === 'number' ? response.pagination!.total : undefined,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook to fetch all notes (legacy - loads all at once)
export const useNotes = () => {
  return useQuery({
    queryKey: notesQueryKeys.lists(),
    queryFn: async () => {
      const response = await notesApi.getAllNotes();
      const notesRecord: Record<string, any> = {};

      response.notes.forEach((apiNote: ApiNote) => {
        const localNote = convertApiNoteToLocal(apiNote);
        notesRecord[localNote.id] = localNote;
      });

      return notesRecord;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
};

// Hook to fetch a single note
export const useNote = (uid: string) => {
  return useQuery({
    queryKey: notesQueryKeys.detail(uid),
    queryFn: async () => {
      const apiNote = await notesApi.getNote(uid);
      return convertApiNoteToLocal(apiNote);
    },
    enabled: !!uid,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Hook for note mutations
export const useNoteMutations = () => {
  const queryClient = useQueryClient();

  const createNoteMutation = useMutation({
    mutationFn: async ({ 
      name, 
      content, 
      is_wiki_link, 
      parent_note_id 
    }: { 
      name: string; 
      content?: OutputData; 
      is_wiki_link?: boolean; 
      parent_note_id?: string | null; 
    }) => {
      const noteData: any = {
        title: name,
        content: content || { blocks: [] },
        tags: [],
        pinned: false,
      };
      
      // Add WikiLink-specific fields if provided
      if (is_wiki_link !== undefined) {
        noteData.is_wiki_link = is_wiki_link;
      }
      if (parent_note_id !== undefined) {
        noteData.parent_note_id = parent_note_id ? parseInt(parent_note_id) : null;
      }
      
      return await notesApi.createNote(noteData);
    },
    // Don't invalidate immediately on success to prevent refetch race conditions
    // The UI will handle navigation and manual refresh when needed
    onSuccess: (newApiNote) => {
      // Add the new note to the cache
      const localNote = convertApiNoteToLocal(newApiNote);
      queryClient.setQueryData(notesQueryKeys.detail(localNote.id), localNote);
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<any> }) => {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.title = updates.name;
      if (updates.content !== undefined) updateData.content = updates.content;
      if (updates.isPinned !== undefined) updateData.pinned = updates.isPinned;
      if (updates.tags !== undefined) updateData.tags = updates.tags;

      return await notesApi.updateNote(parseInt(id), updateData);
    },
    onSuccess: (updatedApiNote, { id }) => {
      // Invalidate all notes queries (both lists and paginated queries)
      queryClient.invalidateQueries({ queryKey: notesQueryKeys.all });

      // Update the specific note in cache only if we have valid data
      if (updatedApiNote && typeof updatedApiNote === 'object' && 'id' in updatedApiNote) {
        try {
          const localNote = convertApiNoteToLocal(updatedApiNote as ApiNote);
          queryClient.setQueryData(notesQueryKeys.detail(id), localNote);
        } catch (error) {
          console.error('Error converting API note to local:', error, updatedApiNote);
        }
      } else {
        console.warn('Invalid updatedApiNote received:', updatedApiNote);
      }
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await notesApi.deleteNote(parseInt(id));
    },
    onSuccess: (_, deletedId) => {
      // Invalidate all notes queries (both lists and paginated queries)
      queryClient.invalidateQueries({ queryKey: notesQueryKeys.all });

      // Remove the note from cache
      queryClient.removeQueries({ queryKey: notesQueryKeys.detail(deletedId) });
    },
  });

  return {
    createNote: createNoteMutation.mutateAsync,
    updateNote: updateNoteMutation.mutateAsync,
    deleteNote: deleteNoteMutation.mutateAsync,
    isCreating: createNoteMutation.isPending,
    isUpdating: updateNoteMutation.isPending,
    isDeleting: deleteNoteMutation.isPending,
  };
};

// Hook for numbered pagination (pageIndex starting at 0)
export const usePaginatedNotes = (pageIndex = 0, pageSize = 10) => {
  const offset = pageIndex * pageSize;

  return useQuery({
    queryKey: notesQueryKeys.list({ pageIndex, pageSize }),
    queryFn: async () => {
      const response = await notesApi.getAllNotes(pageSize, offset);
      const notesArray: any[] = [];

      response.notes.forEach((apiNote: ApiNote) => {
        const localNote = convertApiNoteToLocal(apiNote);
        notesArray.push(localNote);
      });

      const explicitTotal = response.pagination?.total;
      const total = typeof explicitTotal === 'number' ? explicitTotal : undefined;

      return {
        notes: notesArray,
        total,
        limit: response.pagination?.limit ?? pageSize,
        offset: response.pagination?.offset ?? offset,
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};