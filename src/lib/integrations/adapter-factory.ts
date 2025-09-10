/**
 * Adapter Factory
 * Centralized factory for creating integration adapters with proper configuration
 * Reduces code duplication and provides consistent adapter initialization
 */

import { GmailAdapter, type GmailAdapterConfig } from './google/gmail-adapter';
import { GoogleDriveAdapter } from './google/google-drive-adapter';
import { GoogleCalendarAdapter } from './google/google-calendar-adapter';
import { GoogleDocsAdapter } from './google/google-docs-adapter';
import { GoogleSheetsAdapter } from './google/google-sheets-adapter';
import { GooglePeopleAdapter } from './google/google-people-adapter';
import { SlackAdapter, type SlackAdapterConfig } from './slack-adapter';
import { AsanaAdapter, type AsanaAdapterConfig } from './asana-adapter';
import { QuickBooksAdapter, type QuickBooksAdapterConfig } from './quickbooks-adapter';
import { OutlookAdapter, type OutlookAdapterConfig } from './microsoft/outlook-adapter';
import { OneDriveAdapter, type OneDriveAdapterConfig } from './microsoft/onedrive-adapter';
import { OutlookCalendarAdapter, type OutlookCalendarAdapterConfig } from './microsoft/outlook-calendar-adapter';
import { WordAdapter, type WordAdapterConfig } from './microsoft/word-adapter';
import { ExcelAdapter, type ExcelAdapterConfig } from './microsoft/excel-adapter';
import { ProcoreAdapter, type ProcoreAdapterConfig } from './construction/procore-adapter';

/**
 * Google OAuth credentials interface
 */
export interface GoogleCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

/**
 * Google OAuth tokens interface
 */
export interface GoogleTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Slack OAuth credentials interface
 */
export interface SlackCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

/**
 * Slack OAuth tokens interface
 */
export interface SlackTokens {
  accessToken: string;
  refreshToken?: string;
}

/**
 * Asana OAuth credentials interface
 */
export interface AsanaCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

/**
 * Asana OAuth tokens interface
 */
export interface AsanaTokens {
  accessToken: string;
  refreshToken?: string;
}

/**
 * QuickBooks OAuth credentials interface
 */
export interface QuickBooksCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  environment: 'sandbox' | 'production';
}

/**
 * QuickBooks OAuth tokens interface
 */
export interface QuickBooksTokens {
  accessToken: string;
  refreshToken: string;
  companyId: string;
}

/**
 * Microsoft OAuth credentials interface
 */
export interface MicrosoftCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  tenantId: string;
}

/**
 * Microsoft OAuth tokens interface
 */
export interface MicrosoftTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Procore OAuth credentials interface
 */
export interface ProcoreCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  baseUrl: string;
}

/**
 * Procore OAuth tokens interface
 */
export interface ProcoreTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Collection of all Google adapters
 */
export interface GoogleAdapters {
  gmail: GmailAdapter;
  drive: GoogleDriveAdapter;
  calendar: GoogleCalendarAdapter;
  docs: GoogleDocsAdapter;
  sheets: GoogleSheetsAdapter;
  people: GooglePeopleAdapter;
}

/**
 * Collection of all available adapters
 */
export interface AllAdapters {
  google: GoogleAdapters;
  slack: SlackAdapter | null;
  asana: AsanaAdapter | null;
  quickbooks: QuickBooksAdapter | null;
  microsoft: {
    outlook: OutlookAdapter | null;
    onedrive: OneDriveAdapter | null;
    calendar: OutlookCalendarAdapter | null;
    word: WordAdapter | null;
    excel: ExcelAdapter | null;
  };
  procore: ProcoreAdapter | null;
}

/**
 * Adapter Factory Class
 * Provides methods to create and configure integration adapters
 */
