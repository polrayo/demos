# Demo — Landing Page

Aplicación React + Vite con diseño minimalista inspirado en Apple.

## Requisitos previos

- Node.js >= 18
- npm >= 9 (o yarn/pnpm)
- Docker (opcional, para contenedores)

## Instalación y desarrollo local

```bash
# Clonar e instalar dependencias
npm install

# Iniciar servidor de desarrollo (por defecto en http://localhost:5173)
npm run dev
```

## Build de producción (local)

```bash
# Generar build optimizado
npm run build

# Previsualizar el build
npm run preview
```

## Docker

### Modo desarrollo

```bash
docker build --target dev -t demo-dev .
docker run -p 5173:5173 demo-dev
```

### Modo producción (servido en puerto 8080)

```bash
docker build --target prod -t demo-prod .
docker run -p 8080:8080 demo-prod
```

## Tecnologías

- **React 18** — Functional components y hooks
- **Vite 5** — Bundler ultrarrápido con HMR
- **CSS Modules** — Estilos encapsulados por componente, sin clases globales
- **Nginx Alpine** — Servidor de producción mínimo y seguro

## Diseño

El proyecto replica fielmente el sistema de diseño de Apple:

| Elemento       | Valor                                                                  |
|---------------|------------------------------------------------------------------------|
| Tipografía    | `-apple-system, BlinkMacSystemFont, "SF Pro Display", Helvetica Neue` |
| Fondo claro   | `#FFFFFF` / `#F5F5F7`                                                  |
| Fondo oscuro  | `#000000` / `#1C1C1E`                                                  |
| Texto         | `#1D1D1F` (claro) · `#F5F5F7` (oscuro)                                |
| Acento        | `#0071E3` (claro) · `#2997FF` (oscuro)                                 |
| Navbar        | `backdrop-filter: blur(20px) saturate(180%)`                           |
| Animaciones   | `cubic-bezier(0.25, 0.1, 0.25, 1)`                                     |
| Breakpoints   | `734px` y `1068px` (los mismos que apple.com)                         |
