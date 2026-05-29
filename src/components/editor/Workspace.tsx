import React, { useRef, useState, useEffect, useMemo } from 'react';
import { ZoomControls } from './ZoomControls';
import { computeSnaps, type SnapLine } from '../../utils/snapLogic';
import { SnapGuides } from './SnapGuides';
import type { BoardConfig, BoardTileVariable, BoardTileData, DiceData, CardDeckData, CanvasSettings } from '../../services/storage/types';
import { Canvas } from '@react-three/fiber';
import { Center } from '@react-three/drei';
import { Dice3D } from './DicesWorkspace';
import { generateBoardPath } from '../../utils/boardPathGenerator';
import { DesignToolbar, type DesignTool } from './DesignToolbar';
import { SubTabsNav } from '../ui/SubTabsNav';
import { SegmentedSlider } from '../ui/SegmentedSlider';


const getRoundedPolygonPath = (pts: {x: number, y: number}[], r: number, cx: number, cy: number) => {
  if (!pts || pts.length < 3) return '';
  const points = pts.map(p => ({ x: p.x + cx, y: p.y + cy }));
  const N = points.length;

  const sharpThreshold = Math.cos(15 * Math.PI / 180);
  const isSharp = new Array(N).fill(false);
  const lengths = new Array(N).fill(0);

  for (let i = 0; i < N; i++) {
    const p1 = points[i === 0 ? N - 1 : i - 1];
    const p2 = points[i];
    const p3 = points[(i + 1) % N];
    
    const dx1 = p1.x - p2.x, dy1 = p1.y - p2.y;
    const dx2 = p3.x - p2.x, dy2 = p3.y - p2.y;
    const len1 = Math.sqrt(dx1*dx1 + dy1*dy1);
    const len2 = Math.sqrt(dx2*dx2 + dy2*dy2);
    lengths[i] = len2;
    if (len1 > 0 && len2 > 0) {
      const dot = (dx1/len1) * (dx2/len2) + (dy1/len1) * (dy2/len2);
      if (dot > -sharpThreshold) isSharp[i] = true;
    }
  }

  const maxRs = new Array(N).fill(0);
  for (let i = 0; i < N; i++) {
    if (!isSharp[i]) continue;
    let distPrev = 0, curr = i;
    while (true) {
      const prev = curr === 0 ? N - 1 : curr - 1;
      distPrev += lengths[prev];
      if (isSharp[prev] || prev === i) break;
      curr = prev;
    }
    let distNext = 0; curr = i;
    while (true) {
      const next = (curr + 1) % N;
      distNext += lengths[curr];
      if (isSharp[next] || next === i) break;
      curr = next;
    }
    maxRs[i] = Math.min(r, distPrev / 2, distNext / 2);
  }

  const outPts = new Array(N);
  const inPts = new Array(N);
  const skipped = new Array(N).fill(false);
  
  for (let i = 0; i < N; i++) {
    if (!isSharp[i]) {
      inPts[i] = points[i];
      outPts[i] = points[i];
      continue;
    }
    
    let rem1 = maxRs[i], curr1 = i;
    const q1 = { ...points[i] };
    while (rem1 > 0.001) {
      const prev1 = curr1 === 0 ? N - 1 : curr1 - 1;
      const l = lengths[prev1];
      if (l >= rem1) {
        q1.x = points[curr1].x + ((points[prev1].x - points[curr1].x) / l) * rem1;
        q1.y = points[curr1].y + ((points[prev1].y - points[curr1].y) / l) * rem1;
        break;
      }
      rem1 -= l;
      curr1 = prev1;
      skipped[curr1] = true;
    }
    inPts[i] = q1;
    
    let rem2 = maxRs[i], curr2 = i;
    const q2 = { ...points[i] };
    while (rem2 > 0.001) {
      const l = lengths[curr2];
      const next2 = (curr2 + 1) % N;
      if (l >= rem2) {
        q2.x = points[curr2].x + ((points[next2].x - points[curr2].x) / l) * rem2;
        q2.y = points[curr2].y + ((points[next2].y - points[curr2].y) / l) * rem2;
        break;
      }
      rem2 -= l;
      curr2 = next2;
      skipped[curr2] = true;
    }
    outPts[i] = q2;
  }
  
  let d = '';
  for (let i = 0; i < N; i++) {
    if (skipped[i]) continue;
    if (isSharp[i]) {
      if (d === '') d += `M ${inPts[i].x} ${inPts[i].y} `;
      else d += `L ${inPts[i].x} ${inPts[i].y} `;
      d += `Q ${points[i].x} ${points[i].y} ${outPts[i].x} ${outPts[i].y} `;
    } else {
      if (d === '') d += `M ${points[i].x} ${points[i].y} `;
      else d += `L ${points[i].x} ${points[i].y} `;
    }
  }
  return d + 'Z';
};

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
  boardDicesData?: Record<string, DiceData>;
  boardDecksData?: Record<string, CardDeckData>;
  onUpdateDecksData?: (data: Record<string, CardDeckData>) => void;
  setActiveTab?: (tab: string) => void;
  setSelectedDeckId?: (id: string) => void;
  canvasSettings?: CanvasSettings;
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


