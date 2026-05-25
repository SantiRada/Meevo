import React, { useRef, useState, useEffect, useMemo } from 'react';
import { ZoomIn20Regular, ZoomOut20Regular, ArrowUndo20Regular } from '@fluentui/react-icons';
import type { BoardConfig, BoardTileVariable, BoardTileData } from '../../services/storage/types';
import { generateBoardPath } from '../../utils/boardPathGenerator';
import { DesignToolbar, type DesignTool } from './DesignToolbar';
import type { BoardSubTab } from '../../pages/Editor';

interface WorkspaceProps {
  activeTab: string;
  boardConfig?: BoardConfig;
  boardSubTab?: BoardSubTab;
  setBoardSubTab?: (tab: BoardSubTab) => void;
  selectedTileIds?: number[];
  setSelectedTileIds?: (ids: number[]) => void;
  boardVariables?: BoardTileVariable[];
  boardTilesData?: Record<number, BoardTileData>;
  activeDesignTool?: DesignTool;
  setActiveDesignTool?: (tool: DesignTool) => void;
  selectedLayerIds?: string[];
  setSelectedLayerIds?: (ids: string[]) => void;
  onUpdateTile?: (tileId: number, data: Partial<BoardTileData>) => void;
}

const hexToRgba = (hex: string, opacity: number) => {
  if (!hex) return 'transparent';
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
};

