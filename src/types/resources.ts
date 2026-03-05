import type { FeatureCollection } from 'geojson';

export type BasemapId = 'dark' | 'topo' | 'satellite' | 'light';

export type LayerCategoryId =
  | 'mineria'
  | 'hidrocarburos'
  | 'empresas'
  | 'infraestructura'
  | 'agropecuario';

export type LayerId =
  | 'litio'
  | 'cobre_oro'
  | 'otros_minerales'
  | 'cuencas_hc'
  | 'vaca_muerta'
  | 'petroleo_conv'
  | 'empresas_hc'
  | 'infra_hc'
  | 'agropecuario';

export type LayerType = 'point' | 'polygon' | 'company' | 'mixed';

export type StatusType =
  | 'active'
  | 'ramping'
  | 'development'
  | 'exploration'
  | 'care'
  | 'closed';

export type MixedFeatureType = 'line' | 'point';

export type LngLatTuple = [lng: number, lat: number];
export type PolygonCoords = LngLatTuple[] | LngLatTuple[][];

export interface FeatureAttributes {
  area?: string;
  capex?: string;
  capacity?: string;
  color?: string;
  commodity?: string;
  crops?: string;
  department?: string;
  depth?: string;
  diameter?: string;
  elevation?: string;
  featureType?: MixedFeatureType;
  fillOpacity?: number;
  formation?: string;
  from_to?: string;
  gasShare?: string;
  investment?: string;
  key_assets?: string;
  length?: string;
  livestock?: string;
  marketCap?: string;
  notes?: string;
  oilShare?: string;
  operator?: string;
  operators?: string;
  ownership?: string;
  partners?: string;
  production?: string;
  production_total?: string;
  province?: string;
  provinces?: string;
  rainfall?: string;
  reserves?: string;
  resources?: string;
  revenue?: string;
  salar?: string;
  state_participation?: string;
  status?: string;
  statusType?: StatusType;
  strategy?: string;
  subplay?: string;
  thickness?: string;
  ticker?: string;
  type?: string;
  type_curve?: string;
  well_cost?: string;
}

export interface BaseFeature extends FeatureAttributes {
  id: string;
  name: string;
}

export interface PointFeature extends BaseFeature {
  lat: number;
  lng: number;
}

export interface PolygonFeature extends BaseFeature {
  coords: PolygonCoords;
}

export interface MixedLineFeature extends BaseFeature {
  featureType: 'line';
  coords: LngLatTuple[];
}

export interface MixedPointFeature extends PointFeature {
  featureType: 'point';
}

export type MixedFeature = MixedLineFeature | MixedPointFeature;

export interface CompanyFeature extends PointFeature {
  key_assets?: string;
  marketCap?: string;
  ownership?: string;
  production_total?: string;
  revenue?: string;
  strategy?: string;
  ticker?: string;
}

export type LayerFeature = PointFeature | PolygonFeature | MixedFeature | CompanyFeature;

export interface LayerCategory {
  id: LayerCategoryId;
  label: string;
  icon: string;
}

export interface Basemap {
  id: BasemapId;
  label: string;
  url: string;
  attribution: string;
}

export interface BaseLayer<
  TId extends LayerId,
  TType extends LayerType,
  TFeature extends LayerFeature,
> {
  id: TId;
  label: string;
  category: LayerCategoryId;
  color: string;
  icon?: string;
  type: TType;
  description: string;
  features: readonly TFeature[];
}

export type PointLayer = BaseLayer<
  'litio' | 'cobre_oro' | 'otros_minerales' | 'vaca_muerta' | 'petroleo_conv',
  'point',
  PointFeature
>;

export type PolygonLayer = BaseLayer<'cuencas_hc' | 'agropecuario', 'polygon', PolygonFeature>;

export type CompanyLayer = BaseLayer<'empresas_hc', 'company', CompanyFeature>;

export type MixedLayer = BaseLayer<'infra_hc', 'mixed', MixedFeature>;

export type LayerDefinition = PointLayer | PolygonLayer | CompanyLayer | MixedLayer;

export type ActiveLayerSet = Set<LayerId>;

export interface ProvinceProperties {
  nombre?: string;
  name?: string;
  [key: string]: unknown;
}

export type ProvincesGeoJson = FeatureCollection;

export interface MouseCoords {
  lat: string;
  lng: string;
}

export interface FeatureSelection {
  feature: LayerFeature;
  layerId: LayerId;
}
