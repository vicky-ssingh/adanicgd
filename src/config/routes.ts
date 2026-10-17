import type { BuildingCategory } from '@/components3d/city/Building';

/**
 * Gas-supply route definitions for click-to-highlight (Fix Problem 2D). Each
 * entry lists the pipeline edge ids on the route (matched against
 * config/network.ts) and the ordered stage chain shown in the route panel.
 * Visual only — no routing/sim logic.
 */
export interface RouteDef {
  title: string;
  edges: string[];
  chain: string[];
  flow: number;
}

const PNG_TRUNK = [
  'e-transmission',
  'e-citygate-process',
  'e-primary',
  'e-secondary-1',
  'e-secondary-2',
  'e-png-main',
];

export const BUILDING_ROUTES: Record<BuildingCategory, RouteDef> = {
  residential: {
    title: 'GAS SUPPLY ROUTE — RESIDENTIAL',
    edges: PNG_TRUNK,
    flow: 6,
    chain: [
      'Transmission Pipeline',
      'City Gate Station',
      'Filtration SKID',
      'Metering SKID',
      'PRS SKID',
      'Main Pipeline',
      'DRS',
      'MDPE Service Line',
      'PNG Meter',
      'Residential Building',
    ],
  },
  commercial: {
    title: 'GAS SUPPLY ROUTE — COMMERCIAL',
    edges: PNG_TRUNK,
    flow: 45,
    chain: [
      'Transmission Pipeline',
      'City Gate Station',
      'Filtration SKID',
      'Metering SKID',
      'PRS SKID',
      'Main Pipeline',
      'DRS',
      'MDPE Service Line',
      'PNG Meter',
      'Commercial Building',
    ],
  },
  institutional: {
    title: 'GAS SUPPLY ROUTE — INSTITUTIONAL',
    edges: PNG_TRUNK,
    flow: 25,
    chain: [
      'Transmission Pipeline',
      'City Gate Station',
      'Filtration SKID',
      'Metering SKID',
      'PRS SKID',
      'Main Pipeline',
      'DRS',
      'MDPE Service Line',
      'PNG Meter',
      'Institutional Building',
    ],
  },
  industrial: {
    title: 'GAS SUPPLY ROUTE — INDUSTRIAL',
    edges: PNG_TRUNK,
    flow: 130,
    chain: [
      'Transmission Pipeline',
      'City Gate Station',
      'PRS SKID',
      'Main Pipeline',
      'DRS',
      'Industrial Service Line',
      'Industrial Facility',
    ],
  },
};

export const MOTHER_ROUTE: RouteDef = {
  title: 'GAS SUPPLY ROUTE — CNG MOTHER STATION',
  edges: ['e-transmission', 'e-citygate-process', 'e-mother-spur'],
  flow: 3200,
  chain: [
    'Transmission Pipeline',
    'City Gate Station',
    'PRS SKID',
    'HP Feeder Pipeline',
    'HP Filtration',
    'Metering Skid',
    'Compressors ×3',
    'HP Cascade',
    'Trailer Filling Panel',
    'Cascade Trailer',
  ],
};

export const CNG_ROUTE: RouteDef = {
  title: 'GAS SUPPLY ROUTE — CNG STATION',
  edges: ['e-transmission', 'e-citygate-process', 'e-cng-spur'],
  flow: 8500,
  chain: [
    'Transmission Pipeline',
    'City Gate Station',
    'PRS SKID',
    'CNG Branch Pipeline',
    'Compressor',
    'Cascade Storage',
    'Dispenser',
    'CNG Station',
  ],
};
