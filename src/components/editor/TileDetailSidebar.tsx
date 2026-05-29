import React, { useState, useEffect } from 'react';
import type { BoardTileVariable, BoardTileData } from '../../services/storage/types';
import { Add20Regular, Subtract20Regular } from '@fluentui/react-icons';
import { ColorPickerModal } from '../ui/ColorPickerModal';

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
  const tileData = boardTilesData[primaryTileId] || { id: primaryTileId };

  const [localName, setLocalName] = useState(tileData.name || `TILE ${primaryTileId}`);
  const [localRounded, setLocalRounded] = useState(tileData.rounded !== undefined ? tileData.rounded : 12);
  const [applyAllRounded, setApplyAllRounded] = useState(false);
  const [activeColorPicker, setActiveColorPicker] = useState<{propId: string, x: number, y: number} | null>(null);

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

  const handleTilePropertyChange = (propId: string, newVal: any) => {
    const newPropertyValues = { ...(tileData.propertyValues || {}), [propId]: newVal };
    if (applyAllRounded && selectedTileIds.length > 1) {
       onUpdateMultiple(selectedTileIds, { propertyValues: newPropertyValues });
    } else {
       onUpdateTile(primaryTileId, { propertyValues: newPropertyValues });
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

  const appliedVariables = variables.filter(v => (tileData.variableIds || []).includes(v.id));
  const [activeTabId, setActiveTabId] = useState<string>('General');

  useEffect(() => {
    if (activeTabId !== 'General' && !appliedVariables.find(v => v.id === activeTabId)) {
      setActiveTabId('General');
    }
  }, [appliedVariables, activeTabId]);

  const isGroup = selectedTileIds.length > 0 && selectedTileIds.every(id => boardTilesData[id]?.groupId && boardTilesData[id].groupId === boardTilesData[primaryTileId]?.groupId);

  const activeVariable = variables.find(v => v.id === activeTabId);

  return (
    <div className="flex flex-col h-full bg-meevo-surface-1 overflow-y-auto">
      {/* TABS */}
      <div className="flex border-b border-meevo-border overflow-x-auto hide-scrollbar sticky top-0 bg-meevo-surface-1 z-10 px-2 pt-2">
        <button
          onClick={() => setActiveTabId('General')}
          className={`shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTabId === 'General' ? 'border-meevo-purple text-meevo-text-primary' : 'border-transparent text-meevo-text-secondary hover:text-meevo-text-primary'}`}
        >
          General
        </button>
        {appliedVariables.map(v => (
          <button
            key={v.id}
            onClick={() => setActiveTabId(v.id)}
            className={`shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTabId === v.id ? 'border-meevo-purple text-meevo-text-primary' : 'border-transparent text-meevo-text-secondary hover:text-meevo-text-primary'}`}
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: v.color }} />
            {v.name}
          </button>
        ))}
      </div>

      <div className="p-6">
        {activeTabId === 'General' ? (
          <>
            {/* IDENTIFICADOR */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-meevo-text-secondary tracking-wider mb-2 uppercase">
                {isGroup ? "Identificador de grupo" : "Identificador"}
              </label>
              <input 
                type="text" 
                value={localName}
                onChange={handleNameChange}
                className="w-full bg-meevo-surface-2 border border-meevo-border rounded-md px-3 py-2 text-sm text-meevo-text-primary outline-none focus:ring-1 focus:ring-meevo-purple transition-colors"
              />
            </div>

            {/* ROUNDED */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-meevo-text-secondary tracking-wider mb-2 uppercase">Rounded</label>
              <div className="flex flex-col gap-3">
                <input 
                  type="number" 
                  value={localRounded}
                  onChange={handleRoundedChange}
                  className="w-full bg-meevo-surface-2 border border-meevo-border rounded-md px-3 py-2 text-sm text-meevo-text-primary outline-none focus:ring-1 focus:ring-meevo-purple transition-colors"
                />
                <label className="flex items-center cursor-pointer w-max" title="Apply to all selected">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only"
                      checked={applyAllRounded}
                      onChange={(e) => setApplyAllRounded(e.target.checked)}
                    />
                    <div className={`block w-9 h-5 rounded-full transition-colors ${applyAllRounded ? 'bg-meevo-purple' : 'bg-meevo-surface-2 border border-meevo-border'}`}></div>
                    <div className={`dot absolute left-1 top-1 w-3 h-3 rounded-full transition-transform ${applyAllRounded ? 'bg-white transform translate-x-4' : 'bg-meevo-text-tertiary'}`}></div>
                  </div>
                  <span className="ml-2 text-xs font-bold text-meevo-text-secondary tracking-wider uppercase">Apply All</span>
                </label>
              </div>
            </div>

            {/* VARIABLES TOGGLE */}
            {variables.length > 0 && (
              <div className="mb-6 border-t border-meevo-border pt-6">
                <label className="block text-xs font-bold text-meevo-text-secondary tracking-wider mb-3 uppercase">Type Tiles</label>
                <div className="flex flex-wrap gap-2">
                  {variables.map(v => {
                    const currentVars = tileData.variableIds || (tileData as any).propertyIds || [];
                    const isActive = currentVars.includes(v.id);
                    return (
                      <button
                        key={v.id}
                        onClick={() => toggleVariable(v.id)}
                        className={`relative w-8 h-8 rounded-md transition-all group flex items-center justify-center ${isActive ? 'ring-2 ring-white ring-offset-2 ring-offset-meevo-panel' : 'opacity-50 hover:opacity-100 border border-meevo-border'}`}
                        style={{ backgroundColor: v.color }}
                        title={v.name}
                      >
                        {!isActive && <Add20Regular className="text-meevo-text-primary opacity-0 group-hover:opacity-100 transition-opacity" />}
                        {isActive && <Subtract20Regular className="text-meevo-text-primary opacity-0 group-hover:opacity-100 transition-opacity" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          activeVariable && activeVariable.properties && activeVariable.properties.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2 border-b border-meevo-border pb-4">
                <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: activeVariable.color }} />
                <h3 className="text-sm font-bold text-meevo-text-primary uppercase tracking-wide">{activeVariable.name} Properties</h3>
              </div>
              
              {activeVariable.properties.map(prop => {
                const val = tileData.propertyValues?.[prop.id] ?? prop.defaultValue ?? '';
                
                const handlePropChange = (newVal: any) => handleTilePropertyChange(prop.id, newVal);

                return (
                  <div key={prop.id}>
                    <label className="block text-xs font-bold text-meevo-text-secondary tracking-wider mb-2 uppercase">
                      {prop.name}
                    </label>
                    
                    {prop.type === 'Number' && (
                      <div className="flex items-center">
                        {prop.prefix && (
                          <span className="bg-meevo-surface-2 border border-r-0 border-meevo-border rounded-l-md px-3 py-2 text-sm text-meevo-text-secondary h-[38px] flex items-center">
                            {prop.prefix}
                          </span>
                        )}
                        <input 
                          type="number"
                          value={val}
                          onChange={e => handlePropChange(e.target.value)}
                          className={`w-full bg-meevo-surface-2 border border-meevo-border px-3 py-2 text-sm text-meevo-text-primary outline-none focus:ring-1 focus:ring-meevo-purple transition-colors h-[38px] ${prop.prefix ? 'rounded-r-md' : 'rounded-md'}`}
                        />
                      </div>
                    )}
                    
                    {prop.type === 'Text' && (
                      <input 
                        type="text"
                        value={val}
                        onChange={e => handlePropChange(e.target.value)}
                        className="w-full bg-meevo-surface-2 border border-meevo-border rounded-md px-3 py-2 text-sm text-meevo-text-primary outline-none focus:ring-1 focus:ring-meevo-purple transition-colors h-[38px]"
                      />
                    )}
                    
                    {prop.type === 'Color' && (
                      <div className="flex items-center gap-3 bg-meevo-surface-2 border border-meevo-border rounded-md px-2 py-1.5 focus-within:ring-1 focus-within:ring-meevo-purple h-[38px]">
                        <div 
                          className="w-5 h-5 rounded-sm border border-[#555] shrink-0 cursor-pointer" 
                          style={{ backgroundColor: val || '#ffffff' }}
                          onClick={(e) => {
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            setActiveColorPicker({ propId: prop.id, x: rect.right + 10, y: rect.top });
                          }}
                        />
                        <input 
                          type="text"
                          placeholder="#ffffff"
                          value={val}
                          onChange={e => handlePropChange(e.target.value)}
                          className="w-full bg-transparent text-sm text-meevo-text-primary outline-none uppercase"
                        />
                      </div>
                    )}
                    
                    {prop.type === 'List' && (
                      <div className="relative">
                        <select
                          value={val}
                          onChange={e => handlePropChange(e.target.value)}
                          className="w-full bg-meevo-surface-2 border border-meevo-border rounded-md px-3 py-2 text-sm text-meevo-text-primary outline-none focus:ring-1 focus:ring-meevo-purple transition-colors h-[38px] appearance-none"
                        >
                          <option value="">Select an option</option>
                          {prop.listOptions?.map((opt, i) => (
                            <option key={i} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-meevo-text-tertiary"><path d="M6 9l6 6 6-6"/></svg>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-meevo-text-secondary italic">
              No properties found for this Type Tile.
            </div>
          )
        )}
        {activeColorPicker && (
          <ColorPickerModal
            color={tileData.propertyValues?.[activeColorPicker.propId] || variables.flatMap(v => v.properties || []).find(p => p.id === activeColorPicker.propId)?.defaultValue || '#ffffff'}
            onChange={(color) => handleTilePropertyChange(activeColorPicker.propId, color)}
            onClose={() => setActiveColorPicker(null)}
            x={activeColorPicker.x}
            y={activeColorPicker.y}
          />
        )}
      </div>
    </div>
  );
};

