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

interface AgroInsight {
  opportunityScore: number;
  riskScore: number;
  executionScore: number;
  profile: string;
  hiddenSignal: string;
  nextCatalyst: string;
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

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function firstActionStep(actionSteps?: string) {
  if (!actionSteps) {
    return 'Validar supuestos productivos y comerciales con due diligence de campo.';
  }

  const steps = actionSteps.split(/\s*\d\)\s*/).map((step) => step.trim()).filter(Boolean);
  return steps[0] ?? actionSteps;
}

function buildAgroInsight(feature: LayerFeature, layerId: LayerId): AgroInsight | null {
  if (layerId !== 'agropecuario') {
    return null;
  }

  const opportunityContext = [
    feature.valueChain,
    feature.logistics,
    feature.demandDriver,
    feature.investmentThesis,
    feature.pricing,
  ]
    .join(' ')
    .toLowerCase();
  const riskContext = (feature.riskFlags ?? '').toLowerCase();
  const actions = feature.actionSteps ?? '';

  let opportunity = 50;
  if (/export|fob|paridad|china|asia|ue|ee\.uu|mercosur/.test(opportunityContext)) opportunity += 14;
  if (/hidrov[ií]a|puerto|fr[ií]o|ferrocarril|up-river/.test(opportunityContext)) opportunity += 10;
  if (/industrial|crushing|bioetanol|bodega|empaque|trazabilidad/.test(opportunityContext)) {
    opportunity += 12;
  }
  if (/premium|nicho|dolariz|origen/.test(opportunityContext)) opportunity += 8;

  let risk = 34;
  if (/agua|h[ií]dr|sequ[ií]a|helada|granizo|clim/.test(riskContext)) risk += 17;
  if (/retenciones|fiscal|macro|tipo de cambio|regulator/.test(riskContext)) risk += 12;
  if (/log[ií]st|infraestructura|flete/.test(riskContext)) risk += 8;

  let execution = 48;
  if (/1\).*2\).*3\)/.test(actions)) execution += 16;
  if (/joint venture|minority stake|adquisici[oó]n|integrar/.test((feature.entryStrategy ?? '').toLowerCase())) {
    execution += 12;
  }
  if (/contrato|hedge|cobertura|trazabilidad/.test(actions.toLowerCase())) execution += 10;

  opportunity = clampScore(opportunity - Math.max(0, (risk - 40) * 0.2));
  risk = clampScore(risk);
  execution = clampScore(execution);

  const profile =
    opportunity >= 72 && risk <= 48
      ? 'Core compuesto'
      : opportunity >= 65 && execution >= 60
        ? 'Growth ejecutable'
        : opportunity >= 55
          ? 'Value operativa'
          : 'Táctica / selectiva';

  const hiddenSignal = /hidrov[ií]a|up-river/.test(opportunityContext)
    ? 'La ventaja no es solo rinde: el arbitraje logístico mejora margen incluso con precios laterales.'
    : /fr[ií]o|empaque|calibre/.test(opportunityContext)
      ? 'El cuello de botella está en postcosecha; quien controla frío/empaque captura prima comercial.'
      : /bioetanol|industrial/.test(opportunityContext)
        ? 'La integración industrial reduce dependencia del precio spot del grano.'
        : 'La captura de valor depende más de ejecución comercial que de expansión de hectáreas.';

  return {
    opportunityScore: opportunity,
    riskScore: risk,
    executionScore: execution,
    profile,
    hiddenSignal,
    nextCatalyst: firstActionStep(feature.actionSteps),
  };
}

export default function FeaturePanel({ feature, layerId, onClose }: FeaturePanelProps) {
  const layer = LAYER_META.get(layerId);
  const isPolygon = layer?.type === 'polygon';
  const agroInsight = buildAgroInsight(feature, layerId);

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

        {agroInsight && (
          <div className="agro-insight-card">
            <div className="agro-insight-header">Radar Inversor</div>
            <div className="agro-insight-grid">
              <div className="agro-insight-metric">
                <span>Oportunidad</span>
                <strong>{agroInsight.opportunityScore}/100</strong>
              </div>
              <div className="agro-insight-metric">
                <span>Riesgo</span>
                <strong>{agroInsight.riskScore}/100</strong>
              </div>
              <div className="agro-insight-metric">
                <span>Ejecución</span>
                <strong>{agroInsight.executionScore}/100</strong>
              </div>
            </div>
            <div className="agro-insight-profile">{agroInsight.profile}</div>
            <div className="agro-insight-text">
              <strong>Señal no obvia:</strong> {agroInsight.hiddenSignal}
            </div>
            <div className="agro-insight-text">
              <strong>Catalizador inmediato:</strong> {agroInsight.nextCatalyst}
            </div>
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
        <Row label="Actores clave" value={feature.keyActors} />
        <Row label="Cadena de valor" value={feature.valueChain} />
        <Row label="Logística crítica" value={feature.logistics} />
        <Row label="Pricing / benchmark" value={feature.pricing} />
        <Row label="Driver demanda" value={feature.demandDriver} />
        <Row label="Tesis inversora" value={feature.investmentThesis} />
        <Row label="Estrategia entrada" value={feature.entryStrategy} />
        <Row label="Riesgos clave" value={feature.riskFlags} />
        <Row label="Pasos accionables" value={feature.actionSteps} />
        <Row label="% Petróleo nac." value={feature.oilShare} />
        <Row label="% Gas nac." value={feature.gasShare} />

        {feature.notes && <div className="feature-notes">{feature.notes}</div>}
      </div>
    </div>
  );
}
