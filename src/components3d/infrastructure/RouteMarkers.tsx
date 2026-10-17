import { useMemo } from 'react';
import * as THREE from 'three';
import { NETWORK } from '@/config/network';
import { SV_STATIONS } from '@/config/svStations';
import { useMarkerStore, type MarkerInfo } from '@/state/useMarkerStore';
import { useSelectionStore } from '@/state/useSelectionStore';
import { useRouteStore } from '@/state/useRouteStore';
import { useSvStore } from '@/state/useSvStore';
import { steel, paintedMetal, concrete } from '@/materials/materials';
import { SignPlane, LogoDecal } from '@/components3d/branding/Branding';

/**
 * Section 07 Part C — pipeline route markers. Bright yellow "DO NOT DIG" posts
 * placed along the buried routes (at every bend + interval) so the underground
 * network is READABLE from the city overview, plus road-crossing markings, buried
 * valve-chamber covers, and one trench-cutaway showpiece (pipe bedding + warning
 * tape). Purely additive — it changes no pipeline geometry. Markers are clickable.
 */

const postMat = new THREE.MeshStandardMaterial({ color: '#f5c400', roughness: 0.5, metalness: 0.2 });
const baseMat = new THREE.MeshStandardMaterial({ color: '#b9b5ac', roughness: 0.9, metalness: 0 });
const reflMat = new THREE.MeshStandardMaterial({ color: '#eef2f6', emissive: new THREE.Color('#cfe0ee'), emissiveIntensity: 0.2, roughness: 0.4 });

