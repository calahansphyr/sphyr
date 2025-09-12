import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  AlertCircle,
  Info,
  X,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface NotificationAction {
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary' | 'destructive';
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description?: string;
  duration?: number; // 0 = persistent
  actions?: NotificationAction[];
  icon?: ReactNode;
  timestamp: Date;
  dismissible?: boolean;
  progress?: number; // For loading notifications
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  updateNotification: (id: string, updates: Partial<Notification>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
  maxNotifications?: number;
  defaultDuration?: number;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  maxNotifications = 5,
  defaultDuration = 5000
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date(),
      duration: notification.duration ?? defaultDuration,
      dismissible: notification.dismissible ?? true
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, maxNotifications);
      return updated;
    });

    // Auto-dismiss if duration is set
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
      }, newNotification.duration);
    }

    return id;
  }, [defaultDuration, maxNotifications]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const updateNotification = useCallback((id: string, updates: Partial<Notification>) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, ...updates }
          : notification
      )
    );
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearAllNotifications,
      updateNotification
    }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full">
      <AnimatePresence>
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onDismiss={() => removeNotification(notification.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

interface NotificationItemProps {
  notification: Notification;
  onDismiss: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onDismiss
}) => {
  const { } = useNotifications();

  const getNotificationStyles = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 border-green-200',
          icon: 'text-green-600',
          title: 'text-green-900',
          description: 'text-green-700',
          iconComponent: CheckCircle
        };
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200',
          icon: 'text-red-600',
          title: 'text-red-900',
          description: 'text-red-700',
          iconComponent: AlertCircle
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          icon: 'text-yellow-600',
          title: 'text-yellow-900',
          description: 'text-yellow-700',
          iconComponent: AlertTriangle
        };
      case 'info':
        return {
          bg: 'bg-blue-50 border-blue-200',
          icon: 'text-blue-600',
          title: 'text-blue-900',
          description: 'text-blue-700',
          iconComponent: Info
        };
      case 'loading':
        return {
          bg: 'bg-gray-50 border-gray-200',
          icon: 'text-gray-600',
          title: 'text-gray-900',
          description: 'text-gray-700',
          iconComponent: RefreshCw
        };
    }
  };

  const styles = getNotificationStyles(notification.type);
  const IconComponent = styles.iconComponent;

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.95 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
      className={cn(
        "relative bg-white border rounded-lg shadow-lg p-4",
        styles.bg
      )}
    >
      {/* Progress Bar for Loading */}
      {notification.type === 'loading' && notification.progress !== undefined && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 rounded-t-lg overflow-hidden">
          <motion.div
            className="h-full bg-[#3A8FCD]"
            initial={{ width: 0 }}
            animate={{ width: `${notification.progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn("flex-shrink-0", styles.icon)}>
          {notification.icon ? (
            <div className="w-5 h-5">
              {notification.icon}
            </div>
          ) : (
            <IconComponent className={cn("w-5 h-5", notification.type === 'loading' && 'animate-spin')} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className={cn("font-semibold text-sm", styles.title)}>
            {notification.title}
          </h4>
          {notification.description && (
            <p className={cn("text-sm mt-1", styles.description)}>
              {notification.description}
            </p>
          )}

          {/* Actions */}
          {notification.actions && notification.actions.length > 0 && (
            <div className="flex gap-2 mt-3">
              {notification.actions.map((action, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant={action.variant === 'primary' ? 'default' : 'outline'}
                  onClick={action.action}
                  className={cn(
                    "text-xs h-7 px-3",
                    action.variant === 'destructive' && "text-red-600 border-red-300 hover:bg-red-50"
                  )}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Dismiss Button */}
        {notification.dismissible && (
          <button
            onClick={onDismiss}
            className={cn(
              "flex-shrink-0 p-1 rounded-full hover:bg-black/5 transition-colors",
              styles.icon
            )}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

// Convenience hooks for common notification types
export const useNotificationActions = () => {
  const { addNotification, updateNotification } = useNotifications();

  const showSuccess = useCallback((title: string, description?: string, actions?: NotificationAction[]) => {
    return addNotification({
      type: 'success',
      title,
      description,
      actions
    });
  }, [addNotification]);

  const showError = useCallback((title: string, description?: string, actions?: NotificationAction[]) => {
    return addNotification({
      type: 'error',
      title,
      description,
      actions,
      duration: 0 // Persistent for errors
    });
  }, [addNotification]);

  const showWarning = useCallback((title: string, description?: string, actions?: NotificationAction[]) => {
    return addNotification({
      type: 'warning',
      title,
      description,
      actions
    });
  }, [addNotification]);

  const showInfo = useCallback((title: string, description?: string, actions?: NotificationAction[]) => {
    return addNotification({
      type: 'info',
      title,
      description,
      actions
    });
  }, [addNotification]);

  const showLoading = useCallback((title: string, description?: string) => {
    return addNotification({
      type: 'loading',
      title,
      description,
      duration: 0, // Persistent until manually dismissed
      dismissible: false
    });
  }, [addNotification]);

  const updateProgress = useCallback((id: string, progress: number) => {
    updateNotification(id, { progress });
  }, [updateNotification]);

  const completeLoading = useCallback((id: string, title: string, description?: string) => {
    updateNotification(id, {
      type: 'success',
      title,
      description,
      progress: 100,
      dismissible: true,
      duration: 3000
    });
  }, [updateNotification]);

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    updateProgress,
    completeLoading
  };
};

export default NotificationProvider;
