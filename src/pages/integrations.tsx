/**
 * Integrations Page
 * Allows users to connect and manage their third-party integrations
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../context/AuthContext';
import { logger } from '../lib/logger';

interface IntegrationStatus {
  provider: string;
  connected: boolean;
  connectedAt?: string;
  lastSync?: string;
}

export default function IntegrationsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([
    {
      provider: 'google',
      connected: false,
    },
    {
      provider: 'slack',
      connected: false,
    },
    {
      provider: 'asana',
      connected: false,
    },
    {
      provider: 'quickbooks',
      connected: false,
    },
    {
      provider: 'microsoft',
      connected: false,
    },
    {
      provider: 'procore',
      connected: false,
    },
  ]);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Handle URL query parameters for success/error messages
  useEffect(() => {
    const { success, error } = router.query;
    
    if (success === 'google_connected') {
      setMessage({ type: 'success', text: 'Google account connected successfully!' });
      // Update integration status
      setIntegrations(prev => prev.map(integration => 
        integration.provider === 'google' 
          ? { ...integration, connected: true, connectedAt: new Date().toISOString() }
          : integration
      ));
    } else if (success === 'slack_connected') {
      setMessage({ type: 'success', text: 'Slack workspace connected successfully!' });
      // Update integration status
      setIntegrations(prev => prev.map(integration => 
        integration.provider === 'slack' 
          ? { ...integration, connected: true, connectedAt: new Date().toISOString() }
          : integration
      ));
    } else if (success === 'asana_connected') {
      setMessage({ type: 'success', text: 'Asana workspace connected successfully!' });
      // Update integration status
      setIntegrations(prev => prev.map(integration => 
        integration.provider === 'asana' 
          ? { ...integration, connected: true, connectedAt: new Date().toISOString() }
          : integration
      ));
    } else if (success === 'quickbooks_connected') {
      setMessage({ type: 'success', text: 'QuickBooks company connected successfully!' });
      // Update integration status
      setIntegrations(prev => prev.map(integration => 
        integration.provider === 'quickbooks' 
          ? { ...integration, connected: true, connectedAt: new Date().toISOString() }
          : integration
      ));
    } else if (success === 'microsoft_connected') {
      setMessage({ type: 'success', text: 'Microsoft account connected successfully!' });
      // Update integration status
      setIntegrations(prev => prev.map(integration => 
        integration.provider === 'microsoft' 
          ? { ...integration, connected: true, connectedAt: new Date().toISOString() }
          : integration
      ));
    } else if (success === 'procore_connected') {
      setMessage({ type: 'success', text: 'Procore account connected successfully!' });
      // Update integration status
      setIntegrations(prev => prev.map(integration => 
        integration.provider === 'procore' 
          ? { ...integration, connected: true, connectedAt: new Date().toISOString() }
          : integration
      ));
    } else if (error) {
      const errorMessages: Record<string, string> = {
        oauth_denied: 'OAuth was denied. Please try again.',
        missing_code: 'OAuth callback error. Please try again.',
        config_error: 'OAuth configuration error. Please contact support.',
        token_error: 'Failed to obtain access token. Please try again.',
        storage_error: 'Failed to save tokens. Please try again.',
        callback_error: 'OAuth callback error. Please try again.',
        slack_oauth_failed: 'Slack OAuth failed. Please try again.',
        invalid_oauth_response: 'Invalid OAuth response. Please try again.',
        invalid_state: 'Invalid OAuth state. Please try again.',
        slack_connection_failed: 'Failed to connect Slack. Please try again.',
        asana_oauth_failed: 'Asana OAuth failed. Please try again.',
        asana_connection_failed: 'Failed to connect Asana. Please try again.',
        quickbooks_oauth_failed: 'QuickBooks OAuth failed. Please try again.',
        quickbooks_connection_failed: 'Failed to connect QuickBooks. Please try again.',
        microsoft_oauth_failed: 'Microsoft OAuth failed. Please try again.',
        microsoft_connection_failed: 'Failed to connect Microsoft account. Please try again.',
        procore_oauth_failed: 'Procore OAuth failed. Please try again.',
        procore_connection_failed: 'Failed to connect Procore account. Please try again.',
      };
      setMessage({ 
        type: 'error', 
        text: errorMessages[error as string] || 'An error occurred. Please try again.' 
      });
    }

    // Clear message after 5 seconds
    if (success || error) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [router.query]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/integrations');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleConnectGoogle = async () => {
    setIsConnecting('google');
    try {
      // Redirect to our OAuth connect endpoint
      window.location.href = '/api/auth/google/connect';
    } catch (error) {
      logger.error('Failed to initiate Google connection', error, {
        operation: 'integration_connect',
        component: 'IntegrationsPage',
        provider: 'google'
      });
      setMessage({ type: 'error', text: 'Failed to initiate Google connection. Please try again.' });
      setIsConnecting(null);
    }
  };

  const handleConnectSlack = async () => {
    setIsConnecting('slack');
    try {
      // Redirect to our OAuth connect endpoint
      window.location.href = '/api/auth/slack/connect';
    } catch (error) {
      logger.error('Failed to initiate Slack connection', error, {
        operation: 'integration_connect',
        component: 'IntegrationsPage',
        provider: 'slack'
      });
      setMessage({ type: 'error', text: 'Failed to initiate Slack connection. Please try again.' });
      setIsConnecting(null);
    }
  };

  const handleConnectAsana = async () => {
    setIsConnecting('asana');
    try {
      // Redirect to our OAuth connect endpoint
      window.location.href = '/api/auth/asana/connect';
    } catch (error) {
      logger.error('Failed to initiate Asana connection', error, {
        operation: 'integration_connect',
        component: 'IntegrationsPage',
        provider: 'asana'
      });
      setMessage({ type: 'error', text: 'Failed to initiate Asana connection. Please try again.' });
      setIsConnecting(null);
    }
  };

  const handleConnectQuickBooks = async () => {
    setIsConnecting('quickbooks');
    try {
      // Redirect to our OAuth connect endpoint
      window.location.href = '/api/auth/quickbooks/connect';
    } catch (error) {
      logger.error('Failed to initiate QuickBooks connection', error, {
        operation: 'integration_connect',
        component: 'IntegrationsPage',
        provider: 'quickbooks'
      });
      setMessage({ type: 'error', text: 'Failed to initiate QuickBooks connection. Please try again.' });
      setIsConnecting(null);
    }
  };

  const handleConnectMicrosoft = async () => {
    setIsConnecting('microsoft');
    try {
      // Redirect to our OAuth connect endpoint
      window.location.href = '/api/auth/microsoft/connect';
    } catch (error) {
      logger.error('Failed to initiate Microsoft connection', error, {
        operation: 'integration_connect',
        component: 'IntegrationsPage',
        provider: 'microsoft'
      });
      setMessage({ type: 'error', text: 'Failed to initiate Microsoft connection. Please try again.' });
      setIsConnecting(null);
    }
  };

  const handleConnectProcore = async () => {
    setIsConnecting('procore');
    try {
      // Redirect to our OAuth connect endpoint
      window.location.href = '/api/auth/procore/connect';
    } catch (error) {
      logger.error('Failed to initiate Procore connection', error, {
        operation: 'integration_connect',
        component: 'IntegrationsPage',
        provider: 'procore'
      });
      setMessage({ type: 'error', text: 'Failed to initiate Procore connection. Please try again.' });
      setIsConnecting(null);
    }
  };

  const handleDisconnect = async (provider: string) => {
    // TODO: Implement disconnect functionality
    logger.info('Disconnect functionality not yet implemented', {
      operation: 'integration_disconnect',
      component: 'IntegrationsPage',
      provider: provider
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading integrations...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <>
      <Head>
        <title>Integrations - Sphyr</title>
        <meta name="description" content="Connect and manage your third-party integrations" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
            <p className="mt-2 text-gray-600">
              Connect your accounts to enable smart search across all your data sources.
            </p>
          </div>

          {/* Success/Error Messages */}
          {message && (
            <div className={`mb-6 p-4 rounded-md ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {message.type === 'success' ? (
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{message.text}</p>
                </div>
              </div>
            </div>
          )}

          {/* Integrations Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Google Integration */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">Google</h3>
                    <p className="text-sm text-gray-500">Gmail, Drive, Calendar</p>
                  </div>
                </div>
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  integrations.find(i => i.provider === 'google')?.connected
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {integrations.find(i => i.provider === 'google')?.connected ? 'Connected' : 'Not Connected'}
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Connect your Google account to search through your Gmail messages and Google Drive files.
              </p>

              <div className="flex space-x-3">
                {integrations.find(i => i.provider === 'google')?.connected ? (
                  <button
                    onClick={() => handleDisconnect('google')}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={handleConnectGoogle}
                    disabled={isConnecting === 'google'}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isConnecting === 'google' ? 'Connecting...' : 'Connect Google'}
                  </button>
                )}
              </div>
            </div>

            {/* Slack Integration */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-purple-600 rounded flex items-center justify-center">
                      <span className="text-white font-bold text-sm">S</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">Slack</h3>
                    <p className="text-sm text-gray-500">Messages, Files, Channels</p>
                  </div>
                </div>
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  integrations.find(i => i.provider === 'slack')?.connected
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {integrations.find(i => i.provider === 'slack')?.connected ? 'Connected' : 'Not Connected'}
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Search through your Slack messages, files, and channel history.
              </p>

              <div className="flex space-x-3">
                {integrations.find(i => i.provider === 'slack')?.connected ? (
                  <button
                    onClick={() => handleDisconnect('slack')}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={handleConnectSlack}
                    disabled={isConnecting === 'slack'}
                    className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isConnecting === 'slack' ? 'Connecting...' : 'Connect Slack'}
                  </button>
                )}
              </div>
            </div>

            {/* Asana Integration */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-orange-500 rounded flex items-center justify-center">
                      <span className="text-white font-bold text-sm">A</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">Asana</h3>
                    <p className="text-sm text-gray-500">Tasks, Projects, Teams</p>
                  </div>
                </div>
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  integrations.find(i => i.provider === 'asana')?.connected
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {integrations.find(i => i.provider === 'asana')?.connected ? 'Connected' : 'Not Connected'}
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Search through your Asana tasks, projects, and team conversations.
              </p>

              <div className="flex space-x-3">
                {integrations.find(i => i.provider === 'asana')?.connected ? (
                  <button
                    onClick={() => handleDisconnect('asana')}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={handleConnectAsana}
                    disabled={isConnecting === 'asana'}
                    className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isConnecting === 'asana' ? 'Connecting...' : 'Connect Asana'}
                  </button>
                )}
              </div>
            </div>

            {/* QuickBooks Integration */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center">
                      <span className="text-white font-bold text-sm">QB</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">QuickBooks</h3>
                    <p className="text-sm text-gray-500">Customers, Invoices, Payments</p>
                  </div>
                </div>
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  integrations.find(i => i.provider === 'quickbooks')?.connected
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {integrations.find(i => i.provider === 'quickbooks')?.connected ? 'Connected' : 'Not Connected'}
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Search through your QuickBooks customers, invoices, and payment records.
              </p>

              <div className="flex space-x-3">
                {integrations.find(i => i.provider === 'quickbooks')?.connected ? (
                  <button
                    onClick={() => handleDisconnect('quickbooks')}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={handleConnectQuickBooks}
                    disabled={isConnecting === 'quickbooks'}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isConnecting === 'quickbooks' ? 'Connecting...' : 'Connect QuickBooks'}
                  </button>
                )}
              </div>
            </div>

            {/* Microsoft Integration */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-blue-500 rounded flex items-center justify-center">
                      <span className="text-white font-bold text-sm">M</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">Microsoft 365</h3>
                    <p className="text-sm text-gray-500">Outlook, OneDrive, Teams</p>
                  </div>
                </div>
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  integrations.find(i => i.provider === 'microsoft')?.connected
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {integrations.find(i => i.provider === 'microsoft')?.connected ? 'Connected' : 'Not Connected'}
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Search through your Microsoft 365 emails, files, and team conversations.
              </p>

              <div className="flex space-x-3">
                {integrations.find(i => i.provider === 'microsoft')?.connected ? (
                  <button
                    onClick={() => handleDisconnect('microsoft')}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={handleConnectMicrosoft}
                    disabled={isConnecting === 'microsoft'}
                    className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isConnecting === 'microsoft' ? 'Connecting...' : 'Connect Microsoft'}
                  </button>
                )}
              </div>
            </div>

            {/* Procore Integration */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-orange-600 rounded flex items-center justify-center">
                      <span className="text-white font-bold text-sm">P</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">Procore</h3>
                    <p className="text-sm text-gray-500">Projects, Documents, RFIs</p>
                  </div>
                </div>
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  integrations.find(i => i.provider === 'procore')?.connected
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {integrations.find(i => i.provider === 'procore')?.connected ? 'Connected' : 'Not Connected'}
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Search through your construction projects, documents, and RFIs.
              </p>

              <div className="flex space-x-3">
                {integrations.find(i => i.provider === 'procore')?.connected ? (
                  <button
                    onClick={() => handleDisconnect('procore')}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={handleConnectProcore}
                    disabled={isConnecting === 'procore'}
                    className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isConnecting === 'procore' ? 'Connecting...' : 'Connect Procore'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-12 bg-blue-50 rounded-lg p-6">
            <h2 className="text-lg font-medium text-blue-900 mb-2">Need Help?</h2>
            <p className="text-blue-700 text-sm mb-4">
              Connecting your accounts allows Sphyr to provide intelligent search results across all your data sources. 
              Your data remains secure and is only accessed with your explicit permission.
            </p>
            <div className="text-sm text-blue-600">
              <p>• All connections use OAuth 2.0 for secure authentication</p>
              <p>• You can disconnect accounts at any time</p>
              <p>• Your data is never stored permanently on our servers</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
