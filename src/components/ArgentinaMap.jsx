import { useEffect, useState, useCallback } from 'react'
import {
  MapContainer, TileLayer, GeoJSON, CircleMarker,
  Polygon, Polyline, Tooltip, useMapEvents
} from 'react-leaflet'
import {
  ALL_LAYERS, ARGENTINA_CENTER, ARGENTINA_ZOOM, BASEMAPS, PROVINCES_URL
} from '../data/resources'

// ─── Coordinate tracker ──────────────────────────────────────
function CoordTracker({ setCoords }) {
  useMapEvents({
    mousemove(e) {
      setCoords({ lat: e.latlng.lat.toFixed(4), lng: e.latlng.lng.toFixed(4) })
    },
  })
  return null
}

// ─── Status color for marker fill ───────────────────────────
const STATUS_FILL = {
  active: '#4ade80',
  ramping: '#fbbf24',
  development: '#818cf8',
  exploration: '#9ca3af',
  care: '#ca8a04',
  closed: '#f87171',
}

// ─── Province style ─────────────────────────────────────────
const provinceStyle = {
  color: '#58a6ff',
  weight: 0.8,
  fillColor: '#161b22',
  fillOpacity: 0.2,
  opacity: 0.5,
}
const provinceHover = {
  weight: 1.5,
  fillOpacity: 0.35,
  opacity: 0.9,
}

function styleProvince() { return provinceStyle }

function onEachProvince(feature, leafletLayer) {
  const name = feature.properties?.nombre || feature.properties?.name || ''
  leafletLayer.on({
    mouseover(e) {
      e.target.setStyle(provinceHover)
      e.target.bindTooltip(
        `<span style="font-size:12px;font-weight:600;color:#e6edf3">${name}</span>`,
        { sticky: true, className: 'province-tooltip', opacity: 1 }
      ).openTooltip()
    },
    mouseout(e) {
      e.target.setStyle(provinceStyle)
      e.target.closeTooltip()
    },
  })
}

