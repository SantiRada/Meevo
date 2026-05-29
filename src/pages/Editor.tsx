import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EditorHeader } from '../components/editor/EditorHeader';
import { SettingsModal } from '../components/editor/SettingsModal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { SubTabsNav } from '../components/ui/SubTabsNav';
import { Sidebar } from '../components/editor/Sidebar';
import { ComponentsSidebar } from '../components/editor/ComponentsSidebar';
import { BoardSidebar } from '../components/editor/BoardSidebar';
import { TableSidebar } from '../components/editor/TableSidebar';
import { TilesSidebar } from '../components/editor/TilesSidebar';
import { PropertiesSidebar } from '../components/editor/PropertiesSidebar';
import { TileDetailSidebar } from '../components/editor/TileDetailSidebar';
import { LayersSidebar } from '../components/editor/LayersSidebar';
import { LayerDetailSidebar } from '../components/editor/LayerDetailSidebar';
import { Workspace } from '../components/editor/Workspace';
import { DicesSidebar } from '../components/editor/DicesSidebar';
import { DiceDetailSidebar } from '../components/editor/DiceDetailSidebar';
import { DicesWorkspace } from '../components/editor/DicesWorkspace';
import { DecksSidebar } from '../components/editor/DecksSidebar';
import { CardsSidebar } from '../components/editor/CardsSidebar';
import { CardDetailSidebar } from '../components/editor/CardDetailSidebar';
import { CardsWorkspace } from '../components/editor/CardsWorkspace';
import { useNotification } from '../contexts/NotificationContext';
import type { BoardConfig, BoardTileVariable, BoardTileData, LayerData, BoardTileComponent, DiceData, CardDeckData, CanvasSettings } from '../services/storage/types';
import type { DesignTool } from '../components/editor/DesignToolbar';

import { storage } from '../services/storage';
import { ContextMenu } from '../components/ui/ContextMenu';
import { useContextMenu } from '../contexts/ContextMenuContext';

export type ComponentType = 'Board' | 'Cards' | 'Dices' | 'Tokens' | 'Rules' | 'Manual';
export type BoardSubTab = 'Table' | 'Type Board' | 'Tiles' | 'Design';

