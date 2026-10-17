import type { BuildingCategory } from '@/components3d/city/Building';
import type { BuildingLot } from '@/config/cityLayout';

/** Apply wall pipework to one building (test) vs all res/comm (final). */
export const WALL_PIPEWORK_ALL = true;

/** Local-frame placement of the vertical riser on the building's +X wall. */
export function wallPipeLocal(width: number, depth: number, category: BuildingCategory) {
  const R = category === 'commercial' ? 0.06 : 0.045;
  const x = width / 2 + 0.05 + R;
  const z = Math.max(-depth / 2 + 0.8, depth / 2 - 1.5);
  return { x, z, R };
}

/** Buildings that receive wall pipework, honouring the test/all gating. */
export function pipeworkBuildings(buildings: BuildingLot[]): { lot: BuildingLot; index: number }[] {
  const firstRes = buildings.findIndex((b) => b.category === 'residential');
  const out: { lot: BuildingLot; index: number }[] = [];
  buildings.forEach((lot, index) => {
    if (lot.category !== 'residential' && lot.category !== 'commercial') return;
    if (!WALL_PIPEWORK_ALL && index !== firstRes) return;
    out.push({ lot, index });
  });
  return out;
}
