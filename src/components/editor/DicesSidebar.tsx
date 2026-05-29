import React, { useState } from 'react';
import { Add24Regular, Delete24Regular, Copy24Regular } from '@fluentui/react-icons';
import type { DiceData } from '../../services/storage/types';
import { CreateDiceModal } from './CreateDiceModal';

interface DicesSidebarProps {
  boardDicesData: Record<string, DiceData>;
  selectedDiceId: string | null;
  setSelectedDiceId: (id: string | null) => void;
  onCreateDice: (dice: DiceData) => void;
  onDeleteDice: (id: string) => void;
  onDuplicateDice: (id: string) => void;
}

export const DicesSidebar: React.FC<DicesSidebarProps> = ({
  boardDicesData,
  selectedDiceId,
  setSelectedDiceId,
  onCreateDice,
  onDeleteDice,
  onDuplicateDice
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const dices = Object.values(boardDicesData);

  return (
    <div className="w-80 h-full border-r border-meevo-border flex flex-col bg-meevo-surface-1 z-10 shrink-0">
      <div className="h-[56px] px-6 border-b border-meevo-border flex items-center justify-between shrink-0">
        <h2 className="text-base font-medium text-meevo-text-primary">My Dices</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {dices.length === 0 ? (
          <div className="text-sm text-meevo-text-tertiary text-center mt-8">
            No dices created yet.
          </div>
        ) : (
          dices.map(dice => (
            <div 
              key={dice.id}
              onClick={() => setSelectedDiceId(dice.id)}
              className={`group flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${selectedDiceId === dice.id ? 'bg-meevo-purple/10 border-meevo-purple text-meevo-purple' : 'bg-meevo-surface-2 border-meevo-border text-meevo-text-secondary hover:border-[#CCCCCC]/30'}`}
            >
              <div className="flex flex-col">
                <span className="font-medium text-meevo-text-primary">{dice.name}</span>
                <span className="text-xs opacity-70">
                  {dice.sides} sides • {dice.template}
                </span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => { e.stopPropagation(); onDuplicateDice(dice.id); }}
                  className="p-1.5 text-meevo-text-tertiary hover:text-meevo-text-primary hover:bg-meevo-surface-2 rounded-md transition-colors"
                  title="Duplicate"
                >
                  <Copy24Regular fontSize={16} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDeleteDice(dice.id); }}
                  className="p-1.5 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                  title="Delete"
                >
                  <Delete24Regular fontSize={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-meevo-border shrink-0">
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full py-2 bg-meevo-purple text-white text-sm font-medium rounded-md hover:bg-meevo-purple-active transition-colors flex items-center justify-center gap-2"
        >
          <Add24Regular fontSize={16} />
          Create Dice
        </button>
      </div>

      {showCreateModal && (
        <CreateDiceModal 
          onClose={() => setShowCreateModal(false)}
          onCreate={(dice) => {
            onCreateDice(dice);
          }}
        />
      )}
    </div>
  );
};
