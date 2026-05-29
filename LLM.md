# Meevo — LLM Context & Architecture Guide

> **Lee este archivo completo antes de hacer cualquier cambio.** Su objetivo es que puedas trabajar en el proyecto sin duplicar código, sin inventar componentes que ya existen, y respetando la arquitectura y estilo vigentes.

---

## 1. Visión General del Proyecto

Meevo es una plataforma web (React 18 + TypeScript + Vite) para la creación, diseño y prototipado de **juegos de mesa**. Permite diseñar tableros, cartas, dados y tokens con herramientas visuales que operan en 2D (SVG/HTML canvas) y 3D (`@react-three/fiber`).

**Flujo del usuario:**
1. Dashboard → crea o abre un Draft (borrador).
2. Editor → trabaja en Board, Cards, Dices.
3. Dentro del Editor, en las secciones Board y Cards existe un modo **Design** donde se editan las capas (layers) de cada elemento.

---

## 2. Stack Tecnológico

| Categoría | Tecnología |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Estilos | Tailwind CSS (con tokens CSS variables) |
| Iconos | `@fluentui/react-icons` — siempre usar variante `20Regular` o `24Regular` |
| 3D | `three`, `@react-three/fiber`, `@react-three/drei` |
| Storage | `ChromiumFSProvider` (File System Access API) o `IndexedDBProvider` como fallback |
| Tipografía base | `Readex Pro` (sans), `Nico Moji` (logo) |

---

## 3. Sistema de Colores y Tokens (¡NO uses colores hardcoded!)

Todos los colores están definidos en `src/index.css` como CSS variables y expuestos en `tailwind.config.js`. Usar **siempre** las clases Tailwind correspondientes o las variables CSS. Nunca usar colores HTML básicos.

### Superficie (Elevation Model — de más oscuro a más claro)
| Token | Clase Tailwind | Uso |
|---|---|---|
| `--color-surface-0` | `bg-meevo-surface-0` | Fondo más profundo |
| `--color-surface-1` | `bg-meevo-surface-1` | Canvas / área de trabajo |
| `--color-surface-2` | `bg-meevo-surface-2` | Inputs, rows, elementos interactivos |
| `--color-surface-3` | `bg-meevo-surface-3` | Cards, paneles secundarios |
| `--color-surface-4` | `bg-meevo-surface-4` | Hover / estado activo de botones dentro de grupos |
| `--color-surface-5` | `bg-meevo-surface-5` | Toolbar activa, menús flotantes |
| `--color-surface-6` | `bg-meevo-surface-6` | Tooltips, pop-ups de mayor elevación |

### Otros tokens clave
| Token CSS | Clase Tailwind | Uso |
|---|---|---|
| `--color-purple` | `bg-meevo-purple` / `text-meevo-purple` | Acción primaria, botón CTA, focus ring, binding |
| `--color-purple-active` | `bg-meevo-purple-active` | Estado pressed del acento |
| `--color-border` | `border-meevo-border` | Bordes de separación sutiles |
| `--color-bg` | `bg-meevo-bg` | Fondo global de la app |
| `--color-panel` | `bg-meevo-panel` | Paneles y sidebars |
| `--color-text-primary` | `text-meevo-text-primary` | Texto principal (blanco) |
| `--color-text-secondary` | `text-meevo-text-secondary` | Labels, hints, headers de sección |
| `--color-text-tertiary` | `text-meevo-text-tertiary` | Prefijos de input (X, Y, W, H), íconos inactivos |
| `--color-canvas` | `bg-meevo-canvas` | Fondo del canvas de trabajo |

### Border Radius
- `rounded-sm` → `4px`
- `rounded-md` → `8px`

---

## 4. Estructura de Directorios

