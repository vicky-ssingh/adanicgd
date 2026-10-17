import { CngStation } from './CngStation';
import { Selectable } from '@/components3d/Selectable';
import { useRouteStore } from '@/state/useRouteStore';
import { CNG_ROUTE } from '@/config/routes';

/**
 * CNG network placement (Section 01). Places the Online CNG Station in the
 * reserved SE infra cell. As an Online (pipeline-connected) station it has NO
 * permanently parked cascade trailer — that is a Daughter-Station feature. The
 * teal CNG feeder pipeline + flow come from the shared graph (config/network.ts
 * → e-cng-spur, cng-station node). The outer <Selectable> keeps the existing
 * click-to-highlight route + camera-fly behaviour.
 */
export function CngNetwork() {
  const setRoute = useRouteStore((s) => s.setRoute);
  return (
    <group>
      <Selectable
        id="cng-station"
        position={[90, 0, 90]}
        radius={13}
        onSelect={() =>
          setRoute({
            edges: new Set(CNG_ROUTE.edges),
            chain: CNG_ROUTE.chain,
            title: CNG_ROUTE.title,
            flow: CNG_ROUTE.flow,
          })
        }
      >
        <CngStation rotation={0} />
      </Selectable>
    </group>
  );
}
