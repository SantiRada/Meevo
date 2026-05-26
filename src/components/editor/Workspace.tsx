import React, { useRef, useState, useEffect, useMemo } from 'react';
import { ZoomIn20Regular, ZoomOut20Regular, ArrowUndo20Regular } from '@fluentui/react-icons';
import type { BoardConfig, BoardTileVariable, BoardTileData } from '../../services/storage/types';
import { generateBoardPath } from '../../utils/boardPathGenerator';
import { DesignToolbar, type DesignTool } from './DesignToolbar';
import type { BoardSubTab } from '../../pages/Editor';

interface WorkspaceProps {
  activeTab: string;
  boardConfig?: BoardConfig;
  boardSubTab: string;
  setBoardSubTab: (tab: string) => void;
  selectedTileIds: number[];
  setSelectedTileIds?: (ids: number[]) => void;
  boardVariables: BoardTileVariable[];
  boardTilesData: Record<number, BoardTileData>;
  activeDesignTool?: string;
  setActiveDesignTool?: (tool: string) => void;
  selectedLayerIds?: string[];
  setSelectedLayerIds?: (ids: string[]) => void;
  selectedTableLayerIds?: string[];
  setSelectedTableLayerIds?: (ids: string[]) => void;
  onUpdateTile?: (tileId: number, data: Partial<BoardTileData>) => void;
  onUpdateTiles?: (updates: { id: number, data: Partial<BoardTileData> }[]) => void;
  onDuplicateTiles?: (duplicates: { originalId: number, data: Partial<BoardTileData> }[]) => void;
  onUndo?: () => void;
  onUpdateBoardConfig?: (config: BoardConfig, silent?: boolean) => void;
  onReplaceBoardTilesData?: (data: Record<number, BoardTileData>) => void;
}

const hexToRgba = (colorStr: string, opacity: number) => {
  if (!colorStr) return 'transparent';
  if (opacity === 100 && !colorStr.startsWith('#')) return colorStr;

  let hex = colorStr;
  if (!hex.startsWith('#')) {
    const ctx = document.createElement('canvas').getContext('2d');
    if (ctx) {
      ctx.fillStyle = hex;
      if (ctx.fillStyle.startsWith('#')) hex = ctx.fillStyle;
    }
  }

  let r = 0, g = 0, b = 0;
  if (hex.startsWith('#')) {
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
  }
  return colorStr;
};