```
src/
├── App.tsx                        # Router: Dashboard / Editor
├── index.css                      # CSS variables globales (tokens de color, modo dark/light)
├── main.tsx                       # Entry point
│
├── pages/
│   ├── Dashboard.tsx              # Listado y creación de Drafts
│   └── Editor.tsx                 # Orquestador principal del editor (estado centralizado)
│
├── components/
│   ├── DraftCard.tsx              # Tarjeta de borrador en Dashboard
│   ├── Header.tsx                 # Header del Dashboard
│   ├── NewDraftModal.tsx          # Modal de creación de nuevo Draft
│   │
│   ├── ui/                        # ← Primitivas reutilizables (agnósticas del dominio)
│   │   ├── ColorPickerModal.tsx   # Selector de color HEX + presets + variables
│   │   ├── ConfirmModal.tsx       # Modal de confirmación genérico
│   │   ├── ContextMenu.tsx        # Menú contextual al click derecho
│   │   ├── ImageFillModal.tsx     # Modal para configurar fill de imagen en capas
│   │   ├── SegmentedSlider.tsx    # Slider con segmentos fijos (opciones discretas)
│   │   └── SubTabsNav.tsx         # Barra de sub-tabs con soporte a atajos Shift+[1-9]
│   │
│   ├── editor/                    # ← Componentes del editor de juegos
│   │   ├── Workspace.tsx          # Canvas 2D del tablero (el más complejo, ~113KB)
│   │   ├── CardsWorkspace.tsx     # Canvas 2D de cartas (~54KB)
│   │   ├── DicesWorkspace.tsx     # Visualizador 3D de dados (~19KB)
│   │   │
│   │   ├── EditorHeader.tsx       # Top-Bar: tabs Components/Board/Cards/Dices + acciones globales
│   │   ├── DesignToolbar.tsx      # Toolbar flotante de herramientas de diseño
│   │   ├── SnapGuides.tsx         # Guías naranjas de alineación al arrastrar capas
│   │   ├── ZoomControls.tsx       # Controles de zoom flotantes
│   │   │
│   │   ├── Sidebar.tsx            # Wrapper base de sidebar redimensionable
│   │   ├── BoardSidebar.tsx       # Config del tablero (shape, size, color, layers de tabla)
│   │   ├── TableSidebar.tsx       # Config de la tabla central del tablero
│   │   ├── TileDetailSidebar.tsx  # Propiedades de la casilla seleccionada (Fill, Stroke, Rounded)
│   │   ├── TilesSidebar.tsx       # Lista de casillas + variables
│   │   ├── LayersSidebar.tsx      # Árbol de capas del elemento seleccionado + Templates
│   │   ├── LayerDetailSidebar.tsx # Propiedades de la capa: Position, Size, Fill, Stroke, Typography
│   │   ├── CardDetailSidebar.tsx  # Propiedades de carta (nombre, dimensiones)
│   │   ├── CardsSidebar.tsx       # Gestión de mazos y cartas
│   │   ├── DecksSidebar.tsx       # Gestión de mazos
│   │   ├── DiceDetailSidebar.tsx  # Propiedades del dado seleccionado
│   │   ├── DicesSidebar.tsx       # Lista de dados
│   │   ├── ComponentsSidebar.tsx  # Biblioteca de Templates reutilizables
│   │   ├── PropertiesSidebar.tsx  # Variables/Propiedades del tablero
│   │   │
│   │   ├── SettingsModal.tsx      # Modal de configuración del Draft
│   │   ├── CreateDiceModal.tsx    # Modal de creación de dado
│   │   ├── CreateComponentModal.tsx # Modal para guardar template
│   │   ├── ConnectComponentModal.tsx # Modal para vincular template a casilla
│   │   ├── NewPropertyModal.tsx   # Modal para crear nueva propiedad/variable
│   │   ├── PropertyBindingModal.tsx # Modal para vincular propiedad a capa
│   │   │
│   │   └── properties/            # Sub-componentes de propiedades reutilizables dentro del editor
│   │       ├── FillEditor.tsx     # Fila de Fill: swatch + hex + Prop. button
│   │       ├── StrokeEditor.tsx   # Fila de Stroke: width + swatch + hex + opacity%
│   │       └── SizeEditor.tsx     # W/H con modos Fixed/Hug/Fill
│   │
│   └── notifications/             # Sistema de toasts y alertas efímeras
│
├── contexts/
│   ├── NotificationContext.tsx    # Provider global para addNotification()
│   └── ContextMenuContext.tsx     # Provider global del menú contextual
│
├── services/storage/
│   ├── types.ts                   # ← FUENTE DE VERDAD de todos los tipos TypeScript
│   ├── index.ts                   # Re-exporta el provider activo
│   ├── ChromiumFSProvider.ts      # Implementación con File System Access API
│   └── IndexedDBProvider.ts       # Fallback con IndexedDB
│
└── utils/                         # Funciones utilitarias puras
```

