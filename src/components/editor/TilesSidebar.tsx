import React, { useState, useEffect } from 'react';
import type { BoardTileVariable } from '../../services/storage/types';
import { Add20Regular, PaintBrush20Regular, Group20Regular, Dismiss20Regular } from '@fluentui/react-icons';
import { useNotification } from '../../contexts/NotificationContext';

interface TilesSidebarProps {
  variables: BoardTileVariable[];
  setVariables: (props: BoardTileVariable[]) => void;
  selectedTileIds: number[];
  onPaintSelected: (variableId: string) => void;
  onCreateGroup: () => void;
  onUngroup: () => void;
  isGroupSelected: boolean;
}

export const TilesSidebar: React.FC<TilesSidebarProps> = ({
  variables,
  setVariables,
  selectedTileIds,
  onPaintSelected,
  onCreateGroup,
  onUngroup,
  isGroupSelected
}) => {
  const [newVarName, setNewVarName] = useState('');
  const [activeVariableId, setActiveVariableId] = useState<string | null>(null);
  const [pickingColorId, setPickingColorId] = useState<string | null>(null);

  const colors = ['#0055FF', '#FF2222', '#22CC22', '#FFCC00', '#AA22FF', '#00CCFF'];
  
  const palette = [
    '#0055FF', '#FF2222', '#22CC22', '#FFCC00', '#AA22FF', '#00CCFF',
    '#FF0055', '#55FF00', '#FF8800', '#00FF88', '#8800FF', '#0088FF',
    '#FFFFFF', '#AAAAAA', '#555555', '#222222'
  ];

  const handleCreateVariable = () => {
    if (!newVarName.trim()) return;
    const newVar: BoardTileVariable = {
      id: Date.now().toString(),
      name: newVarName.trim(),
      color: colors[variables.length % colors.length]
    };
    setVariables([...variables, newVar]);
    setNewVarName('');
  };

  const handlePaint = () => {
    if (activeVariableId && selectedTileIds.length > 0) {
      onPaintSelected(activeVariableId);
    }
  };

  const updateColor = (id: string, color: string) => {
    const newVars = variables.map(v => v.id === id ? { ...v, color } : v);
    setVariables(newVars);
  };

  const { addNotification } = useNotification();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
      
      if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        if (!activeVariableId) {
          addNotification({ type: 'error', title: 'Select a variable first', layout: 'simple' });
        } else if (selectedTileIds.length > 0) {
          onPaintSelected(activeVariableId);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeVariableId, selectedTileIds, onPaintSelected, addNotification]);

  return (
    <div className="flex flex-col h-full bg-meevo-panel p-6">
      <div className="mb-8">
        <label className="block text-xs font-bold text-meevo-text-secondary tracking-wider mb-2 uppercase">Name</label>
        <input 
          type="text" 
          placeholder="Variable Name"
          value={newVarName}
          onChange={(e) => setNewVarName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCreateVariable();
          }}
          className="w-full bg-[#1A1A1D] rounded-md px-3 py-2 text-sm text-meevo-text-primary outline-none focus:ring-1 focus:ring-meevo-purple mb-3"
        />
        <button 
          onClick={handleCreateVariable}
          className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-200 text-black py-2 rounded-md transition-colors text-sm font-bold"
        >
          <Add20Regular />
          Create Variable
        </button>
      </div>

      <div className="mb-8 flex-1 overflow-y-auto pr-2">
        <label className="block text-xs font-bold text-meevo-text-secondary tracking-wider mb-4 uppercase">Variables</label>
        <div className="space-y-1">
          {variables.map(v => (
            <div key={v.id} className="flex flex-col gap-1">
              <div 
                onClick={() => {
                  setActiveVariableId(v.id);
                  if (pickingColorId === v.id) setPickingColorId(null);
                }}
                className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors ${
                  activeVariableId === v.id ? 'bg-[#1A1A1D] border border-meevo-purple' : 'hover:bg-[#1A1A1D] border border-transparent'
                }`}
              >
                <div 
                  className="w-4 h-4 rounded-full cursor-pointer relative overflow-hidden shrink-0 shadow-inner" 
                  style={{ backgroundColor: v.color }} 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setPickingColorId(pickingColorId === v.id ? null : v.id); 
                  }}
                />
                <span className="text-sm text-meevo-text-primary flex-1 truncate">{v.name}</span>
              </div>
              
              {pickingColorId === v.id && (
                <div className="p-3 bg-[#1A1A1D] rounded-md border border-[#333333] grid grid-cols-8 gap-2 ml-3">
                  {palette.map(c => (
                    <button
                      key={c}
                      onClick={() => { updateColor(v.id, c); setPickingColorId(null); }}
                      className="w-4 h-4 rounded-full cursor-pointer hover:scale-125 transition-transform"
                      style={{ backgroundColor: c, border: c === '#000000' || c === '#1A1A1D' ? '1px solid #444' : 'none' }}
                      title={c}
                    />
                  ))}
                  <div className="col-span-8 flex items-center gap-2 mt-1">
                    <span className="text-xs text-meevo-text-secondary">Hex</span>
                    <input 
                      type="text" 
                      value={v.color}
                      onChange={(e) => updateColor(v.id, e.target.value)}
                      className="flex-1 bg-[#0C0C0E] text-xs text-white px-2 py-1 rounded outline-none border border-transparent focus:border-meevo-purple"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-[#CCCCCC]/10 pt-6 mt-auto">
        <div className="text-xs text-meevo-text-secondary mb-4">
          {selectedTileIds.length} tiles selected
        </div>
        
        <button 
          onClick={handlePaint}
          disabled={selectedTileIds.length === 0 || !activeVariableId}
          className="w-full flex items-center justify-center gap-2 bg-[#1A1A1D] hover:bg-[#2A2A2D] disabled:opacity-50 disabled:cursor-not-allowed text-meevo-text-primary py-2 rounded-md transition-colors text-sm font-medium mb-3"
        >
          <PaintBrush20Regular />
          Paint Selected
        </button>

        {!isGroupSelected && (
          <button 
            onClick={onCreateGroup}
            disabled={selectedTileIds.length < 2}
            className="w-full flex items-center justify-center gap-2 bg-[#1A1A1D] hover:bg-[#2A2A2D] disabled:opacity-50 disabled:cursor-not-allowed text-meevo-text-primary py-2 rounded-md transition-colors text-sm font-medium mb-3"
          >
            <Group20Regular />
            Create Group
          </button>
        )}

        {isGroupSelected && (
          <button 
            onClick={onUngroup}
            className="w-full flex items-center justify-center gap-2 border border-red-500/30 hover:bg-red-500/10 text-red-400 py-2 rounded-md transition-colors text-sm font-medium"
          >
            <Dismiss20Regular />
            Ungroup
          </button>
        )}
      </div>
    </div>
  );
};