export class AdapterFactory {
  /**
   * Create all Google Workspace adapters with shared credentials
   */
  static createGoogleAdapters(
    credentials: GoogleCredentials,
    tokens: GoogleTokens
  ): GoogleAdapters {
    const adapterConfig: GmailAdapterConfig = {
      credentials,
      tokens,
    };

    return {
      gmail: new GmailAdapter(adapterConfig),
      drive: new GoogleDriveAdapter(adapterConfig),
      calendar: new GoogleCalendarAdapter(adapterConfig),
      docs: new GoogleDocsAdapter(adapterConfig),
      sheets: new GoogleSheetsAdapter(adapterConfig),
      people: new GooglePeopleAdapter(adapterConfig),
    };
  }

  /**
   * Create a Slack adapter with provided credentials and tokens
   */
  static createSlackAdapter(
    credentials: SlackCredentials,
    tokens: SlackTokens
  ): SlackAdapter {
    const adapterConfig: SlackAdapterConfig = {
      credentials,
      tokens,
    };

    return new SlackAdapter(adapterConfig);
  }

  /**
   * Create an Asana adapter with provided credentials and tokens
   */
  static createAsanaAdapter(
    credentials: AsanaCredentials,
    tokens: AsanaTokens
  ): AsanaAdapter {
    const adapterConfig: AsanaAdapterConfig = {
      credentials,
      tokens,
    };

    return new AsanaAdapter(adapterConfig);
  }

  /**
   * Create a QuickBooks adapter with provided credentials and tokens
   */
  static createQuickBooksAdapter(
    credentials: QuickBooksCredentials,
    tokens: QuickBooksTokens
  ): QuickBooksAdapter {
    const adapterConfig: QuickBooksAdapterConfig = {
      credentials,
      tokens,
    };

    return new QuickBooksAdapter(adapterConfig);
  }

  /**
   * Create a Microsoft Outlook adapter with provided credentials and tokens
   */
  static createMicrosoftOutlookAdapter(
    credentials: MicrosoftCredentials,
    tokens: MicrosoftTokens
  ): OutlookAdapter {
    const adapterConfig: OutlookAdapterConfig = {
      credentials,
      tokens,
    };

    return new OutlookAdapter(adapterConfig);
  }

  /**
   * Create a Microsoft OneDrive adapter with provided credentials and tokens
   */
  static createMicrosoftOneDriveAdapter(
    credentials: MicrosoftCredentials,
    tokens: MicrosoftTokens
  ): OneDriveAdapter {
    const adapterConfig: OneDriveAdapterConfig = {
      credentials,
      tokens,
    };

    return new OneDriveAdapter(adapterConfig);
  }

  /**
   * Create a Microsoft Outlook Calendar adapter with provided credentials and tokens
   */
  static createMicrosoftCalendarAdapter(
    credentials: MicrosoftCredentials,
    tokens: MicrosoftTokens
  ): OutlookCalendarAdapter {
    const adapterConfig: OutlookCalendarAdapterConfig = {
      credentials,
      tokens,
    };

    return new OutlookCalendarAdapter(adapterConfig);
  }

  /**
   * Create a Microsoft Word adapter with provided credentials and tokens
   */
  static createMicrosoftWordAdapter(
    credentials: MicrosoftCredentials,
    tokens: MicrosoftTokens
  ): WordAdapter {
    const adapterConfig: WordAdapterConfig = {
      credentials,
      tokens,
    };

    return new WordAdapter(adapterConfig);
  }

  /**
   * Create a Microsoft Excel adapter with provided credentials and tokens
   */
  static createMicrosoftExcelAdapter(
    credentials: MicrosoftCredentials,
    tokens: MicrosoftTokens
  ): ExcelAdapter {
    const adapterConfig: ExcelAdapterConfig = {
      credentials,
      tokens,
    };

    return new ExcelAdapter(adapterConfig);
  }

  /**
   * Create a Procore adapter with provided credentials and tokens
   */
  static createProcoreAdapter(
    credentials: ProcoreCredentials,
    tokens: ProcoreTokens
  ): ProcoreAdapter {
    const adapterConfig: ProcoreAdapterConfig = {
      credentials,
      tokens,
    };

    return new ProcoreAdapter(adapterConfig);
  }

