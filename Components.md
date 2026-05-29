# Meevo — Guía de Componentes y Reutilización

> **Propósito:** Mapa de referencia de todos los componentes existentes para evitar duplicación. Si un componente que necesitas ya existe aquí, úsalo. No lo reescribas.

---

## Índice
1. [Primitivas UI (`ui/`)](#1-primitivas-ui)
2. [Sub-componentes de Propiedades (`editor/properties/`)](#2-sub-componentes-de-propiedades)
3. [Componentes del Editor (`editor/`)](#3-componentes-del-editor)
4. [Componentes del Dashboard (raíz)](#4-componentes-del-dashboard)
5. [Contextos Globales](#5-contextos-globales)
6. [Sistema de Diseño — Anatomía de Paneles](#6-sistema-de-diseño--anatomía-de-paneles)
7. [Reglas de Creación de Nuevos Componentes](#7-reglas-de-creación-de-nuevos-componentes)

---

## 1. Primitivas UI

Ubicación: `src/components/ui/`

Componentes **agnósticos del dominio de juego**. Reciben data por props, elevan eventos por callbacks. No importan lógica de negocio ni estado global.

---

### `ColorPickerModal.tsx`
**ID:** `cmp-color-picker`

Selector de color HEX con presets y soporte a variables de propiedad.

```tsx
<ColorPickerModal
  color="#7C4DFF"
  x={rect.right + 10}
  y={rect.top}
  onChange={(hex) => handleChange('fillColor', hex)}
  onClose={() => setActivePicker(null)}
  variables={boardVariables}  // opcional, muestra presets de variables
/>
```

**Reglas:**
- Se posiciona con coords absolutas `x`, `y` (obtenidas del `getBoundingClientRect()` del trigger).
- **NUNCA** usar `<input type="color">` — este es el picker oficial del proyecto.
- Usa `createPortal` internamente para escapar el z-index de los sidebars.

---

### `ConfirmModal.tsx`
**ID:** `cmp-modal-confirm`

Modal de confirmación genérico con soporte a acción destructiva.

```tsx
<ConfirmModal
  isOpen={showDelete}
  title="Eliminar casilla"
  message="Esta acción no se puede deshacer."
  confirmText="Eliminar"
  cancelText="Cancelar"
  isDestructive={true}
  onConfirm={handleDelete}
  onCancel={() => setShowDelete(false)}
/>
```

**Reglas:**
- Usar `isDestructive={true}` para acciones irreversibles (estilo rojo).
- Usa `createPortal` a `document.body` internamente.

---

### `ContextMenu.tsx`
**ID:** `cmp-context-menu`

Menú contextual al click derecho. Se consume via `ContextMenuContext`.

```tsx
// En Editor.tsx o Workspace.tsx
const { showContextMenu } = useContextMenu();

// Al right-click en una capa:
showContextMenu({
  x: e.clientX,
  y: e.clientY,
  items: [
    { label: 'Duplicar', icon: <Copy20Regular />, action: handleDuplicate },
    { label: 'Eliminar', icon: <Delete20Regular />, action: handleDelete, destructive: true },
  ]
});
```

**Reglas:**
- No crear menús flotantes propios — siempre usar este contexto.
- Los ítems tienen: `label`, `icon` (Fluent20Regular), `action`, `shortcut?`, `destructive?`, `disabled?`.

---

### `ImageFillModal.tsx`
**ID:** `cmp-image-fill`

Modal para configurar el fill de imagen de una capa de tipo `image`.

```tsx
<ImageFillModal
  layer={layer}
  x={rect.right + 10}
  y={rect.top}
  onChange={(data) => Object.entries(data).forEach(([k,v]) => handleChange(k, v))}
  onClose={() => setActiveImagePicker(null)}
/>
```

Permite configurar: `imageMode` ('fill' | 'fit' | 'crop' | 'tile'), `imageScale`, `imageTileSize`.

---

### `SegmentedSlider.tsx`
**ID:** `cmp-slider-segmented`

Slider con pasos discretos fijos (no continuo).

```tsx
<SegmentedSlider
  options={[1, 2, 3, 4, 5]}
  value={canvasSettings.gridOpacity ?? 2}
  onChange={(val) => setCanvasSettings({ ...canvasSettings, gridOpacity: val })}
/>
```

Uso actual: Grid Opacity en Canvas Settings (valores 1-5).

---

### `SubTabsNav.tsx`
**ID:** `cmp-subtabs-nav`

Barra de sub-navegación por tabs con atajos de teclado `Shift+[1-9]`.

```tsx
<SubTabsNav
  tabs={[
    { id: 'Decks', label: 'Decks' },
    { id: 'Cards', label: 'Cards', disabled: !selectedDeckId },
  ]}
  activeTabId={cardsSubTab}
  onChange={(id) => setCardsSubTab(id)}
/>
```

**Reglas:**
- Gestiona internamente el listener de `Shift+[1-9]`.
- No duplicar esta lógica en otros componentes.

---

## 2. Sub-componentes de Propiedades

Ubicación: `src/components/editor/properties/`

Usados **dentro de `LayerDetailSidebar.tsx`** para editar propiedades de capas. Son semi-reutilizables (usan tipos del dominio).

---

### `FillEditor.tsx`
**ID:** `cmp-design-fill`

Fila de edición de Fill: swatch de color + hex + botón "Prop." para binding.

```tsx
<FillEditor
  fillColor={layer.fillColor}
  binding={layer.bindings?.fillColor}
  bindingName={layer.bindings?.fillColor ? getPropName(layer.bindings.fillColor) : undefined}
  isImage={layer.type === 'image'}
  imageSrc={layer.src}
  onChange={(field, value) => handleChange(field, value)}
  onRemoveBinding={() => { /* delete bindings.fillColor */ }}
  onOpenBindingModal={() => setBindingModalField('fillColor')}
  onOpenColorPicker={(x, y) => setActivePicker({ field: 'fillColor', x, y })}
  onOpenImagePicker={(x, y) => setActiveImagePicker({ x, y })}
/>
```

**Anatomía del render:**
- Header: label "FILL" izquierda + "Prop." derecha (purple)
- Row h-8: `[swatch 20x20] [hex text flex-1]`
- Estado bound: fila purple con nombre de propiedad + dismiss button

---

### `StrokeEditor.tsx`
**ID:** `cmp-design-stroke`

Fila compacta de edición de Stroke. Todo en una sola fila h-8.

```tsx
<StrokeEditor
  strokeWidth={layer.strokeWidth ?? 0}
  strokeColor={layer.strokeColor}
  strokeOpacity={layer.strokeOpacity}
  binding={layer.bindings?.strokeColor}
  onChange={(field, value) => handleChange(field, value)}
  onRemoveBinding={() => { /* delete bindings.strokeColor */ }}
  onOpenBindingModal={() => setBindingModalField('strokeColor')}
  onOpenColorPicker={(x, y) => setActivePicker({ field: 'strokeColor', x, y })}
/>
```

**Anatomía del render (una sola fila h-8 con border-r divisores):**
```
[☰ icon] [width input] | [swatch] [hex] | [opacity%]
```

---

### `SizeEditor.tsx`
**ID:** `cmp-design-size`

Inputs W/H con modo de sizing por dropdown (Fixed / Hug / Fill).

```tsx
<SizeEditor
  width={layer.width}
  height={layer.height}
  sizingW={layer.sizingW}
  sizingH={layer.sizingH}
  onChange={(field, value) => handleChange(field, value)}
  isText={layer.type === 'text'}  // habilita modo "hug"
/>
```

**Reglas:**
- Modo `hug` solo disponible cuando `isText={true}`.
- Cuando el modo no es `fixed`, muestra el label del modo en lugar del input numérico.
- El chevron ▾ abre el dropdown de modos posicionado `absolute right-0 top-full`.

---

## 3. Componentes del Editor

Ubicación: `src/components/editor/`

### Layout Principal

#### `Sidebar.tsx`
Wrapper base de panel lateral redimensionable. Todos los sidebars se envuelven aquí.
- `side: 'left' | 'right'`
- `defaultWidth: 300`, `minWidth: 12vw`, `maxWidth: 50vw`
- El usuario puede redimensionar arrastrando el borde.

#### `EditorHeader.tsx`
**ID:** `cmp-top-bar`

Top-Bar del editor. Contiene:
- **Izquierda:** Logo + nombre del Draft (doble click para editar)
- **Centro:** Tabs `Components | Board | Cards | Dices` con shortcuts
- **Derecha:** Botones de acción global (Settings, Export)

> **Regla:** Estos son los únicos 4 tabs del editor. No agregar más.

#### `DesignToolbar.tsx`
**ID:** `cmp-toolbar-design`

Toolbar flotante de herramientas de diseño (bottom-right del workspace). Herramientas:

| Tool ID | Ícono | Shortcut |
|---|---|---|
| `Cursor` | `Cursor20Regular` | V |
| `Shape` | `Square20Regular` | R |
| `Image` | `Image20Regular` | I |
| `Text` | `TextFont20Regular` | T |
| `Pencil` | `Pen20Regular` | P |
| `Brush` | `DrawShape20Regular` | B |

Activo: `bg-meevo-surface-5`. Inactivo: `text-meevo-text-tertiary hover:bg-[#2A2A2D]`.

#### `SnapGuides.tsx`
Guías naranjas de alineación automática al arrastrar capas. Solo visible en Design Mode.

#### `ZoomControls.tsx`
Controles de zoom flotantes sobre el workspace.

---

### Workspaces (Canvas)

| Archivo | Descripción |
|---|---|
| `Workspace.tsx` | Canvas 2D del tablero. SVG posicionado. Drag & Drop, Zoom, Pan. ~113KB. |
| `CardsWorkspace.tsx` | Canvas 2D de cartas. Similar a Workspace. ~54KB. |
| `DicesWorkspace.tsx` | Vista 3D de dados con `@react-three/fiber`. ~19KB. |

> **Regla:** NO reescribir la matemática de Workspace. Las transformaciones de zoom/pan están probadas. Las guías de alineación también.

---

### Sidebars de Configuración

Todos los sidebars de config siguen el mismo patrón de anatomía:

**Anatomía estándar de un sidebar:**
```
┌─────────────────────────────┐
│ Title (py-4 px-6 border-b)  │  ← Header fijo
├─────────────────────────────┤
│ SECTION LABEL (uppercase)   │  ← Sección
│ [Label]                     │
│ [Input / Dropdown]          │  ← Input full-width
│                             │
│ [Label W]  [Label H]        │  ← Grid 2 cols para pares
│ [Input W]  [Input H]        │
│─────────────────────────────│  ← <hr class="border-meevo-border">
│ SECTION LABEL               │
│ [□ color swatch] [#HEX    ] │  ← Color input
└─────────────────────────────┘
```

| Sidebar | Descripción |
|---|---|
| `BoardSidebar.tsx` | Config del tablero: shape, tile count, size, gap, color |
| `TableSidebar.tsx` | Config de la tabla central: shape, W/H, color + layers |
| `TileDetailSidebar.tsx` | Fill, Stroke, Rounded corners de la casilla seleccionada |
| `TilesSidebar.tsx` | Lista de casillas + asignación de variables |
| `CardDetailSidebar.tsx` | Nombre, dimensiones, rounded de carta |
| `CardsSidebar.tsx` | Gestión de mazos y cartas dentro de un mazo |
| `DecksSidebar.tsx` | Gestión de mazos |
| `DiceDetailSidebar.tsx` | Configuración del dado: sides, template, colors, faces |
| `DicesSidebar.tsx` | Lista de dados |
| `ComponentsSidebar.tsx` | Biblioteca de Templates guardados |
| `PropertiesSidebar.tsx` | Variables y propiedades del tablero |

---

### Sidebars del Sistema de Diseño (Design Mode)

#### `LayersSidebar.tsx`
**ID:** `cmp-design-layers`

Panel izquierdo del modo Design. Muestra el árbol de capas de la casilla/carta seleccionada.

**Anatomía:**
```
┌─────────────────────────────┐
│ LAYERS (header)             │
├─────────────────────────────┤
│ 📁 Casilla-01               │  ← Root folder (tile)
│   □ background              │  ← Layer row (rect)
│   T title                   │  ← Layer row selected
│   🖼 hero_image              │  ← Layer row (image)
├─────────────────────────────┤
│ [★ Convert to Template]     │  ← Footer siempre visible
│ [🔗 Connect Template]       │
└─────────────────────────────┘
```

**Templates (estados):**
- **Disconnected:** "★ Convert to Template" + "🔗 Connect Template" (ambos en `surface-2 border-meevo-border`)
- **Connected:** "★ Update Template" (`border-meevo-purple text-meevo-purple`) + "✕ Disconnect Template" (`border-red-500/20 text-red-400`)

Soporta: drag-to-reorder (DnD nativo), double-click para renombrar, shift+click para multi-select.

---

#### `LayerDetailSidebar.tsx`
**ID:** (usa sub-componentes con sus propios IDs)

Panel derecho del modo Design. Muestra propiedades de la capa seleccionada. Compuesto por secciones en orden:

1. **Name Input** — editable inline (bg transparente, focus → surface-2)
2. **Position** (`cmp-design-position`) — X/Y + 6 botones de align H/V
3. **Size** (`cmp-design-size`) — W/H con modos Fixed/Hug/Fill (via `SizeEditor`)
4. **Appearance** (`cmp-design-appearance`) — Opacity (O%) + Rotation (R°)
5. **Rounded Corners** — Solo para `type === 'shape'`, grid 2×2 por esquina
6. **Typography** (`cmp-design-typography`) — Solo para `type === 'text'`:
   - Font Family dropdown
   - Weight dropdown + Size input
   - Auto-Size toggle
   - H-Align (Left/Center/Right) + V-Align (Top/Middle/Bottom)
   - Text Content textarea + "Prop." binding
7. **Fill** (`cmp-design-fill`) — via `FillEditor`
8. **Stroke** (`cmp-design-stroke`) — via `StrokeEditor`

**Íconos de alineación usados (exactos):**
- H-align: `TextAlignLeft20Regular`, `TextAlignCenter20Regular`, `TextAlignRight20Regular`
- V-align: `AlignTop20Regular`, `AlignCenterVertical20Regular`, `AlignBottom20Regular`
- Position align (layer dentro del tile): mismos íconos

**Estado activo de botón en grupo:** `bg-meevo-surface-4`

---

### Modales del Editor

| Modal | Trigger | Descripción |
|---|---|---|
| `SettingsModal.tsx` | Botón Settings en Header | Config global del Draft |
| `CreateDiceModal.tsx` | "+" en DicesSidebar | Crea un nuevo dado |
| `CreateComponentModal.tsx` | "Convert to Template" | Guarda layers como template reutilizable |
| `ConnectComponentModal.tsx` | "Connect Template" | Vincula un template a la casilla |
| `NewPropertyModal.tsx` | "+" en PropertiesSidebar | Crea variable/propiedad del tablero |
| `PropertyBindingModal.tsx` | Botón "Prop." en Fill/Stroke | Vincula campo a variable |

**Regla:** Todos los modales usan `createPortal(modal, document.body)` y `z-[9999]`.

---

## 4. Componentes del Dashboard

Ubicación: `src/components/` (raíz)

| Componente | Descripción |
|---|---|
| `Header.tsx` | Header del Dashboard |
| `DraftCard.tsx` | Tarjeta de un borrador en el listado |
| `NewDraftModal.tsx` | Modal para crear nuevo Draft |

---

## 5. Contextos Globales

Ubicación: `src/contexts/`

### `NotificationContext.tsx`
```tsx
const { addNotification } = useNotification();
addNotification({
  type: 'success' | 'error' | 'info',
  layout: 'simple',
  title: 'Mensaje',
  message?: 'Detalle opcional'
});
```
No crear toasts propios. Usar siempre `addNotification`.

### `ContextMenuContext.tsx`
```tsx
const { showContextMenu, hideContextMenu } = useContextMenu();
showContextMenu({ x, y, items: [...] });
```
El `ContextMenu.tsx` se renderiza en `App.tsx` a nivel global.

---

## 6. Sistema de Diseño — Anatomía de Paneles

### Input estándar dentro de sidebar

```html
<!-- Label + Input full width -->
<div>
  <div class="text-[10px] font-bold text-meevo-text-secondary uppercase tracking-wider mb-2">
    LABEL
  </div>
  <div class="bg-meevo-surface-2 rounded-md px-3 py-2 flex items-center justify-between min-h-[38px]">
    <span>Valor</span>
    <svg><!-- chevron --></svg>
  </div>
</div>

<!-- Grid 2 cols (W/H) -->
<div class="grid grid-cols-2 gap-3">
  <div>
    <div class="text-[10px] ... uppercase mb-2">WIDTH</div>
    <div class="flex items-center bg-meevo-surface-2 rounded-md px-2 py-1.5">
      <span class="text-xs text-meevo-text-tertiary w-4">W</span>
      <input type="number" class="w-full bg-transparent text-sm outline-none text-center" />
    </div>
  </div>
  <!-- HEIGHT igual -->
</div>

<!-- HR divisor -->
<hr class="border-meevo-border" />

<!-- Color input -->
<div class="flex bg-meevo-surface-2 border border-meevo-border rounded-md overflow-hidden p-1 gap-2 items-center h-8">
  <div class="w-5 h-5 rounded-sm border border-[#555]" style="background: #HEX"></div>
  <div class="text-sm uppercase">#HEX</div>
</div>
```

### Inputs de posición/tamaño side-by-side (X/Y, O/R, W/H)

El patrón correcto para evitar overflow:
```html
<div style="display:flex; gap:8px; overflow:hidden;">
  <div style="flex:1; min-width:0; display:flex; align-items:center; background: var(--color-surface-2); border-radius: var(--radius-md); padding: 6px 8px;">
    <span style="font-size:0.7rem; color:var(--color-text-tertiary); width:14px; flex-shrink:0;">X</span>
    <input type="number" style="min-width:0; width:100%; background:transparent; border:none; text-align:center; outline:none;" />
  </div>
  <!-- Y igual -->
</div>
```

> **Regla crítica:** Siempre `min-width: 0` en el flex-child y `width: 100%` en el input cuando estén en un row flexbox. Sin esto, el input desborda el contenedor.

### Stroke — fila compacta h-8

```html
<div style="display:flex; background:surface-2; border:1px solid border; border-radius:md; overflow:hidden; height:32px; align-items:center;">
  <div style="width:32px; color:#777; display:flex; align-items:center; justify-content:center;">☰</div>
  <input type="number" style="width:36px; text-align:center; border-right:1px solid border;" />
  <div style="flex:1; display:flex; gap:8px; padding:0 8px; border-right:1px solid border;">
    <div style="width:16px; height:16px; background:#HEX; border:1px solid #555;"></div>
    <span>#FFFFFF</span>
  </div>
  <input type="number" style="width:36px; text-align:center;" />
  <span style="padding-right:8px; color:#777;">%</span>
</div>
```

---

## 7. Reglas de Creación de Nuevos Componentes

### ¿Va en `ui/` o en `editor/`?

| Criterio | `ui/` | `editor/` |
|---|---|---|
| ¿Usable fuera del editor (Dashboard)? | ✅ | ❌ |
| ¿Agnóstico del dominio de juego? | ✅ | ❌ |
| ¿Importa tipos de `types.ts`? | ❌ (solo para props) | ✅ |
| ¿Accede a estado del Board/Card/Dice? | ❌ | ✅ |

### ¿Debo crear un nuevo componente?

Antes de crear, verificar:
1. ¿Existe ya algo similar en la lista de este documento?
2. ¿Podría extender un componente existente con una nueva prop en lugar de duplicarlo?
3. ¿El patrón visual ya está documentado en la guía (`web/guidelines/index.html`)?

### Template mínimo de componente en `ui/`

```tsx
import React from 'react';
// Solo Fluent icons de @fluentui/react-icons

interface MyComponentProps {
  // Props tipadas estrictamente
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({ value, onChange, onClose }) => {
  return (
    <div className="bg-meevo-surface-2 border border-meevo-border rounded-md p-4">
      {/* Usar SIEMPRE clases de Meevo. Nunca colores hardcoded */}
    </div>
  );
};
```

### Al actualizar la arquitectura

Si agregas un nuevo componente reutilizable o cambias un contrato de props sustancial, **actualiza este archivo** y también **`LLM.md`** para que el contexto siga siendo válido.
