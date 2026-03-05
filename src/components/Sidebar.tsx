import { ALL_LAYERS, LAYER_CATEGORIES } from '../data/resources';
import type { ActiveLayerSet, LayerId } from '../types/resources';

interface LayerToggleProps {
  checked: boolean;
  onChange: () => void;
}

interface SidebarProps {
  activeLayers: ActiveLayerSet;
  onToggleLayer: (layerId: LayerId) => void;
}

function LayerToggle({ checked, onChange }: LayerToggleProps) {
  return (
    <label className="layer-toggle" onClick={(event) => event.stopPropagation()}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="layer-toggle-track">
        <span className="layer-toggle-thumb" />
      </span>
    </label>
  );
}

export default function Sidebar({ activeLayers, onToggleLayer }: SidebarProps) {
  const byCategory = LAYER_CATEGORIES.map((category) => ({
    ...category,
    layers: ALL_LAYERS.filter((layer) => layer.category === category.id),
  }));

  return (
    <aside className="sidebar">
      {byCategory.map((category) => (
        <div key={category.id} className="sidebar-section">
          <div className="sidebar-category">
            {category.icon} {category.label}
          </div>
          {category.layers.map((layer) => {
            const active = activeLayers.has(layer.id);
            const count = layer.features.length;

            return (
              <div
                key={layer.id}
                className={`layer-item ${active ? 'active' : ''}`}
                onClick={() => onToggleLayer(layer.id)}
              >
                <LayerToggle checked={active} onChange={() => onToggleLayer(layer.id)} />
                <span
                  className="layer-dot"
                  style={{
                    background: layer.color,
                    opacity: active ? 1 : 0.35,
                    borderRadius: layer.type === 'polygon' ? '2px' : '50%',
                  }}
                />
                <div className="layer-info">
                  <div className="layer-name" style={{ color: active ? '#e6edf3' : '#6e7681' }}>
                    {layer.label}
                  </div>
                  <div className="layer-count">
                    {count} {layer.type === 'polygon' ? 'zonas' : 'sitios'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      <div
        style={{
          padding: '14px',
          borderTop: '1px solid #30363d',
          marginTop: 'auto',
        }}
      >
        <div style={{ fontSize: 10, color: '#484f58', lineHeight: 1.6 }}>
          <div
            style={{
              fontWeight: 700,
              color: '#6e7681',
              marginBottom: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Fuentes
          </div>
          SEGEMAR · IAPG · Secretaría de Minería · IGN Argentina · datos.gob.ar
        </div>
      </div>
    </aside>
  );
}