function RouteMarker({ pos, info }: { pos: [number, number, number]; info: MarkerInfo }) {
  const open = useMarkerStore((s) => s.open);
  return (
    <group
      position={pos}
      onClick={(e) => { e.stopPropagation(); useSelectionStore.getState().clear(); useRouteStore.getState().clear(); useSvStore.getState().closePanel(); open(info); }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      <mesh position={[0, 0.075, 0]} material={baseMat}><boxGeometry args={[0.3, 0.15, 0.3]} /></mesh>
      <mesh position={[0, 0.75, 0]} castShadow material={postMat}><boxGeometry args={[0.1, 1.2, 0.1]} /></mesh>
      <mesh position={[0, 1.15, 0.02]} material={reflMat}><boxGeometry args={[0.11, 0.1, 0.11]} /></mesh>
      {/* angled head plate (tilted back 20°) */}
      <group position={[0, 1.4, 0.04]} rotation={[-0.35, 0, 0]}>
        <mesh material={postMat}><boxGeometry args={[0.45, 0.35, 0.02]} /></mesh>
        <LogoDecal position={[0, 0.12, 0.02]} width={0.28} backing={false} />
        <SignPlane text="GAS PIPELINE" width={0.4} position={[0, 0.01, 0.02]} options={{ fg: '#16202b', fontWeight: 800 }} />
        <SignPlane text="DO NOT DIG" width={0.42} position={[0, -0.08, 0.02]} options={{ fg: '#c01a1a', fontWeight: 800 }} />
        <SignPlane text="⚠ 1800-266-0777" width={0.4} position={[0, -0.15, 0.02]} options={{ fg: '#16202b', fontWeight: 600 }} />
        {/* direction arrow */}
        <SignPlane text="↕" width={0.08} position={[0.18, 0.1, 0.02]} options={{ fg: '#16202b', fontWeight: 800 }} />
      </group>
    </group>
  );
}

export function RouteMarkers() {
  const markers = useMemo(() => {
    const list: { pos: [number, number, number]; info: MarkerInfo }[] = [];
    // Route edges (skip the far transmission edge); a marker at every vertex (bend).
    const routeEdges = NETWORK.edges.filter((e) => ['e-primary', 'e-secondary-1', 'e-secondary-2', 'e-cng-spur', 'e-png-main'].includes(e.id));
    let idx = 40;
    let chain = 2.0;
    for (const e of routeEdges) {
      const mdpe = e.network === 'png';
      const pts = e.points;
      for (let i = 0; i < pts.length; i++) {
        // interval markers + every bend; skip the shared endpoints to reduce clutter
        if (i > 0 && i < pts.length - 1 && i % 1 !== 0) continue;
        const p = pts[i];
        const nxt = pts[Math.min(i + 1, pts.length - 1)];
        const dir = Math.abs(nxt[0] - p[0]) > Math.abs(nxt[2] - p[2]) ? (nxt[0] > p[0] ? 'E → W' : 'W → E') : (nxt[2] > p[2] ? 'N → S' : 'S → N');
        // nearest SV
        let best = SV_STATIONS[0]; let bd = Infinity;
        for (const sv of SV_STATIONS) { const d = (sv.position[0] - p[0]) ** 2 + (sv.position[2] - p[2]) ** 2; if (d < bd) { bd = d; best = sv; } }
        list.push({
          pos: [p[0] + 1.2, 0, p[2] + 1.2],
          info: {
            id: `RM-${idx}`,
            pipeline: mdpe ? 'MDPE Tertiary — PL-04' : 'Primary Distribution — PL-02',
            material: mdpe ? 'MDPE PE100, DN180' : 'Carbon Steel, DN300',
            depth: mdpe ? '0.9 m' : '1.2 m',
            chainageKm: +chain.toFixed(1),
            pressure: mdpe ? '0.1 Bar' : '18 Bar',
            direction: dir,
            nearestSv: `${best.id} (${(Math.sqrt(bd) / 100).toFixed(1)} km)`,
          },
        });
        idx += 1; chain += 0.4;
      }
    }
    return list;
  }, []);

  return (
    <group>
      {markers.map((m) => <RouteMarker key={m.info.id} pos={m.pos} info={m.info} />)}

      {/* Road-crossing markings: yellow "GAS" line + cast plate at a few crossings */}
      {([[45, -67.5], [-22.5, -13], [-50, 0]] as const).map((c, i) => (
        <group key={i} position={[c[0], 0, c[1]]}>
          <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} material={paintedMetal('#e6b422', 970 + i)}><planeGeometry args={[0.4, 6]} /></mesh>
          <SignPlane text="GAS" width={1.2} position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} options={{ fg: '#16202b', fontWeight: 800, letterSpacing: 3 }} />
          <mesh position={[1.2, 0.06, 3]} rotation={[-Math.PI / 2, 0, 0]} material={steel({ color: '#3a4048', roughness: 0.7, seed: 973 + i })}><planeGeometry args={[0.5, 0.5]} /></mesh>
        </group>
      ))}

      {/* Buried valve-chamber covers near the MDPE (PNG west) route */}
      {([[-58, 34], [-64, 40]] as const).map((c, i) => (
        <group key={i} position={[c[0], 0.06, c[1]]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} material={steel({ color: '#4a4f56', roughness: 0.6, metalness: 0.7, seed: 976 + i })}><planeGeometry args={[0.5, 0.5]} /></mesh>
          <SignPlane text="GAS" width={0.3} position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} options={{ fg: '#16202b', fontWeight: 800 }} />
        </group>
      ))}

      {/* Trench cutaway showpiece (pipe bedding + warning tape) beside a road */}
      <group position={[30, 0, -60]}>
        <mesh position={[0, -0.35, 0]} material={concrete('#6b6559', 980)}><boxGeometry args={[3, 0.9, 1.4]} /></mesh>
        {/* sand bedding */}
        <mesh position={[0, -0.55, 0]} material={paintedMetal('#d9c9a3', 981)}><boxGeometry args={[2.9, 0.25, 1.3]} /></mesh>
        {/* pipe in the trench */}
        <mesh position={[0, -0.4, 0]} rotation={[0, 0, Math.PI / 2]} material={steel({ color: '#8a9199', seed: 982 })}><cylinderGeometry args={[0.18, 0.18, 3, 16]} /></mesh>
        {/* yellow warning tape above pipe */}
        <mesh position={[0, -0.1, 0]} material={paintedMetal('#f5c400', 983)}><boxGeometry args={[2.9, 0.02, 0.15]} /></mesh>
        <SignPlane text="CAUTION — GAS PIPELINE BELOW" width={2.6} position={[0, -0.09, 0.08]} options={{ fg: '#16202b', fontWeight: 700 }} />
      </group>
    </group>
  );
}
