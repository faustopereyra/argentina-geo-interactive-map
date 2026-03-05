import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  Polygon,
  Polyline,
  TileLayer,
  Tooltip,
  useMapEvents,
} from 'react-leaflet';
import type { Feature, GeoJsonObject } from 'geojson';
import type { LeafletMouseEvent, Layer as LeafletLayer, PathOptions, TooltipOptions } from 'leaflet';
import {
  ALL_LAYERS,
  ARGENTINA_CENTER,
  ARGENTINA_ZOOM,
  BASEMAPS,
  PROVINCES_URL,
} from '../data/resources';
import type {
  ActiveLayerSet,
  BasemapId,
  LayerFeature,
  LayerId,
  LngLatTuple,
  MouseCoords,
  PolygonCoords,
  ProvinceProperties,
  ProvincesGeoJson,
  StatusType,
} from '../types/resources';

interface ArgentinaMapProps {
  activeLayers: ActiveLayerSet;
  basemapId: BasemapId;
  onFeatureSelect: (feature: LayerFeature, layerId: LayerId) => void;
}

interface CoordTrackerProps {
  setCoords: Dispatch<SetStateAction<MouseCoords>>;
}

interface StyleableLayer {
  setStyle: (style: PathOptions) => void;
  bindTooltip: (content: string, options?: TooltipOptions) => StyleableLayer;
  openTooltip: () => void;
  closeTooltip: () => void;
}

interface CircleMarkerLayer extends StyleableLayer {
  setRadius: (radius: number) => void;
  bringToFront: () => void;
}

interface LayerMouseEvent extends LeafletMouseEvent {
  target: StyleableLayer;
}

interface CircleMouseEvent extends LeafletMouseEvent {
  target: CircleMarkerLayer;
}

const STATUS_FILL: Record<StatusType, string> = {
  active: '#4ade80',
  ramping: '#fbbf24',
  development: '#818cf8',
  exploration: '#9ca3af',
  care: '#ca8a04',
  closed: '#f87171',
};

const provinceStyle: PathOptions = {
  color: '#58a6ff',
  weight: 0.8,
  fillColor: '#161b22',
  fillOpacity: 0.2,
  opacity: 0.5,
};

const provinceHover: PathOptions = {
  weight: 1.5,
  fillOpacity: 0.35,
  opacity: 0.9,
};

const FALLBACK_PROVINCES_URL =
  'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/argentina.geojson';

function isStyleableLayer(layer: LeafletLayer): layer is LeafletLayer & StyleableLayer {
  return (
    'setStyle' in layer &&
    typeof layer.setStyle === 'function' &&
    'bindTooltip' in layer &&
    typeof layer.bindTooltip === 'function' &&
    'openTooltip' in layer &&
    typeof layer.openTooltip === 'function' &&
    'closeTooltip' in layer &&
    typeof layer.closeTooltip === 'function'
  );
}

function styleProvince() {
  return provinceStyle;
}

function getProvinceName(feature?: Feature): string {
  if (!feature || !feature.properties) {
    return '';
  }

  const properties = feature.properties as ProvinceProperties;
  return (properties.nombre ?? properties.name ?? '') as string;
}

function isProvincePolygon(feature: Feature | undefined): boolean {
  const geometryType = feature?.geometry?.type;
  return geometryType === 'Polygon' || geometryType === 'MultiPolygon';
}

function onEachProvince(feature: Feature | undefined, leafletLayer: LeafletLayer) {
  if (!isStyleableLayer(leafletLayer)) {
    return;
  }

  const name = getProvinceName(feature);

  leafletLayer.on({
    mouseover(event: LayerMouseEvent) {
      event.target.setStyle(provinceHover);
      event.target
        .bindTooltip(
          `<span style=\"font-size:12px;font-weight:600;color:#e6edf3\">${name}</span>`,
          {
            sticky: true,
            className: 'province-tooltip',
            opacity: 1,
          },
        )
        .openTooltip();
    },
    mouseout(event: LayerMouseEvent) {
      event.target.setStyle(provinceStyle);
      event.target.closeTooltip();
    },
  });
}

function CoordTracker({ setCoords }: CoordTrackerProps) {
  useMapEvents({
    mousemove(event) {
      setCoords({
        lat: event.latlng.lat.toFixed(4),
        lng: event.latlng.lng.toFixed(4),
      });
    },
  });

  return null;
}

async function fetchGeoJson(url: string, signal: AbortSignal): Promise<ProvincesGeoJson> {
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`No se pudo cargar GeoJSON de provincias desde ${url}`);
  }

  return (await response.json()) as ProvincesGeoJson;
}

function isMultiPolygonCoords(coords: PolygonCoords): coords is LngLatTuple[][] {
  return Array.isArray(coords[0]?.[0]);
}

function polygonPositionsFromCoords(coords: PolygonCoords) {
  if (!isMultiPolygonCoords(coords)) {
    return coords.map(([lng, lat]) => [lat, lng] as [number, number]);
  }

  // Render disjoint polygon parts without connecting them with artificial edges.
  return coords.map((part) => [part.map(([lng, lat]) => [lat, lng] as [number, number])]);
}

