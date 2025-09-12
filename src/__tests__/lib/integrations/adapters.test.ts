import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AdapterFactory } from '@/lib/integrations/adapter-factory';
import type { 
  GoogleCredentials, 
  GoogleTokens, 
  SlackCredentials, 
  SlackTokens,
  AsanaCredentials,
  AsanaTokens,
  QuickBooksCredentials,
  QuickBooksTokens,
  MicrosoftCredentials,
  MicrosoftTokens,
  ProcoreCredentials,
  ProcoreTokens
} from '@/lib/integrations/adapter-factory';

// Mock all external dependencies
vi.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: vi.fn().mockImplementation(() => ({
        setCredentials: vi.fn(),
        getAccessToken: vi.fn(),
      })),
    },
    gmail: vi.fn().mockImplementation(() => ({
      users: {
        messages: {
          list: vi.fn(),
          get: vi.fn(),
        },
      },
    })),
    drive: vi.fn().mockImplementation(() => ({
      files: {
        list: vi.fn(),
        get: vi.fn(),
      },
    })),
    calendar: vi.fn().mockImplementation(() => ({
      events: {
        list: vi.fn(),
        get: vi.fn(),
      },
    })),
    docs: vi.fn().mockImplementation(() => ({
      documents: {
        get: vi.fn(),
      },
    })),
    sheets: vi.fn().mockImplementation(() => ({
      spreadsheets: {
        get: vi.fn(),
        values: {
          get: vi.fn(),
        },
      },
    })),
    people: vi.fn().mockImplementation(() => ({
      people: {
        get: vi.fn(),
        searchContacts: vi.fn(),
      },
    })),
  },
}));

vi.mock('@slack/web-api', () => ({
  WebClient: vi.fn().mockImplementation(() => ({
    conversations: {
      list: vi.fn(),
      history: vi.fn(),
    },
    search: {
      messages: vi.fn(),
    },
    auth: {
      test: vi.fn(),
    },
  })),
}));

// Mock all adapter classes
vi.mock('@/lib/integrations/google/gmail-adapter', () => ({
  GmailAdapter: vi.fn().mockImplementation(() => ({
    testConnection: vi.fn().mockResolvedValue(true),
  })),
}));

vi.mock('@/lib/integrations/google/google-drive-adapter', () => ({
  GoogleDriveAdapter: vi.fn().mockImplementation(() => ({
    testConnection: vi.fn().mockResolvedValue(true),
  })),
}));

vi.mock('@/lib/integrations/google/google-calendar-adapter', () => ({
  GoogleCalendarAdapter: vi.fn().mockImplementation(() => ({
    testConnection: vi.fn().mockResolvedValue(true),
  })),
}));

vi.mock('@/lib/integrations/google/google-docs-adapter', () => ({
  GoogleDocsAdapter: vi.fn().mockImplementation(() => ({
    testConnection: vi.fn().mockResolvedValue(true),
  })),
}));

vi.mock('@/lib/integrations/google/google-sheets-adapter', () => ({
  GoogleSheetsAdapter: vi.fn().mockImplementation(() => ({
    testConnection: vi.fn().mockResolvedValue(true),
  })),
}));

vi.mock('@/lib/integrations/google/google-people-adapter', () => ({
  GooglePeopleAdapter: vi.fn().mockImplementation(() => ({
    testConnection: vi.fn().mockResolvedValue(true),
  })),
}));

vi.mock('@/lib/integrations/slack-adapter', () => ({
  SlackAdapter: vi.fn().mockImplementation(() => ({
    testConnection: vi.fn().mockResolvedValue(true),
  })),
}));

vi.mock('@/lib/integrations/asana-adapter', () => ({
  AsanaAdapter: vi.fn().mockImplementation(() => ({
    testConnection: vi.fn().mockResolvedValue(true),
  })),
}));

vi.mock('@/lib/integrations/quickbooks-adapter', () => ({
  QuickBooksAdapter: vi.fn().mockImplementation(() => ({
    testConnection: vi.fn().mockResolvedValue(true),
  })),
}));

vi.mock('@/lib/integrations/microsoft/outlook-adapter', () => ({
  OutlookAdapter: vi.fn().mockImplementation(() => ({
    testConnection: vi.fn().mockResolvedValue(true),
  })),
}));

vi.mock('@/lib/integrations/microsoft/onedrive-adapter', () => ({
  OneDriveAdapter: vi.fn().mockImplementation(() => ({
    testConnection: vi.fn().mockResolvedValue(true),
  })),
}));

vi.mock('@/lib/integrations/microsoft/outlook-calendar-adapter', () => ({
  OutlookCalendarAdapter: vi.fn().mockImplementation(() => ({
    testConnection: vi.fn().mockResolvedValue(true),
  })),
}));

