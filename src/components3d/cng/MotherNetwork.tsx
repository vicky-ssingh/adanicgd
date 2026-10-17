import { MotherStation } from './MotherStation';
import { Selectable } from '@/components3d/Selectable';
import { useRouteStore } from '@/state/useRouteStore';
import { MOTHER_ROUTE } from '@/config/routes';

/**
 * CNG Mother Station placement (Section 02). Sits on its own industrial apron on
 * open ground just south of the city, near the PRS / primary pipeline, with truck
 * access from the ring road. The teal HP feeder + flow come from the shared graph
 * (config/network.ts → e-mother-spur, mother-station node). The outer <Selectable>
 * gives the existing click-to-highlight route + camera-fly behaviour.
 */
export function MotherNetwork() {
  const setRoute = useRouteStore((s) => s.setRoute);
  return (
    <group>
      <Selectable
        id="mother-station"
        position={[40, 0, -150]}
        radius={34}
        onSelect={() =>
          setRoute({
            edges: new Set(MOTHER_ROUTE.edges),
            chain: MOTHER_ROUTE.chain,
            title: MOTHER_ROUTE.title,
            flow: MOTHER_ROUTE.flow,
          })
        }
      >
        <MotherStation rotation={0} />
      </Selectable>
    </group>
  );
}