  /**
   * Create all available adapters based on provided tokens
   * Returns null for adapters that don't have valid tokens
   */
  static createAllAdapters(
    googleCredentials: GoogleCredentials,
    googleTokens: GoogleTokens,
    slackCredentials?: SlackCredentials,
    slackTokens?: SlackTokens,
    asanaCredentials?: AsanaCredentials,
    asanaTokens?: AsanaTokens,
    quickbooksCredentials?: QuickBooksCredentials,
    quickbooksTokens?: QuickBooksTokens,
    microsoftCredentials?: MicrosoftCredentials,
    microsoftTokens?: MicrosoftTokens,
    procoreCredentials?: ProcoreCredentials,
    procoreTokens?: ProcoreTokens
  ): AllAdapters {
    const googleAdapters = this.createGoogleAdapters(googleCredentials, googleTokens);
    
    let slackAdapter: SlackAdapter | null = null;
    if (slackCredentials && slackTokens && slackTokens.accessToken) {
      slackAdapter = this.createSlackAdapter(slackCredentials, slackTokens);
    }

    let asanaAdapter: AsanaAdapter | null = null;
    if (asanaCredentials && asanaTokens && asanaTokens.accessToken) {
      asanaAdapter = this.createAsanaAdapter(asanaCredentials, asanaTokens);
    }

    let quickbooksAdapter: QuickBooksAdapter | null = null;
    if (quickbooksCredentials && quickbooksTokens && quickbooksTokens.accessToken) {
      quickbooksAdapter = this.createQuickBooksAdapter(quickbooksCredentials, quickbooksTokens);
    }

    let microsoftOutlookAdapter: OutlookAdapter | null = null;
    let microsoftOneDriveAdapter: OneDriveAdapter | null = null;
    let microsoftCalendarAdapter: OutlookCalendarAdapter | null = null;
    let microsoftWordAdapter: WordAdapter | null = null;
    let microsoftExcelAdapter: ExcelAdapter | null = null;
    
    if (microsoftCredentials && microsoftTokens && microsoftTokens.accessToken) {
      microsoftOutlookAdapter = this.createMicrosoftOutlookAdapter(microsoftCredentials, microsoftTokens);
      microsoftOneDriveAdapter = this.createMicrosoftOneDriveAdapter(microsoftCredentials, microsoftTokens);
      microsoftCalendarAdapter = this.createMicrosoftCalendarAdapter(microsoftCredentials, microsoftTokens);
      microsoftWordAdapter = this.createMicrosoftWordAdapter(microsoftCredentials, microsoftTokens);
      microsoftExcelAdapter = this.createMicrosoftExcelAdapter(microsoftCredentials, microsoftTokens);
    }

    let procoreAdapter: ProcoreAdapter | null = null;
    if (procoreCredentials && procoreTokens && procoreTokens.accessToken) {
      procoreAdapter = this.createProcoreAdapter(procoreCredentials, procoreTokens);
    }

    return {
      google: googleAdapters,
      slack: slackAdapter,
      asana: asanaAdapter,
      quickbooks: quickbooksAdapter,
      microsoft: {
        outlook: microsoftOutlookAdapter,
        onedrive: microsoftOneDriveAdapter,
        calendar: microsoftCalendarAdapter,
        word: microsoftWordAdapter,
        excel: microsoftExcelAdapter,
      },
      procore: procoreAdapter,
    };
  }

  /**
   * Create Google credentials from environment variables
   */
  static createGoogleCredentialsFromEnv(): GoogleCredentials {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    if (!clientId || !clientSecret || !baseUrl) {
      throw new Error('Missing required Google OAuth environment variables');
    }

    return {
      clientId,
      clientSecret,
      redirectUri: `${baseUrl}/api/auth/google/callback`,
    };
  }

  /**
   * Create Slack credentials from environment variables
   */
  static createSlackCredentialsFromEnv(): SlackCredentials {
    const clientId = process.env.SLACK_CLIENT_ID;
    const clientSecret = process.env.SLACK_CLIENT_SECRET;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    if (!clientId || !clientSecret || !baseUrl) {
      throw new Error('Missing required Slack OAuth environment variables');
    }

    return {
      clientId,
      clientSecret,
      redirectUri: `${baseUrl}/api/auth/slack/callback`,
    };
  }

