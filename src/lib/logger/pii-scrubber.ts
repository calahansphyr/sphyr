/**
 * PII Scrubbing Service for Sphyr
 * Prevents sensitive data from being logged
 */

export interface PIIScrubbingConfig {
  enableEmailScrubbing: boolean;
  enablePhoneScrubbing: boolean;
  enableSSNScrubbing: boolean;
  enableCreditCardScrubbing: boolean;
  enableAPIKeyScrubbing: boolean;
  enableCustomPatterns: boolean;
  customPatterns: Array<{
    name: string;
    pattern: RegExp;
    replacement: string;
  }>;
}

export class PIIScrubber {
  private static readonly DEFAULT_CONFIG: PIIScrubbingConfig = {
    enableEmailScrubbing: true,
    enablePhoneScrubbing: true,
    enableSSNScrubbing: true,
    enableCreditCardScrubbing: true,
    enableAPIKeyScrubbing: true,
    enableCustomPatterns: true,
    customPatterns: [],
  };

  private static readonly PII_PATTERNS = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    phone: /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
    creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    apiKey: /\b[A-Za-z0-9]{32,}\b/g,
    jwt: /\beyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\b/g,
    uuid: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
  };

  private static readonly SENSITIVE_KEYS = [
    'password', 'passwd', 'pwd', 'secret', 'token', 'key', 'auth',
    'email', 'phone', 'ssn', 'creditcard', 'credit_card', 'apikey', 'api_key',
    'jwt', 'bearer', 'authorization', 'access_token', 'refresh_token',
    'client_secret', 'client_id', 'private_key', 'public_key',
    'session_id', 'sessionid', 'cookie', 'cookies',
    'firstname', 'first_name', 'lastname', 'last_name', 'fullname', 'full_name',
    'address', 'street', 'city', 'state', 'zip', 'postal', 'country',
    'bank_account', 'routing_number', 'account_number',
  ];

  private config: PIIScrubbingConfig;

  constructor(config: Partial<PIIScrubbingConfig> = {}) {
    this.config = { ...PIIScrubber.DEFAULT_CONFIG, ...config };
  }

  /**
   * Scrub PII from any data structure
   */
  scrub(data: unknown): unknown {
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data === 'string') {
      return this.scrubString(data);
    }

    if (Array.isArray(data)) {
      return data.map(item => this.scrub(item));
    }

    if (typeof data === 'object' && data !== null) {
      return this.scrubObject(data as Record<string, unknown>);
    }

    return data;
  }

  /**
   * Scrub PII from a string
   */
  private scrubString(str: string): string {
    let scrubbed = str;

    // Apply built-in patterns
    if (this.config.enableEmailScrubbing) {
      scrubbed = scrubbed.replace(PIIScrubber.PII_PATTERNS.email, '[EMAIL_REDACTED]');
    }

    if (this.config.enablePhoneScrubbing) {
      scrubbed = scrubbed.replace(PIIScrubber.PII_PATTERNS.phone, '[PHONE_REDACTED]');
    }

    if (this.config.enableSSNScrubbing) {
      scrubbed = scrubbed.replace(PIIScrubber.PII_PATTERNS.ssn, '[SSN_REDACTED]');
    }

    if (this.config.enableCreditCardScrubbing) {
      scrubbed = scrubbed.replace(PIIScrubber.PII_PATTERNS.creditCard, '[CREDIT_CARD_REDACTED]');
    }

    if (this.config.enableAPIKeyScrubbing) {
      scrubbed = scrubbed.replace(PIIScrubber.PII_PATTERNS.apiKey, '[API_KEY_REDACTED]');
      scrubbed = scrubbed.replace(PIIScrubber.PII_PATTERNS.jwt, '[JWT_REDACTED]');
    }

    // Apply custom patterns
    if (this.config.enableCustomPatterns) {
      for (const customPattern of this.config.customPatterns) {
        scrubbed = scrubbed.replace(customPattern.pattern, customPattern.replacement);
      }
    }

    return scrubbed;
  }

  /**
   * Scrub PII from an object
   */
  private scrubObject(obj: Record<string, unknown>): Record<string, unknown> {
    const scrubbed: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      const isSensitiveKey = this.isSensitiveKey(key);
      
      if (isSensitiveKey) {
        scrubbed[key] = '[REDACTED]';
      } else {
        scrubbed[key] = this.scrub(value);
      }
    }

    return scrubbed;
  }

  /**
   * Check if a key is considered sensitive
   */
  private isSensitiveKey(key: string): boolean {
    const lowerKey = key.toLowerCase();
    return PIIScrubber.SENSITIVE_KEYS.some(sensitive => 
      lowerKey.includes(sensitive.toLowerCase())
    );
  }

  /**
   * Create a safe version of the scrubber for production
   */
  static createProductionScrubber(): PIIScrubber {
    return new PIIScrubber({
      enableEmailScrubbing: true,
      enablePhoneScrubbing: true,
      enableSSNScrubbing: true,
      enableCreditCardScrubbing: true,
      enableAPIKeyScrubbing: true,
      enableCustomPatterns: true,
    });
  }

  /**
   * Create a development version with less aggressive scrubbing
   */
  static createDevelopmentScrubber(): PIIScrubber {
    return new PIIScrubber({
      enableEmailScrubbing: false, // Allow emails in dev for debugging
      enablePhoneScrubbing: true,
      enableSSNScrubbing: true,
      enableCreditCardScrubbing: true,
      enableAPIKeyScrubbing: true,
      enableCustomPatterns: true,
    });
  }
}

// Export singleton instances
export const piiScrubber = process.env.NODE_ENV === 'production' 
  ? PIIScrubber.createProductionScrubber()
  : PIIScrubber.createDevelopmentScrubber();
