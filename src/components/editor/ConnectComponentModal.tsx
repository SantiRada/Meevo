import React from 'react';
import { Dismiss20Regular } from '@fluentui/react-icons';
import type { BoardTileComponent } from '../../services/storage/types';

interface ConnectComponentModalProps {
  components: BoardTileComponent[];
  onClose: () => void;
  onConnect: (componentId: string) => void;
}

export const ConnectComponentModal: React.FC<ConnectComponentModalProps> = ({ components, onClose, onConnect }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#0C0C0E] border border-[#CCCCCC]/10 rounded-lg shadow-2xl w-[400px] flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#CCCCCC]/10 shrink-0">
          <h2 className="text-lg font-medium text-meevo-text-primary">Connect Component</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md border border-[#333333] hover:bg-[#1A1A1D] text-meevo-text-primary transition-colors"
          >
            <Dismiss20Regular />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {components.length === 0 ? (
            <div className="text-center text-sm text-meevo-text-secondary italic py-8">
              No components available. Convert a tile to a component first.
            </div>
          ) : (
            <div className="space-y-2">
              {components.map(comp => (
                <button
                  key={comp.id}
                  onClick={() => onConnect(comp.id)}
                  className="w-full flex items-center justify-between p-4 rounded-md bg-[#1A1A1D] border border-[#333333] hover:border-meevo-purple hover:bg-[#201A24] transition-colors text-left group"
                >
                  <span className="text-sm font-medium text-meevo-text-primary">{comp.name}</span>
                  <span className="text-xs text-meevo-text-secondary">{comp.layers.length} layers</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
