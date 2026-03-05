import { ALL_LAYERS } from '../data/resources';
import type { LayerFeature, LayerId, StatusType } from '../types/resources';

interface RowProps {
  label: string;
  value?: string;
}

interface FeaturePanelProps {
  feature: LayerFeature;
  layerId: LayerId;
  onClose: () => void;
}

const LAYER_META = new Map(ALL_LAYERS.map((layer) => [layer.id, layer] as const));

const STATUS_CLASS: Record<StatusType, string> = {
  active: 'status-active',
  ramping: 'status-ramping',
  development: 'status-development',
  exploration: 'status-exploration',
  care: 'status-care',
  closed: 'status-closed',
};

const STATUS_LABEL: Record<StatusType, string> = {
  active: 'Produciendo',
  ramping: 'Ramp-up',
  development: 'En desarrollo',
  exploration: 'Exploración',
  care: 'Mantenimiento',
  closed: 'Cerrado / Histórico',
};

function Row({ label, value }: RowProps) {
  if (!value) {
    return null;
  }

  return (
    <div className="feature-row">
      <span className="feature-row-label">{label}</span>
      <span className="feature-row-value">{value}</span>
    </div>
  );
}

export default function FeaturePanel({ feature, layerId, onClose }: FeaturePanelProps) {
  const layer = LAYER_META.get(layerId);
  const isPolygon = layer?.type === 'polygon';

  const statusClass = feature.statusType ? STATUS_CLASS[feature.statusType] : 'status-exploration';
  const statusLabel =
    feature.status ?? (feature.statusType ? STATUS_LABEL[feature.statusType] : undefined);

  return (
    <div className="feature-panel">
      <div className="feature-panel-header">
        <div
          className="feature-panel-icon"
          style={{ background: `${layer?.color ?? '#ffffff'}22`, color: layer?.color }}
        >
          {isPolygon ? '▭' : layer?.icon ?? '●'}
        </div>
        <div className="feature-panel-titles">
          <div className="feature-panel-name">{feature.name}</div>
          <div className="feature-panel-type">
            {feature.commodity ?? feature.type ?? feature.subplay ?? layer?.label}
          </div>
        </div>
        <button className="feature-panel-close" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="feature-panel-body">
        {feature.statusType && statusLabel && (
          <div style={{ marginBottom: 12 }}>
            <span className={`status-badge ${statusClass}`}>{statusLabel}</span>
          </div>
        )}

        <Row label="Provincia" value={feature.province ?? feature.provinces} />
        <Row label="Departamento" value={feature.department} />
        <Row label="Operador/es" value={feature.operator ?? feature.operators} />
        <Row label="Producción" value={feature.production} />
        <Row label="Recursos / Reservas" value={feature.resources ?? feature.reserves} />
        <Row label="CAPEX" value={feature.capex} />
        <Row label="Elevación" value={feature.elevation} />
        <Row label="Área" value={feature.area} />

        <Row label="Formación" value={feature.formation} />
        <Row label="Profundidad" value={feature.depth} />
        <Row label="Espesor productivo" value={feature.thickness} />
        <Row label="Costo de pozo" value={feature.well_cost} />
        <Row label="Curva tipo (IP30/EUR)" value={feature.type_curve} />
        <Row label="Inversión comprometida" value={feature.investment} />
        <Row label="Part. estatal" value={feature.state_participation} />

        <Row label="Ticker / Bolsa" value={feature.ticker} />
        <Row label="Accionistas" value={feature.ownership} />
        <Row label="Capitaliz. bursátil" value={feature.marketCap} />
        <Row label="Ingresos" value={feature.revenue} />
        <Row label="Producción total" value={feature.production_total} />
        <Row label="Activos clave" value={feature.key_assets} />
        <Row label="Estrategia" value={feature.strategy} />

        <Row label="Capacidad" value={feature.capacity} />
        <Row label="Longitud" value={feature.length} />
        <Row label="Diámetro" value={feature.diameter} />
        <Row label="Tramo" value={feature.from_to} />
        <Row label="Socios" value={feature.partners} />

        <Row label="Cultivos" value={feature.crops} />
        <Row label="Ganadería" value={feature.livestock} />
        <Row label="Precipitación" value={feature.rainfall} />
        <Row label="% Petróleo nac." value={feature.oilShare} />
        <Row label="% Gas nac." value={feature.gasShare} />

        {feature.notes && <div className="feature-notes">{feature.notes}</div>}
      </div>
    </div>
  );
}
