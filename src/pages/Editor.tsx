import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EditorHeader } from '../components/editor/EditorHeader';
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
import { useNotification } from '../contexts/NotificationContext';
import type { BoardConfig, BoardTileVariable, BoardTileData, LayerData, BoardTileComponent } from '../services/storage/types';
import type { DesignTool } from '../components/editor/DesignToolbar';

import { storage } from '../services/storage';

export type ComponentType = 'Board' | 'Cards' | 'Dices' | 'Tokens' | 'Rules' | 'Manual';
export type BoardSubTab = 'Table' | 'Type Board' | 'Tiles' | 'Design';

export const Editor: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  
  // Settings State
  const [activeComponents, setActiveComponents] = useState<ComponentType[]>([]);
  const [genders, setGenders] = useState<string[]>([]);
  const [boardConfig, setBoardConfig] = useState<BoardConfig | undefined>();
  const [boardVariables, setBoardVariables] = useState<BoardTileVariable[]>([]);
  const [boardTilesData, setBoardTilesData] = useState<Record<number, BoardTileData>>({});
  const [boardTileComponents, setBoardTileComponents] = useState<BoardTileComponent[]>([]);
  
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
      } else if (e.shiftKey && (e.key === '2' || e.code === 'Digit2' || e.key === '@')) {
        if (activeTab === 'Board') setBoardSubTab('Type Board');
      } else if (e.shiftKey && (e.key === '3' || e.code === 'Digit3' || e.key === '#')) {
        if (activeTab === 'Board') setBoardSubTab('Tiles');
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
      } else if (activeTab === 'Board' && boardSubTab === 'Design') {
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

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, historyIndex, name, selectedTileIds, boardTilesData, activeComponents]);

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
        boardTileComponents: boardTileComponents
      });
      if (success) {
        setAutoSaveStatus('saved');
      } else {
        setAutoSaveStatus('waiting');
      }
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
    <div className="h-screen w-screen flex flex-col bg-meevo-bg text-meevo-text-primary overflow-hidden">
      <EditorHeader 
        draftName={name || 'Untitled'} 
        onBack={handleBack} 
        activeComponents={activeComponents}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        autoSaveStatus={autoSaveStatus}
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
                if (multi) {
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
              onSelectLayer={(id, multi) => {
                if (multi) {
                  setSelectedLayerIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
                } else {
                  setSelectedLayerIds([id]);
                }
              }}
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
        </Sidebar>
        
        <main className="flex-1 relative flex">
          <div className="flex-1 relative">
                <Workspace 
                  activeTab={activeTab} 
                  boardConfig={boardConfig || undefined}
                  boardSubTab={boardSubTab}
                  setBoardSubTab={setBoardSubTab}
                  selectedTileIds={selectedTileIds}
                  setSelectedTileIds={setSelectedTileIds}
                  boardVariables={boardVariables}
                  boardTilesData={boardTilesData}
                  activeDesignTool={activeDesignTool}
                  setActiveDesignTool={setActiveDesignTool}
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
          </div>

          {/* Right Sidebar */}
          {activeTab === 'Board' && boardSubTab === 'Tiles' && selectedTileIds.length === 0 && activeVariableId && (
            <div className="w-80 h-full border-l border-[#CCCCCC]/10 flex flex-col z-10 relative bg-meevo-panel">
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
            <div className="w-80 h-full border-l border-[#CCCCCC]/10 flex flex-col z-10 relative bg-meevo-panel">
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
          {activeTab === 'Board' && boardSubTab === 'Design' && selectedTileIds.length === 1 && (
            <div className="w-80 h-full border-l border-[#CCCCCC]/10 flex flex-col z-10 relative bg-meevo-panel">
              <LayerDetailSidebar 
                selectedTileIds={selectedTileIds}
                boardTilesData={boardTilesData}
                selectedLayerIds={selectedLayerIds}
                onUpdateLayer={handleUpdateLayer}
                onUpdateTile={handleUpdateTile}
                boardConfig={boardConfig || undefined}
                boardVariables={boardVariables}
              />
            </div>
          )}
          {activeTab === 'Board' && boardSubTab === 'Table' && selectedTableLayerIds.length === 1 && (
            <div className="w-80 h-full border-l border-[#CCCCCC]/10 flex flex-col z-10 relative bg-meevo-panel">
              <LayerDetailSidebar 
                selectedTileIds={[]}
                boardTilesData={{}}
                selectedLayerIds={selectedTableLayerIds}
                onUpdateLayer={(tId, lId, data) => {
                  if (!boardConfig) return;
                  const newLayers = (boardConfig.tableConfig?.layers || []).map(l => l.id === lId ? { ...l, ...data } : l);
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
        </main>
      </div>
    </div>
  );
};
