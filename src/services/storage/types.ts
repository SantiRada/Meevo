export interface BoardConfig {
  type: 'Fixed Path' | 'Modular';
  tileCount: number;
  pathShape: 'Square' | 'Circle' | 'Pentagon' | 'Hexagon' | 'Snake';
  tileWidth: number;
  tileHeight: number;
  gap: number;
}

export interface BoardTileVariable {
  id: string;
  name: string;
  color: string;
}

export type LayerType = 'rect' | 'image' | 'text' | 'group';

export interface TypographyData {
  fontFamily: string;
  weight: string;
  size: number;
  alignH: 'left' | 'center' | 'right';
  alignV: 'top' | 'middle' | 'bottom';
}

export interface LayerData {
  id: string;
  name: string;
  type: LayerType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  
  // Fill & Stroke
  fillColor?: string;
  fillOpacity?: number; // 0-100
  strokeColor?: string;
  strokeWidth?: number;
  strokeOpacity?: number; // 0-100

  // Text specific
  text?: string;
  typography?: TypographyData;
  
  // Image specific
  src?: string;
  
  // Grouping
  parentId?: string;
}

export interface BoardTileData {
  id: number;
  name?: string;
  rounded?: number;
  variableIds?: string[];
  groupId?: string;
  layers?: LayerData[];
}

export interface DraftMetadata {
  name: string;
  tiles: number;
  players: number;
  emptyTiles: number;
  progress: number;
  updatedAt: string;
  components: string[];
  boardConfig?: BoardConfig;
  boardVariables?: BoardTileVariable[];
  boardTilesData?: Record<number, BoardTileData>;
}

export interface StorageProvider {
  /**
   * Initializes the storage provider (e.g. asking for folder access).
   * Returns true if successfully initialized, false if cancelled or failed.
   */
  initialize(): Promise<boolean>;
  
  /**
   * Returns true if the provider is already initialized and ready to use.
   */
  isReady(): Promise<boolean>;

  listDrafts(): Promise<DraftMetadata[]>;
  getDraft(name: string): Promise<DraftMetadata | null>;
  updateDraft(name: string, updates: Partial<DraftMetadata>): Promise<boolean>;
  createDraft(name: string): Promise<DraftMetadata | null>;
  deleteDraft(name: string): Promise<boolean>;
  verifyAndRestoreDraft(name: string): Promise<boolean>;
  syncDraftFolders(name: string, activeComponents: string[]): Promise<boolean>;
}
