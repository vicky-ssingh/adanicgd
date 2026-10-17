import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { NETWORK } from '@/config/network';
import { TIER_STYLE, type PipeTier } from '@/components3d/infrastructure/PipelineNetwork';
import { useSimStore } from '@/state/useSimStore';
import { useViewStore } from '@/state/useViewStore';
import { useSelectionStore } from '@/state/useSelectionStore';
import { useRouteStore } from '@/state/useRouteStore';
import { useXrayStore } from '@/state/useXrayStore';
import type { NetEdge } from '@/types/network';

/**
 * Section 12 §A — gas-flow particles now travel INSIDE the pipe bore: on the
 * centreline with a small random radial offset (≤ 0.55 × inner radius), each
 * particle smaller than the pipe containing it (≤ 0.25 × inner radius), and no
 * emissive glow. Because the default steel pipe is opaque, the particles are only
 * shown when the "Show Internal Flow" (X-ray) inspection mode is enabled — the
 * honest engineering-cutaway approach. Flow direction / speed logic is unchanged.
 */
const WORLD_SPEED = 4.6;
const BASE_R = 0.06; // base sphere radius; scaled per edge to fit the bore

export function flowColorFor(e: Pick<NetEdge, 'network' | 'consumer'>): string {
  if (e.consumer === 'industrial') return '#ff9500';
  if (e.consumer === 'commercial') return '#b066ff';
  if (e.consumer === 'residential') return '#4db8ff';
  if (e.network === 'cng') return '#14e0c8';
  if (e.network === 'png') return '#4db8ff';
  return '#7fb4ff';
}

function countForTier(tier: PipeTier, length: number): number {
  if (tier === 'transmission' || tier === 'primary') return Math.max(4, Math.round(length / 3.0));
  if (tier === 'secondary') return Math.max(3, Math.round(length / 3.4));
  return Math.max(3, Math.round(length / 3.8));
}

interface Head {
  a: number; // radial angle
  rr: number; // radial offset magnitude (world units)
}
interface EdgeRuntime {
  curve: THREE.CatmullRomCurve3;
  length: number;
  toId: string;
  fromId: string;
  edgeId: string;
  color: THREE.Color;
  size: number; // particle world radius (≤ 0.25 × inner radius)
  heads: Head[];
  start: number;
}

export function FlowParticles() {
  const mode = useViewStore((s) => s.mode);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const nrm = useMemo(() => new THREE.Vector3(), []);
  const upv = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  const { edges, total } = useMemo(() => {
    const visible = NETWORK.edges.filter((e) => {
      if (e.network === 'cng') return mode === 'CNG' || mode === 'BOTH';
      if (e.network === 'png') return mode === 'PNG' || mode === 'BOTH';
      return true;
    });
    let cursor = 0;
    const runtime: EdgeRuntime[] = visible.map((e) => {
      const curve = new THREE.CatmullRomCurve3(e.points.map((p) => new THREE.Vector3(...p)), false, 'catmullrom', 0);
      const length = curve.getLength();
      const n = countForTier(e.tier, length);
      const radius = TIER_STYLE[e.tier].radius;
      const inner = radius * 0.82; // bore
      const heads: Head[] = [];
      for (let i = 0; i < n; i++) heads.push({ a: Math.random() * Math.PI * 2, rr: Math.sqrt(Math.random()) * inner * 0.55 });
      const rt: EdgeRuntime = {
        curve, length, toId: e.to, fromId: e.from, edgeId: e.id,
        color: new THREE.Color(flowColorFor(e)).multiplyScalar(1.25),
        size: Math.min(inner * 0.25, 0.09),
        heads, start: cursor,
      };
      cursor += n;
      return rt;
    });
    return { edges: runtime, total: cursor };
  }, [mode]);

  const tvals = useMemo(() => {
    const arr = new Float32Array(total);
    edges.forEach((e) => e.heads.forEach((_, i) => { arr[e.start + i] = i / e.heads.length; }));
    return arr;
  }, [edges, total]);

  const colorArray = useMemo(() => {
    const arr = new Float32Array(total * 3);
    edges.forEach((e) => e.heads.forEach((_, i) => {
      const idx = (e.start + i) * 3;
      arr[idx] = e.color.r; arr[idx + 1] = e.color.g; arr[idx + 2] = e.color.b;
    }));
    return arr;
  }, [edges, total]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const xray = useXrayStore.getState().on;
    mesh.visible = xray; // particles are only revealed in inspection mode
    if (!xray) return;

    const sim = useSimStore.getState();
    const route = useRouteStore.getState().edges;
    const selectedId = useSelectionStore.getState().selectedId;
    const dt = Math.min(delta, 0.05);
    const globalSpeed = sim.playing ? sim.speed : 0;

    for (const e of edges) {
      const load = sim.values[e.toId]?.load ?? 1;
      const flowSpeed = (WORLD_SPEED * Math.max(0.05, load) * globalSpeed) / e.length;
      let emphasis = 1;
      if (route) emphasis = route.has(e.edgeId) ? 1.5 : 0.6;
      else if (selectedId) emphasis = e.fromId === selectedId || e.toId === selectedId ? 1.5 : 0.7;
      const sc = e.size * emphasis / BASE_R;

      for (let i = 0; i < e.heads.length; i++) {
        const idx = e.start + i;
        let t = tvals[idx] + flowSpeed * dt;
        if (t > 1) t -= 1;
        tvals[idx] = t;
        const p = e.curve.getPointAt(t);
        const tan = e.curve.getTangentAt(t).normalize();
        // perpendicular basis to spread particles across the bore
        right.copy(tan).cross(upv);
        if (right.lengthSq() < 1e-4) right.set(1, 0, 0);
        right.normalize();
        nrm.copy(right).cross(tan).normalize();
        const h = e.heads[i];
        dummy.position.copy(p)
          .addScaledVector(right, Math.cos(h.a) * h.rr)
          .addScaledVector(nrm, Math.sin(h.a) * h.rr);
        dummy.scale.setScalar(sc);
        dummy.updateMatrix();
        mesh.setMatrixAt(idx, dummy.matrix);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  if (total === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, total]} frustumCulled={false} visible={false}>
      <sphereGeometry args={[BASE_R, 8, 8]} />
      <meshBasicMaterial toneMapped transparent opacity={0.95} />
      <instancedBufferAttribute attach="instanceColor" args={[colorArray, 3]} />
    </instancedMesh>
  );
}
