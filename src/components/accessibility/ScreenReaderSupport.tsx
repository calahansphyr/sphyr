import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ScreenReaderContextType {
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  announcePageChange: (pageTitle: string) => void;
  announceError: (error: string) => void;
  announceSuccess: (message: string) => void;
  announceLoading: (message: string) => void;
  announceComplete: (message: string) => void;
}

const ScreenReaderContext = createContext<ScreenReaderContextType | undefined>(undefined);

export const useScreenReader = () => {
  const context = useContext(ScreenReaderContext);
  if (!context) {
    throw new Error('useScreenReader must be used within a ScreenReaderProvider');
  }
  return context;
};

interface ScreenReaderProviderProps {
  children: ReactNode;
}

export const ScreenReaderProvider: React.FC<ScreenReaderProviderProps> = ({ children }) => {
  const [announcements, setAnnouncements] = useState<Array<{
    id: string;
    message: string;
    priority: 'polite' | 'assertive';
    timestamp: number;
  }>>([]);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const id = `announcement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    setAnnouncements(prev => [
      ...prev,
      {
        id,
        message,
        priority,
        timestamp: Date.now()
      }
    ]);

    // Remove announcement after 5 seconds
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(announcement => announcement.id !== id));
    }, 5000);
  }, []);

  const announcePageChange = useCallback((pageTitle: string) => {
    announce(`Navigated to ${pageTitle}`, 'assertive');
  }, [announce]);

  const announceError = useCallback((error: string) => {
    announce(`Error: ${error}`, 'assertive');
  }, [announce]);

  const announceSuccess = useCallback((message: string) => {
    announce(`Success: ${message}`, 'polite');
  }, [announce]);

  const announceLoading = useCallback((message: string) => {
    announce(`Loading: ${message}`, 'polite');
  }, [announce]);

  const announceComplete = useCallback((message: string) => {
    announce(`Complete: ${message}`, 'polite');
  }, [announce]);

  return (
    <ScreenReaderContext.Provider value={{
      announce,
      announcePageChange,
      announceError,
      announceSuccess,
      announceLoading,
      announceComplete
    }}>
      {children}
      <ScreenReaderAnnouncer announcements={announcements} />
    </ScreenReaderContext.Provider>
  );
};

interface ScreenReaderAnnouncerProps {
  announcements: Array<{
    id: string;
    message: string;
    priority: 'polite' | 'assertive';
    timestamp: number;
  }>;
}

const ScreenReaderAnnouncer: React.FC<ScreenReaderAnnouncerProps> = ({ announcements }) => {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      role="status"
      aria-label="Screen reader announcements"
    >
      <AnimatePresence>
        {announcements.map((announcement) => (
          <motion.div
            key={announcement.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-live={announcement.priority}
            aria-atomic="true"
          >
            {announcement.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

interface AccessibleTableProps {
  caption: string;
  headers: string[];
  data: string[][];
  className?: string;
  sortable?: boolean;
  onSort?: (columnIndex: number, direction: 'asc' | 'desc') => void;
}

export const AccessibleTable: React.FC<AccessibleTableProps> = ({
  caption,
  headers,
  data,
  className = '',
  sortable = false,
  onSort
}) => {
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (columnIndex: number) => {
    if (!sortable) return;

    const newDirection = sortColumn === columnIndex && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(columnIndex);
    setSortDirection(newDirection);
    onSort?.(columnIndex, newDirection);
  };

  return (
    <div className="overflow-x-auto">
      <table
        className={cn("min-w-full divide-y divide-gray-200", className)}
        role="table"
        aria-label={caption}
      >
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-gray-50">
          <tr role="row">
            {headers.map((header, index) => (
              <th
                key={index}
                scope="col"
                role="columnheader"
                className={cn(
                  "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
                  sortable && "cursor-pointer hover:bg-gray-100 focus:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3A8FCD]"
                )}
                tabIndex={sortable ? 0 : undefined}
                onClick={() => handleSort(index)}
                onKeyDown={(e) => {
                  if (sortable && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    handleSort(index);
                  }
                }}
                aria-sort={
                  sortable
                    ? sortColumn === index
                      ? sortDirection === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                    : undefined
                }
              >
                {header}
                {sortable && sortColumn === index && (
                  <span className="ml-1" aria-hidden="true">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} role="row">
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  role="cell"
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

interface AccessibleListProps {
  items: string[];
  type?: 'ordered' | 'unordered';
  className?: string;
  ariaLabel?: string;
}

export const AccessibleList: React.FC<AccessibleListProps> = ({
  items,
  type = 'unordered',
  className = '',
  ariaLabel
}) => {
  const ListComponent = type === 'ordered' ? 'ol' : 'ul';
  
  return (
    <ListComponent
      className={cn("space-y-2", className)}
      role="list"
      aria-label={ariaLabel}
    >
      {items.map((item, index) => (
        <li key={index} role="listitem" className="text-sm text-gray-700">
          {item}
        </li>
      ))}
    </ListComponent>
  );
};

interface AccessibleHeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: ReactNode;
  className?: string;
  id?: string;
}

export const AccessibleHeading: React.FC<AccessibleHeadingProps> = ({
  level,
  children,
  className = '',
  id
}) => {
  const HeadingComponent = `h${level}` as keyof React.JSX.IntrinsicElements;
  const headingId = id || `heading-${level}-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <HeadingComponent
      id={headingId}
      className={cn(
        "font-semibold text-gray-900",
        level === 1 && "text-3xl",
        level === 2 && "text-2xl",
        level === 3 && "text-xl",
        level === 4 && "text-lg",
        level === 5 && "text-base",
        level === 6 && "text-sm",
        className
      )}
    >
      {children}
    </HeadingComponent>
  );
};

interface AccessibleImageProps {
  src: string;
  alt: string;
  className?: string;
  caption?: string;
  decorative?: boolean;
}

export const AccessibleImage: React.FC<AccessibleImageProps> = ({
  src,
  alt,
  className = '',
  caption,
  decorative = false
}) => {
  return (
    <figure className={cn("inline-block", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={decorative ? '' : alt}
        role={decorative ? 'presentation' : undefined}
        className="max-w-full h-auto"
      />
      {caption && (
        <figcaption className="mt-2 text-sm text-gray-600 text-center">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};

interface AccessibleFormProps {
  children: ReactNode;
  onSubmit: (data: FormData) => void;
  className?: string;
  ariaLabel?: string;
}

export const AccessibleForm: React.FC<AccessibleFormProps> = ({
  children,
  onSubmit,
  className = '',
  ariaLabel
}) => {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onSubmit(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("space-y-4", className)}
      role="form"
      aria-label={ariaLabel}
    >
      {children}
    </form>
  );
};

const ScreenReaderComponents = {
  ScreenReaderProvider,
  useScreenReader,
  AccessibleTable,
  AccessibleList,
  AccessibleHeading,
  AccessibleImage,
  AccessibleForm
};

export default ScreenReaderComponents;
