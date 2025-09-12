/**
 * AI Service Fallback Manager
 * Provides graceful degradation when AI services are unavailable
 * Follows DRY principles by centralizing fallback logic
 */

import { logger } from '../logger';

export interface AIOperation<T> {
  (): Promise<T>;
}

export interface FallbackOperation<T> {
  (): T;
}

/**
 * AI Fallback Manager
 * Manages AI service availability and provides fallback mechanisms
 */
export class AIFallbackManager {
  private static instance: AIFallbackManager;
  private failureCount = 0;
  private isDisabled = false;
  private lastFailureTime = 0;
  private readonly failureThreshold = 3;
  private readonly cooldownPeriod = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): AIFallbackManager {
    if (!AIFallbackManager.instance) {
      AIFallbackManager.instance = new AIFallbackManager();
    }
    return AIFallbackManager.instance;
  }

  /**
   * Execute AI operation with fallback
   * @param aiOperation The AI operation to execute
   * @param fallbackOperation The fallback operation if AI fails
   * @param operationName Name of the operation for logging
   * @returns Result from AI operation or fallback
   */
  async executeWithFallback<T>(
    aiOperation: AIOperation<T>,
    fallbackOperation: FallbackOperation<T>,
    operationName: string = 'AI operation'
  ): Promise<T> {
    // Check if AI is disabled due to recent failures
    if (this.isDisabled) {
      logger.warn(`AI service disabled, using fallback for ${operationName}`, {
        operation: operationName,
        failureCount: this.failureCount,
        lastFailureTime: this.lastFailureTime
      });
      return fallbackOperation();
    }

    try {
      const result = await aiOperation();
      this.resetFailureCount();
      logger.debug(`AI operation successful: ${operationName}`, {
        operation: operationName,
        failureCount: this.failureCount
      });
      return result;
    } catch (error) {
      this.handleFailure(operationName, error);
      return fallbackOperation();
    }
  }

  /**
   * Check if AI service is available
   */
  isAIAvailable(): boolean {
    return !this.isDisabled;
  }

  /**
   * Get current failure count
   */
  getFailureCount(): number {
    return this.failureCount;
  }

  /**
   * Get time since last failure
   */
  getTimeSinceLastFailure(): number {
    return Date.now() - this.lastFailureTime;
  }

  /**
   * Manually reset AI service (for testing or manual recovery)
   */
  resetAIService(): void {
    this.isDisabled = false;
    this.failureCount = 0;
    this.lastFailureTime = 0;
    logger.info('AI service manually reset');
  }

  /**
   * Handle AI service failure
   */
  private handleFailure(operationName: string, error: unknown): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    logger.error(`AI operation failed: ${operationName}`, error instanceof Error ? error : new Error(String(error)), {
      operation: operationName,
      failureCount: this.failureCount,
      error: error instanceof Error ? error.message : String(error)
    });

    // Disable AI service if failure threshold is reached
    if (this.failureCount >= this.failureThreshold) {
      this.isDisabled = true;
      logger.warn('AI service disabled due to repeated failures', {
        failureCount: this.failureCount,
        threshold: this.failureThreshold,
        cooldownPeriod: this.cooldownPeriod
      });

      // Schedule re-enablement after cooldown period
      setTimeout(() => {
        this.isDisabled = false;
        this.failureCount = 0;
        logger.info('AI service re-enabled after cooldown period');
      }, this.cooldownPeriod);
    }
  }

  /**
   * Reset failure count on successful operation
   */
  private resetFailureCount(): void {
    if (this.failureCount > 0) {
      logger.info('AI service recovered, resetting failure count', {
        previousFailureCount: this.failureCount
      });
      this.failureCount = 0;
    }
  }
}

/**
 * Convenience function for executing AI operations with fallback
 * @param aiOperation The AI operation to execute
 * @param fallbackOperation The fallback operation if AI fails
 * @param operationName Name of the operation for logging
 * @returns Result from AI operation or fallback
 */
export async function executeWithAIFallback<T>(
  aiOperation: AIOperation<T>,
  fallbackOperation: FallbackOperation<T>,
  operationName: string = 'AI operation'
): Promise<T> {
  const manager = AIFallbackManager.getInstance();
  return manager.executeWithFallback(aiOperation, fallbackOperation, operationName);
}

/**
 * Check if AI service is available
 */
export function isAIAvailable(): boolean {
  return AIFallbackManager.getInstance().isAIAvailable();
}

/**
 * Get AI service status information
 */
export function getAIStatus(): {
  isAvailable: boolean;
  failureCount: number;
  timeSinceLastFailure: number;
} {
  const manager = AIFallbackManager.getInstance();
  return {
    isAvailable: manager.isAIAvailable(),
    failureCount: manager.getFailureCount(),
    timeSinceLastFailure: manager.getTimeSinceLastFailure()
  };
}

/**
 * Reset AI service (for testing or manual recovery)
 */
export function resetAIService(): void {
  AIFallbackManager.getInstance().resetAIService();
}
