import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  Home, 
  Search, 
  Globe, 
  BarChart3, 
  Settings, 
  HelpCircle,
  FileText,
  Users,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navigation: SidebarItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Search', href: '/search', icon: Search },
  { name: 'Integrations', href: '/integrations', icon: Globe },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Collaboration', href: '/collaboration', icon: Users },
  { name: 'AI Features', href: '/ai', icon: Zap },
];

const secondaryNavigation: SidebarItem[] = [
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Help & Support', href: '/help', icon: HelpCircle },
];

export const Sidebar: React.FC = () => {
  const router = useRouter();

  const isActive = (href: string): boolean => {
    return router.pathname === href;
  };

  return (
    <aside className="w-64 bg-background-primary border-r border-border-light min-h-screen">
      <div className="p-6">
        {/* Navigation */}
        <nav className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive(item.href)
                    ? 'bg-primary-50 text-primary-700 border border-primary-200'
                    : 'text-text-secondary hover:text-text-primary hover:bg-background-secondary'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
                {item.badge && (
                  <span className="ml-auto bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Secondary Navigation */}
        <div className="mt-8 pt-6 border-t border-border-light">
          <nav className="space-y-2">
            {secondaryNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive(item.href)
                      ? 'bg-primary-50 text-primary-700 border border-primary-200'
                      : 'text-text-secondary hover:text-text-primary hover:bg-background-secondary'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 pt-6 border-t border-border-light">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
            Quick Actions
          </h3>
          <div className="space-y-2">
            <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-background-secondary transition-colors">
              <div className="h-5 w-5 rounded bg-primary-500 flex items-center justify-center">
                <span className="text-white text-xs">+</span>
              </div>
              <span>New Integration</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-background-secondary transition-colors">
              <div className="h-5 w-5 rounded bg-accent-green flex items-center justify-center">
                <span className="text-white text-xs">+</span>
              </div>
              <span>New Search</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;