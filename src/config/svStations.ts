/**
 * Section 07 Part A — Sectionalizing Valve (SV) stations placed along the main
 * pipeline route across the city. Each isolates a downstream section; closing one
 * triggers the existing "Pipeline Isolation" scenario. `controls` lists the
 * pipeline edge ids (from config/network.ts) that the station highlights + isolates.
 */
export type SvId = 'SV-01' | 'SV-02' | 'SV-03' | 'SV-04';

export interface SvDef {
  id: SvId;
  position: [number, number, number];
  rotation: number;
  chainageKm: number;
  controls: string[]; // downstream edge ids to highlight
  affected: string; // dashboard/consumer summary
  section: string[]; // controlled-section label lines for the info panel
}

export const SV_STATIONS: SvDef[] = [
  {
    id: 'SV-01',
    position: [60, 0, -75],
    rotation: -0.5,
    chainageKm: 2.1,
    controls: ['e-primary', 'e-secondary-1', 'e-secondary-2', 'e-cng-spur'],
    affected: '3 DRS · 2 CNG stations · 1,240 PNG consumers',
    section: ['DRS-01, DRS-02, DRS-03', 'Online + Mother CNG Stations', '1,240 PNG connections'],
  },
  {
    id: 'SV-02',
    position: [34, 0, -56],
    rotation: -0.7,
    chainageKm: 4.2,
    controls: ['e-secondary-1', 'e-secondary-2'],
    affected: '2 DRS · 1 CNG station · 142 PNG consumers',
    section: ['DRS-02, DRS-03', 'Online CNG Station', '142 PNG connections · 2 commercial'],
  },
  {
    id: 'SV-03',
    position: [-10, 0, -12],
    rotation: -0.9,
    chainageKm: 6.0,
    controls: ['e-secondary-2'],
    affected: '1 DRS · 386 PNG consumers',
    section: ['DRS-03 · West', '386 PNG connections'],
  },
  {
    id: 'SV-04',
    position: [-35, 0, 10],
    rotation: -0.8,
    chainageKm: 7.4,
    controls: ['e-secondary-2', 'e-png-main'],
    affected: '1 DRS · 1,400 PNG West consumers',
    section: ['DRS-03 · West', 'PNG Consumers · West (1,400)'],
  },
];

export const SV_BY_ID = Object.fromEntries(SV_STATIONS.map((s) => [s.id, s])) as Record<SvId, SvDef>;
