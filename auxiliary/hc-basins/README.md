# Deep Research: Cuencas Hidrocarburíferas (coordenadas reales)

## Objetivo
Actualizar la geometría de `CUENCAS_HC` en `src/data/resources.ts` con coordenadas reales derivadas de fuente oficial, replicando el enfoque reproducible usado para `AGROPECUARIO`.

## Fecha de actualización
- 2026-03-05

## Fuentes oficiales utilizadas
- Portal nacional de datos abiertos (dataset base):
  - https://datos.gob.ar/dataset/energia-cuencas-sedimentarias/archivo/energia_4.7
  - Última actualización informada en el catálogo: **2023-05-03**.
- Servicio WFS oficial de Secretaría de Energía (endpoint cartográfico en producción):
  - `https://sig.energia.gob.ar/wfsenergia?service=WFS&version=1.1.0&request=GetCapabilities`
  - Operaciones `GetFeature` sobre `https://sig.energia.gob.ar/mapserv?map=/etc/mapserver/mapase.map`.
- Capa usada para esta actualización:
  - `ms:ypf_cuencas_sedimentarias_productivas`

## Criterio metodológico
1. Se descargó la capa oficial en formato GeoJSON vía WFS (`GetFeature`).
2. Se tomó la geometría original de cada cuenca productiva, sin reconstrucción manual.
3. Se extrajeron anillos externos (`Polygon`/`MultiPolygon`) para render en Leaflet.
4. Se aplicaron normalizaciones no cartográficas:
   - cierre explícito de anillos,
   - eliminación de vértices consecutivos duplicados,
   - redondeo a 6 decimales.
5. Se mapeó cada nombre oficial de cuenca a `HC-01..HC-05`.

## Pipeline reproducible
1. Descargar GeoJSON oficial (WFS):

```bash
curl -Ls 'https://sig.energia.gob.ar/mapserv?map=/etc/mapserver/mapase.map&SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=ms:ypf_cuencas_sedimentarias_productivas&OUTPUTFORMAT=application/json;%20subtype=geojson&SRSNAME=EPSG:4326' -o /tmp/cuencas_productivas.geojson
```

2. Generar coordenadas por `HC-01..HC-05`:

```bash
node auxiliary/hc-basins/build-hc-basin-coords.js \
  /tmp/cuencas_productivas.geojson \
  /tmp/hc_coords_final.json
```

3. Inyectar `/tmp/hc_coords_final.json` en `src/data/resources.ts` para `CUENCAS_HC`.

## Mapeo aplicado
- `NEUQUINA` -> `HC-01`
- `GOLFO SAN JORGE` -> `HC-02`
- `AUSTRAL MARINA` -> `HC-03`
- `NOROESTE` -> `HC-04`
- `CUYANA` -> `HC-05`

## Verificación
- `npm run build` sin errores.
- Render correcto esperado para:
  - `HC-04` como multipolígono.
  - cuencas onshore+offshore (`HC-02`, `HC-03`) con huella real completa.