---

## 5. Tipos de Datos Principales (`src/services/storage/types.ts`)

> **Regla:** Nunca crees interfaces paralelas. Si necesitas un campo nuevo, añádelo a los tipos existentes en `types.ts`.

### `LayerData` — Una capa dentro de un tile o carta
```ts
type LayerType = 'rect' | 'image' | 'text' | 'group';

interface LayerData {
  id: string; name: string; type: LayerType;
  x: number; y: number; width: number; height: number;
  rotation: number; opacity: number;          // opacity: 0-100
  fillColor?: string; strokeColor?: string;
  strokeWidth?: number; strokeOpacity?: number; // 0-100
  text?: string; typography?: TypographyData;
  sizingW?: 'fixed' | 'hug' | 'fill';         // hug solo válido para type='text'
  sizingH?: 'fixed' | 'hug' | 'fill';
  src?: string; imageMode?: 'fill'|'fit'|'crop'|'tile';
  bindings?: Record<string, string>;           // fieldName → TileProperty.id
  // rounded corners (shapes)
  roundedTL?: number; roundedTR?: number; roundedBL?: number; roundedBR?: number;
}
```

### `BoardTileData` — Una casilla del tablero
```ts
interface BoardTileData {
  id: number; x?:number; y?:number; name?:string;
  fillColor?:string; strokeColor?:string; strokeWidth?:number; strokeOpacity?:number;
  rounded?:number; roundedTL?:number; roundedTR?:number; roundedBL?:number; roundedBR?:number;
  layers?: LayerData[];
  variableIds?: string[];           // IDs de BoardTileVariable asignadas
  propertyValues?: Record<string,any>;
  bindings?: Record<string,string>; // fillColor|strokeColor → TileProperty.id
  componentId?: string;             // si está vinculado a un BoardTileComponent
}
```

### `BoardTileComponent` — Template reutilizable
```ts
interface BoardTileComponent {
  id: string; name: string;
  layers: LayerData[];
  fillColor?:string; strokeColor?:string; strokeWidth?:number;
  rounded?:number; roundedTL?:number; /* ... */
  bindings?: Record<string,string>;
}
```

### `DraftMetadata` — El borrador completo (lo que se persiste)
```ts
interface DraftMetadata {
  name: string; tiles: number; players: number; /* meta */ 
  boardConfig?: BoardConfig;
  boardVariables?: BoardTileVariable[];
  boardTilesData?: Record<number, BoardTileData>;
  boardTileComponents?: BoardTileComponent[];
  boardDicesData?: Record<string, DiceData>;
  boardDecksData?: Record<string, CardDeckData>;
}
```

---

## 6. Arquitectura del Editor (`src/pages/Editor.tsx`)

El Editor es el orquestador central. **Todo el estado principal vive en `Editor.tsx`** y se pasa hacia abajo por props. No hay Zustand ni Context para el estado del juego — es prop drilling intencional para tener un único punto de verdad y facilitar el guardado automático.

### Layout de 3 columnas