// ─── Main Map Component ──────────────────────────────────────
export default function ArgentinaMap({ activeLayers, basemapId, onFeatureSelect }) {
  const [provinces, setProvinces] = useState(null)
  const [coords, setCoords] = useState({ lat: '-40.0000', lng: '-65.0000' })

  // Load provinces GeoJSON
  useEffect(() => {
    fetch(PROVINCES_URL)
      .then(r => r.json())
      .then(data => setProvinces(data))
      .catch(() => {
        // Fallback: try alternative URL
        fetch('https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/argentina.geojson')
          .then(r => r.json())
          .then(data => setProvinces(data))
          .catch(console.warn)
      })
  }, [])

  const basemap = BASEMAPS.find(b => b.id === basemapId) || BASEMAPS[0]

  const handleFeatureClick = useCallback((feature, layerId) => {
    onFeatureSelect(feature, layerId)
  }, [onFeatureSelect])

  return (
    <>
      <MapContainer
        center={ARGENTINA_CENTER}
        zoom={ARGENTINA_ZOOM}
        className="leaflet-map"
        zoomControl={true}
        attributionControl={true}
      >
        {/* Base tile layer */}
        <TileLayer
          key={basemapId}
          url={basemap.url}
          attribution={basemap.attribution}
          maxZoom={18}
        />

        {/* Province boundaries */}
        {provinces && (
          <GeoJSON
            key="provinces"
            data={provinces}
            style={styleProvince}
            onEachFeature={onEachProvince}
          />
        )}

        {/* Resource layers */}
        {ALL_LAYERS.map(layer => {
          if (!activeLayers.has(layer.id)) return null

          // ── Polygon layers (basins, agricultural zones) ──────
          if (layer.type === 'polygon') {
            return layer.features.map(f => (
              <Polygon
                key={f.id}
                positions={f.coords.map(([lng, lat]) => [lat, lng])}
                pathOptions={{
                  color: f.color || layer.color,
                  weight: 1.5,
                  fillColor: f.color || layer.color,
                  fillOpacity: f.fillOpacity ?? 0.15,
                  opacity: 0.7,
                  dashArray: layer.id === 'cuencas_hc' ? '6 4' : undefined,
                }}
                eventHandlers={{
                  click: () => handleFeatureClick(f, layer.id),
                  mouseover: e => {
                    e.target.setStyle({ fillOpacity: (f.fillOpacity ?? 0.15) + 0.1, weight: 2.5 })
                  },
                  mouseout: e => {
                    e.target.setStyle({ fillOpacity: f.fillOpacity ?? 0.15, weight: 1.5 })
                  },
                }}
              >
                <Tooltip sticky direction="top" opacity={0.95}>
                  <div style={{ fontFamily: 'inherit', padding: '4px 6px' }}>
                    <strong style={{ fontSize: 12, color: f.color || layer.color }}>
                      {f.name}
                    </strong>
                    <div style={{ fontSize: 11, color: '#8b949e', marginTop: 2 }}>
                      {f.provinces || f.type}
                    </div>
                    {f.area && (
                      <div style={{ fontSize: 10, color: '#6e7681', marginTop: 2 }}>
                        {f.area}
                      </div>
                    )}
                  </div>
                </Tooltip>
              </Polygon>
            ))
          }

          // ── Mixed layer (infra: lines + points) ──────────────
          if (layer.type === 'mixed') {
            return layer.features.map(f => {
              if (f.featureType === 'line') {
                const lineColor = f.statusType === 'development' ? '#f59e0b'
                  : f.statusType === 'care' ? '#6b7280'
                  : layer.color
                return (
                  <Polyline
                    key={f.id}
                    positions={f.coords.map(([lng, lat]) => [lat, lng])}
                    pathOptions={{
                      color: lineColor,
                      weight: f.statusType === 'development' ? 3 : 3.5,
                      opacity: f.statusType === 'care' ? 0.4 : 0.85,
                      dashArray: f.statusType === 'development' ? '10 6' : undefined,
                    }}
                    eventHandlers={{ click: () => handleFeatureClick(f, layer.id) }}
                  >
                    <Tooltip sticky direction="top" opacity={0.95}>
                      <div style={{ fontFamily: 'inherit', padding: '4px 6px' }}>
                        <strong style={{ fontSize: 12, color: lineColor }}>{f.name}</strong>
                        <div style={{ fontSize: 11, color: '#8b949e', marginTop: 2 }}>{f.type}</div>
                        {f.capacity && <div style={{ fontSize: 10, color: '#6e7681', marginTop: 2 }}>{f.capacity}</div>}
                      </div>
                    </Tooltip>
                  </Polyline>
                )
              }
              // point sub-feature in mixed layer
              const fillColor = STATUS_FILL[f.statusType] || layer.color
              return (
                <CircleMarker
                  key={f.id}
                  center={[f.lat, f.lng]}
                  radius={7}
                  pathOptions={{
                    color: layer.color,
                    weight: 2,
                    fillColor,
                    fillOpacity: 0.9,
                    opacity: 1,
                  }}
                  eventHandlers={{
                    click: () => handleFeatureClick(f, layer.id),
                    mouseover: e => { e.target.setStyle({ radius: 10, weight: 3 }); e.target.bringToFront() },
                    mouseout: e => { e.target.setStyle({ radius: 7, weight: 2 }) },
                  }}
                >
                  <Tooltip sticky direction="top" opacity={0.95}>
                    <div style={{ fontFamily: 'inherit', padding: '4px 6px' }}>
                      <strong style={{ fontSize: 12, color: layer.color }}>{f.name}</strong>
                      <div style={{ fontSize: 11, color: '#8b949e', marginTop: 2 }}>{f.type}</div>
                    </div>
                  </Tooltip>
                </CircleMarker>
              )
            })
          }

          // ── Company markers ───────────────────────────────────
          if (layer.type === 'company') {
            return layer.features.map(f => (
              <CircleMarker
                key={f.id}
                center={[f.lat, f.lng]}
                radius={11}
                pathOptions={{
                  color: '#ffffff',
                  weight: 2.5,
                  fillColor: layer.color,
                  fillOpacity: 0.92,
                  opacity: 1,
                }}
                eventHandlers={{
                  click: () => handleFeatureClick(f, layer.id),
                  mouseover: e => { e.target.setStyle({ radius: 14, weight: 3 }); e.target.bringToFront() },
                  mouseout: e => { e.target.setStyle({ radius: 11, weight: 2.5 }) },
                }}
              >
                <Tooltip sticky direction="top" opacity={0.97}>
                  <div style={{ fontFamily: 'inherit', padding: '5px 8px', minWidth: 160 }}>
                    <strong style={{ fontSize: 13, color: layer.color }}>{f.name}</strong>
                    <div style={{ fontSize: 11, color: '#8b949e', marginTop: 3 }}>{f.type}</div>
                    {f.production_total && (
                      <div style={{ fontSize: 10, color: '#6e7681', marginTop: 2 }}>
                        {f.production_total.split('→')[0].trim()}
                      </div>
                    )}
                    {f.ticker && (
                      <div style={{ fontSize: 10, color: layer.color, marginTop: 2 }}>{f.ticker}</div>
                    )}
                  </div>
                </Tooltip>
              </CircleMarker>
            ))
          }

          // ── Point layers ──────────────────────────────────────
          return layer.features.map(f => {
            const fillColor = STATUS_FILL[f.statusType] || layer.color
            const baseRadius = layer.id === 'vaca_muerta' ? 7 : 8
            return (
              <CircleMarker
                key={f.id}
                center={[f.lat, f.lng]}
                radius={baseRadius}
                pathOptions={{
                  color: layer.color,
                  weight: 2,
                  fillColor: fillColor,
                  fillOpacity: 0.85,
                  opacity: 0.9,
                }}
                eventHandlers={{
                  click: () => handleFeatureClick(f, layer.id),
                  mouseover: e => {
                    e.target.setStyle({ radius: baseRadius + 4, weight: 3 })
                    e.target.bringToFront()
                  },
                  mouseout: e => {
                    e.target.setStyle({ radius: baseRadius, weight: 2 })
                  },
                }}
              >
                <Tooltip sticky direction="top" opacity={0.95}>
                  <div style={{ fontFamily: 'inherit', padding: '4px 6px' }}>
                    <strong style={{ fontSize: 12, color: layer.color }}>
                      {f.name}
                    </strong>
                    <div style={{ fontSize: 11, color: '#8b949e', marginTop: 2 }}>
                      {f.commodity || f.type || layer.label}
                    </div>
                    {f.province && (
                      <div style={{ fontSize: 10, color: '#6e7681', marginTop: 2 }}>
                        {f.province.length > 40 ? f.province.slice(0, 40) + '…' : f.province}
                      </div>
                    )}
                    {f.operator && (
                      <div style={{ fontSize: 10, color: '#6e7681' }}>
                        {f.operator.length > 45 ? f.operator.slice(0, 45) + '…' : f.operator}
                      </div>
                    )}
                  </div>
                </Tooltip>
              </CircleMarker>
            )
          })
        })}

        <CoordTracker setCoords={setCoords} />
      </MapContainer>

      {/* Coordinates bar */}
      <div className="coords-bar">
        {coords.lat}° S &nbsp;|&nbsp; {coords.lng}° W
      </div>
    </>
  )
}
