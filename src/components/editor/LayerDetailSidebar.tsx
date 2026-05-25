import React, { useState } from 'react';
import type { BoardTileData, LayerData } from '../../services/storage/types';
import { ColorPickerModal } from '../ui/ColorPickerModal';
import { 
  TextAlignLeft20Regular, 
  TextAlignCenter20Regular, 
  TextAlignRight20Regular,
  AlignTop20Regular,
  AlignCenterVertical20Regular,
  AlignBottom20Regular,
  Star20Regular // for Convert to Property
} from '@fluentui/react-icons';

interface LayerDetailSidebarProps {
  selectedTileIds: number[];
  boardTilesData: Record<number, BoardTileData>;
  selectedLayerIds: string[];
  onUpdateLayer: (tileId: number, layerId: string, data: Partial<LayerData>) => void;
}

export const LayerDetailSidebar: React.FC<LayerDetailSidebarProps> = ({
  selectedTileIds,
  boardTilesData,
  selectedLayerIds,
  onUpdateLayer
}) => {
  const [activePicker, setActivePicker] = useState<{ field: 'fillColor' | 'strokeColor', x: number, y: number } | null>(null);

  if (selectedTileIds.length !== 1 || selectedLayerIds.length !== 1) return null;

  const primaryTileId = selectedTileIds[0];
  const tileData = boardTilesData[primaryTileId] || { id: primaryTileId };
  const layers = tileData.layers || [];
  const layer = layers.find(l => l.id === selectedLayerIds[0]);

  if (!layer) return null;

  const handleChange = (field: keyof LayerData, value: any) => {
    onUpdateLayer(primaryTileId, layer.id, { [field]: value });
  };

  const handleTypographyChange = (field: string, value: any) => {
    const currentTypo = layer.typography || { fontFamily: 'Inter', weight: 'Regular', size: 14, alignH: 'center', alignV: 'middle' };
    onUpdateLayer(primaryTileId, layer.id, { typography: { ...currentTypo, [field]: value } });
  };

  return (
    <div className="flex flex-col h-full bg-meevo-panel overflow-y-auto">
      <div className="p-6">
        {/* Name Input */}
        <input 
          type="text" 
          value={layer.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className="w-full bg-transparent text-sm font-bold text-meevo-text-primary outline-none focus:bg-[#1A1A1D] px-2 py-1 -ml-2 rounded transition-colors mb-6"
        />

        {/* Position */}
        <div className="mb-6">
          <label className="block text-[10px] font-bold text-meevo-text-secondary tracking-wider mb-2 uppercase">Position</label>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center bg-[#1A1A1D] rounded-md px-2 py-1.5 focus-within:ring-1 focus-within:ring-meevo-purple">
              <span className="text-xs text-meevo-text-tertiary w-4">X</span>
              <input type="number" value={layer.x} onChange={e => handleChange('x', parseInt(e.target.value)||0)} className="w-full bg-transparent text-sm text-meevo-text-primary outline-none text-right" />
            </div>
            <div className="flex-1 flex items-center bg-[#1A1A1D] rounded-md px-2 py-1.5 focus-within:ring-1 focus-within:ring-meevo-purple">
              <span className="text-xs text-meevo-text-tertiary w-4">Y</span>
              <input type="number" value={layer.y} onChange={e => handleChange('y', parseInt(e.target.value)||0)} className="w-full bg-transparent text-sm text-meevo-text-primary outline-none text-right" />
            </div>
          </div>
        </div>

        {/* Size */}
        <div className="mb-6">
          <label className="block text-[10px] font-bold text-meevo-text-secondary tracking-wider mb-2 uppercase">Size</label>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center bg-[#1A1A1D] rounded-md px-2 py-1.5 focus-within:ring-1 focus-within:ring-meevo-purple">
              <span className="text-xs text-meevo-text-tertiary w-4">W</span>
              <input type="number" value={layer.width} onChange={e => handleChange('width', Math.max(0, parseInt(e.target.value)||0))} className="w-full bg-transparent text-sm text-meevo-text-primary outline-none text-right" />
            </div>
            <div className="flex-1 flex items-center bg-[#1A1A1D] rounded-md px-2 py-1.5 focus-within:ring-1 focus-within:ring-meevo-purple">
              <span className="text-xs text-meevo-text-tertiary w-4">H</span>
              <input type="number" value={layer.height} onChange={e => handleChange('height', Math.max(0, parseInt(e.target.value)||0))} className="w-full bg-transparent text-sm text-meevo-text-primary outline-none text-right" />
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="mb-6 pb-6 border-b border-[#CCCCCC]/10">
          <label className="block text-[10px] font-bold text-meevo-text-secondary tracking-wider mb-2 uppercase">Appearance</label>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center bg-[#1A1A1D] rounded-md px-2 py-1.5 focus-within:ring-1 focus-within:ring-meevo-purple relative">
              <span className="text-xs text-meevo-text-tertiary w-4">O</span>
              <input type="number" value={layer.opacity} onChange={e => handleChange('opacity', Math.max(0, Math.min(100, parseInt(e.target.value)||0)))} className="w-full bg-transparent text-sm text-meevo-text-primary outline-none text-right" />
              <span className="text-xs text-meevo-text-tertiary ml-1">%</span>
            </div>
            <div className="flex-1 flex items-center bg-[#1A1A1D] rounded-md px-2 py-1.5 focus-within:ring-1 focus-within:ring-meevo-purple relative">
              <span className="text-xs text-meevo-text-tertiary w-4">R</span>
              <input type="number" value={layer.rotation} onChange={e => handleChange('rotation', parseInt(e.target.value)||0)} className="w-full bg-transparent text-sm text-meevo-text-primary outline-none text-right" />
              <span className="text-xs text-meevo-text-tertiary ml-1">°</span>
            </div>
          </div>
        </div>

        {/* Text specific: Typography */}
        {layer.type === 'text' && (
          <div className="mb-6 pb-6 border-b border-[#CCCCCC]/10">
            <label className="block text-[10px] font-bold text-meevo-text-secondary tracking-wider mb-2 uppercase">Typography</label>
            <div className="flex flex-col gap-2">
              <input 
                type="text" 
                value={layer.typography?.fontFamily || 'Inter'} 
                onChange={e => handleTypographyChange('fontFamily', e.target.value)}
                className="w-full bg-[#1A1A1D] rounded-md px-3 py-1.5 text-sm text-meevo-text-primary outline-none focus:ring-1 focus:ring-meevo-purple"
              />
              <div className="flex gap-2">
                <select 
                  value={layer.typography?.weight || 'Regular'}
                  onChange={e => handleTypographyChange('weight', e.target.value)}
                  className="flex-1 bg-[#1A1A1D] rounded-md px-2 py-1.5 text-sm text-meevo-text-primary outline-none"
                >
                  <option value="Light">Light</option>
                  <option value="Regular">Regular</option>
                  <option value="Medium">Medium</option>
                  <option value="Bold">Bold</option>
                </select>
                <div className="w-16 flex items-center bg-[#1A1A1D] rounded-md px-2 py-1.5 focus-within:ring-1 focus-within:ring-meevo-purple">
                  <input type="number" value={layer.typography?.size || 14} onChange={e => handleTypographyChange('size', parseInt(e.target.value)||14)} className="w-full bg-transparent text-sm text-meevo-text-primary outline-none text-right" />
                </div>
              </div>
              <div className="flex gap-2 mt-1">
                {/* Horizontal Align */}
                <div className="flex bg-[#1A1A1D] rounded-md p-0.5">
                  {(['left', 'center', 'right'] as const).map(align => (
                    <button key={align} onClick={() => handleTypographyChange('alignH', align)} className={`p-1.5 rounded ${layer.typography?.alignH === align ? 'bg-[#333]' : 'hover:bg-[#2A2A2D]'}`}>
                      {align === 'left' && <TextAlignLeft20Regular fontSize={14} className="text-meevo-text-primary" />}
                      {align === 'center' && <TextAlignCenter20Regular fontSize={14} className="text-meevo-text-primary" />}
                      {align === 'right' && <TextAlignRight20Regular fontSize={14} className="text-meevo-text-primary" />}
                    </button>
                  ))}
                </div>
                {/* Vertical Align */}
                <div className="flex bg-[#1A1A1D] rounded-md p-0.5">
                  {(['top', 'middle', 'bottom'] as const).map(align => (
                    <button key={align} onClick={() => handleTypographyChange('alignV', align)} className={`p-1.5 rounded ${layer.typography?.alignV === align ? 'bg-[#333]' : 'hover:bg-[#2A2A2D]'}`}>
                      {align === 'top' && <AlignTop20Regular fontSize={14} className="text-meevo-text-primary" />}
                      {align === 'middle' && <AlignCenterVertical20Regular fontSize={14} className="text-meevo-text-primary" />}
                      {align === 'bottom' && <AlignBottom20Regular fontSize={14} className="text-meevo-text-primary" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-[10px] font-bold text-meevo-text-secondary tracking-wider mb-2 uppercase">Text Content</label>
              <textarea 
                value={layer.text || ''}
                onChange={e => handleChange('text', e.target.value)}
                className="w-full h-20 bg-[#1A1A1D] rounded-md px-3 py-2 text-sm text-meevo-text-primary outline-none focus:ring-1 focus:ring-meevo-purple resize-none"
              />
            </div>
          </div>
        )}

        {/* Fill */}
        <div className="mb-6 pb-6 border-b border-[#CCCCCC]/10">
          <label className="block text-[10px] font-bold text-meevo-text-secondary tracking-wider mb-2 uppercase">Fill</label>
          <div className="flex gap-2 items-center bg-[#1A1A1D] rounded-md px-2 py-1.5 focus-within:ring-1 focus-within:ring-meevo-purple">
            <div 
              className="w-4 h-4 rounded overflow-hidden shrink-0 border border-[#333] cursor-pointer" 
              style={{ backgroundColor: layer.fillColor || '#FFFFFF' }}
              onClick={(e) => setActivePicker({ field: 'fillColor', x: e.clientX, y: e.clientY })}
            />
            <input type="text" value={layer.fillColor || '#FFFFFF'} onChange={e => handleChange('fillColor', e.target.value)} className="flex-1 min-w-0 bg-transparent text-sm text-meevo-text-primary outline-none uppercase" />
            <input type="number" value={layer.fillOpacity ?? 100} onChange={e => handleChange('fillOpacity', Math.max(0, Math.min(100, parseInt(e.target.value)||0)))} className="w-10 shrink-0 bg-transparent text-sm text-meevo-text-primary outline-none text-right" />
            <span className="text-xs text-meevo-text-tertiary shrink-0">%</span>
          </div>
        </div>

        {/* Stroke */}
        <div className="mb-6">
          <label className="block text-[10px] font-bold text-meevo-text-secondary tracking-wider mb-2 uppercase">Stroke</label>
          <div className="flex gap-2 items-center bg-[#1A1A1D] rounded-md px-2 py-1.5 focus-within:ring-1 focus-within:ring-meevo-purple">
            <span className="text-xs text-meevo-text-tertiary flex items-center shrink-0">≡</span>
            <input type="number" value={layer.strokeWidth ?? 0} onChange={e => handleChange('strokeWidth', Math.max(0, parseInt(e.target.value)||0))} className="w-8 shrink-0 bg-transparent text-sm text-meevo-text-primary outline-none text-right" />
            
            <div 
              className="w-4 h-4 rounded overflow-hidden shrink-0 border border-[#333] ml-2 cursor-pointer"
              style={{ backgroundColor: layer.strokeColor || '#FFFFFF' }}
              onClick={(e) => setActivePicker({ field: 'strokeColor', x: e.clientX, y: e.clientY })}
            />
            <input type="text" value={layer.strokeColor || '#FFFFFF'} onChange={e => handleChange('strokeColor', e.target.value)} className="flex-1 min-w-0 bg-transparent text-sm text-meevo-text-primary outline-none uppercase" />
            <input type="number" value={layer.strokeOpacity ?? 100} onChange={e => handleChange('strokeOpacity', Math.max(0, Math.min(100, parseInt(e.target.value)||0)))} className="w-10 shrink-0 bg-transparent text-sm text-meevo-text-primary outline-none text-right" />
            <span className="text-xs text-meevo-text-tertiary shrink-0">%</span>
          </div>
        </div>

      </div>

      <div className="mt-auto p-4 shrink-0 border-t border-[#CCCCCC]/10">
        <button className="w-full flex items-center justify-center gap-2 bg-[#1A1A1D] hover:bg-[#2A2A2D] text-meevo-text-primary py-2 rounded-md transition-colors text-sm font-medium border border-[#333]">
          <Star20Regular fontSize={16} />
          Convert to Property
        </button>
      </div>
      
      {activePicker && (
        <ColorPickerModal 
          color={layer[activePicker.field] as string || '#FFFFFF'}
          x={activePicker.x - 260} // Offset to left
          y={activePicker.y}
          onChange={(color) => handleChange(activePicker.field, color)}
          onClose={() => setActivePicker(null)}
        />
      )}
    </div>
  );
};
