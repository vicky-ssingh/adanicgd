import type { NodeType } from '@/types/network';

/** Simulation scenarios (spec §2.26). */
export type ScenarioId =
  | 'normal'
  | 'high-demand'
  | 'low-demand'
  | 'pipeline-isolation'
  | 'cng-demand-up'
  | 'png-demand-up'
  | 'pressure-drop'
  | 'equipment-shutdown'
  | 'gas-leak';

export interface ScenarioDef {
  id: ScenarioId;
  label: string;
  description: string;
  /** Global multipliers applied to nominal values. */
  flowFactor: number;
  pressureFactor: number;
  /** CNG / PNG demand split (must sum ~1). */
  cngSplit: number;
  pngSplit: number;
  /** Node ids forced offline (downstream flow stops). */
  offline?: string[];
  /** Node types pushed into warning. */
  warnTypes?: NodeType[];
  accent: 'normal' | 'alert' | 'cng' | 'png';
}

export const SCENARIOS: Record<ScenarioId, ScenarioDef> = {
  normal: {
    id: 'normal',
    label: 'Normal Operation',
    description: 'Balanced city-wide demand across CNG and PNG networks.',
    flowFactor: 1.0,
    pressureFactor: 1.0,
    cngSplit: 0.38,
    pngSplit: 0.62,
    accent: 'normal',
  },
  'high-demand': {
    id: 'high-demand',
    label: 'High Demand',
    description: 'Peak morning load — flow rises across the network.',
    flowFactor: 1.35,
    pressureFactor: 0.96,
    cngSplit: 0.4,
    pngSplit: 0.6,
    accent: 'alert',
  },
  'low-demand': {
    id: 'low-demand',
    label: 'Low Demand',
    description: 'Off-peak night load — reduced flow, stable pressure.',
    flowFactor: 0.6,
    pressureFactor: 1.02,
    cngSplit: 0.34,
    pngSplit: 0.66,
    accent: 'normal',
  },
  'pipeline-isolation': {
    id: 'pipeline-isolation',
    label: 'Pipeline Isolation',
    description: 'West secondary main isolated — DRS · West drops offline.',
    flowFactor: 0.85,
    pressureFactor: 1.0,
    cngSplit: 0.38,
    pngSplit: 0.62,
    offline: ['drs3'],
    accent: 'alert',
  },
  'cng-demand-up': {
    id: 'cng-demand-up',
    label: 'CNG Station Demand ↑',
    description: 'CNG fuelling surge — CNG network draw increases.',
    flowFactor: 1.15,
    pressureFactor: 0.98,
    cngSplit: 0.56,
    pngSplit: 0.44,
    accent: 'cng',
  },
  'png-demand-up': {
    id: 'png-demand-up',
    label: 'PNG Demand ↑',
    description: 'Residential/commercial cooking peak — PNG draw increases.',
    flowFactor: 1.15,
    pressureFactor: 0.98,
    cngSplit: 0.28,
    pngSplit: 0.72,
    accent: 'png',
  },
  'pressure-drop': {
    id: 'pressure-drop',
    label: 'Pressure Drop',
    description: 'Upstream supply dip — network pressure falls, warnings raised.',
    flowFactor: 0.9,
    pressureFactor: 0.82,
    cngSplit: 0.38,
    pngSplit: 0.62,
    warnTypes: ['drs', 'prs'],
    accent: 'alert',
  },
  'equipment-shutdown': {
    id: 'equipment-shutdown',
    label: 'Equipment Shutdown',
    description: 'PRS SKID tripped — downstream distribution halts (critical).',
    flowFactor: 1.0,
    pressureFactor: 1.0,
    cngSplit: 0.38,
    pngSplit: 0.62,
    offline: ['prs', 'drs1', 'drs2', 'drs3'],
    accent: 'alert',
  },
  'gas-leak': {
    id: 'gas-leak',
    label: 'Gas Leak Detection',
    description: 'Simulated methane release — a detector rises to auto-ESD.',
    flowFactor: 1.0,
    pressureFactor: 1.0,
    cngSplit: 0.38,
    pngSplit: 0.62,
    warnTypes: ['cng-station'],
    accent: 'alert',
  },
};

export const SCENARIO_LIST = Object.values(SCENARIOS);
