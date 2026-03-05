import { useCallback, useMemo, useState } from 'react';
import FeaturePanel from './components/FeaturePanel';
import ArgentinaMap from './components/ArgentinaMap';
import Sidebar from './components/Sidebar';
import { ALL_LAYERS, BASEMAPS, DEFAULT_VISIBLE } from './data/resources';
import type { ActiveLayerSet, BasemapId, LayerFeature, LayerId } from './types/resources';

const LEGEND_STATUSES = [
  { cls: 'status-active', label: 'Produciendo' },
  { cls: 'status-ramping', label: 'Ramp-up' },
  { cls: 'status-development', label: 'En desarrollo' },
  { cls: 'status-exploration', label: 'Exploración' },
  { cls: 'status-care', label: 'Mantenimiento' },
  { cls: 'status-closed', label: 'Histórico' },
] as const;

export default function App() {
  const [activeLayers, setActiveLayers] = useState<ActiveLayerSet>(() => new Set(DEFAULT_VISIBLE));
  const [selectedFeature, setSelectedFeature] = useState<LayerFeature | null>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<LayerId | null>(null);
  const [basemapId, setBasemapId] = useState<BasemapId>('dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const layerById = useMemo(() => new Map(ALL_LAYERS.map((layer) => [layer.id, layer])), []);

  const totalVm = layerById.get('vaca_muerta')?.features.length ?? 0;
  const totalEmpresas = layerById.get('empresas_hc')?.features.length ?? 0;

  const handleToggleLayer = useCallback((layerId: LayerId) => {
    setActiveLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layerId)) {
        next.delete(layerId);
      } else {
        next.add(layerId);
      }
      return next;
    });
  }, []);

  const handleToggleLayerFromSidebar = useCallback(
    (layerId: LayerId) => {
      handleToggleLayer(layerId);
      setIsSidebarOpen(false);
    },
    [handleToggleLayer],
  );

  const handleFeatureSelect = useCallback((feature: LayerFeature, layerId: LayerId) => {
    setSelectedFeature(feature);
    setSelectedLayerId(layerId);
    setIsSidebarOpen(false);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedFeature(null);
    setSelectedLayerId(null);
  }, []);

  return (
    <div className="app">
      <header className="topbar">
        <button
          className="sidebar-toggle-btn"
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          aria-label="Mostrar u ocultar panel de capas"
          aria-expanded={isSidebarOpen}
          aria-controls="layers-sidebar"
        >
          ☰
        </button>
        <span className="topbar-logo">🗺</span>
        <span className="topbar-title">Atlas de Recursos</span>
        <span className="topbar-subtitle">— Argentina</span>

        <div className="topbar-spacer" />

        <div className="topbar-stats">
          <div className="topbar-stat">
            <strong>{totalVm}</strong> bloques Vaca Muerta
          </div>
          <div className="topbar-stat">
            <strong>{totalEmpresas}</strong> operadoras
          </div>
          <div className="topbar-stat">
            <strong>5</strong> cuencas HC
          </div>
          <div className="topbar-stat">
            <strong>2</strong> obras infra clave
          </div>
        </div>

        <div className="basemap-selector">
          {BASEMAPS.map((basemap) => (
            <button
              key={basemap.id}
              className={`basemap-btn ${basemapId === basemap.id ? 'active' : ''}`}
              onClick={() => setBasemapId(basemap.id)}
            >
              {basemap.label}
            </button>
          ))}
        </div>
      </header>

      <button
        className={`sidebar-backdrop ${isSidebarOpen ? 'open' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
        aria-label="Cerrar panel de capas"
        tabIndex={isSidebarOpen ? 0 : -1}
      />

      <Sidebar
        activeLayers={activeLayers}
        onToggleLayer={handleToggleLayerFromSidebar}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="map-container">
        <ArgentinaMap
          activeLayers={activeLayers}
          basemapId={basemapId}
          onFeatureSelect={handleFeatureSelect}
        />

        {selectedFeature && selectedLayerId && (
          <FeaturePanel
            feature={selectedFeature}
            layerId={selectedLayerId}
            onClose={handleClosePanel}
          />
        )}

        <div className={`legend ${selectedFeature ? 'legend-has-panel' : ''}`}>
          <div className="legend-title">Estado</div>
          {LEGEND_STATUSES.map(({ cls, label }) => (
            <div key={cls} className="legend-item">
              <span className={`status-badge ${cls}`} style={{ padding: '2px 0', background: 'none', gap: 6 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'currentColor',
                    display: 'inline-block',
                  }}
                />
              </span>
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
