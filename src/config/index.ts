/**
 * Main configuration file for Sphyr application
 * Loads and exports all configuration modules
 */

import { aiConfig } from './ai';
import { featuresConfig } from './features';
import { integrationsConfig } from './integrations';

export interface AppConfig {
  ai: typeof aiConfig;
  features: typeof featuresConfig;
  integrations: typeof integrationsConfig;
  environment: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

const config: AppConfig = {
  ai: aiConfig,
  features: featuresConfig,
  integrations: integrationsConfig,
  environment: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

export default config;
