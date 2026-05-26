import React, { useState } from 'react';
import { Dismiss20Regular } from '@fluentui/react-icons';

interface CreateComponentModalProps {
  onClose: () => void;
  onCreate: (name: string) => void;
}

export const CreateComponentModal: React.FC<CreateComponentModalProps> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate(name.trim());
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#0C0C0E] border border-[#CCCCCC]/10 rounded-lg shadow-2xl w-[400px] flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#CCCCCC]/10 shrink-0">
          <h2 className="text-lg font-medium text-meevo-text-primary">Create Component</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md border border-[#333333] hover:bg-[#1A1A1D] text-meevo-text-primary transition-colors"
          >
            <Dismiss20Regular />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <div className="mb-6">
            <label className="block text-xs font-bold text-meevo-text-secondary tracking-wider mb-2 uppercase">
              Component Name
            </label>
            <input 
              type="text"
              placeholder="e.g. Card Template"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#1A1A1D] rounded-md px-3 py-2 text-sm text-meevo-text-primary outline-none focus:ring-1 focus:ring-meevo-purple border border-[#333333]"
            />
          </div>
          
          <div className="flex justify-end mt-4">
            <button 
              onClick={handleCreate}
              disabled={!name.trim()}
              className="bg-white text-black font-medium py-2 px-4 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Component
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
