import React from 'react';
import { 
  Mail, 
  Calendar, 
  FileText, 
  MessageSquare, 
  Users, 
  DollarSign, 
  CheckSquare,
  Building,
  Sheet,
  Presentation,
  File,
  LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type IntegrationProvider = 
  | 'gmail' | 'calendar' | 'drive' | 'docs' | 'sheets' | 'slides'
  | 'slack' | 'hubspot' | 'quickbooks' | 'asana' | 'outlook'
  | 'word' | 'excel' | 'powerpoint' | 'teams';

export interface IntegrationBadgeProps {
  provider?: IntegrationProvider;
  integration?: IntegrationProvider;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const integrationIcons: Record<IntegrationProvider, LucideIcon> = {
  gmail: Mail,
  calendar: Calendar,
  drive: FileText,
  docs: FileText,
  sheets: Sheet,
  slides: Presentation,
  slack: MessageSquare,
  hubspot: Building,
  quickbooks: DollarSign,
  asana: CheckSquare,
  outlook: Mail,
  word: File,
  excel: Sheet,
  powerpoint: Presentation,
  teams: Users
};

const integrationColors: Record<IntegrationProvider, string> = {
  gmail: 'bg-red-100 text-red-700 border-red-200',
  calendar: 'bg-blue-100 text-blue-700 border-blue-200',
  drive: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  docs: 'bg-blue-100 text-blue-700 border-blue-200',
  sheets: 'bg-green-100 text-green-700 border-green-200',
  slides: 'bg-orange-100 text-orange-700 border-orange-200',
  slack: 'bg-purple-100 text-purple-700 border-purple-200',
  hubspot: 'bg-orange-100 text-orange-700 border-orange-200',
  quickbooks: 'bg-green-100 text-green-700 border-green-200',
  asana: 'bg-pink-100 text-pink-700 border-pink-200',
  outlook: 'bg-blue-100 text-blue-700 border-blue-200',
  word: 'bg-blue-100 text-blue-700 border-blue-200',
  excel: 'bg-green-100 text-green-700 border-green-200',
  powerpoint: 'bg-red-100 text-red-700 border-red-200',
  teams: 'bg-purple-100 text-purple-700 border-purple-200'
};

const IntegrationBadge: React.FC<IntegrationBadgeProps> = ({ 
  provider, 
  integration, 
  size = "sm", 
  showIcon = true, 
  className = "" 
}) => {
  // Use provider prop if available, fallback to integration prop
  const providerName = (provider || integration || 'unknown') as IntegrationProvider;
  const Icon = integrationIcons[providerName] || FileText;
  const colorClass = integrationColors[providerName] || 'bg-gray-100 text-gray-700 border-gray-200';
  
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSizes = {
    xs: 'h-3 w-3',
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full border font-medium",
      colorClass,
      sizeClasses[size],
      className
    )}>
      {showIcon && <Icon className={iconSizes[size]} aria-hidden="true" />}
      {providerName.charAt(0).toUpperCase() + providerName.slice(1)}
    </span>
  );
};

export default IntegrationBadge;
