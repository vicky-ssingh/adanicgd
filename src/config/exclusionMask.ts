import * as THREE from 'three';
import { GRID, roadCenter } from '@/config/cityLayout';
import { TRAILER_CURVE } from '@/config/trailerRoute';

/**
 * Section 16 §A — the authoritative placement-exclusion mask. Trees and other
 * scattered props MUST query this before being instantiated so nothing lands on a
 * carriageway, in an intersection turning area, or in the cascade-trailer route
 * corridor. Built from the real road geometry + the trailer route, so the tree
 * placer and the vehicle router respect the same corridor.
 */
const ROAD_BUFFER = 1.5; // clearance beyond the kerb
const ROUTE_CORRIDOR = 7.5; // trailer swept-path clearance either side of the route

/** Road centre lines + carriageway exclusion half-width — computed lazily to
 *  avoid a circular module-load dependency with cityLayout (GRID/roadCenter TDZ). */
let _centres: number[] | null = null;
let _roadExclude = 0;
function centres(): number[] {
  if (!_centres) {
    _centres = Array.from({ length: GRID.N + 1 }, (_, i) => roadCenter(i));
    _roadExclude = GRID.ROAD / 2 + ROAD_BUFFER; // 7.0
  }
  return _centres;
}

/** Sampled points along the trailer route (for corridor tests + debug overlay). */
export const ROUTE_SAMPLES: [number, number][] = (() => {
  const pts: [number, number][] = [];
  const n = 160;
  for (let i = 0; i <= n; i++) {
    const p = TRAILER_CURVE.getPoint(i / n, new THREE.Vector3());
    pts.push([p.x, p.z]);
  }
  return pts;
})();

/** Station forecourts / equipment areas kept clear of scattered vegetation. */
const KEEPOUT: [number, number, number][] = [
  [45, -60, 8], [0, -15, 8], [-48, 15, 8], // DRS kiosks
  [90, -90, 22], [90, 90, 20], // City Gate + Online CNG station
  [40, -150, 24], // Mother Station apron + filling bay
  [130, 40, 16], [-150, 20, 16], // Daughter + Booster stations
];

function nearRoad(x: number, z: number): boolean {
  const cs = centres();
  for (const c of cs) if (Math.abs(x - c) < _roadExclude || Math.abs(z - c) < _roadExclude) return true;
  return false;
}

function nearRoute(x: number, z: number): boolean {
  // coarse: only test when roughly near the route bbox
  for (const [rx, rz] of ROUTE_SAMPLES) {
    const dx = x - rx, dz = z - rz;
    if (dx * dx + dz * dz < ROUTE_CORRIDOR * ROUTE_CORRIDOR) return true;
  }
  return false;
}

function nearStation(x: number, z: number): boolean {
  return KEEPOUT.some(([kx, kz, r]) => (x - kx) ** 2 + (z - kz) ** 2 < r * r);
}

/** True if a scattered prop must NOT be placed at (x,z). */
export function insideExclusion(x: number, z: number): boolean {
  return nearRoad(x, z) || nearStation(x, z) || nearRoute(x, z);
}

/** §16/17 — true if (x,z) is inside the cascade-trailer route corridor. Used to
 *  cull streetlights (which sit on the road edge and would otherwise clip the
 *  passing trailer) without removing every streetlight in the city. */
export function insideRouteCorridor(x: number, z: number): boolean {
  return nearRoute(x, z);
}

/** §A.3 validation sweep — returns props whose position falls inside the mask. */
export function validateProps(props: { position: [number, number, number] }[], label = 'props'): number {
  const bad = props.filter((p) => insideExclusion(p.position[0], p.position[2]));
  if (bad.length && typeof console !== 'undefined') {
    console.warn(`[exclusion] ${bad.length} ${label} inside the exclusion mask:`,
      bad.slice(0, 8).map((p) => `(${p.position[0].toFixed(0)},${p.position[2].toFixed(0)})`).join(' '));
  }
  return bad.length;
}
