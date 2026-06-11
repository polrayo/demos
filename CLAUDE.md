# CLAUDE.md — Demo genérica

Guía de referencia del proyecto para Claude Code. Contiene todo lo que se debe conocer antes de tocar el código.

---

## Descripción del proyecto

Aplicación web SPA de tipo **dashboard con panel lateral**, construida con React 18 + Vite 5. El diseño visual sigue fielmente el lenguaje visual minimalista de Apple (apple.com, macOS, iOS): tipografía del sistema, espaciado generoso, paleta blanco/gris claro con azul de acento, y animaciones suaves.

**No hay router externo ni librería de UI.** Toda la navegación entre secciones se resuelve con estado local en `App.jsx`.

---

## Stack y dependencias

| Herramienta | Versión | Rol |
| --- | --- | --- |
| React | ^18.2.0 | UI |
| Vite | ^5.0.0 | Bundler / dev server |
| @vitejs/plugin-react | ^4.0.0 | Plugin Babel para JSX |
| CSS Modules | nativo | Estilos encapsulados |
| Nginx Alpine | imagen Docker | Servidor de producción |

**Sin dependencias externas de UI** (no Tailwind, no MUI, no Bootstrap, no React Router).

---

## Comandos esenciales

```bash
npm install        # Instalar dependencias
npm run dev        # Servidor de desarrollo → http://localhost:5173
npm run build      # Build de producción → dist/
npm run preview    # Previsualizar el build local

# Docker
docker build --target dev  -t demo-dev  .   # Puerto 5173
docker build --target prod -t demo-prod .   # Puerto 8080 (Nginx)
docker run -p 5173:5173 demo-dev
docker run -p 8080:8080 demo-prod
```

---

## Estructura de archivos

```text
src/
├── App.jsx                        # Raíz: layout flex + estado global (sección activa, sidebar, dark mode)
├── App.module.css                 # CSS del layout principal (flex row, margin-left reactivo al sidebar)
├── constants.js                   # SECTIONS — fuera de App.jsx para evitar dependencias circulares
├── main.jsx                       # Entry point de React
│
├── styles/
│   └── globals.css                # Variables CSS, reset, fuentes, prefers-reduced-motion
│
├── hooks/
│   └── useScrollAnimation.js      # Intersection Observer → devuelve [ref, isVisible]
│
├── components/
│   └── Sidebar/                   # Panel izquierdo colapsable
│       ├── Sidebar.jsx
│       └── Sidebar.module.css
│
└── pages/                         # Contenido de cada sección del sidebar
    ├── General/                   # Dashboard: métricas, actividad, gráfica de barras
    ├── Detalle/                   # Tabla filtrable con búsqueda y tabs de estado
    └── Detalle2/                  # Cards expandibles con progreso, prioridad y tags
```

---

## Arquitectura del layout

El layout raíz es un **flex row** definido en `App.jsx` + `App.module.css`:

```text
┌─────────────────────────────────────────────────────────┐
│  <aside> Sidebar (position: fixed, 260px / 64px)        │
│  ─────────────────────────────────────────────────────  │
│  Logo + título "Demo genérica"                          │
│  ─────────────────────────────────────────────────────  │
│  Nav: General · Detalle · Detalle 2                     │
│  ─────────────────────────────────────────────────────  │
│  Footer: toggle dark/light mode                         │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│  <main> (margin-left: 260px → 64px al colapsar)         │
│  Renderiza el componente de página activo               │
└─────────────────────────────────────────────────────────┘
```

### Cómo funciona la navegación

`App.jsx` mantiene tres estados:

```jsx
const [activeSection,    setActiveSection]    = useState('general')
const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
const [darkMode,         setDarkMode]         = useState(...)
```

Las secciones se definen en `src/constants.js` (archivo independiente para evitar dependencias circulares):

```js
// src/constants.js
export const SECTIONS = {
  GENERAL:  'general',
  DETALLE:  'detalle',
  DETALLE2: 'detalle2',
}
```

> **Importante:** `SECTIONS` no puede vivir en `App.jsx` porque `Sidebar.jsx` lo importa, y `App.jsx` importa `Sidebar`. Esa dependencia circular hace que el módulo llegue como `undefined` al arrancar y la página queda en blanco.

El componente a renderizar se resuelve con un objeto mapa (no con `if/else` ni con router):

