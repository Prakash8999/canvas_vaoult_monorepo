// Imports
import {
    useMutation,
    useQuery,
    useQueryClient
} from '@tanstack/react-query';
import {
    generateAIResponse,
    getAICredits,
    getAIConstraints,
    getSupportedModels,
    getUserConfigs,
    setUserConfig,
    deleteUserConfig,
    AIGenerateRequest,
    UserAIConfig
} from '@/api/aiApi';
import { toast } from 'sonner';

// -----------------------------
// 🧩 Query Keys
// -----------------------------

export const aiKeys = {
    all: ['ai'] as const,
    credits: () => [...aiKeys.all, 'credits'] as const,
    constraints: () => [...aiKeys.all, 'constraints'] as const,
    models: () => [...aiKeys.all, 'models'] as const,
    configs: () => [...aiKeys.all, 'configs'] as const,
};

// -----------------------------
// 🧩 Hooks
// -----------------------------

/**
 * Hook to get AI constraints
 * Useful for displaying limits and available providers
 */
export function useAIConstraints() {
    return useQuery({
        queryKey: aiKeys.constraints(),
        queryFn: getAIConstraints,
        staleTime: Infinity, // Constraints don't change often
        gcTime: Infinity,
    });
}

/**
 * Hook to get supported models
 */
export function useSupportedModels() {
    return useQuery({
        queryKey: aiKeys.models(),
        queryFn: getSupportedModels,
        staleTime: Infinity,
    });
}

/**
 * Hook to get user model configurations (BYOK)
 */
export function useUserAIConfigs() {
    return useQuery({
        queryKey: aiKeys.configs(),
        queryFn: getUserConfigs,
    });
}

/**
 * Hook for managing user AI configs
 */
export function useUserAIConfigMutations() {
    const queryClient = useQueryClient();

    const setConfig = useMutation({
        mutationFn: (data: { provider: string; model: string; apiKey?: string; isDefault?: boolean }) =>
            setUserConfig(data.provider, data.model, data.apiKey, data.isDefault),
        onSuccess: async (responseData, variables) => {
            // Update the query cache immediately with the new config
            queryClient.setQueryData(aiKeys.configs(), (oldConfigs: UserAIConfig[] | undefined) => {
                if (!oldConfigs) return [responseData];

                // If setting as default, unset all other defaults
                if (responseData.is_default) {
                    oldConfigs = oldConfigs.map(config => ({
                        ...config,
                        is_default: false
                    }));
                }

                // Find and update existing config or add new one
                const existingIndex = oldConfigs.findIndex(
                    c => c.provider === responseData.provider && c.model === responseData.model
                );

                if (existingIndex >= 0) {
                    // Update existing
                    oldConfigs[existingIndex] = responseData;
                    return [...oldConfigs];
                } else {
                    // Add new
                    return [...oldConfigs, responseData];
                }
            });

            toast.success('Configuration saved');
        },
        onError: (err: any) => toast.error(err.response?.data?.data || 'Failed to save config'),
    });

    const removeConfig = useMutation({
        mutationFn: (data: { provider: string; model: string }) =>
            deleteUserConfig(data.provider, data.model),
        onSuccess: (_, variables) => {
            // Immediately remove from cache
            queryClient.setQueryData(aiKeys.configs(), (oldConfigs: UserAIConfig[] | undefined) => {
                if (!oldConfigs) return [];
                return oldConfigs.filter(
                    c => !(c.provider === variables.provider && c.model === variables.model)
                );
            });
            toast.success('Configuration removed');
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to remove config'),
    });

    return { setConfig, removeConfig };
}

/**
 * Hook to get user's AI credits
 */
export function useAICredits() {
    return useQuery({
        queryKey: aiKeys.credits(),
        queryFn: getAICredits,
        staleTime: 30000, // 30 seconds
    });
}

/**
 * Hook to generate AI response
 * Automatically updates credits after successful generation
 */
export function useGenerateAI() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: AIGenerateRequest) => generateAIResponse(request),
        onSuccess: (data) => {
            // Only update credits if NOT using custom key
            // When usingCustomKey is true, credits should not be updated
            if (!data.usingCustomKey) {
                queryClient.setQueryData(aiKeys.credits(), data.remainingCredits);
            }
        },
        onError: (error: any) => {
            const errorMessage = error.response?.data?.message || 'Failed to generate AI response';

            // Handle specific error cases
            if (error.response?.status === 402) {
                toast.error('Insufficient AI credits', {
                    description: 'You have run out of AI credits. Please contact support to get more.',
                });
            } else if (error.response?.status === 400) {
                toast.error('Invalid request', {
                    description: errorMessage,
                });
            } else {
                toast.error('AI generation failed', {
                    description: errorMessage,
                });
            }
        },
    });
}
