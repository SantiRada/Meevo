import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type NotificationType = 'success' | 'warning' | 'error';
export type NotificationLayout = 'simple' | 'detailed' | 'actionable';

export interface NotificationAction {
  label: string;
  onClick: () => void;
  primary?: boolean;
}

export interface NotificationPayload {
  type: NotificationType;
  layout: NotificationLayout;
  title: string;
  description?: string;
  actions?: NotificationAction[]; // Max 3
}

export interface NotificationData extends NotificationPayload {
  id: string;
}

interface NotificationContextValue {
  notifications: NotificationData[];
  addNotification: (payload: NotificationPayload) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const addNotification = useCallback((payload: NotificationPayload) => {
    const id = Math.random().toString(36).substring(2, 9);
    const notification: NotificationData = { ...payload, id };
    
    setNotifications(prev => [...prev, notification]);

    // Auto-remove logic
    if (payload.layout === 'simple') {
      setTimeout(() => removeNotification(id), 2000);
    } else if (payload.layout === 'detailed') {
      setTimeout(() => removeNotification(id), 5000);
    }
    // 'actionable' does not auto-remove
  }, [removeNotification]);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

