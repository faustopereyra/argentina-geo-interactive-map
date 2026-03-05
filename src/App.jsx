import { useState, useCallback } from 'react'
import { ALL_LAYERS, BASEMAPS, DEFAULT_VISIBLE } from './data/resources'
import ArgentinaMap from './components/ArgentinaMap'
import Sidebar from './components/Sidebar'
import FeaturePanel from './components/FeaturePanel'

// Total feature counts for the top bar
const TOTAL_VM = ALL_LAYERS.find(l => l.id === 'vaca_muerta')?.features.length ?? 0
const TOTAL_EMPRESAS = ALL_LAYERS.find(l => l.id === 'empresas_hc')?.features.length ?? 0

export default function App() {
  const [activeLayers, setActiveLayers] = useState(DEFAULT_VISIBLE)
  const [selectedFeature, setSelectedFeature] = useState(null)
  const [selectedLayerId, setSelectedLayerId] = useState(null)
  const [basemapId, setBasemapId] = useState('dark')

  const handleToggleLayer = useCallback(layerId => {
    setActiveLayers(prev => {
      const next = new Set(prev)
      if (next.has(layerId)) next.delete(layerId)
      else next.add(layerId)
      return next
    })
  }, [])

  const handleFeatureSelect = useCallback((feature, layerId) => {
    setSelectedFeature(feature)
    setSelectedLayerId(layerId)
  }, [])

  const handleClosePanel = useCallback(() => {
    setSelectedFeature(null)
    setSelectedLayerId(null)
  }, [])

  return (
    <div className="app">
      {/* ── Top bar ── */}
      <header className="topbar">
        <span className="topbar-logo">🗺</span>
        <span className="topbar-title">Atlas de Recursos</span>
        <span className="topbar-subtitle">— Argentina</span>

        <div className="topbar-spacer" />

        <div className="topbar-stats">
          <div className="topbar-stat">
            <strong>{TOTAL_VM}</strong> bloques Vaca Muerta
          </div>
          <div className="topbar-stat">
            <strong>{TOTAL_EMPRESAS}</strong> operadoras
          </div>
          <div className="topbar-stat">
            <strong>5</strong> cuencas HC
          </div>
          <div className="topbar-stat">
            <strong>2</strong> obras infra clave
          </div>
        </div>

        {/* Basemap selector */}
        <div className="basemap-selector">
          {BASEMAPS.map(b => (
            <button
              key={b.id}
              className={`basemap-btn ${basemapId === b.id ? 'active' : ''}`}
              onClick={() => setBasemapId(b.id)}
            >
              {b.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── Sidebar ── */}
      <Sidebar
        activeLayers={activeLayers}
        onToggleLayer={handleToggleLayer}
      />

      {/* ── Map ── */}
      <div className="map-container">
        <ArgentinaMap
          activeLayers={activeLayers}
          basemapId={basemapId}
          onFeatureSelect={handleFeatureSelect}
        />

        {/* Feature info panel */}
        {selectedFeature && (
          <FeaturePanel
            feature={selectedFeature}
            layerId={selectedLayerId}
            onClose={handleClosePanel}
          />
        )}

        {/* Legend */}
        <div className="legend">
          <div className="legend-title">Estado</div>
          {[
            { cls: 'status-active', label: 'Produciendo' },
            { cls: 'status-ramping', label: 'Ramp-up' },
            { cls: 'status-development', label: 'En desarrollo' },
            { cls: 'status-exploration', label: 'Exploración' },
            { cls: 'status-care', label: 'Mantenimiento' },
            { cls: 'status-closed', label: 'Histórico' },
          ].map(({ cls, label }) => (
            <div key={cls} className="legend-item">
              <span className={`status-badge ${cls}`} style={{ padding: '2px 0', background: 'none', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
              </span>
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
