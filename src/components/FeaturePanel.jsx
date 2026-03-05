import { ALL_LAYERS } from '../data/resources'

const LAYER_META = Object.fromEntries(ALL_LAYERS.map(l => [l.id, l]))

const STATUS_CLASS = {
  active: 'status-active',
  ramping: 'status-ramping',
  development: 'status-development',
  exploration: 'status-exploration',
  care: 'status-care',
  closed: 'status-closed',
}

const STATUS_LABEL = {
  active: 'Produciendo',
  ramping: 'Ramp-up',
  development: 'En desarrollo',
  exploration: 'Exploración',
  care: 'Mantenimiento',
  closed: 'Cerrado / Histórico',
}

function Row({ label, value }) {
  if (!value) return null
  return (
    <div className="feature-row">
      <span className="feature-row-label">{label}</span>
      <span className="feature-row-value">{value}</span>
    </div>
  )
}

export default function FeaturePanel({ feature, layerId, onClose }) {
  if (!feature) return null

  const layer = LAYER_META[layerId]
  const f = feature

  const isPolygon = layer?.type === 'polygon'

  const statusClass = STATUS_CLASS[f.statusType] || 'status-exploration'
  const statusLabel = f.status || STATUS_LABEL[f.statusType]

  return (
    <div className="feature-panel">
      <div className="feature-panel-header">
        <div
          className="feature-panel-icon"
          style={{ background: `${layer?.color}22`, color: layer?.color }}
        >
          {isPolygon ? '▭' : layer?.icon || '●'}
        </div>
        <div className="feature-panel-titles">
          <div className="feature-panel-name">{f.name}</div>
          <div className="feature-panel-type">
            {f.commodity || f.type || f.subplay || layer?.label}
          </div>
        </div>
        <button className="feature-panel-close" onClick={onClose}>×</button>
      </div>

      <div className="feature-panel-body">
        {/* Status badge */}
        {f.statusType && (
          <div style={{ marginBottom: 12 }}>
            <span className={`status-badge ${statusClass}`}>
              {statusLabel}
            </span>
          </div>
        )}

        {/* ── Datos comunes ── */}
        <Row label="Provincia" value={f.province || f.provinces} />
        <Row label="Departamento" value={f.department} />
        <Row label="Operador/es" value={f.operator || f.operators} />
        <Row label="Producción" value={f.production} />
        <Row label="Recursos / Reservas" value={f.resources || f.reserves} />
        <Row label="CAPEX" value={f.capex} />
        <Row label="Elevación" value={f.elevation} />
        <Row label="Área" value={f.area} />

        {/* ── Geología Vaca Muerta ── */}
        <Row label="Formación" value={f.formation} />
        <Row label="Profundidad" value={f.depth} />
        <Row label="Espesor productivo" value={f.thickness} />
        <Row label="Costo de pozo" value={f.well_cost} />
        <Row label="Curva tipo (IP30/EUR)" value={f.type_curve} />
        <Row label="Inversión comprometida" value={f.investment} />
        <Row label="Part. estatal" value={f.state_participation} />

        {/* ── Perfil empresarial ── */}
        <Row label="Ticker / Bolsa" value={f.ticker} />
        <Row label="Accionistas" value={f.ownership} />
        <Row label="Capitaliz. bursátil" value={f.marketCap} />
        <Row label="Ingresos" value={f.revenue} />
        <Row label="Producción total" value={f.production_total} />
        <Row label="Activos clave" value={f.key_assets} />
        <Row label="Estrategia" value={f.strategy} />

        {/* ── Infraestructura ── */}
        <Row label="Capacidad" value={f.capacity} />
        <Row label="Longitud" value={f.length} />
        <Row label="Diámetro" value={f.diameter} />
        <Row label="Tramo" value={f.from_to} />
        <Row label="Socios" value={f.partners} />

        {/* ── Agropecuario ── */}
        <Row label="Cultivos" value={f.crops} />
        <Row label="Ganadería" value={f.livestock} />
        <Row label="Precipitación" value={f.rainfall} />
        <Row label="% Petróleo nac." value={f.oilShare} />
        <Row label="% Gas nac." value={f.gasShare} />

        {f.notes && (
          <div className="feature-notes">{f.notes}</div>
        )}
      </div>
    </div>
  )
}
