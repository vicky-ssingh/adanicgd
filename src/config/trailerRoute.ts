import * as THREE from 'three';

/**
 * Section 03 — the cascade-trailer transport route across the ACTUAL city road
 * network. Points follow real road centrelines (see cityLayout roadCenter():
 * -112.5, -67.5, -22.5, 22.5, 67.5, 112.5): the rig leaves the Mother Station
 * apron (world ~[40,-150]) onto the south ring road, runs west, then north on a
 * vertical road to the Daughter Booster drop-off in the western industrial edge.
 * A CatmullRom through these points rounds the turns so the rig tracks smoothly.
 */
// Section 16/17 — the rig enters through the TRUCK-IN gate (world x≈26), aligned
// with the filling bay, so the parked/detached tractor sits on clear apron and no
// longer clips the Mother Station security cabin (which is at x≈42).
export const TRAILER_PATH_POINTS: [number, number][] = [
  [26, -120], // Mother Station apron — filling position (truck gate / bay lane)
  [26, -110], // exit through the gate + take the NORTH lane, clear of the boundary wall (z≈-114)
  [-67.5, -110], // west along the ring road (north lane)
  [-67.5, 22.5], // north on the x=-67.5 vertical road
  [-72, 22.5], // Daughter Booster drop-off bay (dwell / discharge end)
];

export const MOTHER_LABEL = 'CNG Mother Station';
export const DAUGHTER_LABEL = 'Daughter Booster Station';

/** Shared smooth curve (arc-length parameterised via getPointAt/ getTangentAt). */
export const TRAILER_CURVE = new THREE.CatmullRomCurve3(
  TRAILER_PATH_POINTS.map(([x, z]) => new THREE.Vector3(x, 0, z)),
  false,
  'catmullrom',
  0.15,
);
export const TRAILER_CURVE_LEN = TRAILER_CURVE.getLength();

/** World endpoints (dwell positions). */
export const MOTHER_POINT = new THREE.Vector3(...[26, 0, -118] as [number, number, number]);
export const DAUGHTER_POINT = new THREE.Vector3(...[-72, 0, 22.5] as [number, number, number]);