export const Workspace: React.FC<WorkspaceProps> = ({ 
  activeTab, 
  boardConfig,
  boardSubTab,
  setBoardSubTab,
  selectedTileIds,
  setSelectedTileIds,
  boardVariables,
  boardTilesData,
  activeDesignTool,
  setActiveDesignTool,
  selectedLayerIds = [],
  setSelectedLayerIds,
  selectedTableLayerIds = [],
  setSelectedTableLayerIds,
  onUpdateTile,
  onUpdateTiles,
  onDuplicateTiles,
  onUndo,
  onUpdateBoardConfig,
  onReplaceBoardTilesData
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const lastPanPoint = useRef({ x: 0, y: 0 });
  const [selectionBox, setSelectionBox] = useState<{ startX: number, startY: number, currX: number, currY: number } | null>(null);
  const [renameModal, setRenameModal] = useState<{ open: boolean, defaultName: string, tileId: number, layerIds: string[] }>({ open: false, defaultName: '', tileId: -1, layerIds: [] });
  
  const [connectingFromId, setConnectingFromId] = useState<number | null>(null);
  const [tempConnMouse, setTempConnMouse] = useState<{x: number, y: number} | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);

  const [dragBoardOffset, setDragBoardOffset] = useState<{x: number, y: number} | null>(null);
  const [dragTableOffset, setDragTableOffset] = useState<{x: number, y: number} | null>(null);

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
        
        const targetScale = (Math.min(container.width, container.height) * 0.7) / maxTileDim;
        const clampedScale = Math.max(0.5, Math.min(5, targetScale));
        
        const bX = boardConfig.boardX || 0;
        const bY = boardConfig.boardY || 0;
        
        setTransform({
          x: container.width / 2 - (tile.x + bX) * clampedScale,
          y: container.height / 2 - (tile.y + bY) * clampedScale,
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
        setTransform(prev => {
          const zoomSensitivity = 0.001;
          const delta = -e.deltaY * zoomSensitivity;
          const newScale = Math.max(0.1, Math.min(8, prev.scale * (1 + delta)));
          
          let newX = prev.x;
          let newY = prev.y;
          
          if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            const worldX = (mouseX - prev.x) / prev.scale;
            const worldY = (mouseY - prev.y) / prev.scale;
            
            newX = mouseX - worldX * newScale;
            newY = mouseY - worldY * newScale;
          }
          
          return {
            x: newX,
            y: newY,
            scale: newScale
          };
        });
      } else if (e.shiftKey) {
        setTransform(prev => ({
          ...prev,
          x: prev.x - e.deltaY
        }));
      } else {
        setTransform(prev => ({
          ...prev,
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY
        }));
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
      if (e.key.toLowerCase() === 'z' && !e.ctrlKey && !e.metaKey) {
        setTransform(prev => ({ ...prev, scale: 1 }));
      }
      
      if (e.key === 'Escape') {
        setSelectedTileIds?.([]);
        setSelectedLayerIds?.([]);
      }
      
      if ((e.key === 'Delete' || e.key === 'Backspace') && boardSubTab === 'Design' && selectedTileIds.length === 1 && selectedLayerIds.length > 0 && onUpdateTile) {
        const tileId = selectedTileIds[0];
        const layers = boardTilesData[tileId]?.layers || [];
        onUpdateTile(tileId, { layers: layers.filter(l => !selectedLayerIds.includes(l.id)) });
        setSelectedLayerIds?.([]);
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && boardConfig?.pathShape === 'Free Paths' && selectedConnectionId && onUpdateBoardConfig) {
        onUpdateBoardConfig({
          ...boardConfig,
          freeConnections: (boardConfig.freeConnections || []).filter(c => c.id !== selectedConnectionId)
        });
        setSelectedConnectionId(null);
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && boardSubTab === 'Type Board' && selectedTileIds.length > 0 && boardConfig && onUpdateBoardConfig && onReplaceBoardTilesData) {
        const sortedDeletedIds = [...selectedTileIds].sort((a, b) => a - b);
        const newTileCount = Math.max(1, boardConfig.tileCount - sortedDeletedIds.length);
        
        const newBoardTilesData: Record<number, BoardTileData> = {};
        const idMapping: Record<number, number> = {};
        
        let newId = 0;
        for (let oldId = 0; oldId < boardConfig.tileCount; oldId++) {
          if (!sortedDeletedIds.includes(oldId)) {
            idMapping[oldId] = newId;
            if (boardTilesData[oldId]) {
              newBoardTilesData[newId] = boardTilesData[oldId];
            }
            newId++;
          }
        }
        
        let newFreeConnections = boardConfig.freeConnections || [];
        newFreeConnections = newFreeConnections
          .filter(c => !sortedDeletedIds.includes(c.from) && !sortedDeletedIds.includes(c.to))
          .map(c => ({
            ...c,
            from: idMapping[c.from] !== undefined ? idMapping[c.from] : c.from,
            to: idMapping[c.to] !== undefined ? idMapping[c.to] : c.to
          }));
          
        onUpdateBoardConfig({
          ...boardConfig,
          tileCount: newTileCount,
          freeConnections: newFreeConnections
        });
        onReplaceBoardTilesData(newBoardTilesData);
        onReplaceBoardTilesData(newBoardTilesData);
        setSelectedTileIds?.([]);
      }

      if (e.ctrlKey && e.key.toLowerCase() === 'd' && activeTab === 'Board' && selectedTileIds.length > 0) {
        e.preventDefault();
        const duplicates = selectedTileIds.map(id => {
          const tile = boardTiles.find(t => t.id === id);
          return {
            originalId: id,
            data: {
              x: (tile?.x || 0) + 20,
              y: (tile?.y || 0) + 20
            }
          };
        });
        if (onDuplicateTiles) onDuplicateTiles(duplicates);
      }

      if (e.key.toLowerCase() === 'r' && boardSubTab === 'Design' && selectedTileIds.length === 1 && selectedLayerIds.length > 0 && onUpdateTile) {
        e.preventDefault();
        const tileId = selectedTileIds[0];
        const layers = boardTilesData[tileId]?.layers || [];
        const activeLayer = layers.find(l => l.id === selectedLayerIds[0]);
        setRenameModal({ open: true, defaultName: activeLayer?.name || 'New Name', tileId, layerIds: selectedLayerIds });
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
  }, [transform.scale, boardSubTab, selectedTileIds, selectedLayerIds, boardTilesData, onUpdateTile, selectedConnectionId, boardConfig, onUpdateBoardConfig]);

  const handleGroupDragStart = (e: React.PointerEvent) => {
    if (activeTab !== 'Components') return;
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = boardConfig?.boardX || 0;
    const initialY = boardConfig?.boardY || 0;

    let currentDx = 0;
    let currentDy = 0;

    const handleMove = (ev: PointerEvent) => {
      currentDx = (ev.clientX - startX) / transform.scale;
      currentDy = (ev.clientY - startY) / transform.scale;
      setDragBoardOffset({ x: currentDx, y: currentDy });
    };
    
    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      
      if (onUpdateBoardConfig && boardConfig && (currentDx !== 0 || currentDy !== 0)) {
        onUpdateBoardConfig({
          ...boardConfig,
          boardX: initialX + currentDx,
          boardY: initialY + currentDy
        });
      }
      setDragBoardOffset(null);
    };
    
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1) { 
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
  const handleReset = () => setTransform(prev => ({ ...prev, scale: 1 }));

  return (
    <div className="w-full h-full flex flex-col">
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`flex-1 relative overflow-hidden bg-[#0C0C0E] select-none ${isPanning ? 'cursor-grabbing' : 'cursor-default'}`}
        onPointerDown={(e) => {
          setSelectedConnectionId(null);
          if (boardSubTab !== 'Design' && e.button === 0) {
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
              const bX = boardConfig?.boardX || 0;
              const bY = boardConfig?.boardY || 0;
              const startX = ((e.clientX - rect.left - transform.x) / transform.scale) - bX;
              const startY = ((e.clientY - rect.top - transform.y) / transform.scale) - bY;
              setSelectionBox({ startX, startY, currX: startX, currY: startY });
              
              const initialSelected = e.shiftKey ? [...selectedTileIds] : [];
              if (!e.shiftKey && setSelectedTileIds) {
                setSelectedTileIds([]);
              }
              
              const handleMove = (ev: PointerEvent) => {
                const currX = ((ev.clientX - rect.left - transform.x) / transform.scale) - bX;
                const currY = ((ev.clientY - rect.top - transform.y) / transform.scale) - bY;
                setSelectionBox(prev => prev ? { ...prev, currX, currY } : null);
                
                const minX = Math.min(startX, currX);
                const maxX = Math.max(startX, currX);
                const minY = Math.min(startY, currY);
                const maxY = Math.max(startY, currY);
                
                const newlySelected = boardTiles.filter(t => {
                  const hw = (boardConfig?.tileWidth || 100) / 2;
                  const hh = (boardConfig?.tileHeight || 100) / 2;
                  return t.x >= minX - hw && t.x <= maxX + hw && t.y >= minY - hh && t.y <= maxY + hh;
                }).map(t => t.id);
                
                setSelectedTileIds?.(Array.from(new Set([...initialSelected, ...newlySelected])));
              };
              
              const handleUp = () => {
                setSelectionBox(null);
                window.removeEventListener('pointermove', handleMove);
                window.removeEventListener('pointerup', handleUp);
              };
              
              window.addEventListener('pointermove', handleMove);
              window.addEventListener('pointerup', handleUp);
            }
          } else if (boardSubTab === 'Design' && setSelectedLayerIds) {
            if ((e.target as HTMLElement).tagName === 'DIV' || (e.target as HTMLElement).tagName === 'path' || (e.target as HTMLElement).tagName === 'svg') {
              setSelectedLayerIds([]);
            }
          }
        }}
        onDoubleClick={(e) => {
          if (boardSubTab === 'Design' && setSelectedTileIds) {
            if ((e.target as HTMLElement).tagName === 'DIV' || (e.target as HTMLElement).tagName === 'path' || (e.target as HTMLElement).tagName === 'svg') {
              setSelectedTileIds([]);
              setSelectedLayerIds?.([]);
            }
          }
        }}
      >
        <div 
          className="absolute inset-0 select-none pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: `${40 * transform.scale}px ${40 * transform.scale}px`,
            backgroundPosition: `${transform.x}px ${transform.y}px`,
          }}
        />
        
        <div 
          className="absolute inset-0"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: '0 0',
          }}
        >
          <div className="relative w-full h-full">
            <div 
              className="absolute inset-0 pointer-events-none" 
              style={{ transform: `translate(${(boardConfig?.boardX || 0) + (dragBoardOffset?.x || 0)}px, ${(boardConfig?.boardY || 0) + (dragBoardOffset?.y || 0)}px)` }}
            >
              {/* Draw Table */}
              {(() => {
                if (!(activeTab === 'Components' || boardSubTab === 'Table' || activeTab === 'Board') || !boardConfig?.tableConfig) return null;
                
                const renderTableLayers = (onlyHandles: boolean = false) => {
                  const tableLayers = boardConfig.tableConfig?.layers || [];
                  return tableLayers.map(layer => {
                    const isLayerSelected = selectedTableLayerIds?.includes(layer.id);
                    if (onlyHandles && (!isLayerSelected || activeDesignTool !== 'Cursor')) return null;
                    if (onlyHandles) {
                      return (
                        <div key={`${layer.id}-handles`} className="absolute pointer-events-none" style={{ left: layer.x, top: layer.y, width: layer.width, height: layer.height, transform: `rotate(${layer.rotation}deg)` }}>
                          {['nw', 'ne', 'se', 'sw'].map(dir => {
                            const hSize = Math.max(4, Math.min(10, 8 / transform.scale));
                            return (
                              <div key={dir} className="absolute bg-white border border-meevo-purple pointer-events-auto"
                                style={{
                                  width: hSize, height: hSize, top: dir.includes('n') ? 0 : '100%', left: dir.includes('w') ? 0 : '100%',
                                  transform: 'translate(-50%, -50%)', cursor: `${dir}-resize`,
                                }}
                                onPointerDown={(e) => {
                                  if (e.button !== 0) return;
                                  e.stopPropagation();
                                  const startX = e.clientX, startY = e.clientY;
                                  const startLayerX = layer.x, startLayerY = layer.y;
                                  const startW = layer.width, startH = layer.height;
                                  const handleResize = (ev: PointerEvent) => {
                                    const rad = -layer.rotation * Math.PI / 180;
                                    const dx = (ev.clientX - startX) / transform.scale;
                                    const dy = (ev.clientY - startY) / transform.scale;
                                    const rDx = dx * Math.cos(rad) - dy * Math.sin(rad);
                                    const rDy = dx * Math.sin(rad) + dy * Math.cos(rad);
                                    
                                    let newX = startLayerX, newY = startLayerY, newW = startW, newH = startH;
                                    if (dir.includes('e')) newW = Math.max(1, startW + rDx);
                                    if (dir.includes('s')) newH = Math.max(1, startH + rDy);
                                    if (dir.includes('w')) { newW = Math.max(1, startW - rDx); newX = startLayerX + (startW - newW); }
                                    if (dir.includes('n')) { newH = Math.max(1, startH - rDy); newY = startLayerY + (startH - newH); }

                                    if (ev.shiftKey) {
                                      const useScaleX = Math.abs((newW / startW) - 1) > Math.abs((newH / startH) - 1);
                                      if (useScaleX) { newH = newW * (startH / startW); if (dir.includes('n')) newY = startLayerY + (startH - newH); } 
                                      else { newW = newH * (startW / startH); if (dir.includes('w')) newX = startLayerX + (startW - newW); }
                                    }

                                    const newLayers = [...(boardConfig.tableConfig?.layers || [])];
                                    const lIndex = newLayers.findIndex(l => l.id === layer.id);
                                    if (lIndex >= 0) {
                                      let updatedLayer = { ...newLayers[lIndex], x: Math.round(newX), y: Math.round(newY), width: Math.round(newW), height: Math.round(newH) };
                                      if (layer.type === 'image' && layer.imageMode === 'crop') {
                                        const scaleFactor = Math.max(newW / startW, newH / startH);
                                        updatedLayer.imageScale = Math.max(0.1, (layer.imageScale || 1) * scaleFactor);
                                      }
                                      newLayers[lIndex] = updatedLayer;
                                      onUpdateBoardConfig?.({ ...boardConfig, tableConfig: { ...boardConfig.tableConfig!, layers: newLayers } }, true);
                                    }
                                  };
                                  const handleResizeUp = () => { window.removeEventListener('pointermove', handleResize); window.removeEventListener('pointerup', handleResizeUp); };
                                  window.addEventListener('pointermove', handleResize); window.addEventListener('pointerup', handleResizeUp);
                                }}
                              />
                            );
                          })}
                        </div>
                      );
                    }
                    return (
                      <div
                        key={layer.id}
                        className={`absolute outline-none ${isLayerSelected ? 'ring-1 ring-meevo-purple cursor-move' : ''}`}
                        style={{
                          left: layer.x, top: layer.y, width: layer.width, height: layer.height,
                          transform: `rotate(${layer.rotation}deg)`,
                          opacity: (layer.opacity || 100) / 100,
                          backgroundColor: layer.type === 'rect' ? hexToRgba(layer.fillColor || '#AAA', layer.fillOpacity ?? 100) : undefined,
                          pointerEvents: boardSubTab === 'Table' ? 'auto' : 'none',
                          overflow: 'visible',
                        }}
                        onPointerDown={(e) => {
                          if (e.button !== 0) return;
                          if (boardSubTab !== 'Table') return;
                          if (activeDesignTool === 'Cursor') {
                            e.stopPropagation();
                            if (e.shiftKey) {
                              if (selectedTableLayerIds?.includes(layer.id)) setSelectedTableLayerIds?.(selectedTableLayerIds.filter(id => id !== layer.id));
                              else setSelectedTableLayerIds?.([...(selectedTableLayerIds||[]), layer.id]);
                            } else {
                              setSelectedTableLayerIds?.([layer.id]);
                            }
                            const startX = e.clientX, startY = e.clientY;
                            const startLayerX = layer.x, startLayerY = layer.y;
                            const handleMove = (ev: PointerEvent) => {
                              const dx = (ev.clientX - startX) / transform.scale;
                              const dy = (ev.clientY - startY) / transform.scale;
                              const newLayers = [...(boardConfig.tableConfig?.layers || [])];
                              const lIndex = newLayers.findIndex(l => l.id === layer.id);
                              if (lIndex >= 0) {
                                newLayers[lIndex] = { ...newLayers[lIndex], x: Math.round(startLayerX + dx), y: Math.round(startLayerY + dy) };
                                onUpdateBoardConfig?.({ ...boardConfig, tableConfig: { ...boardConfig.tableConfig!, layers: newLayers } }, true);
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
                          width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center',
                          backgroundImage: layer.type === 'image' && layer.imageMode === 'tile' ? `url(${layer.src})` : undefined,
                          backgroundRepeat: layer.type === 'image' && layer.imageMode === 'tile' ? 'repeat' : undefined,
                          backgroundSize: layer.type === 'image' && layer.imageMode === 'tile' ? `${layer.imageTileSize || 50}px` : undefined,
                        }}>
                          {layer.type === 'image' && layer.imageMode !== 'tile' && layer.src && (
                            <img src={layer.src} alt="" style={{ width: '100%', height: '100%', objectFit: layer.imageMode === 'fit' ? 'contain' : 'cover', pointerEvents: 'none', transform: layer.imageMode === 'crop' && layer.imageScale !== undefined ? `scale(${layer.imageScale})` : undefined }} />
                          )}
                        </div>
                      </div>
                    );
                  });
                };
                return (
                <div
                  className={`absolute rounded-2xl flex items-center justify-center transition-all ${boardSubTab === 'Table' ? 'cursor-move pointer-events-auto shadow-2xl z-0' : (activeTab === 'Components' ? 'cursor-move pointer-events-auto shadow-2xl z-0' : 'pointer-events-none z-[-1]')}`}
                  style={{
                    backgroundColor: boardConfig.tableConfig.color || '#141E17',
                    left: boardConfig.tableConfig.x + (dragTableOffset?.x || 0),
                    top: boardConfig.tableConfig.y + (dragTableOffset?.y || 0),
                    width: boardConfig.tableConfig.width,
                    height: boardConfig.tableConfig.height,
                    transform: 'translate(-50%, -50%)',
                    borderRadius: boardConfig.tableConfig.shape === 'Circle' || boardConfig.tableConfig.shape === 'Oval' ? '50%' : '16px',
                    clipPath: boardConfig.tableConfig.shape === 'Hexagon' ? 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' :
                              boardConfig.tableConfig.shape === 'Pentagon' ? 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' : 'none'
                  }}
                  onPointerDown={(e) => {
                    if (e.button !== 0) return;
                    if (activeTab === 'Components') {
                      handleGroupDragStart(e);
                      return;
                    }
                    if (boardSubTab !== 'Table') return;
                    e.stopPropagation();

                    if (activeDesignTool === 'Image') {
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      const x = (e.clientX - rect.left) / transform.scale - boardConfig.tableConfig!.width / 2;
                      const y = (e.clientY - rect.top) / transform.scale - boardConfig.tableConfig!.height / 2;

                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (ev) => {
                        const file = (ev.target as HTMLInputElement).files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const newLayer: any = {
                              id: Date.now().toString(), name: 'Image', type: 'image',
                              x: Math.round(x), y: Math.round(y), width: 150, height: 150,
                              rotation: 0, opacity: 100, src: event.target?.result as string, imageMode: 'fill'
                            };
                            const layers = boardConfig.tableConfig?.layers || [];
                            onUpdateBoardConfig?.({
                              ...boardConfig, tableConfig: { ...boardConfig.tableConfig!, layers: [...layers, newLayer] }
                            });
                            setSelectedTableLayerIds?.([newLayer.id]);
                            setActiveDesignTool?.('Cursor');
                          };
                          reader.readAsDataURL(file);
                        } else {
                          setActiveDesignTool?.('Cursor');
                        }
                      };
                      input.click();
                      return;
                    }

                    setSelectedTableLayerIds?.([]);

                    const startX = e.clientX;
                    const startY = e.clientY;
                    const initialX = boardConfig.tableConfig!.x;
                    const initialY = boardConfig.tableConfig!.y;

                    let currentDx = 0;
                    let currentDy = 0;

                    const handleMove = (ev: PointerEvent) => {
                      currentDx = (ev.clientX - startX) / transform.scale;
                      currentDy = (ev.clientY - startY) / transform.scale;
                      setDragTableOffset({ x: currentDx, y: currentDy });
                    };
                    
                    const handleUp = () => {
                      window.removeEventListener('pointermove', handleMove);
                      window.removeEventListener('pointerup', handleUp);
                      
                      if (onUpdateBoardConfig && (currentDx !== 0 || currentDy !== 0)) {
                        onUpdateBoardConfig({
                          ...boardConfig,
                          tableConfig: {
                            ...boardConfig.tableConfig!,
                            x: initialX + currentDx,
                            y: initialY + currentDy
                          }
                        }, true);
                      }
                      setDragTableOffset(null);
                    };
                    
                    window.addEventListener('pointermove', handleMove);
                    window.addEventListener('pointerup', handleUp);
                  }}
                >
                  <div className="absolute inset-0 pointer-events-none" style={{ overflow: 'hidden', borderRadius: boardConfig.tableConfig.shape === 'Circle' || boardConfig.tableConfig.shape === 'Oval' ? '50%' : '16px' }}>
                    {renderTableLayers(false)}
                  </div>
                  <div className="absolute inset-0 pointer-events-none">
                    {renderTableLayers(true)}
                  </div>
                  {boardSubTab === 'Table' && activeDesignTool === 'Cursor' && selectedTableLayerIds?.length === 0 && (
                    <>
                      {['e', 's', 'se'].map(dir => {
                        const hSize = Math.max(4, Math.min(10, 8 / transform.scale));
                        return (
                          <div
                            key={dir}
                            className="absolute bg-white border border-meevo-purple pointer-events-auto"
                            style={{
                              width: hSize, height: hSize,
                              top: dir.includes('s') ? '100%' : '50%',
                              left: dir.includes('e') ? '100%' : '50%',
                              transform: 'translate(-50%, -50%)',
                              cursor: `${dir}-resize`,
                            }}
                            onPointerDown={(e) => {
                              if (e.button !== 0) return;
                              e.stopPropagation();
                              const startX = e.clientX, startY = e.clientY;
                              const startW = boardConfig.tableConfig!.width, startH = boardConfig.tableConfig!.height;
                              const handleResize = (ev: PointerEvent) => {
                                const dx = (ev.clientX - startX) / transform.scale;
                                const dy = (ev.clientY - startY) / transform.scale;
                                let newW = startW, newH = startH;
                                if (dir.includes('e')) newW = Math.max(10, startW + dx * 2);
                                if (dir.includes('s')) newH = Math.max(10, startH + dy * 2);
                                onUpdateBoardConfig?.({
                                  ...boardConfig,
                                  tableConfig: { ...boardConfig.tableConfig!, width: Math.round(newW), height: Math.round(newH) }
                                }, true);
                              };
                              const handleResizeUp = () => {
                                window.removeEventListener('pointermove', handleResize);
                                window.removeEventListener('pointerup', handleResizeUp);
                              };
                              window.addEventListener('pointermove', handleResize);
                              window.addEventListener('pointerup', handleResizeUp);
                            }}
                          />
                        );
                      })}
                    </>
                  )}
                </div>
              );
            })()}
              
              {/* Render Selection Box */}
            {selectionBox && (
              <div 
                className="absolute border border-meevo-purple bg-meevo-purple/10 pointer-events-none z-50"
                style={{
                  left: Math.min(selectionBox.startX, selectionBox.currX),
                  top: Math.min(selectionBox.startY, selectionBox.currY),
                  width: Math.abs(selectionBox.currX - selectionBox.startX),
                  height: Math.abs(selectionBox.currY - selectionBox.startY),
                }}
              />
            )}

            {/* Draw Snake Path Line */}
            {boardConfig?.pathShape === 'Snake' && boardTiles.length > 0 && activeTab === 'Board' && (
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0, overflow: 'visible' }}>
                {boardConfig?.connectEnd ? (
                  <polygon 
                    points={boardTiles.map(t => `${t.x},${t.y}`).join(' ')}
                    fill="none"
                    stroke="#5C5C66"
                    strokeWidth={4}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeDasharray="8 8"
                  />
                ) : (
                  <polyline 
                    points={boardTiles.map(t => `${t.x},${t.y}`).join(' ')}
                    fill="none"
                    stroke="#5C5C66"
                    strokeWidth={4}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeDasharray="8 8"
                  />
                )}
              </svg>
            )}

            {/* Draw Free Paths Connections */}
            {boardConfig?.pathShape === 'Free Paths' && activeTab === 'Board' && (
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0, overflow: 'visible' }}>
                {(boardConfig.freeConnections || []).map((conn) => {
                  const tFrom = boardTiles.find(t => t.id === conn.from);
                  const tTo = boardTiles.find(t => t.id === conn.to);
                  if (!tFrom || !tTo) return null;
                  
                  const dx = tTo.x - tFrom.x;
                  const dy = tTo.y - tFrom.y;
                  const dist = Math.sqrt(dx * dx + dy * dy);
                  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
                  
                  const chevrons = [];
                  const step = 20; 
                  const numChevrons = Math.floor(dist / step);
                  
                  const dirMode = conn.dir || 'forward';
                  
                  for (let j = 1; j <= numChevrons; j++) {
                    const cx = tFrom.x + (dx / dist) * (j * step);
                    const cy = tFrom.y + (dy / dist) * (j * step);
                    
                    let pointAngle = angle;
                    if (dirMode === 'backward') {
                      pointAngle = angle + 180;
                    } else if (dirMode === 'both') {
                      if (j <= numChevrons / 2) {
                        pointAngle = angle + 180;
                      }
                    }
                    
                    chevrons.push(
                      <polyline 
                        key={j}
                        points="-4,-4 0,0 -4,4"
                        fill="none"
                        stroke="#5C5C66"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        transform={`translate(${cx}, ${cy}) rotate(${pointAngle})`}
                      />
                    );
                  }

                  const isSelected = selectedConnectionId === conn.id;

                  return (
                    <g 
                      key={conn.id} 
                      className="cursor-pointer pointer-events-auto" 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setSelectedConnectionId(conn.id); 
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        if (!onUpdateBoardConfig) return;
                        
                        let newDir: 'forward' | 'backward' | 'both' = 'backward';
                        if (dirMode === 'forward') newDir = 'backward';
                        else if (dirMode === 'backward') newDir = 'both';
                        else newDir = 'forward';
                        
                        onUpdateBoardConfig({
                          ...boardConfig,
                          freeConnections: (boardConfig.freeConnections || []).map(c => 
                            c.id === conn.id ? { ...c, dir: newDir } : c
                          )
                        });
                      }}
                    >
                      <line x1={tFrom.x} y1={tFrom.y} x2={tTo.x} y2={tTo.y} stroke="transparent" strokeWidth="15" />
                      {isSelected && <line x1={tFrom.x} y1={tFrom.y} x2={tTo.x} y2={tTo.y} stroke="#8B5CF6" strokeWidth="2" strokeDasharray="4 4" />}
                      {chevrons}
                    </g>
                  );
                })}
                
                {connectingFromId !== null && tempConnMouse && (() => {
                  const tFrom = boardTiles.find(t => t.id === connectingFromId);
                  if (!tFrom) return null;
                  const dx = tempConnMouse.x - tFrom.x;
                  const dy = tempConnMouse.y - tFrom.y;
                  const dist = Math.sqrt(dx * dx + dy * dy);
                  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
                  
                  const chevrons = [];
                  const step = 20; 
                  const numChevrons = Math.floor(dist / step);
                  for (let j = 1; j <= numChevrons; j++) {
                    const cx = tFrom.x + (dx / dist) * (j * step);
                    const cy = tFrom.y + (dy / dist) * (j * step);
                    chevrons.push(
                      <polyline 
                        key={j}
                        points="-4,-4 0,0 -4,4"
                        fill="none"
                        stroke="#5C5C66"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        transform={`translate(${cx}, ${cy}) rotate(${angle})`}
                      />
                    );
                  }

                  return (
                    <g>
                      <line x1={tFrom.x} y1={tFrom.y} x2={tempConnMouse.x} y2={tempConnMouse.y} stroke="#5C5C66" strokeWidth="1" strokeDasharray="4 4" />
                      {chevrons}
                    </g>
                  );
                })()}
              </svg>
            )}
            
            {boardTiles.map(tile => {
              const tileData = boardTilesData[tile.id];
              const isSelected = selectedTileIds.includes(tile.id);
              
              const resolveBinding = (td: BoardTileData | undefined, bindingId?: string, fallbackValue?: any) => {
                if (!bindingId || !td) return fallbackValue;
                
                let foundProp: any = null;
                for (const v of boardVariables) {
                  const p = v.properties?.find(x => x.id === bindingId);
                  if (p) {
                    foundProp = p;
                    break;
                  }
                }

                let propValue = td.propertyValues?.[bindingId];
                if (propValue === undefined || propValue === '') {
                  propValue = foundProp?.defaultValue;
                }

                if (propValue === undefined || propValue === '') {
                  return fallbackValue;
                }

                if (foundProp?.type === 'Number' && foundProp.prefix) {
                  return `${foundProp.prefix}${propValue}`;
                }

                return propValue;
              };

              const tW = boardConfig?.tileWidth || 60;
              const tH = boardConfig?.tileHeight || 60;
              const isCorner = tile.isCorner;

              let finalW = tW;
              let finalH = tH;
              if (boardConfig?.pathShape === 'Hexagon' || boardConfig?.pathShape === 'Pentagon' || boardConfig?.pathShape === 'Circle' || (boardConfig?.pathShape === 'Spiral' && boardConfig?.spiralRounded)) {
                const maxDim = Math.max(tW, tH);
                finalW = maxDim;
                finalH = maxDim;
              }

              const maxR = tile.maxRounded !== undefined ? tile.maxRounded : 999;
              const clampR = (val: number | undefined, def: number) => {
                let v = val !== undefined ? val : def;
                if (v < 0) v = 0;
                if (v > maxR) v = maxR;
                return v;
              };
              let roundedVal = clampR(tileData?.rounded, 6);
              const rTL = clampR(tileData?.roundedTL, roundedVal);
              const rTR = clampR(tileData?.roundedTR, roundedVal);
              const rBL = clampR(tileData?.roundedBL, roundedVal);
              const rBR = clampR(tileData?.roundedBR, roundedVal);
              const borderRadiusStr = `${rTL}px ${rTR}px ${rBR}px ${rBL}px`;
              
              const tileName = tileData?.name || tile.id;
              
              const variableIds = tileData?.variableIds || (tileData as any)?.propertyIds || [];
              const colors = variableIds.map(pid => boardVariables.find(p => p.id === pid)?.color).filter(Boolean) as string[];

              const resolvedFillColor = resolveBinding(tileData, tileData?.bindings?.fillColor, tileData?.fillColor);

              let bgStyle: React.CSSProperties = { backgroundColor: '#1A1A1D' };
              if (resolvedFillColor) {
                bgStyle = { backgroundColor: resolvedFillColor };
              } else if (colors.length === 1) {
                bgStyle = { backgroundColor: colors[0] };
              } else if (colors.length > 1) {
                const stripeSize = 100 / colors.length;
                const stops = colors.map((c, i) => `${c} ${i * stripeSize}%, ${c} ${(i + 1) * stripeSize}%`).join(', ');
                bgStyle = { backgroundImage: `repeating-linear-gradient(45deg, ${stops})` };
              }
              
              const strokeWidth = tileData?.strokeWidth || 0;
              const strokeColorHex = resolveBinding(tileData, tileData?.bindings?.strokeColor, tileData?.strokeColor || '#000000');
              const strokeOp = tileData?.strokeOpacity ?? 100;
              const strokeRgba = hexToRgba(strokeColorHex, strokeOp);
              const tileBoxShadow = strokeWidth > 0 ? `inset 0 0 0 ${strokeWidth}px ${strokeRgba}` : undefined;

              const opacityClass = (boardSubTab === 'Design' && selectedTileIds.length > 0 && selectedTileIds[0] !== tile.id) ? 'opacity-30' : 'opacity-100';

              const renderLayers = (clipPath?: string, isDimmedBackground?: boolean, onlyHandles: boolean = false) => {
                if (boardSubTab !== 'Design' && activeTab !== 'Components') return null;
                if (boardSubTab === 'Design' && selectedTileIds.length > 0 && selectedTileIds[0] !== tile.id) return null;
                if (boardSubTab === 'Design' && selectedTileIds.length === 0 && isDimmedBackground) return null;

                if (onlyHandles) {
                  return (
                    <div className="absolute inset-0 pointer-events-none" style={{ width: clipPath ? finalW : '100%', height: clipPath ? finalH : '100%', left: clipPath ? -finalW/2 : 0, top: clipPath ? -finalH/2 : 0 }}>
                      {(tileData?.layers || []).map(layer => {
                        const isLayerSelected = selectedLayerIds.includes(layer.id);
                        if (!isLayerSelected || activeDesignTool !== 'Cursor') return null;
                        
                        return (
                          <div key={`${layer.id}-handles`} className="absolute pointer-events-none" style={{ left: layer.x, top: layer.y, width: layer.type === 'text' && layer.sizingW === 'fill' ? '100%' : layer.type === 'text' && layer.sizingW === 'hug' ? 'max-content' : layer.width, height: layer.type === 'text' && layer.sizingH === 'fill' ? '100%' : layer.type === 'text' && layer.sizingH === 'hug' ? 'max-content' : layer.height, transform: `rotate(${layer.rotation}deg)` }}>
                            {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map(dir => {
                              const hSize = Math.max(4, Math.min(10, 8 / transform.scale));
                              return (
                                <div key={dir} className="absolute bg-white border border-meevo-purple pointer-events-auto"
                                  style={{
                                    width: hSize, height: hSize, top: dir.includes('n') ? 0 : dir.includes('s') ? '100%' : '50%', left: dir.includes('w') ? 0 : dir.includes('e') ? '100%' : '50%',
                                    transform: 'translate(-50%, -50%)', cursor: `${dir}-resize`,
                                  }}
                                  onPointerDown={(e) => {
                                    if (e.button !== 0) return;
                                    e.stopPropagation();
                                    const startX = e.clientX, startY = e.clientY;
                                    const startLayerX = layer.x, startLayerY = layer.y;
                                    const startW = layer.width, startH = layer.height;
                                    const handleResize = (ev: PointerEvent) => {
                                      const rad = -((boardSubTab === 'Design' && isSelected ? 0 : tile.rotation) + layer.rotation) * Math.PI / 180;
                                      const dx = (ev.clientX - startX) / transform.scale;
                                      const dy = (ev.clientY - startY) / transform.scale;
                                      const rDx = dx * Math.cos(rad) - dy * Math.sin(rad);
                                      const rDy = dx * Math.sin(rad) + dy * Math.cos(rad);
                                      
                                      let newX = startLayerX, newY = startLayerY, newW = startW, newH = startH;
                                      
                                      if (dir.includes('e')) newW = Math.max(1, startW + rDx);
                                      if (dir.includes('s')) newH = Math.max(1, startH + rDy);
                                      if (dir.includes('w')) { newW = Math.max(1, startW - rDx); newX = startLayerX + (startW - newW); }
                                      if (dir.includes('n')) { newH = Math.max(1, startH - rDy); newY = startLayerY + (startH - newH); }

                                      if (ev.shiftKey) {
                                        const useScaleX = Math.abs((newW / startW) - 1) > Math.abs((newH / startH) - 1);
                                        if (useScaleX) { newH = newW * (startH / startW); if (dir.includes('n')) newY = startLayerY + (startH - newH); } 
                                        else { newW = newH * (startW / startH); if (dir.includes('w')) newX = startLayerX + (startW - newW); }
                                      }

                                      const newLayers = [...(tileData?.layers || [])];
                                      const lIndex = newLayers.findIndex(l => l.id === layer.id);
                                      if (lIndex >= 0) {
                                        let updatedLayer = { ...newLayers[lIndex], x: Math.round(newX), y: Math.round(newY), width: Math.round(newW), height: Math.round(newH) };
                                        if (layer.type === 'image' && layer.imageMode === 'crop') {
                                          const scaleFactor = Math.max(newW / startW, newH / startH);
                                          updatedLayer.imageScale = Math.max(0.1, (layer.imageScale || 1) * scaleFactor);
                                        }
                                        newLayers[lIndex] = updatedLayer;
                                        onUpdateTile?.(tile.id, { layers: newLayers });
                                      }
                                    };
                                    const handleResizeUp = () => { window.removeEventListener('pointermove', handleResize); window.removeEventListener('pointerup', handleResizeUp); };
                                    window.addEventListener('pointermove', handleResize); window.addEventListener('pointerup', handleResizeUp);
                                  }}
                                />
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                return (
                  <div 
                    className={`absolute inset-0 ${selectedTileIds.length > 0 && (activeDesignTool === 'Shape' || activeDesignTool === 'Text' || activeDesignTool === 'Image') ? 'pointer-events-auto' : 'pointer-events-none'}`}
                    style={{ 
                      width: clipPath ? finalW : '100%', 
                      height: clipPath ? finalH : '100%', 
                      left: clipPath ? -finalW/2 : 0, 
                      top: clipPath ? -finalH/2 : 0,
                      clipPath: clipPath,
                      overflow: 'visible',
                    }}
                    onPointerDown={(e) => {
                      if (selectedTileIds.length > 0 && (activeDesignTool === 'Shape' || activeDesignTool === 'Text' || activeDesignTool === 'Image')) {
                        e.stopPropagation();
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        const x = (e.clientX - rect.left) / transform.scale;
                        const y = (e.clientY - rect.top) / transform.scale;

                        if (activeDesignTool === 'Image') {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (ev) => {
                            const file = (ev.target as HTMLInputElement).files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const newLayer: any = {
                                  id: Date.now().toString(),
                                  name: 'Image',
                                  type: 'image',
                                  x: Math.round(x), y: Math.round(y),
                                  width: 150, height: 150,
                                  rotation: 0, opacity: 100,
                                  src: event.target?.result as string,
                                  imageMode: 'fill',
                                };
                                const layers = tileData?.layers || [];
                                onUpdateTile?.(tile.id, { layers: [...layers, newLayer] });
                                setSelectedLayerIds?.([newLayer.id]);
                                setActiveDesignTool?.('Cursor');
                              };
                              reader.readAsDataURL(file);
                            } else {
                              setActiveDesignTool?.('Cursor');
                            }
                          };
                          input.click();
                          return;
                        }

                        const newLayer: any = {
                          id: Date.now().toString(),
                          name: activeDesignTool === 'Shape' ? 'Rectangle' : 'Text Layer',
                          type: activeDesignTool === 'Shape' ? 'rect' : 'text',
                          x: Math.round(x), y: Math.round(y),
                          width: activeDesignTool === 'Shape' ? 50 : 100, height: activeDesignTool === 'Shape' ? 50 : 20,
                          rotation: 0, opacity: 100,
                          fillColor: activeDesignTool === 'Shape' ? '#AAAAAA' : '#FFFFFF',
                          text: activeDesignTool === 'Text' ? 'New Text' : undefined,
                          sizingW: activeDesignTool === 'Text' ? 'hug' : undefined,
                          sizingH: activeDesignTool === 'Text' ? 'hug' : undefined
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
                      
                      let baseText = layer.text || '';
                      if (layer.bindings?.text) {
                        baseText = resolveBinding(tileData, layer.bindings.text, baseText);
                      }
                      
                      const layerText = baseText.replace(/\{([^}]+)\}/g, (match: string, propName: string) => {
                        let propId: string | null = null;
                        for (const v of boardVariables) {
                          const p = v.properties?.find(x => x.name === propName);
                          if (p) {
                            propId = p.id;
                            break;
                          }
                        }
                        if (propId) {
                          const resolved = resolveBinding(tileData, propId, '');
                          if (resolved !== undefined && resolved !== '') return resolved.toString();
                        }
                        return match;
                      });
                      const layerFillColor = resolveBinding(tileData, layer.bindings?.fillColor, layer.fillColor || (layer.type === 'rect' ? '#AAAAAA' : '#FFFFFF'));
                      const layerStrokeColor = resolveBinding(tileData, layer.bindings?.strokeColor, layer.strokeColor || '#000000');

                      let computedSize = layer.typography?.size || 14;
                      if (layer.type === 'text' && layer.typography?.autoSize) {
                        if (layer.sizingW === 'hug' || layer.sizingH === 'hug') {
                          computedSize = 12;
                        } else {
                          const lines = layerText.split('\n');
                          const maxLineLength = Math.max(...lines.map((l: string) => l.length), 1);
                          const wFit = (layer.width * 1.5) / maxLineLength;
                          const hFit = layer.height / (lines.length * 1.2);
                          computedSize = Math.max(8, Math.min(Math.min(wFit, hFit), layer.height * 0.8));
                        }
                      }
                      
                      return (
                        <div
                          key={layer.id}
                          id={`layer-${layer.id}`}
                          className={`absolute outline-none ${isLayerSelected ? 'ring-1 ring-meevo-purple cursor-move' : ''}`}
                          style={{
                            left: layer.x, 
                            top: layer.y, 
                            width: layer.type === 'text' && layer.sizingW === 'fill' ? '100%' : layer.type === 'text' && layer.sizingW === 'hug' ? 'max-content' : layer.width, 
                            height: layer.type === 'text' && layer.sizingH === 'fill' ? '100%' : layer.type === 'text' && layer.sizingH === 'hug' ? 'max-content' : layer.height,
                            transform: `rotate(${layer.rotation}deg)`,
                            opacity: (layer.opacity || 100) / 100,
                            backgroundColor: layer.type === 'rect' ? hexToRgba(layerFillColor, layer.fillOpacity ?? 100) : undefined,
                            color: layer.type === 'text' ? hexToRgba(layerFillColor, layer.fillOpacity ?? 100) : undefined,
                            boxShadow: layer.type === 'rect' && layer.strokeWidth && layer.strokeWidth > 0 ? `inset 0 0 0 ${layer.strokeWidth}px ${hexToRgba(layerStrokeColor, layer.strokeOpacity ?? 100)}` : undefined,
                            WebkitTextStroke: layer.type === 'text' && layer.strokeWidth && layer.strokeWidth > 0 ? `${layer.strokeWidth}px ${hexToRgba(layerStrokeColor, layer.strokeOpacity ?? 100)}` : undefined,
                            pointerEvents: (selectedTileIds.length === 0) ? 'none' : ((activeDesignTool === 'Shape' || activeDesignTool === 'Text' || activeDesignTool === 'Image') ? 'none' : 'auto'),
                            whiteSpace: layer.type === 'text' && layer.sizingW === 'hug' ? 'pre' : 'pre-wrap',
                            fontFamily: layer.type === 'text' ? (layer.typography?.fontFamily || 'Inter') : undefined,
                            fontWeight: layer.type === 'text' ? (layer.typography?.weight === 'Bold' ? 700 : layer.typography?.weight === 'Medium' ? 500 : layer.typography?.weight === 'Light' ? 300 : 400) : undefined,
                            fontSize: layer.type === 'text' ? `${computedSize}px` : undefined,
                            lineHeight: layer.type === 'text' ? 1 : undefined,
                            justifyContent: layer.type === 'text' ? (layer.typography?.alignH === 'left' ? 'flex-start' : layer.typography?.alignH === 'right' ? 'flex-end' : 'center') : undefined,
                            alignItems: layer.type === 'text' ? (layer.typography?.alignV === 'top' ? 'flex-start' : layer.typography?.alignV === 'bottom' ? 'flex-end' : 'center') : undefined,
                            textAlign: layer.type === 'text' ? (layer.typography?.alignH || 'center') : undefined,
                            overflow: 'visible',
                          }}
                          onPointerDown={(e) => {
                            if (e.button !== 0) return;
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
                                const rad = -(boardSubTab === 'Design' && isSelected ? 0 : tile.rotation) * Math.PI / 180;
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
                            backgroundImage: layer.type === 'image' && layer.imageMode === 'tile' ? `url(${layer.src})` : undefined,
                            backgroundRepeat: layer.type === 'image' && layer.imageMode === 'tile' ? 'repeat' : undefined,
                            backgroundSize: layer.type === 'image' && layer.imageMode === 'tile' ? `${layer.imageTileSize || 50}px` : undefined,
                          }}>
                            {layer.type === 'text' && (
                              <div style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 8,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}>
                                {layerText}
                              </div>
                            )}
                            {layer.type === 'image' && layer.imageMode !== 'tile' && layer.src && (
                              <img 
                                src={layer.src} 
                                alt="" 
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: layer.imageMode === 'fit' ? 'contain' : 'cover', // crop uses cover + scale to avoid gaps
                                  pointerEvents: 'none',
                                  transform: layer.imageMode === 'crop' && layer.imageScale !== undefined ? `scale(${layer.imageScale})` : undefined,
                                }} 
                              />
                            )}
                            {layer.type === 'image' && layer.strokeWidth && layer.strokeWidth > 0 && (
                              <div className="absolute inset-0 pointer-events-none" style={{
                                boxShadow: `inset 0 0 0 ${layer.strokeWidth}px ${hexToRgba(layer.strokeColor || '#000000', layer.strokeOpacity ?? 100)}`
                              }} />
                            )}
                          </div>
                          
                          {isLayerSelected && activeDesignTool === 'Cursor' && (
                            <>
                              {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map(dir => {
                                const hSize = Math.max(4, Math.min(10, 8 / transform.scale));
                                return (
                                <div
                                  key={dir}
                                  className="absolute bg-white border border-meevo-purple pointer-events-auto"
                                  style={{
                                    width: hSize,
                                    height: hSize,
                                    top: dir.includes('n') ? 0 : dir.includes('s') ? '100%' : '50%',
                                    left: dir.includes('w') ? 0 : dir.includes('e') ? '100%' : '50%',
                                    transform: 'translate(-50%, -50%)',
                                    cursor: `${dir}-resize`,
                                  }}
                                  onPointerDown={(e) => {
                                    e.stopPropagation();
                                    const startX = e.clientX, startY = e.clientY;
                                    const startLayerX = layer.x, startLayerY = layer.y;
                                    const startW = layer.width, startH = layer.height;
                                    const handleResize = (ev: PointerEvent) => {
                                      const rad = -((boardSubTab === 'Design' && isSelected ? 0 : tile.rotation) + layer.rotation) * Math.PI / 180;
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

                                      const isCropCorner = layer.type === 'image' && layer.imageMode === 'crop' && dir.length === 2;
                                      const shouldKeepProportions = ev.shiftKey;

                                      if (shouldKeepProportions && startH > 0 && startW > 0) {
                                        let useScaleX = true;
                                        if (dir.length === 1) {
                                          useScaleX = dir === 'e' || dir === 'w';
                                        } else {
                                          useScaleX = Math.abs((newW / startW) - 1) > Math.abs((newH / startH) - 1);
                                        }

                                        if (useScaleX) {
                                          newH = newW * (startH / startW);
                                          if (dir.includes('n')) newY = startLayerY + (startH - newH);
                                        } else {
                                          newW = newH * (startW / startH);
                                          if (dir.includes('w')) newX = startLayerX + (startW - newW);
                                        }
                                      }

                                      const newLayers = [...(tileData?.layers || [])];
                                      const lIndex = newLayers.findIndex(l => l.id === layer.id);
                                      if (lIndex >= 0) {
                                        let updatedLayer = { ...newLayers[lIndex], x: Math.round(newX), y: Math.round(newY), width: Math.round(newW), height: Math.round(newH) };
                                        if (updatedLayer.type === 'text') {
                                          if (updatedLayer.sizingW === 'hug') updatedLayer.sizingW = 'fixed';
                                          if (updatedLayer.sizingH === 'hug') updatedLayer.sizingH = 'fixed';
                                        }
                                        if (isCropCorner) {
                                          const scaleFactor = Math.max(newW / startW, newH / startH);
                                          updatedLayer.imageScale = Math.max(0.1, (layer.imageScale || 1) * scaleFactor);
                                        }
                                        newLayers[lIndex] = updatedLayer;
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
                              )})}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              };

              if (isCorner && tile.cornerPolygon) {
                let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
                tile.cornerPolygon.forEach(p => {
                  if (p.x < minX) minX = p.x;
                  if (p.x > maxX) maxX = p.x;
                  if (p.y < minY) minY = p.y;
                  if (p.y > maxY) maxY = p.y;
                });
                
                const strokeBuffer = roundedVal * 2 + 10;
                const pW = maxX - minX + strokeBuffer;
                const pH = maxY - minY + strokeBuffer;
                const shiftX = -minX + strokeBuffer/2;
                const shiftY = -minY + strokeBuffer/2;
                const cx = (minX + maxX) / 2;
                const cy = (minY + maxY) / 2;
                
                const pointsStr = tile.cornerPolygon.map(p => `${p.x + shiftX},${p.y + shiftY}`).join(' ');
                
                const baseFill = tileData?.fillColor || (colors.length === 1 ? colors[0] : colors.length > 1 ? `url(#grad-${tile.id})` : "#2B3830");
                const hasBorder = tileData?.strokeWidth && tileData.strokeWidth > 0;
                const outerStrokeColor = hasBorder ? (tileData?.strokeColor || "#000") : baseFill;
                const innerStrokeWidth = Math.max(0, (roundedVal * 2) - (hasBorder ? tileData!.strokeWidth * 2 : 0));
                
                return (
                  <div
                    key={tile.id}
                    className={`absolute flex items-center justify-center text-xs font-bold transition-all cursor-pointer pointer-events-auto ${opacityClass}`}
                    style={{
                      left: tile.x + cx,
                      top: tile.y + cy,
                      width: pW,
                      height: pH,
                      transform: `translate(-50%, -50%) rotate(${boardSubTab === 'Design' && isSelected ? 0 : tile.rotation}deg)`,
                    }}
                    onPointerDown={(e) => {
                      if (e.button !== 0) return;
                      if (activeTab === 'Components') {
                        handleGroupDragStart(e);
                        return;
                      }
                      e.stopPropagation();
                      if (boardSubTab === 'Design') {
                        if (selectedTileIds[0] !== tile.id) {
                          setSelectedTileIds?.([tile.id]);
                          setSelectedLayerIds?.([]);
                        }
                      } else if (setSelectedTileIds) {
                        setSelectedTileIds(e.shiftKey ? [...selectedTileIds, tile.id] : [tile.id]);
                      }

                      if ((boardConfig?.pathShape === 'Snake' || boardConfig?.pathShape === 'Free Paths') && activeTab === 'Board' && boardSubTab === 'Type Board') {
                        const isSelected = selectedTileIds.includes(tile.id);
                        let activeSelection = selectedTileIds;
                        if (!isSelected) {
                          activeSelection = e.shiftKey ? [...selectedTileIds, tile.id] : [tile.id];
                          setSelectedTileIds?.(activeSelection);
                        }
                        
                        let dragIds = activeSelection;
                        let startPositions = dragIds.map(id => ({
                          id,
                          x: boardTilesData[id]?.x ?? (boardTiles.find(t => t.id === id)?.x || 0),
                          y: boardTilesData[id]?.y ?? (boardTiles.find(t => t.id === id)?.y || 0)
                        }));

                        if (e.altKey && onDuplicateTiles) {
                          const duplicates = dragIds.map((id, index) => ({
                            originalId: id,
                            newId: (boardConfig?.tileCount || 0) + index,
                            data: {
                              x: boardTilesData[id]?.x ?? (boardTiles.find(t => t.id === id)?.x || 0),
                              y: boardTilesData[id]?.y ?? (boardTiles.find(t => t.id === id)?.y || 0)
                            }
                          }));
                          onDuplicateTiles(duplicates);
                          dragIds = duplicates.map(d => d.newId);
                          startPositions = dragIds.map((newId, idx) => ({
                            id: newId,
                            x: duplicates[idx].data.x,
                            y: duplicates[idx].data.y
                          }));
                        }
                        
                        const startX = e.clientX;
                        const startY = e.clientY;
                        
                        const handleMove = (ev: PointerEvent) => {
                          const dx = (ev.clientX - startX) / transform.scale;
                          const dy = (ev.clientY - startY) / transform.scale;
                          
                          if (onUpdateTiles) {
                            onUpdateTiles(startPositions.map(pos => ({
                              id: pos.id,
                              data: { x: pos.x + dx, y: pos.y + dy }
                            })));
                          } else if (onUpdateTile) {
                            startPositions.forEach(pos => {
                               onUpdateTile(pos.id, { x: pos.x + dx, y: pos.y + dy });
                            });
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
                    <div 
                      className={`absolute inset-0 ${boardSubTab === 'Design' && isSelected ? 'pointer-events-auto' : 'pointer-events-none'}`}
                      style={{ opacity: (tileData?.clipOutsideOpacity ?? 0) / 100 }}
                    >
                      {renderLayers(undefined, true)}
                    </div>

                    <svg style={{ overflow: 'visible', position: 'absolute', inset: 0, zIndex: -1, pointerEvents: 'none' }}>
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
                        <polygon points={pointsStr} fill="none" stroke="#F0B100" strokeWidth={roundedVal * 2 + 4} strokeLinejoin="round" pointerEvents="none" />
                      )}
                      <polygon points={pointsStr} fill={baseFill} stroke={outerStrokeColor} strokeWidth={roundedVal * 2} strokeOpacity={(tileData?.strokeOpacity ?? 100) / 100} strokeLinejoin="round" pointerEvents="all" />
                      {/* Inner fill stroke that gives the border inset illusion */}
                      {hasBorder && (
                        <polygon points={pointsStr} fill={baseFill} stroke={baseFill} strokeWidth={innerStrokeWidth} strokeLinejoin="round" pointerEvents="none" />
                      )}
                    </svg>
                    
                    <div 
                      className="absolute inset-0 pointer-events-none"
                      style={{ 
                        maskImage: `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${pW}" height="${pH}" viewBox="0 0 ${pW} ${pH}"><polygon points="${pointsStr}" fill="white" stroke="white" stroke-width="${roundedVal * 2}" stroke-linejoin="round" /></svg>`)}")`, 
                        WebkitMaskImage: `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${pW}" height="${pH}" viewBox="0 0 ${pW} ${pH}"><polygon points="${pointsStr}" fill="white" stroke="white" stroke-width="${roundedVal * 2}" stroke-linejoin="round" /></svg>`)}")`,
                        maskRepeat: 'no-repeat',
                        WebkitMaskRepeat: 'no-repeat',
                        maskSize: '100% 100%',
                        WebkitMaskSize: '100% 100%',
                        maskPosition: 'center',
                        WebkitMaskPosition: 'center'
                      }}
                    >
                      {renderLayers(undefined, false)}
                    </div>
                    
                    {boardConfig?.pathShape === 'Free Paths' && boardSubTab === 'Type Board' && activeTab === 'Board' && (
                      <div 
                        className="absolute w-3 h-3 bg-[#8B5CF6] rounded-full z-20 hover:scale-125 transition-transform pointer-events-auto"
                        style={{
                          left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
                          cursor: 'crosshair',
                        }}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          setConnectingFromId(tile.id);
                          setTempConnMouse({ x: tile.x, y: tile.y });
                          
                          const handleMove = (ev: PointerEvent) => {
                            if (!containerRef.current) return;
                            const rect = containerRef.current.getBoundingClientRect();
                            const bX = boardConfig?.boardX || 0;
                            const bY = boardConfig?.boardY || 0;
                            const worldX = ((ev.clientX - rect.left - transform.x) / transform.scale) - bX;
                            const worldY = ((ev.clientY - rect.top - transform.y) / transform.scale) - bY;
                            setTempConnMouse({ x: worldX, y: worldY });
                          };
                          
                          const handleUp = (ev: PointerEvent) => {
                            window.removeEventListener('pointermove', handleMove);
                            window.removeEventListener('pointerup', handleUp);
                            setTempConnMouse(null);
                            setConnectingFromId(null);
                            
                            if (!containerRef.current) return;
                            const rect = containerRef.current.getBoundingClientRect();
                            const bX = boardConfig?.boardX || 0;
                            const bY = boardConfig?.boardY || 0;
                            const worldX = ((ev.clientX - rect.left - transform.x) / transform.scale) - bX;
                            const worldY = ((ev.clientY - rect.top - transform.y) / transform.scale) - bY;
                            
                            const tW = boardConfig?.tileWidth || 60;
                            const tH = boardConfig?.tileHeight || 60;
                            const t = boardTiles.find(t => Math.abs(t.x - worldX) <= tW/2 && Math.abs(t.y - worldY) <= tH/2);
                            
                            if (t && t.id !== tile.id && onUpdateBoardConfig) {
                               const newConn = { id: Date.now().toString(), from: tile.id, to: t.id };
                               onUpdateBoardConfig({
                                 ...boardConfig,
                                 freeConnections: [...(boardConfig.freeConnections || []), newConn]
                               });
                            }
                          };
                          
                          window.addEventListener('pointermove', handleMove);
                          window.addEventListener('pointerup', handleUp);
                        }}
                      />
                    )}
                  </div>
                );
              }

              return (
                <div
                  key={tile.id}
                  className={`absolute border shadow flex items-center justify-center text-xs font-bold transition-all cursor-pointer pointer-events-auto ${opacityClass} ${
                    isSelected ? 'border-[#F0B100] text-meevo-text-primary z-10' : 'border-meevo-border text-meevo-text-tertiary'
                  }`}
                  style={{
                    left: tile.x,
                    top: tile.y,
                    width: finalW,
                    height: finalH,
                    transform: `translate(-50%, -50%) rotate(${boardSubTab === 'Design' && isSelected ? 0 : tile.rotation}deg)`,
                    borderRadius: borderRadiusStr,
                  }}
                  onPointerDown={(e) => {
                    if (activeTab === 'Components') {
                      handleGroupDragStart(e);
                      return;
                    }
                    e.stopPropagation();
                    if (boardSubTab === 'Design') {
                      if (selectedTileIds[0] !== tile.id) {
                        setSelectedTileIds?.([tile.id]);
                        setSelectedLayerIds?.([]);
                      }
                    } else if (setSelectedTileIds) {
                      setSelectedTileIds(e.shiftKey ? [...selectedTileIds, tile.id] : [tile.id]);
                    }

                    if ((boardConfig?.pathShape === 'Snake' || boardConfig?.pathShape === 'Free Paths') && activeTab === 'Board' && boardSubTab === 'Type Board') {
                      const isSelected = selectedTileIds.includes(tile.id);
                      let activeSelection = selectedTileIds;
                      if (!isSelected) {
                        activeSelection = e.shiftKey ? [...selectedTileIds, tile.id] : [tile.id];
                        setSelectedTileIds?.(activeSelection);
                      }
                      let dragIds = activeSelection;
                      let startPositions = dragIds.map(id => ({
                        id,
                        x: boardTilesData[id]?.x ?? (boardTiles.find(t => t.id === id)?.x || 0),
                        y: boardTilesData[id]?.y ?? (boardTiles.find(t => t.id === id)?.y || 0)
                      }));

                      if (e.altKey && onDuplicateTiles) {
                        const duplicates = dragIds.map((id, index) => ({
                          originalId: id,
                          newId: (boardConfig?.tileCount || 0) + index,
                          data: {
                            x: boardTilesData[id]?.x ?? (boardTiles.find(t => t.id === id)?.x || 0),
                            y: boardTilesData[id]?.y ?? (boardTiles.find(t => t.id === id)?.y || 0)
                          }
                        }));
                        onDuplicateTiles(duplicates);
                        dragIds = duplicates.map(d => d.newId);
                        startPositions = dragIds.map((newId, idx) => ({
                          id: newId,
                          x: duplicates[idx].data.x,
                          y: duplicates[idx].data.y
                        }));
                        setSelectedTileIds?.(dragIds);
                      }
                      
                      const startX = e.clientX;
                      const startY = e.clientY;
                      
                      const handleMove = (ev: PointerEvent) => {
                        const dx = (ev.clientX - startX) / transform.scale;
                        const dy = (ev.clientY - startY) / transform.scale;
                        
                        if (onUpdateTiles) {
                          onUpdateTiles(startPositions.map(pos => ({
                            id: pos.id,
                            data: { x: pos.x + dx, y: pos.y + dy }
                          })));
                        } else if (onUpdateTile) {
                          startPositions.forEach(pos => {
                             onUpdateTile(pos.id, { x: pos.x + dx, y: pos.y + dy });
                          });
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
                  <div 
                    className={`absolute inset-0 ${boardSubTab === 'Design' && isSelected ? 'pointer-events-auto' : 'pointer-events-none'}`}
                    style={{ opacity: (tileData?.clipOutsideOpacity ?? 0) / 100, borderRadius: borderRadiusStr }}
                  >
                    {renderLayers(undefined, true)}
                  </div>

                  <div className="absolute inset-0 pointer-events-none" style={{ ...bgStyle, borderRadius: borderRadiusStr }} />
                  {tileBoxShadow && (
                    <div className="absolute inset-0 pointer-events-none" style={{ borderRadius: borderRadiusStr, boxShadow: tileBoxShadow }} />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">{boardSubTab !== 'Design' && tileName}</div>
                  
                  <div 
                    className="absolute inset-0 pointer-events-none" 
                    style={{ overflow: 'hidden', borderRadius: borderRadiusStr }}
                  >
                    {renderLayers(undefined, false)}
                  </div>
                  
                  {boardConfig?.pathShape === 'Free Paths' && boardSubTab === 'Type Board' && activeTab === 'Board' && (
                    <div 
                      className="absolute w-3 h-3 bg-[#8B5CF6] rounded-full z-20 hover:scale-125 transition-transform pointer-events-auto"
                      style={{
                        left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
                        cursor: 'crosshair',
                      }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        setConnectingFromId(tile.id);
                        setTempConnMouse({ x: tile.x, y: tile.y });
                        
                        const handleMove = (ev: PointerEvent) => {
                          if (!containerRef.current) return;
                          const rect = containerRef.current.getBoundingClientRect();
                          const bX = boardConfig?.boardX || 0;
                          const bY = boardConfig?.boardY || 0;
                          const worldX = ((ev.clientX - rect.left - transform.x) / transform.scale) - bX;
                          const worldY = ((ev.clientY - rect.top - transform.y) / transform.scale) - bY;
                          setTempConnMouse({ x: worldX, y: worldY });
                        };
                        
                        const handleUp = (ev: PointerEvent) => {
                          window.removeEventListener('pointermove', handleMove);
                          window.removeEventListener('pointerup', handleUp);
                          setTempConnMouse(null);
                          setConnectingFromId(null);
                          
                          if (!containerRef.current) return;
                          const rect = containerRef.current.getBoundingClientRect();
                          const bX = boardConfig?.boardX || 0;
                          const bY = boardConfig?.boardY || 0;
                          const worldX = ((ev.clientX - rect.left - transform.x) / transform.scale) - bX;
                          const worldY = ((ev.clientY - rect.top - transform.y) / transform.scale) - bY;
                          
                          const tW = boardConfig?.tileWidth || 60;
                          const tH = boardConfig?.tileHeight || 60;
                          const t = boardTiles.find(t => Math.abs(t.x - worldX) <= tW/2 && Math.abs(t.y - worldY) <= tH/2);
                          
                          if (t && t.id !== tile.id && onUpdateBoardConfig) {
                             const newConn = { id: Date.now().toString(), from: tile.id, to: t.id };
                             onUpdateBoardConfig({
                               ...boardConfig,
                               freeConnections: [...(boardConfig.freeConnections || []), newConn]
                             });
                          }
                        };
                        
                        window.addEventListener('pointermove', handleMove);
                        window.addEventListener('pointerup', handleUp);
                      }}
                    />
                  )}
                </div>
              );
            })}

            </div>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 z-10 pointer-events-none flex items-center gap-2">
          <div 
            className="bg-[#1A1A1D] border border-[#CCCCCC]/10 text-meevo-text-secondary hover:text-meevo-text-primary text-xs px-3 py-1.5 rounded-md shadow-lg font-medium pointer-events-auto cursor-pointer transition-colors h-[40px] flex items-center justify-center"
            onClick={handleReset}
          >
            {Math.round(transform.scale * 100)}%
          </div>
          {boardSubTab === 'Design' && selectedTileIds.length === 1 && (
            <div 
              className="bg-[#1A1A1D] border border-[#CCCCCC]/10 rounded-md shadow-lg flex items-center p-2 gap-3 pointer-events-auto h-[40px]"
              title="Controla la opacidad del contenido que desborda la casilla"
            >
               <span className="text-xs text-meevo-text-secondary whitespace-nowrap font-bold uppercase tracking-wider cursor-help">Outside Opacity</span>
               <input 
                 type="range" 
                 min="0" 
                 max="100" 
                 value={boardTilesData[selectedTileIds[0]]?.clipOutsideOpacity ?? 0} 
                 onChange={e => onUpdateTile?.(selectedTileIds[0], { clipOutsideOpacity: parseInt(e.target.value) })}
                 className="w-24 bg-transparent outline-none"
                 style={{ '--slider-val': `${boardTilesData[selectedTileIds[0]]?.clipOutsideOpacity ?? 0}%` } as React.CSSProperties}
               />
            </div>
          )}
        </div>

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
              onClick={onUndo}
              className="p-2 text-meevo-text-secondary hover:text-meevo-text-primary hover:bg-[#212124] rounded-sm transition-colors"
              title="Undo (Ctrl+Z)"
            >
              <ArrowUndo20Regular />
            </button>
          </div>
        </div>

        {(boardSubTab === 'Design' || boardSubTab === 'Table') && activeDesignTool && setActiveDesignTool && (
          <DesignToolbar 
            activeTool={activeDesignTool} 
            onChangeTool={setActiveDesignTool} 
            allowedTools={boardSubTab === 'Table' ? ['Cursor', 'Image'] : undefined}
          />
        )}

        {renameModal.open && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50" onPointerDown={e => e.stopPropagation()}>
            <div className="bg-[#1A1A1D] border border-[#333] p-4 rounded-lg shadow-xl w-80">
              <h3 className="text-sm font-bold text-meevo-text-primary mb-4">Rename Layer</h3>
              <input 
                autoFocus
                type="text" 
                defaultValue={renameModal.defaultName}
                className="w-full bg-[#0C0C0E] border border-[#333] text-sm text-meevo-text-primary px-3 py-2 rounded-md outline-none focus:border-meevo-purple mb-4"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const newName = e.currentTarget.value;
                    const layers = boardTilesData[renameModal.tileId]?.layers || [];
                    onUpdateTile?.(renameModal.tileId, { layers: layers.map(l => renameModal.layerIds.includes(l.id) ? { ...l, name: newName } : l) });
                    setRenameModal(prev => ({ ...prev, open: false }));
                  } else if (e.key === 'Escape') {
                    setRenameModal(prev => ({ ...prev, open: false }));
                  }
                }}
              />
              <div className="flex justify-end gap-2">
                <button 
                  className="px-3 py-1.5 text-xs text-meevo-text-secondary hover:text-white"
                  onClick={() => setRenameModal(prev => ({ ...prev, open: false }))}
                >Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {activeTab === 'Board' && (
        <div className="h-10 border-t border-[#CCCCCC]/10 bg-[#070709] px-6 flex items-end shrink-0 gap-1 text-xs font-medium pt-2">
          <div 
            className={`cursor-pointer px-4 py-2 rounded-t-lg transition-colors border border-b-0 ${boardSubTab === 'Table' ? 'bg-[#1A1A1D] text-meevo-text-primary border-[#CCCCCC]/10 shadow-sm' : 'bg-transparent text-meevo-text-secondary hover:text-meevo-text-primary border-transparent hover:bg-[#1A1A1D]/50'}`}
            onClick={() => setBoardSubTab?.('Table')}
          >
            Table
          </div>
          <div 
            className={`cursor-pointer px-4 py-2 rounded-t-lg transition-colors border border-b-0 ${boardSubTab === 'Type Board' ? 'bg-[#1A1A1D] text-meevo-text-primary border-[#CCCCCC]/10 shadow-sm' : 'bg-transparent text-meevo-text-secondary hover:text-meevo-text-primary border-transparent hover:bg-[#1A1A1D]/50'}`}
            onClick={() => setBoardSubTab?.('Type Board')}
          >
            Type Board
          </div>
          <div 
            className={`cursor-pointer px-4 py-2 rounded-t-lg transition-colors border border-b-0 ${boardSubTab === 'Tiles' ? 'bg-[#1A1A1D] text-meevo-text-primary border-[#CCCCCC]/10 shadow-sm' : 'bg-transparent text-meevo-text-secondary hover:text-meevo-text-primary border-transparent hover:bg-[#1A1A1D]/50'}`}
            onClick={() => setBoardSubTab?.('Tiles')}
          >
            Tiles
          </div>
          <div 
            className={`cursor-pointer px-4 py-2 rounded-t-lg transition-colors border border-b-0 ${boardSubTab === 'Design' ? 'bg-[#1A1A1D] text-meevo-text-primary border-[#CCCCCC]/10 shadow-sm' : 'bg-transparent text-meevo-text-secondary hover:text-meevo-text-primary border-transparent hover:bg-[#1A1A1D]/50'}`}
            onClick={() => setBoardSubTab?.('Design')}
          >
            Design
          </div>
        </div>
      )}
    </div>
  );
};
