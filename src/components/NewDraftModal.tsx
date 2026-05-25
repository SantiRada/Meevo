import React, { useState } from 'react';
import { Dismiss20Regular } from '@fluentui/react-icons';

interface NewDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

export const NewDraftModal: React.FC<NewDraftModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim());
      setName('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#00000080] backdrop-blur-sm">
      <div className="bg-meevo-panel border border-meevo-border rounded-md shadow-2xl w-full max-w-md p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-meevo-text-tertiary hover:text-meevo-text-primary transition-colors"
        >
          <Dismiss20Regular />
        </button>
        
        <h2 className="text-xl font-medium text-meevo-text-primary mb-6">Create New Draft</h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="draftName" className="text-sm text-meevo-text-secondary font-medium">
              Draft Name
            </label>
            <input 
              id="draftName"
              type="text" 
              autoFocus
              placeholder="e.g. My Awesome Board Game"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#1A1A1D] border border-meevo-border rounded-sm px-3 py-2 text-meevo-text-primary outline-none focus:border-meevo-purple transition-colors"
            />
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 rounded-sm text-sm font-medium text-meevo-text-secondary hover:text-meevo-text-primary hover:bg-[#1A1A1D] transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={!name.trim()}
              className="px-4 py-2 rounded-sm text-sm font-medium bg-meevo-text-primary text-meevo-text-inverse hover:bg-meevo-text-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
