import React, { useRef, useState, useEffect } from 'react';
import type { CardDeckData, LayerData, CanvasSettings, BoardConfig } from '../../services/storage/types';
import { ZoomControls } from './ZoomControls';
import { computeSnaps, type SnapLine } from '../../utils/snapLogic';
import { SnapGuides } from './SnapGuides';
import { DesignToolbar, type DesignTool } from './DesignToolbar';
import { SegmentedSlider } from '../ui/SegmentedSlider';

interface CardsWorkspaceProps {
  boardDecksData: Record<string, CardDeckData>;
  selectedDeckId: string | null;
  selectedCardId: string | null;
  setSelectedCardId: (id: string | null) => void;
  onUpdateDecks: (decks: Record<string, CardDeckData>, silent?: boolean) => void;
  activeDesignTool?: string;
  setActiveDesignTool?: (tool: string) => void;
  selectedLayerIds?: string[];
  setSelectedLayerIds?: (ids: string[]) => void;
  canvasSettings?: CanvasSettings; boardConfig?: BoardConfig; onUpdateBoardConfig?: (config: BoardConfig, silent?: boolean) => void; setSelectedDeckId?: (id: string | null) => void; setCardsSubTab?: (tab: 'Decks' | 'Cards' | 'Layers') => void;
}

const FittedText: React.FC<{ layer: LayerData }> = ({ layer }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [fontSize, setFontSize] = useState(layer.typography?.size || 14);

  useEffect(() => {
    if (!layer.typography?.autoSize) {
      setFontSize(layer.typography?.size || 14);
      return;
    }
    
    if (!containerRef.current || !textRef.current) return;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    if (cw === 0 || ch === 0) return;

    let min = 2;
    let max = 500;
    let best = 2;

    while (min <= max) {
      const mid = Math.floor((min + max) / 2);
      textRef.current.style.fontSize = `${mid}px`;
      
      if (textRef.current.offsetWidth <= cw && textRef.current.offsetHeight <= ch) {
        best = mid;
        min = mid + 1;
      } else {
        max = mid - 1;
      }
    }
    
    setFontSize(best);
  }, [layer.text, layer.width, layer.height, layer.typography?.fontFamily, layer.typography?.weight, layer.typography?.autoSize, layer.typography?.size]);

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col pointer-events-none overflow-hidden"
      style={{
        alignItems: layer.typography?.alignH === 'left' ? 'flex-start' : layer.typography?.alignH === 'right' ? 'flex-end' : 'center',
        justifyContent: layer.typography?.alignV === 'top' ? 'flex-start' : layer.typography?.alignV === 'bottom' ? 'flex-end' : 'center',
      }}
    >
      <span ref={textRef} style={{ fontSize: `${fontSize}px`, whiteSpace: 'pre-wrap', wordBreak: 'break-word', textAlign: layer.typography?.alignH || 'center', lineHeight: 1.2 }}>
        {layer.text || 'Text'}
      </span>
    </div>
  );
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

