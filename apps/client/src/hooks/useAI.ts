import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { generateAIResponse, getAICredits, getAIConstraints, AIGenerateRequest } from '@/api/aiApi';
import { toast } from 'sonner';

// -----------------------------
// 🧩 Query Keys
// -----------------------------

export const aiKeys = {
    all: ['ai'] as const,
    credits: () => [...aiKeys.all, 'credits'] as const,
    constraints: () => [...aiKeys.all, 'constraints'] as const,
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
            // Update credits in cache
            queryClient.setQueryData(aiKeys.credits(), data.remainingCredits);
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