const getGridColor = (bgColor: string | undefined, opacity: number = 2) => {
  const alpha = (opacity * 5) / 100;
  
  let actualBg = bgColor;
  if (!actualBg || actualBg === 'transparent') {
    actualBg = document.documentElement.classList.contains('dark') ? '#0e0e0e' : '#d6d6d6';
  }
  
  const h = actualBg.replace('#', '');
  if (h.length !== 3 && h.length !== 6) return 'var(--color-grid)';
  const r = parseInt(h.length === 3 ? h[0]+h[0] : h.substring(0,2), 16);
  const g = parseInt(h.length === 3 ? h[1]+h[1] : h.substring(2,4), 16);
  const b = parseInt(h.length === 3 ? h[2]+h[2] : h.substring(4,6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? `rgba(0,0,0,${alpha})` : `rgba(255,255,255,${alpha})`;
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
  onReplaceBoardTilesData,
  boardDicesData = {},
  boardDecksData = {},
  onUpdateDecksData,
  setActiveTab,
  setSelectedDeckId,
  canvasSettings
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const lastPanPoint = useRef({ x: 0, y: 0 });
  const [selectionBox, setSelectionBox] = useState<{ startX: number, startY: number, currX: number, currY: number } | null>(null);
  const [activeSnapLines, setActiveSnapLines] = useState<SnapLine[]>([]);
  const [activeDistances, setActiveDistances] = useState<{ id: string, x: number, y: number, value: number }[]>([]);
  const [hoveredLayerId, setHoveredLayerId] = useState<string | null>(null);
  const [altPressed, setAltPressed] = useState<boolean>(false);
  const [renameModal, setRenameModal] = useState<{ open: boolean, defaultName: string, tileId: number, layerIds: string[] }>({ open: false, defaultName: '', tileId: -1, layerIds: [] });
  
  const [connectingFromId, setConnectingFromId] = useState<number | null>(null);
  const [tempConnMouse, setTempConnMouse] = useState<{x: number, y: number} | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [isTableSelected, setIsTableSelected] = useState<boolean>(false);

  const [dragBoardOffset, setDragBoardOffset] = useState<{x: number, y: number} | null>(null);
  const [dragTableOffset, setDragTableOffset] = useState<{x: number, y: number} | null>(null);
  const [dragTableSize, setDragTableSize] = useState<{w: number, h: number, x: number, y: number} | null>(null);
  const [dragDicesOffset, setDragDicesOffset] = useState<{x: number, y: number} | null>(null);
  const [dragDecksOffset, setDragDecksOffset] = useState<Record<string, {x: number, y: number} | null>>({});

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
      
      if (boardSubTab === 'Table' && activeTab === 'Board' && isTableSelected && onUpdateBoardConfig && boardConfig?.tableConfig) {
        let dx = 0, dy = 0;
        const step = e.altKey && e.shiftKey ? 100 : e.shiftKey ? 10 : 1;
        if (e.key === 'ArrowUp') dy = -step;
        if (e.key === 'ArrowDown') dy = step;
        if (e.key === 'ArrowLeft') dx = -step;
        if (e.key === 'ArrowRight') dx = step;

        if (dx !== 0 || dy !== 0) {
          e.preventDefault();
          onUpdateBoardConfig({
             ...boardConfig,
             tableConfig: { ...boardConfig.tableConfig, x: (boardConfig.tableConfig.x || 0) + dx, y: (boardConfig.tableConfig.y || 0) + dy }
          }, true);
          return;
        }
      }
      
      if (e.key === 'Escape') {
        setSelectedTileIds?.([]);
        setSelectedLayerIds?.([]);
        setSelectedTableLayerIds?.([]);
        setIsTableSelected(false);
      }
      
      if ((e.key === 'Delete' || e.key === 'Backspace') && boardSubTab === 'Design' && selectedTileIds.length === 1 && selectedLayerIds.length > 0 && onUpdateTile) {
        const tileId = selectedTileIds[0];
        const layers = boardTilesData[tileId]?.layers || [];
        onUpdateTile(tileId, { layers: layers.filter(l => !selectedLayerIds.includes(l.id)) });
        setSelectedLayerIds?.([]);
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && boardSubTab === 'Table' && selectedTableLayerIds?.length === 1 && onUpdateBoardConfig && boardConfig) {
        const layers = boardConfig.tableConfig?.layers || [];
        onUpdateBoardConfig({
          ...boardConfig,
          tableConfig: { ...boardConfig.tableConfig!, layers: layers.filter(l => !selectedTableLayerIds.includes(l.id)) }
        });
        setSelectedTableLayerIds?.([]);
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

        if (boardSubTab === 'Design' && selectedLayerIds && selectedLayerIds.length > 0) {
          const tileId = selectedTileIds[0];
          const layers = boardTilesData[tileId]?.layers || [];
          const newLayers = [...layers];
          const newSelectedIds: string[] = [];
          
          selectedLayerIds.forEach(layerId => {
            const layer = layers.find(l => l.id === layerId);
            if (layer) {
              const newId = Date.now().toString() + Math.random().toString(36).substring(7);
              newSelectedIds.push(newId);
              newLayers.push({
                ...layer,
                id: newId,
                name: `${layer.name} (copy)`,
                x: layer.x + 10,
                y: layer.y + 10
              });
            }
          });
          
          if (onUpdateTile) {
            onUpdateTile(tileId, { layers: newLayers });
            setSelectedLayerIds?.(newSelectedIds);
          }
          return;
        }

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

      if (e.key.startsWith('Arrow') && boardSubTab === 'Design' && selectedTileIds.length === 1 && selectedLayerIds.length > 0 && onUpdateTile) {
        e.preventDefault();
        const amount = (e.shiftKey && e.altKey) ? 100 : (e.shiftKey ? 10 : 1);
        let dx = 0, dy = 0;
        if (e.key === 'ArrowUp') dy = -amount;
        if (e.key === 'ArrowDown') dy = amount;
        if (e.key === 'ArrowLeft') dx = -amount;
        if (e.key === 'ArrowRight') dx = amount;

        const tileId = selectedTileIds[0];
        const layers = boardTilesData[tileId]?.layers || [];
        const newLayers = layers.map(l => {
          if (selectedLayerIds.includes(l.id)) {
            return { ...l, x: l.x + dx, y: l.y + dy };
          }
          return l;
        });
        onUpdateTile(tileId, { layers: newLayers });
      }

      if (e.key.toLowerCase() === 'r' && e.ctrlKey && boardSubTab === 'Design' && selectedTileIds.length === 1 && selectedLayerIds.length > 0 && onUpdateTile) {
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
  }, [transform.scale, boardSubTab, selectedTileIds, selectedLayerIds, boardTilesData, onUpdateTile, selectedConnectionId, boardConfig, onUpdateBoardConfig, isTableSelected]);

  useEffect(() => {
    const handleKeyDownAlt = (e: KeyboardEvent) => {
      if (e.key === 'Alt') setAltPressed(true);
    };
    const handleKeyUpAlt = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        setAltPressed(false);
        setActiveDistances([]);
        setActiveSnapLines([]);
      }
    };
    window.addEventListener('keydown', handleKeyDownAlt);
    window.addEventListener('keyup', handleKeyUpAlt);
    return () => {
      window.removeEventListener('keydown', handleKeyDownAlt);
      window.removeEventListener('keyup', handleKeyUpAlt);
    };
  }, []);

  useEffect(() => {
    if (!altPressed || selectedLayerIds.length !== 1 || hoveredLayerId === selectedLayerIds[0]) {
      if (!altPressed) {
        setActiveDistances([]);
      }
      return;
    }
    
    const tileId = selectedTileIds[0];
    let layers: any[] = [];
    let tile: any = null;
    if (boardSubTab === 'Design' && tileId) {
      tile = boardTiles.find(t => t.id === tileId);
      layers = boardTilesData[tileId]?.layers || [];
    } else if (boardSubTab === 'Table') {
      layers = boardConfig?.tableConfig?.layers || [];
      tile = { x: boardConfig?.tableConfig?.x || 0, y: boardConfig?.tableConfig?.y || 0, width: boardConfig?.tableConfig?.width || 0, height: boardConfig?.tableConfig?.height || 0 };
    }
    
    const source = layers.find(l => l.id === selectedLayerIds[0]);
    const target = layers.find(l => l.id === hoveredLayerId);
    
    if (source && tile) {
      const bX = boardConfig?.boardX || 0;
      const bY = boardConfig?.boardY || 0;
      
      let offsetX = 0;
      let offsetY = 0;
      let finalW = 100;
      let finalH = 100;
      if (boardSubTab === 'Design') {
        const tileData = boardTilesData[tileId];
        finalW = tileData?.width ?? boardConfig?.tileWidth ?? 100;
        finalH = tileData?.height ?? boardConfig?.tileHeight ?? 100;
        offsetX = tile.x + bX - finalW/2;
        offsetY = tile.y + bY - finalH/2;
      } else {
        finalW = tile.width;
        finalH = tile.height;
        offsetX = tile.x + bX - tile.width/2;
        offsetY = tile.y + bY - tile.height/2;
      }

      const sX = source.x; const sY = source.y; 
      const sW = source.type === 'text' && source.sizingW === 'fill' ? finalW : (source.width || 0);
      const sH = source.type === 'text' && source.sizingH === 'fill' ? finalH : (source.height || 0);
      
      const newLines: SnapLine[] = [];
      const newDistances: {id: string, x: number, y: number, value: number}[] = [];
      
      if (!target) {
        const tW = finalW; const tH = finalH;
        const topDist = Math.round(sY);
        const bottomDist = Math.round(tH - (sY + sH));
        const leftDist = Math.round(sX);
        const rightDist = Math.round(tW - (sX + sW));
        
        if (topDist > 0) {
          newLines.push({ id: 'bt', x1: sX + sW/2 + offsetX, y1: offsetY, x2: sX + sW/2 + offsetX, y2: sY + offsetY, type: 'v' } as any);
          newDistances.push({ id: 'btd', x: sX + sW/2 + offsetX, y: sY/2 + offsetY, value: topDist });
        }
        if (bottomDist > 0) {
          newLines.push({ id: 'bb', x1: sX + sW/2 + offsetX, y1: sY + sH + offsetY, x2: sX + sW/2 + offsetX, y2: tH + offsetY, type: 'v' } as any);
          newDistances.push({ id: 'bbd', x: sX + sW/2 + offsetX, y: sY + sH + bottomDist/2 + offsetY, value: bottomDist });
        }
        if (leftDist > 0) {
          newLines.push({ id: 'bl', x1: offsetX, y1: sY + sH/2 + offsetY, x2: sX + offsetX, y2: sY + sH/2 + offsetY, type: 'h' } as any);
          newDistances.push({ id: 'bld', x: sX/2 + offsetX, y: sY + sH/2 + offsetY, value: leftDist });
        }
        if (rightDist > 0) {
          newLines.push({ id: 'br', x1: sX + sW + offsetX, y1: sY + sH/2 + offsetY, x2: tW + offsetX, y2: sY + sH/2 + offsetY, type: 'h' } as any);
          newDistances.push({ id: 'brd', x: sX + sW + rightDist/2 + offsetX, y: sY + sH/2 + offsetY, value: rightDist });
        }
      } else {
        const tX = target.x; const tY = target.y; const tW = target.width || 0; const tH = target.height || 0;
      
      let cx = 0, cy = 0, dist = 0;
      
      // Horizontal distances
      if (sX + sW < tX) {
        dist = tX - (sX + sW);
        cx = sX + sW + dist/2;
        cy = Math.max(sY, tY) + Math.min(sH, tH)/2;
        newLines.push({ id: 'hd', x1: sX + sW + offsetX, y1: cy + offsetY, x2: tX + offsetX, y2: cy + offsetY, type: 'h' });
        newDistances.push({ id: 'hdl', x: cx + offsetX, y: cy + offsetY, value: dist });
      } else if (sX > tX + tW) {
        dist = sX - (tX + tW);
        cx = tX + tW + dist/2;
        cy = Math.max(sY, tY) + Math.min(sH, tH)/2;
        newLines.push({ id: 'hd', x1: tX + tW + offsetX, y1: cy + offsetY, x2: sX + offsetX, y2: cy + offsetY, type: 'h' });
        newDistances.push({ id: 'hdl', x: cx + offsetX, y: cy + offsetY, value: dist });
      }
      
      // Vertical distances
      if (sY + sH < tY) {
        dist = tY - (sY + sH);
        cx = Math.max(sX, tX) + Math.min(sW, tW)/2;
        cy = sY + sH + dist/2;
        newLines.push({ id: 'vd', x1: cx + offsetX, y1: sY + sH + offsetY, x2: cx + offsetX, y2: tY + offsetY, type: 'v' });
        newDistances.push({ id: 'vdl', x: cx + offsetX, y: cy + offsetY, value: dist });
      } else if (sY > tY + tH) {
        dist = sY - (tY + tH);
        cx = Math.max(sX, tX) + Math.min(sW, tW)/2;
        cy = tY + tH + dist/2;
        newLines.push({ id: 'vd', x1: cx + offsetX, y1: tY + tH + offsetY, x2: cx + offsetX, y2: sY + offsetY, type: 'v' });
        newDistances.push({ id: 'vdl', x: cx + offsetX, y: cy + offsetY, value: dist });
      }

      // Intersecting / Inside bounding box distances
      if (sX >= tX && sX + sW <= tX + tW && sY >= tY && sY + sH <= tY + tH) {
         const topDist = sY - tY;
         const bottomDist = (tY + tH) - (sY + sH);
         const leftDist = sX - tX;
         const rightDist = (tX + tW) - (sX + sW);
         
         if (topDist > 0) {
           newLines.push({ id: 't', x1: sX + sW/2 + offsetX, y1: tY + offsetY, x2: sX + sW/2 + offsetX, y2: sY + offsetY, type: 'v' });
           newDistances.push({ id: 'td', x: sX + sW/2 + offsetX, y: tY + topDist/2 + offsetY, value: topDist });
         }
         if (bottomDist > 0) {
           newLines.push({ id: 'b', x1: sX + sW/2 + offsetX, y1: sY + sH + offsetY, x2: sX + sW/2 + offsetX, y2: tY + tH + offsetY, type: 'v' });
           newDistances.push({ id: 'bd', x: sX + sW/2 + offsetX, y: sY + sH + bottomDist/2 + offsetY, value: bottomDist });
         }
         if (leftDist > 0) {
           newLines.push({ id: 'l', x1: tX + offsetX, y1: sY + sH/2 + offsetY, x2: sX + offsetX, y2: sY + sH/2 + offsetY, type: 'h' });
           newDistances.push({ id: 'ld', x: tX + leftDist/2 + offsetX, y: sY + sH/2 + offsetY, value: leftDist });
         }
         if (rightDist > 0) {
           newLines.push({ id: 'r', x1: sX + sW + offsetX, y1: sY + sH/2 + offsetY, x2: tX + tW + offsetX, y2: sY + sH/2 + offsetY, type: 'h' });
           newDistances.push({ id: 'rd', x: sX + sW + rightDist/2 + offsetX, y: sY + sH/2 + offsetY, value: rightDist });
         }
        }
        setActiveSnapLines(newLines);
        setActiveDistances(newDistances || []);
      }
    }
  }, [altPressed, selectedLayerIds, hoveredLayerId, boardSubTab, selectedTileIds, boardTilesData, boardTiles, boardConfig]);

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
      setActiveSnapLines([]);
      setDragBoardOffset(null);
      if (boardConfig) {
        onUpdateBoardConfig?.({
          ...boardConfig,
          boardX: initialX + currentDx,
          boardY: initialY + currentDy
        }, true);
      }
    };
    
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  const handleDicesDragStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    const startX = e.clientX;
    const startY = e.clientY;

    const handleMove = (moveEvent: PointerEvent) => {
      setDragDicesOffset({
        x: (moveEvent.clientX - startX) / transform.scale,
        y: (moveEvent.clientY - startY) / transform.scale
      });
    };

    const handleUp = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      setActiveSnapLines([]);
      
      const currentOffset = {
        x: (upEvent.clientX - startX) / transform.scale,
        y: (upEvent.clientY - startY) / transform.scale
      };
      
      setDragDicesOffset(null);
      if (boardConfig) {
        let initialX = boardConfig.dicesConfig?.x;
        let initialY = boardConfig.dicesConfig?.y;
        if (initialX === undefined) initialX = (boardConfig.tableConfig?.x || 0) + (boardConfig.tableConfig?.width || 0) / 2 + 80;
        if (initialY === undefined) initialY = (boardConfig.tableConfig?.y || 0);

        onUpdateBoardConfig?.({
          ...boardConfig,
          dicesConfig: { 
            x: canvasSettings?.snapToGrid ? Math.round(initialX + currentOffset.x) : Math.round((initialX + currentOffset.x) * 1000) / 1000, 
            y: canvasSettings?.snapToGrid ? Math.round(initialY + currentOffset.y) : Math.round((initialY + currentOffset.y) * 1000) / 1000 
          }
        }, true);
      }
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  const handleTableDragStart = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = boardConfig?.tableConfig?.x || 0;
    const initialY = boardConfig?.tableConfig?.y || 0;

    const handleMove = (ev: PointerEvent) => {
      setDragTableOffset({
        x: (ev.clientX - startX) / transform.scale,
        y: (ev.clientY - startY) / transform.scale
      });
    };

    const handleUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      setActiveSnapLines([]);
      
      const currentOffset = {
        x: (ev.clientX - startX) / transform.scale,
        y: (ev.clientY - startY) / transform.scale
      };
      
      setDragTableOffset(null);
      if (boardConfig) {
        onUpdateBoardConfig?.({
          ...boardConfig,
          tableConfig: { 
            ...(boardConfig.tableConfig || { width: 1920, height: 1080, color: '#315e26', texture: 'felt', border: true, layers: [] }),
            x: canvasSettings?.snapToGrid ? Math.round(initialX + currentOffset.x) : Math.round((initialX + currentOffset.x) * 1000) / 1000, 
            y: canvasSettings?.snapToGrid ? Math.round(initialY + currentOffset.y) : Math.round((initialY + currentOffset.y) * 1000) / 1000 
          }
        }, true);
      }
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  const handleDeckDragStart = (e: React.PointerEvent, deckId: string) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    const startX = e.clientX;
    const startY = e.clientY;

    const handleMove = (moveEvent: PointerEvent) => {
      setDragDecksOffset(prev => ({
        ...prev,
        [deckId]: {
          x: (moveEvent.clientX - startX) / transform.scale,
          y: (moveEvent.clientY - startY) / transform.scale
        }
      }));
    };

    const handleUp = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      setActiveSnapLines([]);
      
      const currentOffset = {
        x: (upEvent.clientX - startX) / transform.scale,
        y: (upEvent.clientY - startY) / transform.scale
      };
      
      setDragDecksOffset(prev => ({ ...prev, [deckId]: null }));
      
      const deck = boardDecksData[deckId];
      if (deck && onUpdateDecksData) {
        const initialX = deck.x ?? ((boardConfig?.tableConfig?.x || 0) + (boardConfig?.tableConfig?.width || 0) / 2 + 80 + Object.keys(boardDecksData).indexOf(deckId) * 300);
        const initialY = deck.y ?? ((boardConfig?.tableConfig?.y || 0) + 400);

        onUpdateDecksData({
          ...boardDecksData,
          [deckId]: {
            ...deck,
            x: canvasSettings?.snapToGrid ? Math.round(initialX + currentOffset.x) : Math.round((initialX + currentOffset.x) * 1000) / 1000,
            y: canvasSettings?.snapToGrid ? Math.round(initialY + currentOffset.y) : Math.round((initialY + currentOffset.y) * 1000) / 1000
          }
        });
      }
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
  
    useEffect(() => {
      const handleZoomEvent = (e: Event) => {
        const type = (e as CustomEvent).detail;
        if (type === 'in') handleZoomIn();
        else if (type === 'out') handleZoomOut();
        else if (type === 'reset') handleReset();
      };
      window.addEventListener('meevo-zoom', handleZoomEvent);
      return () => window.removeEventListener('meevo-zoom', handleZoomEvent);
    }, []);

  return (
    <div className="w-full h-full flex flex-col">
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`flex-1 relative overflow-hidden select-none ${isPanning ? 'cursor-grabbing' : (activeDesignTool !== 'Cursor' ? 'cursor-create' : 'cursor-default')}`}
      style={{ backgroundColor: canvasSettings?.fill || 'var(--color-canvas-bg)' }}
      onPointerDown={(e) => {
        setSelectedConnectionId(null);
        if (boardSubTab === 'Table') {
          if ((e.target as HTMLElement).tagName === 'DIV' || (e.target as HTMLElement).tagName === 'path' || (e.target as HTMLElement).tagName === 'svg') {
            setIsTableSelected(false);
            setSelectedTableLayerIds?.([]);
          }
        }
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
              setActiveSnapLines([]);
            };
            
            window.addEventListener('pointermove', handleMove);
            window.addEventListener('pointerup', handleUp);
          }
        } else if (boardSubTab === 'Design' && setSelectedLayerIds) {
          if ((e.target as HTMLElement).tagName === 'DIV' || (e.target as HTMLElement).tagName === 'path' || (e.target as HTMLElement).tagName === 'svg') {
            setSelectedTileIds([]);
            setSelectedLayerIds?.([]);
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
        {canvasSettings?.viewGrid !== false && (() => {
          const baseGridSize = 40;
          const gridSize = transform.scale < 0.3 ? baseGridSize * 10 : baseGridSize;
          return (
            <div 
              className="absolute inset-0 select-none pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(to right, ${getGridColor(canvasSettings?.fill, canvasSettings?.gridOpacity)} 1px, transparent 1px),
                  linear-gradient(to bottom, ${getGridColor(canvasSettings?.fill, canvasSettings?.gridOpacity)} 1px, transparent 1px)
                `,
                backgroundSize: `${gridSize * transform.scale}px ${gridSize * transform.scale}px`,
                backgroundPosition: `${transform.x}px ${transform.y}px`,
              }}
            />
          );
        })()}
        
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

                const handleTableResizeDown = (e: React.PointerEvent, dir: string) => {
                  e.stopPropagation();
                  if (!boardConfig?.tableConfig) return;
                  const startX = e.clientX;
                  const startY = e.clientY;
                  const startW = boardConfig.tableConfig.width;
                  const startH = boardConfig.tableConfig.height;

                  let currentDragData: {w: number, h: number, x: number, y: number} | null = null;
                  const handleResize = (ev: PointerEvent) => {
                    const dx = (ev.clientX - startX) / transform.scale;
                    const dy = (ev.clientY - startY) / transform.scale;
                    
                    let newW = startW;
                    let newH = startH;
                    let newCx = boardConfig.tableConfig!.x || 0;
                    let newCy = boardConfig.tableConfig!.y || 0;

                    if (dir.includes('e')) { newW = startW + dx; newCx += dx / 2; }
                    if (dir.includes('w')) { newW = startW - dx; newCx += dx / 2; }
                    if (dir.includes('s')) { newH = startH + dy; newCy += dy / 2; }
                    if (dir.includes('n')) { newH = startH - dy; newCy += dy / 2; }

                    newW = Math.max(10, Math.round(newW));
                    newH = Math.max(10, Math.round(newH));
                    newCx = Math.round(newCx);
                    newCy = Math.round(newCy);

                    currentDragData = { w: newW, h: newH, x: newCx, y: newCy };
                    setDragTableSize(currentDragData);
                  };

                  const handleResizeUp = () => {
                    window.removeEventListener('pointermove', handleResize);
                    window.removeEventListener('pointerup', handleResizeUp);
                    if (currentDragData) {
                      onUpdateBoardConfig?.({
                        ...boardConfig,
                        tableConfig: { ...boardConfig.tableConfig!, width: currentDragData.w, height: currentDragData.h, x: currentDragData.x, y: currentDragData.y }
                      }, true);
                    }
                    setDragTableSize(null);
                  };

                  window.addEventListener('pointermove', handleResize);
                  window.addEventListener('pointerup', handleResizeUp);
                };
                
                const renderTableLayers = (onlyHandles: boolean = false) => {
                  const tableLayers = boardConfig.tableConfig?.layers || [];
                  return tableLayers.map(layer => {
                    const isLayerSelected = selectedTableLayerIds?.includes(layer.id);
                    if (onlyHandles && (!isLayerSelected || activeDesignTool !== 'Cursor' || boardSubTab !== 'Table' || activeTab !== 'Board')) return null;
                    if (onlyHandles) {
                      return (
                        <div key={`${layer.id}-handles`} className="absolute pointer-events-none" style={{ left: layer.x, top: layer.y, width: layer.width, height: layer.height, transform: `rotate(${layer.rotation}deg)` }}>
                          {['nw', 'ne', 'se', 'sw'].map(dir => {
                            const hSize = 10 / transform.scale;
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
                                    const isCorner = dir.length === 2;
  
                                    if (dir.includes('e')) newW = Math.max(1, startW + rDx);
                                    if (dir.includes('s')) newH = Math.max(1, startH + rDy);
                                    if (dir.includes('w')) { newW = Math.max(1, startW - rDx); newX = startLayerX + (startW - newW); }
                                    if (dir.includes('n')) { newH = Math.max(1, startH - rDy); newY = startLayerY + (startH - newH); }
  
                                    if (ev.altKey && !isCorner) {
                                      if (dir === 'e') { newW = Math.max(1, startW + rDx * 2); newX = startLayerX - rDx; }
                                      if (dir === 'w') { newW = Math.max(1, startW - rDx * 2); }
                                      if (dir === 's') { newH = Math.max(1, startH + rDy * 2); newY = startLayerY - rDy; }
                                      if (dir === 'n') { newH = Math.max(1, startH - rDy * 2); }
                                    }
  
                                    if (ev.shiftKey && startH > 0 && startW > 0) {
                                      let useScaleX = true;
                                      if (dir.length === 1) {
                                        useScaleX = dir === 'e' || dir === 'w';
                                      } else {
                                        useScaleX = Math.abs((newW / startW) - 1) > Math.abs((newH / startH) - 1);
                                      }
                                      if (useScaleX) { newH = newW * (startH / startW); if (dir.includes('n')) newY = startLayerY + (startH - newH); } 
                                      else { newW = newH * (startW / startH); if (dir.includes('w')) newX = startLayerX + (startW - newW); }
                                    }
  
                                    if (canvasSettings?.snapToGrid) {
                                      newX = Math.round(newX); newY = Math.round(newY);
                                      newW = Math.max(1, Math.round(newW)); newH = Math.max(1, Math.round(newH));
                                    } else {
                                      newX = Math.round(newX * 1000) / 1000; newY = Math.round(newY * 1000) / 1000;
                                      newW = Math.max(1, Math.round(newW * 1000) / 1000); newH = Math.max(1, Math.round(newH * 1000) / 1000);
                                    }
  
                                    const newLayers = [...(boardConfig.tableConfig?.layers || [])];
                                    const lIndex = newLayers.findIndex(l => l.id === layer.id);
                                    if (lIndex >= 0) {
                                      const updatedLayer = { ...newLayers[lIndex], x: newX, y: newY, width: newW, height: newH };
                                      if (layer.type === 'image' && layer.imageMode === 'crop') {
                                        const scaleFactor = Math.max(newW / startW, newH / startH);
                                        updatedLayer.imageScale = Math.max(0.1, (layer.imageScale || 1) * scaleFactor);
                                      }
                                      newLayers[lIndex] = updatedLayer;
                                      onUpdateBoardConfig?.({
                                        ...boardConfig,
                                        tableConfig: { ...boardConfig.tableConfig!, layers: newLayers }
                                      }, true);
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
                            );
                          })}
                        </div>
                      );
                    }
                    
                    return (
                      <div
                        key={layer.id}
                        onPointerEnter={() => setHoveredLayerId(layer.id)}
                        onPointerLeave={() => setHoveredLayerId(null)}
                        className={`absolute border flex items-center justify-center transition-all cursor-pointer pointer-events-auto ${
                          isLayerSelected ? 'border-[#F0B100] text-meevo-text-primary z-20' : 'border-transparent text-meevo-text-tertiary z-10'
                        }`}
                        style={{
                          left: layer.x, top: layer.y, width: layer.width, height: layer.height, transform: `rotate(${layer.rotation}deg)`,
                          fontSize: layer.typography?.size, fontFamily: layer.typography?.family, color: layer.typography?.color || '#FFFFFF',
                          fontWeight: layer.typography?.weight, fontStyle: layer.typography?.style, textDecoration: layer.typography?.decoration,
                        }}
                        onPointerDown={(e) => {
                          if (e.button !== 0) return;
                          if (boardSubTab !== 'Table' || activeTab !== 'Board') return;
                          e.stopPropagation();
                          
                          if (activeDesignTool === 'Cursor') {
                            const startX = e.clientX, startY = e.clientY;
                            let dragLayerId = layer.id;
                            const startLayerX = layer.x, startLayerY = layer.y;
                            const isAltStart = e.altKey;
                            let createdCopy = false;
                            setSelectedTableLayerIds?.([layer.id]);

                            const handleMove = (ev: PointerEvent) => {
                              const dx = (ev.clientX - startX) / transform.scale;
                              const dy = (ev.clientY - startY) / transform.scale;
                              
                              if (isAltStart && !createdCopy && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) {
                                createdCopy = true;
                                const newLayerId = Date.now().toString() + Math.random().toString(36).substring(7);
                                const newLayer = { ...layer, id: newLayerId, name: layer.name + " (copy)", x: startLayerX, y: startLayerY };
                                dragLayerId = newLayerId;
                                const newLayers = [...(boardConfig.tableConfig?.layers || []), newLayer];
                                onUpdateBoardConfig?.({ ...boardConfig, tableConfig: { ...boardConfig.tableConfig!, layers: newLayers } }, true);
                                setSelectedTableLayerIds?.([newLayerId]);
                              }

                              let newX = startLayerX + dx;
                              let newY = startLayerY + dy;

                              const layerToDrag = boardConfig.tableConfig?.layers?.find(l => l.id === dragLayerId) || layer;
                              const rects = (boardConfig.tableConfig?.layers || []).map(l => ({ id: l.id, x: l.x, y: l.y, w: l.width, h: l.height }));
                              const tw = boardConfig.tableConfig!.width;
                              const th = boardConfig.tableConfig!.height;
                              rects.push({ id: 'container-bounds', x: -tw/2, y: -th/2, w: tw, h: th, isBounds: true });
                              rects.push({ id: 'container-hcenter', x: 0, y: -th/2, w: 0, h: th, isBounds: true });
                              rects.push({ id: 'container-vcenter', x: -tw/2, y: 0, w: tw, h: 0, isBounds: true });

                              const snapResult = computeSnaps(newX, newY, layerToDrag.width, layerToDrag.height, dragLayerId, rects, transform.scale, 5);
                              newX = snapResult.x;
                              newY = snapResult.y;
                              if (canvasSettings?.snapToGrid) {
                                newX = Math.round(newX); newY = Math.round(newY);
                              } else {
                                newX = Math.round(newX * 1000) / 1000; newY = Math.round(newY * 1000) / 1000;
                              }
                              const newLayers = [...(boardConfig.tableConfig?.layers || [])];
                              const lIndex = newLayers.findIndex(l => l.id === dragLayerId);
                              if (lIndex >= 0) {
                                newLayers[lIndex] = { ...newLayers[lIndex], x: newX, y: newY };
                                onUpdateBoardConfig?.({ ...boardConfig, tableConfig: { ...boardConfig.tableConfig!, layers: newLayers } }, true);
                              }
                            };
                            const handleUp = () => {
                              window.removeEventListener('pointermove', handleMove);
                              window.removeEventListener('pointerup', handleUp);
                              setActiveSnapLines([]);
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
                          {layer.type === 'text' && (
                            <span style={{ width: '100%', wordBreak: 'break-word', textAlign: layer.typography?.align || 'center' }}>
                              {layer.text}
                            </span>
                          )}
                          {layer.type === 'image' && layer.imageMode !== 'tile' && layer.src && (
                            <img src={layer.src} alt="" style={{ width: '100%', height: '100%', objectFit: layer.imageMode === 'fit' ? 'contain' : 'cover', pointerEvents: 'none', transform: layer.imageMode === 'crop' && layer.imageScale !== undefined ? `scale(${layer.imageScale})` : undefined }} />
                          )}
                        </div>
                      </div>
                    )
                  });
                };

                return (
                  <div
                    className={`absolute border shadow flex items-center justify-center transition-all pointer-events-auto ${
                      (isTableSelected && boardSubTab === 'Table' && activeTab === 'Board') ? 'border-[#F0B100] z-0' : 'border-transparent z-0'
                    }`}
                    style={{
                      left: dragTableSize ? dragTableSize.x : (boardConfig.tableConfig.x || 0) + (dragTableOffset?.x || 0),
                      top: dragTableSize ? dragTableSize.y : (boardConfig.tableConfig.y || 0) + (dragTableOffset?.y || 0),
                      width: dragTableSize ? dragTableSize.w : boardConfig.tableConfig.width,
                      height: dragTableSize ? dragTableSize.h : boardConfig.tableConfig.height,
                      transform: 'translate(-50%, -50%)',
                      backgroundColor: boardConfig.tableConfig.color || '#1A1A1D',
                      borderRadius: (boardConfig.tableConfig as any).borderRadius !== undefined ? `${(boardConfig.tableConfig as any).borderRadius}px` : '16px',
                      ...((boardConfig.tableConfig as any).bgImage ? {
                         backgroundImage: `url(${(boardConfig.tableConfig as any).bgImage})`,
                         backgroundSize: (boardConfig.tableConfig as any).bgImageMode === 'tile' ? `${(boardConfig.tableConfig as any).bgImageTileSize || 50}px` : 'cover',
                         backgroundPosition: 'center',
                         backgroundRepeat: (boardConfig.tableConfig as any).bgImageMode === 'tile' ? 'repeat' : 'no-repeat'
                      } : {})
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setActiveTab?.('Board');
                      setBoardSubTab?.('Table');
                      setIsTableSelected(true);
                    }}
                    onPointerDown={(e) => {
                      if (boardSubTab === 'Table' && activeTab === 'Board') {
                        setIsTableSelected(true);
                        if (activeDesignTool && activeDesignTool !== 'Cursor') {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          const clickX = (e.clientX - rect.left) / transform.scale;
                          const clickY = (e.clientY - rect.top) / transform.scale;
                          
                          if (activeDesignTool === 'Image') {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (ev) => {
                              const file = (ev.target as HTMLInputElement).files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const newLayer = {
                                    id: Date.now().toString(),
                                    type: 'image' as const,
                                    x: clickX - 50,
                                    y: clickY - 50,
                                    width: 100,
                                    height: 100,
                                    rotation: 0,
                                    opacity: 100,
                                    name: 'Image',
                                    src: event.target?.result as string,
                                    imageMode: 'fit' as const
                                  };
                                  
                                  const layers = boardConfig.tableConfig?.layers || [];
                                  onUpdateBoardConfig?.({
                                    ...boardConfig,
                                    tableConfig: { ...boardConfig.tableConfig!, layers: [...layers, newLayer] }
                                  }, false);
                                  setSelectedTableLayerIds?.([newLayer.id]);
                                  setActiveDesignTool?.('Cursor');
                                };
                                reader.readAsDataURL(file);
                              }
                            };
                            input.click();
                          }
                          return;
                        }

                        setSelectedTableLayerIds?.([]);
                        handleTableDragStart(e);
                      }
                    }}
                  >
                    <div 
                      className="absolute inset-0"
                      style={{ overflow: 'hidden', borderRadius: (boardConfig.tableConfig as any).borderRadius ? `${(boardConfig.tableConfig as any).borderRadius}px` : '16px' }}
                    >
                      {renderTableLayers(false)}
                    </div>
                      {renderTableLayers(true)}
                      {isTableSelected && boardSubTab === 'Table' && activeTab === 'Board' && (
                        <div className="absolute inset-0 pointer-events-none z-10" style={{ border: '2px solid var(--color-purple)', borderRadius: (boardConfig.tableConfig as any).borderRadius ? `${(boardConfig.tableConfig as any).borderRadius}px` : '16px' }}>
                          {['nw', 'ne', 'se', 'sw', 'n', 'e', 's', 'w'].map(dir => {
                            const hSize = 12 / transform.scale;
                            const pos: any = {};
                            if (dir.includes('n')) pos.top = -hSize/2;
                            if (dir.includes('s')) pos.bottom = -hSize/2;
                            if (dir.includes('w')) pos.left = -hSize/2;
                            if (dir.includes('e')) pos.right = -hSize/2;
                            if (dir === 'n' || dir === 's') pos.left = '50%';
                            if (dir === 'e' || dir === 'w') pos.top = '50%';
                            if (pos.left === '50%') pos.transform = 'translateX(-50%)';
                            if (pos.top === '50%') pos.transform = 'translateY(-50%)';
                            
                            return (
                              <div 
                                key={dir} 
                                className="absolute bg-white border border-meevo-purple pointer-events-auto"
                                style={{
                                  width: hSize,
                                  height: hSize,
                                  ...pos,
                                  cursor: `${dir}-resize`
                                }}
                                onPointerDown={(e) => handleTableResizeDown(e, dir)}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}

              {boardTiles.map((tile) => {
                const tileData = boardTilesData[tile.id];
                const isSelected = selectedTileIds.includes(tile.id);
                const isDimmed = boardSubTab === 'Design' && selectedTileIds.length > 0 && !isSelected;
                const tileBoxShadow = boardSubTab === 'Design' && isSelected ? '0 0 0 2px #F0B100, 0 0 20px rgba(240, 177, 0, 0.3)' : (tileData?.shadow ? `0 4px 6px ${hexToRgba(tileData.shadowColor || '#000000', tileData.shadowOpacity ?? 50)}` : undefined);
                
                const finalW = tileData?.width ?? boardConfig?.tileWidth ?? 100;
                const finalH = tileData?.height ?? boardConfig?.tileHeight ?? 100;
                
                const tileVars = (tileData?.variableIds || []).map((vid: string) => boardVariables.find((v: any) => v.id === vid)).filter(Boolean);
                let finalBg = tileData?.fillColor ?? tileData?.bgColor ?? (tileVars.length > 0 ? tileVars[0]!.color : '#222225');
                
                if (tileData?.bindings?.bgColor) {
                   const propId = tileData.bindings.bgColor;
                   const val = tileData.propertyValues?.[propId];
                   if (val) {
                     finalBg = val;
                   } else {
                     const prop = boardVariables.flatMap((v: any) => v.properties || []).find((p: any) => p.id === propId);
                     if (prop?.defaultValue) finalBg = prop.defaultValue;
                   }
                }

                const opacityClass = (activeTab === 'Board' && boardSubTab !== 'Table' && boardSubTab !== 'Design') && tileData?.opacity && tileData.opacity < 100 ? `opacity-[${tileData.opacity/100}]` : '';

                const bgStyle: React.CSSProperties = {
                  backgroundColor: finalBg,
                  ...(!tile.cornerPolygon && tileData?.strokeWidth ? {
                    borderColor: tileData.strokeColor || '#000000',
                    borderWidth: `${tileData.strokeWidth}px`,
                    borderStyle: 'solid'
                  } : {}),
                  ...(tileData?.bgImage ? {
                    backgroundImage: `url(${tileData.bgImage})`,
                    backgroundSize: tileData.bgImageMode === 'tile' ? `${tileData.bgImageTileSize || 50}px` : 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: tileData.bgImageMode === 'tile' ? 'repeat' : 'no-repeat'
                  } : {})
                };
                
                let tileName = tile.id.toString();
                if (boardConfig?.pathShape === 'Grid' || boardConfig?.pathShape === 'Hexagonal') {
                  const cols = boardConfig?.gridCols || 5;
                  const row = Math.floor(tile.id / cols);
                  const col = tile.id % cols;
                  tileName = `${String.fromCharCode(65 + row)}${col + 1}`;
                }

                let polyW = finalW;
                let polyH = finalH;
                if (tile.cornerPolygon) {
                  let maxAbsX = 0, maxAbsY = 0;
                  tile.cornerPolygon.forEach(p => {
                    if (Math.abs(p.x) > maxAbsX) maxAbsX = Math.abs(p.x);
                    if (Math.abs(p.y) > maxAbsY) maxAbsY = Math.abs(p.y);
                  });
                  if (maxAbsX * 2 > polyW) polyW = maxAbsX * 2;
                  if (maxAbsY * 2 > polyH) polyH = maxAbsY * 2;
                }

                const sizeScale = Math.max(0.1, Math.min(finalW, finalH) / 60);
                const scaleStr = (val: number) => `${val * sizeScale}px`;
                const borderRadiusStr = tileData?.borderRadius ? `${scaleStr(tileData.borderRadius.tl)} ${scaleStr(tileData.borderRadius.tr)} ${scaleStr(tileData.borderRadius.br)} ${scaleStr(tileData.borderRadius.bl)}` : scaleStr(tileData?.rounded ?? 6);
                
                let clipPathStr = undefined;
                if (tile.cornerPolygon) {
                  const requestedRounded = tileData?.rounded ?? 6;
                  clipPathStr = `path('${getRoundedPolygonPath(tile.cornerPolygon, requestedRounded * sizeScale, polyW/2, polyH/2)}')`;
                }

                const renderLayers = (container?: any, onlyHandles: boolean = false) => {
                  
                const rawLayers = tileData?.layers || [];
                const layers = rawLayers.map(layer => {
                   const evaluatedLayer = { ...layer };
                   if (layer.bindings) {
                      Object.entries(layer.bindings).forEach(([field, propId]) => {
                         const val = tileData?.propertyValues?.[propId];
                         if (val !== undefined && val !== '') {
                            (evaluatedLayer as any)[field] = val;
                         } else {
                            const prop = boardVariables.flatMap((v: any) => v.properties || []).find((p: any) => p.id === propId);
                            if (prop?.defaultValue !== undefined) {
                               (evaluatedLayer as any)[field] = prop.defaultValue;
                            }
                         }
                      });
                   }
                   return evaluatedLayer;
                });

                  return layers.map(layer => {
                    const isLayerSelected = selectedLayerIds?.includes(layer.id);
                    if (onlyHandles && (!isLayerSelected || activeDesignTool !== 'Cursor' || boardSubTab !== 'Design')) return null;
                    if (onlyHandles) {
                      return (
                        <div key={`${layer.id}-handles`} id={`layer-handles-${tile.id}-${layer.id}`} className="absolute pointer-events-none border border-[#8B5CF6]" style={{ left: layer.x, top: layer.y, width: layer.width, height: layer.height, transform: `rotate(${layer.rotation}deg)`, borderWidth: `${1 / transform.scale}px` }}>
                          {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map(dir => {
                            const hSize = 7 / transform.scale;
                            const top = dir.includes('n') ? 0 : dir.includes('s') ? '100%' : '50%';
                            const left = dir.includes('w') ? 0 : dir.includes('e') ? '100%' : '50%';
                            const cursorMap: Record<string, string> = { nw: 'nwse', n: 'ns', ne: 'nesw', e: 'ew', se: 'nwse', s: 'ns', sw: 'nesw', w: 'ew' };
                            return (
                              <div key={dir} className="absolute bg-white border border-[#8B5CF6] pointer-events-auto"
                                style={{ width: hSize, height: hSize, top, left, transform: 'translate(-50%, -50%)', cursor: `${cursorMap[dir]}-resize`, borderWidth: `${1 / transform.scale}px` }}
                                onPointerDown={(e) => {
                                  if (e.button !== 0) return;
                                  e.stopPropagation();
                                  let currentDragData: any = null;
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
                                    const isCorner = dir.length === 2;
                                    if (dir.includes('e')) newW = Math.max(1, startW + rDx);
                                    if (dir.includes('s')) newH = Math.max(1, startH + rDy);
                                    if (dir.includes('w')) { newW = Math.max(1, startW - rDx); newX = startLayerX + (startW - newW); }
                                    if (dir.includes('n')) { newH = Math.max(1, startH - rDy); newY = startLayerY + (startH - newH); }
                                    if (ev.altKey && !isCorner) {
                                      if (dir === 'e') { newW = Math.max(1, startW + rDx * 2); newX = startLayerX - rDx; }
                                      if (dir === 'w') { newW = Math.max(1, startW - rDx * 2); }
                                      if (dir === 's') { newH = Math.max(1, startH + rDy * 2); newY = startLayerY - rDy; }
                                      if (dir === 'n') { newH = Math.max(1, startH - rDy * 2); }
                                    }
                                    if (ev.shiftKey && startH > 0 && startW > 0) {
                                      let useScaleX = true;
                                      if (dir.length === 1) {
                                        useScaleX = dir === 'e' || dir === 'w';
                                      } else {
                                        useScaleX = Math.abs((newW / startW) - 1) > Math.abs((newH / startH) - 1);
                                      }
                                      if (useScaleX) { newH = newW * (startH / startW); if (dir.includes('n')) newY = startLayerY + (startH - newH); } 
                                      else { newW = newH * (startW / startH); if (dir.includes('w')) newX = startLayerX + (startW - newW); }
                                    }
                                    let snapDx = 0, snapDy = 0;
                                    const rects = layers.map(l => ({ id: l.id, x: l.x, y: l.y, w: l.width, h: l.height }));
                                    const tileData = boardTilesData[tile.id];
                                    const finalW = tileData?.width ?? boardConfig?.tileWidth ?? 100;
                                    const finalH = tileData?.height ?? boardConfig?.tileHeight ?? 100;
                                    if (!tile.cornerPolygon) {
                                      rects.push({ id: 'container-bounds', x: 0, y: 0, w: finalW, h: finalH, isBounds: true });
                                      rects.push({ id: 'container-hcenter', x: finalW/2, y: 0, w: 0, h: finalH, isBounds: true });
                                      rects.push({ id: 'container-vcenter', x: 0, y: finalH/2, w: finalW, h: 0, isBounds: true });
                                    }
                                    const snapResult = computeSnaps(newX, newY, newW, newH, layer.id, rects, transform.scale, 5);
                                    if (!ev.altKey && !ev.shiftKey && !canvasSettings?.snapToGrid) {
                                      snapDx = snapResult.x - newX;
                                      snapDy = snapResult.y - newY;
                                      if (dir.includes('e')) newW += snapDx;
                                      if (dir.includes('w')) { newX += snapDx; newW -= snapDx; }
                                      if (dir.includes('s')) newH += snapDy;
                                      if (dir.includes('n')) { newY += snapDy; newH -= snapDy; }
                                    }

                                    if (canvasSettings?.snapToGrid) {
                                      newX = Math.round(newX); newY = Math.round(newY);
                                      newW = Math.max(1, Math.round(newW)); newH = Math.max(1, Math.round(newH));
                                    } else {
                                      newX = Math.round(newX * 1000) / 1000; newY = Math.round(newY * 1000) / 1000;
                                      newW = Math.max(1, Math.round(newW * 1000) / 1000); newH = Math.max(1, Math.round(newH * 1000) / 1000);
                                    }
                                    
                                    const bX = boardConfig?.boardX || 0;
                                    const bY = boardConfig?.boardY || 0;
                                    const offsetX = tile.x + bX - finalW/2;
                                    const offsetY = tile.y + bY - finalH/2;
                                    setActiveSnapLines(snapResult.lines.map((l: any) => ({
                                      ...l,
                                      x1: l.x1 + offsetX,
                                      y1: l.y1 + offsetY,
                                      x2: l.x2 + offsetX,
                                      y2: l.y2 + offsetY
                                    })));
                                    
                                    const layerEls = document.querySelectorAll(`[id="layer-${tile.id}-${layer.id}"]`);
                                    const handlesEls = document.querySelectorAll(`[id="layer-handles-${tile.id}-${layer.id}"]`);
                                    layerEls.forEach((el: any) => {
                                      el.style.left = `${newX}px`; el.style.top = `${newY}px`;
                                      el.style.width = `${newW}px`; el.style.height = `${newH}px`;
                                    });
                                    handlesEls.forEach((el: any) => {
                                      el.style.left = `${newX}px`; el.style.top = `${newY}px`;
                                      el.style.width = `${newW}px`; el.style.height = `${newH}px`;
                                    });
                                    currentDragData = { x: newX, y: newY, width: newW, height: newH };
                                  };
                                  const handleResizeUp = () => {
                                    window.removeEventListener('pointermove', handleResize);
                                    window.removeEventListener('pointerup', handleResizeUp);
                                    setActiveSnapLines([]);
                                    if (currentDragData) {
                                      const newLayers = [...layers];
                                      const lIndex = newLayers.findIndex(l => l.id === layer.id);
                                      if (lIndex >= 0) {
                                        const updatedLayer = { ...newLayers[lIndex], ...currentDragData };
                                        if (layer.type === 'image' && layer.imageMode === 'crop') {
                                          const scaleFactor = Math.max(currentDragData.width / startW, currentDragData.height / startH);
                                          updatedLayer.imageScale = Math.max(0.1, (layer.imageScale || 1) * scaleFactor);
                                        }
                                        newLayers[lIndex] = updatedLayer;
                                        onUpdateTile?.(tile.id, { layers: newLayers });
                                      }
                                    }
                                  };
                                  window.addEventListener('pointermove', handleResize);
                                  window.addEventListener('pointerup', handleResizeUp);
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
                        id={`layer-${tile.id}-${layer.id}`}
                        onPointerEnter={() => setHoveredLayerId(layer.id)}
                        onPointerLeave={() => setHoveredLayerId(null)}
                        className={`absolute border flex items-center justify-center cursor-pointer ${activeDesignTool !== 'Cursor' ? 'cursor-create' : altPressed ? 'cursor-duplicate' : ''} ${
                          boardSubTab === 'Design' && isSelected ? 'pointer-events-auto' : 'pointer-events-none'
                        } ${
                          isLayerSelected ? 'text-meevo-text-primary z-20' : 'border-transparent text-meevo-text-tertiary z-10'
                        }`}
                        style={{
                          left: layer.x, top: layer.y, width: layer.width, height: layer.height, transform: `rotate(${layer.rotation}deg)`,
                          fontSize: layer.typography?.size, fontFamily: layer.typography?.family, color: layer.type === 'text' ? (layer.fillColor || layer.typography?.color || '#FFFFFF') : (layer.typography?.color || '#FFFFFF'),
                          fontWeight: layer.typography?.weight, fontStyle: layer.typography?.style, textDecoration: layer.typography?.decoration,
                          backgroundColor: layer.type === 'text' ? 'transparent' : layer.fillColor,
                          borderColor: layer.strokeColor,
                          borderWidth: layer.strokeWidth,
                          opacity: layer.opacity !== undefined ? layer.opacity / 100 : 1,
                          borderRadius: `${layer.roundedTL ?? layer.rounded ?? 0}px ${layer.roundedTR ?? layer.rounded ?? 0}px ${layer.roundedBR ?? layer.rounded ?? 0}px ${layer.roundedBL ?? layer.rounded ?? 0}px`,
                        }}
                        onPointerDown={(e) => {
                          if (e.button !== 0) return;
                          if (boardSubTab !== 'Design') return;
                          e.stopPropagation();
                          
                          if (activeDesignTool === 'Cursor') {
                            let dragIds = e.shiftKey ? [...new Set([...(selectedLayerIds || []), layer.id])] : (selectedLayerIds?.includes(layer.id) ? (selectedLayerIds || []) : [layer.id]);
                            let finalLayers = [...layers];
                            if (e.altKey) {
                              const newLayerId = Date.now().toString() + Math.random().toString(36).substring(7);
                              const newLayer = { ...layer, id: newLayerId, name: layer.name + " (copy)" };
                              finalLayers = [...layers, newLayer];
                              onUpdateTile?.(tile.id, { layers: finalLayers });
                              dragIds = [newLayerId];
                              setSelectedLayerIds?.(dragIds);
                            } else {
                              setSelectedLayerIds?.(dragIds);
                            }
                            
                            const startPositions = dragIds.map(id => ({ id, x: finalLayers.find(l => l.id === id)?.x || 0, y: finalLayers.find(l => l.id === id)?.y || 0 }));
                            const currentDragData: Record<string, {x: number, y: number}> = {};
                            const startX = e.clientX, startY = e.clientY;

                            const handleMove = (ev: PointerEvent) => {
                              const rad = -(boardSubTab === 'Design' && isSelected ? 0 : tile.rotation) * Math.PI / 180;
                              const dxRaw = (ev.clientX - startX) / transform.scale;
                              const dyRaw = (ev.clientY - startY) / transform.scale;
                              const dx = dxRaw * Math.cos(rad) - dyRaw * Math.sin(rad);
                              const dy = dxRaw * Math.sin(rad) + dyRaw * Math.cos(rad);
                              
                              const mainPos = startPositions.find(p => p.id === (e.altKey ? dragIds[0] : layer.id)) || startPositions[0];
                              const newMainX = mainPos.x + dx;
                              const newMainY = mainPos.y + dy;
                              
                              const layerToDrag = finalLayers.find(l => l.id === mainPos.id) || layer;
                              const rects = finalLayers.map(l => ({ id: l.id, x: l.x, y: l.y, w: l.width, h: l.height }));
                              const tw = finalW;
                              const th = finalH;
                              if (!tile.cornerPolygon) {
                                rects.push({ id: 'container-bounds', x: 0, y: 0, w: tw, h: th, isBounds: true });
                                rects.push({ id: 'container-hcenter', x: tw/2, y: 0, w: 0, h: th, isBounds: true });
                                rects.push({ id: 'container-vcenter', x: 0, y: th/2, w: tw, h: 0, isBounds: true });
                              }

                              const snapResult = computeSnaps(newMainX, newMainY, layerToDrag.width, layerToDrag.height, mainPos.id, rects, transform.scale, 5);
                              const snapDx = snapResult.x - mainPos.x;
                              const snapDy = snapResult.y - mainPos.y;
                              
                              const bX = boardConfig?.boardX || 0;
                              const bY = boardConfig?.boardY || 0;
                              const offsetX = tile.x + bX - finalW/2;
                              const offsetY = tile.y + bY - finalH/2;
                              setActiveSnapLines(snapResult.lines.map(l => ({
                                ...l,
                                x1: l.x1 + offsetX,
                                y1: l.y1 + offsetY,
                                x2: l.x2 + offsetX,
                                y2: l.y2 + offsetY
                              })));
                              
                              startPositions.forEach(pos => {
                                let newX = pos.x + snapDx;
                                let newY = pos.y + snapDy;
                                if (canvasSettings?.snapToGrid) {
                                  newX = Math.round(newX); newY = Math.round(newY);
                                } else {
                                  newX = Math.round(newX * 1000) / 1000; newY = Math.round(newY * 1000) / 1000;
                                }
                                const layerEls = document.querySelectorAll(`[id="layer-${tile.id}-${pos.id}"]`);
                                const handlesEls = document.querySelectorAll(`[id="layer-handles-${tile.id}-${pos.id}"]`);
                                layerEls.forEach((el: any) => { el.style.left = `${newX}px`; el.style.top = `${newY}px`; });
                                handlesEls.forEach((el: any) => { el.style.left = `${newX}px`; el.style.top = `${newY}px`; });
                                currentDragData[pos.id] = { x: newX, y: newY };
                              });
                            };
                            const handleUp = () => {
                              window.removeEventListener('pointermove', handleMove);
                              window.removeEventListener('pointerup', handleUp);
                              setActiveSnapLines([]);
                              if (Object.keys(currentDragData).length > 0) {
                                const newLayers = [...finalLayers];
                                Object.keys(currentDragData).forEach(id => {
                                  const lIndex = newLayers.findIndex(l => l.id === id);
                                  if (lIndex >= 0) newLayers[lIndex] = { ...newLayers[lIndex], ...currentDragData[id] };
                                });
                                onUpdateTile?.(tile.id, { layers: newLayers });
                              }
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
                          {layer.type === 'text' && (
                            <span style={{ width: '100%', wordBreak: 'break-word', textAlign: layer.typography?.align || 'center' }}>
                              {layer.text}
                            </span>
                          )}
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
                    key={tile.id}
                    className={`absolute flex items-center justify-center text-xs font-bold cursor-pointer pointer-events-auto ${opacityClass} ${
                      isSelected ? 'text-meevo-text-primary z-10' : 'text-meevo-text-tertiary'
                    }`}
                    style={{
                      left: tile.x,
                      top: tile.y,
                      width: polyW,
                      height: polyH,
                      transform: `translate(-50%, -50%) rotate(${boardSubTab === 'Design' && isSelected ? 0 : tile.rotation}deg)`,
                      borderRadius: borderRadiusStr,
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setActiveTab?.('Board');
                      setBoardSubTab?.('Design');
                      setSelectedTileIds?.([tile.id]);
                    }}
                    onPointerDown={(e) => {
                      if (activeTab === 'Components') {
                        handleGroupDragStart(e);
                        return;
                      }
                      e.stopPropagation();
                      if (boardSubTab === 'Design') {
                        if (activeDesignTool && activeDesignTool !== 'Cursor') {
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          const clickX = (e.clientX - rect.left) / transform.scale;
                          const clickY = (e.clientY - rect.top) / transform.scale;
                          
                          if (activeDesignTool === 'Image') {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (ev) => {
                              const file = (ev.target as HTMLInputElement).files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const newLayer = {
                                    id: Date.now().toString(),
                                    type: 'image' as const,
                                    x: clickX,
                                    y: clickY,
                                    width: 100,
                                    height: 100,
                                    rotation: 0,
                                    opacity: 100,
                                    name: 'Image',
                                    src: event.target?.result as string,
                                    imageMode: 'fit' as const
                                  };
                                  
                                  const layers = tileData?.layers || [];

                                  onUpdateTile?.(tile.id, { layers: [...layers, newLayer] });
                                  setSelectedLayerIds?.([newLayer.id]);
                                  setActiveDesignTool?.('Cursor');
                                };
                                reader.readAsDataURL(file);
                              }
                            };
                            input.click();
                          } else {
                            const newLayer = {
                              id: Date.now().toString(),
                              type: activeDesignTool === 'Text' ? 'text' : 'rect' as any,
                              x: clickX,
                              y: clickY,
                              width: activeDesignTool === 'Text' ? 100 : 80,
                              height: activeDesignTool === 'Text' ? 40 : 80,
                              rotation: 0,
                              opacity: 100,
                              fillColor: '#000000',
                              strokeColor: '#000000',
                              strokeWidth: 0,
                              name: activeDesignTool,
                              text: activeDesignTool === 'Text' ? 'Text' : undefined,
                              sizingW: (activeDesignTool === 'Text' ? 'hug' : 'fixed') as 'hug' | 'fixed',
                              sizingH: (activeDesignTool === 'Text' ? 'hug' : 'fixed') as 'hug' | 'fixed',
                            };
                            
                            const layers = tileData?.layers || [];

                            onUpdateTile?.(tile.id, { layers: [...layers, newLayer] });
                            setSelectedLayerIds?.([newLayer.id]);
                            setActiveDesignTool?.('Cursor');
                          }
                          return;
                        }

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
                          setActiveSnapLines([]);
                        };
                        window.addEventListener('pointermove', handleMove);
                        window.addEventListener('pointerup', handleUp);
                      }
                    }}
                  >
                    <div className="absolute inset-0 pointer-events-none" style={{ ...bgStyle, borderRadius: borderRadiusStr, clipPath: clipPathStr }} />
                    {tileBoxShadow && !tile.cornerPolygon && (
                      <div className="absolute inset-0 pointer-events-none" style={{ borderRadius: borderRadiusStr,
                      clipPath: clipPathStr, boxShadow: tileBoxShadow }} />
                    )}
                    
                    {isDimmed && <div className="absolute inset-0 bg-[#000000]/60 pointer-events-none z-50" style={{ borderRadius: borderRadiusStr, clipPath: clipPathStr }} />}
                    
                    <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none" style={{ fontSize: `${Math.max(12, 16 * sizeScale)}px` }}>{boardSubTab !== 'Design' && tileName}</div>

                    {(tileData?.clipOutsideOpacity ?? 0) > 0 && (
                      <div 
                        className="absolute inset-0 pointer-events-none" 
                        style={{ opacity: (tileData?.clipOutsideOpacity ?? 0) / 100, borderRadius: borderRadiusStr }}
                      >
                        <div className="absolute" style={{ left: (polyW - finalW)/2, top: (polyH - finalH)/2, width: finalW, height: finalH }}>
                          {renderLayers(undefined, false)}
                        </div>
                      </div>
                    )}

                    <div 
                      className="absolute inset-0 pointer-events-none" 
                      style={{ overflow: tile.cornerPolygon ? 'visible' : 'hidden', borderRadius: borderRadiusStr, clipPath: clipPathStr }}
                    >
                      <div className="absolute" style={{ left: (polyW - finalW)/2, top: (polyH - finalH)/2, width: finalW, height: finalH }}>
                        {renderLayers(undefined, false)}
                      </div>
                    </div>

                    {tileData?.strokeWidth && tile.cornerPolygon && (
                      <svg className="absolute pointer-events-none z-40" style={{ left: 0, top: 0, width: polyW, height: polyH, overflow: 'visible' }}>
                        <path d={getRoundedPolygonPath(tile.cornerPolygon, (tileData?.rounded ?? 6) * sizeScale, polyW/2, polyH/2)}
                              fill="none"
                              stroke={tileData?.strokeColor || '#000000'}
                              strokeWidth={tileData?.strokeWidth}
                        />
                      </svg>
                    )}

                    {boardSubTab === 'Design' && isSelected && tile.cornerPolygon && (
                      <svg className="absolute pointer-events-none z-50" style={{ left: 0, top: 0, width: polyW, height: polyH, overflow: 'visible' }}>
                        <path d={getRoundedPolygonPath(tile.cornerPolygon, (tileData?.rounded ?? 6) * sizeScale, polyW/2, polyH/2)}
                              fill="none"
                              stroke="#F0B100"
                              strokeWidth={3}
                              style={{ filter: 'drop-shadow(0 0 10px rgba(240, 177, 0, 0.5))' }}
                        />
                      </svg>
                    )}

                    <div 
                      className="absolute inset-0 pointer-events-none z-50"
                      style={{ borderRadius: borderRadiusStr }}
                    >
                      <div className="absolute" style={{ left: (polyW - finalW)/2, top: (polyH - finalH)/2, width: finalW, height: finalH }}>
                        {renderLayers(undefined, true)}
                      </div>
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
                            setActiveSnapLines([]);
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
                               }, true);
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

                {selectionBox && (
                  <div
                    className="absolute pointer-events-none z-[100] border border-meevo-purple bg-[#7315E6]/10"
                    style={{
                      left: Math.min(selectionBox.startX, selectionBox.currX),
                      top: Math.min(selectionBox.startY, selectionBox.currY),
                      width: Math.abs(selectionBox.currX - selectionBox.startX),
                      height: Math.abs(selectionBox.currY - selectionBox.startY),
                      borderWidth: `${1 / transform.scale}px`,
                    }}
                  />
                )}
            </div>
          </div>
      </div>

      {/* Floating UI Elements (Not Scaled) */}

        <div className="absolute bottom-4 left-4 z-10 pointer-events-none flex items-center gap-2">
          <div 
            className="bg-meevo-surface-2 border border-meevo-border text-meevo-text-secondary hover:text-meevo-text-primary text-xs px-3 py-1.5 rounded-md shadow-lg font-medium pointer-events-auto cursor-pointer transition-colors h-[40px] flex items-center justify-center"
            onClick={handleReset}
          >
            {Math.round(transform.scale * 100)}%
          </div>
          {boardSubTab === 'Design' && selectedTileIds.length === 1 && (
            <div 
              className="bg-meevo-surface-2 border border-meevo-border rounded-md shadow-lg flex items-center p-2 gap-3 pointer-events-auto h-[40px]"
              title="Controla la opacidad del contenido que desborda la casilla"
            >
               <span className="text-xs text-meevo-text-secondary whitespace-nowrap font-bold uppercase tracking-wider cursor-help">Outside Opacity</span>
               <div className="w-24">
                 <SegmentedSlider 
                   options={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]} 
                   value={boardTilesData[selectedTileIds[0]]?.clipOutsideOpacity ?? 0} 
                   handleWidthMultiplier={3}
                   onChange={(val) => onUpdateTile?.(selectedTileIds[0], { clipOutsideOpacity: val })}
                 />
               </div>
            </div>
          )}
        </div>

        <ZoomControls onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onUndo={onUndo} />
        <SnapGuides lines={activeSnapLines} distances={activeDistances} scale={transform.scale} transformObj={transform} />

        {(boardSubTab === 'Design' || boardSubTab === 'Table') && activeDesignTool && setActiveDesignTool && (
          <DesignToolbar 
            activeTool={activeDesignTool as DesignTool} 
            onChangeTool={setActiveDesignTool} 
            allowedTools={boardSubTab === 'Table' ? ['Cursor', 'Image'] : undefined}
          />
        )}

        {renameModal.open && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50" onPointerDown={e => e.stopPropagation()}>
            <div className="bg-meevo-surface-2 border border-meevo-border p-4 rounded-lg shadow-xl w-80">
              <h3 className="text-sm font-bold text-meevo-text-primary mb-4">Rename Layer</h3>
              <input 
                autoFocus
                type="text" 
                defaultValue={renameModal.defaultName}
                className="w-full bg-[#0C0C0E] border border-meevo-border text-sm text-meevo-text-primary px-3 py-2 rounded-md outline-none focus:border-meevo-purple mb-4"
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
                  className="px-3 py-1.5 text-xs text-meevo-text-secondary hover:text-meevo-text-primary"
                  onClick={() => setRenameModal(prev => ({ ...prev, open: false }))}
                >Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {activeTab === 'Board' && (
        <SubTabsNav
          tabs={[
            { id: 'Table', label: 'Table' },
            { id: 'Type Board', label: 'Type Board' },
            { id: 'Tiles', label: 'Tiles' },
            { id: 'Design', label: 'Design' }
          ]}
          activeTabId={boardSubTab}
          onChange={(id) => setBoardSubTab?.(id)}
        />
      )}
    </div>
  );
};







