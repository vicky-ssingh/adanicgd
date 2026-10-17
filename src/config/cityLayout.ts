import type { BuildingCategory } from '@/components3d/city/Building';
import { insideExclusion, insideRouteCorridor, validateProps } from '@/config/exclusionMask';

/**
 * Deterministic city layout generator (spec §2.5). Produces a grid of roads,
 * districted building lots, and prop placements (streetlights, trees, vehicles,
 * road markings) from a fixed seed so the city is stable across reloads.
 *
 * Coordinate system: XZ ground plane, Y up. Everything is centred on the origin.
 * Two block cells are reserved as district="infra" for the CGD assets placed in
 * M3 (city gate + CNG station), so the city already leaves room for them.
 */

export const GRID = {
  N: 5, // blocks per axis
  BLOCK: 34, // block footprint (units)
  ROAD: 11, // road width (units)
  SIDEWALK: 3.2, // sidewalk width inside each block edge
};

const PERIOD = GRID.BLOCK + GRID.ROAD; // 45
export const CITY_TOTAL = GRID.N * GRID.BLOCK + (GRID.N + 1) * GRID.ROAD;
const HALF = CITY_TOTAL / 2;

/** Centreline of road index i (0..N) on one axis. */
export function roadCenter(i: number): number {
  return -HALF + GRID.ROAD / 2 + i * PERIOD;
}
/** Centre of block cell j (0..N-1) on one axis. */
export function blockCenter(j: number): number {
  return -HALF + GRID.ROAD + GRID.BLOCK / 2 + j * PERIOD;
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type District = BuildingCategory | 'park' | 'infra' | 'golf' | 'school' | 'plaza';
export type LandmarkType = 'golf' | 'school' | 'plaza';

export interface BuildingLot {
  position: [number, number, number];
  width: number;
  depth: number;
  height: number;
  category: BuildingCategory;
  seed: number;
  rotation: number;
}

export interface PropInstance {
  position: [number, number, number];
  rotation: number;
  scale: number;
  variant: number;
}

export interface RoadSegment {
  // axis-aligned road quad
  x: number;
  z: number;
  length: number;
  horizontal: boolean;
}

export interface CityLayout {
  districts: District[][]; // [cx][cz]
  buildings: BuildingLot[];
  streetlights: PropInstance[];
  trees: PropInstance[];
  vehicles: PropInstance[];
  crosswalks: { x: number; z: number; horizontal: boolean }[];
  laneDashes: PropInstance[]; // thin centreline dashes
  roadsH: RoadSegment[];
  roadsV: RoadSegment[];
  bounds: number;
  infraCells: { cx: number; cz: number; center: [number, number] }[];
  landmarks: { type: LandmarkType; center: [number, number] }[];
}

/** Assign a district to each block cell. */
function districtFor(cx: number, cz: number, N: number): District {
  // Reserve two cells for CGD infrastructure (placed in M3).
  if (cx === N - 1 && cz === 0) return 'infra'; // city gate yard
  if (cx === N - 1 && cz === N - 1) return 'infra'; // CNG station
  // One green park block near the centre.
  if (cx === 1 && cz === 2) return 'park';
  // Shantigram landmark cells (kept building-free; landmarks placed on top).
  if (cx === 0 && cz === 0) return 'golf'; // Belvedere Golf & Country Club (corner)
  if (cx === 0 && cz === N - 1) return 'school'; // Adani International School
  if (cx === N - 2 && cz === 0) return 'plaza'; // Shoppers' Plaza
  // Industrial strip along one edge.
  if (cx === 0) return 'industrial';
  // Institutional cluster.
  if (cx === 2 && cz === 1) return 'institutional';
  if (cx === 3 && cz === 3) return 'institutional';
  // Commercial core.
  if (cx >= 2 && cz >= 1 && cz <= 3) return 'commercial';
  // Residential everywhere else.
  return 'residential';
}

export function generateCity(seed = 20240911): CityLayout {
  const { N, BLOCK, SIDEWALK } = GRID;
  const rand = rng(seed);

  const districts: District[][] = [];
  const buildings: BuildingLot[] = [];
  const trees: PropInstance[] = [];
  const vehicles: PropInstance[] = [];
  const infraCells: CityLayout['infraCells'] = [];
  const landmarks: CityLayout['landmarks'] = [];

  const usable = BLOCK - SIDEWALK * 2; // buildable inner footprint

  for (let cx = 0; cx < N; cx++) {
    districts[cx] = [];
    for (let cz = 0; cz < N; cz++) {
      const d = districtFor(cx, cz, N);
      districts[cx][cz] = d;
      const bx = blockCenter(cx);
      const bz = blockCenter(cz);
      const lotSeed = (cx * 97 + cz * 131 + seed) | 0;
      const r = rng(lotSeed);

      if (d === 'infra') {
        infraCells.push({ cx, cz, center: [bx, bz] });
        continue;
      }

      if (d === 'golf' || d === 'school' || d === 'plaza') {
        landmarks.push({ type: d, center: [bx, bz] });
        continue;
      }

      if (d === 'park') {
        // Scatter trees in a park cell.
        const count = 14 + Math.floor(r() * 8);
        for (let i = 0; i < count; i++) {
          trees.push({
            position: [
              bx + (r() - 0.5) * usable,
              0,
              bz + (r() - 0.5) * usable,
            ],
            rotation: r() * Math.PI * 2,
            scale: 0.8 + r() * 0.7,
            variant: Math.floor(r() * 3),
          });
        }
        continue;
      }

      // Building lots per district.
      if (d === 'commercial' || d === 'institutional') {
        // 1 large tower (institutional) or 1-2 towers (commercial).
        const towers = d === 'institutional' ? 1 : 1 + Math.floor(r() * 2);
        for (let t = 0; t < towers; t++) {
          const w = (usable / (towers === 1 ? 1.4 : 2.2)) * (0.8 + r() * 0.3);
          const dp = usable * (0.55 + r() * 0.3);
          const h =
            d === 'institutional'
              ? 9 + r() * 6
              : 16 + r() * 26;
          const offX = towers === 1 ? 0 : (t === 0 ? -1 : 1) * usable * 0.24;
          buildings.push({
            position: [bx + offX, 0, bz + (r() - 0.5) * 2],
            width: Math.min(w, usable * 0.9),
            depth: Math.min(dp, usable * 0.9),
            height: h,
            category: d,
            seed: lotSeed + t * 17,
            rotation: 0,
          });
        }
      } else if (d === 'industrial') {
        // Wide low warehouse + a smaller unit.
        buildings.push({
          position: [bx, 0, bz - usable * 0.12],
          width: usable * 0.86,
          depth: usable * 0.5,
          height: 7 + r() * 4,
          category: 'industrial',
          seed: lotSeed,
          rotation: 0,
        });
        if (r() > 0.4) {
          buildings.push({
            position: [bx + (r() - 0.5) * usable * 0.3, 0, bz + usable * 0.3],
            width: usable * (0.3 + r() * 0.2),
            depth: usable * 0.28,
            height: 5 + r() * 3,
            category: 'industrial',
            seed: lotSeed + 41,
            rotation: 0,
          });
        }
      } else {
        // Residential: a 2x2-ish cluster of smaller blocks/houses.
        const cells = 2;
        const step = usable / cells;
        for (let ix = 0; ix < cells; ix++) {
          for (let iz = 0; iz < cells; iz++) {
            if (r() > 0.82) continue; // occasional gap / yard
            const w = step * (0.5 + r() * 0.3);
            const dp = step * (0.5 + r() * 0.3);
            const h = 5 + r() * 11;
            buildings.push({
              position: [
                bx - usable / 2 + step * (ix + 0.5) + (r() - 0.5) * 1.5,
                0,
                bz - usable / 2 + step * (iz + 0.5) + (r() - 0.5) * 1.5,
              ],
              width: w,
              depth: dp,
              height: h,
              category: 'residential',
              seed: lotSeed + ix * 7 + iz * 13,
              rotation: (r() - 0.5) * 0.15,
            });
          }
        }
      }

      // A couple of parked vehicles near the block edge on some lots.
      if (d !== 'industrial' && r() > 0.5) {
        vehicles.push({
          position: [bx + (r() - 0.5) * usable, 0, bz + BLOCK / 2 - SIDEWALK - 1.4],
          rotation: 0,
          scale: 1,
          variant: Math.floor(r() * 3),
        });
      }
    }
  }

  // Streetlights: evenly spaced along every road, on the sidewalk edge.
  const streetlights: PropInstance[] = [];
  const laneDashes: PropInstance[] = [];
  const crosswalks: CityLayout['crosswalks'] = [];
  const roadsH: RoadSegment[] = [];
  const roadsV: RoadSegment[] = [];

  const lampSpacing = 22;
  const edge = HALF;

  for (let i = 0; i <= N; i++) {
    const c = roadCenter(i);
    // Horizontal road (constant z=c, spans x)
    roadsH.push({ x: 0, z: c, length: CITY_TOTAL, horizontal: true });
    // Vertical road (constant x=c, spans z)
    roadsV.push({ x: c, z: 0, length: CITY_TOTAL, horizontal: false });

    // Lamps + dashes along horizontal road
    for (let s = -edge + lampSpacing / 2; s < edge; s += lampSpacing) {
      streetlights.push({
        position: [s, 0, c - GRID.ROAD / 2 - 0.5],
        rotation: Math.PI,
        scale: 1,
        variant: 0,
      });
      streetlights.push({
        position: [s + lampSpacing / 2, 0, c + GRID.ROAD / 2 + 0.5],
        rotation: 0,
        scale: 1,
        variant: 0,
      });
    }
    for (let s = -edge + 2; s < edge; s += 5) {
      laneDashes.push({ position: [s, 0.02, c], rotation: 0, scale: 1, variant: 0 });
    }
    // Lamps + dashes along vertical road
    for (let s = -edge + lampSpacing; s < edge; s += lampSpacing) {
      streetlights.push({
        position: [c - GRID.ROAD / 2 - 0.5, 0, s],
        rotation: -Math.PI / 2,
        scale: 1,
        variant: 0,
      });
    }
    for (let s = -edge + 2; s < edge; s += 5) {
      laneDashes.push({ position: [c, 0.02, s], rotation: Math.PI / 2, scale: 1, variant: 0 });
    }
  }

  // Crosswalks at each intersection (four approaches).
  for (let i = 0; i <= N; i++) {
    for (let j = 0; j <= N; j++) {
      const x = roadCenter(i);
      const z = roadCenter(j);
      crosswalks.push({ x, z: z - GRID.ROAD / 2 - 1.2, horizontal: true });
      crosswalks.push({ x, z: z + GRID.ROAD / 2 + 1.2, horizontal: true });
      crosswalks.push({ x: x - GRID.ROAD / 2 - 1.2, z, horizontal: false });
      crosswalks.push({ x: x + GRID.ROAD / 2 + 1.2, z, horizontal: false });
    }
  }

  // Section 16 §A — query the authoritative exclusion mask (roads + intersections
  // + trailer route corridor + stations) BEFORE placing any tree, so nothing lands
  // on a carriageway or in the cascade-trailer's path.
  const pushTree = (x: number, z: number) => {
    if (insideExclusion(x, z)) return;
    trees.push({
      position: [x, 0, z],
      rotation: rand() * Math.PI * 2,
      scale: 0.85 + rand() * 0.5,
      variant: Math.floor(rand() * 3),
    });
  };

  // Mature trees lining every main avenue (addon §6 — dense, both sides).
  for (let i = 0; i <= N; i++) {
    const c = roadCenter(i);
    for (let s = -edge + 8; s < edge; s += 9) {
      if (rand() > 0.22) pushTree(s, c - GRID.ROAD / 2 - 1.7);
      if (rand() > 0.22) pushTree(s + 4.5, c + GRID.ROAD / 2 + 1.7);
      if (rand() > 0.22) pushTree(c - GRID.ROAD / 2 - 1.7, s + 4.5);
    }
  }

  // §A.3 validation sweep — confirm zero trees inside the mask after placement.
  validateProps(trees, 'trees');
  // §16/17 — cull streetlights inside the cascade-trailer route corridor so their
  // poles/arms don't clip the passing trailer (keeps all other city lighting).
  const clearStreetlights = streetlights.filter((l) => !insideRouteCorridor(l.position[0], l.position[2]));

  return {
    districts,
    buildings,
    streetlights: clearStreetlights,
    trees,
    vehicles,
    crosswalks,
    laneDashes,
    roadsH,
    roadsV,
    bounds: CITY_TOTAL,
    infraCells,
    landmarks,
  };
}
