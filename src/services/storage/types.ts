export interface BoardConfig {
  type: 'Fixed Path' | 'Modular';
  tileCount: number;
  pathShape: 'Square' | 'Circle' | 'Pentagon' | 'Hexagon' | 'Snake' | 'Grid' | 'Spiral' | 'Free Paths';
  tileWidth: number;
  tileHeight: number;
  gap: number;
  gapLine?: number;
  spiralDirection?: 'U_L' | 'U_R' | 'D_L' | 'D_R' | 'L_D' | 'L_U' | 'R_D' | 'R_U';
  spiralRounded?: boolean;
  gridColumns?: number;
  gridRows?: number;
  connectEnd?: boolean;
  freeConnections?: {id: string, from: number, to: number, dir?: 'forward' | 'backward' | 'both'}[];
  tableConfig?: {
    shape: 'Square' | 'Rectangle' | 'Pentagon' | 'Hexagon' | 'Circle' | 'Oval';
    width: number;
    height: number;
    x: number;
    y: number;
    color?: string;
    layers?: LayerData[];
  };
  boardX?: number;
  boardY?: number;
  dicesConfig?: {
    x: number;
    y: number;
  };
}

export type TilePropertyType = 'Number' | 'Text' | 'List' | 'Color';

export interface TileProperty {
  id: string;
  name: string;
  type: TilePropertyType;
  defaultValue?: string;
  prefix?: string;
  listOptions?: string[];
}

export interface BoardTileVariable {
  id: string;
  name: string;
  color: string;
  properties?: TileProperty[];
}

export type LayerType = 'rect' | 'image' | 'text' | 'group';

export interface TypographyData {
  fontFamily: string;
  weight: string;
  size: number;
  alignH: 'left' | 'center' | 'right';
  alignV: 'top' | 'middle' | 'bottom';
  autoSize?: boolean;
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
  rounded?: number;
  roundedTL?: number;
  roundedTR?: number;
  roundedBL?: number;
  roundedBR?: number;
  
  // Fill & Stroke
  fillColor?: string;
  fillOpacity?: number; // 0-100
  strokeColor?: string;
  strokeWidth?: number;
  strokeOpacity?: number; // 0-100

  // Text specific
  text?: string;
  typography?: TypographyData;
  sizingW?: 'fixed' | 'hug' | 'fill';
  sizingH?: 'fixed' | 'hug' | 'fill';
  
  // Image specific
  src?: string;
  imageMode?: 'fill' | 'fit' | 'crop' | 'tile';
  imageTileSize?: number;
  imageScale?: number;
  
  // Grouping
  parentId?: string;

  // Bindings (mapping layer property names to TileProperty IDs)
  bindings?: Record<string, string>;
}

export interface BoardTileComponent {
  id: string;
  name: string;
  layers: LayerData[];
  rounded?: number;
  roundedTL?: number;
  roundedTR?: number;
  roundedBL?: number;
  roundedBR?: number;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
  bindings?: Record<string, string>;
}

export interface BoardTileData {
  id: number;
  x?: number;
  y?: number;
  name?: string;
  rounded?: number;
  roundedTL?: number;
  roundedTR?: number;
  roundedBL?: number;
  roundedBR?: number;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
  variableIds?: string[];
  propertyValues?: Record<string, any>;
  groupId?: string;
  layers?: LayerData[];
  clipOutsideOpacity?: number;
  
  // Bindings for base tile properties
  bindings?: Record<string, string>;
  
  // Design Component
  componentId?: string;
}

export interface CardTemplateConfig {
  type: 'french' | 'spanish' | 'size';
  rank?: string;
  suit?: string;
  textColor?: string;
  fontFamily?: string;
  imageSrc?: string;
  imageX?: number;
  imageY?: number;
  imageWidth?: number;
  imageHeight?: number;
}

export interface CardData {
  id: string;
  deckId: string;
  name: string;
  x?: number;
  y?: number;
  width: number;
  height: number;
  padding?: number;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  rounded: number;
  roundedTL?: number;
  roundedTR?: number;
  roundedBL?: number;
  roundedBR?: number;
  templateConfig: CardTemplateConfig;
  clipOutsideOpacity?: number;
  layers: LayerData[];
}

export interface CardDeckData {
  id: string;
  name: string;
  cards: Record<string, CardData>;
  x?: number;
  y?: number;
}

export interface DiceFaceConfig {
  text?: string;
  imageSrc?: string;
  imageScale?: number;
  backgroundColor?: string;
  contentColor?: string;
}

export interface DiceData {
  id: string;
  name: string;
  sides: number;
  template: 'Dots' | 'Numbers' | 'Images';
  fontFamily?: string;
  fontSize?: number;
  startNumber: number;
  stepDistance: number;
  baseColor: string;
  pipColor: string;
  edgeColor?: string;
  edgeSize?: number;
  rounded: number;
  faces: Record<number, DiceFaceConfig>;
}

export interface DraftMetadata {
  name: string;
  tiles: number;
  players: number;
  emptyTiles: number;
  progress: number;
  updatedAt: string;
  components: string[];
  genders?: string[];
  boardConfig?: BoardConfig;
  boardVariables?: BoardTileVariable[];
  boardTilesData?: Record<number, BoardTileData>;
  boardTileComponents?: BoardTileComponent[];
  boardDicesData?: Record<string, DiceData>;
  boardDecksData?: Record<string, CardDeckData>;
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

export interface CanvasSettings { fill: string; snapToGrid: boolean; viewGrid: boolean; gridOpacity?: number; gridOpacityCards?: number; }