```jsx
const contentMap = {
  general:  <General />,
  detalle:  <Detalle />,
  detalle2: <Detalle2 />,
}
// ...
<main>{contentMap[activeSection]}</main>
```

### Añadir una nueva sección

1. Crear `src/pages/NuevaPagina/NuevaPagina.jsx` y su `.module.css`.
2. Añadir la constante en `SECTIONS` dentro de `src/constants.js`.
3. Añadir la entrada en `contentMap` en `App.jsx`.
4. Añadir el ítem en el array `NAV_ITEMS` de `Sidebar.jsx` con su icono SVG.

---

## Sistema de diseño (CSS)

### Variables CSS globales (`src/styles/globals.css`)

Todos los colores y valores de diseño se consumen a través de variables CSS. **Nunca usar valores hardcoded de color en los módulos.**

| Variable | Light | Dark |
| --- | --- | --- |
| `--color-bg-primary` | `#FFFFFF` | `#000000` |
| `--color-bg-secondary` | `#F5F5F7` | `#1C1C1E` |
| `--color-text-primary` | `#1D1D1F` | `#F5F5F7` |
| `--color-text-secondary` | `#86868B` | `#98989D` |
| `--color-accent` | `#0071E3` | `#2997FF` |
| `--color-accent-hover` | `#0077ED` | `#409CFF` |
| `--color-border` | `rgba(0,0,0,0.08)` | `rgba(255,255,255,0.1)` |
| `--color-navbar-bg` | `rgba(255,255,255,0.72)` | `rgba(0,0,0,0.72)` |

Otras variables globales:

| Variable | Valor |
| --- | --- |
| `--font-family` | `-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial` |
| `--ease-apple` | `cubic-bezier(0.25, 0.1, 0.25, 1)` |
| `--max-width` | `980px` |
| `--shadow-card` | `0 4px 24px rgba(0,0,0,0.07)` |

### Variables del Sidebar (`Sidebar.module.css`)

```css
--sidebar-width:           260px;   /* Expandido */
--sidebar-collapsed-width: 64px;    /* Colapsado */
```

Estas variables las lee `App.module.css` para calcular el `margin-left` del `<main>`.

### Dark mode

El tema se controla con el atributo `data-theme="dark"` en `<html>`. Se detecta la preferencia del sistema al cargar (script inline en `index.html` para evitar flash) y se sincroniza en tiempo real con `matchMedia`.

Para aplicar estilos específicos de dark mode dentro de un módulo CSS:

```css
[data-theme="dark"] .miClase {
  color: #F5F5F7;
}
```

### Breakpoints responsivos

| Nombre | Valor | Uso |
| --- | --- | --- |
| Tablet | `1068px` | Cambiar grid de 3 a 2 columnas |
| Móvil | `734px` | Sidebar como overlay, layouts de 1 columna |

En móvil (≤734px) el sidebar **no se colapsa** a 64px sino que **sale del viewport** con `translateX(-260px)` y se superpone con un overlay oscuro al abrirse.

### Reglas de tipografía

- Títulos de página: `font-size: 32px`, `font-weight: 300`, `letter-spacing: -0.02em`
- Títulos de sección: `font-size: clamp(30px, 5vw, 48px)`, `font-weight: 300`
- Cuerpo: `font-size: 17px`, `font-weight: 400`, `line-height: 1.6`
- Etiquetas secundarias: `font-size: 12-13px`, `color: var(--color-text-secondary)`
- Labels de categoría/estado: `font-size: 11-13px`, `font-weight: 500`, `text-transform: uppercase`, `letter-spacing: 0.06-0.08em`

### Botones pill (estilo Apple)

```css
padding: 9px 20px;          /* mínimo — hasta 14px 28px en hero */
border-radius: 980px;       /* hace el pill */
font-size: 13px;            /* 17px en hero */
```

- Primario: `background: var(--color-accent)`, texto blanco
- Secundario: `border: 1.5px solid var(--color-accent)`, fondo transparente

---

## Hook `useScrollAnimation`

Ubicación: `src/hooks/useScrollAnimation.js`

Encapsula `IntersectionObserver` para animar elementos al entrar en el viewport. Una vez visible, deja de observar (optimización).

```jsx
const [ref, isVisible] = useScrollAnimation({ threshold: 0.15 })

return (
  <div
    ref={ref}
    className={`${styles.card} ${isVisible ? styles.cardVisible : ''}`}
  />
)
```

