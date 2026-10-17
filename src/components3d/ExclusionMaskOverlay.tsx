import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { TRAILER_CURVE } from '@/config/trailerRoute';
import { GRID, roadCenter } from '@/config/cityLayout';
import { useDebugStore } from '@/state/useDebugStore';

/**
 * Section 16 §A.5 — visualises the placement exclusion mask (road carriageways +
 * buffer, the trailer route corridor, and station keep-outs) as a flat translucent
 * overlay. Toggle with the "M" key. Debug aid only; hidden by default.
 */
const roadMat = new THREE.MeshBasicMaterial({ color: '#ff5a5a', transparent: true, opacity: 0.12, depthWrite: false });
const routeMat = new THREE.MeshBasicMaterial({ color: '#5aa0ff', transparent: true, opacity: 0.2, depthWrite: false });
const stationMat = new THREE.MeshBasicMaterial({ color: '#ffd15a', transparent: true, opacity: 0.14, depthWrite: false });

const STATIONS: [number, number, number][] = [
  [45, -60, 8], [0, -15, 8], [-48, 15, 8], [90, -90, 22], [90, 90, 20],
  [40, -150, 24], [130, 40, 16], [-150, 20, 16],
];

export function ExclusionMaskOverlay() {
  const show = useDebugStore((s) => s.showMask);
  const toggle = useDebugStore((s) => s.toggleMask);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key.toLowerCase() === 'm' && !e.metaKey && !e.ctrlKey) toggle(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle]);

  const routeGeom = useMemo(() => new THREE.TubeGeometry(TRAILER_CURVE, 160, 7.5, 4, false), []);
  const centres = useMemo(() => Array.from({ length: GRID.N + 1 }, (_, i) => roadCenter(i)), []);
  const span = (GRID.N + 1) * (GRID.BLOCK + GRID.ROAD);

  if (!show) return null;
  return (
    <group position={[0, 0.05, 0]}>
      {/* road carriageway + buffer bands (both axes) */}
      {centres.map((c, i) => (
        <group key={i}>
          <mesh position={[0, 0, c]} rotation={[-Math.PI / 2, 0, 0]} material={roadMat}><planeGeometry args={[span, 14]} /></mesh>
          <mesh position={[c, 0, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} material={roadMat}><planeGeometry args={[span, 14]} /></mesh>
        </group>
      ))}
      {/* trailer route corridor */}
      <mesh geometry={routeGeom} material={routeMat} />
      {/* station keep-outs */}
      {STATIONS.map((s, i) => (
        <mesh key={i} position={[s[0], 0, s[2]]} rotation={[-Math.PI / 2, 0, 0]} material={stationMat}><circleGeometry args={[s[2], 24]} /></mesh>
      ))}
    </group>
  );
}
