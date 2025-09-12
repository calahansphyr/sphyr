import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ExternalLink, 
  Calendar, 
  User, 
  FileText, 
  Mail,
  MessageSquare,
  Building,
  Clock,
  MapPin,
  DollarSign,
  Users,
  LucideIcon
} from 'lucide-react';
import IntegrationBadge, { IntegrationProvider } from '../integrations/IntegrationBadge';
import { AISearchResult } from '@/types/ai';
import { cn } from '@/lib/utils';

export interface SearchResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: SearchResultData | null;
  className?: string;
}

export interface SearchResultData extends AISearchResult {
  provider: IntegrationProvider;
  timeAgo: string;
  confidence: number;
  from?: string;
  date?: string;
  location?: string;
  amount?: string;
  attachments?: string[];
  aiInsight?: string;
}

const SearchResultModal: React.FC<SearchResultModalProps> = ({ 
  isOpen, 
  onClose, 
  result,
  className 
}) => {
  if (!result) return null;

  const getProviderIcon = (provider: IntegrationProvider): LucideIcon => {
    switch (provider) {
      case 'gmail': return Mail;
      case 'drive': return FileText;
      case 'calendar': return Calendar;
      case 'slack': return MessageSquare;
      case 'hubspot': return Building;
      case 'quickbooks': return DollarSign;
      case 'asana': return Users;
      default: return FileText;
    }
  };

  const getProviderColor = (provider: IntegrationProvider): string => {
    switch (provider) {
      case 'gmail': return 'text-red-600';
      case 'drive': return 'text-blue-600';
      case 'calendar': return 'text-green-600';
      case 'slack': return 'text-purple-600';
      case 'hubspot': return 'text-orange-600';
      case 'quickbooks': return 'text-yellow-600';
      case 'asana': return 'text-pink-600';
      default: return 'text-gray-600';
    }
  };

  const getProviderDisplayName = (provider: IntegrationProvider): string => {
    switch (provider) {
      case 'gmail': return 'Gmail';
      case 'drive': return 'Google Drive';
      case 'calendar': return 'Google Calendar';
      case 'slack': return 'Slack';
      case 'hubspot': return 'HubSpot';
      case 'quickbooks': return 'QuickBooks';
      case 'asana': return 'Asana';
      default: return 'App';
    }
  };

  const ProviderIcon = getProviderIcon(result.provider);

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
            aria-labelledby="search-result-title"
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={cn(
                "bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden",
                className
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-gray-100">
                    <ProviderIcon className={cn("h-6 w-6", getProviderColor(result.provider))} aria-hidden="true" />
                  </div>
                  <div>
                    <h2 id="search-result-title" className="text-xl font-bold text-gray-900">
                      {result.title}
                    </h2>
                    <div className="flex items-center gap-3 mt-1">
                      <IntegrationBadge integration={result.provider} size="sm" />
                      <span className="text-sm text-gray-500" aria-hidden="true">•</span>
                      <span className="text-sm text-gray-500">{result.timeAgo}</span>
                      <span className="text-sm text-gray-500" aria-hidden="true">•</span>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full" aria-hidden="true"></div>
                        <span className="text-sm text-green-600 font-medium">
                          {result.confidence}% match
                        </span>
                      </div>
                    </div>
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
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {/* Metadata */}
                <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-600">
                  {result.from && (
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" aria-hidden="true" />
                      <span>From: {result.from}</span>
                    </div>
                  )}
                  {result.date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" aria-hidden="true" />
                      <span>{result.date}</span>
                    </div>
                  )}
                  {result.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" aria-hidden="true" />
                      <span>{result.location}</span>
                    </div>
                  )}
                  {result.amount && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" aria-hidden="true" />
                      <span>{result.amount}</span>
                    </div>
                  )}
                </div>

                {/* Main Content */}
                <div className="prose max-w-none">
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {result.content}
                    </p>
                  </div>

                  {/* Attachments or Related Items */}
                  {result.attachments && result.attachments.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Attachments</h4>
                      <div className="space-y-2">
                        {result.attachments.map((attachment, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <FileText className="h-4 w-4 text-gray-500" aria-hidden="true" />
                            <span className="text-sm text-gray-700">{attachment}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Insights */}
                  {result.aiInsight && (
                    <div className="bg-[#3A8FCD]/5 border border-[#3A8FCD]/20 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-[#3A8FCD] rounded-full animate-pulse" aria-hidden="true"></div>
                        <span className="text-sm font-medium text-[#3A8FCD]">AI Insight</span>
                      </div>
                      <p className="text-sm text-gray-700">{result.aiInsight}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  <span>Found in 0.3 seconds</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <button 
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    aria-label="Share this result"
                  >
                    Share
                  </button>
                  <button 
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    aria-label="Save this result"
                  >
                    Save
                  </button>
                  <button 
                    className="flex items-center gap-2 px-4 py-2 bg-[#3A8FCD] text-white rounded-lg hover:bg-[#4D70B6] transition-colors"
                    aria-label={`Open in ${getProviderDisplayName(result.provider)}`}
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    Open in {getProviderDisplayName(result.provider)}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SearchResultModal;
