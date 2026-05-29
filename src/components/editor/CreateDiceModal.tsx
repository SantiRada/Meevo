import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import type { DiceData } from '../../services/storage/types';
import { Dismiss24Regular } from '@fluentui/react-icons';

interface CreateDiceModalProps {
  onClose: () => void;
  onCreate: (dice: DiceData) => void;
}

export const CreateDiceModal: React.FC<CreateDiceModalProps> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('My Dice');
  const [sides, setSides] = useState(6);
  const [template, setTemplate] = useState<'Dots' | 'Numbers' | 'Images'>('Numbers');
  const [startNumber, setStartNumber] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dice: DiceData = {
      id: Date.now().toString(),
      name,
      sides,
      template,
      fontFamily: 'Inter',
      fontSize: 24,
      startNumber,
      stepDistance: 1,
      baseColor: '#FFFFFF',
      pipColor: '#000000',
      edgeColor: '#000000',
      edgeSize: 0,
      rounded: 4,
      faces: {}
    };
    onCreate(dice);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
      <div className="bg-meevo-surface-0 border border-meevo-border rounded-xl shadow-2xl w-full max-w-md flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-meevo-border">
          <h2 className="text-lg font-medium text-meevo-text-primary">Create new dice</h2>
          <button onClick={onClose} className="text-meevo-text-secondary hover:text-meevo-text-primary">
            <Dismiss24Regular />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-meevo-text-secondary">Dice Name</label>
            <input 
              autoFocus
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-meevo-surface-4 border border-meevo-border rounded-md px-3 py-2 text-sm text-meevo-text-primary focus:outline-none focus:border-meevo-purple"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-meevo-text-secondary">Type of Dice (Platonic Solids)</label>
            <div className="flex flex-wrap gap-2">
              {[4, 6, 8, 12, 20].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSides(s);
                    if (template === 'Dots' && s !== 6) {
                      setTemplate('Numbers');
                    }
                  }}
                  className={`flex-1 min-w-[60px] py-2 text-sm rounded-md border transition-colors ${sides === s ? 'border-meevo-purple bg-meevo-purple/10 text-meevo-purple' : 'border-meevo-border text-meevo-text-secondary hover:border-[#CCCCCC]/30'}`}
                >
                  D{s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-meevo-text-secondary">Template</label>
            <div className="flex gap-2">
              {sides <= 9 && sides !== 4 && sides !== 8 && sides !== 20 && (
                <button
                  type="button"
                  onClick={() => setTemplate('Dots')}
                  className={`flex-1 py-2 text-sm rounded-md border transition-colors ${template === 'Dots' ? 'border-meevo-purple bg-meevo-purple/10 text-meevo-purple' : 'border-meevo-border text-meevo-text-secondary hover:border-[#CCCCCC]/30'}`}
                >
                  Dots
                </button>
              )}
              <button
                type="button"
                onClick={() => setTemplate('Numbers')}
                className={`flex-1 py-2 text-sm rounded-md border transition-colors ${template === 'Numbers' ? 'border-meevo-purple bg-meevo-purple/10 text-meevo-purple' : 'border-meevo-border text-meevo-text-secondary hover:border-[#CCCCCC]/30'}`}
              >
                Numbers
              </button>
              <button
                type="button"
                onClick={() => setTemplate('Images')}
                className={`flex-1 py-2 text-sm rounded-md border transition-colors ${template === 'Images' ? 'border-meevo-purple bg-meevo-purple/10 text-meevo-purple' : 'border-meevo-border text-meevo-text-secondary hover:border-[#CCCCCC]/30'}`}
              >
                Images
              </button>
            </div>
          </div>

          {(template === 'Numbers' || template === 'Dots') && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-meevo-text-secondary">First Number</label>
              <input 
                type="number" 
                value={startNumber}
                onChange={e => setStartNumber(parseInt(e.target.value) || 0)}
                className="w-full bg-meevo-surface-4 border border-meevo-border rounded-md px-3 py-2 text-sm text-meevo-text-primary focus:outline-none focus:border-meevo-purple"
                required
              />
            </div>
          )}

          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-meevo-text-secondary hover:text-meevo-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-meevo-purple text-white text-sm font-medium rounded-md hover:bg-meevo-purple-active transition-colors"
            >
              Create Dice
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
