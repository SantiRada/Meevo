import React from 'react';
import type { BoardConfig, BoardTileData, LayerData, BoardTileVariable, CanvasSettings } from '../../services/storage/types';
import { ColorPickerModal } from '../ui/ColorPickerModal';
import { SegmentedSlider } from '../ui/SegmentedSlider';
import { ImageFillModal } from '../ui/ImageFillModal';
import { 
  TextAlignLeft20Regular, 
  TextAlignCenter20Regular, 
  TextAlignRight20Regular,
  AlignTop20Regular,
  AlignCenterVertical20Regular,
  AlignBottom20Regular,
  Star20Regular, // for Convert to Property
  Dismiss20Regular
} from '@fluentui/react-icons';
import { PropertyBindingModal } from './PropertyBindingModal';
import { SizeEditor } from './properties/SizeEditor';
import { FillEditor } from './properties/FillEditor';
import { StrokeEditor } from './properties/StrokeEditor';

interface LayerDetailSidebarProps {
  selectedTileIds: number[];
  boardTilesData: Record<number, BoardTileData>;
  selectedLayerIds: string[];
  onUpdateLayer: (tileId: number, layerId: string, data: Partial<LayerData>) => void;
  onUpdateTile?: (tileId: number, data: Partial<BoardTileData>) => void;
  boardConfig?: BoardConfig;
  boardVariables?: BoardTileVariable[];
  isTableMode?: boolean;
  cardModeLayerSource?: LayerData[];
  isCardMode?: boolean;
  canvasSettings?: CanvasSettings;
  setCanvasSettings?: (settings: CanvasSettings) => void;
}