```
┌──────────────────────────────────────────────────────────────────┐
│                         EditorHeader (Top-Bar)                   │
├─────────────┬──────────────────────────────┬─────────────────────┤
│  Left Panel │        Center Workspace       │    Right Panel      │
│  (Sidebar)  │   (Workspace / CardsWS / 3D) │    (Sidebar)        │
│  ~300px     │        flex-1                 │    ~300px           │
└─────────────┴──────────────────────────────┴─────────────────────┘
```

**Cada panel usa `Sidebar.tsx`** — un wrapper redimensionable con `min-width: 12vw`, `max-width: 50vw`, default `300px`.

### Qué se muestra según el tab activo

| Tab | Left Sidebar | Center | Right Sidebar |
|---|---|---|---|
| **Components** | ComponentsSidebar | (vacío/preview) | - |
| **Board** | TilesSidebar + PropertiesSidebar | Workspace.tsx | TileDetailSidebar o LayersSidebar + LayerDetailSidebar |
| **Cards** | DecksSidebar + CardsSidebar | CardsWorkspace.tsx | CardDetailSidebar o LayersSidebar + LayerDetailSidebar |
| **Dices** | DicesSidebar | DicesWorkspace.tsx | DiceDetailSidebar |

### Modo Design en Board/Cards
Cuando `designMode === true`, el Workspace activa:
- `DesignToolbar.tsx` (flotante, bottom-right)
- `SnapGuides.tsx` (guías de alineación al arrastrar)
- `LayersSidebar.tsx` + `LayerDetailSidebar.tsx` en el panel derecho

---

## 7. Componentes Reutilizables — Reglas y Catálogo

### 7.1 Primitivas UI (`src/components/ui/`)

**Regla de oro:** Si un componente es agnóstico del dominio de juego, va en `ui/`. No debe importar nada de `types.ts` salvo para tipado de props. Toda su data llega por props y eleva eventos por callbacks.

| Componente | ID | Props clave | Uso |
|---|---|---|---|
| `ColorPickerModal` | `cmp-color-picker` | `color`, `onChange`, `onClose`, `x`, `y`, `variables?` | Picker flotante HEX+presets. Abre posicionado con coords absolutas. NO usar `<input type="color">`. |
| `ConfirmModal` | `cmp-modal-confirm` | `isOpen`, `title`, `message`, `isDestructive`, `onConfirm`, `onCancel` | Modal genérico de confirmación. Usa Portal a `document.body`. |
| `ContextMenu` | `cmp-context-menu` | Consumido via `ContextMenuContext` | Menú contextual al right-click. Ítems con icono + label + shortcut. |
| `ImageFillModal` | `cmp-image-fill` | `layer`, `onChange`, `onClose`, `x`, `y` | Configura fill de imagen: modo fill/fit/crop/tile + scale. |
| `SegmentedSlider` | `cmp-slider-segmented` | `options: number[]`, `value`, `onChange` | Slider con stops discretos (ej: Grid Opacity 1-5). |
| `SubTabsNav` | `cmp-subtabs-nav` | `tabs`, `activeTabId`, `onChange` | Sub-navegación por tabs con atajos `Shift+[1-9]`. |

### 7.2 Sub-componentes de Propiedades (`editor/properties/`)

Estos son reutilizados **dentro** de `LayerDetailSidebar` y potencialmente en otros sidebarss. Son semicomponentes de editor (sí usan tipos del dominio).

| Componente | ID | Props clave |
|---|---|---|
| `FillEditor` | `cmp-design-fill` | `fillColor`, `binding?`, `isImage`, `imageSrc?`, callbacks para open picker/binding |
| `StrokeEditor` | `cmp-design-stroke` | `strokeWidth`, `strokeColor`, `strokeOpacity`, `binding?`, callbacks |
| `SizeEditor` | `cmp-design-size` | `width`, `height`, `sizingW`, `sizingH`, `onChange`, `isText?` |