export default function ArgentinaMap({ activeLayers, basemapId, onFeatureSelect }: ArgentinaMapProps) {
  const [provinces, setProvinces] = useState<ProvincesGeoJson | null>(null);
  const [coords, setCoords] = useState<MouseCoords>({ lat: '-40.0000', lng: '-65.0000' });

  useEffect(() => {
    const abortController = new AbortController();

    const loadProvinces = async () => {
      try {
        const geoJson = await fetchGeoJson(PROVINCES_URL, abortController.signal);
        setProvinces(geoJson);
      } catch {
        try {
          const fallbackGeoJson = await fetchGeoJson(FALLBACK_PROVINCES_URL, abortController.signal);
          setProvinces(fallbackGeoJson);
        } catch (error) {
          console.warn(error);
        }
      }
    };

    void loadProvinces();

    return () => {
      abortController.abort();
    };
  }, []);

  const defaultBasemap = BASEMAPS[0];
  if (!defaultBasemap) {
    throw new Error('No hay basemaps configurados');
  }

  const basemap = BASEMAPS.find((candidate) => candidate.id === basemapId) ?? defaultBasemap;

  const handleFeatureClick = useCallback(
    (feature: LayerFeature, layerId: LayerId) => {
      onFeatureSelect(feature, layerId);
    },
    [onFeatureSelect],
  );

  return (
    <>
      <MapContainer
        center={ARGENTINA_CENTER}
        zoom={ARGENTINA_ZOOM}
        className="leaflet-map"
        zoomControl
        attributionControl
      >
        <TileLayer key={basemapId} url={basemap.url} attribution={basemap.attribution} maxZoom={18} />

        {provinces && (
          <GeoJSON
            key="provinces"
            data={provinces as GeoJsonObject}
            style={styleProvince}
            filter={isProvincePolygon}
            onEachFeature={onEachProvince}
          />
        )}

        {ALL_LAYERS.map((layer) => {
          if (!activeLayers.has(layer.id)) {
            return null;
          }

          if (layer.type === 'polygon') {
            return layer.features.map((feature) => (
              <Polygon
                key={feature.id}
                positions={polygonPositionsFromCoords(feature.coords)}
                pathOptions={{
                  color: feature.color ?? layer.color,
                  weight: 1.5,
                  fillColor: feature.color ?? layer.color,
                  fillOpacity: feature.fillOpacity ?? 0.15,
                  opacity: 0.7,
                  dashArray: layer.id === 'cuencas_hc' ? '6 4' : undefined,
                }}
                eventHandlers={{
                  click: () => handleFeatureClick(feature, layer.id),
                  mouseover: (event: LayerMouseEvent) => {
                    event.target.setStyle({ fillOpacity: (feature.fillOpacity ?? 0.15) + 0.1, weight: 2.5 });
                  },
                  mouseout: (event: LayerMouseEvent) => {
                    event.target.setStyle({ fillOpacity: feature.fillOpacity ?? 0.15, weight: 1.5 });
                  },
                }}
              >
                <Tooltip sticky direction="top" opacity={0.95}>
                  <div style={{ fontFamily: 'inherit', padding: '4px 6px' }}>
                    <strong style={{ fontSize: 12, color: feature.color ?? layer.color }}>{feature.name}</strong>
                    <div style={{ fontSize: 11, color: '#8b949e', marginTop: 2 }}>
                      {feature.provinces ?? feature.type}
                    </div>
                    {feature.area && (
                      <div style={{ fontSize: 10, color: '#6e7681', marginTop: 2 }}>{feature.area}</div>
                    )}
                  </div>
                </Tooltip>
              </Polygon>
            ));
          }

          if (layer.type === 'mixed') {
            return layer.features.map((feature) => {
              if (feature.featureType === 'line') {
                const lineColor =
                  feature.statusType === 'development'
                    ? '#f59e0b'
                    : feature.statusType === 'care'
                      ? '#6b7280'
                      : layer.color;

                return (
                  <Polyline
                    key={feature.id}
                    positions={feature.coords.map(([lng, lat]) => [lat, lng])}
                    pathOptions={{
                      color: lineColor,
                      weight: feature.statusType === 'development' ? 3 : 3.5,
                      opacity: feature.statusType === 'care' ? 0.4 : 0.85,
                      dashArray: feature.statusType === 'development' ? '10 6' : undefined,
                    }}
                    eventHandlers={{ click: () => handleFeatureClick(feature, layer.id) }}
                  >
                    <Tooltip sticky direction="top" opacity={0.95}>
                      <div style={{ fontFamily: 'inherit', padding: '4px 6px' }}>
                        <strong style={{ fontSize: 12, color: lineColor }}>{feature.name}</strong>
                        <div style={{ fontSize: 11, color: '#8b949e', marginTop: 2 }}>{feature.type}</div>
                        {feature.capacity && (
                          <div style={{ fontSize: 10, color: '#6e7681', marginTop: 2 }}>
                            {feature.capacity}
                          </div>
                        )}
                      </div>
                    </Tooltip>
                  </Polyline>
                );
              }

              const fillColor = feature.statusType ? STATUS_FILL[feature.statusType] : layer.color;

              return (
                <CircleMarker
                  key={feature.id}
                  center={[feature.lat, feature.lng]}
                  radius={7}
                  pathOptions={{
                    color: layer.color,
                    weight: 2,
                    fillColor,
                    fillOpacity: 0.9,
                    opacity: 1,
                  }}
                  eventHandlers={{
                    click: () => handleFeatureClick(feature, layer.id),
                    mouseover: (event: CircleMouseEvent) => {
                      event.target.setRadius(10);
                      event.target.setStyle({ weight: 3 });
                      event.target.bringToFront();
                    },
                    mouseout: (event: CircleMouseEvent) => {
                      event.target.setRadius(7);
                      event.target.setStyle({ weight: 2 });
                    },
                  }}
                >
                  <Tooltip sticky direction="top" opacity={0.95}>
                    <div style={{ fontFamily: 'inherit', padding: '4px 6px' }}>
                      <strong style={{ fontSize: 12, color: layer.color }}>{feature.name}</strong>
                      <div style={{ fontSize: 11, color: '#8b949e', marginTop: 2 }}>{feature.type}</div>
                    </div>
                  </Tooltip>
                </CircleMarker>
              );
            });
          }

          if (layer.type === 'company') {
            return layer.features.map((feature) => (
              <CircleMarker
                key={feature.id}
                center={[feature.lat, feature.lng]}
                radius={11}
                pathOptions={{
                  color: '#ffffff',
                  weight: 2.5,
                  fillColor: layer.color,
                  fillOpacity: 0.92,
                  opacity: 1,
                }}
                eventHandlers={{
                  click: () => handleFeatureClick(feature, layer.id),
                  mouseover: (event: CircleMouseEvent) => {
                    event.target.setRadius(14);
                    event.target.setStyle({ weight: 3 });
                    event.target.bringToFront();
                  },
                  mouseout: (event: CircleMouseEvent) => {
                    event.target.setRadius(11);
                    event.target.setStyle({ weight: 2.5 });
                  },
                }}
              >
                <Tooltip sticky direction="top" opacity={0.97}>
                  <div style={{ fontFamily: 'inherit', padding: '5px 8px', minWidth: 160 }}>
                    <strong style={{ fontSize: 13, color: layer.color }}>{feature.name}</strong>
                    <div style={{ fontSize: 11, color: '#8b949e', marginTop: 3 }}>{feature.type}</div>
                    {feature.production_total && (
                      <div style={{ fontSize: 10, color: '#6e7681', marginTop: 2 }}>
                        {feature.production_total.split('→')[0].trim()}
                      </div>
                    )}
                    {feature.ticker && (
                      <div style={{ fontSize: 10, color: layer.color, marginTop: 2 }}>{feature.ticker}</div>
                    )}
                  </div>
                </Tooltip>
              </CircleMarker>
            ));
          }

          return layer.features.map((feature) => {
            const fillColor = feature.statusType ? STATUS_FILL[feature.statusType] : layer.color;
            const baseRadius = layer.id === 'vaca_muerta' ? 7 : 8;

            return (
              <CircleMarker
                key={feature.id}
                center={[feature.lat, feature.lng]}
                radius={baseRadius}
                pathOptions={{
                  color: layer.color,
                  weight: 2,
                  fillColor,
                  fillOpacity: 0.85,
                  opacity: 0.9,
                }}
                eventHandlers={{
                  click: () => handleFeatureClick(feature, layer.id),
                  mouseover: (event: CircleMouseEvent) => {
                    event.target.setRadius(baseRadius + 4);
                    event.target.setStyle({ weight: 3 });
                    event.target.bringToFront();
                  },
                  mouseout: (event: CircleMouseEvent) => {
                    event.target.setRadius(baseRadius);
                    event.target.setStyle({ weight: 2 });
                  },
                }}
              >
                <Tooltip sticky direction="top" opacity={0.95}>
                  <div style={{ fontFamily: 'inherit', padding: '4px 6px' }}>
                    <strong style={{ fontSize: 12, color: layer.color }}>{feature.name}</strong>
                    <div style={{ fontSize: 11, color: '#8b949e', marginTop: 2 }}>
                      {feature.commodity ?? feature.type ?? layer.label}
                    </div>
                    {feature.province && (
                      <div style={{ fontSize: 10, color: '#6e7681', marginTop: 2 }}>
                        {feature.province.length > 40
                          ? `${feature.province.slice(0, 40)}…`
                          : feature.province}
                      </div>
                    )}
                    {feature.operator && (
                      <div style={{ fontSize: 10, color: '#6e7681' }}>
                        {feature.operator.length > 45
                          ? `${feature.operator.slice(0, 45)}…`
                          : feature.operator}
                      </div>
                    )}
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          });
        })}

        <CoordTracker setCoords={setCoords} />
      </MapContainer>

      <div className="coords-bar">
        {coords.lat}° S &nbsp;|&nbsp; {coords.lng}° W
      </div>
    </>
  );
}