vi.mock('@/lib/integrations/microsoft/word-adapter', () => ({
  WordAdapter: vi.fn().mockImplementation(() => ({
    testConnection: vi.fn().mockResolvedValue(true),
  })),
}));

vi.mock('@/lib/integrations/microsoft/excel-adapter', () => ({
  ExcelAdapter: vi.fn().mockImplementation(() => ({
    testConnection: vi.fn().mockResolvedValue(true),
  })),
}));

vi.mock('@/lib/integrations/construction/procore-adapter', () => ({
  ProcoreAdapter: vi.fn().mockImplementation(() => ({
    testConnection: vi.fn().mockResolvedValue(true),
  })),
}));

vi.mock('@/lib/errors', () => ({
  IntegrationError: vi.fn().mockImplementation((provider, message, details) => ({
    name: 'IntegrationError',
    provider,
    message,
    details,
  })),
  toSphyrError: vi.fn().mockImplementation((error) => error),
}));

vi.mock('@/lib/resilience', () => ({
  withRetry: vi.fn().mockImplementation((fn) => fn),
  DEFAULT_RETRY_CONFIG: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
  },
}));

describe('Integration Adapters Tests', () => {
  let mockGoogleCredentials: GoogleCredentials;
  let mockGoogleTokens: GoogleTokens;
  let mockSlackCredentials: SlackCredentials;
  let mockSlackTokens: SlackTokens;
  let mockAsanaCredentials: AsanaCredentials;
  let mockAsanaTokens: AsanaTokens;
  let mockQuickBooksCredentials: QuickBooksCredentials;
  let mockQuickBooksTokens: QuickBooksTokens;
  let mockMicrosoftCredentials: MicrosoftCredentials;
  let mockMicrosoftTokens: MicrosoftTokens;
  let mockProcoreCredentials: ProcoreCredentials;
  let mockProcoreTokens: ProcoreTokens;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock credentials
    mockGoogleCredentials = {
      clientId: 'test-google-client-id',
      clientSecret: 'test-google-client-secret',
      redirectUri: 'https://app.sphyr.com/api/auth/google/callback',
    };

    mockGoogleTokens = {
      accessToken: 'test-google-access-token',
      refreshToken: 'test-google-refresh-token',
    };

    mockSlackCredentials = {
      clientId: 'test-slack-client-id',
      clientSecret: 'test-slack-client-secret',
      redirectUri: 'https://app.sphyr.com/api/auth/slack/callback',
    };

    mockSlackTokens = {
      accessToken: 'test-slack-access-token',
      refreshToken: 'test-slack-refresh-token',
    };

    mockAsanaCredentials = {
      clientId: 'test-asana-client-id',
      clientSecret: 'test-asana-client-secret',
      redirectUri: 'https://app.sphyr.com/api/auth/asana/callback',
    };

    mockAsanaTokens = {
      accessToken: 'test-asana-access-token',
      refreshToken: 'test-asana-refresh-token',
    };

    mockQuickBooksCredentials = {
      clientId: 'test-quickbooks-client-id',
      clientSecret: 'test-quickbooks-client-secret',
      redirectUri: 'https://app.sphyr.com/api/auth/quickbooks/callback',
      environment: 'sandbox',
    };

    mockQuickBooksTokens = {
      accessToken: 'test-quickbooks-access-token',
      refreshToken: 'test-quickbooks-refresh-token',
      companyId: 'test-company-id',
    };

    mockMicrosoftCredentials = {
      clientId: 'test-microsoft-client-id',
      clientSecret: 'test-microsoft-client-secret',
      redirectUri: 'https://app.sphyr.com/api/auth/microsoft/callback',
      tenantId: 'test-tenant-id',
    };

    mockMicrosoftTokens = {
      accessToken: 'test-microsoft-access-token',
      refreshToken: 'test-microsoft-refresh-token',
    };

    mockProcoreCredentials = {
      clientId: 'test-procore-client-id',
      clientSecret: 'test-procore-client-secret',
      redirectUri: 'https://app.sphyr.com/api/auth/procore/callback',
      baseUrl: 'https://api.procore.com',
    };

    mockProcoreTokens = {
      accessToken: 'test-procore-access-token',
      refreshToken: 'test-procore-refresh-token',
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('AdapterFactory', () => {
    describe('Google Adapters', () => {
      it('should create all Google adapters successfully', () => {
        const adapters = AdapterFactory.createGoogleAdapters(mockGoogleCredentials, mockGoogleTokens);

        expect(adapters).toHaveProperty('gmail');
        expect(adapters).toHaveProperty('drive');
        expect(adapters).toHaveProperty('calendar');
        expect(adapters).toHaveProperty('docs');
        expect(adapters).toHaveProperty('sheets');
        expect(adapters).toHaveProperty('people');

        expect(adapters.gmail).toBeDefined();
        expect(adapters.drive).toBeDefined();
        expect(adapters.calendar).toBeDefined();
        expect(adapters.docs).toBeDefined();
        expect(adapters.sheets).toBeDefined();
        expect(adapters.people).toBeDefined();
      });

      it('should create Gmail adapter with correct configuration', () => {
        const adapters = AdapterFactory.createGoogleAdapters(mockGoogleCredentials, mockGoogleTokens);
        
        expect(adapters.gmail).toBeDefined();
        // The adapter should be initialized with the provided credentials and tokens
        expect(adapters.gmail).toBeInstanceOf(Object);
      });

      it('should create Google Drive adapter with correct configuration', () => {
        const adapters = AdapterFactory.createGoogleAdapters(mockGoogleCredentials, mockGoogleTokens);
        
        expect(adapters.drive).toBeDefined();
        expect(adapters.drive).toBeInstanceOf(Object);
      });

      it('should create Google Calendar adapter with correct configuration', () => {
        const adapters = AdapterFactory.createGoogleAdapters(mockGoogleCredentials, mockGoogleTokens);
        
        expect(adapters.calendar).toBeDefined();
        expect(adapters.calendar).toBeInstanceOf(Object);
      });

      it('should create Google Docs adapter with correct configuration', () => {
        const adapters = AdapterFactory.createGoogleAdapters(mockGoogleCredentials, mockGoogleTokens);
        
        expect(adapters.docs).toBeDefined();
        expect(adapters.docs).toBeInstanceOf(Object);
      });

      it('should create Google Sheets adapter with correct configuration', () => {
        const adapters = AdapterFactory.createGoogleAdapters(mockGoogleCredentials, mockGoogleTokens);
        
        expect(adapters.sheets).toBeDefined();
        expect(adapters.sheets).toBeInstanceOf(Object);
      });

      it('should create Google People adapter with correct configuration', () => {
        const adapters = AdapterFactory.createGoogleAdapters(mockGoogleCredentials, mockGoogleTokens);
        
        expect(adapters.people).toBeDefined();
        expect(adapters.people).toBeInstanceOf(Object);
      });
    });

    describe('Slack Adapter', () => {
      it('should create Slack adapter successfully', () => {
        const adapter = AdapterFactory.createSlackAdapter(mockSlackCredentials, mockSlackTokens);

        expect(adapter).toBeDefined();
        expect(adapter).toBeInstanceOf(Object);
      });

      it('should create Slack adapter with correct configuration', () => {
        const adapter = AdapterFactory.createSlackAdapter(mockSlackCredentials, mockSlackTokens);

        expect(adapter).toBeDefined();
        // The adapter should be initialized with the provided credentials and tokens
        expect(adapter).toBeInstanceOf(Object);
      });
    });

    describe('Asana Adapter', () => {
      it('should create Asana adapter successfully', () => {
        const adapter = AdapterFactory.createAsanaAdapter(mockAsanaCredentials, mockAsanaTokens);

        expect(adapter).toBeDefined();
        expect(adapter).toBeInstanceOf(Object);
      });

      it('should create Asana adapter with correct configuration', () => {
        const adapter = AdapterFactory.createAsanaAdapter(mockAsanaCredentials, mockAsanaTokens);

        expect(adapter).toBeDefined();
        expect(adapter).toBeInstanceOf(Object);
      });
    });

    describe('QuickBooks Adapter', () => {
      it('should create QuickBooks adapter successfully', () => {
        const adapter = AdapterFactory.createQuickBooksAdapter(mockQuickBooksCredentials, mockQuickBooksTokens);

        expect(adapter).toBeDefined();
        expect(adapter).toBeInstanceOf(Object);
      });

      it('should create QuickBooks adapter with correct configuration', () => {
        const adapter = AdapterFactory.createQuickBooksAdapter(mockQuickBooksCredentials, mockQuickBooksTokens);

        expect(adapter).toBeDefined();
        expect(adapter).toBeInstanceOf(Object);
      });
    });

    describe('Microsoft Adapters', () => {
      it('should create Microsoft Outlook adapter successfully', () => {
        const adapter = AdapterFactory.createMicrosoftOutlookAdapter(mockMicrosoftCredentials, mockMicrosoftTokens);

        expect(adapter).toBeDefined();
        expect(adapter).toBeInstanceOf(Object);
      });

      it('should create Microsoft OneDrive adapter successfully', () => {
        const adapter = AdapterFactory.createMicrosoftOneDriveAdapter(mockMicrosoftCredentials, mockMicrosoftTokens);

        expect(adapter).toBeDefined();
        expect(adapter).toBeInstanceOf(Object);
      });

      it('should create Microsoft Calendar adapter successfully', () => {
        const adapter = AdapterFactory.createMicrosoftCalendarAdapter(mockMicrosoftCredentials, mockMicrosoftTokens);

        expect(adapter).toBeDefined();
        expect(adapter).toBeInstanceOf(Object);
      });

      it('should create Microsoft Word adapter successfully', () => {
        const adapter = AdapterFactory.createMicrosoftWordAdapter(mockMicrosoftCredentials, mockMicrosoftTokens);

        expect(adapter).toBeDefined();
        expect(adapter).toBeInstanceOf(Object);
      });

      it('should create Microsoft Excel adapter successfully', () => {
        const adapter = AdapterFactory.createMicrosoftExcelAdapter(mockMicrosoftCredentials, mockMicrosoftTokens);

        expect(adapter).toBeDefined();
        expect(adapter).toBeInstanceOf(Object);
      });
    });

    describe('Procore Adapter', () => {
      it('should create Procore adapter successfully', () => {
        const adapter = AdapterFactory.createProcoreAdapter(mockProcoreCredentials, mockProcoreTokens);

        expect(adapter).toBeDefined();
        expect(adapter).toBeInstanceOf(Object);
      });

      it('should create Procore adapter with correct configuration', () => {
        const adapter = AdapterFactory.createProcoreAdapter(mockProcoreCredentials, mockProcoreTokens);

        expect(adapter).toBeDefined();
        expect(adapter).toBeInstanceOf(Object);
      });
    });

    describe('All Adapters Creation', () => {
      it('should create all adapters when all tokens are provided', () => {
        const adapters = AdapterFactory.createAllAdapters(
          mockGoogleCredentials,
          mockGoogleTokens,
          mockSlackCredentials,
          mockSlackTokens,
          mockAsanaCredentials,
          mockAsanaTokens,
          mockQuickBooksCredentials,
          mockQuickBooksTokens,
          mockMicrosoftCredentials,
          mockMicrosoftTokens,
          mockProcoreCredentials,
          mockProcoreTokens
        );

        expect(adapters.google).toBeDefined();
        expect(adapters.slack).toBeDefined();
        expect(adapters.asana).toBeDefined();
        expect(adapters.quickbooks).toBeDefined();
        expect(adapters.microsoft).toBeDefined();
        expect(adapters.procore).toBeDefined();

        expect(adapters.microsoft.outlook).toBeDefined();
        expect(adapters.microsoft.onedrive).toBeDefined();
        expect(adapters.microsoft.calendar).toBeDefined();
        expect(adapters.microsoft.word).toBeDefined();
        expect(adapters.microsoft.excel).toBeDefined();
      });

      it('should create only Google adapters when only Google tokens are provided', () => {
        const adapters = AdapterFactory.createAllAdapters(
          mockGoogleCredentials,
          mockGoogleTokens
        );

        expect(adapters.google).toBeDefined();
        expect(adapters.slack).toBeNull();
        expect(adapters.asana).toBeNull();
        expect(adapters.quickbooks).toBeNull();
        expect(adapters.microsoft.outlook).toBeNull();
        expect(adapters.microsoft.onedrive).toBeNull();
        expect(adapters.microsoft.calendar).toBeNull();
        expect(adapters.microsoft.word).toBeNull();
        expect(adapters.microsoft.excel).toBeNull();
        expect(adapters.procore).toBeNull();
      });

      it('should create adapters with partial token availability', () => {
        const adapters = AdapterFactory.createAllAdapters(
          mockGoogleCredentials,
          mockGoogleTokens,
          mockSlackCredentials,
          mockSlackTokens,
          undefined, // No Asana tokens
          undefined,
          mockQuickBooksCredentials,
          mockQuickBooksTokens
        );

        expect(adapters.google).toBeDefined();
        expect(adapters.slack).toBeDefined();
        expect(adapters.asana).toBeNull();
        expect(adapters.quickbooks).toBeDefined();
        expect(adapters.microsoft.outlook).toBeNull();
        expect(adapters.procore).toBeNull();
      });

      it('should handle missing access tokens gracefully', () => {
        const adapters = AdapterFactory.createAllAdapters(
          mockGoogleCredentials,
          mockGoogleTokens,
          mockSlackCredentials,
          { accessToken: '', refreshToken: 'test-refresh' }, // Empty access token
          mockAsanaCredentials,
          mockAsanaTokens
        );

        expect(adapters.google).toBeDefined();
        expect(adapters.slack).toBeNull(); // Should be null due to empty access token
        expect(adapters.asana).toBeDefined();
      });
    });

    describe('Environment Variable Credentials', () => {
      beforeEach(() => {
        // Set up environment variables
        process.env.GOOGLE_CLIENT_ID = 'env-google-client-id';
        process.env.GOOGLE_CLIENT_SECRET = 'env-google-client-secret';
        process.env.SLACK_CLIENT_ID = 'env-slack-client-id';
        process.env.SLACK_CLIENT_SECRET = 'env-slack-client-secret';
        process.env.ASANA_CLIENT_ID = 'env-asana-client-id';
        process.env.ASANA_CLIENT_SECRET = 'env-asana-client-secret';
        process.env.QUICKBOOKS_CLIENT_ID = 'env-quickbooks-client-id';
        process.env.QUICKBOOKS_CLIENT_SECRET = 'env-quickbooks-client-secret';
        process.env.QUICKBOOKS_ENVIRONMENT = 'production';
        process.env.MICROSOFT_CLIENT_ID = 'env-microsoft-client-id';
        process.env.MICROSOFT_CLIENT_SECRET = 'env-microsoft-client-secret';
        process.env.MICROSOFT_TENANT_ID = 'env-tenant-id';
        process.env.PROCORE_CLIENT_ID = 'env-procore-client-id';
        process.env.PROCORE_CLIENT_SECRET = 'env-procore-client-secret';
        process.env.PROCORE_BASE_URL = 'https://custom.procore.com';
        process.env.NEXT_PUBLIC_BASE_URL = 'https://app.sphyr.com';
      });

      afterEach(() => {
        // Clean up environment variables
        delete process.env.GOOGLE_CLIENT_ID;
        delete process.env.GOOGLE_CLIENT_SECRET;
        delete process.env.SLACK_CLIENT_ID;
        delete process.env.SLACK_CLIENT_SECRET;
        delete process.env.ASANA_CLIENT_ID;
        delete process.env.ASANA_CLIENT_SECRET;
        delete process.env.QUICKBOOKS_CLIENT_ID;
        delete process.env.QUICKBOOKS_CLIENT_SECRET;
        delete process.env.QUICKBOOKS_ENVIRONMENT;
        delete process.env.MICROSOFT_CLIENT_ID;
        delete process.env.MICROSOFT_CLIENT_SECRET;
        delete process.env.MICROSOFT_TENANT_ID;
        delete process.env.PROCORE_CLIENT_ID;
        delete process.env.PROCORE_CLIENT_SECRET;
        delete process.env.PROCORE_BASE_URL;
        delete process.env.NEXT_PUBLIC_BASE_URL;
      });

      it('should create Google credentials from environment variables', () => {
        const credentials = AdapterFactory.createGoogleCredentialsFromEnv();

        expect(credentials).toEqual({
          clientId: 'env-google-client-id',
          clientSecret: 'env-google-client-secret',
          redirectUri: 'https://app.sphyr.com/api/auth/google/callback',
        });
      });

      it('should create Slack credentials from environment variables', () => {
        const credentials = AdapterFactory.createSlackCredentialsFromEnv();

        expect(credentials).toEqual({
          clientId: 'env-slack-client-id',
          clientSecret: 'env-slack-client-secret',
          redirectUri: 'https://app.sphyr.com/api/auth/slack/callback',
        });
      });

      it('should create Asana credentials from environment variables', () => {
        const credentials = AdapterFactory.createAsanaCredentialsFromEnv();

        expect(credentials).toEqual({
          clientId: 'env-asana-client-id',
          clientSecret: 'env-asana-client-secret',
          redirectUri: 'https://app.sphyr.com/api/auth/asana/callback',
        });
      });

      it('should create QuickBooks credentials from environment variables', () => {
        const credentials = AdapterFactory.createQuickBooksCredentialsFromEnv();

        expect(credentials).toEqual({
          clientId: 'env-quickbooks-client-id',
          clientSecret: 'env-quickbooks-client-secret',
          redirectUri: 'https://app.sphyr.com/api/auth/quickbooks/callback',
          environment: 'production',
        });
      });

      it('should create Microsoft credentials from environment variables', () => {
        const credentials = AdapterFactory.createMicrosoftCredentialsFromEnv();

        expect(credentials).toEqual({
          clientId: 'env-microsoft-client-id',
          clientSecret: 'env-microsoft-client-secret',
          redirectUri: 'https://app.sphyr.com/api/auth/microsoft/callback',
          tenantId: 'env-tenant-id',
        });
      });

      it('should create Procore credentials from environment variables', () => {
        const credentials = AdapterFactory.createProcoreCredentialsFromEnv();

        expect(credentials).toEqual({
          clientId: 'env-procore-client-id',
          clientSecret: 'env-procore-client-secret',
          redirectUri: 'https://app.sphyr.com/api/auth/procore/callback',
          baseUrl: 'https://custom.procore.com',
        });
      });

      it('should throw error when required Google environment variables are missing', () => {
        delete process.env.GOOGLE_CLIENT_ID;

        expect(() => AdapterFactory.createGoogleCredentialsFromEnv()).toThrow(
          'Missing required Google OAuth environment variables'
        );
      });

      it('should throw error when required Slack environment variables are missing', () => {
        delete process.env.SLACK_CLIENT_SECRET;

        expect(() => AdapterFactory.createSlackCredentialsFromEnv()).toThrow(
          'Missing required Slack OAuth environment variables'
        );
      });

      it('should throw error when required Asana environment variables are missing', () => {
        delete process.env.ASANA_CLIENT_ID;

        expect(() => AdapterFactory.createAsanaCredentialsFromEnv()).toThrow(
          'Missing required Asana OAuth environment variables'
        );
      });

      it('should throw error when required QuickBooks environment variables are missing', () => {
        delete process.env.QUICKBOOKS_CLIENT_SECRET;

        expect(() => AdapterFactory.createQuickBooksCredentialsFromEnv()).toThrow(
          'Missing required QuickBooks OAuth environment variables'
        );
      });

      it('should throw error when required Microsoft environment variables are missing', () => {
        delete process.env.MICROSOFT_CLIENT_ID;

        expect(() => AdapterFactory.createMicrosoftCredentialsFromEnv()).toThrow(
          'Missing required Microsoft OAuth environment variables'
        );
      });

      it('should throw error when required Procore environment variables are missing', () => {
        delete process.env.PROCORE_CLIENT_SECRET;

        expect(() => AdapterFactory.createProcoreCredentialsFromEnv()).toThrow(
          'Missing required Procore OAuth environment variables'
        );
      });
    });

    describe('Adapter Connection Testing', () => {
      it('should test all adapter connections successfully', async () => {
        // Create mock adapters with proper testConnection method
        const mockAdapter = {
          testConnection: vi.fn().mockResolvedValue(true),
        };

        // Mock the adapter constructors to return our mock
        const { GmailAdapter } = await import('@/lib/integrations/google/gmail-adapter');
        const { GoogleDriveAdapter } = await import('@/lib/integrations/google/google-drive-adapter');
        const { GoogleCalendarAdapter } = await import('@/lib/integrations/google/google-calendar-adapter');
        const { GoogleDocsAdapter } = await import('@/lib/integrations/google/google-docs-adapter');
        const { GoogleSheetsAdapter } = await import('@/lib/integrations/google/google-sheets-adapter');
        const { GooglePeopleAdapter } = await import('@/lib/integrations/google/google-people-adapter');
        const { SlackAdapter } = await import('@/lib/integrations/slack-adapter');
        const { AsanaAdapter } = await import('@/lib/integrations/asana-adapter');
        const { QuickBooksAdapter } = await import('@/lib/integrations/quickbooks-adapter');
        const { OutlookAdapter } = await import('@/lib/integrations/microsoft/outlook-adapter');
        const { OneDriveAdapter } = await import('@/lib/integrations/microsoft/onedrive-adapter');
        const { OutlookCalendarAdapter } = await import('@/lib/integrations/microsoft/outlook-calendar-adapter');
        const { WordAdapter } = await import('@/lib/integrations/microsoft/word-adapter');
        const { ExcelAdapter } = await import('@/lib/integrations/microsoft/excel-adapter');
        const { ProcoreAdapter } = await import('@/lib/integrations/construction/procore-adapter');

        vi.mocked(GmailAdapter).mockReturnValue(mockAdapter as any);
        vi.mocked(GoogleDriveAdapter).mockReturnValue(mockAdapter as any);
        vi.mocked(GoogleCalendarAdapter).mockReturnValue(mockAdapter as any);
        vi.mocked(GoogleDocsAdapter).mockReturnValue(mockAdapter as any);
        vi.mocked(GoogleSheetsAdapter).mockReturnValue(mockAdapter as any);
        vi.mocked(GooglePeopleAdapter).mockReturnValue(mockAdapter as any);
        vi.mocked(SlackAdapter).mockReturnValue(mockAdapter as any);
        vi.mocked(AsanaAdapter).mockReturnValue(mockAdapter as any);
        vi.mocked(QuickBooksAdapter).mockReturnValue(mockAdapter as any);
        vi.mocked(OutlookAdapter).mockReturnValue(mockAdapter as any);
        vi.mocked(OneDriveAdapter).mockReturnValue(mockAdapter as any);
        vi.mocked(OutlookCalendarAdapter).mockReturnValue(mockAdapter as any);
        vi.mocked(WordAdapter).mockReturnValue(mockAdapter as any);
        vi.mocked(ExcelAdapter).mockReturnValue(mockAdapter as any);
        vi.mocked(ProcoreAdapter).mockReturnValue(mockAdapter as any);

        const adapters = AdapterFactory.createAllAdapters(
          mockGoogleCredentials,
          mockGoogleTokens,
          mockSlackCredentials,
          mockSlackTokens,
          mockAsanaCredentials,
          mockAsanaTokens,
          mockQuickBooksCredentials,
          mockQuickBooksTokens,
          mockMicrosoftCredentials,
          mockMicrosoftTokens,
          mockProcoreCredentials,
          mockProcoreTokens
        );

        const results = await AdapterFactory.testAdapterConnections(adapters);

        expect(results.gmail).toBe(true);
        expect(results.drive).toBe(true);
        expect(results.calendar).toBe(true);
        expect(results.docs).toBe(true);
        expect(results.sheets).toBe(true);
        expect(results.people).toBe(true);
        expect(results.slack).toBe(true);
        expect(results.asana).toBe(true);
        expect(results.quickbooks).toBe(true);
        expect(results.microsoft_outlook).toBe(true);
        expect(results.microsoft_onedrive).toBe(true);
        expect(results.microsoft_calendar).toBe(true);
        expect(results.microsoft_word).toBe(true);
        expect(results.microsoft_excel).toBe(true);
        expect(results.procore).toBe(true);
      });

      it('should handle connection test failures gracefully', async () => {
        // Create mock adapters with failing testConnection method for Gmail and Slack
        const mockFailingAdapter = {
          testConnection: vi.fn().mockRejectedValue(new Error('Connection failed')),
        };

        const mockSuccessAdapter = {
          testConnection: vi.fn().mockResolvedValue(true),
        };

        const { GmailAdapter } = await import('@/lib/integrations/google/gmail-adapter');
        const { GoogleDriveAdapter } = await import('@/lib/integrations/google/google-drive-adapter');
        const { GoogleCalendarAdapter } = await import('@/lib/integrations/google/google-calendar-adapter');
        const { GoogleDocsAdapter } = await import('@/lib/integrations/google/google-docs-adapter');
        const { GoogleSheetsAdapter } = await import('@/lib/integrations/google/google-sheets-adapter');
        const { GooglePeopleAdapter } = await import('@/lib/integrations/google/google-people-adapter');
        const { SlackAdapter } = await import('@/lib/integrations/slack-adapter');

        vi.mocked(GmailAdapter).mockReturnValue(mockFailingAdapter as any);
        vi.mocked(GoogleDriveAdapter).mockReturnValue(mockSuccessAdapter as any);
        vi.mocked(GoogleCalendarAdapter).mockReturnValue(mockSuccessAdapter as any);
        vi.mocked(GoogleDocsAdapter).mockReturnValue(mockSuccessAdapter as any);
        vi.mocked(GoogleSheetsAdapter).mockReturnValue(mockSuccessAdapter as any);
        vi.mocked(GooglePeopleAdapter).mockReturnValue(mockSuccessAdapter as any);
        vi.mocked(SlackAdapter).mockReturnValue(mockFailingAdapter as any);

        const adapters = AdapterFactory.createAllAdapters(
          mockGoogleCredentials,
          mockGoogleTokens,
          mockSlackCredentials,
          mockSlackTokens
        );

        const results = await AdapterFactory.testAdapterConnections(adapters);

        expect(results.gmail).toBe(false);
        expect(results.drive).toBe(true);
        expect(results.calendar).toBe(true);
        expect(results.docs).toBe(true);
        expect(results.sheets).toBe(true);
        expect(results.people).toBe(true);
        expect(results.slack).toBe(false);
        expect(results.asana).toBe(false); // Not created, should be false
        expect(results.quickbooks).toBe(false); // Not created, should be false
      });

      it('should handle null adapters correctly', async () => {
        // Create mock adapters with successful testConnection method
        const mockSuccessAdapter = {
          testConnection: vi.fn().mockResolvedValue(true),
        };

        const { GmailAdapter } = await import('@/lib/integrations/google/gmail-adapter');
        const { GoogleDriveAdapter } = await import('@/lib/integrations/google/google-drive-adapter');
        const { GoogleCalendarAdapter } = await import('@/lib/integrations/google/google-calendar-adapter');
        const { GoogleDocsAdapter } = await import('@/lib/integrations/google/google-docs-adapter');
        const { GoogleSheetsAdapter } = await import('@/lib/integrations/google/google-sheets-adapter');
        const { GooglePeopleAdapter } = await import('@/lib/integrations/google/google-people-adapter');

        vi.mocked(GmailAdapter).mockReturnValue(mockSuccessAdapter as any);
        vi.mocked(GoogleDriveAdapter).mockReturnValue(mockSuccessAdapter as any);
        vi.mocked(GoogleCalendarAdapter).mockReturnValue(mockSuccessAdapter as any);
        vi.mocked(GoogleDocsAdapter).mockReturnValue(mockSuccessAdapter as any);
        vi.mocked(GoogleSheetsAdapter).mockReturnValue(mockSuccessAdapter as any);
        vi.mocked(GooglePeopleAdapter).mockReturnValue(mockSuccessAdapter as any);

        const adapters = AdapterFactory.createAllAdapters(
          mockGoogleCredentials,
          mockGoogleTokens
        );

        const results = await AdapterFactory.testAdapterConnections(adapters);

        expect(results.gmail).toBe(true);
        expect(results.drive).toBe(true);
        expect(results.calendar).toBe(true);
        expect(results.docs).toBe(true);
        expect(results.sheets).toBe(true);
        expect(results.people).toBe(true);
        expect(results.slack).toBe(false); // Null adapter
        expect(results.asana).toBe(false); // Null adapter
        expect(results.quickbooks).toBe(false); // Null adapter
        expect(results.microsoft_outlook).toBe(false); // Null adapter
        expect(results.microsoft_onedrive).toBe(false); // Null adapter
        expect(results.microsoft_calendar).toBe(false); // Null adapter
        expect(results.microsoft_word).toBe(false); // Null adapter
        expect(results.microsoft_excel).toBe(false); // Null adapter
        expect(results.procore).toBe(false); // Null adapter
      });
    });

    describe('Available Adapters', () => {
      it('should return list of available adapters', () => {
        const adapters = AdapterFactory.createAllAdapters(
          mockGoogleCredentials,
          mockGoogleTokens,
          mockSlackCredentials,
          mockSlackTokens,
          mockAsanaCredentials,
          mockAsanaTokens
        );

        const available = AdapterFactory.getAvailableAdapters(adapters);

        expect(available).toContain('gmail');
        expect(available).toContain('drive');
        expect(available).toContain('calendar');
        expect(available).toContain('docs');
        expect(available).toContain('sheets');
        expect(available).toContain('people');
        expect(available).toContain('slack');
        expect(available).toContain('asana');
        expect(available).not.toContain('quickbooks');
        expect(available).not.toContain('microsoft_outlook');
        expect(available).not.toContain('procore');
      });

      it('should return only Google adapters when no other adapters are available', () => {
        const adapters = AdapterFactory.createAllAdapters(
          mockGoogleCredentials,
          mockGoogleTokens
        );

        const available = AdapterFactory.getAvailableAdapters(adapters);

        expect(available).toEqual(['gmail', 'drive', 'calendar', 'docs', 'sheets', 'people']);
      });

      it('should return all adapters when all are available', () => {
        const adapters = AdapterFactory.createAllAdapters(
          mockGoogleCredentials,
          mockGoogleTokens,
          mockSlackCredentials,
          mockSlackTokens,
          mockAsanaCredentials,
          mockAsanaTokens,
          mockQuickBooksCredentials,
          mockQuickBooksTokens,
          mockMicrosoftCredentials,
          mockMicrosoftTokens,
          mockProcoreCredentials,
          mockProcoreTokens
        );

        const available = AdapterFactory.getAvailableAdapters(adapters);

        expect(available).toContain('gmail');
        expect(available).toContain('drive');
        expect(available).toContain('calendar');
        expect(available).toContain('docs');
        expect(available).toContain('sheets');
        expect(available).toContain('people');
        expect(available).toContain('slack');
        expect(available).toContain('asana');
        expect(available).toContain('quickbooks');
        expect(available).toContain('microsoft_outlook');
        expect(available).toContain('microsoft_onedrive');
        expect(available).toContain('microsoft_calendar');
        expect(available).toContain('microsoft_word');
        expect(available).toContain('microsoft_excel');
        expect(available).toContain('procore');
      });
    });

    describe('Adapters from Environment', () => {
      beforeEach(() => {
        // Set up environment variables
        process.env.GOOGLE_CLIENT_ID = 'env-google-client-id';
        process.env.GOOGLE_CLIENT_SECRET = 'env-google-client-secret';
        process.env.SLACK_CLIENT_ID = 'env-slack-client-id';
        process.env.SLACK_CLIENT_SECRET = 'env-slack-client-secret';
        process.env.NEXT_PUBLIC_BASE_URL = 'https://app.sphyr.com';
      });

      afterEach(() => {
        // Clean up environment variables
        delete process.env.GOOGLE_CLIENT_ID;
        delete process.env.GOOGLE_CLIENT_SECRET;
        delete process.env.SLACK_CLIENT_ID;
        delete process.env.SLACK_CLIENT_SECRET;
        delete process.env.NEXT_PUBLIC_BASE_URL;
      });

      it('should create adapters from environment variables and tokens', () => {
        const adapters = AdapterFactory.createAdaptersFromEnv(
          mockGoogleTokens,
          mockSlackTokens
        );

        expect(adapters.google).toBeDefined();
        expect(adapters.slack).toBeDefined();
        expect(adapters.asana).toBeNull();
        expect(adapters.quickbooks).toBeNull();
        expect(adapters.microsoft.outlook).toBeNull();
        expect(adapters.procore).toBeNull();
      });

      it('should handle missing environment variables gracefully', () => {
        delete process.env.SLACK_CLIENT_ID;

        expect(() => AdapterFactory.createAdaptersFromEnv(
          mockGoogleTokens,
          mockSlackTokens
        )).toThrow('Missing required Slack OAuth environment variables');
      });
    });
  });
});
