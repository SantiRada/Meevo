import React, { useState } from 'react';
import type { BoardTileData, LayerData } from '../../services/storage/types';
import { 
  Folder20Regular, 
  TextFont20Regular, 
  Image20Regular, 
  Square20Regular,
  ChevronDown20Regular,
  ChevronRight20Regular,
  Star20Regular, // for Convert to Component
  Link20Regular,
  Dismiss20Regular
} from '@fluentui/react-icons';

import { CreateComponentModal } from './CreateComponentModal';
import { ConnectComponentModal } from './ConnectComponentModal';
import { useNotification } from '../../contexts/NotificationContext';

interface LayersSidebarProps {
  selectedTileIds: number[];
  boardTilesData: Record<number, BoardTileData>;
  onUpdateTile: (tileId: number, data: Partial<BoardTileData>) => void;
  selectedLayerIds: string[];
  onSelectLayer: (layerIds: string[], multi?: boolean) => void;
  boardTileComponents?: import('../../services/storage/types').BoardTileComponent[];
  onUpdateComponents?: (newComponents: import('../../services/storage/types').BoardTileComponent[], newTilesData?: Record<number, BoardTileData>) => void;
  isCardMode?: boolean;
  layerSourceTitle?: string;
  onRenameSource?: (newName: string) => void;
}

const getLayerIcon = (type: LayerData['type']) => {
  switch (type) {
    case 'rect': return <Square20Regular fontSize={14} className="text-[#AAAAAA]" />;
    case 'text': return <TextFont20Regular fontSize={14} className="text-[#AAAAAA]" />;
    case 'image': return <Image20Regular fontSize={14} className="text-[#AAAAAA]" />;
    case 'group': return <Folder20Regular fontSize={14} className="text-[#AAAAAA]" />;
  }
};

