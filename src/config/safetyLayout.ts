import { NETWORK } from '@/config/network';
import { SV_STATIONS } from '@/config/svStations';

/**
 * Section 08 — placement config for the cross-facility safety layer (ESD, gas
 * detection, fire protection, cathodic protection). World positions per facility,
 * kept additive so no existing station file changes.
 */
export type FacilityId = 'online-cng' | 'mother' | 'daughter' | 'booster' | 'citygate';

export interface FacilityDef {
  id: FacilityId;
  label: string;
  rotation: number;
  strobe: [number, number, number]; // beacon (elevated)
  esdValve: [number, number, number]; // inlet ESD valve
  esdButtons: [number, number][]; // ground XZ
  detectors: [number, number, number][]; // gas detector heads (elevated a bit)
  flame?: [number, number, number][]; // flame detectors (CNG only)
  fire: [number, number][]; // fire-equipment cluster anchors
  hydrant: [number, number];
  assembly: [number, number];
  gasPanel: [number, number, number]; // gas-detection panel (on a wall/kiosk)
}

export const FACILITIES: FacilityDef[] = [
  {
    id: 'online-cng', label: 'Online CNG Station', rotation: 0,
    strobe: [90, 6.0, 90], esdValve: [104, 0, 96],
    esdButtons: [[74, 78], [74, 102], [104, 100], [78, 104]],
    detectors: [[97, 1.6, 86], [102, 1.6, 94], [79, 1.6, 87]],
    flame: [[81, 3.2, 96], [96, 3.2, 90]],
    fire: [[92, 76], [82, 106]], hydrant: [107, 78], assembly: [72, 74],
    gasPanel: [100, 1.4, 82],
  },
  {
    id: 'mother', label: 'CNG Mother Station', rotation: 0,
    strobe: [40, 7.5, -142], esdValve: [10, 0, -162],
    esdButtons: [[8, -184], [34, -158], [46, -158], [55, -158], [28, -138], [8, -120]],
    detectors: [[32, 1.6, -156], [44, 1.6, -156], [62, 1.6, -146], [26, 1.6, -138]],
    fire: [[60, -184], [8, -120]], hydrant: [70, -170], assembly: [72, -120],
    gasPanel: [66, 1.4, -142],
  },
  {
    id: 'daughter', label: 'CNG Daughter Station', rotation: 0,
    strobe: [130, 6.0, 40], esdValve: [130, 0, 22],
    esdButtons: [[124, 48], [130, 24], [136, 48]],
    detectors: [[127, 1.6, 38], [133, 1.6, 24], [138, 1.6, 40]],
    fire: [[144, 44]], hydrant: [146, 26], assembly: [116, 52],
    gasPanel: [138, 1.4, 44],
  },
  {
    id: 'booster', label: 'Daughter Booster Station', rotation: 0,
    strobe: [-150, 6.0, 20], esdValve: [-166, 0, 4],
    esdButtons: [[-158, 30], [-134, 14], [-158, -12], [-172, 20]],
    detectors: [[-134, 1.6, -8], [-134, 1.6, 3], [-158, 1.6, 24]],
    fire: [[-124, 26]], hydrant: [-126, -8], assembly: [-172, 30],
    gasPanel: [-140, 1.4, 26],
  },
  {
    id: 'citygate', label: 'City Gate Station', rotation: Math.PI,
    strobe: [80, 6.0, -84], esdValve: [105, 0, -90],
    esdButtons: [[100, -80], [90, -92], [79, -87]],
    detectors: [[99, 1.6, -91], [90, 1.6, -91], [81, 1.6, -91]],
    fire: [[95, -82]], hydrant: [78, -82], assembly: [72, -78],
    gasPanel: [82, 1.4, -84],
  },
];

export const FACILITY_BY_ID = Object.fromEntries(FACILITIES.map((f) => [f.id, f])) as Record<FacilityId, FacilityDef>;

/** CP TR units (2) — City Gate + mid primary route. */
export const TR_UNITS = [
  { id: 'TR-01', label: 'City Gate Station', pos: [104, 0, -84] as [number, number, number], rotation: Math.PI, protectedKm: 6.4, chainageKm: 0.2 },
  { id: 'TR-02', label: 'Primary Route (mid)', pos: [58, 0, -71] as [number, number, number], rotation: -0.5, protectedKm: 5.1, chainageKm: 3.6 },
];

/** CP test posts (ORANGE) sampled along STEEL routes only (never MDPE/png). */
export function cpTestPosts(): { id: string; pos: [number, number, number]; chainageKm: number }[] {
  const steel = NETWORK.edges.filter((e) => e.network === 'common' && e.render !== false);
  const out: { id: string; pos: [number, number, number]; chainageKm: number }[] = [];
  let n = 1; let chain = 0.4;
  for (const e of steel) {
    for (let i = 0; i < e.points.length; i++) {
      if (i > 0 && i % 2 === 1) continue; // ~every other vertex
      const p = e.points[i];
      out.push({ id: `TP-${String(n).padStart(3, '0')}`, pos: [p[0] - 1.4, 0, p[2] - 1.4], chainageKm: +chain.toFixed(1) });
      n += 1; chain += 0.6;
    }
  }
  // one at each SV station
  for (const sv of SV_STATIONS) {
    out.push({ id: `TP-${String(n).padStart(3, '0')}`, pos: [sv.position[0] + 3.6, 0, sv.position[2] + 1], chainageKm: sv.chainageKm });
    n += 1;
  }
  return out;
}

/** Steel edges carry CP; the marginal survey section (Section 08 §D.3). */
export const CP_MARGINAL_EDGE = 'e-secondary-1';
