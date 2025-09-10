/**
 * Integrations configuration
 * Contains all client IDs, secrets, and scopes for third-party integrations
 */

export interface IntegrationConfig {
  clientId: string;
  clientSecret: string;
  scopes: string[];
  redirectUri: string;
  apiUrl?: string;
  authUrl?: string;
  tokenUrl?: string;
}

export interface IntegrationsConfig {
  google: {
    gmail: IntegrationConfig;
    drive: IntegrationConfig;
    calendar: IntegrationConfig;
  };
  asana: IntegrationConfig;
  hubspot: IntegrationConfig;
  quickbooks: IntegrationConfig;
  slack: IntegrationConfig;
  procore: IntegrationConfig;
  buildertrend: IntegrationConfig;
}

export const integrationsConfig: IntegrationsConfig = {
  google: {
    gmail: {
      clientId: process.env.GOOGLE_GMAIL_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_GMAIL_CLIENT_SECRET || '',
      scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
      redirectUri: process.env.GOOGLE_GMAIL_REDIRECT_URI || '',
    },
    drive: {
      clientId: process.env.GOOGLE_DRIVE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET || '',
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
      redirectUri: process.env.GOOGLE_DRIVE_REDIRECT_URI || '',
    },
    calendar: {
      clientId: process.env.GOOGLE_CALENDAR_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET || '',
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
      redirectUri: process.env.GOOGLE_CALENDAR_REDIRECT_URI || '',
    },
  },
  asana: {
    clientId: process.env.ASANA_CLIENT_ID || '',
    clientSecret: process.env.ASANA_CLIENT_SECRET || '',
    scopes: ['default'],
    redirectUri: process.env.ASANA_REDIRECT_URI || '',
    apiUrl: 'https://app.asana.com/api/1.0',
    authUrl: 'https://app.asana.com/-/oauth_authorize',
    tokenUrl: 'https://app.asana.com/-/oauth_token',
  },
  hubspot: {
    clientId: process.env.HUBSPOT_CLIENT_ID || '',
    clientSecret: process.env.HUBSPOT_CLIENT_SECRET || '',
    scopes: ['crm.objects.contacts.read', 'crm.objects.companies.read'],
    redirectUri: process.env.HUBSPOT_REDIRECT_URI || '',
    apiUrl: 'https://api.hubapi.com',
    authUrl: 'https://app.hubspot.com/oauth/authorize',
    tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
  },
  quickbooks: {
    clientId: process.env.QUICKBOOKS_CLIENT_ID || '',
    clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET || '',
    scopes: ['com.intuit.quickbooks.accounting'],
    redirectUri: process.env.QUICKBOOKS_REDIRECT_URI || '',
    apiUrl: 'https://sandbox-quickbooks.api.intuit.com',
    authUrl: 'https://appcenter.intuit.com/connect/oauth2',
    tokenUrl: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
  },
  slack: {
    clientId: process.env.SLACK_CLIENT_ID || '',
    clientSecret: process.env.SLACK_CLIENT_SECRET || '',
    scopes: ['channels:read', 'groups:read', 'im:read', 'mpim:read', 'users:read'],
    redirectUri: process.env.SLACK_REDIRECT_URI || '',
    apiUrl: 'https://slack.com/api',
    authUrl: 'https://slack.com/oauth/v2/authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
  },
  procore: {
    clientId: process.env.PROCORE_CLIENT_ID || '',
    clientSecret: process.env.PROCORE_CLIENT_SECRET || '',
    scopes: ['read'],
    redirectUri: process.env.PROCORE_REDIRECT_URI || '',
    apiUrl: 'https://api.procore.com',
    authUrl: 'https://login.procore.com/oauth/authorize',
    tokenUrl: 'https://login.procore.com/oauth/token',
  },
  buildertrend: {
    clientId: process.env.BUILDERTREND_CLIENT_ID || '',
    clientSecret: process.env.BUILDERTREND_CLIENT_SECRET || '',
    scopes: ['read'],
    redirectUri: process.env.BUILDERTREND_REDIRECT_URI || '',
    apiUrl: 'https://api.buildertrend.com',
    authUrl: 'https://app.buildertrend.com/oauth/authorize',
    tokenUrl: 'https://app.buildertrend.com/oauth/token',
  },
};
