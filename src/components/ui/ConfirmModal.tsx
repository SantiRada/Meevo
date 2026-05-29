import React from 'react';
import { Dismiss20Regular } from '@fluentui/react-icons';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = true
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-meevo-surface-0 border border-meevo-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-meevo-border">
          <h2 className="text-meevo-text-primary font-bold text-lg">{title}</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-meevo-text-secondary hover:text-meevo-text-primary hover:bg-meevo-surface-2 rounded-full transition-colors"
          >
            <Dismiss20Regular />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 text-meevo-text-secondary">
          <p>{message}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-meevo-border bg-meevo-surface-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-meevo-text-secondary hover:text-meevo-text-primary hover:bg-meevo-surface-2 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              danger 
                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20' 
                : 'bg-meevo-purple text-white hover:bg-meevo-purple-active-hover'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