export const LayersSidebar: React.FC<LayersSidebarProps> = ({
  selectedTileIds,
  boardTilesData,
  onUpdateTile,
  selectedLayerIds,
  onSelectLayer,
  boardTileComponents = [],
  onUpdateComponents,
  isCardMode = false,
  layerSourceTitle,
  onRenameSource
}) => {
  const { addNotification } = useNotification();
  const [draggedLayerId, setDraggedLayerId] = React.useState<string | null>(null);
  const [editingLayerId, setEditingLayerId] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState('');
  const [editingSource, setEditingSource] = React.useState(false);
  const [sourceEditValue, setSourceEditValue] = React.useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  if (selectedTileIds.length !== 1) {
    return (
      <div className="flex flex-col h-full bg-meevo-surface-1 p-6">
        <div className="h-[56px] px-6 border-b border-meevo-border flex items-center shrink-0 -mx-6 -mt-6 mb-6">
          <h2 className="text-base font-medium text-meevo-text-primary">Layers</h2>
        </div>
        <div className="flex-1 flex items-center justify-center text-center">
          <p className="text-sm text-meevo-text-tertiary">Select a single tile to view its layers.</p>
        </div>
      </div>
    );
  }

  const primaryTileId = selectedTileIds[0];
  const tileData = boardTilesData[primaryTileId] || { id: primaryTileId };
  const layers = tileData.layers || [];

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (isNaN(dragIndex) || dragIndex === dropIndex) return;

    const newLayers = [...layers];
    const [draggedLayer] = newLayers.splice(dragIndex, 1);
    newLayers.splice(dropIndex, 0, draggedLayer);

    onUpdateTile(primaryTileId, { layers: newLayers });
  };

  const handleSelectLayer = (e: React.MouseEvent, id: string) => {
    if (e.shiftKey) {
      if (selectedLayerIds.includes(id)) {
        onSelectLayer(selectedLayerIds.filter(l => l !== id));
      } else {
        onSelectLayer([...selectedLayerIds, id]);
      }
    } else {
      onSelectLayer([id]);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent, layer: LayerData) => {
    e.stopPropagation();
    setEditingLayerId(layer.id);
    setEditValue(layer.name);
  };

  const commitRename = (id: string) => {
    if (editingLayerId) {
      const newLayers = layers.map(l => l.id === id ? { ...l, name: editValue } : l);
      onUpdateTile(primaryTileId, { layers: newLayers });
      setEditingLayerId(null);
    }
  };

  const handleCreateComponent = (name: string) => {
    const newComp = {
      id: 'comp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      name,
      layers: tileData.layers || [],
      rounded: tileData.rounded,
      roundedTL: tileData.roundedTL,
      roundedTR: tileData.roundedTR,
      roundedBL: tileData.roundedBL,
      roundedBR: tileData.roundedBR,
      fillColor: tileData.fillColor,
      strokeColor: tileData.strokeColor,
      strokeWidth: tileData.strokeWidth,
      strokeOpacity: tileData.strokeOpacity,
      bindings: tileData.bindings
    };
    const newComponents = [...boardTileComponents, newComp];
    const newTilesData = { ...boardTilesData, [primaryTileId]: { ...tileData, componentId: newComp.id } };
    onUpdateComponents?.(newComponents, newTilesData);
    setShowCreateModal(false);
  };

  const handleConnectComponent = (compId: string) => {
    const comp = boardTileComponents.find(c => c.id === compId);
    if (!comp) return;

    const newLayers = [...(tileData.layers || []), ...comp.layers];
    onUpdateTile(primaryTileId, {
      componentId: comp.id,
      layers: newLayers,
      rounded: comp.rounded,
      roundedTL: comp.roundedTL,
      roundedTR: comp.roundedTR,
      roundedBL: comp.roundedBL,
      roundedBR: comp.roundedBR,
      fillColor: comp.fillColor,
      strokeColor: comp.strokeColor,
      strokeWidth: comp.strokeWidth,
      strokeOpacity: comp.strokeOpacity,
      bindings: comp.bindings
    });
    setShowConnectModal(false);
  };

  const handleUpdateComponent = () => {
    if (!tileData.componentId) return;
    const oldComp = boardTileComponents.find(c => c.id === tileData.componentId);
    if (!oldComp) return;

    const newCompData = {
      layers: tileData.layers || [],
      rounded: tileData.rounded,
      roundedTL: tileData.roundedTL,
      roundedTR: tileData.roundedTR,
      roundedBL: tileData.roundedBL,
      roundedBR: tileData.roundedBR,
      fillColor: tileData.fillColor,
      strokeColor: tileData.strokeColor,
      strokeWidth: tileData.strokeWidth,
      strokeOpacity: tileData.strokeOpacity,
      bindings: tileData.bindings
    };

    const newComponents = boardTileComponents.map(c => 
      c.id === tileData.componentId ? { ...c, ...newCompData } : c
    );
    
    const newTilesData = { ...boardTilesData };
    const oldLayerIds = oldComp.layers.map(l => l.id);

    Object.keys(newTilesData).forEach(idStr => {
      const tId = Number(idStr);
      const t = newTilesData[tId];
      if (t.componentId === tileData.componentId && t.id !== primaryTileId) {
        // Remove old component layers
        const filteredLayers = (t.layers || []).filter(l => !oldLayerIds.includes(l.id));
        // Append new component layers
        const updatedLayers = [...filteredLayers, ...newCompData.layers];
        
        newTilesData[tId] = {
          ...t,
          ...newCompData,
          layers: updatedLayers
        };
      }
    });

    onUpdateComponents?.(newComponents, newTilesData);
    addNotification({
      type: 'success',
      layout: 'simple',
      title: 'Template updated on all tiles'
    });
  };

  const handleDisconnectComponent = () => {
    if (!tileData.componentId) return;
    const comp = boardTileComponents.find(c => c.id === tileData.componentId);
    if (!comp) {
      onUpdateTile(primaryTileId, { componentId: undefined });
      return;
    }

    const compLayerIds = comp.layers.map(l => l.id);
    const newLayers = (tileData.layers || []).filter(l => !compLayerIds.includes(l.id));

    const resetBase = {
      componentId: undefined,
      layers: newLayers,
    };
    
    // Check if component should be deleted (no other tiles connected)
    const otherConnected = Object.values(boardTilesData).some(t => t.id !== primaryTileId && t.componentId === comp.id);
    if (!otherConnected) {
      const newComponents = boardTileComponents.filter(c => c.id !== comp.id);
      onUpdateComponents?.(newComponents, { ...boardTilesData, [primaryTileId]: { ...tileData, ...resetBase } });
    } else {
      onUpdateTile(primaryTileId, resetBase);
    }
  };

  return (
    <div className="flex flex-col h-full bg-meevo-surface-1">
      <div className="h-[56px] px-6 border-b border-meevo-border flex items-center shrink-0">
        <h2 className="text-base font-medium text-meevo-text-primary">Layers</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2">
        {/* Tile/Card Container as a pseudo folder */}
        <div>
          <div 
            className={`flex items-center gap-2 px-2 py-1.5 mb-2 cursor-pointer rounded-md transition-colors ${selectedLayerIds.length === 0 ? 'bg-meevo-surface-2 border border-meevo-border' : 'hover:bg-meevo-surface-2/50 border border-transparent'}`}
            onClick={() => onSelectLayer([])}
            onDoubleClick={(e) => {
              if (isCardMode && onRenameSource) {
                e.stopPropagation();
                setEditingSource(true);
                setSourceEditValue(layerSourceTitle || `Casilla-${primaryTileId.toString().padStart(2, '0')}`);
              }
            }}
          >
            <Folder20Regular fontSize={14} className="text-meevo-text-primary" />
            {editingSource ? (
              <input
                type="text"
                value={sourceEditValue}
                autoFocus
                onChange={(e) => setSourceEditValue(e.target.value)}
                onBlur={() => {
                  if (onRenameSource) onRenameSource(sourceEditValue);
                  setEditingSource(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (onRenameSource) onRenameSource(sourceEditValue);
                    setEditingSource(false);
                  }
                }}
                className="bg-transparent text-sm font-medium text-meevo-text-primary outline-none w-full"
              />
            ) : (
              <span className="text-sm font-medium text-meevo-text-primary">
                {isCardMode && layerSourceTitle ? layerSourceTitle : `Casilla-${primaryTileId.toString().padStart(2, '0')}`}
              </span>
            )}
          </div>
        </div>

        {/* Layer List */}
        <div className="flex flex-col space-y-[2px]">
          {layers.map((layer, index) => (
            <div 
              key={layer.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              onClick={(e) => handleSelectLayer(e, layer.id)}
              onDoubleClick={(e) => handleDoubleClick(e, layer)}
              className={`flex items-center gap-3 px-3 py-1.5 ml-4 rounded-md cursor-pointer transition-colors ${
                selectedLayerIds.includes(layer.id) ? 'bg-meevo-surface-2 border border-meevo-border' : 'hover:bg-meevo-surface-2/50 border border-transparent'
              }`}
            >
              <div className="shrink-0">{getLayerIcon(layer.type)}</div>
              
              {editingLayerId === layer.id ? (
                <input 
                  type="text" 
                  value={editValue}
                  autoFocus
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => commitRename(layer.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter') commitRename(layer.id); }}
                  className="bg-transparent text-sm text-meevo-text-primary outline-none w-full"
                />
              ) : (
                <span className="text-sm text-meevo-text-primary truncate select-none">{layer.name}</span>
              )}
            </div>
          ))}
          {layers.length === 0 && (
            <div className="text-xs text-meevo-text-tertiary px-6 py-2">
              No layers yet. Use the tools below to create one.
            </div>
          )}
        </div>
      </div>

      {/* Convert to Component Buttons */}
      <div className="p-4 shrink-0 border-t border-meevo-border space-y-2">
        {tileData.componentId ? (
          <>
            <button 
              onClick={handleUpdateComponent}
              className="w-full flex items-center justify-center gap-2 bg-meevo-surface-2 hover:bg-meevo-surface-0 text-meevo-purple py-2 rounded-md transition-colors text-sm font-medium border border-meevo-purple/50"
            >
              <Star20Regular fontSize={16} />
              Update Template
            </button>
            <button 
              onClick={handleDisconnectComponent}
              className="w-full flex items-center justify-center gap-2 bg-transparent hover:bg-red-500/10 text-red-400 py-2 rounded-md transition-colors text-sm font-medium border border-red-500/20"
            >
              <Dismiss20Regular fontSize={16} />
              Disconnect Template
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="w-full flex items-center justify-center gap-2 bg-meevo-surface-2 hover:bg-meevo-surface-0 text-meevo-text-primary py-2 rounded-md transition-colors text-sm font-medium border border-meevo-border"
            >
              <Star20Regular fontSize={16} />
              Convert to Template
            </button>
            <button 
              onClick={() => setShowConnectModal(true)}
              className="w-full flex items-center justify-center gap-2 bg-meevo-surface-2 hover:bg-meevo-surface-0 text-meevo-text-primary py-2 rounded-md transition-colors text-sm font-medium border border-meevo-border"
            >
              <Link20Regular fontSize={16} />
              Connect Template
            </button>
          </>
        )}
      </div>

      {showCreateModal && (
        <CreateComponentModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateComponent}
        />
      )}
      
      {showConnectModal && (
        <ConnectComponentModal
          components={boardTileComponents}
          onClose={() => setShowConnectModal(false)}
          onConnect={handleConnectComponent}
        />
      )}
    </div>
  );
};

