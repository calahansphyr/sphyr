#!/usr/bin/env tsx
/**
 * Environment Validation Script
 * Validates that all required environment variables are present and properly configured
 * Follows DRY principles by centralizing validation logic
 */

import { existsSync } from 'fs';
import { join } from 'path';

// Environment variables are loaded by Next.js automatically

// Define validation rules following DRY principles
interface ValidationRule {
  name: string;
  required: boolean;
  validator?: (value: string) => boolean;
  errorMessage?: string;
}

const VALIDATION_RULES: ValidationRule[] = [
  // Database - Required for MVP
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    validator: (value) => value.startsWith('https://') && value.includes('.supabase.co'),
    errorMessage: 'Must be a valid Supabase project URL (https://xxx.supabase.co)'
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    validator: (value) => value.length > 50 && value.startsWith('eyJ'),
    errorMessage: 'Must be a valid Supabase anon key (JWT format)'
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    validator: (value) => value.length > 50 && value.startsWith('eyJ'),
    errorMessage: 'Must be a valid Supabase service role key (JWT format)'
  },

  // OAuth - Google required for MVP
  {
    name: 'GOOGLE_CLIENT_ID',
    required: true,
    validator: (value) => value.includes('.apps.googleusercontent.com'),
    errorMessage: 'Must be a valid Google OAuth client ID'
  },
  {
    name: 'GOOGLE_CLIENT_SECRET',
    required: true,
    validator: (value) => value.length > 20,
    errorMessage: 'Must be a valid Google OAuth client secret'
  },

  // AI - Required for MVP
  {
    name: 'CEREBRAS_API_KEY',
    required: true,
    validator: (value) => value.length > 20,
    errorMessage: 'Must be a valid Cerebras API key'
  },
  {
    name: 'CEREBRAS_API_URL',
    required: true,
    validator: (value) => value.startsWith('https://'),
    errorMessage: 'Must be a valid HTTPS URL'
  },

  // Application
  {
    name: 'NEXT_PUBLIC_BASE_URL',
    required: true,
    validator: (value) => value.startsWith('http'),
    errorMessage: 'Must be a valid URL (http://localhost:3000 or https://yourdomain.com)'
  },
  {
    name: 'JWT_SECRET',
    required: true,
    validator: (value) => value.length >= 32,
    errorMessage: 'Must be at least 32 characters long for security'
  },

  // Optional OAuth providers
  {
    name: 'SLACK_CLIENT_ID',
    required: false
  },
  {
    name: 'SLACK_CLIENT_SECRET',
    required: false
  },
  {
    name: 'ASANA_CLIENT_ID',
    required: false
  },
  {
    name: 'ASANA_CLIENT_SECRET',
    required: false
  },
  {
    name: 'QUICKBOOKS_CLIENT_ID',
    required: false
  },
  {
    name: 'QUICKBOOKS_CLIENT_SECRET',
    required: false
  },
  {
    name: 'MICROSOFT_CLIENT_ID',
    required: false
  },
  {
    name: 'MICROSOFT_CLIENT_SECRET',
    required: false
  },
  {
    name: 'PROCORE_CLIENT_ID',
    required: false
  },
  {
    name: 'PROCORE_CLIENT_SECRET',
    required: false
  }
];

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missing: string[];
}

/**
 * Validate environment configuration
 */
function validateEnvironment(): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    missing: []
  };

  // Check if .env.local exists
  if (!existsSync('.env.local')) {
    result.errors.push('❌ .env.local file not found. Please create it from ENVIRONMENT_SETUP.md');
    result.isValid = false;
    return result;
  }

  // Validate each rule
  for (const rule of VALIDATION_RULES) {
    const value = process.env[rule.name];

    if (!value) {
      if (rule.required) {
        result.errors.push(`❌ Missing required variable: ${rule.name}`);
        result.missing.push(rule.name);
        result.isValid = false;
      } else {
        result.warnings.push(`⚠️  Optional variable not set: ${rule.name}`);
      }
      continue;
    }

    // Run custom validator if provided
    if (rule.validator && !rule.validator(value)) {
      result.errors.push(`❌ Invalid ${rule.name}: ${rule.errorMessage || 'Validation failed'}`);
      result.isValid = false;
    }
  }

  // Additional validation checks
  validateFeatureFlags(result);
  validateOAuthConsistency(result);

  return result;
}