export const LayerDetailSidebar: React.FC<LayerDetailSidebarProps> = ({
  selectedTileIds,
  boardTilesData,
  selectedLayerIds,
  onUpdateLayer,
  onUpdateTile,
  boardConfig,
  boardVariables,
  isTableMode,
  cardModeLayerSource,
  isCardMode = false,
  canvasSettings,
  setCanvasSettings
}) => {
  const [activePicker, setActivePicker] = React.useState<{ field: string, x: number, y: number } | null>(null);
  const [activeImagePicker, setActiveImagePicker] = React.useState<{ x: number, y: number } | null>(null);
  const [dropdownOpen, setDropdownOpen] = React.useState<'fontFamily' | 'weight' | 'width' | 'height' | null>(null);
  const [bindingModalField, setBindingModalField] = React.useState<string | null>(null);

  if (selectedTileIds.length > 1 || selectedLayerIds.length > 1) return null;

  const primaryTileId = selectedTileIds.length === 1 ? selectedTileIds[0] : undefined;
  const tileData = primaryTileId !== undefined ? (boardTilesData[primaryTileId] || { id: primaryTileId }) : undefined;
  
  const getPropName = (propId: string) => {
    if (!boardVariables) return 'Unknown';
    for (const v of boardVariables) {
      const p = (v.properties || []).find((p: any) => p.id === propId);
      if (p) return p.name;
    }
    return 'Unknown';
  };
  
  if (selectedLayerIds.length === 0) {
    if (tileData && !onUpdateTile) return null;
    const handleTileChange = (field: keyof BoardTileData, value: any) => {
      if (primaryTileId !== undefined && onUpdateTile) {
        onUpdateTile(primaryTileId, { [field]: value });
      }
    };

    const CornerIcon = ({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) => {
      const tr = pos === 'tl' ? '' : pos === 'tr' ? 'scaleX(-1)' : pos === 'bl' ? 'scaleY(-1)' : 'scale(-1, -1)';
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" style={{ transform: tr }}>
          <path d="M 2 12 L 2 5 Q 2 2 5 2 L 12 2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    };

    const openColorPicker = (e: React.MouseEvent, field: 'fillColor' | 'strokeColor') => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setActivePicker({ field, x: rect.right + 10, y: rect.top });
    };

    const rTL = tileData?.roundedTL ?? tileData?.rounded ?? 0;
    const rTR = tileData?.roundedTR ?? tileData?.rounded ?? 0;
    const rBL = tileData?.roundedBL ?? tileData?.rounded ?? 0;
    const rBR = tileData?.roundedBR ?? tileData?.rounded ?? 0;

    return (
      <div className="flex flex-col h-full bg-meevo-surface-1">
        <div className="h-[56px] px-6 border-b border-meevo-border flex items-center shrink-0">
          <h2 className="text-base font-medium text-meevo-text-primary">{tileData ? 'Tile' : 'Canvas Settings'}</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {tileData && (
            <>
              {/* Fill */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-bold text-meevo-text-secondary tracking-wider uppercase">Fill</h3>
              <button
                onClick={() => setBindingModalField('tileFillColor')}
                className="text-[10px] font-bold text-meevo-purple tracking-wider uppercase hover:text-meevo-text-primary transition-colors"
              >
                Prop.
              </button>
            </div>
            {tileData.bindings?.fillColor ? (
              <div className="flex items-center justify-between bg-meevo-purple hover:bg-meevo-purple-active/20 border border-meevo-purple/50 rounded-md px-3 py-1.5">
                <span className="text-sm text-meevo-purple font-medium">Property: {getPropName(tileData.bindings.fillColor)}</span>
                <button onClick={() => {
                  const newBindings = { ...tileData.bindings };
                  delete newBindings.fillColor;
                  handleTileChange('bindings', newBindings);
                }} className="text-meevo-purple hover:text-meevo-text-primary transition-colors">
                  <Dismiss20Regular fontSize={16} />
                </button>
              </div>
            ) : (
              <div className="flex bg-meevo-surface-2 border border-meevo-border rounded-md overflow-hidden p-1 gap-2 items-center h-8 cursor-pointer hover:bg-meevo-surface-2/80" onClick={(e) => openColorPicker(e, 'fillColor')}>
                <div className="w-5 h-5 rounded-sm border border-[#555] shrink-0" style={{ backgroundColor: tileData.fillColor || 'transparent' }} />
                <div className="flex-1 text-sm text-meevo-text-primary uppercase">{tileData.fillColor ? tileData.fillColor.replace('#', '') : 'NONE'}</div>
              </div>
            )}
          </div>

          <hr className="border-meevo-border" />

          {/* Stroke */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-bold text-meevo-text-secondary tracking-wider uppercase">Stroke</h3>
              <button
                onClick={() => setBindingModalField('tileStrokeColor')}
                className="text-[10px] font-bold text-meevo-purple tracking-wider uppercase hover:text-meevo-text-primary transition-colors"
              >
                Prop.
              </button>
            </div>
            {tileData.bindings?.strokeColor ? (
              <div className="flex items-center justify-between bg-meevo-purple hover:bg-meevo-purple-active/20 border border-meevo-purple/50 rounded-md px-3 py-1.5">
                <span className="text-sm text-meevo-purple font-medium">Property: {getPropName(tileData.bindings.strokeColor)}</span>
                <button onClick={() => {
                  const newBindings = { ...tileData.bindings };
                  delete newBindings.strokeColor;
                  handleTileChange('bindings', newBindings);
                }} className="text-meevo-purple hover:text-meevo-text-primary transition-colors">
                  <Dismiss20Regular fontSize={16} />
                </button>
              </div>
            ) : (
              <div className="flex bg-meevo-surface-2 border border-meevo-border rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-meevo-purple h-8">
                <div className="w-8 flex items-center justify-center text-[#777] shrink-0"><span className="text-xs">☰</span></div>
                <input type="number" min="0" value={tileData.strokeWidth || ''} placeholder="0" onChange={e => handleTileChange('strokeWidth', Math.max(0, Number(e.target.value)||0))} className="w-10 bg-transparent text-sm text-meevo-text-primary outline-none text-center border-r border-meevo-border" />
                
                <div className="flex items-center gap-2 px-2 flex-1 cursor-pointer border-r border-meevo-border hover:bg-meevo-surface-0" onClick={(e) => openColorPicker(e, 'strokeColor')}>
                  <div className="w-4 h-4 rounded-sm border border-[#555] shrink-0" style={{ backgroundColor: tileData.strokeColor || 'transparent' }} />
                  <div className="text-sm text-meevo-text-primary uppercase truncate">{tileData.strokeColor ? tileData.strokeColor.replace('#', '') : 'NONE'}</div>
                </div>
                
                <input type="number" min="0" max="100" value={tileData.strokeOpacity ?? 100} onChange={e => handleTileChange('strokeOpacity', Math.max(0, Math.min(100, Number(e.target.value)||0)))} className="w-12 bg-transparent text-sm text-meevo-text-primary outline-none text-center" />
                <div className="pr-2 flex items-center text-[#777] text-sm">%</div>
              </div>
            )}
            </div>
            <hr className="border-meevo-border" />
            </>
          )}

          {/* Canvas Settings */}
          {!tileData && canvasSettings && setCanvasSettings && (
            <div>
              <h3 className="text-[10px] font-bold text-meevo-text-secondary tracking-wider mb-2 uppercase">Canvas</h3>
              
              {/* Fill */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-meevo-text-secondary">Fill</span>
                <div className="flex bg-meevo-surface-2 border border-meevo-border rounded-md overflow-hidden p-1 gap-2 items-center h-8 cursor-pointer hover:bg-meevo-surface-2/80 w-32" onClick={(e) => {
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  setActivePicker({ field: 'canvasFill', x: rect.right + 10, y: rect.top });
                }}>
                  <div className="w-4 h-4 rounded-sm border border-[#555] shrink-0" style={{ backgroundColor: canvasSettings.fill }} />
                  <div className="flex-1 text-sm text-meevo-text-primary uppercase truncate">{canvasSettings.fill.replace('#', '')}</div>
                </div>
              </div>

              {/* Snap to Grid */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-meevo-text-secondary">Snap to grid</span>
                <div className="flex bg-meevo-surface-2 rounded-lg p-0.5 border border-meevo-border">
                  <div 
                    className={`px-3 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${!canvasSettings.snapToGrid ? 'bg-meevo-purple text-white' : 'text-[#777] hover:text-meevo-text-primary'}`}
                    onClick={() => setCanvasSettings({ ...canvasSettings, snapToGrid: false })}
                  >
                    INACTIVE
                  </div>
                  <div 
                    className={`px-3 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${canvasSettings.snapToGrid ? 'bg-meevo-purple text-white' : 'text-[#777] hover:text-meevo-text-primary'}`}
                    onClick={() => setCanvasSettings({ ...canvasSettings, snapToGrid: true })}
                  >
                    ACTIVE
                  </div>
                </div>
              </div>

              {/* View Grid */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-meevo-text-secondary">View grid</span>
                  <div className="flex bg-meevo-surface-2 rounded-lg p-0.5 border border-meevo-border">
                    <div 
                      className={`px-3 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${!canvasSettings.viewGrid ? 'bg-meevo-purple text-white' : 'text-[#777] hover:text-meevo-text-primary'}`}
                      onClick={() => setCanvasSettings({ ...canvasSettings, viewGrid: false })}
                    >
                      INACTIVE
                    </div>
                    <div 
                      className={`px-3 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${canvasSettings.viewGrid ? 'bg-meevo-purple text-white' : 'text-[#777] hover:text-meevo-text-primary'}`}
                      onClick={() => setCanvasSettings({ ...canvasSettings, viewGrid: true })}
                    >
                      ACTIVE
                    </div>
                  </div>
                </div>
                {canvasSettings.viewGrid && (
                    <div className="flex flex-col gap-2 mt-1">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-xs text-meevo-text-secondary">Grid Opacity</span>
                        <span className="text-xs font-mono text-meevo-text-primary">{isCardMode ? (canvasSettings.gridOpacityCards ?? 2) : (canvasSettings.gridOpacity ?? 2)}</span>
                      </div>
                      <SegmentedSlider 
                        options={[1, 2, 3, 4, 5]} 
                        value={isCardMode ? (canvasSettings.gridOpacityCards ?? 2) : (canvasSettings.gridOpacity ?? 2)} 
                        onChange={(val) => setCanvasSettings({ ...canvasSettings, ...(isCardMode ? { gridOpacityCards: val } : { gridOpacity: val }) })} 
                      />
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>

        {activePicker && (
          <ColorPickerModal
            color={activePicker.field === 'canvasFill' ? canvasSettings?.fill || (document.documentElement.classList.contains('dark') ? '#0e0e0e' : '#d6d6d6') : (tileData && tileData[activePicker.field as keyof BoardTileData] as string) || '#FFFFFF'}
            onChange={(color) => {
              if (activePicker.field === 'canvasFill' && setCanvasSettings && canvasSettings) {
                setCanvasSettings({ ...canvasSettings, fill: color });
              } else if (tileData) {
                handleTileChange(activePicker.field as keyof BoardTileData, color);
              }
            }}
            onClose={() => setActivePicker(null)}
            x={activePicker.x}
            y={activePicker.y}
            variables={boardVariables}
          />
        )}

        {bindingModalField && (bindingModalField === 'tileFillColor' || bindingModalField === 'tileStrokeColor') && tileData && (
          <PropertyBindingModal
            variables={boardVariables as any}
            tileVariableIds={tileData.variableIds || []}
            filterType="Color"
            onBind={(propertyId) => {
              const actualField = bindingModalField === 'tileFillColor' ? 'fillColor' : 'strokeColor';
              handleTileChange('bindings', { ...(tileData.bindings || {}), [actualField]: propertyId });
              setBindingModalField(null);
            }}
            onClose={() => setBindingModalField(null)}
          />
        )}
      </div>
    );
  }

  const layers = cardModeLayerSource ? cardModeLayerSource : isTableMode ? (boardConfig?.tableConfig?.layers || []) : (tileData?.layers || []);
  const layer = selectedLayerIds.length > 0 ? layers.find(l => l.id === selectedLayerIds[0]) : undefined;
  
    if (selectedLayerIds.length > 0 && !layer) return null;

  const handleChange = (field: keyof LayerData, value: any) => {
    if (isTableMode) {
      onUpdateLayer(0, layer.id, { [field]: value });
    } else {
      onUpdateLayer((primaryTileId || 0), layer.id, { [field]: value });
    }
  };

  const handleTypographyChange = (field: string, value: any) => {
    const currentTypo = layer.typography || { fontFamily: 'Inter', weight: 'Regular', size: 14, alignH: 'center', alignV: 'middle' };
    if (isTableMode) {
      onUpdateLayer(0, layer.id, { typography: { ...currentTypo, [field]: value } });
    } else {
      onUpdateLayer((primaryTileId || 0), layer.id, { typography: { ...currentTypo, [field]: value } });
    }
  };

  const handleAlign = (dir: 'h' | 'v', type: 'start' | 'center' | 'end') => {
    let finalW = 0, finalH = 0;
    if (isCardMode) {
      finalW = (tileData as any)?.width || 0;
      finalH = (tileData as any)?.height || 0;
    } else if (isTableMode) {
      finalW = boardConfig?.tableConfig?.width || 0;
      finalH = boardConfig?.tableConfig?.height || 0;
    } else {
      if (!boardConfig) return;
      finalW = boardConfig.tileWidth;
      finalH = boardConfig.tileHeight;
      if (boardConfig.pathShape === 'Hexagon' || boardConfig.pathShape === 'Pentagon' || boardConfig.pathShape === 'Circle') {
        const circumradius = (boardConfig as any)?.tileRadius || 50;
        if (boardConfig.pathShape === 'Hexagon') {
          finalW = circumradius * 2;
          finalH = Math.sqrt(3) * circumradius;
        } else if (boardConfig.pathShape === 'Pentagon') {
          finalW = circumradius * 2;
          finalH = circumradius + (circumradius * Math.cos(Math.PI / 5));
        } else if (boardConfig.pathShape === 'Circle') {
          finalW = circumradius * 2;
          finalH = circumradius * 2;
        }
      }
    }
    
    let newX = layer.x;
    let newY = layer.y;

    let actualW = layer.width;
    let actualH = layer.height;
    
    if (layer.type === 'text') {
      const el = document.getElementById(`layer-${layer.id}`);
      if (el) {
        actualW = el.offsetWidth;
        actualH = el.offsetHeight;
      }
    }

    if (dir === 'h') {
      if (type === 'start') newX = 0;
      if (type === 'center') newX = Math.round(finalW / 2 - actualW / 2);
      if (type === 'end') newX = Math.round(finalW - actualW);
    } else {
      if (type === 'start') newY = 0;
      if (type === 'center') newY = Math.round(finalH / 2 - actualH / 2);
      if (type === 'end') newY = Math.round(finalH - actualH);
    }

    if (isTableMode) {
      onUpdateLayer(0, layer.id, { x: newX, y: newY });
    } else {
      onUpdateLayer((primaryTileId || 0), layer.id, { x: newX, y: newY });
    }
  };

  return (
    <div className="flex flex-col h-full bg-meevo-surface-1 overflow-y-auto">
      <div className="p-6">
        {/* Name Input */}
        <input 
          type="text" 
          value={layer.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className="w-full bg-transparent text-sm font-bold text-meevo-text-primary outline-none focus:bg-meevo-surface-2 px-2 py-1 -ml-2 rounded transition-colors mb-6"
        />

        {/* Position */}
        <div className="mb-6">
          <label className="block text-[10px] font-bold text-meevo-text-secondary tracking-wider mb-2 uppercase">Position</label>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <div className="flex-1 flex items-center bg-meevo-surface-2 rounded-md px-2 py-1.5 focus-within:ring-1 focus-within:ring-meevo-purple">
                <span className="text-xs text-meevo-text-tertiary w-4">X</span>
                <input type="number" step="0.001" value={layer.x} onChange={e => handleChange('x', Math.round(Number(e.target.value) * 1000) / 1000 || 0)} className="w-full bg-transparent text-sm text-meevo-text-primary outline-none text-center" />
              </div>
              <div className="flex-1 flex items-center bg-meevo-surface-2 rounded-md px-2 py-1.5 focus-within:ring-1 focus-within:ring-meevo-purple">
                <span className="text-xs text-meevo-text-tertiary w-4">Y</span>
                <input type="number" step="0.001" value={layer.y} onChange={e => handleChange('y', Math.round(Number(e.target.value) * 1000) / 1000 || 0)} className="w-full bg-transparent text-sm text-meevo-text-primary outline-none text-center" />
              </div>
            </div>
            
            <div className="flex gap-2 mt-1">
                <div className="w-1/2 flex justify-between bg-meevo-surface-2 rounded-md p-0.5">
                  <button onClick={() => handleAlign('h', 'start')} className="p-1.5 rounded flex-1 flex justify-center hover:bg-meevo-surface-0" title="Align Left">
                    <TextAlignLeft20Regular fontSize={14} className="text-meevo-text-primary" />
                  </button>
                  <button onClick={() => handleAlign('h', 'center')} className="p-1.5 rounded flex-1 flex justify-center hover:bg-meevo-surface-0" title="Align Center">
                    <TextAlignCenter20Regular fontSize={14} className="text-meevo-text-primary" />
                  </button>
                  <button onClick={() => handleAlign('h', 'end')} className="p-1.5 rounded flex-1 flex justify-center hover:bg-meevo-surface-0" title="Align Right">
                    <TextAlignRight20Regular fontSize={14} className="text-meevo-text-primary" />
                  </button>
                </div>
                <div className="w-1/2 flex justify-between bg-meevo-surface-2 rounded-md p-0.5">
                  <button onClick={() => handleAlign('v', 'start')} className="p-1.5 rounded flex-1 flex justify-center hover:bg-meevo-surface-0" title="Align Top">
                    <AlignTop20Regular fontSize={14} className="text-meevo-text-primary" />
                  </button>
                  <button onClick={() => handleAlign('v', 'center')} className="p-1.5 rounded flex-1 flex justify-center hover:bg-meevo-surface-0" title="Align Middle">
                    <AlignCenterVertical20Regular fontSize={14} className="text-meevo-text-primary" />
                  </button>
                  <button onClick={() => handleAlign('v', 'end')} className="p-1.5 rounded flex-1 flex justify-center hover:bg-meevo-surface-0" title="Align Bottom">
                    <AlignBottom20Regular fontSize={14} className="text-meevo-text-primary" />
                  </button>
                </div>
              </div>
          </div>
        </div>

        <SizeEditor 
          width={layer.width}
          height={layer.height}
          sizingW={layer.sizingW}
          sizingH={layer.sizingH}
          onChange={(field, value) => handleChange(field as keyof LayerData, value)}
          isText={layer.type === 'text'}

        />

        {/* Appearance */}
        <div className="mb-6 pb-6 border-b border-meevo-border">
          <label className="block text-[10px] font-bold text-meevo-text-secondary tracking-wider mb-2 uppercase">Appearance</label>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center bg-meevo-surface-2 rounded-md px-2 py-1.5 focus-within:ring-1 focus-within:ring-meevo-purple relative">
              <span className="text-xs text-meevo-text-tertiary w-4">O</span>
              <input type="number" value={layer.opacity} onChange={e => handleChange('opacity', Math.max(0, Math.min(100, parseInt(e.target.value)||0)))} className="w-full bg-transparent text-sm text-meevo-text-primary outline-none text-center" />
              <span className="text-xs text-meevo-text-tertiary ml-1">%</span>
            </div>
            <div className="flex-1 flex items-center bg-meevo-surface-2 rounded-md px-2 py-1.5 focus-within:ring-1 focus-within:ring-meevo-purple relative">
              <span className="text-xs text-meevo-text-tertiary w-4">R</span>
              <input type="number" value={layer.rotation} onChange={e => handleChange('rotation', parseInt(e.target.value)||0)} className="w-full bg-transparent text-sm text-meevo-text-primary outline-none text-center" />
              <span className="text-xs text-meevo-text-tertiary ml-1">°</span>
            </div>
          </div>
        </div>

        {/* Rounded Corners (Shapes Only) */}
        {layer.type === 'shape' && (
          <div className="mb-6 pb-6 border-b border-meevo-border">
            <h3 className="block text-[10px] font-bold text-meevo-text-secondary tracking-wider mb-2 uppercase">Rounded Corners</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex bg-meevo-surface-2 border border-meevo-border rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-meevo-purple h-8">
                <div className="w-8 flex items-center justify-center text-[#777]"><CornerIcon pos="tl" /></div>
                <input type="number" min="0" value={layer.roundedTL ?? layer.rounded ?? ''} placeholder="0" onChange={e => handleChange('roundedTL', Math.max(0, Number(e.target.value)||0))} className="w-full bg-transparent text-sm text-meevo-text-primary outline-none px-1 text-center" />
              </div>
              <div className="flex bg-meevo-surface-2 border border-meevo-border rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-meevo-purple h-8">
                <input type="number" min="0" value={layer.roundedTR ?? layer.rounded ?? ''} placeholder="0" onChange={e => handleChange('roundedTR', Math.max(0, Number(e.target.value)||0))} className="w-full bg-transparent text-sm text-meevo-text-primary outline-none px-1 text-center" />
                <div className="w-8 flex items-center justify-center text-[#777]"><CornerIcon pos="tr" /></div>
              </div>
              <div className="flex bg-meevo-surface-2 border border-meevo-border rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-meevo-purple h-8">
                <div className="w-8 flex items-center justify-center text-[#777]"><CornerIcon pos="bl" /></div>
                <input type="number" min="0" value={layer.roundedBL ?? layer.rounded ?? ''} placeholder="0" onChange={e => handleChange('roundedBL', Math.max(0, Number(e.target.value)||0))} className="w-full bg-transparent text-sm text-meevo-text-primary outline-none px-1 text-center" />
              </div>
              <div className="flex bg-meevo-surface-2 border border-meevo-border rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-meevo-purple h-8">
                <input type="number" min="0" value={layer.roundedBR ?? layer.rounded ?? ''} placeholder="0" onChange={e => handleChange('roundedBR', Math.max(0, Number(e.target.value)||0))} className="w-full bg-transparent text-sm text-meevo-text-primary outline-none px-1 text-center" />
                <div className="w-8 flex items-center justify-center text-[#777]"><CornerIcon pos="br" /></div>
              </div>
            </div>
          </div>
        )}

        {/* Text specific: Typography */}
        {layer.type === 'text' && (
          <div className="mb-6 pb-6 border-b border-meevo-border">
            <label className="block text-[10px] font-bold text-meevo-text-secondary tracking-wider mb-2 uppercase">Typography</label>
            <div className="flex flex-col gap-2">
              <div className="relative flex items-center w-full">
                <div 
                  className="w-full bg-meevo-surface-2 rounded-md px-2 pr-8 py-1.5 text-sm text-meevo-text-primary outline-none cursor-pointer"
                  onClick={() => setDropdownOpen(dropdownOpen === 'fontFamily' ? null : 'fontFamily')}
                  style={{ fontFamily: layer.typography?.fontFamily || 'Inter' }}
                >
                  {layer.typography?.fontFamily || 'Inter'}
                </div>
                <div 
                  className="absolute right-0 top-0 bottom-0 w-8 flex items-center justify-center cursor-pointer text-meevo-text-tertiary hover:text-meevo-text-primary"
                  onClick={() => setDropdownOpen(dropdownOpen === 'fontFamily' ? null : 'fontFamily')}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
                {dropdownOpen === 'fontFamily' && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-meevo-surface-2 border border-meevo-border rounded-md shadow-lg z-50 overflow-hidden">
                    {['Inter', 'Outfit', 'Poppins', 'Roboto', 'Open Sans', 'Lato', 'Montserrat'].map(font => (
                      <div 
                        key={font}
                        className="px-3 py-1.5 text-sm text-meevo-text-primary hover:bg-meevo-purple cursor-pointer"
                        style={{ fontFamily: font }}
                        onClick={() => { handleTypographyChange('fontFamily', font); setDropdownOpen(null); }}
                      >
                        {font}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1 flex items-center">
                  <div 
                    className="w-full bg-meevo-surface-2 rounded-md px-2 pr-8 py-1.5 text-sm text-meevo-text-primary outline-none cursor-pointer"
                    onClick={() => setDropdownOpen(dropdownOpen === 'weight' ? null : 'weight')}
                    style={{ fontWeight: layer.typography?.weight === 'Bold' ? 700 : layer.typography?.weight === 'Medium' ? 500 : layer.typography?.weight === 'Light' ? 300 : 400 }}
                  >
                    {layer.typography?.weight || 'Regular'}
                  </div>
                  <div 
                    className="absolute right-0 top-0 bottom-0 w-8 flex items-center justify-center cursor-pointer text-meevo-text-tertiary hover:text-meevo-text-primary"
                    onClick={() => setDropdownOpen(dropdownOpen === 'weight' ? null : 'weight')}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>
                  {dropdownOpen === 'weight' && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-meevo-surface-2 border border-meevo-border rounded-md shadow-lg z-50 overflow-hidden">
                      {['Light', 'Regular', 'Medium', 'Bold'].map(weight => (
                        <div 
                          key={weight}
                          className="px-3 py-1.5 text-sm text-meevo-text-primary hover:bg-meevo-purple cursor-pointer"
                          style={{ fontWeight: weight === 'Bold' ? 700 : weight === 'Medium' ? 500 : weight === 'Light' ? 300 : 400 }}
                          onClick={() => { handleTypographyChange('weight', weight); setDropdownOpen(null); }}
                        >
                          {weight}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                  <div className="w-16 flex items-center bg-meevo-surface-2 rounded-md px-2 py-1.5 focus-within:ring-1 focus-within:ring-meevo-purple">
                    <input 
                      type="text" 
                      value={layer.typography?.autoSize ? 'Auto' : (layer.typography?.size || 14)} 
                      onChange={e => {
                        const val = e.target.value;
                        if (val.toLowerCase() === 'auto') {
                          handleTypographyChange('autoSize', true);
                        } else {
                          const parsed = parseInt(val);
                          if (!isNaN(parsed)) {
                            if (layer.typography?.autoSize) {
                              handleTypographyChange('autoSize', false);
                            }
                            handleTypographyChange('size', Math.max(2, parsed));
                          }
                        }
                      }} 
                      className="w-full bg-transparent text-sm text-meevo-text-primary outline-none text-center" 
                    />
                  </div>
              </div>
              <div 
                className="flex items-center gap-2 mt-1 cursor-pointer w-max select-none"
                onClick={() => handleTypographyChange('autoSize', !layer.typography?.autoSize)}
              >
                <div className={`w-8 h-4 rounded-full flex items-center p-0.5 transition-colors ${layer.typography?.autoSize ? 'bg-meevo-purple' : 'bg-meevo-surface-4'}`}>
                  <div className={`bg-white w-3 h-3 rounded-full shadow-sm transition-transform ${layer.typography?.autoSize ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
                <span className="text-xs text-meevo-text-secondary">Auto-Size</span>
              </div>
              <div className="flex gap-2 mt-1">
                {/* Horizontal Align */}
                <div className="w-1/2 flex justify-between bg-meevo-surface-2 rounded-md p-0.5">
                  {(['left', 'center', 'right'] as const).map(align => (
                    <button key={align} onClick={() => handleTypographyChange('alignH', align)} className={`p-1.5 rounded flex-1 flex justify-center ${layer.typography?.alignH === align ? 'bg-meevo-surface-4' : 'hover:bg-meevo-surface-0'}`}>
                      {align === 'left' && <TextAlignLeft20Regular fontSize={14} className="text-meevo-text-primary" />}
                      {align === 'center' && <TextAlignCenter20Regular fontSize={14} className="text-meevo-text-primary" />}
                      {align === 'right' && <TextAlignRight20Regular fontSize={14} className="text-meevo-text-primary" />}
                    </button>
                  ))}
                </div>
                {/* Vertical Align */}
                <div className="w-1/2 flex justify-between bg-meevo-surface-2 rounded-md p-0.5">
                  {(['top', 'middle', 'bottom'] as const).map(align => (
                    <button key={align} onClick={() => handleTypographyChange('alignV', align)} className={`p-1.5 rounded flex-1 flex justify-center ${layer.typography?.alignV === align ? 'bg-meevo-surface-4' : 'hover:bg-meevo-surface-0'}`}>
                      {align === 'top' && <AlignTop20Regular fontSize={14} className="text-meevo-text-primary" />}
                      {align === 'middle' && <AlignCenterVertical20Regular fontSize={14} className="text-meevo-text-primary" />}
                      {align === 'bottom' && <AlignBottom20Regular fontSize={14} className="text-meevo-text-primary" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[10px] font-bold text-meevo-text-secondary tracking-wider uppercase">Text Content</label>
                <button
                  onClick={() => setBindingModalField('text')}
                  className="text-[10px] font-bold text-meevo-purple tracking-wider uppercase hover:text-meevo-text-primary transition-colors"
                >
                  {isCardMode ? 'Styles' : 'Prop.'}
                </button>
              </div>
              <textarea 
                className="w-full bg-meevo-surface-2 border border-meevo-border rounded-md p-2 text-sm text-meevo-text-primary outline-none focus:ring-1 focus:ring-meevo-purple resize-none"
                value={layer.text || ''}
                onChange={e => {
                  handleChange('text', e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
                }}
                onFocus={e => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
                }}
              />
            </div>
          </div>
        )}

        <FillEditor 
          fillColor={layer.fillColor}
          binding={layer.bindings?.fillColor}
          bindingName={layer.bindings?.fillColor ? getPropName(layer.bindings.fillColor) : undefined}
          isImage={layer.type === 'image'}
          imageSrc={layer.src}
          imageOpacity={layer.opacity}
          onChange={(field, value) => handleChange(field as keyof LayerData, value)}
          onRemoveBinding={() => {
            const newBindings = { ...layer.bindings };
            delete newBindings.fillColor;
            handleChange('bindings', newBindings);
          }}
          onOpenBindingModal={() => setBindingModalField('fillColor')}
          onOpenColorPicker={(x, y) => setActivePicker({ field: 'fillColor', x, y })}
          onOpenImagePicker={(x, y) => setActiveImagePicker({ x, y })}

        />

        <StrokeEditor 
          strokeWidth={layer.strokeWidth ?? 0}
          strokeColor={layer.strokeColor}
          strokeOpacity={layer.strokeOpacity}
          binding={layer.bindings?.strokeColor}
          bindingName={layer.bindings?.strokeColor ? getPropName(layer.bindings.strokeColor) : undefined}
          onChange={(field, value) => handleChange(field as keyof LayerData, value)}
          onRemoveBinding={() => {
            const newBindings = { ...layer.bindings };
            delete newBindings.strokeColor;
            handleChange('bindings', newBindings);
          }}
          onOpenBindingModal={() => setBindingModalField('strokeColor')}
          onOpenColorPicker={(x, y) => setActivePicker({ field: 'strokeColor', x, y })}

        />

      </div>


      
      {activePicker && (
        <ColorPickerModal 
          color={layer[activePicker.field as keyof LayerData] as string || '#FFFFFF'}
          x={activePicker.x - 260} // Offset to left
          y={activePicker.y}
          onChange={(color) => handleChange(activePicker.field as keyof LayerData, color)}
          onClose={() => setActivePicker(null)}
          variables={boardVariables}
        />
      )}
      
      {activeImagePicker && layer.type === 'image' && (
        <ImageFillModal
          layer={layer}
          x={activeImagePicker.x - 260}
          y={activeImagePicker.y}
          onChange={(data) => {
            Object.entries(data).forEach(([k, v]) => handleChange(k as keyof LayerData, v));
          }}
          onClose={() => setActiveImagePicker(null)}
        />
      )}
      
      {bindingModalField && tileData && (
        <PropertyBindingModal
          variables={boardVariables as any}
          tileVariableIds={tileData.variableIds || []}
          filterType={bindingModalField === 'text' ? undefined : 'Color'}
          onBind={(propertyId) => {
            if (bindingModalField === 'text') {
              const propName = getPropName(propertyId);
              const currentText = layer.text || '';
              handleChange('text', currentText + (currentText.length > 0 && !currentText.endsWith(' ') ? ' ' : '') + `{${propName}}`);
            } else {
              handleChange('bindings', { ...(layer.bindings || {}), [bindingModalField]: propertyId });
            }
            setBindingModalField(null);
          }}
          onClose={() => setBindingModalField(null)}
        />
      )}
    </div>
  );
};

