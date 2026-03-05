# Atlas de Recursos de Argentina

Mapa interactivo open source para explorar activos y zonas estratégicas de minería, hidrocarburos, infraestructura energética y macrozonas agropecuarias en Argentina.

## Qué es este proyecto

Este repositorio contiene una aplicación web construida con React + TypeScript + Leaflet que permite:

- Visualizar múltiples capas temáticas sobre un mapa base de Argentina.
- Encender/apagar capas por categoría desde un panel lateral.
- Seleccionar features para inspeccionar su ficha técnica.
- Cambiar entre mapas base (`Oscuro`, `Topográfico`, `Satélite`, `Claro`).
- Analizar estado operativo de proyectos (producción, ramp-up, desarrollo, etc.).

Está pensado como proyecto demostrativo y base para visualizaciones de inteligencia territorial.

## Demo local (rápido)

Requisitos:

- Node.js 18+ (recomendado 20+)
- npm

Instalación y ejecución:

```bash
npm install
npm run dev
```

Build de producción:

```bash
npm run typecheck
npm run build
npm run preview
```

## Stack técnico

- `React 18`
- `TypeScript`
- `Vite 5`
- `Leaflet + react-leaflet`

## Estructura del repo

```text
src/
  App.tsx                     # Estado global de UI y layout principal
  main.tsx                    # Bootstrap de React
  index.css                   # Tema visual + responsive
  components/
    ArgentinaMap.tsx          # Render de mapa, capas y tooltips
    Sidebar.tsx               # Panel de capas por categoría
    FeaturePanel.tsx          # Panel de detalle de cada feature
  data/
    resources.ts              # Basemaps + catálogo completo de capas/features
  types/
    resources.ts              # Tipos de dominio (capas, features, estados)
auxiliary/
  agro-zones/
    README.md                 # Pipeline de geometrías agropecuarias
    build-agro-coords.js      # Script de generación de coordenadas
    zone_selection_reference.json # Selección de departamentos por macrozona
  hc-basins/
    README.md                 # Deep research + metodología de cuencas HC
    build-hc-basin-coords.js  # Script de generación de coordenadas oficiales WFS
```

## Arquitectura funcional (deep dive)

### 1) Flujo de estado (App)

`src/App.tsx` centraliza:

- Capas activas (`Set<LayerId>`)
- Feature seleccionada + capa origen
- Mapa base activo
- Estado del sidebar en mobile

Este estado se distribuye a:

- `Sidebar` para toggles de capas
- `ArgentinaMap` para render cartográfico
- `FeaturePanel` para detalle del elemento seleccionado

### 2) Motor cartográfico (ArgentinaMap)

`src/components/ArgentinaMap.tsx` renderiza:

- `TileLayer` dinámico según basemap.
- `GeoJSON` de provincias (fuente oficial + fallback).
- Features de todas las capas con lógica por tipo:
  - `point` -> `CircleMarker`
  - `polygon` -> `Polygon` (soporta multi-partes)
  - `mixed` -> `Polyline` + `CircleMarker`
  - `company` -> marcadores empresariales con estilo propio

Comportamientos clave:

- Hover con feedback visual.
- Tooltip resumido contextual.
- Click para abrir panel de detalle.
- Barra de coordenadas en tiempo real.

### 3) Modelo de datos

`src/types/resources.ts` define un modelo tipado para:

- IDs de capas y categorías.
- Tipos de features (punto, polígono, línea mixta, empresa).
- Metadatos opcionales por vertical (minería, oil & gas, agro).
- Estados operativos normalizados (`active`, `ramping`, etc.).

`src/data/resources.ts` contiene:

- Config de basemaps y categorías.
- Catálogo completo `ALL_LAYERS`.
- Capas visibles por defecto `DEFAULT_VISIBLE`.
- Centro/zoom inicial del mapa.
- Endpoint de provincias oficial (`datos.gob.ar`).

### 4) UX y responsive

`src/index.css` implementa:

- Tema oscuro con tokens CSS (`:root`).
- Sidebar fijo desktop y drawer en mobile.
- Panel flotante de detalle con scroll.
- Leyenda de estado y badges de color.
- Ajustes de interfaz por breakpoints (`1180`, `920`, `768`).

## Capas incluidas

Actualmente el mapa integra:

- Minería:
  - Litio
  - Cobre/Oro/Plata
  - Otros minerales
- Hidrocarburos:
  - Cuencas hidrocarburíferas (polígonos)
  - Vaca Muerta (bloques)
  - Petróleo convencional
  - Empresas operadoras
  - Infraestructura (gasoductos/plantas/terminales)
- Agropecuario:
  - Macrozonas productivas (polígonos)

## Datos y fuentes

El proyecto agrega datos de distintas fuentes públicas y sectoriales. En la UI se listan:

- SEGEMAR
- IAPG
- SAGyP
- INDEC
- SENASA
- BCBA
- BCR
- IGN
- datos.gob.ar
- Secretaría de Energía (WFS SIG)

Importante:

- Este repositorio no pretende reemplazar cartografía oficial.
- La capa `CUENCAS_HC` está trazada con geometría oficial WFS de Secretaría de Energía.
- Es recomendable validar contra fuentes oficiales antes de usos críticos.

## Pipeline de macrozonas agropecuarias

En `auxiliary/agro-zones/` hay un proceso reproducible para regenerar coordenadas de `AG-01..AG-08` a partir de departamentos oficiales.

Resumen:

1. Descargar GeoJSON oficial de departamentos.
2. Seleccionar departamentos por zona (`zone_selection_reference.json`).
3. Ejecutar `build-agro-coords.js` (incluye simplificación geométrica).
4. Inyectar el resultado en `src/data/resources.ts`.

Ver detalles en:

- `auxiliary/agro-zones/README.md`

## Pipeline de cuencas hidrocarburíferas

En `auxiliary/hc-basins/` hay un proceso reproducible para regenerar coordenadas de `HC-01..HC-05` desde la capa oficial WFS de Secretaría de Energía.

Resumen:

1. Descargar `ms:ypf_cuencas_sedimentarias_productivas` en GeoJSON.
2. Ejecutar `build-hc-basin-coords.js`.
3. Inyectar el resultado en `src/data/resources.ts`.

Ver detalles en:

- `auxiliary/hc-basins/README.md`

## Cómo contribuir

Pull requests y issues son bienvenidos.

Sugerencias para contribuir de forma ordenada:

1. Abrir issue con contexto (qué capa, qué fuente, qué cambio).
2. Mantener tipado estricto en `src/types/resources.ts`.
3. Si agregás datos nuevos:
   - Documentar fuente y fecha.
   - Mantener consistencia de `statusType`.
   - Verificar que el panel renderice sin campos rotos.
4. Correr checks antes de abrir PR:

```bash
npm run typecheck
npm run build
```

## Ideas de roadmap

- Externalizar datasets pesados a `public/*.json` para reducir bundle.
- Clustering para capas de alta densidad.
- Filtros por estado, commodity y provincia.
- Búsqueda textual de features.
- Tests de regresión visual/cartográfica.

## Licencia

Pendiente de definir (`LICENSE` no incluido todavía).
Recomendado para proyecto open source: MIT o Apache-2.0.