### 7.3 Sidebar base (`Sidebar.tsx`)

Wrapper de panel lateral redimensionable. Props: `side: 'left'|'right'`, `defaultWidth`, `minWidth`, `maxWidth`, `children`. Todos los sidebars del editor se envuelven en este componente.

---

## 8. Sistema de Capas (LayerData) — Cómo funciona

Las capas son el mecanismo de diseño libre de Meevo. Cada `BoardTileData` y `CardData` tiene un array `layers: LayerData[]`.

### Tipos de capa
- **`rect`** — Rectángulo con fill, stroke, border-radius por esquina
- **`text`** — Texto con `TypographyData` (font, weight, size, alignH, alignV, autoSize)
- **`image`** — Imagen con `imageMode` ('fill' | 'fit' | 'crop' | 'tile')
- **`group`** — Agrupación lógica (tiene `parentId` en capas hijas)

### SizingMode (solo text layers)
- `fixed` → valor numérico en px
- `hug` → se adapta al contenido (**solo válido para `type === 'text'`**)
- `fill` → estira hasta el padre

### Property Bindings
Las capas pueden tener `bindings: Record<string, string>` donde la key es el nombre del campo (`fillColor`, `strokeColor`, `text`) y el value es el ID de una `TileProperty`. Esto permite que el valor del campo se resuelva desde la variable de la casilla en runtime.

### Templates (BoardTileComponent)
Un `BoardTileComponent` es un snapshot de layers+estilos de una casilla que se puede reutilizar en múltiples casillas. Cuando una casilla tiene `componentId`, sus layers incluyen las del template. La UI expone "Update Template" (sincroniza el template a todas las casillas conectadas) y "Disconnect Template".

---

## 9. EditorHeader (Top-Bar) — `EditorHeader.tsx`

El componente de navegación principal del editor. NO es un nav-bar de página — es la barra superior del editor.

**Anatomía:**
- Izquierda: Logo Meevo + nombre del Draft (editable con doble click)
- Centro: Tabs principales → **Components | Board | Cards | Dices** (cada uno con su shortcut)
- Derecha: Botones globales → Settings, Export, etc.

**Regla:** No agregar tabs que no existan en el producto real.

---

## 10. DesignToolbar — `DesignToolbar.tsx`

Toolbar flotante de herramientas de diseño. Se posiciona `absolute bottom-6 right-6` dentro del workspace.

**Herramientas disponibles:**
| ID | Ícono (Fluent) | Shortcut |
|---|---|---|
| `Cursor` | `Cursor20Regular` | `V` |
| `Shape` | `Square20Regular` | `R` |
| `Image` | `Image20Regular` | `I` |
| `Text` | `TextFont20Regular` | `T` |
| `Pencil` | `Pen20Regular` | `P` |
| `Brush` | `DrawShape20Regular` | `B` |

**Props:** `activeTool`, `onChangeTool`, `allowedTools?` (filtrar herramientas disponibles por contexto).

**Estado activo:** `bg-meevo-surface-5 text-meevo-text-primary`. Inactivo: `text-meevo-text-tertiary hover:text-meevo-text-primary hover:bg-[#2A2A2D]`.

---

## 11. Contexts Globales

### NotificationContext
```tsx
const { addNotification } = useNotification();
addNotification({ type: 'success', layout: 'simple', title: 'Mensaje' });
```
Muestra toasts efímeros. No crear snackbars propios.

### ContextMenuContext
Provee el menú contextual global. Se activa desde `Workspace.tsx` y `CardsWorkspace.tsx` al hacer right-click en capas o casillas.

---

## 12. Patrones y Convenciones de Código

### Modales con Portal
Todos los modales flotantes (ColorPickerModal, ConfirmModal, etc.) usan `ReactDOM.createPortal(..., document.body)` para evitar conflictos de `z-index` con las sidebars. El z-index estándar para modales es `z-[9999]` o superior.

