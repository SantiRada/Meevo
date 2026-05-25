import React, { useState } from 'react';
import type { BoardTileData, LayerData } from '../../services/storage/types';
import { 
  Folder20Regular, 
  TextFont20Regular, 
  Image20Regular, 
  Square20Regular,
  ChevronDown20Regular,
  ChevronRight20Regular,
  Star20Regular // for Convert to Component
} from '@fluentui/react-icons';

interface LayersSidebarProps {
  selectedTileIds: number[];
  boardTilesData: Record<number, BoardTileData>;
  onUpdateTile: (tileId: number, data: Partial<BoardTileData>) => void;
  selectedLayerIds: string[];
  onSelectLayer: (layerIds: string[]) => void;
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
  onSelectLayer
}) => {
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  if (selectedTileIds.length !== 1) {
    return (
      <div className="flex flex-col h-full bg-meevo-panel p-6">
        <h2 className="text-xs font-bold text-meevo-text-secondary tracking-wider mb-8 uppercase">Layers</h2>
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

  return (
    <div className="flex flex-col h-full bg-meevo-panel">
      <div className="p-6 pb-2 shrink-0">
        <h2 className="text-xs font-bold text-meevo-text-secondary tracking-wider uppercase">Layers</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2">
        {/* Tile Root */}
        <div className="flex items-center gap-2 px-2 py-1.5 mb-2">
          <ChevronDown20Regular fontSize={12} className="text-meevo-text-tertiary" />
          <Folder20Regular fontSize={14} className="text-meevo-text-primary" />
          <span className="text-sm font-medium text-meevo-text-primary">
            Casilla-{primaryTileId.toString().padStart(2, '0')}
          </span>
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
                selectedLayerIds.includes(layer.id) ? 'bg-[#1A1A1D] border border-[#333]' : 'hover:bg-[#1A1A1D]/50 border border-transparent'
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

      {/* Convert to Component Placeholder */}
      <div className="p-4 shrink-0 border-t border-[#CCCCCC]/10">
        <button className="w-full flex items-center justify-center gap-2 bg-[#1A1A1D] hover:bg-[#2A2A2D] text-meevo-text-primary py-2 rounded-md transition-colors text-sm font-medium border border-[#333]">
          <Star20Regular fontSize={16} />
          Convert to Component
        </button>
      </div>
    </div>
  );
};