/**
 * Validate feature flags are properly configured
 */
function validateFeatureFlags(result: ValidationResult): void {
  const aiEnabled = process.env.AI_ENABLED === 'true';
  const cerebrasKey = process.env.CEREBRAS_API_KEY;

  if (aiEnabled && !cerebrasKey) {
    result.errors.push('❌ AI_ENABLED=true but CEREBRAS_API_KEY is missing');
    result.isValid = false;
  }

  if (!aiEnabled && cerebrasKey) {
    result.warnings.push('⚠️  CEREBRAS_API_KEY is set but AI_ENABLED=false');
  }
}

/**
 * Validate OAuth provider consistency
 */
function validateOAuthConsistency(result: ValidationResult): void {
  const oauthProviders = [
    { name: 'Slack', id: 'SLACK_CLIENT_ID', secret: 'SLACK_CLIENT_SECRET' },
    { name: 'Asana', id: 'ASANA_CLIENT_ID', secret: 'ASANA_CLIENT_SECRET' },
    { name: 'QuickBooks', id: 'QUICKBOOKS_CLIENT_ID', secret: 'QUICKBOOKS_CLIENT_SECRET' },
    { name: 'Microsoft', id: 'MICROSOFT_CLIENT_ID', secret: 'MICROSOFT_CLIENT_SECRET' },
    { name: 'Procore', id: 'PROCORE_CLIENT_ID', secret: 'PROCORE_CLIENT_SECRET' }
  ];

  for (const provider of oauthProviders) {
    const hasId = !!process.env[provider.id];
    const hasSecret = !!process.env[provider.secret];

    if (hasId && !hasSecret) {
      result.warnings.push(`⚠️  ${provider.name} client ID set but secret missing`);
    }

    if (!hasId && hasSecret) {
      result.warnings.push(`⚠️  ${provider.name} client secret set but ID missing`);
    }
  }
}

/**
 * Print validation results with proper formatting
 */
function printResults(result: ValidationResult): void {
  console.log('\n🔧 Environment Validation Results\n');

  if (result.isValid) {
    console.log('✅ All required environment variables are properly configured!\n');
  } else {
    console.log('❌ Environment validation failed!\n');
  }

  // Print errors
  if (result.errors.length > 0) {
    console.log('🚨 ERRORS:');
    result.errors.forEach(error => console.log(`  ${error}`));
    console.log('');
  }

  // Print warnings
  if (result.warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    result.warnings.forEach(warning => console.log(`  ${warning}`));
    console.log('');
  }

  // Print missing variables
  if (result.missing.length > 0) {
    console.log('📝 MISSING REQUIRED VARIABLES:');
    result.missing.forEach(variable => console.log(`  ${variable}`));
    console.log('');
  }

  // Print setup instructions
  if (!result.isValid) {
    console.log('📖 SETUP INSTRUCTIONS:');
    console.log('  1. Copy the template from ENVIRONMENT_SETUP.md');
    console.log('  2. Create .env.local with your actual values');
    console.log('  3. Run this validation script again');
    console.log('');
  }

  // Print next steps
  if (result.isValid) {
    console.log('🚀 NEXT STEPS:');
    console.log('  1. Run: npm run dev');
    console.log('  2. Run: npm run db:push (to apply migrations)');
    console.log('  3. Run: npm run test:e2e (to test the application)');
    console.log('');
  }
}

/**
 * Main execution
 */
function main(): void {
  try {
    const result = validateEnvironment();
    printResults(result);
    
    // Exit with error code if validation failed
    if (!result.isValid) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Validation script failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { validateEnvironment };
export type { ValidationResult };
