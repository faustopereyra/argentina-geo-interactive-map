#!/usr/bin/env node

/**
 * Construye coordenadas de macrozonas agropecuarias a partir de departamentos oficiales (IGN/Georef).
 *
 * Uso:
 * 1) Descargar dataset oficial:
 *    curl -Ls 'https://apis.datos.gob.ar/georef/api/v2.0/departamentos.geojson' -o /tmp/departamentos.geojson
 * 2) Ejecutar:
 *    node auxiliary/agro-zones/build-agro-coords.js /tmp/departamentos.geojson auxiliary/agro-zones/zone_selection_reference.json /tmp/agro_coords_final.json
 */

const fs = require('fs');

const [inputPath, selectionPath, outputPath] = process.argv.slice(2);

if (!inputPath || !selectionPath || !outputPath) {
  console.error('Uso: node build-agro-coords.js <departamentos.geojson> <zone_selection_reference.json> <output.json>');
  process.exit(1);
}

const geo = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const selection = JSON.parse(fs.readFileSync(selectionPath, 'utf8'));

function normalize(value) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

function makeDeptFilter(includeSpec) {
  const includeByProv = new Map();

  for (const group of includeSpec) {
    const provKey = normalize(group.provincia);
    if (!group.departamentos) {
      includeByProv.set(provKey, null);
      continue;
    }

    includeByProv.set(
      provKey,
      new Set(group.departamentos.map((d) => normalize(d))),
    );
  }

  return (feature) => {
    const provKey = normalize(feature.properties.provincia.nombre);
    const depKey = normalize(feature.properties.nombre);

    if (!includeByProv.has(provKey)) return false;
    const depSet = includeByProv.get(provKey);

    if (depSet === null) return true;
    return depSet.has(depKey);
  };
}

function pointLineDistance(point, start, end) {
  const [x, y] = point;
  const [x1, y1] = start;
  const [x2, y2] = end;

  const dx = x2 - x1;
  const dy = y2 - y1;

  if (dx === 0 && dy === 0) {
    return Math.hypot(x - x1, y - y1);
  }

  const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;

  return Math.hypot(x - projX, y - projY);
}

function rdp(points, epsilon) {
  if (points.length < 3) return points;

  let maxDistance = 0;
  let index = 0;

  for (let i = 1; i < points.length - 1; i += 1) {
    const distance = pointLineDistance(points[i], points[0], points[points.length - 1]);
    if (distance > maxDistance) {
      index = i;
      maxDistance = distance;
    }
  }

  if (maxDistance <= epsilon) {
    return [points[0], points[points.length - 1]];
  }

  const left = rdp(points.slice(0, index + 1), epsilon);
  const right = rdp(points.slice(index), epsilon);

  return [...left.slice(0, -1), ...right];
}

function simplifyRing(ring, epsilon = 0.02) {
  if (!Array.isArray(ring) || ring.length < 4) return ring;

  const first = ring[0];
  const last = ring[ring.length - 1];
  const closed = first[0] === last[0] && first[1] === last[1];
  const base = closed ? ring.slice(0, -1) : ring.slice();

  const simplified = rdp(base, epsilon);
  const output = simplified.length >= 4 ? simplified : base;

  const c0 = output[0];
  const c1 = output[output.length - 1];
  if (c0[0] !== c1[0] || c0[1] !== c1[1]) {
    output.push([...c0]);
  }

  return output;
}

function extractRings(geometry) {
  if (geometry.type === 'Polygon') {
    return [geometry.coordinates[0]];
  }

  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.map((polygon) => polygon[0]);
  }

  return [];
}

function polygonArea(ring) {
  let area = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area) / 2;
}

function centroid(ring) {
  let sumX = 0;
  let sumY = 0;

  for (const [x, y] of ring) {
    sumX += x;
    sumY += y;
  }

  return [sumX / ring.length, sumY / ring.length];
}

const coordsByZone = {};

for (const [zoneId, zoneSpec] of Object.entries(selection)) {
  const filter = makeDeptFilter(zoneSpec.include);
  const selected = geo.features.filter(filter);

  const epsilon = zoneId === 'AG-04' || zoneId === 'AG-08' ? 0.03 : 0.02;

  const rings = selected
    .flatMap((feature) => extractRings(feature.geometry))
    .map((ring) => simplifyRing(ring, epsilon))
    .filter((ring) => ring.length >= 4)
    .filter((ring) => polygonArea(ring) >= 0.01)
    .map((ring) => ring.map(([lon, lat]) => [Number(lon.toFixed(6)), Number(lat.toFixed(6))]))
    .sort((a, b) => centroid(a)[1] - centroid(b)[1]);

  coordsByZone[zoneId] = rings;

  const points = rings.reduce((acc, ring) => acc + ring.length, 0);
  console.log(`${zoneId}: departamentos=${selected.length}, anillos=${rings.length}, puntos=${points}`);
}

fs.writeFileSync(outputPath, JSON.stringify(coordsByZone, null, 2));
console.log(`\nArchivo generado: ${outputPath}`);
