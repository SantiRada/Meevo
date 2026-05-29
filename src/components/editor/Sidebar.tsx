import React from 'react';

interface SidebarProps {
  children: React.ReactNode;
  minWidthRatio?: number; // 0.12 or 0.16
}

export const Sidebar: React.FC<SidebarProps> = ({ children, minWidthRatio = 0.12 }) => {
  return (
    <div 
      style={{ width: `max(300px, ${minWidthRatio * 100}vw)` }}
      className="border-r border-meevo-border bg-meevo-surface-1 flex flex-col shrink-0 relative"
    >
      {children}
    </div>
  );
};