### Estado del Editor
- `Editor.tsx` es el único dueño del estado (`boardConfig`, `boardTilesData`, `boardVariables`, etc.).
- Los callbacks de update se pasan hacia abajo: `onUpdateLayer`, `onUpdateTile`, `onUpdateComponents`, etc.
- El auto-guardado se dispara en cada cambio de estado relevante.

### Iconografía
- **SIEMPRE** usar `@fluentui/react-icons`.
- Tamaño default: `20Regular`. Para acciones grandes: `24Regular`.
- Pasar `fontSize={N}` como prop para cambiar tamaño en lugar de wrappers CSS.
- **NUNCA** usar fabric icon font classes (`.ms-Icon--XYZ`) en código React — solo en la guía HTML estática.

### Tailwind inline vs. style
- Usar clases Tailwind para todo lo estático.
- Usar `style={{ ... }}` SOLO para valores dinámicos: posiciones absolutas del mouse, transformaciones X/Y calculadas, colores que vienen de datos del usuario.

### Overflow e inputs flex
- Siempre que pongas un `<input>` dentro de un flex container, agrega `min-width: 0` al container y `width: 100%` al input.
- Para dos inputs side-by-side que deben dividirse 50/50: `overflow: hidden` en el row + `flex: 1; min-width: 0` en cada celda.

---

## 13. Qué NO Hacer

1. **NO** crear colores hardcoded (`#1a1a1a`, `gray-500`). Usar siempre los tokens de Meevo.
2. **NO** instalar librerías pesadas (`lodash`, `moment`, `date-fns`) sin justificación explícita.
3. **NO** usar `<input type="color">` — el picker de color es siempre `ColorPickerModal`.
4. **NO** duplicar estilos de sidebar — usar `Sidebar.tsx` como wrapper.
5. **NO** agregar nuevas interfaces en los componentes — extender las de `types.ts`.
6. **NO** crear tabs o secciones del editor que no existan en el producto real (Board, Cards, Dices, Components son los únicos tabs).
7. **NO** usar `position: fixed` dentro de sidebars — usar portales a `document.body`.
8. **NO** reescribir `ColorPickerModal`, `FillEditor`, `StrokeEditor`, `SizeEditor` — ya están hechos y son la fuente de verdad.
9. **NO** inventar iconos propios — todo icono viene de `@fluentui/react-icons`.
10. **NO** agregar `console.log` en producción.

---

## 14. Guía de Diseño Visual (Design System)

Ver `web/guidelines/index.html` para la guía visual completa con previews interactivos de cada componente. Los IDs de componente para referencia rápida:

| ID | Componente |
|---|---|
| `cmp-btn-primary` | Botón primario (purple fill) |
| `cmp-btn-secondary` | Botón secundario (surface border) |
| `cmp-btn-text` | Botón de texto (solo texto, sin fondo) |
| `cmp-btn-icon` | Botón icono (solo ícono) |
| `cmp-btn-destructive` | Botón destructivo (red) |
| `cmp-input-text` | Input de texto estándar |
| `cmp-slider-segmented` | Slider segmentado |
| `cmp-color-picker` | Color Picker Modal |
| `cmp-toolbar-design` | DesignToolbar flotante |
| `cmp-top-bar` | EditorHeader (Top-Bar) |
| `cmp-sidebar-config` | Configuration Sidebar |
| `cmp-context-menu` | Context Menu |
| `cmp-design-layers` | Panel de capas |
| `cmp-design-position` | Position & Alignment |
| `cmp-design-size` | Size Editor (Fixed/Hug/Fill) |
| `cmp-design-appearance` | Opacity & Rotation |
| `cmp-design-fill` | Fill Editor |
| `cmp-design-stroke` | Stroke Editor |
| `cmp-design-typography` | Typography (solo text layers) |
| `cmp-design-templates` | Templates footer (LayersSidebar) |
