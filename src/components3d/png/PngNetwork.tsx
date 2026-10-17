import { useMemo } from 'react';
import { generateCity } from '@/config/cityLayout';
import { PngMeter, ServiceRiser } from './PngMeter';
import { ResidentialInterior } from './ResidentialInterior';
import { PipeRun } from '@/components3d/primitives/Pipe';
import { Selectable } from '@/components3d/Selectable';

/**
 * PNG network placement (spec §2.20–2.22). Attaches service risers + PNG meters
 * to real residential/commercial buildings in the west district (same
 * deterministic city seed), draws a shallow MDPE service main with service tees,
 * and places a residential-interior cutaway. The buried MDPE main + violet flow
 * come from the shared graph (e-png-main, png-zone node).
 */
export function PngNetwork() {
  const connections = useMemo(() => {
    const city = generateCity();
    // Pick buildings in the west-central area to receive PNG connections.
    return city.buildings
      .filter(
        (b) =>
          b.position[0] > -96 &&
          b.position[0] < -28 &&
          b.position[2] > 6 &&
          b.position[2] < 62 &&
          (b.category === 'residential' || b.category === 'commercial'),
      )
      .slice(0, 8)
      .map((b) => ({
        // meter on the +Z (street-facing) wall
        wall: [b.position[0], 0, b.position[2] + b.depth / 2 + 0.08] as [number, number, number],
        commercial: b.category === 'commercial',
      }));
  }, []);

  // Shallow MDPE main threading past the connected buildings.
  const mainRoute = useMemo(() => {
    const pts: [number, number, number][] = [[-46, 0.15, 22]];
    connections.forEach((c) => pts.push([c.wall[0], 0.15, c.wall[2] - 1.2]));
    pts.push([-64, 0.15, 40]);
    return pts;
  }, [connections]);

  return (
    <group>
      {/* MDPE service main (yellow, shallow-buried, cover cut away) */}
      <PipeRun points={mainRoute} radius={0.11} color="#f59e0b" roughness={0.5} metalness={0.5} seed={200} radialSegments={12} />

      {/* Service connections: riser + meter per building */}
      {connections.map((c, i) => (
        <group key={i}>
          <ServiceRiser position={[c.wall[0], 0, c.wall[2] - 0.3]} height={c.commercial ? 1.1 : 0.9} />
          <PngMeter position={c.wall} rotation={0} scale={c.commercial ? 1.25 : 1} />
          {/* service tee stub from main to riser */}
          <PipeRun
            points={[
              [c.wall[0], 0.15, c.wall[2] - 1.2],
              [c.wall[0], 0.15, c.wall[2] - 0.3],
            ]}
            radius={0.05}
            color="#f59e0b"
            seed={201 + i}
            radialSegments={8}
          />
        </group>
      ))}

      {/* Residential interior cutaway (last-mile demonstration) — selectable */}
      <Selectable id="png-zone" position={[-84, 0.15, 52]} rotation={Math.PI * 0.15} radius={3.4}>
        <ResidentialInterior />
      </Selectable>
    </group>
  );
}
