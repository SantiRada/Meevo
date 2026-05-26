import React, { useState } from 'react';
import type { BoardConfig, LayerData } from '../../services/storage/types';
import { ChevronDown20Regular, Folder20Regular, Image20Regular, Square20Regular, TextFont20Regular } from '@fluentui/react-icons';
import { ColorPickerModal } from '../ui/ColorPickerModal';

interface TableSidebarProps {
  initialConfig?: BoardConfig;
  onSave: (config: BoardConfig) => void;
  selectedLayerIds?: string[];
  onSelectLayer?: (id: string, multi: boolean) => void;
}

const TABLE_SHAPES: NonNullable<BoardConfig['tableConfig']>['shape'][] = ['Square', 'Rectangle', 'Pentagon', 'Hexagon', 'Circle', 'Oval'];

export const TableSidebar: React.FC<TableSidebarProps> = ({ initialConfig, onSave, selectedLayerIds = [], onSelectLayer }) => {
  const [shape, setShape] = useState<NonNullable<BoardConfig['tableConfig']>['shape']>(initialConfig?.tableConfig?.shape || 'Rectangle');
  const [width, setWidth] = useState<number>(initialConfig?.tableConfig?.width || 800);
  const [height, setHeight] = useState<number>(initialConfig?.tableConfig?.height || 600);
  const [color, setColor] = useState<string>(initialConfig?.tableConfig?.color || '#141E17');
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  const layers = initialConfig?.tableConfig?.layers || [];
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleSave = () => {
    onSave({
      ...(initialConfig || {
        type: 'Fixed Path',
        tileCount: 40,
        pathShape: 'Square',
        tileWidth: 60,
        tileHeight: 60,
        gap: 10
      }),
      tableConfig: {
        shape,
        width,
        height,
        color,
        x: initialConfig?.tableConfig?.x || 0,
        y: initialConfig?.tableConfig?.y || 0,
        layers: initialConfig?.tableConfig?.layers
      }
    });
  };

  const saveLayers = (newLayers: LayerData[]) => {
    if (!initialConfig) return;
    onSave({
      ...initialConfig,
      tableConfig: {
        ...initialConfig.tableConfig!,
        layers: newLayers
      }
    });
  };

  const getLayerIcon = (type: string) => {
    switch(type) {
      case 'image': return <Image20Regular fontSize={14} className="text-meevo-text-tertiary" />;
      case 'rect': return <Square20Regular fontSize={14} className="text-meevo-text-tertiary" />;
      case 'text': return <TextFont20Regular fontSize={14} className="text-meevo-text-tertiary" />;
      default: return <Folder20Regular fontSize={14} className="text-meevo-text-tertiary" />;
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (dragIndex === dropIndex) return;

    const newLayers = [...layers];
    const [draggedLayer] = newLayers.splice(dragIndex, 1);
    newLayers.splice(dropIndex, 0, draggedLayer);
    
    saveLayers(newLayers);
  };

  const handleSelectLayer = (e: React.MouseEvent, layerId: string) => {
    if (e.shiftKey) {
      onSelectLayer?.(layerId, true);
    } else {
      onSelectLayer?.(layerId, false);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent, layer: LayerData) => {
    setEditingLayerId(layer.id);
    setEditValue(layer.name);
  };

  const commitRename = (layerId: string) => {
    if (editValue.trim()) {
      const newLayers = layers.map(l => l.id === layerId ? { ...l, name: editValue.trim() } : l);
      saveLayers(newLayers);
    }
    setEditingLayerId(null);
  };

  return (
    <>
      <div className="py-4 px-6 border-b border-[#CCCCCC]/10 shrink-0">
        <h2 className="text-base font-medium text-meevo-text-primary">Table</h2>
      </div>

      <div className="px-6 py-6 flex-1 overflow-y-auto">
        <div className="mb-6 relative">
          <label className="block text-xs font-medium text-meevo-text-secondary mb-2 tracking-wider uppercase">
            Shape
          </label>
          <div 
            className="w-full bg-[#1A1A1D] rounded-md px-3 py-2 min-h-[38px] flex items-center justify-between cursor-pointer focus-within:ring-1 focus-within:ring-meevo-purple"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span className="text-sm text-meevo-text-primary">{shape}</span>
            <ChevronDown20Regular className="text-meevo-text-tertiary shrink-0 ml-2" />
          </div>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 w-full mt-1 bg-[#1A1A1D] border border-[#CCCCCC]/10 rounded-sm shadow-xl z-20 py-2">
              {TABLE_SHAPES.map(s => (
                <button 
                  key={s}
                  onClick={() => {
                    setShape(s);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-meevo-text-primary hover:bg-[#070709] transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-meevo-text-secondary mb-2 tracking-wider uppercase">
              Width
            </label>
            <input 
              type="number"
              value={width}
              onChange={(e) => setWidth(parseInt(e.target.value) || 0)}
              className="w-full bg-[#1A1A1D] rounded-md px-3 py-2 text-sm text-meevo-text-primary focus:outline-none focus:ring-1 focus:ring-meevo-purple"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-meevo-text-secondary mb-2 tracking-wider uppercase">
              Height
            </label>
            <input 
              type="number"
              value={height}
              onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
              className="w-full bg-[#1A1A1D] rounded-md px-3 py-2 text-sm text-meevo-text-primary focus:outline-none focus:ring-1 focus:ring-meevo-purple"
            />
          </div>
        </div>

        <div className="mb-6 relative">
          <label className="block text-xs font-medium text-meevo-text-secondary mb-2 tracking-wider uppercase">
            Color
          </label>
          <div className="flex items-center space-x-3 bg-[#1A1A1D] rounded-md p-2">
            <div 
              className="w-8 h-8 rounded border border-[#CCCCCC]/20 cursor-pointer"
              style={{ backgroundColor: color }}
              onClick={() => setIsColorPickerOpen(true)}
            />
            <span className="text-sm text-meevo-text-primary font-mono">{color.toUpperCase()}</span>
          </div>

          {isColorPickerOpen && (
            <ColorPickerModal 
              color={color}
              onChange={setColor}
              onClose={() => setIsColorPickerOpen(false)}
            />
          )}
        </div>

        <button 
          onClick={handleSave}
          className="w-full bg-meevo-purple text-white py-2 rounded-md font-medium mt-4 mb-6 hover:bg-opacity-90 transition-colors"
        >
          Save Table
        </button>

        <hr className="border-[#CCCCCC]/10 mb-6" />

        <div className="mb-4">
          <h2 className="text-xs font-bold text-meevo-text-secondary tracking-wider uppercase mb-4">Layers</h2>
          
          <div 
            className={`flex items-center gap-2 px-2 py-1.5 mb-2 cursor-pointer rounded-md transition-colors ${selectedLayerIds.length === 0 ? 'bg-[#1A1A1D] border border-[#333]' : 'hover:bg-[#1A1A1D]/50 border border-transparent'}`}
            onClick={() => onSelectLayer?.('', false)}
          >
            <Folder20Regular fontSize={14} className="text-meevo-text-primary" />
            <span className="text-sm font-medium text-meevo-text-primary">Table Elements</span>
          </div>

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
                No layers yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
