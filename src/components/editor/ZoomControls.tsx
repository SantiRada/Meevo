import React from 'react';
import { ZoomIn20Regular, ZoomOut20Regular, ArrowUndo20Regular } from '@fluentui/react-icons';

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onUndo?: () => void;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({ onZoomIn, onZoomOut, onUndo }) => {
  return (
    <div className="absolute top-4 right-4 flex flex-col gap-2 z-10 pointer-events-none">
      <div className="bg-meevo-surface-2 border border-meevo-border rounded-md shadow-lg flex flex-col overflow-hidden p-1 gap-1 pointer-events-auto">
        <button 
          onClick={onZoomIn}
          className="p-2 text-meevo-text-secondary hover:text-meevo-text-primary hover:bg-meevo-surface-3 rounded-sm transition-colors"
          title="Zoom In"
        >
          <ZoomIn20Regular />
        </button>
        <button 
          onClick={onZoomOut}
          className="p-2 text-meevo-text-secondary hover:text-meevo-text-primary hover:bg-meevo-surface-3 rounded-sm transition-colors"
          title="Zoom Out"
        >
          <ZoomOut20Regular />
        </button>
        {onUndo && (
          <button 
            onClick={onUndo}
            className="p-2 text-meevo-text-secondary hover:text-meevo-text-primary hover:bg-meevo-surface-3 rounded-sm transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <ArrowUndo20Regular />
          </button>
        )}
      </div>
    </div>
  );
};
