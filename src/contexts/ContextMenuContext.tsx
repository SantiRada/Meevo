import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  contextType: 'canvas' | 'layer' | 'ui' | null;
  contextData?: any;
}

interface ContextMenuContextValue {
  menuState: ContextMenuState;
  openContextMenu: (x: number, y: number, contextType: ContextMenuState['contextType'], contextData?: any) => void;
  closeContextMenu: () => void;
}

const ContextMenuContext = createContext<ContextMenuContextValue | undefined>(undefined);

export const ContextMenuProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [menuState, setMenuState] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    contextType: null
  });

  const openContextMenu = useCallback((x: number, y: number, contextType: ContextMenuState['contextType'], contextData?: any) => {
    setMenuState({
      isOpen: true,
      x,
      y,
      contextType,
      contextData
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setMenuState(prev => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <ContextMenuContext.Provider value={{ menuState, openContextMenu, closeContextMenu }}>
      {children}
    </ContextMenuContext.Provider>
  );
};

export const useContextMenu = () => {
  const context = useContext(ContextMenuContext);
  if (!context) {
    throw new Error('useContextMenu must be used within a ContextMenuProvider');
  }
  return context;
};
