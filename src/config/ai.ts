/**
 * Cerebras AI configuration
 * Manages all settings related to the Cerebras AI integration
 */

export interface CerebrasConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export const aiConfig = {
  cerebras: {
    apiUrl: process.env.CEREBRAS_API_URL || 'https://api.cerebras.ai/v1',
    apiKey: process.env.CEREBRAS_API_KEY || '',
    model: process.env.CEREBRAS_MODEL || 'cerebras-llama-2-7b-chat',
    maxTokens: parseInt(process.env.CEREBRAS_MAX_TOKENS || '2048'),
    temperature: parseFloat(process.env.CEREBRAS_TEMPERATURE || '0.7'),
    timeout: parseInt(process.env.CEREBRAS_TIMEOUT || '30000'),
    retryAttempts: parseInt(process.env.CEREBRAS_RETRY_ATTEMPTS || '3'),
    retryDelay: parseInt(process.env.CEREBRAS_RETRY_DELAY || '1000'),
  } as CerebrasConfig,
  
  // Feature flags for AI functionality
  enabled: process.env.AI_ENABLED === 'true',
  queryProcessing: process.env.AI_QUERY_PROCESSING === 'true',
  resultRanking: process.env.AI_RESULT_RANKING === 'true',
  contextBuilding: process.env.AI_CONTEXT_BUILDING === 'true',
  
  // Caching settings
  cache: {
    enabled: process.env.AI_CACHE_ENABLED === 'true',
    ttl: parseInt(process.env.AI_CACHE_TTL || '300'), // 5 minutes
    maxSize: parseInt(process.env.AI_CACHE_MAX_SIZE || '1000'),
  },
};
