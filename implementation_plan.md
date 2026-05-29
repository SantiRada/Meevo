# Implementación de Tema Claro (Light Mode) y Refactorización de Colores

El objetivo es migrar todos los colores quemados (hardcoded) y la configuración de Tailwind hacia un sistema de variables CSS dinámicas, permitiendo así cambiar entre Modo Claro y Oscuro en toda la aplicación de manera instantánea.

## Proposed Changes

### 1. Sistema de Variables CSS (src/index.css)
Migrar los colores del producto a variables CSS.
- Se definirá :root con las variables para el **Modo Oscuro** (actual por defecto).
- Se definirá :root.light con las variables para el **Modo Claro**.
- **Colores propuestos para el Modo Claro**:
  - g: #F4F4F5
  - panel: #FAFAFA
  - card: #FFFFFF
  - order: #E4E4E7
  - 	ext-primary: #09090B
  - 	ext-secondary: #52525B
  - 	ext-tertiary: #A1A1AA
  - 	ext-inverse: #FFFFFF

### 2. Configuración de Tailwind (	ailwind.config.js)
Actualizar la paleta meevo para consumir las variables CSS (ej. g: 'var(--meevo-bg)'), lo que permite que Tailwind inyecte los colores dinámicos sin cambiar los nombres de las clases.

### 3. Refactorización de Clases Quemadas (Hardcoded)
Reemplazar los colores literales como g-[#1A1A1D], g-[#070709], order-[#CCCCCC]/10 por sus equivalentes semánticos (g-meevo-card, g-meevo-bg, order-meevo-border) en:
- Editor.tsx
- EditorHeader.tsx
- SettingsModal.tsx
- Componentes de Sidebar (Dices, Cards, Components)

### 4. Lógica de Cambio de Tema (SettingsModal.tsx y App.tsx)
- Guardar la preferencia de tema ('Dark' o 'Light') en localStorage.
- Inyectar la clase light en la etiqueta <html> o <body> al inicializar la app y al cambiar el toggle en configuración.

## User Review Required
> [!IMPORTANT]
> Revisa la paleta de colores propuesta para el modo claro. ¿Estás de acuerdo con esos tonos grises/blancos o prefieres tonos más cálidos o alguna otra paleta específica?

## Verification Plan
1. Ejecutar la aplicación en modo desarrollo.
2. Abrir configuración y alternar entre "Dark" y "Light".
3. Verificar que todas las secciones (Editor, Sidebar, Header, Modales, ContextMenu) cambien de color correctamente sin que quede ningún fondo oscuro desfasado.