export const Editor: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { openContextMenu } = useContextMenu();
  
  // Settings State
  const [activeComponents, setActiveComponents] = useState<ComponentType[]>([]);
  const [genders, setGenders] = useState<string[]>([]);
  const [boardConfig, setBoardConfig] = useState<BoardConfig | undefined>();
  const [boardVariables, setBoardVariables] = useState<BoardTileVariable[]>([]);
  const [boardTilesData, setBoardTilesData] = useState<Record<number, BoardTileData>>({});
  const [boardTileComponents, setBoardTileComponents] = useState<BoardTileComponent[]>([]);
  const [boardDicesData, setBoardDicesData] = useState<Record<string, DiceData>>({});
  const [selectedDiceId, setSelectedDiceId] = useState<string | null>(null);
  const [diceEditMode, setDiceEditMode] = useState<'Global' | 'Individual'>('Global');
  const [diceSelectedFace, setDiceSelectedFace] = useState<number>(1);

  // Canvas Settings State
  const [canvasSettings, setCanvasSettings] = useState<CanvasSettings>(() => {
    const saved = localStorage.getItem('meevo_canvas_settings');
    return saved ? JSON.parse(saved) : { fill: '', snapToGrid: true, viewGrid: true };
  });

  useEffect(() => {
    localStorage.setItem('meevo_canvas_settings', JSON.stringify(canvasSettings));
  }, [canvasSettings]);

  React.useEffect(() => {
    const handleThemeChange = () => {
      setCanvasSettings(prev => {
        if (prev?.fill) {
          return { ...prev, fill: '' };
        }
        return prev;
      });
    };
    window.addEventListener('theme-changed', handleThemeChange);
    return () => window.removeEventListener('theme-changed', handleThemeChange);
  }, []);

  // Cards State
  const [boardDecksData, setBoardDecksData] = useState<Record<string, CardDeckData>>({});
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [cardsSubTab, setCardsSubTab] = useState<'Decks' | 'Cards' | 'Layers'>('Decks');
  
  // History State for Tiles Data
  const [history, setHistory] = useState<Record<number, BoardTileData>[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [activeVariableId, setActiveVariableId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<string>('Components');
  const [boardSubTab, setBoardSubTab] = useState<BoardSubTab>('Type Board');
  const [selectedTileIds, setSelectedTileIds] = useState<number[]>([]);
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>([]);
  const [selectedTableLayerIds, setSelectedTableLayerIds] = useState<string[]>([]);
  const [activeDesignTool, setActiveDesignTool] = useState<DesignTool>('Cursor');
  const [autoSaveStatus, setAutoSaveStatus] = useState<'waiting' | 'loading' | 'saved'>('saved');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDeleteBoardModalOpen, setIsDeleteBoardModalOpen] = useState(false);
  
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      openContextMenu(e.clientX, e.clientY, 'canvas');
    };
    window.addEventListener('contextmenu', handleContextMenu);
    return () => window.removeEventListener('contextmenu', handleContextMenu);
  }, [openContextMenu]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === '`' || e.key === 'Dead' || e.code === 'Backquote') {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        e.preventDefault();
        setIsSettingsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    const loadDraft = async () => {
      if (name) {
        const isReady = await storage.isReady();
        if (!isReady) await storage.initialize();
        const draft = await storage.getDraft(name);
        if (draft) {
          if (draft.components) setActiveComponents(draft.components as ComponentType[]);
          if (draft.genders) setGenders(draft.genders);
          if (draft.boardConfig) setBoardConfig(draft.boardConfig);
          if (draft.boardVariables) setBoardVariables(draft.boardVariables);
          else if ((draft as any).boardProperties) setBoardVariables((draft as any).boardProperties); // migration
          if (draft.boardTileComponents) setBoardTileComponents(draft.boardTileComponents);
          if (draft.boardDicesData) setBoardDicesData(draft.boardDicesData);
          if (draft.boardDecksData) setBoardDecksData(draft.boardDecksData);
          if (draft.boardTilesData) {
            setBoardTilesData(draft.boardTilesData);
            setHistory([draft.boardTilesData]);
            setHistoryIndex(0);
          } else {
            setHistory([{}]);
            setHistoryIndex(0);
          }
        }
      }
    };
    loadDraft();
  }, [name]);

  // Undo/Redo listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid triggering when user is typing in inputs
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;

      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (historyIndex < history.length - 1) {
          const nextData = history[historyIndex + 1];
          setHistoryIndex(historyIndex + 1);
          setBoardTilesData(nextData);
          if (name) storage.updateDraft(name, { boardTilesData: nextData });
        }
      } else if (e.ctrlKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (historyIndex > 0) {
          const prevData = history[historyIndex - 1];
          setHistoryIndex(historyIndex - 1);
          setBoardTilesData(prevData);
          if (name) storage.updateDraft(name, { boardTilesData: prevData });
        }
      } else if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        addNotification({
          type: 'success',
          layout: 'simple',
          title: 'Project saved successfully'
        });
      } else if (e.ctrlKey && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        if (selectedTileIds.length >= 2) {
          const groupId = Date.now().toString();
          const newData = { ...boardTilesData };
          selectedTileIds.forEach(id => {
            const tileData = newData[id] || { id };
            tileData.groupId = groupId;
            newData[id] = tileData;
          });
          saveUserAction(newData);
        }
      } else if (e.ctrlKey && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        const isGroupSelected = selectedTileIds.length > 0 && selectedTileIds.some(id => boardTilesData[id]?.groupId);
        if (isGroupSelected) {
          const newData = { ...boardTilesData };
          selectedTileIds.forEach(id => {
            if (newData[id]) {
              newData[id] = { ...newData[id], groupId: undefined };
            }
          });
          saveUserAction(newData);
        }
      } else if (e.shiftKey && (e.key === '1' || e.code === 'Digit1' || e.key === '!')) {
        if (activeTab === 'Board') setBoardSubTab('Table');
        else if (activeTab === 'Cards') setCardsSubTab('Decks');
      } else if (e.shiftKey && (e.key === '2' || e.code === 'Digit2' || e.key === '@')) {
        if (activeTab === 'Board') setBoardSubTab('Type Board');
        else if (activeTab === 'Cards' && selectedDeckId) setCardsSubTab('Cards');
      } else if (e.shiftKey && (e.key === '3' || e.code === 'Digit3' || e.key === '#')) {
        if (activeTab === 'Board') setBoardSubTab('Tiles');
        else if (activeTab === 'Cards' && selectedCardId) setCardsSubTab('Layers');
      } else if (e.shiftKey && (e.key === '4' || e.code === 'Digit4' || e.key === '$')) {
        if (activeTab === 'Board') setBoardSubTab('Design');
      } else if (!e.shiftKey && e.key >= '1' && e.key <= '9') {
        // Tab switching
        const index = parseInt(e.key) - 1;
        const sortedComponents = [...activeComponents].sort();
        const tabs = ['Components', ...sortedComponents];
        if (index >= 0 && index < tabs.length) {
          setActiveTab(tabs[index]);
        }
      } else if (
        (activeTab === 'Board' && (boardSubTab === 'Design' || boardSubTab === 'Table')) ||
        (activeTab === 'Cards')
      ) {
        // Design shortcuts
        const key = e.key.toLowerCase();
        if (key === 'v') setActiveDesignTool('Cursor');
        else if (key === 'r') setActiveDesignTool('Shape');
        else if (key === 'i') setActiveDesignTool('Image');
        else if (key === 't') setActiveDesignTool('Text');
        else if (key === 'p') setActiveDesignTool('Pencil');
        else if (key === 'b') setActiveDesignTool('Brush');
      } else if (!e.ctrlKey && e.key.toLowerCase() === 'r') {
        if (selectedTileIds.length > 0) {
          const newData = { ...boardTilesData };
          selectedTileIds.forEach(id => {
            if (newData[id]) {
              newData[id] = { 
                id, 
                groupId: newData[id].groupId,
                x: newData[id].x,
                y: newData[id].y
              }; // Keep ID, group, and position
            }
          });
          saveUserAction(newData);
        }
      } else if (!e.ctrlKey && e.key.toLowerCase() === 'c') {
        if (selectedTileIds.length > 0) {
          const newData = { ...boardTilesData };
          selectedTileIds.forEach(id => {
            if (newData[id]) {
              newData[id] = { ...newData[id], variableIds: [] };
              if ('propertyIds' in newData[id]) delete (newData[id] as any).propertyIds;
            }
          });
          saveUserAction(newData);
        }
      }
    };

    const handleHistoryEvent = (e: Event) => {
      const type = (e as CustomEvent).detail;
      if (type === 'undo') {
        if (historyIndex > 0) {
          const prevData = history[historyIndex - 1];
          setHistoryIndex(historyIndex - 1);
          setBoardTilesData(prevData);
          if (name) storage.updateDraft(name, { boardTilesData: prevData });
        }
      } else if (type === 'redo') {
        if (historyIndex < history.length - 1) {
          const nextData = history[historyIndex + 1];
          setHistoryIndex(historyIndex + 1);
          setBoardTilesData(nextData);
          if (name) storage.updateDraft(name, { boardTilesData: nextData });
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('meevo-history', handleHistoryEvent);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('meevo-history', handleHistoryEvent);
    };
  }, [history, historyIndex, name, selectedTileIds, boardTilesData, activeComponents, activeTab, boardSubTab, selectedDeckId, selectedCardId]);

  const handleBack = () => {
    navigate('/');
  };

  const handleUpdateGenders = async (newGenders: string[]) => {
    setGenders(newGenders);
    if (name) {
      await storage.updateDraft(name, { genders: newGenders });
    }
  };

  const handleToggleComponent = (comp: ComponentType) => {
    setActiveComponents(prev => 
      prev.includes(comp) 
        ? prev.filter(c => c !== comp)
        : [...prev, comp]
    );
    setAutoSaveStatus('waiting');
  };

  const handleSaveComponents = async () => {
    if (name) {
      setAutoSaveStatus('loading');
      await storage.updateDraft(name, { components: activeComponents });
      const success = await storage.syncDraftFolders(name, activeComponents);
      if (success) {
        setAutoSaveStatus('saved');
        addNotification({
          type: 'success',
          layout: 'simple',
          title: 'Components saved successfully'
        });
      } else {
        setAutoSaveStatus('waiting');
        addNotification({
          type: 'error',
          layout: 'simple',
          title: 'Failed to sync draft folders'
        });
      }
    }
  };

  const handleSaveBoard = async (config: BoardConfig, silent: boolean = false) => {
    if (name) {
      setAutoSaveStatus('loading');
      setBoardConfig(config);
      
      const success = await storage.updateDraft(name, { 
        boardConfig: config
      });
      
      if (success) {
        setAutoSaveStatus('saved');
        if (!silent) {
          addNotification({
            type: 'success',
            layout: 'simple',
            title: 'Board configuration saved'
          });
        }
      } else {
        setAutoSaveStatus('waiting');
        if (!silent) {
          addNotification({
            type: 'error',
            layout: 'simple',
            title: 'Failed to save board configuration'
          });
        }
      }
    }
  };

  const saveBoardData = async (newVars: BoardTileVariable[], newData: Record<number, BoardTileData>) => {
    if (name) {
      setAutoSaveStatus('loading');
      setBoardVariables(newVars);
      setBoardTilesData(newData);
      const success = await storage.updateDraft(name, { 
        boardVariables: newVars,
        boardTilesData: newData,
        boardTileComponents: boardTileComponents,
        boardDicesData: boardDicesData,
        boardDecksData: boardDecksData
      });
      if (success) {
        setAutoSaveStatus('saved');
      } else {
        setAutoSaveStatus('waiting');
      }
    }
  };

  const handleUpdateDicesData = async (newDicesData: Record<string, DiceData>) => {
    setBoardDicesData(newDicesData);
    if (name) {
      setAutoSaveStatus('loading');
      const success = await storage.updateDraft(name, { boardDicesData: newDicesData });
      if (success) setAutoSaveStatus('saved');
      else setAutoSaveStatus('waiting');
    }
  };

  const handleCreateDice = (dice: DiceData) => {
    const newData = { ...boardDicesData, [dice.id]: dice };
    handleUpdateDicesData(newData);
    setSelectedDiceId(dice.id);
  };

  const handleUpdateDecksData = async (newDecksData: Record<string, CardDeckData>, silent?: boolean) => {
    setBoardDecksData(newDecksData);
    if (name && !silent) {
      setAutoSaveStatus('loading');
      const success = await storage.updateDraft(name, { boardDecksData: newDecksData });
      if (success) setAutoSaveStatus('saved');
      else setAutoSaveStatus('waiting');
    }
  };

  const handleUpdateDice = (diceId: string, updates: Partial<DiceData>) => {
    const newData = { ...boardDicesData };
    if (newData[diceId]) {
      newData[diceId] = { ...newData[diceId], ...updates };
      handleUpdateDicesData(newData);
    }
  };

  const handleDeleteDice = (diceId: string) => {
    const newData = { ...boardDicesData };
    delete newData[diceId];
    handleUpdateDicesData(newData);
    if (selectedDiceId === diceId) setSelectedDiceId(null);
  };

  const handleDuplicateDice = (diceId: string) => {
    const dice = boardDicesData[diceId];
    if (dice) {
      const newId = Date.now().toString();
      const newDice = { ...dice, id: newId, name: `${dice.name} (Copy)` };
      const newData = { ...boardDicesData, [newId]: newDice };
      handleUpdateDicesData(newData);
      setSelectedDiceId(newId);
    }
  };


  const saveUserAction = (newData: Record<number, BoardTileData>, newComponents?: BoardTileComponent[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newData);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    if (newComponents) setBoardTileComponents(newComponents);
    setBoardTilesData(newData);
    
    if (name) {
      storage.updateDraft(name, {
        boardVariables,
        boardTilesData: newData,
        boardTileComponents: newComponents || boardTileComponents
      });
    }
  };

  // Handlers for TilesSidebar
  const handleSetVariables = (vars: BoardTileVariable[]) => {
    saveBoardData(vars, boardTilesData);
  };

  const handlePaintSelected = (variableId: string) => {
    const newData = { ...boardTilesData };
    selectedTileIds.forEach(id => {
      const tileData = newData[id] || { id };
      const currentVars = tileData.variableIds || (tileData as any).propertyIds || [];
      if (!currentVars.includes(variableId)) {
        tileData.variableIds = [...currentVars, variableId];
      }
      newData[id] = tileData;
    });
    saveUserAction(newData);
  };

  const handleCreateGroup = () => {
    const groupId = Date.now().toString();
    const newData = { ...boardTilesData };
    selectedTileIds.forEach(id => {
      const tileData = newData[id] || { id };
      tileData.groupId = groupId;
      newData[id] = tileData;
    });
    saveUserAction(newData);
  };

  const handleUngroup = () => {
    const newData = { ...boardTilesData };
    selectedTileIds.forEach(id => {
      if (newData[id]) {
        newData[id] = { ...newData[id], groupId: undefined };
      }
    });
    saveUserAction(newData);
  };

  const handleUpdateTile = (tileId: number, data: Partial<BoardTileData>) => {
    const newData = { ...boardTilesData };
    newData[tileId] = { ...newData[tileId], id: tileId, ...data };
    saveUserAction(newData);
  };

  const handleUpdateLayer = (tileId: number, layerId: string, data: Partial<LayerData>) => {
    const newData = { ...boardTilesData };
    const tileData = newData[tileId] || { id: tileId };
    const layers = tileData.layers || [];
    const newLayers = layers.map(l => l.id === layerId ? { ...l, ...data } : l);
    newData[tileId] = { ...tileData, layers: newLayers };
    saveUserAction(newData);
  };

  const handleUpdateMultiple = (tileIds: number[], data: Partial<BoardTileData>) => {
    const newData = { ...boardTilesData };
    tileIds.forEach(id => {
      newData[id] = { ...newData[id], id, ...data };
    });
    saveUserAction(newData);
  };

  const handleUpdateTiles = (updates: { id: number, data: Partial<BoardTileData> }[]) => {
    const newData = { ...boardTilesData };
    updates.forEach(update => {
      newData[update.id] = { ...newData[update.id], id: update.id, ...update.data };
    });
    saveUserAction(newData);
  };

  const handleUpdateAll = (data: Partial<BoardTileData>) => {
    const newData = { ...boardTilesData };
    // Update all existing tiles in boardTilesData
    // (Workspace creates boardTiles which have IDs 0 to tileCount-1)
    if (boardConfig) {
      for (let i = 0; i < boardConfig.tileCount; i++) {
        newData[i] = { ...newData[i], id: i, ...data };
      }
    }
    saveUserAction(newData);
  };

  const handleDeleteVariable = (varId: string) => {
    const newVars = boardVariables.filter(v => v.id !== varId);
    const newTilesData = { ...boardTilesData };
    for (const key in newTilesData) {
      if (newTilesData[key].variableIds?.includes(varId)) {
        newTilesData[key] = {
          ...newTilesData[key],
          variableIds: newTilesData[key].variableIds.filter(id => id !== varId)
        };
      }
    }
    saveBoardData(newVars, newTilesData);
  };

  const isGroupSelected = selectedTileIds.length > 0 && selectedTileIds.some(id => boardTilesData[id]?.groupId);

  const handleDuplicateTiles = (tilesToDuplicate: { originalId: number, data: Partial<BoardTileData> }[]) => {
    if (!boardConfig) return;
    
    const count = tilesToDuplicate.length;
    const newConfig = { ...boardConfig, tileCount: boardConfig.tileCount + count };
    
    const newData = { ...boardTilesData };
    const newSelectedIds: number[] = [];
    
    tilesToDuplicate.forEach((dup, index) => {
      const newId = boardConfig.tileCount + index;
      const originalData = newData[dup.originalId] || {};
      newData[newId] = { ...originalData, ...dup.data, id: newId };
      newSelectedIds.push(newId);
    });
    
    setBoardConfig(newConfig);
    setSelectedTileIds(newSelectedIds);
    setBoardTilesData(newData);
    
    if (name) {
      storage.updateDraft(name, {
        boardConfig: newConfig,
        boardTilesData: newData,
        boardTileComponents: boardTileComponents
      }).then(success => {
        if (success) {
          setAutoSaveStatus('saved');
        }
      });
    }
  };

  return (
    <div 
      className="h-screen w-screen flex flex-col bg-meevo-bg text-meevo-text-primary overflow-hidden"
      
    >
      <ContextMenu 
        activeComponents={activeComponents}
        activeTab={activeTab} setActiveTab={setActiveTab}
        boardSubTab={boardSubTab} setBoardSubTab={setBoardSubTab}
        cardsSubTab={cardsSubTab} setCardsSubTab={setCardsSubTab}
        activeDesignTool={activeDesignTool} setActiveDesignTool={setActiveDesignTool}
      />
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        boardConfig={boardConfig} 
        onUpdateBoardConfig={handleSaveBoard} 
      />
      <ConfirmModal
        isOpen={isDeleteBoardModalOpen}
        onClose={() => setIsDeleteBoardModalOpen(false)}
        onConfirm={() => {
          const newBoardConfig = boardConfig?.tableConfig ? { tableConfig: boardConfig.tableConfig } as any : undefined;
          setBoardConfig(newBoardConfig);
          setBoardTilesData({});
          setBoardVariables([]);
          setBoardTileComponents([]);
          if (name) storage.updateDraft(name, { boardConfig: newBoardConfig || null, tilesData: {}, variables: [], boardTileComponents: [] });
          setIsDeleteBoardModalOpen(false);
        }}
        title="Delete Board"
        message="Are you sure you want to delete the board? This will remove all tiles and board configurations, but the Table will remain."
        confirmText="Delete Board"
        cancelText="Cancel"
        danger={true}
      />
      <EditorHeader 
        draftName={name || 'Untitled'} 
        onBack={handleBack} 
        activeComponents={activeComponents}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        autoSaveStatus={autoSaveStatus}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar minWidthRatio={activeTab === 'Board' ? 0.16 : 0.12}>
          {activeTab === 'Components' && (
            <ComponentsSidebar 
              draftName={name || 'Untitled'} 
              activeComponents={activeComponents}
              onToggleComponent={handleToggleComponent}
              genders={genders}
              onUpdateGenders={handleUpdateGenders}
              onSave={handleSaveComponents}
            />
          )}
          
          {activeTab === 'Board' && boardSubTab === 'Table' && (
            <TableSidebar 
              initialConfig={boardConfig}
              onSave={handleSaveBoard}
              selectedLayerIds={selectedTableLayerIds}
              onSelectLayer={(id, multi) => {
                if (!id && !multi) {
                  setSelectedTableLayerIds([]);
                } else if (multi) {
                  setSelectedTableLayerIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
                } else {
                  setSelectedTableLayerIds([id]);
                }
              }}
            />
          )}
          
          {activeTab === 'Board' && boardSubTab === 'Type Board' && (
            <BoardSidebar 
              initialConfig={boardConfig}
              onSave={handleSaveBoard}
              onDeleteBoard={() => setIsDeleteBoardModalOpen(true)}
            />
          )}

          {activeTab === 'Board' && boardSubTab === 'Tiles' && (
            <TilesSidebar 
              variables={boardVariables}
              setVariables={handleSetVariables}
              selectedTileIds={selectedTileIds}
              onPaintSelected={handlePaintSelected}
              onCreateGroup={handleCreateGroup}
              onUngroup={handleUngroup}
              isGroupSelected={isGroupSelected}
              onDeleteVariable={handleDeleteVariable}
              activeVariableId={activeVariableId}
              setActiveVariableId={setActiveVariableId}
            />
          )}

          {activeTab === 'Board' && boardSubTab === 'Design' && (
            <LayersSidebar 
              selectedTileIds={selectedTileIds}
              boardTilesData={boardTilesData}
              selectedLayerIds={selectedLayerIds}
              onSelectLayer={(ids) => setSelectedLayerIds(ids)}
              onUpdateTile={(tileId, data) => {
                const newData = { ...boardTilesData };
                newData[tileId] = { ...newData[tileId], ...data };
                saveUserAction(newData);
              }}
              boardTileComponents={boardTileComponents}
              onUpdateComponents={(newComponents, newTilesData) => {
                saveUserAction(newTilesData || boardTilesData, newComponents);
              }}
            />
          )}
          {activeTab === 'Dices' && (
            <DicesSidebar 
              boardDicesData={boardDicesData}
              selectedDiceId={selectedDiceId}
              setSelectedDiceId={setSelectedDiceId}
              onCreateDice={handleCreateDice}
              onDeleteDice={handleDeleteDice}
              onDuplicateDice={handleDuplicateDice}
            />
          )}
          {activeTab === 'Cards' && (
            <div className="flex flex-col h-full">
              <div className="flex-1 flex flex-col overflow-hidden">
                {cardsSubTab === 'Decks' && (
                  <DecksSidebar 
                    boardDecksData={boardDecksData}
                    selectedDeckId={selectedDeckId}
                    setSelectedDeckId={setSelectedDeckId}
                    onUpdateDecks={handleUpdateDecksData}
                    setCardsSubTab={setCardsSubTab}
                  />
                )}
                {cardsSubTab === 'Cards' && (
                  <CardsSidebar 
                    boardDecksData={boardDecksData}
                    selectedDeckId={selectedDeckId}
                    selectedCardId={selectedCardId}
                    setSelectedCardId={(id) => {
                      setSelectedCardId(id);
                      if (id) setCardsSubTab('Layers');
                    }}
                    onUpdateDecks={handleUpdateDecksData}
                    setCardsSubTab={setCardsSubTab}
                  />
                )}
                {cardsSubTab === 'Layers' && selectedCardId && selectedDeckId && boardDecksData[selectedDeckId]?.cards[selectedCardId] && (
                  <LayersSidebar 
                    isCardMode={true}
                    layerSourceTitle={boardDecksData[selectedDeckId].cards[selectedCardId].name}
                    onRenameSource={(newName) => {
                      const deck = boardDecksData[selectedDeckId];
                      const card = deck.cards[selectedCardId];
                      handleUpdateDecksData({
                        ...boardDecksData,
                        [selectedDeckId]: {
                          ...deck,
                          cards: { ...deck.cards, [selectedCardId]: { ...card, name: newName } }
                        }
                      });
                    }}
                    selectedTileIds={[parseInt(selectedCardId)]} 
                    boardTilesData={{ [parseInt(selectedCardId)]: boardDecksData[selectedDeckId].cards[selectedCardId] as any }} // Dummy adapting
                    selectedLayerIds={selectedLayerIds}
                    onSelectLayer={(ids) => setSelectedLayerIds(ids)}
                    onUpdateTile={(tileId, data) => {
                      // We handle this inside LayerDetailSidebar. If LayersSidebar reorders layers:
                      if (data.layers) {
                        const deck = boardDecksData[selectedDeckId];
                        const card = deck.cards[selectedCardId];
                        handleUpdateDecksData({
                          ...boardDecksData,
                          [selectedDeckId]: {
                            ...deck,
                            cards: { ...deck.cards, [selectedCardId]: { ...card, layers: data.layers } }
                          }
                        });
                      }
                    }}
                    boardTileComponents={[]}
                    onUpdateComponents={() => {}}
                  />
                )}
              </div>
            </div>
          )}
        </Sidebar>
        
        <main className="flex-1 relative flex">
          <div className="flex-1 relative">
          {activeTab === 'Board' || activeTab === 'Components' ? (
                <Workspace 
                  activeTab={activeTab} 
                  canvasSettings={canvasSettings}
                  boardConfig={boardConfig || undefined}
                  boardSubTab={boardSubTab}
                  setBoardSubTab={(tab) => setBoardSubTab(tab as BoardSubTab)}
                  selectedTileIds={selectedTileIds}
                  setSelectedTileIds={setSelectedTileIds}
                  boardVariables={boardVariables}
                  boardTilesData={boardTilesData}
                  boardDicesData={boardDicesData}
                  boardDecksData={boardDecksData}
                  onUpdateDecksData={handleUpdateDecksData}
                  setActiveTab={(tab) => setActiveTab(tab as ComponentType)}
                  setSelectedDeckId={setSelectedDeckId}
                  activeDesignTool={activeDesignTool}
                  setActiveDesignTool={(tool) => setActiveDesignTool(tool as DesignTool)}
                  selectedLayerIds={selectedLayerIds}
                  setSelectedLayerIds={setSelectedLayerIds}
                  selectedTableLayerIds={selectedTableLayerIds}
                  setSelectedTableLayerIds={setSelectedTableLayerIds}
                  onUpdateTile={handleUpdateTile}
                  onUpdateTiles={handleUpdateTiles}
                  onDuplicateTiles={handleDuplicateTiles}
                  onUpdateBoardConfig={handleSaveBoard}
                  onReplaceBoardTilesData={saveUserAction}
                  onUndo={() => {
                    const e = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true });
                    window.dispatchEvent(e);
                  }}
                  
                />
              ) : activeTab === 'Dices' ? (
                <DicesWorkspace 
                  canvasSettings={canvasSettings}
                  boardDicesData={boardDicesData}
                  selectedDiceId={selectedDiceId}
                  setSelectedDiceId={setSelectedDiceId}
                  onDuplicateDice={handleDuplicateDice}
                  onDiceFaceDoubleClick={(diceId, faceIndex) => {
                    setSelectedDiceId(diceId);
                    setDiceEditMode('Individual');
                    setDiceSelectedFace(faceIndex);
                  }}
                />
              ) : activeTab === 'Cards' ? (
                <div className="flex flex-col h-full w-full">
                  <div className="flex-1 relative overflow-hidden">
                    <CardsWorkspace
                      canvasSettings={canvasSettings}
                      boardDecksData={boardDecksData}
                      selectedDeckId={selectedDeckId}
                      setSelectedDeckId={setSelectedDeckId}
                      selectedCardId={selectedCardId}
                      setSelectedCardId={setSelectedCardId}
                      setCardsSubTab={setCardsSubTab}
                      onUpdateDecks={handleUpdateDecksData}
                      activeDesignTool={activeDesignTool}
                      setActiveDesignTool={(tool) => setActiveDesignTool(tool as DesignTool)}
                      selectedLayerIds={selectedLayerIds}
                      setSelectedLayerIds={setSelectedLayerIds}
                      boardConfig={boardConfig}
                      onUpdateBoardConfig={handleSaveBoard}
                      
                    />
                  </div>
                  <SubTabsNav
                    tabs={[
                      { id: 'Decks', label: 'Decks' },
                      { id: 'Cards', label: 'Cards', disabled: !selectedDeckId },
                      { id: 'Layers', label: 'Layers', disabled: !selectedCardId }
                    ]}
                    activeTabId={cardsSubTab}
                    onChange={(id) => {
                      if (id === 'Cards' && selectedDeckId) setCardsSubTab('Cards');
                      else if (id === 'Layers' && selectedCardId) setCardsSubTab('Layers');
                      else if (id === 'Decks') setCardsSubTab('Decks');
                    }}
                  />
                </div>
              ) : null}
          </div>

          {/* Right Sidebar */}
          {activeTab === 'Board' && boardSubTab === 'Tiles' && selectedTileIds.length === 0 && activeVariableId && (
            <div className="w-80 h-full border-l border-meevo-border flex flex-col z-30 relative bg-meevo-surface-1 shrink-0">
              <PropertiesSidebar 
                variable={boardVariables.find(v => v.id === activeVariableId)!}
                onUpdateVariable={(updated) => {
                  const newVars = boardVariables.map(v => v.id === updated.id ? updated : v);
                  handleSetVariables(newVars);
                }}
              />
            </div>
          )}
          {activeTab === 'Board' && boardSubTab === 'Tiles' && selectedTileIds.length > 0 && (
            <div className="w-80 h-full border-l border-meevo-border flex flex-col z-30 relative bg-meevo-surface-1 shrink-0">
              <TileDetailSidebar 
                selectedTileIds={selectedTileIds}
                boardTilesData={boardTilesData}
                variables={boardVariables}
                onUpdateTile={handleUpdateTile}
                onUpdateMultiple={handleUpdateMultiple}
                onUpdateAll={handleUpdateAll}
              />
            </div>
          )}
          {activeTab === 'Board' && boardSubTab === 'Design' && selectedTileIds.length <= 1 && (
              <div className="w-80 h-full border-l border-meevo-border flex flex-col z-30 relative bg-meevo-surface-1 shrink-0">
                <LayerDetailSidebar 
                  selectedTileIds={selectedTileIds}
                  boardTilesData={boardTilesData}
                  selectedLayerIds={selectedLayerIds}
                  onUpdateLayer={handleUpdateLayer}
                  onUpdateTile={handleUpdateTile}
                  boardConfig={boardConfig || undefined}
                  boardVariables={boardVariables}
                  canvasSettings={canvasSettings}
                  setCanvasSettings={setCanvasSettings}
                />
              </div>
            )}
            {((activeTab === 'Components') ||
              (activeTab === 'Board' && boardSubTab === 'Type Board') ||
              (activeTab === 'Board' && boardSubTab === 'Table' && selectedTableLayerIds.length === 0) ||
              (activeTab === 'Board' && boardSubTab === 'Tiles' && selectedTileIds.length === 0 && !activeVariableId)) && (
              <div className="w-80 h-full border-l border-meevo-border flex flex-col z-30 relative bg-meevo-surface-1 shrink-0">
                <LayerDetailSidebar 
                  selectedTileIds={[]}
                  boardTilesData={{}}
                  selectedLayerIds={[]}
                  onUpdateLayer={() => {}}
                  onUpdateTile={() => {}}
                  canvasSettings={canvasSettings}
                  setCanvasSettings={setCanvasSettings}
                />
              </div>
            )}
          {activeTab === 'Board' && boardSubTab === 'Table' && selectedTableLayerIds.length === 1 && (
            <div className="w-80 h-full border-l border-meevo-border flex flex-col z-30 relative bg-meevo-surface-1 shrink-0">
              <LayerDetailSidebar 
                selectedTileIds={[]}
                boardTilesData={{}}
                selectedLayerIds={selectedTableLayerIds}
                onUpdateLayer={(_, lId, data) => {
                  if (!boardConfig) return;
                  const newLayers = (boardConfig.tableConfig?.layers || []).map((l: LayerData) => l.id === lId ? { ...l, ...data } : l);
                  handleSaveBoard({
                    ...boardConfig,
                    tableConfig: { ...boardConfig.tableConfig!, layers: newLayers }
                  }, true);
                }}
                onUpdateTile={() => {}}
                boardConfig={boardConfig || undefined}
                boardVariables={boardVariables}
                isTableMode={true}
                
                
              />
            </div>
          )}
          {activeTab === 'Dices' && selectedDiceId && boardDicesData[selectedDiceId] && (
            <div className="w-80 h-full border-l border-meevo-border flex flex-col z-30 relative bg-meevo-surface-1 shrink-0">
              <DiceDetailSidebar 
                dice={boardDicesData[selectedDiceId]}
                onUpdateDice={handleUpdateDice}
                editMode={diceEditMode}
                setEditMode={setDiceEditMode}
                selectedFace={diceSelectedFace}
                setSelectedFace={setDiceSelectedFace}
              />
            </div>
          )}
          {activeTab === 'Cards' && selectedCardId && selectedDeckId && selectedLayerIds.length === 1 && (
            <div className="w-80 h-full border-l border-meevo-border flex flex-col z-30 relative bg-meevo-surface-1 shrink-0">
              <LayerDetailSidebar 
                selectedTileIds={[parseInt(selectedCardId) || 99999]}
                boardTilesData={{
                  [parseInt(selectedCardId) || 99999]: boardDecksData[selectedDeckId].cards[selectedCardId] as any
                }}
                selectedLayerIds={selectedLayerIds} isCardMode={true}
                onUpdateLayer={(_, lId, data) => {
                  const deck = boardDecksData[selectedDeckId];
                  if (!deck) return;
                  const card = deck.cards[selectedCardId];
                  if (!card) return;
                  const newLayers = (card.layers || []).map((l: LayerData) => l.id === lId ? { ...l, ...data } : l);
                  handleUpdateDecksData({
                    ...boardDecksData,
                    [selectedDeckId]: { ...deck, cards: { ...deck.cards, [selectedCardId]: { ...card, layers: newLayers } } }
                  });
                }}
                onUpdateTile={() => {}}
                boardVariables={boardVariables}
                isTableMode={true} // Using isTableMode to avoid board logic
                cardModeLayerSource={boardDecksData[selectedDeckId]?.cards[selectedCardId]?.layers || []}
                
                
              />
            </div>
          )}
          {activeTab === 'Cards' && selectedCardId && selectedDeckId && selectedLayerIds.length === 0 && (
            <CardDetailSidebar 
              cardData={boardDecksData[selectedDeckId]?.cards[selectedCardId]}
              
              
              onUpdateCard={(data) => {
                const deck = boardDecksData[selectedDeckId];
                if (!deck) return;
                const card = deck.cards[selectedCardId];
                handleUpdateDecksData({
                  ...boardDecksData,
                  [selectedDeckId]: { ...deck, cards: { ...deck.cards, [selectedCardId]: { ...card, ...data } } }
                });
              }}
            />
          )}
          {activeTab === 'Cards' && !selectedCardId && (
            <div className="w-80 h-full border-l border-meevo-border flex flex-col z-30 relative bg-meevo-surface-1 shrink-0">
              <LayerDetailSidebar 
                selectedTileIds={[]}
                boardTilesData={{}}
                selectedLayerIds={[]}
                onUpdateLayer={() => {}}
                onUpdateTile={() => {}}
                canvasSettings={canvasSettings}
                setCanvasSettings={setCanvasSettings}
                isCardMode={true}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};



