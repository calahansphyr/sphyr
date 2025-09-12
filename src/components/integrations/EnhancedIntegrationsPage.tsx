import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  AlertCircle,
  Plus,
  Settings,
  RefreshCw,
  Shield,
  TrendingUp,
  FileText,
  Mail,
  Calendar,
  MessageSquare,
  Building,
  DollarSign,
  CheckSquare,
  LucideIcon
} from 'lucide-react';
import { IntegrationType } from '@/types/integrations';
import { ConnectIntegrationModal } from '@/components/integrations';
import { cn } from '@/lib/utils';

interface EnhancedIntegrationsPageProps {
  className?: string;
}

interface IntegrationStatus {
  id: IntegrationType;
  name: string;
  icon: LucideIcon;
  status: 'connected' | 'syncing' | 'error' | 'available';
  lastSync?: string;
  itemCount?: number;
  health: 'excellent' | 'good' | 'warning' | 'error';
  description: string;
  features: string[];
  dataTypes: string[];
}

const EnhancedIntegrationsPage: React.FC<EnhancedIntegrationsPageProps> = ({
  className = ""
}) => {
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationType | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const [integrations] = useState<IntegrationStatus[]>([
    {
      id: 'google_gmail',
      name: 'Gmail',
      icon: Mail,
      status: 'connected',
      lastSync: '2 minutes ago',
      itemCount: 1247,
      health: 'excellent',
      description: 'Search through your Gmail messages, attachments, and conversations',
      features: ['Email search', 'Attachment access', 'Thread navigation', 'Label filtering'],
      dataTypes: ['Emails', 'Attachments', 'Contacts', 'Calendar events']
    },
    {
      id: 'google_drive',
      name: 'Google Drive',
      icon: FileText,
      status: 'connected',
      lastSync: '5 minutes ago',
      itemCount: 342,
      health: 'excellent',
      description: 'Access and search your Google Drive files and documents',
      features: ['File search', 'Document preview', 'Folder navigation', 'Version history'],
      dataTypes: ['Documents', 'Spreadsheets', 'Presentations', 'Images', 'Videos']
    },
    {
      id: 'google_calendar',
      name: 'Google Calendar',
      icon: Calendar,
      status: 'connected',
      lastSync: '1 minute ago',
      itemCount: 89,
      health: 'excellent',
      description: 'Search through your calendar events, meetings, and schedules',
      features: ['Event search', 'Meeting details', 'Attendee info', 'Recurring events'],
      dataTypes: ['Events', 'Meetings', 'Reminders', 'Attendees']
    },
    {
      id: 'slack',
      name: 'Slack',
      icon: MessageSquare,
      status: 'connected',
      lastSync: '3 minutes ago',
      itemCount: 2156,
      health: 'good',
      description: 'Search through your Slack messages, channels, and files',
      features: ['Message search', 'Channel browsing', 'File access', 'User mentions'],
      dataTypes: ['Messages', 'Files', 'Channels', 'Users', 'Threads']
    },
    {
      id: 'asana',
      name: 'Asana',
      icon: CheckSquare,
      status: 'syncing',
      lastSync: '15 minutes ago',
      itemCount: 156,
      health: 'warning',
      description: 'Access your Asana projects, tasks, and team collaboration data',
      features: ['Task search', 'Project overview', 'Team activity', 'Deadline tracking'],
      dataTypes: ['Tasks', 'Projects', 'Teams', 'Comments', 'Attachments']
    },
    {
      id: 'quickbooks',
      name: 'QuickBooks',
      icon: DollarSign,
      status: 'connected',
      lastSync: '1 hour ago',
      itemCount: 78,
      health: 'excellent',
      description: 'Search through your financial data, invoices, and transactions',
      features: ['Invoice search', 'Transaction history', 'Customer data', 'Financial reports'],
      dataTypes: ['Invoices', 'Transactions', 'Customers', 'Reports', 'Receipts']
    },
    {
      id: 'hubspot',
      name: 'HubSpot',
      icon: Building,
      status: 'error',
      lastSync: '2 hours ago',
      itemCount: 0,
      health: 'error',
      description: 'Access your CRM data, contacts, and sales pipeline information',
      features: ['Contact search', 'Deal tracking', 'Email campaigns', 'Sales analytics'],
      dataTypes: ['Contacts', 'Deals', 'Companies', 'Emails', 'Activities']
    },
    {
      id: 'microsoft_outlook',
      name: 'Microsoft Outlook',
      icon: Mail,
      status: 'available',
      health: 'excellent',
      description: 'Connect your Outlook email and calendar for comprehensive search',
      features: ['Email search', 'Calendar access', 'Contact management', 'Task tracking'],
      dataTypes: ['Emails', 'Events', 'Contacts', 'Tasks', 'Notes']
    }
  ]);

  const getStatusColor = (status: IntegrationStatus['status']) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-50 border-green-200';
      case 'syncing': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'available': return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: IntegrationStatus['status']) => {
    switch (status) {
      case 'connected': return CheckCircle;
      case 'syncing': return RefreshCw;
      case 'error': return AlertCircle;
      case 'available': return Plus;
    }
  };

  const getHealthColor = (health: IntegrationStatus['health']) => {
    switch (health) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
    }
  };

  const connectedCount = integrations.filter(i => i.status === 'connected').length;
  const totalCount = integrations.length;
  const syncingCount = integrations.filter(i => i.status === 'syncing').length;
  const errorCount = integrations.filter(i => i.status === 'error').length;

  const handleConnectIntegration = (integration: IntegrationType) => {
    setSelectedIntegration(integration);
    setShowConnectModal(true);
  };

  const handleCloseModal = () => {
    setShowConnectModal(false);
    setSelectedIntegration(null);
  };

  return (
    <div className={cn("min-h-screen bg-gray-50", className)}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
              <p className="text-gray-600 mt-2">
                Connect your favorite tools to unlock powerful AI-powered search across all your data
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{connectedCount}</div>
                  <div className="text-sm text-gray-600">Connected</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <RefreshCw className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{syncingCount}</div>
                  <div className="text-sm text-gray-600">Syncing</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{errorCount}</div>
                  <div className="text-sm text-gray-600">Issues</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{totalCount}</div>
                  <div className="text-sm text-gray-600">Available</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration, index) => {
            const Icon = integration.icon;
            const StatusIcon = getStatusIcon(integration.status);

            return (
              <motion.div
                key={integration.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl border border-gray-200 hover:border-[#3A8FCD] hover:shadow-lg transition-all duration-200 group"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#3A8FCD]/10 rounded-xl flex items-center justify-center">
                        <Icon className="h-6 w-6 text-[#3A8FCD]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                        <div className={cn(
                          "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border",
                          getStatusColor(integration.status)
                        )}>
                          <StatusIcon className="h-3 w-3" />
                          <span className="capitalize">{integration.status}</span>
                        </div>
                      </div>
                    </div>
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      getHealthColor(integration.health)
                    )} />
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {integration.description}
                  </p>

                  {/* Stats */}
                  {integration.status === 'connected' && (
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold text-gray-900">
                          {integration.itemCount?.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600">Items</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold text-gray-900">
                          {integration.lastSync}
                        </div>
                        <div className="text-xs text-gray-600">Last Sync</div>
                      </div>
                    </div>
                  )}

                  {/* Features */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Key Features</h4>
                    <div className="flex flex-wrap gap-1">
                      {integration.features.slice(0, 3).map((feature, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                        >
                          {feature}
                        </span>
                      ))}
                      {integration.features.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{integration.features.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    {integration.status === 'available' ? (
                      <button
                        onClick={() => handleConnectIntegration(integration.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#3A8FCD] text-white rounded-lg hover:bg-[#4D70B6] transition-colors font-medium"
                      >
                        <Plus className="h-4 w-4" />
                        Connect
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors">
                          <Settings className="h-4 w-4" />
                          <span>Settings</span>
                        </button>
                        {integration.status === 'error' && (
                          <button className="flex items-center gap-2 px-3 py-2 text-red-600 hover:text-red-800 transition-colors">
                            <RefreshCw className="h-4 w-4" />
                            <span>Retry</span>
                          </button>
                        )}
                      </div>
                    )}
                    <button className="p-2 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <Shield className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Connect Integration Modal */}
      {showConnectModal && selectedIntegration && (
        <ConnectIntegrationModal
          isOpen={showConnectModal}
          onClose={handleCloseModal}
          integration={selectedIntegration}
        />
      )}
    </div>
  );
};

export default EnhancedIntegrationsPage;
