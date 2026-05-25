import React, { useState, useEffect } from 'react';
import type { BoardTileVariable, BoardTileData } from '../../services/storage/types';
import { Add20Regular, Subtract20Regular } from '@fluentui/react-icons';

interface TileDetailSidebarProps {
  selectedTileIds: number[];
  boardTilesData: Record<number, BoardTileData>;
  variables: BoardTileVariable[];
  onUpdateTile: (tileId: number, data: Partial<BoardTileData>) => void;
  onUpdateMultiple: (tileIds: number[], data: Partial<BoardTileData>) => void;
  onUpdateAll: (data: Partial<BoardTileData>) => void;
}

export const TileDetailSidebar: React.FC<TileDetailSidebarProps> = ({
  selectedTileIds,
  boardTilesData,
  variables,
  onUpdateTile,
  onUpdateMultiple,
  onUpdateAll
}) => {
  if (selectedTileIds.length === 0) return null;

  // We show the state of the first selected tile
  const primaryTileId = selectedTileIds[0];
  const tileData = boardTilesData[primaryTileId] || {};

  const [localName, setLocalName] = useState(tileData.name || `TILE ${primaryTileId}`);
  const [localRounded, setLocalRounded] = useState(tileData.rounded !== undefined ? tileData.rounded : 12);
  const [applyAllRounded, setApplyAllRounded] = useState(false);

  // Sync state when primary tile changes
  useEffect(() => {
    setLocalName(boardTilesData[primaryTileId]?.name || `TILE ${primaryTileId}`);
    setLocalRounded(boardTilesData[primaryTileId]?.rounded !== undefined ? boardTilesData[primaryTileId].rounded! : 12);
  }, [primaryTileId, boardTilesData]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setLocalName(newName);
    // If multiple selected, should we rename all? Usually just the primary or disable it.
    // Let's just update the primary one for now, or all if we want.
    onUpdateTile(primaryTileId, { name: newName });
  };

  const handleRoundedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newRounded = parseInt(e.target.value) || 0;
    if (newRounded < 0) newRounded = 0;
    setLocalRounded(newRounded);
    if (applyAllRounded) {
      if (selectedTileIds.length === 1) {
        // Only one tile selected, but apply all checked: apply to ALL tiles
        onUpdateAll({ rounded: newRounded });
      } else {
        // Multiple selected, apply to all selected
        onUpdateMultiple(selectedTileIds, { rounded: newRounded });
      }
    } else {
      onUpdateTile(primaryTileId, { rounded: newRounded });
    }
  };

  const toggleVariable = (varId: string) => {
    const currentVars = tileData.variableIds || (tileData as any).propertyIds || [];
    const hasVar = currentVars.includes(varId);
    
    let newVars: string[];
    if (hasVar) {
      newVars = currentVars.filter(id => id !== varId);
    } else {
      newVars = [...currentVars, varId];
    }

    // Apply to all selected tiles
    onUpdateMultiple(selectedTileIds, { variableIds: newVars });
  };

  const isGroup = selectedTileIds.length > 0 && selectedTileIds.every(id => boardTilesData[id]?.groupId && boardTilesData[id].groupId === boardTilesData[primaryTileId]?.groupId);

  return (
    <div className="flex flex-col h-full bg-meevo-panel p-6 overflow-y-auto">
      <h2 className="text-sm font-bold text-meevo-text-primary mb-8 tracking-wide">Tiles</h2>

      {/* IDENTIFICADOR */}
      <div className="mb-6">
        <label className="block text-xs font-bold text-meevo-text-secondary tracking-wider mb-2 uppercase">
          {isGroup ? "Identificador de grupo" : "Identificador"}
        </label>
        <input 
          type="text" 
          value={localName}
          onChange={handleNameChange}
          className="w-full bg-[#1A1A1D] rounded-md px-3 py-2 text-sm text-meevo-text-primary outline-none focus:ring-1 focus:ring-meevo-purple transition-colors"
        />
      </div>

      {/* ROUNDED */}
      <div className="mb-6">
        <label className="block text-xs font-bold text-meevo-text-secondary tracking-wider mb-2 uppercase">Rounded</label>
        <input 
          type="number" 
          value={localRounded}
          onChange={handleRoundedChange}
          className="w-full bg-[#1A1A1D] rounded-md px-3 py-2 text-sm text-meevo-text-primary outline-none focus:ring-1 focus:ring-meevo-purple transition-colors mb-3"
        />
        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            checked={applyAllRounded}
            onChange={(e) => setApplyAllRounded(e.target.checked)}
            className="w-4 h-4 rounded bg-[#1A1A1D] border border-[#2B3830] text-meevo-purple focus:ring-0 focus:ring-offset-0"
          />
          <span className="text-xs font-bold text-meevo-text-secondary tracking-wider uppercase">Apply All</span>
        </label>
      </div>

      {/* VARIABLES TOGGLE */}
      {variables.length > 0 && (
        <div className="mb-6 border-t border-[#CCCCCC]/10 pt-6">
          <label className="block text-xs font-bold text-meevo-text-secondary tracking-wider mb-3 uppercase">Variable</label>
          <div className="flex flex-wrap gap-2">
            {variables.map(v => {
              const currentVars = tileData.variableIds || (tileData as any).propertyIds || [];
              const isActive = currentVars.includes(v.id);
              return (
                <button
                  key={v.id}
                  onClick={() => toggleVariable(v.id)}
                  className={`relative w-8 h-8 rounded-md transition-all group flex items-center justify-center ${isActive ? 'ring-2 ring-white ring-offset-2 ring-offset-meevo-panel' : 'opacity-50 hover:opacity-100'}`}
                  style={{ backgroundColor: v.color }}
                  title={v.name}
                >
                  {!isActive && <Add20Regular className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />}
                  {isActive && <Subtract20Regular className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