  /**
   * Create Asana credentials from environment variables
   */
  static createAsanaCredentialsFromEnv(): AsanaCredentials {
    const clientId = process.env.ASANA_CLIENT_ID;
    const clientSecret = process.env.ASANA_CLIENT_SECRET;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    if (!clientId || !clientSecret || !baseUrl) {
      throw new Error('Missing required Asana OAuth environment variables');
    }

    return {
      clientId,
      clientSecret,
      redirectUri: `${baseUrl}/api/auth/asana/callback`,
    };
  }

  /**
   * Create QuickBooks credentials from environment variables
   */
  static createQuickBooksCredentialsFromEnv(): QuickBooksCredentials {
    const clientId = process.env.QUICKBOOKS_CLIENT_ID;
    const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const environment = (process.env.QUICKBOOKS_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox';

    if (!clientId || !clientSecret || !baseUrl) {
      throw new Error('Missing required QuickBooks OAuth environment variables');
    }

    return {
      clientId,
      clientSecret,
      redirectUri: `${baseUrl}/api/auth/quickbooks/callback`,
      environment,
    };
  }

  /**
   * Create Microsoft credentials from environment variables
   */
  static createMicrosoftCredentialsFromEnv(): MicrosoftCredentials {
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
    const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    if (!clientId || !clientSecret || !baseUrl) {
      throw new Error('Missing required Microsoft OAuth environment variables');
    }

    return {
      clientId,
      clientSecret,
      redirectUri: `${baseUrl}/api/auth/microsoft/callback`,
      tenantId,
    };
  }

  /**
   * Create Procore credentials from environment variables
   */
  static createProcoreCredentialsFromEnv(): ProcoreCredentials {
    const clientId = process.env.PROCORE_CLIENT_ID;
    const clientSecret = process.env.PROCORE_CLIENT_SECRET;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const procoreBaseUrl = process.env.PROCORE_BASE_URL || 'https://api.procore.com';

    if (!clientId || !clientSecret || !baseUrl) {
      throw new Error('Missing required Procore OAuth environment variables');
    }

    return {
      clientId,
      clientSecret,
      redirectUri: `${baseUrl}/api/auth/procore/callback`,
      baseUrl: procoreBaseUrl,
    };
  }

  /**
   * Create adapters from environment variables and provided tokens
   * Convenience method for API routes
   */
  static createAdaptersFromEnv(
    googleTokens: GoogleTokens,
    slackTokens?: SlackTokens,
    asanaTokens?: AsanaTokens,
    quickbooksTokens?: QuickBooksTokens,
    microsoftTokens?: MicrosoftTokens,
    procoreTokens?: ProcoreTokens
  ): AllAdapters {
    const googleCredentials = this.createGoogleCredentialsFromEnv();
    const slackCredentials = slackTokens ? this.createSlackCredentialsFromEnv() : undefined;
    const asanaCredentials = asanaTokens ? this.createAsanaCredentialsFromEnv() : undefined;
    const quickbooksCredentials = quickbooksTokens ? this.createQuickBooksCredentialsFromEnv() : undefined;
    const microsoftCredentials = microsoftTokens ? this.createMicrosoftCredentialsFromEnv() : undefined;
    const procoreCredentials = procoreTokens ? this.createProcoreCredentialsFromEnv() : undefined;

    return this.createAllAdapters(
      googleCredentials,
      googleTokens,
      slackCredentials,
      slackTokens,
      asanaCredentials,
      asanaTokens,
      quickbooksCredentials,
      quickbooksTokens,
      microsoftCredentials,
      microsoftTokens,
      procoreCredentials,
      procoreTokens
    );
  }

  /**
   * Test connection for all provided adapters
   * Returns a map of adapter names to their connection status
   */
  static async testAdapterConnections(adapters: AllAdapters): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    // Test Google adapters
    const googleTests = await Promise.allSettled([
      adapters.google.gmail.testConnection(),
      adapters.google.drive.testConnection(),
      adapters.google.calendar.testConnection(),
      adapters.google.docs.testConnection(),
      adapters.google.sheets.testConnection(),
      adapters.google.people.testConnection(),
    ]);

    results.gmail = googleTests[0].status === 'fulfilled' && googleTests[0].value;
    results.drive = googleTests[1].status === 'fulfilled' && googleTests[1].value;
    results.calendar = googleTests[2].status === 'fulfilled' && googleTests[2].value;
    results.docs = googleTests[3].status === 'fulfilled' && googleTests[3].value;
    results.sheets = googleTests[4].status === 'fulfilled' && googleTests[4].value;
    results.people = googleTests[5].status === 'fulfilled' && googleTests[5].value;

    // Test Slack adapter if available
    if (adapters.slack) {
      try {
        results.slack = await adapters.slack.testConnection();
      } catch {
        results.slack = false;
      }
    } else {
      results.slack = false;
    }

    // Test Asana adapter if available
    if (adapters.asana) {
      try {
        results.asana = await adapters.asana.testConnection();
      } catch {
        results.asana = false;
      }
    } else {
      results.asana = false;
    }

    // Test QuickBooks adapter if available
    if (adapters.quickbooks) {
      try {
        results.quickbooks = await adapters.quickbooks.testConnection();
      } catch {
        results.quickbooks = false;
      }
    } else {
      results.quickbooks = false;
    }

    // Test Microsoft adapters if available
    if (adapters.microsoft.outlook) {
      try {
        results.microsoft_outlook = await adapters.microsoft.outlook.testConnection();
      } catch {
        results.microsoft_outlook = false;
      }
    } else {
      results.microsoft_outlook = false;
    }

    if (adapters.microsoft.onedrive) {
      try {
        results.microsoft_onedrive = await adapters.microsoft.onedrive.testConnection();
      } catch {
        results.microsoft_onedrive = false;
      }
    } else {
      results.microsoft_onedrive = false;
    }

    if (adapters.microsoft.calendar) {
      try {
        results.microsoft_calendar = await adapters.microsoft.calendar.testConnection();
      } catch {
        results.microsoft_calendar = false;
      }
    } else {
      results.microsoft_calendar = false;
    }

    if (adapters.microsoft.word) {
      try {
        results.microsoft_word = await adapters.microsoft.word.testConnection();
      } catch {
        results.microsoft_word = false;
      }
    } else {
      results.microsoft_word = false;
    }

    if (adapters.microsoft.excel) {
      try {
        results.microsoft_excel = await adapters.microsoft.excel.testConnection();
      } catch {
        results.microsoft_excel = false;
      }
    } else {
      results.microsoft_excel = false;
    }

    // Test Procore adapter if available
    if (adapters.procore) {
      try {
        results.procore = await adapters.procore.testConnection();
      } catch {
        results.procore = false;
      }
    } else {
      results.procore = false;
    }

    return results;
  }

  /**
   * Get list of available adapter names
   */
  static getAvailableAdapters(adapters: AllAdapters): string[] {
    const available: string[] = [];

    // Always include Google adapters
    available.push('gmail', 'drive', 'calendar', 'docs', 'sheets', 'people');

    // Include Slack if available
    if (adapters.slack) {
      available.push('slack');
    }

    // Include Asana if available
    if (adapters.asana) {
      available.push('asana');
    }

    // Include QuickBooks if available
    if (adapters.quickbooks) {
      available.push('quickbooks');
    }

    // Include Microsoft adapters if available
    if (adapters.microsoft.outlook) {
      available.push('microsoft_outlook');
    }
    if (adapters.microsoft.onedrive) {
      available.push('microsoft_onedrive');
    }
    if (adapters.microsoft.calendar) {
      available.push('microsoft_calendar');
    }
    if (adapters.microsoft.word) {
      available.push('microsoft_word');
    }
    if (adapters.microsoft.excel) {
      available.push('microsoft_excel');
    }

    // Include Procore if available
    if (adapters.procore) {
      available.push('procore');
    }

    return available;
  }
}
