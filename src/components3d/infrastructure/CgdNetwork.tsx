import { CityGateStation } from './CityGateStation';
import { DrsKiosk } from './DrsKiosk';
import { CustodyTransferMeter } from './CustodyTransferMeter';
import { LineValves } from '@/components3d/valves/LineValves';
import { MaintenanceVehicle } from '@/components3d/cng/MaintenanceVehicle';
import { PipelineNetwork, type PipeRoute } from './PipelineNetwork';
import { Selectable } from '@/components3d/Selectable';
import { NETWORK } from '@/config/network';
import type { NetEdge } from '@/types/network';

/**
 * Section 12 §B.2 — painted-steel body colour + identification-band colour per
 * edge (no glow). Steel = grey with a yellow band; CNG branch = grey with a teal
 * band; MDPE / local tertiary = full-yellow plastic.
 */
function styleFor(e: NetEdge): Pick<PipeRoute, 'bodyColor' | 'bandColor' | 'mdpe'> {
  if (e.network === 'cng') return { bodyColor: '#9ba3ab', bandColor: '#14b8a6', mdpe: false };
  if (e.network === 'png' || e.tier === 'tertiary') return { mdpe: true }; // yellow MDPE plastic
  if (e.tier === 'transmission') return { bodyColor: '#8a9099', bandColor: '#f5c400', mdpe: false };
  return { bodyColor: '#9ba3ab', bandColor: '#f5c400', mdpe: false };
}

/**
 * CGD network placement (spec §2.9 / §2.13 / §2.14). Places the City Gate
 * Station, the District Regulating Stations, and the pipeline hierarchy — all
 * driven by the shared topology graph in config/network.ts so geometry,
 * simulation and flow particles stay in lock-step. Edges flagged render:false
 * (process-internal) are drawn by their station component, not here.
 */
// Section 15: DRS boxes replaced by detailed DrsKiosk units.
export function CgdNetwork() {
  const routes: PipeRoute[] = NETWORK.edges
    .filter((e) => e.render !== false)
    .map((e, i) => ({ id: e.id, points: e.points, tier: e.tier, fromId: e.from, toId: e.to, seed: 61 + i, ...styleFor(e) }));

  const drsNodes = NETWORK.nodes.filter((n) => n.type === 'drs');

  return (
    <group>
      <CityGateStation position={[90, 0, -90]} rotation={Math.PI} />
      {drsNodes.map((d, i) => (
        <Selectable key={d.id} id={d.id} position={[d.position[0], 0, d.position[2]]} radius={3.4}>
          <DrsKiosk id={d.id} rotation={[0.3, -0.4, 0.2][i] ?? 0} />
        </Selectable>
      ))}
      {/* §17 C.2 — maintenance van beside the under-inspection DRS-01 (off carriageway) */}
      <MaintenanceVehicle position={[49, 0, -57]} rotation={-0.6} />
      <PipelineNetwork routes={routes} />
      {/* 2D reference parity: custody transfer meter + operable line valves */}
      <CustodyTransferMeter />
      <LineValves />
    </group>
  );
}
