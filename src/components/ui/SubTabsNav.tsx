import React, { useEffect } from 'react';

export interface SubTab {
  id: string;
  label: string;
  disabled?: boolean;
}

interface SubTabsNavProps {
  tabs: SubTab[];
  activeTabId: string;
  onChange: (id: string) => void;
}

export const SubTabsNav: React.FC<SubTabsNavProps> = ({ tabs, activeTabId, onChange }) => {
  // Global keyboard shortcut to switch between these specific tabs using Shift + [1-9]
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;

      if (e.shiftKey && e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1;
        if (index >= 0 && index < tabs.length) {
          const tab = tabs[index];
          if (!tab.disabled) {
            e.preventDefault();
            onChange(tab.id);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tabs, onChange]);

  return (
    <div className="h-10 border-t border-meevo-border bg-meevo-surface-1 px-6 flex items-end shrink-0 gap-1 text-xs font-medium pt-2">
      {tabs.map((tab) => {
        const isActive = activeTabId === tab.id;
        return (
          <div 
            key={tab.id}
            className={`
              px-4 py-2 rounded-t-lg transition-colors border border-b-0 
              ${isActive 
                ? 'bg-meevo-surface-2 text-meevo-text-primary border border-b-0 border-meevo-border shadow-sm cursor-default' 
                : 'bg-transparent text-meevo-text-secondary hover:text-meevo-text-primary border-transparent hover:bg-meevo-surface-2/50 cursor-pointer'
              }
              ${tab.disabled ? 'opacity-50 pointer-events-none' : ''}
            `}
            onClick={() => {
              if (!tab.disabled && !isActive) onChange(tab.id);
            }}
          >
            {tab.label}
          </div>
        );
      })}
    </div>
  );
};
