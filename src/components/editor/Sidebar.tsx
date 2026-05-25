import React, { useState, useEffect, useRef } from 'react';

interface SidebarProps {
  children: React.ReactNode;
  minWidthRatio?: number; // 0.12 or 0.16
}

export const Sidebar: React.FC<SidebarProps> = ({ children, minWidthRatio = 0.12 }) => {
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const isDragging = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const newWidth = e.clientX;
      const minWidth = window.innerWidth * minWidthRatio;
      const maxWidth = window.innerWidth * 0.50;
      setSidebarWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)));
    };
    
    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = 'default';
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [minWidthRatio]);

  return (
    <aside 
      style={{ width: sidebarWidth }} 
      className="border-r border-[#CCCCCC]/10 bg-meevo-bg flex flex-col shrink-0 relative"
    >
      {/* Resize Handle */}
      <div 
        className="absolute top-0 right-[-2px] w-1 h-full cursor-col-resize hover:bg-meevo-purple/50 z-20"
        onMouseDown={() => {
          isDragging.current = true;
          document.body.style.cursor = 'col-resize';
        }}
      />
      {children}
    </aside>
  );
};
