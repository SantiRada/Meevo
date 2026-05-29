import React from 'react';
import { 
  CheckmarkCircle24Regular, 
  Warning24Regular, 
  ErrorCircle24Regular 
} from '@fluentui/react-icons';
import type { NotificationData } from '../../contexts/NotificationContext';
import { useNotification } from '../../contexts/NotificationContext';

const getIconAndColors = (type: NotificationData['type']) => {
  switch (type) {
    case 'success':
      return { 
        icon: <CheckmarkCircle24Regular className="text-[#00C950]" />, 
        bg: 'bg-[#152717]', 
        border: 'border-[#1E3A22]' 
      };
    case 'warning':
      return { 
        icon: <Warning24Regular className="text-[#F0B100]" />, 
        bg: 'bg-[#2A2100]', 
        border: 'border-[#403100]' 
      };
    case 'error':
      return { 
        icon: <ErrorCircle24Regular className="text-[#EB2932]" />, 
        bg: 'bg-[#2D0D10]', 
        border: 'border-[#451418]' 
      };
  }
};

export const NotificationItem: React.FC<{ data: NotificationData }> = ({ data }) => {
  const { removeNotification } = useNotification();
  const { icon, bg, border } = getIconAndColors(data.type);

  return (
    <div 
      className={`flex flex-col p-4 rounded-md border shadow-lg pointer-events-auto min-w-[300px] max-w-[400px] ${bg} ${border}`}
    >
      <div className={`flex gap-3 ${data.layout === 'simple' ? 'items-center' : 'items-start'}`}>
        <div className={`shrink-0 ${data.layout === 'simple' ? '' : 'mt-0.5'}`}>{icon}</div>
        <div className="flex flex-col flex-1 gap-1">
          <span className="text-sm font-medium text-meevo-text-primary leading-tight">
            {data.title}
          </span>
          
          {(data.layout === 'detailed' || data.layout === 'actionable') && data.description && (
            <p className="text-xs text-meevo-text-secondary leading-snug">
              {data.description}
            </p>
          )}

          {data.layout === 'actionable' && data.actions && (
            <div className="flex flex-wrap gap-2 mt-3">
              {data.actions.slice(0, 3).map((action, i) => (
                <button
                  key={i}
                  onClick={() => {
                    action.onClick();
                    removeNotification(data.id);
                  }}
                  className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${
                    action.primary 
                      ? 'bg-meevo-text-primary text-meevo-text-inverse hover:bg-meevo-text-secondary' 
                      : 'bg-meevo-surface-2 text-meevo-text-primary border border-meevo-border hover:bg-[#212124]'
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
