import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { concrete } from '@/materials/materials';
import { roughnessMap, normalMap } from '@/materials/proceduralTextures';
import { useRouteStore } from '@/state/useRouteStore';
import { useSelectionStore } from '@/state/useSelectionStore';
import { useSimStore } from '@/state/useSimStore';
import { useXrayStore } from '@/state/useXrayStore';

export type PipeTier = 'transmission' | 'primary' | 'secondary' | 'tertiary';

export interface PipeRoute {
  id?: string;
  points: [number, number, number][];
  tier: PipeTier;
  /** node ids either end drives selection emphasis */
  fromId?: string;
  toId?: string;
  /** steel body colour (tier default otherwise) */
  bodyColor?: string;
  /** identification-band + selection colour (network colour) */
  bandColor?: string;
  /** yellow MDPE plastic body (not steel) */
  mdpe?: boolean;
  seed?: number;
  /** legacy fields (ignored now that pipes no longer glow) */
  glowColor?: string;
  glowIntensity?: number;
}

/**
 * Section 12 §B.5 — realistic pipe diameters (1 unit = 1 m). Transmission DN600 →
 * 0.60 OD (r 0.30), primary DN300, secondary DN200, MDPE DN63. Radii are at the
 * generous end of realistic so the network still reads from the overview, but the
 * transmission pipe is now shoulder-height, not building-height.
 */
export const TIER_STYLE: Record<PipeTier, { radius: number; color: string }> = {
  transmission: { radius: 0.34, color: '#8a9099' },
  primary: { radius: 0.18, color: '#9ba3ab' },
  secondary: { radius: 0.11, color: '#9ba3ab' },
  tertiary: { radius: 0.06, color: '#f5c400' },
};

const YELLOW = '#f5c400';
const up = new THREE.Vector3(0, 1, 0);
const zAxis = new THREE.Vector3(0, 0, 1);

/** Sample a curve at ~`spacing` world units → ring/arrow placement frames. */
function sampleFrames(curve: THREE.CatmullRomCurve3, length: number, spacing: number, skipEnds = 0.04) {
  const out: { pos: THREE.Vector3; tan: THREE.Vector3; t: number }[] = [];
  const n = Math.max(1, Math.floor(length / spacing));
  for (let i = 1; i < n; i++) {
    const t = i / n;
    if (t < skipEnds || t > 1 - skipEnds) continue;
    out.push({ pos: curve.getPointAt(t), tan: curve.getTangentAt(t).normalize(), t });
  }
  return out;
}

/**
 * Pipeline hierarchy (Section 12 rewrite). Pipes are now OPAQUE PAINTED STEEL —
 * industrial grey with yellow identification bands, girth welds, painted flow
 * arrows, a subtle travelling surface sheen (not an emissive glow), pipe supports
 * and ground thrust blocks. MDPE service is yellow plastic (non-metallic). The
 * blue neon glow and the oversized tube are gone. Selection adds an emissive rim;
 * the "Show Internal Flow" toggle makes pipes semi-transparent. Routing/flow logic
 * is untouched — only the visual representation changes.
 */