export const Workspace: React.FC<WorkspaceProps> = ({ 
  activeTab, 
  boardConfig,
  boardSubTab,
  setBoardSubTab,
  selectedTileIds = [],
  setSelectedTileIds,
  boardVariables = [],
  boardTilesData = {},
  activeDesignTool,
  setActiveDesignTool,
  selectedLayerIds = [],
  setSelectedLayerIds,
  onUpdateTile
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const lastPanPoint = useRef({ x: 0, y: 0 });

  const boardTiles = useMemo(() => {
    if (!boardConfig) return [];
    return generateBoardPath(boardConfig, boardTilesData);
  }, [boardConfig, boardTilesData]);

  const lastZoomedRef = useRef<{ tab: string, tileId: number | null }>({ tab: '', tileId: null });

  useEffect(() => {
    if (boardSubTab === 'Design' && selectedTileIds.length === 1 && containerRef.current) {
      const tileId = selectedTileIds[0];
      
      if (lastZoomedRef.current.tab === boardSubTab && lastZoomedRef.current.tileId === tileId) {
        return;
      }

      const tile = boardTiles.find(t => t.id === tileId);
      if (tile && boardConfig) {
        const container = containerRef.current.getBoundingClientRect();
        const maxTileDim = Math.max(boardConfig.tileWidth, boardConfig.tileHeight);
        
        // Target scale so the tile takes up ~70% of the container
        const targetScale = (Math.min(container.width, container.height) * 0.7) / maxTileDim;
        const clampedScale = Math.max(0.5, Math.min(5, targetScale));
        
        // We want ScreenX = tile.x * scale + transform.x = container.width / 2
        // So transform.x = container.width / 2 - tile.x * scale
        
        setTransform({
          x: container.width / 2 - tile.x * clampedScale,
          y: container.height / 2 - tile.y * clampedScale,
          scale: clampedScale
        });

        lastZoomedRef.current = { tab: boardSubTab, tileId };
      }
    } else if (boardSubTab !== 'Design') {
      lastZoomedRef.current = { tab: boardSubTab || '', tileId: null };
    }
  }, [boardSubTab, selectedTileIds, boardTiles, boardConfig]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      if (e.ctrlKey) {
        // Zoom
        const zoomSensitivity = 0.001;
        const delta = -e.deltaY * zoomSensitivity;
        const newScale = Math.max(0.1, Math.min(5, transform.scale * (1 + delta)));
        
        setTransform(prev => ({
          ...prev,
          scale: newScale
        }));
      } else if (e.shiftKey) {
        // Horizontal Pan
        setTransform(prev => ({
          ...prev,
          x: prev.x - e.deltaY
        }));
      } else {
        // Vertical/Free Pan
        setTransform(prev => ({
          ...prev,
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY
        }));
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
      if (e.key.toLowerCase() === 'z') {
        setTransform(prev => ({ ...prev, scale: 1 }));
      }
      
      // Delete layer shortcut
      if ((e.key === 'Delete' || e.key === 'Backspace') && boardSubTab === 'Design' && selectedTileIds.length === 1 && selectedLayerIds.length > 0 && onUpdateTile) {
        const tileId = selectedTileIds[0];
        const layers = boardTilesData[tileId]?.layers || [];
        onUpdateTile(tileId, { layers: layers.filter(l => !selectedLayerIds.includes(l.id)) });
        setSelectedLayerIds?.([]);
      }

      // Rename shortcut
      if (e.key.toLowerCase() === 'r' && e.ctrlKey && boardSubTab === 'Design' && selectedTileIds.length === 1 && selectedLayerIds.length > 0 && onUpdateTile) {
        e.preventDefault();
        const newName = window.prompt('Rename selected layers:', 'New Name');
        if (newName) {
          const tileId = selectedTileIds[0];
          const layers = boardTilesData[tileId]?.layers || [];
          onUpdateTile(tileId, { layers: layers.map(l => selectedLayerIds.includes(l.id) ? { ...l, name: newName } : l) });
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [transform.scale]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1) { // Middle click
      e.preventDefault();
      setIsPanning(true);
      lastPanPoint.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - lastPanPoint.current.x;
      const deltaY = e.clientY - lastPanPoint.current.y;
      
      setTransform(prev => ({
        ...prev,
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      lastPanPoint.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleZoomIn = () => setTransform(prev => ({ ...prev, scale: Math.min(5, prev.scale * 1.2) }));
  const handleZoomOut = () => setTransform(prev => ({ ...prev, scale: Math.max(0.1, prev.scale / 1.2) }));
  const handleReset = () => setTransform({ x: 0, y: 0, scale: 1 });

  return (
    <div className="w-full h-full flex flex-col">
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`flex-1 relative overflow-hidden bg-[#0C0C0E] ${isPanning ? 'cursor-grabbing' : 'cursor-default'}`}
      >
        {/* The Infinite Canvas */}
        <div 
          className="absolute inset-0 select-none"
          style={{
            // Minimalist Grid
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: `${40 * transform.scale}px ${40 * transform.scale}px`,
            backgroundPosition: `${transform.x}px ${transform.y}px`,
          }}
          onPointerDown={(e) => {
            if (!e.shiftKey && setSelectedTileIds && boardSubTab !== 'Design') {
              if ((e.target as HTMLElement).tagName === 'DIV') {
                setSelectedTileIds([]);
              }
            } else if (boardSubTab === 'Design' && setSelectedLayerIds) {
              if ((e.target as HTMLElement).tagName === 'DIV' || (e.target as HTMLElement).tagName === 'path') {
                setSelectedLayerIds([]);
              }
            }
          }}
        >
          {/* Tile Layer (Translated & Scaled) */}
          <div style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: '0 0',
            position: 'absolute',
            inset: 0,
          }}>
            
            {activeTab === 'Board' && boardTiles.map(tile => {
              const tileData = boardTilesData[tile.id];
              const isSelected = selectedTileIds.includes(tile.id);
              
              const tW = boardConfig?.tileWidth || 60;
              const tH = boardConfig?.tileHeight || 60;
              const isCorner = tile.isCorner;

              let finalW = tW;
              let finalH = tH;
              if (boardConfig?.pathShape === 'Hexagon' || boardConfig?.pathShape === 'Pentagon' || boardConfig?.pathShape === 'Circle') {
                const maxDim = Math.max(tW, tH);
                finalW = maxDim;
                finalH = maxDim;
              }

              const maxR = tile.maxRounded !== undefined ? tile.maxRounded : 999;
              let roundedVal = tileData?.rounded !== undefined ? tileData.rounded : 6;
              if (roundedVal < 0) roundedVal = 0;
              if (roundedVal > maxR) roundedVal = maxR;
              const tileName = tileData?.name || tile.id;
              
              const variableIds = tileData?.variableIds || (tileData as any)?.propertyIds || [];
              const colors = variableIds.map(pid => boardVariables.find(p => p.id === pid)?.color).filter(Boolean) as string[];

              let bgStyle: React.CSSProperties = { backgroundColor: '#1A1A1D' };
              if (colors.length === 1) {
                bgStyle = { backgroundColor: colors[0] };
              } else if (colors.length > 1) {
                const stripeSize = 100 / colors.length;
                const stops = colors.map((c, i) => `${c} ${i * stripeSize}%, ${c} ${(i + 1) * stripeSize}%`).join(', ');
                bgStyle = { backgroundImage: `repeating-linear-gradient(45deg, ${stops})` };
              }

              const opacityClass = (boardSubTab === 'Design' && selectedTileIds[0] !== tile.id) ? 'opacity-30' : 'opacity-100';

              const renderLayers = (clipPath?: string) => {
                if (boardSubTab !== 'Design' || selectedTileIds[0] !== tile.id) return null;
                return (
                  <div 
                    className="absolute inset-0"
                    style={{ 
                      width: clipPath ? finalW : '100%', 
                      height: clipPath ? finalH : '100%', 
                      left: clipPath ? -finalW/2 : 0, 
                      top: clipPath ? -finalH/2 : 0,
                      clipPath: clipPath,
                      overflow: clipPath ? 'visible' : 'hidden',
                      borderRadius: clipPath ? undefined : `${roundedVal}px`
                    }}
                    onPointerDown={(e) => {
                      if (activeDesignTool === 'Shape' || activeDesignTool === 'Text') {
                        e.stopPropagation();
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        const x = (e.clientX - rect.left) / transform.scale;
                        const y = (e.clientY - rect.top) / transform.scale;
                        const newLayer: any = {
                          id: Date.now().toString(),
                          name: activeDesignTool === 'Shape' ? 'Rectangle' : 'Text Layer',
                          type: activeDesignTool === 'Shape' ? 'rect' : 'text',
                          x: Math.round(x), y: Math.round(y),
                          width: activeDesignTool === 'Shape' ? 50 : 100, height: activeDesignTool === 'Shape' ? 50 : 20,
                          rotation: 0, opacity: 100,
                          fillColor: activeDesignTool === 'Shape' ? '#AAAAAA' : '#FFFFFF',
                          text: activeDesignTool === 'Text' ? 'New Text' : undefined
                        };
                        const layers = tileData?.layers || [];
                        onUpdateTile?.(tile.id, { layers: [...layers, newLayer] });
                        setSelectedLayerIds?.([newLayer.id]);
                        setActiveDesignTool?.('Cursor');
                      }
                    }}
                  >
                    {(tileData?.layers || []).map(layer => {
                      const isLayerSelected = selectedLayerIds.includes(layer.id);
                      return (
                        <div
                          key={layer.id}
                          className={`absolute outline-none ${isLayerSelected ? 'ring-1 ring-meevo-purple ring-offset-1 ring-offset-black cursor-move' : ''}`}
                          style={{
                            left: layer.x, top: layer.y, width: layer.width, height: layer.height,
                            transform: `rotate(${layer.rotation}deg)`,
                            opacity: (layer.opacity || 100) / 100,
                            backgroundColor: layer.type === 'rect' ? hexToRgba(layer.fillColor || '#AAAAAA', layer.fillOpacity ?? 100) : undefined,
                            color: layer.type === 'text' ? hexToRgba(layer.fillColor || '#FFFFFF', layer.fillOpacity ?? 100) : undefined,
                            boxShadow: layer.type === 'rect' && layer.strokeWidth && layer.strokeWidth > 0 ? `inset 0 0 0 ${layer.strokeWidth}px ${hexToRgba(layer.strokeColor || '#000000', layer.strokeOpacity ?? 100)}` : undefined,
                            pointerEvents: (activeDesignTool === 'Shape' || activeDesignTool === 'Text') ? 'none' : 'auto',
                            whiteSpace: 'pre-wrap',
                            fontFamily: layer.type === 'text' ? (layer.typography?.fontFamily || 'Inter') : undefined,
                            fontWeight: layer.type === 'text' ? (layer.typography?.weight === 'Bold' ? 700 : layer.typography?.weight === 'Medium' ? 500 : layer.typography?.weight === 'Light' ? 300 : 400) : undefined,
                            fontSize: layer.type === 'text' ? `${layer.typography?.size || 14}px` : undefined,
                            justifyContent: layer.type === 'text' ? (layer.typography?.alignH === 'left' ? 'flex-start' : layer.typography?.alignH === 'right' ? 'flex-end' : 'center') : undefined,
                            alignItems: layer.type === 'text' ? (layer.typography?.alignV === 'top' ? 'flex-start' : layer.typography?.alignV === 'bottom' ? 'flex-end' : 'center') : undefined,
                            textAlign: layer.type === 'text' ? (layer.typography?.alignH || 'center') : undefined,
                            overflow: 'hidden',
                          }}
                          onPointerDown={(e) => {
                            if (activeDesignTool === 'Cursor') {
                              e.stopPropagation();
                              if (e.shiftKey) {
                                if (selectedLayerIds.includes(layer.id)) setSelectedLayerIds?.(selectedLayerIds.filter(id => id !== layer.id));
                                else setSelectedLayerIds?.([...selectedLayerIds, layer.id]);
                              } else {
                                setSelectedLayerIds?.([layer.id]);
                              }
                              const startX = e.clientX, startY = e.clientY;
                              const startLayerX = layer.x, startLayerY = layer.y;
                              const handleMove = (ev: PointerEvent) => {
                                const rad = -tile.rotation * Math.PI / 180;
                                const dx = (ev.clientX - startX) / transform.scale;
                                const dy = (ev.clientY - startY) / transform.scale;
                                const rotatedDx = dx * Math.cos(rad) - dy * Math.sin(rad);
                                const rotatedDy = dx * Math.sin(rad) + dy * Math.cos(rad);
                                const newLayers = [...(tileData?.layers || [])];
                                const lIndex = newLayers.findIndex(l => l.id === layer.id);
                                if (lIndex >= 0) {
                                  newLayers[lIndex] = { ...newLayers[lIndex], x: Math.round(startLayerX + rotatedDx), y: Math.round(startLayerY + rotatedDy) };
                                  onUpdateTile?.(tile.id, { layers: newLayers });
                                }
                              };
                              const handleUp = () => {
                                window.removeEventListener('pointermove', handleMove);
                                window.removeEventListener('pointerup', handleUp);
                              };
                              window.addEventListener('pointermove', handleMove);
                              window.addEventListener('pointerup', handleUp);
                            }
                          }}
                        >
                          <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: layer.type === 'text' ? (layer.typography?.alignV === 'top' ? 'flex-start' : layer.typography?.alignV === 'bottom' ? 'flex-end' : 'center') : undefined,
                          }}>
                            <div style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 8,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}>
                              {layer.type === 'text' && layer.text}
                            </div>
                          </div>
                          
                          {/* Resize Handles */}
                          {isLayerSelected && activeDesignTool === 'Cursor' && (
                            <>
                              {['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'].map(dir => (
                                <div
                                  key={dir}
                                  className="absolute bg-white border border-meevo-purple w-2 h-2"
                                  style={{
                                    top: dir.includes('n') ? -4 : dir.includes('s') ? '100%' : '50%',
                                    left: dir.includes('w') ? -4 : dir.includes('e') ? '100%' : '50%',
                                    transform: 'translate(-50%, -50%)',
                                    cursor: `${dir}-resize`,
                                    pointerEvents: 'auto'
                                  }}
                                  onPointerDown={(e) => {
                                    e.stopPropagation();
                                    const startX = e.clientX, startY = e.clientY;
                                    const startLayerX = layer.x, startLayerY = layer.y;
                                    const startW = layer.width, startH = layer.height;
                                    const handleResize = (ev: PointerEvent) => {
                                      const rad = -(tile.rotation + layer.rotation) * Math.PI / 180;
                                      const dx = (ev.clientX - startX) / transform.scale;
                                      const dy = (ev.clientY - startY) / transform.scale;
                                      const rDx = dx * Math.cos(rad) - dy * Math.sin(rad);
                                      const rDy = dx * Math.sin(rad) + dy * Math.cos(rad);
                                      
                                      let newX = startLayerX, newY = startLayerY, newW = startW, newH = startH;
                                      
                                      if (dir.includes('e')) newW = Math.max(1, startW + rDx);
                                      if (dir.includes('s')) newH = Math.max(1, startH + rDy);
                                      if (dir.includes('w')) {
                                        newW = Math.max(1, startW - rDx);
                                        newX = startLayerX + (startW - newW);
                                      }
                                      if (dir.includes('n')) {
                                        newH = Math.max(1, startH - rDy);
                                        newY = startLayerY + (startH - newH);
                                      }

                                      const newLayers = [...(tileData?.layers || [])];
                                      const lIndex = newLayers.findIndex(l => l.id === layer.id);
                                      if (lIndex >= 0) {
                                        newLayers[lIndex] = { ...newLayers[lIndex], x: Math.round(newX), y: Math.round(newY), width: Math.round(newW), height: Math.round(newH) };
                                        onUpdateTile?.(tile.id, { layers: newLayers });
                                      }
                                    };
                                    const handleResizeUp = () => {
                                      window.removeEventListener('pointermove', handleResize);
                                      window.removeEventListener('pointerup', handleResizeUp);
                                    };
                                    window.addEventListener('pointermove', handleResize);
                                    window.addEventListener('pointerup', handleResizeUp);
                                  }}
                                />
                              ))}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              };

              if (isCorner && tile.cornerPolygon) {
                const pointsStr = tile.cornerPolygon.map(p => `${p.x},${p.y}`).join(' ');
                return (
                  <div
                    key={tile.id}
                    className={`absolute flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${opacityClass}`}
                    style={{
                      left: tile.x,
                      top: tile.y,
                      width: 0,
                      height: 0,
                      transform: `translate(-50%, -50%) rotate(${tile.rotation}deg)`,
                    }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      if (boardSubTab === 'Design') {
                        if (selectedTileIds[0] !== tile.id) {
                          setSelectedTileIds?.([tile.id]);
                          setSelectedLayerIds?.([]);
                        }
                      } else if (setSelectedTileIds) {
                        setSelectedTileIds(e.shiftKey ? [...selectedTileIds, tile.id] : [tile.id]);
                      }
                    }}
                  >
                    <svg style={{ overflow: 'visible', position: 'absolute', inset: 0, zIndex: -1 }}>
                      {colors.length > 1 && (
                        <defs>
                          <linearGradient id={`grad-${tile.id}`} x1="0" y1="0" x2="1" y2="1">
                            {colors.map((c, i) => {
                              const pct = (i / colors.length) * 100;
                              const nextPct = ((i + 1) / colors.length) * 100;
                              return (
                                <React.Fragment key={i}>
                                  <stop offset={`${pct}%`} stopColor={c} />
                                  <stop offset={`${nextPct}%`} stopColor={c} />
                                </React.Fragment>
                              );
                            })}
                          </linearGradient>
                        </defs>
                      )}
                      {isSelected && (
                        <polygon points={pointsStr} fill="none" stroke="#F0B100" strokeWidth={roundedVal * 2 + 4} strokeLinejoin="round" />
                      )}
                      <polygon points={pointsStr} fill={colors.length === 1 ? colors[0] : colors.length > 1 ? `url(#grad-${tile.id})` : "#2B3830"} stroke={colors.length > 0 ? "transparent" : "#2B3830"} strokeWidth={roundedVal * 2} strokeLinejoin="round" />
                    </svg>
                    
                    {/* Corner clipping for layers requires translating the polygon so (0,0) is top-left */}
                    {renderLayers(`polygon(${tile.cornerPolygon.map(p => `${p.x + finalW/2}px ${p.y + finalH/2}px`).join(', ')})`)}
                  </div>
                );
              }

              return (
                <div
                  key={tile.id}
                  className={`absolute border shadow flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${opacityClass} ${
                    isSelected ? 'border-[#F0B100] text-meevo-text-primary z-10' : 'border-meevo-border text-meevo-text-tertiary'
                  }`}
                  style={{
                    left: tile.x,
                    top: tile.y,
                    width: finalW,
                    height: finalH,
                    transform: `translate(-50%, -50%) rotate(${tile.rotation}deg)`,
                    borderRadius: `${roundedVal}px`,
                    ...bgStyle
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    if (boardSubTab === 'Design') {
                      if (selectedTileIds[0] !== tile.id) {
                        setSelectedTileIds?.([tile.id]);
                        setSelectedLayerIds?.([]);
                      }
                    } else if (setSelectedTileIds) {
                      setSelectedTileIds(e.shiftKey ? [...selectedTileIds, tile.id] : [tile.id]);
                    }
                  }}
                >
                  {tileName}
                  {renderLayers()}
                </div>
              );
            })}

          </div>
        </div>

        <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
          <div className="bg-[#1A1A1D] border border-[#CCCCCC]/10 text-meevo-text-secondary text-xs px-3 py-1.5 rounded-md shadow-lg font-medium inline-block pointer-events-auto">
            {Math.round(transform.scale * 100)}%
          </div>
        </div>

        {/* Floating UI: Top Right Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10 pointer-events-none">
          <div className="bg-[#1A1A1D] border border-[#CCCCCC]/10 rounded-md shadow-lg flex flex-col overflow-hidden p-1 gap-1 pointer-events-auto">
            <button 
              onClick={handleZoomIn}
              className="p-2 text-meevo-text-secondary hover:text-meevo-text-primary hover:bg-[#212124] rounded-sm transition-colors"
            >
              <ZoomIn20Regular />
            </button>
            <button 
              onClick={handleZoomOut}
              className="p-2 text-meevo-text-secondary hover:text-meevo-text-primary hover:bg-[#212124] rounded-sm transition-colors"
            >
              <ZoomOut20Regular />
            </button>
            <button 
              onClick={handleReset}
              className="p-2 text-meevo-text-secondary hover:text-meevo-text-primary hover:bg-[#212124] rounded-sm transition-colors"
            >
              <ArrowUndo20Regular />
            </button>
          </div>
        </div>

        {/* Toolbar in Design Mode */}
        {boardSubTab === 'Design' && activeDesignTool && setActiveDesignTool && (
          <DesignToolbar activeTool={activeDesignTool} onChangeTool={setActiveDesignTool} />
        )}
      </div>

      {/* Bottom Bar for Board */}
      {activeTab === 'Board' && (
        <div className="h-10 border-t border-[#CCCCCC]/10 bg-[#070709] px-6 flex items-center shrink-0 gap-2 text-xs font-medium">
          <span 
            className={`cursor-pointer transition-colors ${boardSubTab === 'Type Board' ? 'text-meevo-text-primary font-bold border-b border-meevo-text-primary pb-0.5' : 'text-meevo-text-secondary hover:text-meevo-text-primary'}`}
            onClick={() => setBoardSubTab?.('Type Board')}
          >
            Type Board
          </span>
          <span className="text-[#4C4C4C]">&gt;</span>
          <span 
            className={`cursor-pointer transition-colors ${boardSubTab === 'Tiles' ? 'text-meevo-text-primary font-bold border-b border-meevo-text-primary pb-0.5' : 'text-meevo-text-secondary hover:text-meevo-text-primary'}`}
            onClick={() => setBoardSubTab?.('Tiles')}
          >
            Tiles
          </span>
          <span className="text-[#4C4C4C]">&gt;</span>
          <span 
            className={`cursor-pointer transition-colors ${boardSubTab === 'Design' ? 'text-meevo-text-primary font-bold border-b border-meevo-text-primary pb-0.5' : 'text-meevo-text-secondary hover:text-meevo-text-primary'}`}
            onClick={() => setBoardSubTab?.('Design')}
          >
            Design
          </span>
        </div>
      )}
    </div>
  );
};
