import { ALL_LAYERS, LAYER_CATEGORIES } from '../data/resources'

function LayerToggle({ checked, onChange, color }) {
  return (
    <label className="layer-toggle" onClick={e => e.stopPropagation()}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="layer-toggle-track">
        <span className="layer-toggle-thumb" />
      </span>
    </label>
  )
}

export default function Sidebar({ activeLayers, onToggleLayer }) {
  const byCategory = LAYER_CATEGORIES.map(cat => ({
    ...cat,
    layers: ALL_LAYERS.filter(l => l.category === cat.id),
  }))

  return (
    <aside className="sidebar">
      {byCategory.map(cat => (
        <div key={cat.id} className="sidebar-section">
          <div className="sidebar-category">
            {cat.icon} {cat.label}
          </div>
          {cat.layers.map(layer => {
            const active = activeLayers.has(layer.id)
            const count = layer.features?.length ?? null
            return (
              <div
                key={layer.id}
                className={`layer-item ${active ? 'active' : ''}`}
                onClick={() => onToggleLayer(layer.id)}
              >
                <LayerToggle
                  checked={active}
                  onChange={() => onToggleLayer(layer.id)}
                  color={layer.color}
                />
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
                  {count !== null && (
                    <div className="layer-count">
                      {count} {layer.type === 'polygon' ? 'zonas' : 'sitios'}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ))}

      {/* Info footer */}
      <div style={{
        padding: '14px',
        borderTop: '1px solid #30363d',
        marginTop: 'auto',
      }}>
        <div style={{ fontSize: 10, color: '#484f58', lineHeight: 1.6 }}>
          <div style={{ fontWeight: 700, color: '#6e7681', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fuentes</div>
          SEGEMAR · IAPG · Secretaría de Minería · IGN Argentina · datos.gob.ar
        </div>
      </div>
    </aside>
  )
}