export function PipelineNetwork({ routes }: { routes: PipeRoute[] }) {
  const supportMat = useMemo(() => concrete('#8d8980', 60), []);
  const plinthMat = useMemo(() => concrete('#b3afa6', 62), []);
  const weldMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#6d7379', metalness: 0.7, roughness: 0.6 }), []);
  const arrowMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f2f4f6', metalness: 0.1, roughness: 0.5 }), []);

  // Per-pipe live state we mutate each frame (opacity / emissive / band).
  const pipeRefs = useRef<{ mat: THREE.MeshStandardMaterial; band: THREE.Mesh[]; bandMat: THREE.MeshBasicMaterial; curve: THREE.CatmullRomCurve3; length: number; id?: string; fromId?: string; toId?: string; mdpe: boolean; phase: number[] }[]>([]);

  const built = useMemo(() => {
    pipeRefs.current = [];
    const rough = roughnessMap(30, 256, 0.55);
    const norm = normalMap(34, 256, 0.6);
    const idBands: { pos: THREE.Vector3; quat: THREE.Quaternion; color: THREE.Color; r: number }[] = [];
    const welds: { pos: THREE.Vector3; quat: THREE.Quaternion; r: number }[] = [];
    const arrows: { pos: THREE.Vector3; quat: THREE.Quaternion; s: number }[] = [];
    const thrusts: { pos: [number, number, number] }[] = [];

    const pipes = routes.map((r, i) => {
      const style = TIER_STYLE[r.tier];
      const radius = style.radius;
      const curve = new THREE.CatmullRomCurve3(r.points.map((p) => new THREE.Vector3(...p)), false, 'catmullrom', 0);
      const length = curve.getLength();
      const tubular = Math.max(20, r.points.length * 14);
      const geom = new THREE.TubeGeometry(curve, tubular, radius, r.mdpe ? 12 : 18, false);
      const mat = new THREE.MeshStandardMaterial({
        color: r.bodyColor ?? style.color,
        metalness: r.mdpe ? 0.0 : 0.75,
        roughness: r.mdpe ? 0.65 : 0.42,
        roughnessMap: rough,
        normalMap: norm,
        normalScale: new THREE.Vector2(r.mdpe ? 0.15 : 0.4, r.mdpe ? 0.15 : 0.4),
        envMapIntensity: r.mdpe ? 0.5 : 1.0,
        emissive: new THREE.Color(r.bandColor ?? '#000000'),
        emissiveIntensity: 0, // §B.1 — no glow by default
      });

      const bandColor = new THREE.Color(r.bandColor ?? YELLOW);

      // Identification bands every 15 u (network colour) — only on steel pipes;
      // MDPE is already fully yellow.
      if (!r.mdpe) {
        for (const f of sampleFrames(curve, length, 15)) {
          idBands.push({ pos: f.pos, quat: new THREE.Quaternion().setFromUnitVectors(zAxis, f.tan), color: bandColor.clone(), r: radius });
        }
      }
      // Girth welds every 12 u.
      for (const f of sampleFrames(curve, length, 12)) {
        welds.push({ pos: f.pos, quat: new THREE.Quaternion().setFromUnitVectors(zAxis, f.tan), r: radius });
      }
      // Painted flow arrows every ~9 u, on the pipe crown, pointing along flow.
      for (const f of sampleFrames(curve, length, 9)) {
        const q = new THREE.Quaternion().setFromUnitVectors(up, f.tan);
        arrows.push({ pos: f.pos.clone().addScaledVector(up, radius + 0.015), quat: q, s: Math.max(0.09, radius * 0.9) });
      }
      // Ground thrust block where the pipe crosses the ground plane.
      for (let k = 0; k < r.points.length - 1; k++) {
        const a = r.points[k][1], b = r.points[k + 1][1];
        if ((a < -0.1 && b >= -0.1) || (a >= -0.1 && b < -0.1)) {
          const p = curve.getPointAt(Math.min(1, (k + 0.5) / (r.points.length - 1)));
          thrusts.push({ pos: [p.x, 0.15, p.z] });
        }
      }

      // Travelling surface sheen band (2 short segments per pipe).
      const bandMat = new THREE.MeshBasicMaterial({ color: bandColor, transparent: true, opacity: 0.18, depthWrite: false, toneMapped: true });
      const bandGeom = new THREE.CylinderGeometry(radius + 0.012, radius + 0.012, 1.4, r.mdpe ? 12 : 18, 1, true);
      const bandMeshes = [new THREE.Mesh(bandGeom, bandMat), new THREE.Mesh(bandGeom, bandMat)];
      pipeRefs.current.push({ mat, band: bandMeshes, bandMat, curve, length, id: r.id, fromId: r.fromId, toId: r.toId, mdpe: !!r.mdpe, phase: [0, 0.5] });

      return { geom, mat, key: i, bandMeshes };
    });

    return { pipes, idBands, welds, arrows, thrusts };
  }, [routes]);

  // Above-ground saddle supports on concrete plinths.
  const supports = useMemo(() => {
    const out: { pos: [number, number, number]; h: number; r: number }[] = [];
    routes.forEach((r) => {
      if (r.tier === 'tertiary') return;
      const radius = TIER_STYLE[r.tier].radius;
      for (let i = 0; i < r.points.length - 1; i++) {
        const a = new THREE.Vector3(...r.points[i]);
        const b = new THREE.Vector3(...r.points[i + 1]);
        const seg = b.clone().sub(a);
        const len = seg.length();
        const n = Math.max(1, Math.floor(len / 8));
        for (let s = 0; s <= n; s++) {
          const p = a.clone().addScaledVector(seg, s / n);
          if (p.y > 0.2) out.push({ pos: [p.x, (p.y - radius) / 2, p.z], h: Math.max(0.1, p.y - radius), r: radius });
        }
      }
    });
    return out;
  }, [routes]);

  // Instanced band/weld/arrow matrices (static).
  const idBandInst = useRef<THREE.InstancedMesh>(null);
  const weldInst = useRef<THREE.InstancedMesh>(null);
  const arrowInst = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = new THREE.Object3D();
    const bandMesh = idBandInst.current, weldMesh = weldInst.current, arrowMesh = arrowInst.current;
    if (bandMesh) {
      built.idBands.forEach((b, i) => {
        m.position.copy(b.pos); m.quaternion.copy(b.quat); m.scale.setScalar(b.r + 0.02); m.updateMatrix();
        bandMesh.setMatrixAt(i, m.matrix); bandMesh.setColorAt(i, b.color);
      });
      bandMesh.instanceMatrix.needsUpdate = true; if (bandMesh.instanceColor) bandMesh.instanceColor.needsUpdate = true;
    }
    if (weldMesh) {
      built.welds.forEach((w, i) => { m.position.copy(w.pos); m.quaternion.copy(w.quat); m.scale.setScalar(w.r + 0.012); m.updateMatrix(); weldMesh.setMatrixAt(i, m.matrix); });
      weldMesh.instanceMatrix.needsUpdate = true;
    }
    if (arrowMesh) {
      built.arrows.forEach((a, i) => { m.position.copy(a.pos); m.quaternion.copy(a.quat); m.scale.setScalar(a.s); m.updateMatrix(); arrowMesh.setMatrixAt(i, m.matrix); });
      arrowMesh.instanceMatrix.needsUpdate = true;
    }
  }, [built]);

  useFrame(() => {
    const routeEdges = useRouteStore.getState().edges;
    const selectedId = useSelectionStore.getState().selectedId;
    const sim = useSimStore.getState();
    const xray = useXrayStore.getState().on;
    const anyFocus = !!routeEdges || !!selectedId;

    for (const p of pipeRefs.current) {
      const highlighted = routeEdges
        ? !!(p.id && routeEdges.has(p.id))
        : selectedId
          ? p.fromId === selectedId || p.toId === selectedId
          : true;

      // Opacity: X-ray semi-transparent (selected clearer); selection fades others.
      let opacity: number;
      if (xray) opacity = highlighted && anyFocus ? 0.25 : 0.35;
      else opacity = anyFocus && !highlighted ? 0.25 : 1.0;
      p.mat.opacity = opacity;
      p.mat.transparent = opacity < 1;
      p.mat.depthWrite = opacity >= 0.999;
      // Emissive rim only on the selected pipe (never a default glow).
      p.mat.emissiveIntensity = !routeEdges && selectedId && highlighted ? 0.4 : 0;

      // Travelling surface sheen — speed follows live downstream load; stops on
      // isolated/paused sections (§D.2). Brighter + faster on the selected pipe.
      const load = sim.values[p.toId ?? '']?.load ?? 1;
      const moving = sim.playing && load > 0.06;
      const speed = (moving ? (0.11 * Math.max(0.1, load) * sim.speed) / Math.max(1, p.length) : 0);
      const bandVisible = !xray && (!anyFocus || highlighted);
      p.bandMat.opacity = highlighted && anyFocus ? 0.42 : 0.18;
      p.band.forEach((mesh, bi) => {
        mesh.visible = bandVisible && load > 0.06;
        if (!mesh.visible) return;
        p.phase[bi] = (p.phase[bi] + speed * (highlighted && anyFocus ? 1.6 : 1)) % 1;
        const t = p.phase[bi];
        const pos = p.curve.getPointAt(t);
        const tan = p.curve.getTangentAt(t).normalize();
        mesh.position.copy(pos);
        mesh.quaternion.setFromUnitVectors(up, tan); // cylinder axis → tangent
      });
    }
  });

  return (
    <group>
      {built.pipes.map((b) => (
        <group key={b.key}>
          <mesh geometry={b.geom} material={b.mat} castShadow receiveShadow />
          {b.bandMeshes.map((mesh, i) => (
            <primitive key={i} object={mesh} />
          ))}
        </group>
      ))}

      {/* identification bands (network colour) */}
      <instancedMesh ref={idBandInst} args={[undefined, undefined, Math.max(1, built.idBands.length)]} frustumCulled={false}>
        <torusGeometry args={[1, 0.16, 8, 20]} />
        <meshStandardMaterial metalness={0.4} roughness={0.5} vertexColors={false} />
      </instancedMesh>
      {/* girth welds */}
      <instancedMesh ref={weldInst} args={[undefined, undefined, Math.max(1, built.welds.length)]} frustumCulled={false} material={weldMat}>
        <torusGeometry args={[1, 0.09, 6, 16]} />
      </instancedMesh>
      {/* painted flow arrows (chevrons on the crown) */}
      <instancedMesh ref={arrowInst} args={[undefined, undefined, Math.max(1, built.arrows.length)]} frustumCulled={false} material={arrowMat}>
        <coneGeometry args={[0.5, 1.1, 4]} />
      </instancedMesh>

      {/* saddle supports on concrete plinths */}
      {supports.map((s, i) => (
        <group key={`s${i}`}>
          <mesh position={[s.pos[0], s.pos[1], s.pos[2]]} castShadow receiveShadow material={supportMat}>
            <boxGeometry args={[0.28, s.h, 0.28]} />
          </mesh>
          <mesh position={[s.pos[0], 0.05, s.pos[2]]} receiveShadow material={plinthMat}>
            <boxGeometry args={[0.5, 0.1, 0.5]} />
          </mesh>
        </group>
      ))}

      {/* ground thrust blocks / casing at pipe-to-ground transitions */}
      {built.thrusts.map((t, i) => (
        <mesh key={`t${i}`} position={t.pos} receiveShadow material={plinthMat}>
          <boxGeometry args={[0.7, 0.3, 0.7]} />
        </mesh>
      ))}
    </group>
  );
}
