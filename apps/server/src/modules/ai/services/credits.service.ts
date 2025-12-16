import User from '../../users/users.model';
import { InsufficientCreditsError } from '../ai.types';

/**
 * AI Credits Service
 * Handles all credit-related operations
 * Separated from AI execution logic for modularity
 */
export class AICreditsService {
    /**
     * Get user's current AI credits
     * @param userId - User ID
     * @returns Current credit balance
     */
    static async getUserCredits(userId: number): Promise<number> {
        const user = await User.findByPk(userId, {
            attributes: ['ai_credits'],
        });

        if (!user) {
            throw new Error('User not found');
        }

        return user.ai_credits;
    }

    /**
     * Check if user has sufficient credits
     * @param userId - User ID
     * @param required - Required credits
     * @returns True if user has enough credits
     */
    static async hasCredits(userId: number, required: number = 1): Promise<boolean> {
        const available = await this.getUserCredits(userId);
        return available >= required;
    }

    /**
     * Deduct credits from user account
     * Only deducts if user has sufficient credits
     * @param userId - User ID
     * @param amount - Amount to deduct
     * @returns New credit balance
     * @throws InsufficientCreditsError if user doesn't have enough credits
     */
    static async deductCredits(userId: number, amount: number = 1): Promise<number> {
        const user = await User.findByPk(userId);

        if (!user) {
            throw new Error('User not found');
        }

        // Check if user has enough credits
        if (user.ai_credits < amount) {
            throw new InsufficientCreditsError(amount, user.ai_credits);
        }

        // Deduct credits
        user.ai_credits -= amount;
        await user.save();

        return user.ai_credits;
    }

    /**
     * Add credits to user account
     * @param userId - User ID
     * @param amount - Amount to add
     * @returns New credit balance
     */
    static async addCredits(userId: number, amount: number): Promise<number> {
        const user = await User.findByPk(userId);

        if (!user) {
            throw new Error('User not found');
        }

        user.ai_credits += amount;
        await user.save();

        return user.ai_credits;
    }

    /**
     * Reset user credits to default value
     * @param userId - User ID
     * @param defaultAmount - Default credit amount
     * @returns New credit balance
     */
    static async resetCredits(userId: number, defaultAmount: number = 10): Promise<number> {
        const user = await User.findByPk(userId);

        if (!user) {
            throw new Error('User not found');
        }

        user.ai_credits = defaultAmount;
        await user.save();

        return user.ai_credits;
    }
}
