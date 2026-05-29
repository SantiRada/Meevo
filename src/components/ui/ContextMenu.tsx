import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useContextMenu } from '../../contexts/ContextMenuContext';

interface ContextMenuProps {
  activeComponents: string[];
  activeTab: string;
  setActiveTab: (t: any) => void;
  boardSubTab: string;
  setBoardSubTab: (t: any) => void;
  cardsSubTab: string;
  setCardsSubTab: (t: any) => void;
  activeDesignTool: string;
  setActiveDesignTool: (t: any) => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  activeComponents,
  activeTab, setActiveTab,
  boardSubTab, setBoardSubTab,
  cardsSubTab, setCardsSubTab,
  activeDesignTool, setActiveDesignTool
}) => {
  const { menuState, closeContextMenu } = useContextMenu();
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useLayoutEffect(() => {
    if (menuState.isOpen) {
      setPosition({ x: menuState.x, y: menuState.y });
    }
  }, [menuState.isOpen, menuState.x, menuState.y]);

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      // Prevent instant close if it was just opened (e.g. right click pointerdown might fire weirdly on some OS)
      if (e.button === 2) return; // Don't close on right clicks anywhere, let onContextMenu handle reopening/moving
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeContextMenu();
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [closeContextMenu]);

  useLayoutEffect(() => {
    if (menuState.isOpen && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let newX = position.x;
      let newY = position.y;
      let changed = false;
      if (newX + rect.width > vw) { newX = vw - rect.width - 10; changed = true; }
      if (newY + rect.height > vh) { newY = vh - rect.height - 10; changed = true; }
      if (changed) setPosition({ x: newX, y: newY });
    }
  }, [position.x, position.y, menuState.isOpen]);

  if (!menuState.isOpen) return null;

  const handleAction = (action: () => void) => {
    action();
    closeContextMenu();
  };

  const dispatchZoom = (type: 'in' | 'out' | 'reset') => {
    window.dispatchEvent(new CustomEvent('meevo-zoom', { detail: type }));
  };

  const dispatchHistory = (type: 'undo' | 'redo') => {
    window.dispatchEvent(new CustomEvent('meevo-history', { detail: type }));
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-meevo-surface-1 border border-meevo-border rounded-lg shadow-xl py-1 w-64 text-sm flex flex-col"
      style={{ top: position.y, left: position.x }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Sector A: Navegacion Principal */}
      <div className="flex flex-col border-b border-meevo-border pb-1 mb-1">
        <div className="px-3 py-1 text-[11px] text-meevo-text-tertiary font-medium uppercase tracking-wider">Ir a</div>
        <button onClick={() => handleAction(() => setActiveTab('Components'))} className="flex justify-between items-center px-3 py-1.5 hover:bg-meevo-border/50 text-meevo-text-secondary hover:text-meevo-text-primary transition-colors text-left w-full">
          <span>Components</span>
          <span className="text-meevo-text-tertiary text-xs">1</span>
        </button>
        {[...activeComponents].sort().map((comp, idx) => (
          <button key={comp} onClick={() => handleAction(() => setActiveTab(comp))} className="flex justify-between items-center px-3 py-1.5 hover:bg-meevo-border/50 text-meevo-text-secondary hover:text-meevo-text-primary transition-colors text-left w-full">
            <span>{comp}</span>
            <span className="text-meevo-text-tertiary text-xs">{idx + 2}</span>
          </button>
        ))}
      </div>

      {/* Sector B: Navegacion Secundaria (Tabs actuales) */}
      {activeTab === 'Board' && (
        <div className="flex flex-col border-b border-meevo-border pb-1 mb-1">
          <div className="px-3 py-1 text-[11px] text-meevo-text-tertiary font-medium uppercase tracking-wider">Vistas de Board</div>
          {['Table', 'Type Board', 'Tiles', 'Design'].map((t, idx) => (
            <button key={t} onClick={() => handleAction(() => setBoardSubTab(t))} className="flex justify-between items-center px-3 py-1.5 hover:bg-meevo-border/50 text-meevo-text-secondary hover:text-meevo-text-primary transition-colors text-left w-full">
              <span className="flex items-center gap-2">
                <span>Ir a {t}</span>
                {boardSubTab === t && <div className="w-1.5 h-1.5 rounded-full bg-meevo-purple hover:bg-meevo-purple-active" />}
              </span>
              <span className="text-meevo-text-tertiary text-xs">Shift + {idx + 1}</span>
            </button>
          ))}
        </div>
      )}
      {activeTab === 'Cards' && (
        <div className="flex flex-col border-b border-meevo-border pb-1 mb-1">
          <div className="px-3 py-1 text-[11px] text-meevo-text-tertiary font-medium uppercase tracking-wider">Vistas de Cards</div>
          {['Decks', 'Cards', 'Layers'].map((t, idx) => (
            <button key={t} onClick={() => handleAction(() => setCardsSubTab(t))} className="flex justify-between items-center px-3 py-1.5 hover:bg-meevo-border/50 text-meevo-text-secondary hover:text-meevo-text-primary transition-colors text-left w-full">
              <span className="flex items-center gap-2">
                <span>Ir a {t}</span>
                {cardsSubTab === t && <div className="w-1.5 h-1.5 rounded-full bg-meevo-purple hover:bg-meevo-purple-active" />}
              </span>
              <span className="text-meevo-text-tertiary text-xs">Shift + {idx + 1}</span>
            </button>
          ))}
        </div>
      )}
      {activeTab === 'Dices' && (
        <div className="flex flex-col border-b border-meevo-border pb-1 mb-1">
          <div className="px-3 py-1 text-[11px] text-meevo-text-tertiary font-medium uppercase tracking-wider">Entornos de Dices</div>
          <button onClick={() => handleAction(() => window.dispatchEvent(new CustomEvent('meevo-dice-view', { detail: '2D' })))} className="flex justify-between items-center px-3 py-1.5 hover:bg-meevo-border/50 text-meevo-text-secondary hover:text-meevo-text-primary transition-colors text-left w-full">
            <span>Ir a entorno 2D</span>
            <span className="text-meevo-text-tertiary text-xs">Shift + 1</span>
          </button>
          <button onClick={() => handleAction(() => window.dispatchEvent(new CustomEvent('meevo-dice-view', { detail: '3D' })))} className="flex justify-between items-center px-3 py-1.5 hover:bg-meevo-border/50 text-meevo-text-secondary hover:text-meevo-text-primary transition-colors text-left w-full">
            <span>Ir a entorno 3D</span>
            <span className="text-meevo-text-tertiary text-xs">Shift + 2</span>
          </button>
        </div>
      )}

      {/* Sector C: Acciones Generales */}
      <div className="flex flex-col border-b border-meevo-border pb-1 mb-1">
        <button onClick={() => handleAction(() => dispatchZoom('in'))} className="flex justify-between items-center px-3 py-1.5 hover:bg-meevo-border/50 text-meevo-text-secondary hover:text-meevo-text-primary transition-colors text-left w-full">
          <span>Zoom In</span>
          <span className="text-meevo-text-tertiary text-xs">CTRL+SCROLL IN</span>
        </button>
        <button onClick={() => handleAction(() => dispatchZoom('out'))} className="flex justify-between items-center px-3 py-1.5 hover:bg-meevo-border/50 text-meevo-text-secondary hover:text-meevo-text-primary transition-colors text-left w-full">
          <span>Zoom Out</span>
          <span className="text-meevo-text-tertiary text-xs">CTRL+SCROLL OUT</span>
        </button>
        <button onClick={() => handleAction(() => dispatchZoom('reset'))} className="flex justify-between items-center px-3 py-1.5 hover:bg-meevo-border/50 text-meevo-text-secondary hover:text-meevo-text-primary transition-colors text-left w-full">
          <span>Reset Zoom</span>
          <span className="text-meevo-text-tertiary text-xs">Z</span>
        </button>
        <button onClick={() => handleAction(() => dispatchHistory('undo'))} className="flex justify-between items-center px-3 py-1.5 hover:bg-meevo-border/50 text-meevo-text-secondary hover:text-meevo-text-primary transition-colors text-left w-full mt-1">
          <span>Undo</span>
          <span className="text-meevo-text-tertiary text-xs">Ctrl + Z</span>
        </button>
        <button onClick={() => handleAction(() => dispatchHistory('redo'))} className="flex justify-between items-center px-3 py-1.5 hover:bg-meevo-border/50 text-meevo-text-secondary hover:text-meevo-text-primary transition-colors text-left w-full">
          <span>Redo</span>
          <span className="text-meevo-text-tertiary text-xs">Ctrl + Shift + Z</span>
        </button>
      </div>

      {/* Sector D: Contextuales (Canvas Tools) */}
      {menuState.contextType === 'canvas' && ((activeTab === 'Cards' && cardsSubTab === 'Layers') || (activeTab === 'Board' && boardSubTab === 'Design')) && (
        <div className="flex flex-col pt-1">
          <div className="px-3 py-1 text-[11px] text-meevo-text-tertiary font-medium uppercase tracking-wider">Herramientas</div>
          {[
            { id: 'Cursor', label: 'Cursor / Seleccionar', shortcut: 'V' },
            { id: 'Rectangle', label: 'Rectangulo', shortcut: 'R' },
            { id: 'Text', label: 'Texto', shortcut: 'T' },
            { id: 'Image', label: 'Imagen', shortcut: 'I' }
          ].map(tool => (
            <button key={tool.id} onClick={() => handleAction(() => setActiveDesignTool(tool.id))} className="flex justify-between items-center px-3 py-1.5 hover:bg-meevo-border/50 text-meevo-text-secondary hover:text-meevo-text-primary transition-colors text-left w-full">
              <span>{tool.label}</span>
              <span className="text-meevo-text-tertiary text-xs">{tool.shortcut}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
