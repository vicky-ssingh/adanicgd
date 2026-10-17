import { useMemo } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { generateCity } from '@/config/cityLayout';
import { Roads } from './Roads';
import { Building } from './Building';
import { Streetlights } from './Streetlights';
import { Trees } from './Trees';
import { Vehicles } from './Vehicles';
import { useRouteStore } from '@/state/useRouteStore';
import { useSelectionStore } from '@/state/useSelectionStore';
import { BUILDING_ROUTES } from '@/config/routes';
import { WallPipework } from '@/components3d/png/WallPipework';
import { WALL_PIPEWORK_ALL } from '@/config/wallPipework';

/**
 * Full city environment (spec §2.5–2.7). Generates a deterministic layout once,
 * then renders roads/sidewalks/markings, districted buildings, and instanced
 * streetlights, trees and vehicles. Two block cells are left as `infra` for the
 * CGD city-gate + CNG station placed in M3.
 */
export function City() {
  const layout = useMemo(() => generateCity(), []);
  const setRoute = useRouteStore((s) => s.setRoute);
  const clearSelection = useSelectionStore((s) => s.clear);
  // First residential building index — used for the single-building test.
  const testIdx = useMemo(
    () => layout.buildings.findIndex((b) => b.category === 'residential'),
    [layout],
  );

  return (
    <group>
      <Roads layout={layout} />

      {layout.buildings.map((b, i) => {
        const def = BUILDING_ROUTES[b.category];
        const onClick = (e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          clearSelection();
          setRoute({ edges: new Set(def.edges), chain: def.chain, title: def.title, flow: def.flow });
        };
        const onOver = (e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        };
        const onOut = () => {
          document.body.style.cursor = 'auto';
        };
        const wantsPipework =
          (b.category === 'residential' || b.category === 'commercial') &&
          (WALL_PIPEWORK_ALL || i === testIdx);
        return (
          <group key={i}>
            <group onClick={onClick} onPointerOver={onOver} onPointerOut={onOut}>
              <Building
                position={b.position}
                width={b.width}
                depth={b.depth}
                height={b.height}
                category={b.category}
                seed={b.seed}
                rotation={b.rotation}
              />
            </group>
            {wantsPipework && (
              <group position={b.position} rotation={[0, b.rotation, 0]}>
                <WallPipework
                  width={b.width}
                  depth={b.depth}
                  height={b.height}
                  category={b.category as 'residential' | 'commercial'}
                />
              </group>
            )}
          </group>
        );
      })}

      <Streetlights items={layout.streetlights} />
      <Trees items={layout.trees} />
      <Vehicles items={layout.vehicles} />
    </group>
  );
}
