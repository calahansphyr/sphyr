import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  X,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Search,
  Settings,
  Users,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HelpItem {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'tip' | 'warning' | 'success';
  action?: {
    label: string;
    onClick: () => void;
  };
  related?: string[];
}

interface ContextualHelpProps {
  target: string; // CSS selector or element ref
  content: HelpItem[];
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  trigger?: 'hover' | 'click' | 'focus';
  className?: string;
  onClose?: () => void;
}

export const ContextualHelp: React.FC<ContextualHelpProps> = ({
  target,
  content,
  position = 'auto',
  trigger = 'hover',
  className = '',
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [actualPosition, setActualPosition] = useState(position);
  const helpRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const targetElement = typeof target === 'string' 
      ? document.querySelector(target) 
      : target;
    
    if (!targetElement) return;
    
    targetRef.current = targetElement as HTMLElement;

    const handleTrigger = () => setIsVisible(true);
    const handleHide = () => setIsVisible(false);

    if (trigger === 'hover') {
      targetElement.addEventListener('mouseenter', handleTrigger);
      targetElement.addEventListener('mouseleave', handleHide);
    } else if (trigger === 'click') {
      targetElement.addEventListener('click', handleTrigger);
    } else if (trigger === 'focus') {
      targetElement.addEventListener('focus', handleTrigger);
      targetElement.addEventListener('blur', handleHide);
    }

    return () => {
      if (trigger === 'hover') {
        targetElement.removeEventListener('mouseenter', handleTrigger);
        targetElement.removeEventListener('mouseleave', handleHide);
      } else if (trigger === 'click') {
        targetElement.removeEventListener('click', handleTrigger);
      } else if (trigger === 'focus') {
        targetElement.removeEventListener('focus', handleTrigger);
        targetElement.removeEventListener('blur', handleHide);
      }
    };
  }, [target, trigger]);

  useEffect(() => {
    if (isVisible && targetRef.current && helpRef.current) {
      const targetRect = targetRef.current.getBoundingClientRect();
      const helpRect = helpRef.current.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };

      let newPosition = position;
      
      if (position === 'auto') {
        // Auto-position based on available space
        const spaceTop = targetRect.top;
        const spaceBottom = viewport.height - targetRect.bottom;
        const spaceRight = viewport.width - targetRect.right;

        if (spaceBottom >= helpRect.height + 20) {
          newPosition = 'bottom';
        } else if (spaceTop >= helpRect.height + 20) {
          newPosition = 'top';
        } else if (spaceRight >= helpRect.width + 20) {
          newPosition = 'right';
        } else {
          newPosition = 'left';
        }
      }

      setActualPosition(newPosition);
    }
  }, [isVisible, position]);

  const getPositionStyles = () => {
    if (!targetRef.current) return {};

    const targetRect = targetRef.current.getBoundingClientRect();
    const offset = 12;

    switch (actualPosition) {
      case 'top':
        return {
          bottom: `${window.innerHeight - targetRect.top + offset}px`,
          left: `${targetRect.left + targetRect.width / 2}px`,
          transform: 'translateX(-50%)'
        };
      case 'bottom':
        return {
          top: `${targetRect.bottom + offset}px`,
          left: `${targetRect.left + targetRect.width / 2}px`,
          transform: 'translateX(-50%)'
        };
      case 'left':
        return {
          top: `${targetRect.top + targetRect.height / 2}px`,
          right: `${window.innerWidth - targetRect.left + offset}px`,
          transform: 'translateY(-50%)'
        };
      case 'right':
        return {
          top: `${targetRect.top + targetRect.height / 2}px`,
          left: `${targetRect.right + offset}px`,
          transform: 'translateY(-50%)'
        };
      default:
        return {};
    }
  };

  const getTypeIcon = (type: HelpItem['type']) => {
    switch (type) {
      case 'info':
        return HelpCircle;
      case 'tip':
        return Lightbulb;
      case 'warning':
        return AlertCircle;
      case 'success':
        return CheckCircle;
    }
  };

  const getTypeColor = (type: HelpItem['type']) => {
    switch (type) {
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'tip':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'warning':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const currentItem = content[currentIndex];

  if (!currentItem) return null;

  const TypeIcon = getTypeIcon(currentItem.type);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={helpRef}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "fixed z-50 w-80 max-w-sm",
            className
          )}
          style={getPositionStyles()}
        >
          <div className={cn(
            "bg-white border rounded-lg shadow-lg p-4",
            getTypeColor(currentItem.type)
          )}>
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <TypeIcon className="w-4 h-4" />
                <span className="font-medium text-sm capitalize">{currentItem.type}</span>
              </div>
              <button
                onClick={() => {
                  setIsVisible(false);
                  onClose?.();
                }}
                className="p-1 hover:bg-black/5 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">{currentItem.title}</h4>
              <p className="text-sm text-gray-700">{currentItem.content}</p>
            </div>

            {/* Action */}
            {currentItem.action && (
              <div className="mb-4">
                <button
                  onClick={currentItem.action.onClick}
                  className="flex items-center gap-2 text-sm font-medium text-[#3A8FCD] hover:text-[#4D70B6] transition-colors"
                >
                  {currentItem.action.label}
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Navigation */}
            {content.length > 1 && (
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex === 0}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                <span className="text-xs text-gray-500">
                  {currentIndex + 1} of {content.length}
                </span>

                <button
                  onClick={() => setCurrentIndex(Math.min(content.length - 1, currentIndex + 1))}
                  disabled={currentIndex === content.length - 1}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface HelpCenterProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const HelpCenter: React.FC<HelpCenterProps> = ({
  isOpen,
  onClose,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const helpCategories = [
    { id: 'all', name: 'All Topics', icon: BookOpen },
    { id: 'search', name: 'Search', icon: Search },
    { id: 'integrations', name: 'Integrations', icon: Zap },
    { id: 'settings', name: 'Settings', icon: Settings },
    { id: 'team', name: 'Team', icon: Users }
  ];

  const helpArticles = [
    {
      id: '1',
      title: 'Getting Started with Sphyr',
      content: 'Learn the basics of using Sphyr to search across all your connected platforms.',
      category: 'search',
      type: 'info'
    },
    {
      id: '2',
      title: 'Connecting Your First Integration',
      content: 'Step-by-step guide to connecting Google Drive, Slack, or other platforms.',
      category: 'integrations',
      type: 'tip'
    },
    {
      id: '3',
      title: 'Understanding Search Results',
      content: 'Learn how to interpret AI-powered search results and confidence scores.',
      category: 'search',
      type: 'info'
    },
    {
      id: '4',
      title: 'Managing Team Access',
      content: 'How to invite team members and manage permissions.',
      category: 'team',
      type: 'info'
    },
    {
      id: '5',
      title: 'Privacy and Security',
      content: 'Learn about Sphyr\'s security measures and data protection.',
      category: 'settings',
      type: 'warning'
    }
  ];

  const filteredArticles = helpArticles.filter(article => {
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={cn(
              "bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col",
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Help Center</h2>
                <p className="text-gray-600">Find answers and learn how to use Sphyr</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Search and Filters */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search help articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3A8FCD] focus:border-transparent"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3A8FCD] focus:border-transparent"
                >
                  {helpCategories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid gap-4">
                {filteredArticles.map(article => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 border border-gray-200 rounded-lg hover:border-[#3A8FCD] hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-[#3A8FCD]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-4 h-4 text-[#3A8FCD]" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{article.title}</h3>
                        <p className="text-sm text-gray-600">{article.content}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {filteredArticles.length === 0 && (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
                  <p className="text-gray-600">Try adjusting your search or category filter.</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const GuidanceComponents = {
  ContextualHelp,
  HelpCenter
};

export default GuidanceComponents;