export const CardsWorkspace: React.FC<CardsWorkspaceProps> = ({
  boardDecksData,
  selectedDeckId,
  selectedCardId,
  setSelectedCardId,
  onUpdateDecks,
  activeDesignTool,
  setActiveDesignTool,
  selectedLayerIds,
  setSelectedLayerIds,
  canvasSettings, setSelectedDeckId, setCardsSubTab
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 100, y: 100, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [draggingLayer, setDraggingLayer] = useState<{ id: string; startX: number; startY: number; initialX: number; initialY: number; allInitial?: {id: string, x: number, y: number}[]; duplicated?: boolean } | null>(null);
  const [resizingLayer, setResizingLayer] = useState<{ id: string; handle: string; startX: number; startY: number; initialX: number; initialY: number; initialW: number; initialH: number } | null>(null);
  const [draggingCard, setDraggingCard] = useState<{ id: string; startX: number; startY: number; initialX: number; initialY: number } | null>(null);
  const [resizingCard, setResizingCard] = useState<{ id: string; handle: string; startX: number; startY: number; initialX: number; initialY: number; initialW: number; initialH: number } | null>(null);
  const [snapGuides, setSnapGuides] = useState({ top: false, right: false, bottom: false, left: false });
  const [activeSnapLines, setActiveSnapLines] = useState<SnapLine[]>([]);
  const [activeDistances, setActiveDistances] = useState<{ id: string, x: number, y: number, value: number }[]>([]);
  const [selectionBox, setSelectionBox] = useState<{ startX: number, startY: number, currX: number, currY: number } | null>(null);
  const [hoveredLayerId, setHoveredLayerId] = useState<string | null>(null);
  const [altPressed, setAltPressed] = useState<boolean>(false);
  const [paddingFlash, setPaddingFlash] = useState(false);
  const paddingTimeoutRef = useRef<NodeJS.Timeout>();

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
    if (!altPressed || !selectedLayerIds || selectedLayerIds.length !== 1 || hoveredLayerId === selectedLayerIds[0]) {
      if (!altPressed) setActiveDistances([]);
      return;
    }
    
    if (selectedDeckId && selectedCardId) {
      const card = boardDecksData[selectedDeckId]?.cards[selectedCardId];
      if (!card || !card.layers) return;
      const source = card.layers.find(l => l.id === selectedLayerIds[0]);
      const target = card.layers.find(l => l.id === hoveredLayerId);
      
      if (source) {
        // card wrapper index 'i' is needed? Wait, card position is card.x, card.y. 
        // We can just find the actual x,y of the card to use as offset.
        // Actually, we can get card index to find x.
        const deck = boardDecksData[selectedDeckId];
        let cardIndex = Object.keys(deck.cards).indexOf(selectedCardId);
        if (cardIndex === -1) cardIndex = 0;
        let currentDeckY = 0;
        for (const d of Object.values(boardDecksData)) {
          if (d.id === selectedDeckId) break;
          let mdH = 0;
          Object.values(d.cards).forEach(c => mdH = Math.max(mdH, c.height));
          if (Object.values(d.cards).length > 0) currentDeckY += mdH + 120;
        }
        const offsetX = (card.x !== undefined ? card.x : (cardIndex * (card.width + 20))) + (card.padding || 0);
        const offsetY = (card.y !== undefined ? card.y : 0) + currentDeckY + (card.padding || 0);

        let dList: {id: string, x: number, y: number, value: number}[] = [];
        let newLines: any[] = [];
        
        const sX = source.x; const sY = source.y; 
        const sW = source.type === 'text' && source.sizingW === 'fill' ? card.width : (source.width || 0);
        const sH = source.type === 'text' && source.sizingH === 'fill' ? card.height : (source.height || 0);

        if (!target) {
          const tW = card.width - (card.padding || 0)*2;
          const tH = card.height - (card.padding || 0)*2;
          const topDist = Math.round(sY);
          const bottomDist = Math.round(tH - (sY + sH));
          const leftDist = Math.round(sX);
          const rightDist = Math.round(tW - (sX + sW));
          
          if (topDist > 0) {
            newLines.push({ id: 'bt', x1: sX + sW/2 + offsetX, y1: offsetY, x2: sX + sW/2 + offsetX, y2: sY + offsetY, type: 'v' });
            dList.push({ id: 'btd', x: sX + sW/2 + offsetX, y: sY/2 + offsetY, value: topDist });
          }
          if (bottomDist > 0) {
            newLines.push({ id: 'bb', x1: sX + sW/2 + offsetX, y1: sY + sH + offsetY, x2: sX + sW/2 + offsetX, y2: tH + offsetY, type: 'v' });
            dList.push({ id: 'bbd', x: sX + sW/2 + offsetX, y: sY + sH + bottomDist/2 + offsetY, value: bottomDist });
          }
          if (leftDist > 0) {
            newLines.push({ id: 'bl', x1: offsetX, y1: sY + sH/2 + offsetY, x2: sX + offsetX, y2: sY + sH/2 + offsetY, type: 'h' });
            dList.push({ id: 'bld', x: sX/2 + offsetX, y: sY + sH/2 + offsetY, value: leftDist });
          }
          if (rightDist > 0) {
            newLines.push({ id: 'br', x1: sX + sW + offsetX, y1: sY + sH/2 + offsetY, x2: tW + offsetX, y2: sY + sH/2 + offsetY, type: 'h' });
            dList.push({ id: 'brd', x: sX + sW + rightDist/2 + offsetX, y: sY + sH/2 + offsetY, value: rightDist });
          }
        } else {
          const tX = target.x; const tY = target.y; const tW = target.width || 0; const tH = target.height || 0;

        // Same distance logic as Workspace.tsx:
        // Horizontal dist (non-intersecting)
        if (sX > tX + tW || sX + sW < tX) {
           const dist = sX > tX + tW ? sX - (tX + tW) : tX - (sX + sW);
           const cx = sX > tX + tW ? tX + tW + dist/2 : sX + sW + dist/2;
           const cy = sY + sH/2;
           if (sX > tX + tW) {
             newLines.push({ id: 'hd', x1: tX + tW + offsetX, y1: cy + offsetY, x2: sX + offsetX, y2: cy + offsetY, type: 'h' });
             dList.push({ id: 'hdl', x: cx + offsetX, y: cy + offsetY, value: dist });
           } else {
             newLines.push({ id: 'hd', x1: sX + sW + offsetX, y1: cy + offsetY, x2: tX + offsetX, y2: cy + offsetY, type: 'h' });
             dList.push({ id: 'hdl', x: cx + offsetX, y: cy + offsetY, value: dist });
           }
        }
        // Vertical dist (non-intersecting)
        if (sY > tY + tH || sY + sH < tY) {
           const dist = sY > tY + tH ? sY - (tY + tH) : tY - (sY + sH);
           const cx = sX + sW/2;
           const cy = sY > tY + tH ? tY + tH + dist/2 : sY + sH + dist/2;
           if (sY > tY + tH) {
             newLines.push({ id: 'vd', x1: cx + offsetX, y1: tY + tH + offsetY, x2: cx + offsetX, y2: sY + offsetY, type: 'v' });
             dList.push({ id: 'vdl', x: cx + offsetX, y: cy + offsetY, value: dist });
           } else {
             newLines.push({ id: 'vd', x1: cx + offsetX, y1: sY + sH + offsetY, x2: cx + offsetX, y2: tY + offsetY, type: 'v' });
             dList.push({ id: 'vdl', x: cx + offsetX, y: cy + offsetY, value: dist });
           }
        }

        // Intersecting / Inside bounding box distances
        if (sX >= tX && sX + sW <= tX + tW && sY >= tY && sY + sH <= tY + tH) {
           const topDist = sY - tY;
           const bottomDist = (tY + tH) - (sY + sH);
           const leftDist = sX - tX;
           const rightDist = (tX + tW) - (sX + sW);
           
           if (topDist > 0) {
             newLines.push({ id: 't', x1: sX + sW/2 + offsetX, y1: tY + offsetY, x2: sX + sW/2 + offsetX, y2: sY + offsetY, type: 'v' });
             dList.push({ id: 'td', x: sX + sW/2 + offsetX, y: tY + topDist/2 + offsetY, value: topDist });
           }
           if (bottomDist > 0) {
             newLines.push({ id: 'b', x1: sX + sW/2 + offsetX, y1: sY + sH + offsetY, x2: sX + sW/2 + offsetX, y2: tY + tH + offsetY, type: 'v' });
             dList.push({ id: 'bd', x: sX + sW/2 + offsetX, y: sY + sH + bottomDist/2 + offsetY, value: bottomDist });
           }
           if (leftDist > 0) {
             newLines.push({ id: 'l', x1: tX + offsetX, y1: sY + sH/2 + offsetY, x2: sX + offsetX, y2: sY + sH/2 + offsetY, type: 'h' });
             dList.push({ id: 'ld', x: tX + leftDist/2 + offsetX, y: sY + sH/2 + offsetY, value: leftDist });
           }
           if (rightDist > 0) {
             newLines.push({ id: 'r', x1: sX + sW + offsetX, y1: sY + sH/2 + offsetY, x2: tX + tW + offsetX, y2: sY + sH/2 + offsetY, type: 'h' });
             dList.push({ id: 'rd', x: sX + sW + rightDist/2 + offsetX, y: sY + sH/2 + offsetY, value: rightDist });
           }
        }
        }
        
        setActiveSnapLines(newLines);
        setActiveDistances(dList);
      }
    }
  }, [altPressed, selectedLayerIds, hoveredLayerId, boardDecksData, selectedDeckId, selectedCardId]);

  // Flash padding guides when padding changes
  const currentPadding = selectedDeckId && selectedCardId ? boardDecksData[selectedDeckId]?.cards[selectedCardId]?.padding : undefined;
  useEffect(() => {
    if (currentPadding !== undefined) {
      setPaddingFlash(true);
      if (paddingTimeoutRef.current) clearTimeout(paddingTimeoutRef.current);
      paddingTimeoutRef.current = setTimeout(() => {
        setPaddingFlash(false);
      }, 1000);
    }
    return () => {
      if (paddingTimeoutRef.current) clearTimeout(paddingTimeoutRef.current);
    }
  }, [currentPadding]);

  useEffect(() => {
    const handleWheelNative = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const rect = containerRef.current!.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        setTransform(prev => {
          const newScale = Math.max(0.1, Math.min(8, prev.scale * scaleFactor));
          const newX = mouseX - (mouseX - prev.x) * (newScale / prev.scale);
          const newY = mouseY - (mouseY - prev.y) * (newScale / prev.scale);
          return { x: newX, y: newY, scale: newScale };
        });
      } else if (e.shiftKey) {
        setTransform(prev => ({
          ...prev,
          x: prev.x - e.deltaY,
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

      if (selectedCardId && selectedDeckId && selectedLayerIds && selectedLayerIds.length > 0) {
        const deck = boardDecksData[selectedDeckId];
        if (!deck) return;
        const card = deck.cards[selectedCardId];
        if (!card) return;

        if (e.key === 'Delete' || e.key === 'Backspace') {
          const newLayers = (card.layers || []).filter(l => !selectedLayerIds.includes(l.id));
          onUpdateDecks({
          ...boardDecksData,
          [selectedDeckId]: {
            ...deck,
            cards: { ...deck.cards, [selectedCardId]: { ...card, layers: newLayers } }
          }
        }, true);
          if (setSelectedLayerIds) setSelectedLayerIds([]);
          return;
        }

        if (e.ctrlKey && e.key === 'd') {
          e.preventDefault();
          const targetLayers = (card.layers || []).filter(l => selectedLayerIds.includes(l.id));
          const newLayers = [...(card.layers || [])];
          const newIds: string[] = [];
          targetLayers.forEach(l => {
            const newId = Date.now().toString() + Math.random().toString(36).substring(7);
            newIds.push(newId);
            newLayers.push({ ...l, id: newId, name: l.name + " (copy)", x: l.x + 10, y: l.y + 10 });
          });
          onUpdateDecks({
          ...boardDecksData,
          [selectedDeckId]: {
            ...deck,
            cards: { ...deck.cards, [selectedCardId]: { ...card, layers: newLayers } }
          }
        }, true);
          if (setSelectedLayerIds) setSelectedLayerIds(newIds);
          return;
        }

        if (e.key.startsWith('Arrow')) {
          e.preventDefault();
          const amount = (e.shiftKey && e.altKey) ? 100 : (e.shiftKey ? 10 : 1);
          let dx = 0, dy = 0;
          if (e.key === 'ArrowUp') dy = -amount;
          if (e.key === 'ArrowDown') dy = amount;
          if (e.key === 'ArrowLeft') dx = -amount;
          if (e.key === 'ArrowRight') dx = amount;

          const newLayers = (card.layers || []).map(l => {
            if (selectedLayerIds.includes(l.id)) {
              return { ...l, x: l.x + dx, y: l.y + dy };
            }
            return l;
          });

          onUpdateDecks({
          ...boardDecksData,
          [selectedDeckId]: {
            ...deck,
            cards: { ...deck.cards, [selectedCardId]: { ...card, layers: newLayers } }
          }
        }, true);
          return;
        }
      }
    };

    const container = containerRef.current;
      if (container) {
        container.addEventListener('wheel', handleWheelNative, { passive: false });
      }
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        if (container) {
          container.removeEventListener('wheel', handleWheelNative);
        }
        window.removeEventListener('keydown', handleKeyDown);
      };
    }, [selectedLayerIds, selectedCardId, selectedDeckId, boardDecksData, onUpdateDecks]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault();
      setIsPanning(true);
      containerRef.current?.setPointerCapture(e.pointerId);
    } else if (e.button === 0) {
      if (activeDesignTool && activeDesignTool !== 'Cursor' && selectedCardId && selectedDeckId) {
        // Create layer at click position relative to the card!
        // We need to compute coordinates. We'll handle tool creation clicking directly on the card instead.
      }

      // Deselect card if clicking on empty canvas
      if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('canvas-bg')) {
        setSelectedCardId(null);
        if (setSelectedLayerIds) setSelectedLayerIds([]);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanning) {
      setTransform(prev => ({
        ...prev,
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }));
      return;
    }

    if (!selectedCardId || !selectedDeckId) return;
    const deck = boardDecksData[selectedDeckId];
    if (!deck) return;
    const card = deck.cards[selectedCardId];
    if (!card) return;

    if (draggingCard) {
      const dx = (e.clientX - draggingCard.startX) / transform.scale;
      const dy = (e.clientY - draggingCard.startY) / transform.scale;
      
      onUpdateDecks({
        ...boardDecksData,
        [selectedDeckId]: {
          ...deck,
          cards: { ...deck.cards, [selectedCardId]: { ...card, x: draggingCard.initialX + dx, y: draggingCard.initialY + dy } }
        }
      });
    }

    if (resizingCard) {
      const dx = (e.clientX - resizingCard.startX) / transform.scale;
      const dy = (e.clientY - resizingCard.startY) / transform.scale;
      const { handle, initialX, initialY, initialW, initialH } = resizingCard;

      let newX = initialX;
      let newY = initialY;
      let newW = initialW;
      let newH = initialH;

      if (handle.includes('e')) newW = Math.max(20, initialW + dx);
      if (handle.includes('w')) {
        const deltaW = Math.max(-initialW + 20, dx);
        newW = initialW - deltaW;
        newX = initialX + deltaW;
      }
      if (handle.includes('s')) newH = Math.max(20, initialH + dy);
      if (handle.includes('n')) {
        const deltaH = Math.max(-initialH + 20, dy);
        newH = initialH - deltaH;
        newY = initialY + deltaH;
      }

      if (canvasSettings?.snapToGrid) {
        newX = Math.round(newX);
        newY = Math.round(newY);
        newW = Math.round(newW);
        newH = Math.round(newH);
      } else {
        newX = Math.round(newX * 1000) / 1000;
        newY = Math.round(newY * 1000) / 1000;
        newW = Math.round(newW * 1000) / 1000;
        newH = Math.round(newH * 1000) / 1000;
      }

      onUpdateDecks({
        ...boardDecksData,
        [selectedDeckId]: {
          ...deck,
          cards: { ...deck.cards, [selectedCardId]: { ...card, x: newX, y: newY, width: newW, height: newH } }
        }
      });
    }

    if (draggingLayer) {
      const dx = (e.clientX - draggingLayer.startX) / transform.scale;
      const dy = (e.clientY - draggingLayer.startY) / transform.scale;
      
      const layerToDrag = card.layers?.find(l => l.id === draggingLayer.id);
      let newX = draggingLayer.initialX + dx;
      let newY = draggingLayer.initialY + dy;

      if (canvasSettings?.snapToGrid) {
        newX = Math.round(newX);
        newY = Math.round(newY);
      } else {
        newX = Math.round(newX * 1000) / 1000;
        newY = Math.round(newY * 1000) / 1000;
      }
      
      const cardW = card.width;
      const cardH = card.height;
      
      if (layerToDrag) {
        const rects = [];
        (card.layers || []).forEach(l => {
          if (l.id !== draggingLayer.id) {
            const lw = l.type === 'text' && l.sizingW === 'fill' ? card.width : (l.type === 'text' && l.sizingW === 'hug' ? 0 : l.width || 0);
            const lh = l.type === 'text' && l.sizingH === 'fill' ? card.height : (l.type === 'text' && l.sizingH === 'hug' ? 0 : l.height || 0);
            rects.push({ id: l.id, x: l.x, y: l.y, w: lw, h: lh });
          }
        });
        
        rects.push({ id: 'container-bounds', x: 0, y: 0, w: cardW, h: cardH, isBounds: true });

        
        rects.push({ id: 'container-hcenter', x: cardW/2, y: 0, w: 0, h: cardH, isBounds: true });
        rects.push({ id: 'container-vcenter', x: 0, y: cardH/2, w: cardW, h: 0, isBounds: true });

        const snapResult = computeSnaps(newX, newY, layerToDrag.width || 0, layerToDrag.height || 0, draggingLayer.id, rects, transform.scale, 5);

        if (!e.altKey && !e.shiftKey) {
          newX = snapResult.x;
          newY = snapResult.y;
          if (canvasSettings?.snapToGrid) {
            newX = Math.round(newX); newY = Math.round(newY);
          } else {
            newX = Math.round(newX * 1000) / 1000; newY = Math.round(newY * 1000) / 1000;
          }
          const cardIndex = Object.keys(deck.cards).indexOf(selectedCardId);
          let currentDeckY = 0;
          for (const d of Object.values(boardDecksData)) {
            if (d.id === deck.id) break;
            let mdH = 0;
            Object.values(d.cards).forEach(c => mdH = Math.max(mdH, c.height));
            if (Object.values(d.cards).length > 0) currentDeckY += mdH + 120;
          }
          const offsetX = card.x !== undefined ? card.x : (cardIndex * (card.width + 20));
          const offsetY = (card.y !== undefined ? card.y : 0) + currentDeckY;
          setActiveSnapLines(snapResult.lines.map(l => ({
            ...l,
            x1: l.x1 + offsetX,
            y1: l.y1 + offsetY,
            x2: l.x2 + offsetX,
            y2: l.y2 + offsetY
          })));
        } else {
          setActiveSnapLines([]);
        }

        const snapThreshold = 5 / transform.scale;
      }

        const finalDx = newX - draggingLayer.initialX;
        const finalDy = newY - draggingLayer.initialY;

        const newLayers = (card.layers || []).map(l => {
          if (l.id === draggingLayer.id) {
             return { ...l, x: newX, y: newY };
          } else if (draggingLayer.allInitial?.some(p => p.id === l.id)) {
             const p = draggingLayer.allInitial.find(p => p.id === l.id)!;
             return { ...l, x: p.x + finalDx, y: p.y + finalDy };
          }
          return l;
        });

      onUpdateDecks({
          ...boardDecksData,
          [selectedDeckId]: {
            ...deck,
            cards: { ...deck.cards, [selectedCardId]: { ...card, layers: newLayers } }
          }
        }, true);
    }

    if (resizingLayer) {
      let dx = (e.clientX - resizingLayer.startX) / transform.scale;
      let dy = (e.clientY - resizingLayer.startY) / transform.scale;

      if (e.shiftKey && resizingLayer.initialH !== 0) {
        const ratio = resizingLayer.initialW / resizingLayer.initialH;
        // ensure dx and dy maintain the aspect ratio
        if (Math.abs(dx) > Math.abs(dy * ratio)) {
          dy = (dx / ratio) * (Math.sign(dx) === Math.sign(dy) || dy===0 ? 1 : -1);
        } else {
          dx = (dy * ratio) * (Math.sign(dx) === Math.sign(dy) || dx===0 ? 1 : -1);
        }
      }

      let newX = resizingLayer.initialX;
      let newY = resizingLayer.initialY;
      let newW = resizingLayer.initialW;
      let newH = resizingLayer.initialH;

      if (e.altKey) {
        if (resizingLayer.handle.includes('e')) { newW = resizingLayer.initialW + dx * 2; newX = resizingLayer.initialX - dx; }
        if (resizingLayer.handle.includes('w')) { newW = resizingLayer.initialW - dx * 2; newX = resizingLayer.initialX + dx; }
        if (resizingLayer.handle.includes('s')) { newH = resizingLayer.initialH + dy * 2; newY = resizingLayer.initialY - dy; }
        if (resizingLayer.handle.includes('n')) { newH = resizingLayer.initialH - dy * 2; newY = resizingLayer.initialY + dy; }
      } else {
        if (resizingLayer.handle.includes('e')) newW = resizingLayer.initialW + dx;
        if (resizingLayer.handle.includes('s')) newH = resizingLayer.initialH + dy;
        if (resizingLayer.handle.includes('w')) {
          newW = resizingLayer.initialW - dx;
          newX = resizingLayer.initialX + dx;
        }
        if (resizingLayer.handle.includes('n')) {
          newH = resizingLayer.initialH - dy;
          newY = resizingLayer.initialY + dy;
        }
      }

      const cardW = card.width;
      const cardH = card.height;
      const rects = [];
      (card.layers || []).forEach(l => {
        if (l.id !== resizingLayer.id) {
          const lw = l.type === 'text' && l.sizingW === 'fill' ? card.width : (l.type === 'text' && l.sizingW === 'hug' ? 0 : l.width || 0);
          const lh = l.type === 'text' && l.sizingH === 'fill' ? card.height : (l.type === 'text' && l.sizingH === 'hug' ? 0 : l.height || 0);
          rects.push({ id: l.id, x: l.x, y: l.y, w: lw, h: lh });
        }
      });
      rects.push({ id: 'container-bounds', x: 0, y: 0, w: cardW, h: cardH, isBounds: true });

      rects.push({ id: 'container-hcenter', x: cardW/2, y: 0, w: 0, h: cardH, isBounds: true });
      rects.push({ id: 'container-vcenter', x: 0, y: cardH/2, w: cardW, h: 0, isBounds: true });

      const snapResult = computeSnaps(newX, newY, newW, newH, resizingLayer.id, rects, transform.scale, 5);

      if (!e.altKey && !e.shiftKey && !canvasSettings?.snapToGrid) {
        const snapDx = snapResult.x - newX;
        const snapDy = snapResult.y - newY;
        if (resizingLayer.handle.includes('e')) newW += snapDx;
        if (resizingLayer.handle.includes('s')) newH += snapDy;
        if (resizingLayer.handle.includes('w')) { newW -= snapDx; newX += snapDx; }
        if (resizingLayer.handle.includes('n')) { newH -= snapDy; newY += snapDy; }
        const cardIndex = Object.keys(deck.cards).indexOf(selectedCardId);
        const offsetX = card.x !== undefined ? card.x : (cardIndex * (card.width + 20));
        const offsetY = card.y !== undefined ? card.y : 0;
        setActiveSnapLines(snapResult.lines.map(l => ({
          ...l,
          x1: l.x1 + offsetX,
          y1: l.y1 + offsetY,
          x2: l.x2 + offsetX,
          y2: l.y2 + offsetY
        })));
      } else {
        setActiveSnapLines([]);
      }

      if (canvasSettings?.snapToGrid) {
        newX = Math.round(newX);
        newY = Math.round(newY);
        newW = Math.round(Math.max(1, newW));
        newH = Math.round(Math.max(1, newH));
      } else {
        newW = Math.max(1, newW);
        newH = Math.max(1, newH);
        newX = Math.round(newX * 1000) / 1000;
        newY = Math.round(newY * 1000) / 1000;
        newW = Math.round(newW * 1000) / 1000;
        newH = Math.round(newH * 1000) / 1000;
      }

      const newLayers = (card.layers || []).map(l => 
        l.id === resizingLayer.id ? { ...l, x: newX, y: newY, width: newW, height: newH, sizingW: 'fixed' as const, sizingH: 'fixed' as const } : l
      );

      onUpdateDecks({
          ...boardDecksData,
          [selectedDeckId]: {
            ...deck,
            cards: { ...deck.cards, [selectedCardId]: { ...card, layers: newLayers } }
          }
        }, true);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsPanning(false);
    setDraggingLayer(null);
    setResizingLayer(null);
    setDraggingCard(null);
    setResizingCard(null);
    setSnapGuides({ top: false, right: false, bottom: false, left: false });
      setActiveSnapLines([]);
    containerRef.current?.releasePointerCapture(e.pointerId);
  };

  const handleToolbarChange = (tool: DesignTool) => {
    if (setActiveDesignTool) setActiveDesignTool(tool);
  };

  const hexToRgba = (hex: string, opacity: number) => {
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

  let currentY = 0;

  useEffect(() => {
    const handleZoomEvent = (e: Event) => {
      const type = (e as CustomEvent).detail;
      if (type === 'in') setTransform(prev => ({ ...prev, scale: Math.min(8, prev.scale * 1.2) }));
      else if (type === 'out') setTransform(prev => ({ ...prev, scale: Math.max(0.1, prev.scale / 1.2) }));
      else if (type === 'reset') setTransform(prev => ({ ...prev, scale: 1 }));
    };
    window.addEventListener('meevo-zoom', handleZoomEvent);
    return () => window.removeEventListener('meevo-zoom', handleZoomEvent);
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full overflow-hidden relative select-none canvas-bg ${activeDesignTool !== 'Cursor' ? 'cursor-create' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{
        backgroundColor: canvasSettings?.fill || 'var(--color-canvas-bg)'
      }}
    >
      {/* Dots Background */}
      {canvasSettings?.viewGrid && (() => {
        const baseGridSize = 20;
        const scaleFactor = transform.scale < 0.3 ? 10 : 1;
        const gridSize = baseGridSize * scaleFactor;
        
        return (
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: `radial-gradient(${getGridColor(canvasSettings?.fill, canvasSettings?.gridOpacityCards)} 1px, transparent 1px)`,
            backgroundSize: `${gridSize * transform.scale}px ${gridSize * transform.scale}px`,
            backgroundPosition: `${transform.x}px ${transform.y}px`
          }} />
        );
      })()}

      {/* Toolbar Area */}
      <DesignToolbar 
        activeTool={(activeDesignTool as DesignTool) || 'Cursor'} 
        onChangeTool={handleToolbarChange} 
      />

      <ZoomControls 
        onZoomIn={() => setTransform(prev => ({ ...prev, scale: Math.min(8, prev.scale * 1.2) }))} 
        onZoomOut={() => setTransform(prev => ({ ...prev, scale: Math.max(0.1, prev.scale / 1.2) }))}
        onUndo={() => {
          const e = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true });
          window.dispatchEvent(e);
        }}
      />
      
      <div 
        className="absolute origin-top-left pointer-events-none"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        }}
      >
        {Object.values(boardDecksData).map((deck) => {
          const cardsArray = Object.values(deck.cards);
          if (cardsArray.length === 0) return null;

          let currentX = 0;
          let maxH = 0;

          const row = (
            <div key={deck.id} className="absolute pointer-events-auto" style={{ top: currentY, left: 0 }}>
              {/* Deck Name (Hidden to use combination) */}

              {cardsArray.map((card, i) => {
                maxH = Math.max(maxH, card.height);
                const xPos = currentX;
                currentX += card.width + 20;

                const rTL = card.roundedTL ?? card.rounded ?? 0;
                const rTR = card.roundedTR ?? card.rounded ?? 0;
                const rBL = card.roundedBL ?? card.rounded ?? 0;
                const rBR = card.roundedBR ?? card.rounded ?? 0;
                
                const isSelected = selectedCardId === card.id;

                return (
                  <div
                    key={card.id}
                    className="absolute"
                    style={{
                      left: card.x !== undefined ? card.x : (i * (card.width + 20)),
                      top: card.y !== undefined ? card.y : 0,
                      width: card.width,
                      height: card.height,
                    }}
                  >
                    {/* Card Title above the card */}
                    <div className="absolute -top-6 left-0 right-0 text-center text-meevo-text-secondary font-bold text-xs truncate pointer-events-none">
                      {deck.name} / {card.name}
                    </div>
                    
                    <div
                      className={`w-full h-full relative transition-shadow pointer-events-auto ${isSelected ? 'ring-2 ring-meevo-purple shadow-xl' : 'shadow-lg hover:ring-1 hover:ring-meevo-purple/50'}`}
                      style={{
                        backgroundColor: card.fillColor || '#FFFFFF',
                        border: card.strokeWidth ? `${card.strokeWidth}px solid ${card.strokeColor || '#000000'}` : undefined,
                        borderRadius: `${rTL}px ${rTR}px ${rBR}px ${rBL}px`,
                        padding: `${card.padding || 0}px`
                      }}
                        onPointerDown={(e) => {
                          if (e.button !== 0) return;
                          e.stopPropagation();
                          setSelectedCardId(card.id);
                          if (setSelectedDeckId) setSelectedDeckId(deck.id);
                          if (setCardsSubTab) setCardsSubTab('Layers');
                          
                          if (activeDesignTool === 'Cursor') {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const startX = (e.clientX - rect.left) / transform.scale;
                            const startY = (e.clientY - rect.top) / transform.scale;
                            setSelectionBox({ startX, startY, currX: startX, currY: startY });
                            const initialSelected = e.shiftKey && selectedLayerIds && isSelected ? [...selectedLayerIds] : [];
                            if (!e.shiftKey && setSelectedLayerIds) setSelectedLayerIds([]);
                            
                            const handleMove = (ev: PointerEvent) => {
                              const currX = (ev.clientX - rect.left) / transform.scale;
                              const currY = (ev.clientY - rect.top) / transform.scale;
                              setSelectionBox(prev => prev ? { ...prev, currX, currY } : null);
                              const minX = Math.min(startX, currX);
                              const maxX = Math.max(startX, currX);
                              const minY = Math.min(startY, currY);
                              const maxY = Math.max(startY, currY);
                              
                              const newlySelected = (card.layers || []).filter(l => {
                                const lw = l.type === 'text' && l.sizingW === 'fill' ? card.width : (l.type === 'text' && l.sizingW === 'hug' ? 0 : l.width || 0);
                                const lh = l.type === 'text' && l.sizingH === 'fill' ? card.height : (l.type === 'text' && l.sizingH === 'hug' ? 0 : l.height || 0);
                                return l.x < maxX && l.x + lw > minX && l.y < maxY && l.y + lh > minY;
                              }).map(l => l.id);
                              if (setSelectedLayerIds) setSelectedLayerIds(Array.from(new Set([...initialSelected, ...newlySelected])));
                            };
                            
                            const handleUp = () => {
                              setSelectionBox(null);
                              window.removeEventListener('pointermove', handleMove);
                              window.removeEventListener('pointerup', handleUp);
                            };
                            window.addEventListener('pointermove', handleMove);
                            window.addEventListener('pointerup', handleUp);
                          } else {
                              setDraggingCard({ id: card.id, startX: e.clientX, startY: e.clientY, initialX: card.x !== undefined ? card.x : currentX, initialY: card.y !== undefined ? card.y : 0 });
                              containerRef.current?.setPointerCapture(e.pointerId);
                            }
                          // Create layer if tool is active
                        if (activeDesignTool && activeDesignTool !== 'Cursor' && selectedDeckId) {
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
                                    x: clickX,
                                    y: clickY,
                                    width: 150,
                                    height: 150,
                                    rotation: 0,
                                    opacity: 100,
                                    fillColor: '#000000',
                                    strokeColor: '#000000',
                                    strokeWidth: 0,
                                    name: 'Image',
                                    src: event.target?.result as string,
                                    imageMode: 'fill' as const,
                                    sizingW: 'fixed' as const,
                                    sizingH: 'fixed' as const
                                  };
                                  onUpdateDecks({
                                    ...boardDecksData,
                                    [selectedDeckId]: {
                                      ...deck,
                                      cards: {
                                        ...deck.cards,
                                        [card.id]: {
                                          ...card,
                                          layers: [...(card.layers || []), newLayer]
                                        }
                                      }
                                    }
                                  });
                                  if (setSelectedLayerIds) setSelectedLayerIds([newLayer.id]);
                                  if (setActiveDesignTool) setActiveDesignTool('Cursor');
                                };
                                reader.readAsDataURL(file);
                              } else {
                                if (setActiveDesignTool) setActiveDesignTool('Cursor');
                              }
                            };
                            input.click();
                            return;
                          }

                          const newLayer = {
                            id: Date.now().toString(),
                            type: activeDesignTool === 'Text' ? 'text' as const : 'rect' as const,
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

                          onUpdateDecks({
                            ...boardDecksData,
                            [selectedDeckId]: {
                              ...deck,
                              cards: {
                                ...deck.cards,
                                [card.id]: {
                                  ...card,
                                  layers: [...(card.layers || []), newLayer]
                                }
                              }
                            }
                          });
                          if (setSelectedLayerIds) setSelectedLayerIds([newLayer.id]);
                          if (setActiveDesignTool) setActiveDesignTool('Cursor');
                        }
                      }}
                    >
                        {/* Layers wrapper clipped to card bounds */}
                        <div className="absolute overflow-hidden pointer-events-none" style={{ top: 0, left: 0, right: 0, bottom: 0, borderRadius: card.roundedCorners ? `${card.roundedCorners.tl}px ${card.roundedCorners.tr}px ${card.roundedCorners.br}px ${card.roundedCorners.bl}px` : undefined }}>
                          {/* Render custom layers */}
                          {(card.layers || []).map((layer) => {
                            const isLayerSelected = selectedLayerIds?.includes(layer.id);
                            return (
                              <div
                                key={layer.id}
                                id={`layer-${layer.id}`}
                                onPointerEnter={() => setHoveredLayerId(layer.id)}
                                onPointerLeave={() => setHoveredLayerId(null)}
                                className={`absolute outline-none pointer-events-auto ${activeDesignTool !== 'Cursor' ? 'cursor-create' : altPressed ? 'cursor-duplicate' : (isLayerSelected ? 'cursor-move' : '')} ${isLayerSelected ? 'ring-1 ring-meevo-purple' : ''}`}
                                style={{
                                  left: layer.x,
                                  top: layer.y,
                                  width: layer.sizingW === 'fill' ? '100%' : layer.sizingW === 'hug' ? 'max-content' : layer.width,
                                  height: layer.sizingH === 'fill' ? '100%' : layer.sizingH === 'hug' ? 'max-content' : layer.height,
                                  transform: `rotate(${layer.rotation || 0}deg)`,
                                  opacity: (layer.opacity ?? 100) / 100,
                                  backgroundColor: layer.type !== 'text' ? (layer.fillColor || 'transparent') : undefined,
                                border: layer.strokeWidth ? `${layer.strokeWidth}px solid ${layer.strokeColor}` : undefined,
                                borderRadius: `${layer.roundedTL ?? layer.rounded ?? 0}px ${layer.roundedTR ?? layer.rounded ?? 0}px ${layer.roundedBR ?? layer.rounded ?? 0}px ${layer.roundedBL ?? layer.rounded ?? 0}px`,
                                pointerEvents: 'auto',
                                color: layer.type === 'text' ? layer.fillColor : undefined,
                                fontWeight: layer.type === 'text' ? (layer.typography?.weight === 'Bold' ? 700 : layer.typography?.weight === 'Medium' ? 500 : layer.typography?.weight === 'Light' ? 300 : 400) : undefined,
                                fontFamily: layer.type === 'text' ? (layer.typography?.fontFamily || 'Inter') : undefined,
                                textAlign: layer.type === 'text' ? (layer.typography?.alignH || 'center') : undefined,
                              }}
                            onPointerDown={(e) => {
                                if (e.button !== 0) return;
                                e.stopPropagation();
                                setSelectedCardId(card.id);
                                if (setSelectedDeckId) setSelectedDeckId(deck.id);
                                if (setCardsSubTab) setCardsSubTab('Layers');
                                if (setSelectedLayerIds) {
                                  if (e.shiftKey) {
                                    if (selectedLayerIds?.includes(layer.id)) {
                                      setSelectedLayerIds(selectedLayerIds.filter(id => id !== layer.id));
                                    } else {
                                      setSelectedLayerIds([...(selectedLayerIds || []), layer.id]);
                                    }
                                  } else {
                                    if (!selectedLayerIds?.includes(layer.id)) {
                                      setSelectedLayerIds([layer.id]);
                                    }
                                  }
                                }
                                
                                if (activeDesignTool === 'Cursor') {
                                  let dragLayerId = layer.id;
                                  let finalLayers = card.layers || [];
                                  
                                  if (e.altKey) {
                                    const newLayerId = Date.now().toString() + Math.random().toString(36).substring(7);
                                    const newLayer = { ...layer, id: newLayerId, name: layer.name + " (copy)" };
                                    finalLayers = [...finalLayers, newLayer];
                                    dragLayerId = newLayerId;
                                    
                                    if (setSelectedLayerIds) setSelectedLayerIds([newLayerId]);
                                    
                                    if (onUpdateDecks) onUpdateDecks({
                                      ...boardDecksData,
                                      [selectedDeckId!]: {
                                        ...deck,
                                        cards: { ...deck.cards, [card.id]: { ...card, layers: finalLayers } }
                                      }
                                    });
                                  }
                                  
                                  const currentSelection = selectedLayerIds?.includes(layer.id) ? (selectedLayerIds || []) : [layer.id];
                                  const allInit = finalLayers.filter(l => currentSelection.includes(l.id) || l.id === dragLayerId).map(l => ({id: l.id, x: l.x, y: l.y}));
                                  setDraggingLayer({ id: dragLayerId, startX: e.clientX, startY: e.clientY, initialX: layer.x, initialY: layer.y, allInitial: allInit, duplicated: e.altKey });
                                  containerRef.current?.setPointerCapture(e.pointerId);
                                }
                            }}
                          >
                                                      {layer.type === 'text' && (
                                <FittedText layer={layer} />
                              )}
                            {layer.type === 'image' && (
                              <div className="w-full h-full flex items-center justify-center text-meevo-text-secondary bg-meevo-surface-2/50 pointer-events-none">
                                Img
                              </div>
                            )}

                            {/* Handles */}
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
                                        if (e.button !== 0) return;
                                        e.stopPropagation();
                                        setResizingLayer({
                                          id: layer.id,
                                          handle: dir,
                                          startX: e.clientX,
                                          startY: e.clientY,
                                          initialX: layer.x,
                                          initialY: layer.y,
                                          initialW: layer.width,
                                          initialH: layer.height
                                        });
                                        containerRef.current?.setPointerCapture(e.pointerId);
                                      }}
                                    />
                                  );
                                })}
                              </>
                            )}
                          </div>
                        );
                      })}
                      </div>
                          {isSelected && selectionBox && (
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
                          
                          {(card.clipOutsideOpacity ?? 0) > 0 && (
                            <div 
                              className="absolute pointer-events-none z-10" 
                              style={{
                                opacity: (card.clipOutsideOpacity ?? 0) / 100,
                                left: -1000, top: -1000, right: -1000, bottom: -1000,
                                overflow: 'hidden'
                              }}
                            >
                              <div className="absolute" style={{ left: 1000, top: 1000, width: card.width, height: card.height }}>
                                {(card.layers || []).map((layer) => {
                                  // Simplified render for outside bleeding
                                  const isText = layer.type === 'text';
                                  const finalW = isText && layer.sizingW === 'fill' ? card.width : (isText && layer.sizingW === 'hug' ? undefined : layer.width);
                                  const finalH = isText && layer.sizingH === 'fill' ? card.height : (isText && layer.sizingH === 'hug' ? undefined : layer.height);
                                  
                                  return (
                                    <div
                                      key={`out-${layer.id}`}
                                      className="absolute"
                                      style={{
                                        left: layer.x, top: layer.y, width: finalW, height: finalH,
                                        transform: layer.rotation ? `rotate(${layer.rotation}deg)` : undefined,
                                        backgroundColor: layer.type !== 'text' ? (layer.fillColor || 'transparent') : undefined,
                                        border: layer.strokeWidth ? `${layer.strokeWidth}px solid ${layer.strokeColor}` : undefined,
                                        borderRadius: `${layer.roundedTL ?? layer.rounded ?? 0}px ${layer.roundedTR ?? layer.rounded ?? 0}px ${layer.roundedBR ?? layer.rounded ?? 0}px ${layer.roundedBL ?? layer.rounded ?? 0}px`,
                                        color: layer.type === 'text' ? layer.fillColor : undefined,
                                        fontWeight: layer.type === 'text' ? (layer.typography?.weight === 'Bold' ? 700 : layer.typography?.weight === 'Medium' ? 500 : layer.typography?.weight === 'Light' ? 300 : 400) : undefined,
                                        fontFamily: layer.type === 'text' ? (layer.typography?.fontFamily || 'Inter') : undefined,
                                        textAlign: layer.type === 'text' ? (layer.typography?.alignH || 'center') : undefined,
                                        opacity: (layer.opacity ?? 100) / 100,
                                      }}
                                    >
                                      {layer.type === 'text' ? <FittedText layer={layer} /> : layer.type === 'image' && layer.src && (
                                        <img src={layer.src} alt="" className="w-full h-full" style={{ objectFit: layer.imageMode || 'cover' }} />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                      {/* Padding Guides */}
                      {isSelected && card.padding !== undefined && card.padding > 0 && (
                        <div className="absolute pointer-events-none" style={{ inset: 0 }}>
                          {/* Top guide */}
                          {(paddingFlash || snapGuides.top) && <div className="absolute bg-orange-500" style={{ top: card.padding, left: 0, right: 0, height: 1 }} />}
                          {/* Bottom guide */}
                          {(paddingFlash || snapGuides.bottom) && <div className="absolute bg-orange-500" style={{ bottom: card.padding, left: 0, right: 0, height: 1 }} />}
                          {/* Left guide */}
                          {(paddingFlash || snapGuides.left) && <div className="absolute bg-orange-500" style={{ left: card.padding, top: 0, bottom: 0, width: 1 }} />}
                          {/* Right guide */}
                          {(paddingFlash || snapGuides.right) && <div className="absolute bg-orange-500" style={{ right: card.padding, top: 0, bottom: 0, width: 1 }} />}
                        </div>
                      )}

                      {/* Card Handles */}
                      {isSelected && (!selectedLayerIds || selectedLayerIds.length === 0) && activeDesignTool === 'Cursor' && (
                        <>
                          {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map(dir => {
                            const hSize = Math.max(6, Math.min(12, 10 / transform.scale));
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
                                  if (e.button !== 0) return;
                                  e.stopPropagation();
                                  setResizingCard({
                                    id: card.id,
                                    handle: dir,
                                    startX: e.clientX,
                                    startY: e.clientY,
                                    initialX: card.x !== undefined ? card.x : currentX,
                                    initialY: card.y !== undefined ? card.y : 0,
                                    initialW: card.width,
                                    initialH: card.height
                                  });
                                  containerRef.current?.setPointerCapture(e.pointerId);
                                }}
                              />
                            );
                          })}
                        </>
                      )}

                    </div>
                  </div>
                );
              })}
            </div>
          );
          
          currentY += maxH + 120;
          return row;
        })}
      </div>
      
      <SnapGuides lines={activeSnapLines} scale={transform.scale} distances={activeDistances} transformObj={transform} />

      {/* Zoom indicator */}
      <div className="absolute bottom-4 left-4 z-20 flex gap-2 pointer-events-none">
        <div 
          className="bg-meevo-surface-2 border border-meevo-border text-meevo-text-secondary hover:text-meevo-text-primary text-xs px-3 py-1.5 rounded-md shadow-lg font-medium pointer-events-auto cursor-pointer transition-colors h-[40px] flex items-center justify-center"
          onClick={() => setTransform(prev => ({ ...prev, scale: 1 }))}
        >
          {Math.round(transform.scale * 100)}%
        </div>
        
        {selectedCardId && selectedDeckId && boardDecksData[selectedDeckId]?.cards[selectedCardId] && (
          <div 
            className="bg-meevo-surface-2 border border-meevo-border rounded-md shadow-lg flex items-center p-2 gap-3 pointer-events-auto h-[40px]"
            title="Controla la opacidad del contenido que desborda la casilla"
          >
             <span className="text-xs text-meevo-text-secondary whitespace-nowrap font-bold uppercase tracking-wider cursor-help">Outside Opacity</span>
             <div className="w-24">
               <SegmentedSlider 
                 options={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]} 
                 value={boardDecksData[selectedDeckId].cards[selectedCardId].clipOutsideOpacity ?? 0} 
                 handleWidthMultiplier={3}
                 onChange={(val) => {
                   const deck = boardDecksData[selectedDeckId];
                   const card = deck.cards[selectedCardId];
                   onUpdateDecks({
                     ...boardDecksData,
                     [selectedDeckId]: { ...deck, cards: { ...deck.cards, [selectedCardId]: { ...card, clipOutsideOpacity: val } } }
                   }, true);
                 }} 
               />
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
