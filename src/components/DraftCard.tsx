import React from 'react';
import { Grid24Regular, Clock16Regular, Delete16Regular } from '@fluentui/react-icons';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

interface DraftCardProps {
  title?: string;
  tiles?: number;
  players?: number;
  emptyTiles?: number;
  progress?: number;
  updatedAt?: string;
  className?: string;
  onClick?: () => void;
  onDelete?: () => void;
}

export const DraftCard: React.FC<DraftCardProps> = ({
  title = 'Untitled Draft',
  tiles = 40,
  players = 4,
  emptyTiles = 40,
  progress = 0,
  updatedAt = 'May 24, 2026',
  className,
  onClick,
  onDelete
}) => {
  return (
    <div 
      className={twMerge(
        "bg-meevo-panel rounded-md border border-meevo-border p-6",
        "hover:border-meevo-text-secondary transition-colors duration-200 cursor-pointer",
        "flex flex-col gap-4 relative group",
        className
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex gap-4">
        <div className="w-12 h-12 rounded-sm bg-[#1A1A1D] flex-center text-meevo-text-secondary shrink-0">
          <Grid24Regular />
        </div>
        <div className="flex flex-col justify-center">
          <h3 className="text-meevo-text-primary font-medium">{title}</h3>
          <p className="text-meevo-text-tertiary text-sm">
            {tiles} tiles • {players} players
          </p>
        </div>
      </div>

      {/* Badges */}
      <div>
        <span className="inline-block bg-[#1A1A1D] text-meevo-text-secondary text-xs px-2 py-1 rounded-sm border border-meevo-border">
          {emptyTiles} empty
        </span>
      </div>

      {/* Progress */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-sm">
          <span className="text-meevo-text-tertiary">Progress</span>
          <span className="text-meevo-text-tertiary">{progress}%</span>
        </div>
        <div className="h-1.5 w-full bg-meevo-border rounded-full overflow-hidden">
          <div 
            className="h-full bg-meevo-text-secondary rounded-full" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-transparent">
        <div className="flex items-center gap-1.5 text-meevo-text-tertiary text-xs">
          <Clock16Regular />
          <span>Updated {updatedAt}</span>
        </div>
        
        <button 
          className="text-meevo-text-tertiary hover:text-[#ff4444] opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
          title="Delete Draft"
        >
          <Delete16Regular />
        </button>
      </div>
    </div>
  );
};
