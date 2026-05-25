import React from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { NotificationItem } from './NotificationItem';

export const NotificationContainer: React.FC = () => {
  const { notifications } = useNotification();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {notifications.map(notification => (
        <NotificationItem key={notification.id} data={notification} />
      ))}
    </div>
  );
};