El patrón CSS estándar para usarlo:

```css
.card {
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 0.8s var(--ease-apple), transform 0.8s var(--ease-apple);
}
.card.cardVisible {
  opacity: 1;
  transform: translateY(0);
}
```

Para escalonar múltiples tarjetas usar `transitionDelay` inline:

```jsx
style={{ transitionDelay: `${index * 80}ms` }}
```

---

## Componentes de páginas

### `General` — Dashboard

- 4 tarjetas de métricas en grid (4 col → 2 col en tablet)
- Lista de actividad reciente (avatar, usuario, acción, tiempo)
- Gráfica de barras construida en CSS puro con `@keyframes growBar` y `var(--bar-height)`

### `Detalle` — Tabla filtrable

- Buscador en tiempo real (filtra por `nombre` e `id`)
- Pestañas de filtro por estado: Todos / Activo / Revisión / Inactivo
- Tabla con filas alternadas y hover con `color-mix`
- Badge de estado con colores semánticos (verde/naranja/gris)
- Botón "+ Nuevo registro" con estilo pill primario

### `Detalle2` — Cards expandibles

- Resumen numérico (total, completados, progreso medio)
- Cards con cabecera clickable que expande un cuerpo con `max-height` animado
- Barra de progreso con gradiente azul→índigo mediante `::after` y `var(--progress)`
- Badge de prioridad (Alta/Media/Baja) con colores semánticos
- Tags tipo chip y botones de acción al expandir

---

## Sidebar — Referencia rápida

| Prop | Tipo | Descripción |
| --- | --- | --- |
| `collapsed` | `boolean` | Estado colapsado/expandido |
| `onToggle` | `() => void` | Alterna `collapsed` |
| `activeSection` | `string` | Sección activa (usa `SECTIONS.*`) |
| `onSectionChange` | `(section: string) => void` | Callback al pulsar un ítem |
| `darkMode` | `boolean` | Estado del tema |
| `onToggleDarkMode` | `() => void` | Alterna dark/light |

Los ítems de navegación se definen en el array `NAV_ITEMS` dentro de `Sidebar.jsx`. Cada ítem tiene `{ id, label, Icon }` donde `Icon` es un componente funcional que retorna un SVG.

---

## Dockerfile

Build multi-stage con 4 targets:

| Stage | Base | Puerto | Uso |
| --- | --- | --- | --- |
| `deps` | `node:20-alpine` | — | Instala `npm ci`, base compartida |
| `dev` | deps | 5173 | Vite dev server con HMR |
| `build` | deps | — | Genera `dist/` con `npm run build` |
| `prod` | `nginx:alpine` | 8080 | Sirve `dist/` con SPA fallback y gzip |

La configuración de Nginx se genera con `printf` dentro del Dockerfile (sin archivo externo). Soporta `try_files $uri /index.html` para navegación SPA y cache `1y` para assets con hash.

---

## Convenciones de código

- **Functional components** siempre, sin clases.
- **CSS Modules** para todos los estilos: el archivo `.module.css` vive junto a su componente.
- **Datos hardcoded** como arrays de constantes en mayúsculas (`ITEMS`, `NAV_ITEMS`, `METRICS`) definidos fuera del componente para no recrearlos en cada render.
- **Iconos SVG inline** como componentes funcionales dentro del mismo archivo que los usa, estilo SF Symbols (stroke, sin fill, `strokeWidth: 1.5-1.8`).
- **Sin `useEffect` para datos**: los datos son estáticos. `useEffect` se usa solo para eventos del DOM (scroll, resize, matchMedia) y para `IntersectionObserver`.
- Comentarios en **español**.
- Los archivos CSS siguen la estructura: contenedor → sub-elementos → estados → responsive.

---

## Colores semánticos de estado (no en globals.css)

Usados localmente en `Detalle` y `Detalle2` con `color-mix` para fondos:

| Estado | Color base | Uso |
| --- | --- | --- |
| Activo / Completado | `#34C759` | Verde sistema iOS |
| Revisión / Media | `#FF9500` | Naranja sistema iOS |
| Inactivo / Baja | `#8E8E93` | Gris sistema iOS |
| Alta prioridad | `#FF3B30` | Rojo sistema iOS |

En dark mode se usan las variantes más brillantes (`#30D158`, `#FF9F0A`, `#FF453A`).
