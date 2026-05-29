import React, { useState } from 'react';
import type { BoardConfig, LayerData } from '../../services/storage/types';
import { ChevronDown20Regular, Folder20Regular, Image20Regular, Square20Regular, TextFont20Regular } from '@fluentui/react-icons';
import { ColorPickerModal } from '../ui/ColorPickerModal';
import { SegmentedSlider } from '../ui/SegmentedSlider';

interface TableSidebarProps {
  initialConfig?: BoardConfig;
  onSave: (config: BoardConfig, silent?: boolean) => void;
  selectedLayerIds?: string[];
  onSelectLayer?: (id: string, multi: boolean) => void;
}

const TABLE_SHAPES: NonNullable<BoardConfig['tableConfig']>['shape'][] = ['Square', 'Rectangle', 'Pentagon', 'Hexagon', 'Circle', 'Oval'];

export const TableSidebar: React.FC<TableSidebarProps> = ({ initialConfig, onSave, selectedLayerIds = [], onSelectLayer }) => {
  const [shape, setShape] = useState<NonNullable<BoardConfig['tableConfig']>['shape']>(initialConfig?.tableConfig?.shape || 'Rectangle');
  const [width, setWidth] = useState<number>(initialConfig?.tableConfig?.width || 1920);
  const [height, setHeight] = useState<number>(initialConfig?.tableConfig?.height || 1080);
  const [color, setColor] = useState<string>(initialConfig?.tableConfig?.color || '#141E17');
  const [borderRadius, setBorderRadius] = useState<number>(initialConfig?.tableConfig?.borderRadius ?? 16);
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  const layers = initialConfig?.tableConfig?.layers || [];
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');


  const handleDelete = () => {
    onSave({
      ...(initialConfig || {
        type: 'Fixed Path',
        tileCount: 0,
        pathShape: 'Square',
        tileWidth: 60,
        tileHeight: 60,
        gap: 10
      }),
      tableConfig: undefined
    } as BoardConfig, false);
  };

  const handleSave = () => {
    onSave({
      ...(initialConfig || {
        type: 'Fixed Path',
        tileCount: 0,
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
        borderRadius,
        x: initialConfig?.tableConfig?.x || 0,
        y: initialConfig?.tableConfig?.y || 0,
        layers: initialConfig?.tableConfig?.layers
      }
    }, true);
  };

  const saveLayers = (newLayers: LayerData[]) => {
    if (!initialConfig) return;
    onSave({
      ...initialConfig,
      tableConfig: {
        ...initialConfig.tableConfig!,
        layers: newLayers
      }
    }, true);
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
      <div className="h-[56px] px-6 border-b border-meevo-border flex items-center shrink-0">
        <h2 className="text-base font-medium text-meevo-text-primary">Table</h2>
      </div>

      <div className="px-6 py-6 flex-1 overflow-y-auto">
        <div className="mb-6 relative">
          <label className="block text-xs font-medium text-meevo-text-secondary mb-2 tracking-wider uppercase">
            Shape
          </label>
          <div 
            className="w-full bg-meevo-surface-2 rounded-md px-3 py-2 min-h-[38px] flex items-center justify-between cursor-pointer focus-within:ring-1 focus-within:ring-meevo-purple"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span className="text-sm text-meevo-text-primary">{shape}</span>
            <ChevronDown20Regular className="text-meevo-text-tertiary shrink-0 ml-2" />
          </div>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 w-full mt-1 bg-meevo-surface-2 border border-meevo-border rounded-sm shadow-xl z-20 py-2">
              {TABLE_SHAPES.map(s => (
                <button 
                  key={s}
                  onClick={() => {
                    setShape(s);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-meevo-text-primary hover:bg-meevo-surface-2 transition-colors"
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
              className="w-full bg-meevo-surface-2 rounded-md px-3 py-2 text-sm text-meevo-text-primary focus:outline-none focus:ring-1 focus:ring-meevo-purple"
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
              className="w-full bg-meevo-surface-2 rounded-md px-3 py-2 text-sm text-meevo-text-primary focus:outline-none focus:ring-1 focus:ring-meevo-purple"
            />
          </div>
        </div>

        <div className="mb-6 relative">
          <label className="block text-xs font-medium text-meevo-text-secondary mb-2 tracking-wider uppercase">
            Color
          </label>
          <div className="flex items-center space-x-3 bg-meevo-surface-2 rounded-md p-2">
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

          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-medium text-meevo-text-secondary tracking-wider uppercase">
                Rounding
              </label>
              <div className="flex items-center">
                <input 
                  type="number" 
                  min="0"
                  value={borderRadius}
                  onChange={(e) => setBorderRadius(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-12 bg-transparent text-right text-xs font-mono text-meevo-text-primary focus:outline-none"
                />
                <span className="text-xs font-mono text-meevo-text-primary">px</span>
              </div>
            </div>
            <SegmentedSlider 
              options={[0, 8, 16, 24, 32]}
              value={borderRadius}
              onChange={(val) => setBorderRadius(val as number)}
            />
          </div>
        </div>

      <div className="p-4 border-t border-meevo-border shrink-0 flex flex-col gap-3">
        <button 
          onClick={handleSave}
          className="w-full py-2 bg-meevo-purple text-white text-sm font-medium rounded-md hover:bg-meevo-purple-active transition-colors flex items-center justify-center gap-2"
        >
          Save Table
        </button>
        
        {initialConfig?.tableConfig && (
          <button 
            onClick={handleDelete}
            className="w-full bg-[rgba(0,0,0,0.05)] border border-red-500/30 text-red-500 py-2 rounded-md text-sm font-medium hover:bg-red-500/10 transition-colors"
          >
            Delete Table
          </button>
        )}
      </div>
    </>
  );
};
