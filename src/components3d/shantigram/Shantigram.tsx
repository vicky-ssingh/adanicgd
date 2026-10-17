import { useMemo } from 'react';
import { generateCity } from '@/config/cityLayout';
import { AdaniSchool, GolfClub, ShoppersPlaza } from './LandmarkBuildings';
import { EntranceGate } from './EntranceGate';
import { ClusterSigns } from './ClusterSigns';
import { Amenities } from './Amenities';

/**
 * Shantigram landmark layer (spec §3). Places the named landmark buildings on
 * their reserved township cells, the main entrance gate on the SG-Highway side
 * near the transmission entry, the residential cluster signboards, and the
 * community amenities. Pure environment overlay — no CGD simulation touched.
 */
export function Shantigram() {
  const landmarks = useMemo(() => generateCity().landmarks, []);

  return (
    <group>
      {landmarks.map((lm, i) => {
        if (lm.type === 'school') return <AdaniSchool key={i} center={lm.center} />;
        if (lm.type === 'golf') return <GolfClub key={i} center={lm.center} />;
        if (lm.type === 'plaza') return <ShoppersPlaza key={i} center={lm.center} />;
        return null;
      })}

      {/* Main entrance gate near the SG-Highway / transmission entry (x ≈ +118). */}
      <EntranceGate position={[113, 0, -66]} rotation={-Math.PI / 2} />

      <ClusterSigns />
      <Amenities />
    </group>
  );
}
