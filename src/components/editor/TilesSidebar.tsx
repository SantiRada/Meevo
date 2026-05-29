import React, { useState, useEffect } from 'react';
import type { BoardTileVariable } from '../../services/storage/types';
import { Add20Regular } from '@fluentui/react-icons';
import { useNotification } from '../../contexts/NotificationContext';
import { ColorPickerModal } from '../ui/ColorPickerModal';

interface TilesSidebarProps {
  variables: BoardTileVariable[];
  setVariables: (props: BoardTileVariable[]) => void;
  selectedTileIds: number[];
  onPaintSelected: (variableId: string) => void;
  onCreateGroup: () => void;
  onUngroup: () => void;
  isGroupSelected: boolean;
  onDeleteVariable: (variableId: string) => void;
  activeVariableId: string | null;
  setActiveVariableId: (id: string | null) => void;
}

export const TilesSidebar: React.FC<TilesSidebarProps> = ({
  variables,
  setVariables,
  selectedTileIds,
  onPaintSelected,
  onCreateGroup,
  onUngroup,
  isGroupSelected,
  onDeleteVariable,
  activeVariableId,
  setActiveVariableId
}) => {
  const [newVarName, setNewVarName] = useState('');
  const [pickingColor, setPickingColor] = useState<{id: string, x: number, y: number} | null>(null);
  const [editingVarId, setEditingVarId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

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
          addNotification({ type: 'error', title: 'Select a Type Tile first', layout: 'simple' });
        } else if (selectedTileIds.length > 0) {
          onPaintSelected(activeVariableId);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeVariableId, selectedTileIds, onPaintSelected, addNotification]);

  return (
    <div className="flex flex-col h-full bg-meevo-surface-1">
      <div className="h-[56px] px-6 border-b border-meevo-border flex items-center shrink-0">
        <h2 className="text-base font-medium text-meevo-text-primary">Tiles</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col">
        <label className="block text-xs font-bold text-meevo-text-secondary tracking-wider mb-4 uppercase">Type Tiles</label>
        <div className="space-y-1">
          {variables.map(v => (
            <div key={v.id} className="flex flex-col gap-1 group">
              <div 
                onClick={() => {
                  if (editingVarId !== v.id) {
                    setActiveVariableId(v.id);
                    if (pickingColor?.id === v.id) setPickingColor(null);
                  }
                }}
                className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors ${
                  activeVariableId === v.id ? 'bg-meevo-surface-2 border border-meevo-purple' : 'hover:bg-meevo-surface-2 border border-transparent'
                }`}
              >
                <div 
                  className="w-4 h-4 rounded-full cursor-pointer relative overflow-hidden shrink-0 shadow-inner" 
                  style={{ backgroundColor: v.color }} 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (editingVarId !== v.id) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setPickingColor(pickingColor?.id === v.id ? null : { id: v.id, x: rect.right + 10, y: rect.top }); 
                    }
                  }}
                />
                
                {editingVarId === v.id ? (
                  <input
                    autoFocus
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => {
                      if (editingName.trim()) {
                        setVariables(variables.map(vari => vari.id === v.id ? { ...vari, name: editingName.trim() } : vari));
                      }
                      setEditingVarId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (editingName.trim()) {
                          setVariables(variables.map(vari => vari.id === v.id ? { ...vari, name: editingName.trim() } : vari));
                        }
                        setEditingVarId(null);
                      }
                    }}
                    className="flex-1 bg-transparent text-sm text-meevo-text-primary outline-none border-b border-meevo-purple"
                  />
                ) : (
                  <>
                    <span className="text-sm text-meevo-text-primary flex-1 truncate">{v.name}</span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingVarId(v.id);
                          setEditingName(v.name);
                        }}
                        className="text-meevo-text-secondary hover:text-meevo-text-primary"
                        title="Rename"
                      >
                        <svg fontSize="14" fill="currentColor" aria-hidden="true" width="16" height="16" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M17.18 2.93a2.97 2.97 0 0 0-4.26-.06l-9.37 9.38c-.33.33-.56.74-.66 1.2l-.88 3.94a.5.5 0 0 0 .6.6l3.93-.87c.46-.1.9-.34 1.23-.68l9.36-9.36a2.97 2.97 0 0 0 .05-4.15Zm-3.55.65a1.97 1.97 0 1 1 2.8 2.8l-.68.66-2.8-2.79.68-.67Zm-1.38 1.38 2.8 2.8-7.99 7.97c-.2.2-.46.35-.74.41l-3.16.7.7-3.18c.07-.27.2-.51.4-.7l8-8Z" fill="currentColor"></path></svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (activeVariableId === v.id) setActiveVariableId(null);
                          onDeleteVariable(v.id);
                        }}
                        className="text-meevo-text-secondary hover:text-red-500"
                        title="Delete"
                      >
                        <svg fontSize="14" fill="currentColor" aria-hidden="true" width="16" height="16" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M8.5 4h3a1.5 1.5 0 0 0-3 0Zm-1 0a2.5 2.5 0 0 1 5 0h5a.5.5 0 0 1 0 1h-1.05l-1.2 10.34A3 3 0 0 1 12.27 18H7.73a3 3 0 0 1-2.98-2.66L3.55 5H2.5a.5.5 0 0 1 0-1h5ZM5.74 15.23A2 2 0 0 0 7.73 17h4.54a2 2 0 0 0 1.99-1.77L15.44 5H4.56l1.18 10.23ZM8.5 7.5c.28 0 .5.22.5.5v6a.5.5 0 0 1-1 0V8c0-.28.22-.5.5-.5ZM12 8a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V8Z" fill="currentColor"></path></svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>



      <div className="p-4 border-t border-meevo-border shrink-0">
        <div className="flex flex-col gap-3">
          <input 
            type="text" 
            placeholder="Type Tile Name"
            value={newVarName}
            onChange={(e) => setNewVarName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateVariable();
            }}
            className="w-full bg-meevo-surface-2 border border-meevo-border rounded-md px-3 py-2 text-sm text-meevo-text-primary outline-none focus:border-meevo-purple focus:ring-1 focus:ring-meevo-purple"
          />
          <button 
            onClick={handleCreateVariable}
            className="w-full py-2 bg-meevo-purple text-white text-sm font-medium rounded-md hover:bg-meevo-purple-active transition-colors flex items-center justify-center gap-2"
          >
            <Add20Regular fontSize={16} />
            Create Type Tile
          </button>
        </div>
      </div>

      {pickingColor && (
        <ColorPickerModal
          color={variables.find(v => v.id === pickingColor.id)?.color || '#FFFFFF'}
          x={pickingColor.x}
          y={pickingColor.y}
          onChange={(color) => updateColor(pickingColor.id, color)}
          onClose={() => setPickingColor(null)}
        />
      )}
    </div>
  );
};
