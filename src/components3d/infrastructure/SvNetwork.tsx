import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { SvStation } from './SvStation';
import { SV_STATIONS } from '@/config/svStations';
import { useSvStore, svHighlightEdges } from '@/state/useSvStore';
import { NETWORK } from '@/config/network';

/** Advances SV valve animations (real-time, independent of sim speed). */
function SvRunner() {
  useFrame((_, delta) => useSvStore.getState().tick(Math.min(delta, 0.05)));
  return null;
}

/**
 * Highlights the pipeline section controlled by the hovered / open SV station in
 * a distinct amber so the operator sees the isolation extent before acting. A
 * tube is pre-built per edge and simply toggled — cheap.
 */
function SectionHighlight() {
  const meshes = useRef<Record<string, THREE.Mesh>>({});
  const mat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#ffae3c', transparent: true, opacity: 0.6, toneMapped: false, depthWrite: false }),
    [],
  );
  const tubes = useMemo(
    () =>
      NETWORK.edges.map((e) => {
        const curve = new THREE.CatmullRomCurve3(e.points.map((p) => new THREE.Vector3(p[0], Math.max(p[1], 0.35), p[2])), false, 'catmullrom', 0);
        const geom = new THREE.TubeGeometry(curve, Math.max(16, e.points.length * 10), 0.45, 8, false);
        return { id: e.id, geom };
      }),
    [],
  );
  useFrame((state) => {
    const set = new Set(svHighlightEdges());
    tubes.forEach((t) => { const m = meshes.current[t.id]; if (m) m.visible = set.has(t.id); });
    mat.opacity = 0.4 + Math.sin(state.clock.elapsedTime * 4) * 0.25;
  });
  return (
    <group>
      {tubes.map((t) => (
        <mesh key={t.id} geometry={t.geom} material={mat} visible={false} ref={(m) => { if (m) meshes.current[t.id] = m; }} />
      ))}
    </group>
  );
}

/**
 * Section 07 Part A placement — 4 SV stations along the main pipeline route plus
 * the controlled-section highlight overlay. Additive: it does not modify the
 * existing pipeline geometry or scenario logic (closing a valve TRIGGERS the
 * existing "Pipeline Isolation" scenario via useSvStore).
 */
export function SvNetwork() {
  return (
    <group>
      <SvRunner />
      <SectionHighlight />
      {SV_STATIONS.map((def) => (
        <SvStation key={def.id} def={def} />
      ))}
    </group>
  );
}
