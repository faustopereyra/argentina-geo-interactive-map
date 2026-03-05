#!/usr/bin/env node

/**
 * Construye coordenadas de cuencas hidrocarburíferas productivas
 * a partir de la capa oficial WFS de la Secretaría de Energía.
 *
 * Uso:
 *   node auxiliary/hc-basins/build-hc-basin-coords.js \
 *     /tmp/cuencas_productivas.geojson \
 *     /tmp/hc_coords_final.json
 */

import fs from 'node:fs';

const [inputPath, outputPath] = process.argv.slice(2);

if (!inputPath || !outputPath) {
  console.error('Uso: node build-hc-basin-coords.js <cuencas_productivas.geojson> <output.json>');
  process.exit(1);
}

const geo = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

const CUENCA_TO_ID = {
  NEUQUINA: 'HC-01',
  'GOLFO SAN JORGE': 'HC-02',
  'AUSTRAL MARINA': 'HC-03',
  NOROESTE: 'HC-04',
  CUYANA: 'HC-05',
};

function normalize(value) {
  return String(value)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase()
    .trim();
}

function roundPoint(point) {
  return [Number(point[0].toFixed(6)), Number(point[1].toFixed(6))];
}

function ensureClosed(ring) {
  if (!ring.length) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];

  if (first[0] === last[0] && first[1] === last[1]) return ring;
  return [...ring, [...first]];
}

function dedupeSequential(ring) {
  if (ring.length < 2) return ring;

  const out = [ring[0]];
  for (let i = 1; i < ring.length; i += 1) {
    const prev = out[out.length - 1];
    const curr = ring[i];
    if (prev[0] !== curr[0] || prev[1] !== curr[1]) {
      out.push(curr);
    }
  }

  return out;
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

function toOuterRings(geometry) {
  if (!geometry) return [];

  if (geometry.type === 'Polygon') {
    return [geometry.coordinates[0]];
  }

  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.map((polygon) => polygon[0]);
  }

  return [];
}

const coordsById = {};

for (const feature of geo.features) {
  const cuencaName = normalize(feature?.properties?.cuenca);
  const id = CUENCA_TO_ID[cuencaName];

  if (!id) {
    console.warn(`Cuenca no mapeada, se omite: ${feature?.properties?.cuenca}`);
    continue;
  }

  const rings = toOuterRings(feature.geometry)
    .map((ring) => ring.map(roundPoint))
    .map(dedupeSequential)
    .map(ensureClosed)
    .filter((ring) => ring.length >= 4)
    .sort((a, b) => centroid(a)[1] - centroid(b)[1]);

  coordsById[id] = rings.length === 1 ? rings[0] : rings;

  const pointCount = rings.reduce((acc, ring) => acc + ring.length, 0);
  console.log(`${id} (${cuencaName}): anillos=${rings.length}, puntos=${pointCount}`);
}

for (const id of ['HC-01', 'HC-02', 'HC-03', 'HC-04', 'HC-05']) {
  if (!coordsById[id]) {
    console.error(`Falta cuenca esperada para ${id}`);
    process.exit(1);
  }
}

fs.writeFileSync(outputPath, JSON.stringify(coordsById, null, 2));
console.log(`\nArchivo generado: ${outputPath}`);
