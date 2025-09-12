import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Plus, 
  Check, 
  Shield,
  Zap,
  Clock,
  Users,
  FileText,
  Building,
  DollarSign,
  Calendar,
  MessageSquare,
  Mail,
  ChevronRight,
  Loader,
  LucideIcon
} from 'lucide-react';
import { IntegrationType } from '@/types/integrations';
import { cn } from '@/lib/utils';

export interface ConnectIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  integration: IntegrationType | null;
  className?: string;
}

export interface IntegrationDetails {
  name: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  description: string;
  features: string[];
  dataTypes: string[];
  permissions: string[];
  estimatedItems: string;
}

const ConnectIntegrationModal: React.FC<ConnectIntegrationModalProps> = ({ 
  isOpen, 
  onClose, 
  integration,
  className 
}) => {
  const [step, setStep] = useState<number>(1); // 1: Select, 2: Authorize, 3: Configure, 4: Success
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  if (!integration) return null;

  const integrationDetails: Record<string, IntegrationDetails> = {
    'procore': {
      name: 'Procore',
      icon: Building,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'Construction project management platform',
      features: ['Project Documents', 'RFIs & Submittals', 'Daily Reports', 'Budget Tracking'],
      dataTypes: ['Project files', 'RFI documents', 'Budget reports', 'Schedule updates'],
      permissions: ['Read project data', 'Access documents', 'View financial reports'],
      estimatedItems: '2,500+ items'
    },
    'buildertrend': {
      name: 'Buildertrend',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Home construction management software',
      features: ['Customer Communication', 'Photo Management', 'Change Orders', 'Scheduling'],
      dataTypes: ['Customer messages', 'Project photos', 'Change orders', 'Schedules'],
      permissions: ['Read customer data', 'Access project photos', 'View change orders'],
      estimatedItems: '1,800+ items'
    },
    'google_gmail': {
      name: 'Gmail',
      icon: Mail,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: 'Email communication platform',
      features: ['Email Messages', 'Attachments', 'Labels', 'Threads'],
      dataTypes: ['Email messages', 'Attachments', 'Labels', 'Contacts'],
      permissions: ['Read email messages', 'Access attachments', 'View labels'],
      estimatedItems: '5,000+ items'
    },
    'google_drive': {
      name: 'Google Drive',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Cloud storage and file management',
      features: ['Documents', 'Spreadsheets', 'Presentations', 'Files'],
      dataTypes: ['Documents', 'Spreadsheets', 'Presentations', 'Images'],
      permissions: ['Read files', 'Access shared documents', 'View file metadata'],
      estimatedItems: '3,200+ items'
    },
    'google_calendar': {
      name: 'Google Calendar',
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Calendar and scheduling platform',
      features: ['Events', 'Meetings', 'Reminders', 'Schedules'],
      dataTypes: ['Calendar events', 'Meeting details', 'Attendees', 'Recurring events'],
      permissions: ['Read calendar events', 'Access meeting details', 'View attendees'],
      estimatedItems: '1,500+ items'
    },
    'slack': {
      name: 'Slack',
      icon: MessageSquare,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Team communication platform',
      features: ['Messages', 'Channels', 'Files', 'Threads'],
      dataTypes: ['Channel messages', 'Direct messages', 'File uploads', 'User profiles'],
      permissions: ['Read messages', 'Access channels', 'View file uploads'],
      estimatedItems: '4,000+ items'
    },
    'asana': {
      name: 'Asana',
      icon: Check,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      description: 'Project management and task tracking',
      features: ['Tasks', 'Projects', 'Teams', 'Timelines'],
      dataTypes: ['Project tasks', 'Team members', 'Project timelines', 'Comments'],
      permissions: ['Read project data', 'Access tasks', 'View team information'],
      estimatedItems: '2,800+ items'
    },
    'quickbooks': {
      name: 'QuickBooks',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Accounting and financial management',
      features: ['Invoices', 'Customers', 'Expenses', 'Reports'],
      dataTypes: ['Financial records', 'Customer data', 'Invoice details', 'Expense reports'],
      permissions: ['Read financial data', 'Access customer information', 'View reports'],
      estimatedItems: '1,200+ items'
    },
    'hubspot': {
      name: 'HubSpot',
      icon: Building,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'CRM and marketing automation',
      features: ['Contacts', 'Companies', 'Deals', 'Marketing'],
      dataTypes: ['Contact records', 'Company information', 'Deal pipeline', 'Marketing campaigns'],
      permissions: ['Read contact data', 'Access company records', 'View deal information'],
      estimatedItems: '3,500+ items'
    }
  };

  const currentIntegration = integrationDetails[integration] || integrationDetails['procore'];
  const Icon = currentIntegration.icon;

  const handleConnect = async (): Promise<void> => {
    setIsConnecting(true);
    
    // Simulate OAuth flow
    setTimeout(() => {
      setStep(2);
      setIsConnecting(false);
    }, 1500);
  };

  const handleAuthorize = async (): Promise<void> => {
    setIsConnecting(true);
    
    // Simulate authorization
    setTimeout(() => {
      setStep(3);
      setIsConnecting(false);
    }, 2000);
  };

  const handleConfigure = async (): Promise<void> => {
    setIsConnecting(true);
    
    // Simulate configuration
    setTimeout(() => {
      setStep(4);
      setIsConnecting(false);
    }, 1500);
  };

  const renderStep = (): React.ReactNode => {
    switch (step) {
      case 1:
        return (
          <div>
            <div className="text-center mb-6">
              <div className={cn("inline-flex p-4 rounded-2xl mb-4", currentIntegration.bgColor)}>
                <Icon className={cn("h-12 w-12", currentIntegration.color)} aria-hidden="true" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect {currentIntegration.name}</h2>
              <p className="text-gray-600">{currentIntegration.description}</p>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">What you&apos;ll be able to search:</h3>
                <div className="grid grid-cols-2 gap-3">
                  {currentIntegration.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <Check className="h-4 w-4 text-green-500" aria-hidden="true" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-blue-600" aria-hidden="true" />
                  <span className="font-medium text-blue-900">Estimated Search Impact</span>
                </div>
                <p className="text-sm text-blue-800">
                  We&apos;ll index approximately <strong>{currentIntegration.estimatedItems}</strong> from your {currentIntegration.name} account, 
                  making them instantly searchable alongside your other platforms.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-green-600" aria-hidden="true" />
                  <span className="font-medium text-green-900">Security & Privacy</span>
                </div>
                <p className="text-sm text-green-800">
                  We use industry-standard OAuth 2.0 authentication. Your credentials are never stored, 
                  and you can revoke access at any time.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                aria-label="Cancel integration setup"
              >
                Cancel
              </button>
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#3A8FCD] text-white rounded-lg hover:bg-[#4D70B6] transition-colors disabled:opacity-50"
                aria-label={`Connect ${currentIntegration.name}`}
              >
                {isConnecting ? (
                  <Loader className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Plus className="h-4 w-4" aria-hidden="true" />
                )}
                Connect {currentIntegration.name}
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="text-center">
            <div className={cn("inline-flex p-4 rounded-2xl mb-6", currentIntegration.bgColor)}>
              <Icon className={cn("h-12 w-12", currentIntegration.color)} aria-hidden="true" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Authorize Access</h2>
            <p className="text-gray-600 mb-8">
              {currentIntegration.name} will ask you to authorize Sphyr to access your data
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
              <h3 className="font-medium text-gray-900 mb-4">Sphyr is requesting permission to:</h3>
              <div className="space-y-3">
                {currentIntegration.permissions.map((permission, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-500" aria-hidden="true" />
                    <span className="text-sm text-gray-700">{permission}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                aria-label="Go back to previous step"
              >
                Back
              </button>
              <button
                onClick={handleAuthorize}
                disabled={isConnecting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#3A8FCD] text-white rounded-lg hover:bg-[#4D70B6] transition-colors disabled:opacity-50"
                aria-label="Authorize access to integration"
              >
                {isConnecting ? (
                  <Loader className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Shield className="h-4 w-4" aria-hidden="true" />
                )}
                Authorize Access
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <div className="text-center mb-6">
              <div className={cn("inline-flex p-4 rounded-2xl mb-4", currentIntegration.bgColor)}>
                <Icon className={cn("h-12 w-12", currentIntegration.color)} aria-hidden="true" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Configure Integration</h2>
              <p className="text-gray-600">Choose what data to sync and how often</p>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Data Types to Index</h3>
                <div className="space-y-2">
                  {currentIntegration.dataTypes.map((dataType, index) => (
                    <label key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300" />
                      <FileText className="h-4 w-4 text-gray-500" aria-hidden="true" />
                      <span className="text-sm text-gray-700">{dataType}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-3">Sync Frequency</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input type="radio" name="sync" value="realtime" defaultChecked className="text-[#3A8FCD]" />
                    <Clock className="h-4 w-4 text-gray-500" aria-hidden="true" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Real-time (Recommended)</div>
                      <div className="text-xs text-gray-500">Updates as changes occur</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input type="radio" name="sync" value="hourly" className="text-[#3A8FCD]" />
                    <Clock className="h-4 w-4 text-gray-500" aria-hidden="true" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Every hour</div>
                      <div className="text-xs text-gray-500">Good for less active accounts</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <button
                onClick={() => setStep(2)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                aria-label="Go back to previous step"
              >
                Back
              </button>
              <button
                onClick={handleConfigure}
                disabled={isConnecting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#3A8FCD] text-white rounded-lg hover:bg-[#4D70B6] transition-colors disabled:opacity-50"
                aria-label="Start syncing integration data"
              >
                {isConnecting ? (
                  <Loader className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Zap className="h-4 w-4" aria-hidden="true" />
                )}
                Start Syncing
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="text-center">
            <div className="inline-flex p-4 rounded-2xl bg-green-50 mb-6">
              <Check className="h-12 w-12 text-green-600" aria-hidden="true" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Successfully Connected!</h2>
            <p className="text-gray-600 mb-6">
              {currentIntegration.name} is now connected and syncing your data
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-green-900">Initial Sync in Progress</span>
                <span className="text-sm text-green-700">~2 minutes remaining</span>
              </div>
              <div className="w-full bg-green-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
              <p className="text-sm text-green-800 mt-2">
                Indexing {currentIntegration.estimatedItems} for search...
              </p>
            </div>

            <div className="text-left mb-6">
              <h3 className="font-medium text-gray-900 mb-3">What&apos;s Next?</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  <span>Your {currentIntegration.name} data will appear in search results within minutes</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  <span>Try searching for recent projects or documents</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  <span>Manage this integration anytime in Settings</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-[#3A8FCD] text-white rounded-lg hover:bg-[#4D70B6] transition-colors"
              aria-label="Complete integration setup"
            >
              Done
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="integration-modal-title"
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={cn(
                "bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden",
                className
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Step {step} of 4</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          "w-2 h-2 rounded-full",
                          i <= step ? 'bg-[#3A8FCD]' : 'bg-gray-200'
                        )}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5 text-gray-500" aria-hidden="true" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[70vh]">
                {renderStep()}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ConnectIntegrationModal;
