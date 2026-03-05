# Informe de Construcción de Data Agropecuaria (Perímetros Reales)

## Objetivo
Documentar cómo se construyeron las coordenadas de la capa `AGROPECUARIO` en `src/data/resources.ts`, reemplazando polígonos manuales por perímetros derivados de geometría oficial.

## Fecha de actualización
- 2026-03-05

## Fuente oficial usada
- Georef Argentina (IGN):
  - `https://apis.datos.gob.ar/georef/api/v2.0/departamentos.geojson`
- Referencia API/repo:
  - `https://github.com/datosgobar/georef-ar-api`

## Criterio de construcción
1. Se partió de departamentos oficiales (no centroides, no bounding boxes).
2. Para cada macrozona (`AG-01` ... `AG-08`) se definió una selección por provincia/departamento.
3. Esa selección está versionada en:
   - `auxiliary/agro-zones/zone_selection_reference.json`
4. Se extrajeron anillos externos de `Polygon` y `MultiPolygon`.
5. Se aplicó simplificación geométrica (Ramer-Douglas-Peucker):
   - epsilon 0.02 (general)
   - epsilon 0.03 (`AG-04`, `AG-08`)
6. Se removieron micro-islas/polígonos mínimos (`area < 0.01` grados²) para evitar ruido visual.
7. Se redondearon coordenadas a 6 decimales.

## Pipeline reproducible
1. Descargar el GeoJSON oficial:

```bash
curl -Ls 'https://apis.datos.gob.ar/georef/api/v2.0/departamentos.geojson' -o /tmp/departamentos.geojson
```

2. Generar coordenadas por zona:

```bash
node auxiliary/agro-zones/build-agro-coords.js \
  /tmp/departamentos.geojson \
  auxiliary/agro-zones/zone_selection_reference.json \
  /tmp/agro_coords_final.json
```

3. Inyectar `/tmp/agro_coords_final.json` en `src/data/resources.ts` para `AG-01..AG-08`.

## Resultado aplicado en código
- Archivo: `src/data/resources.ts`
- Secciones afectadas: features `AG-01` a `AG-08` de `AGROPECUARIO`.
- Estado: build validado con `npm run build`.

## Notas técnicas
- La zonificación es temática-productiva; puede haber solapamientos parciales entre macrozonas (intencional por uso de negocio).
- Se privilegió fidelidad territorial real sobre peso del bundle, por eso aumentó el tamaño del chunk JS.
- Si se necesita optimizar performance, mover geometrías a archivo externo (`public/*.json`) y cargar bajo demanda.

## Checklist para próximas revisiones
- Actualizar selección de departamentos en `zone_selection_reference.json` si cambia el criterio productivo.
- Regenerar coordenadas con `build-agro-coords.js`.
- Validar render visual y `npm run build`.
- Registrar fecha y motivo del ajuste en este README.
