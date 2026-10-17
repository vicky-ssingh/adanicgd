import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { TruckTractor } from './TruckTractor';
import { CascadeTrailerUnit } from './CascadeTrailerUnit';
import { useTrailerStore } from '@/state/useTrailerStore';
import { useTrailerInfoStore } from '@/state/useTrailerInfoStore';
import { useSimStore } from '@/state/useSimStore';
import { useViewStore } from '@/state/useViewStore';
import { useSelectionStore } from '@/state/useSelectionStore';
import { useRouteStore } from '@/state/useRouteStore';
import { useStationInfoStore } from '@/state/useStationInfoStore';
import { useMotherInfoStore } from '@/state/useMotherInfoStore';
import { useDaughterInfoStore } from '@/state/useDaughterInfoStore';
import { TRAILER_CURVE, DAUGHTER_POINT } from '@/config/trailerRoute';
import { steel, paintedMetal, emissive } from '@/materials/materials';

/** Ticks the fleet journey, gated by the global sim play/pause + speed. */
function FleetRunner() {
  useFrame((_, delta) => {
    const sim = useSimStore.getState();
    if (!sim.playing) return;
    useTrailerStore.getState().tick(Math.min(delta, 0.05) * sim.speed);
  });
  return null;
}

/** Coiled air + electrical lines between tractor and trailer, shown when coupled. */
function AirLines({ index }: { index: number }) {
  const group = useRef<THREE.Group>(null);
  const airMat = useMemo(() => steel({ color: '#20252b', roughness: 0.8, metalness: 0.2, seed: 720 }), []);
  const elecMat = useMemo(() => steel({ color: '#b23a3a', roughness: 0.7, metalness: 0.2, seed: 721 }), []);
  useFrame(() => {
    const snap = useTrailerStore.getState().snapshots()[index];
    if (!snap || !group.current) return;
    group.current.visible = snap.coupled;
    group.current.position.set(snap.trailer.pos[0], 0, snap.trailer.pos[2]);
    group.current.rotation.y = snap.trailer.rot;
  });
  const coil = (z: number, mat: THREE.Material) => (
    <group position={[0.6, 1.5, z]}>
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[0.12 * i - 0.3, 0.05 * Math.sin(i), 0]} rotation={[0, 0, Math.PI / 2]} material={mat}>
          <torusGeometry args={[0.08, 0.02, 6, 12]} />
        </mesh>
      ))}
    </group>
  );
  return (
    <group ref={group}>
      {coil(0.25, airMat)}
      {coil(-0.25, elecMat)}
    </group>
  );
}

/** Minimal discharge point at the Daughter drop-off: earthing lamp + hoses, shown
 * while a trailer is discharging there (Stage 5). Gas particles flow OUT to it. */
function DischargeVisual() {
  const lamp = useRef<THREE.Group>(null);
  const hoses = useRef<THREE.Group>(null);
  const parts = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const greenMat = useMemo(() => emissive('#39d98a', 1.4), []);
  const redMat = useMemo(() => emissive('#d94f4f', 1.2), []);
  const panelMat = useMemo(() => steel({ color: '#c7ccd1', roughness: 0.35, metalness: 0.85, seed: 722 }), []);
  const tvals = useMemo(() => Float32Array.from({ length: 18 }, (_, i) => i / 18), []);

  useFrame((_, delta) => {
    const snaps = useTrailerStore.getState().snapshots();
    const dis = snaps.find((s) => s.status === 'DISCHARGING');
    const active = !!dis;
    greenMat.emissiveIntensity = active ? 1.6 : 0.05;
    redMat.emissiveIntensity = active ? 0.05 : 1.2;
    if (hoses.current) hoses.current.visible = active;
    if (parts.current) {
      parts.current.visible = active;
      if (active) {
        const dt = Math.min(delta, 0.05) * useSimStore.getState().speed;
        for (let i = 0; i < 18; i++) {
          let t = tvals[i] - dt * 0.4; // flowing OUT (toward panel)
          if (t < 0) t += 1;
          tvals[i] = t;
          const x = -70.5 + t * -4.5;
          dummy.position.set(x, 1.4, 21);
          dummy.scale.setScalar(0.18);
          dummy.updateMatrix();
          parts.current.setMatrixAt(i, dummy.matrix);
        }
        parts.current.instanceMatrix.needsUpdate = true;
      }
    }
  });

  return (
    <group position={[DAUGHTER_POINT.x - 3, 0, DAUGHTER_POINT.z]}>
      {/* discharge skid + guide markings */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} material={paintedMetal('#b4b1a8', 723)}>
        <planeGeometry args={[8, 6]} />
      </mesh>
      <mesh position={[0, 1.0, 0]} castShadow material={panelMat}>
        <boxGeometry args={[0.5, 2.0, 1.6]} />
      </mesh>
      <group ref={lamp}>
        <mesh position={[0.3, 1.7, 0.4]} material={greenMat}><cylinderGeometry args={[0.06, 0.06, 0.03, 12]} /></mesh>
        <mesh position={[0.3, 1.55, 0.4]} material={redMat}><cylinderGeometry args={[0.06, 0.06, 0.03, 12]} /></mesh>
      </group>
      {/* earthing + hoses toward the parked trailer (east) */}
      <group ref={hoses} visible={false}>
        {[-0.5, 0, 0.5].map((z, i) => (
          <mesh key={i} position={[1.6, 1.3, z]} rotation={[0, 0, Math.PI / 2]} material={steel({ color: '#15181c', roughness: 0.85, metalness: 0.1, seed: 724 + i })}>
            <cylinderGeometry args={[0.04, 0.04, 3.0, 8]} />
          </mesh>
        ))}
      </group>
      <instancedMesh ref={parts} args={[undefined, undefined, 18]} frustumCulled={false}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color="#14b8a6" toneMapped={false} transparent opacity={0.95} />
      </instancedMesh>
    </group>
  );
}

/** Dashed animated route line, shown when a trailer is selected or followed. */
function RoutePath() {
  const tubeRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const geom = useMemo(() => new THREE.TubeGeometry(TRAILER_CURVE, 120, 0.35, 8, false), []);
  useFrame((state) => {
    const show = useTrailerStore.getState().followId !== null || useTrailerInfoStore.getState().id !== null;
    if (tubeRef.current) tubeRef.current.visible = show;
    if (matRef.current) matRef.current.opacity = 0.35 + Math.sin(state.clock.elapsedTime * 4) * 0.25;
  });
  return (
    <mesh ref={tubeRef} geometry={geom} visible={false} position={[0, 0.4, 0]}>
      <meshBasicMaterial ref={matRef} color="#3ff0d6" transparent opacity={0.4} toneMapped={false} depthWrite={false} />
    </mesh>
  );
}

/** Follow camera: when a trailer is followed, chase it along the route. */
function FollowCam() {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as { target: THREE.Vector3; update: () => void } | null;
  const tmp = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const followId = useTrailerStore.getState().followId;
    if (!followId || !controls) return;
    const snaps = useTrailerStore.getState().snapshots();
    const s = snaps.find((x) => x.id === followId);
    if (!s) return;
    const p = s.tractor;
    const behind = 14, up = 9;
    tmp.set(p.pos[0] - Math.sin(p.rot) * behind, up, p.pos[2] - Math.cos(p.rot) * behind);
    camera.position.lerp(tmp, 0.08);
    controls.target.lerp(new THREE.Vector3(p.pos[0], 2, p.pos[2]), 0.12);
    controls.update();
  });
  return null;
}

/**
 * Section 03 — mobile cascade-trailer fleet. Mounts 3 self-driving rigs at
 * different journey stages, their coupled air/electrical lines, the Daughter
 * discharge visual, the highlighted route path and the follow camera. Only shows
 * in CNG / BOTH modes (matches the CNG network toggle).
 */
export function TrailerFleet() {
  const mode = useViewStore((s) => s.mode);
  const open = useTrailerInfoStore((s) => s.open);
  const fleet = useTrailerStore((s) => s.fleet);
  const visible = mode === 'CNG' || mode === 'BOTH';

  const selectTrailer = (id: string) => {
    useSelectionStore.getState().clear();
    useRouteStore.getState().clear();
    useStationInfoStore.getState().close();
    useMotherInfoStore.getState().close();
    useDaughterInfoStore.getState().close();
    open(id);
  };

  return (
    <group visible={visible}>
      <FleetRunner />
      {fleet.map((t, i) => (
        <group key={t.id}>
          <TruckTractor index={i} />
          <CascadeTrailerUnit index={i} id={t.id} onSelect={() => selectTrailer(t.id)} />
          <AirLines index={i} />
        </group>
      ))}
      <DischargeVisual />
      <RoutePath />
      <FollowCam />
    </group>
  );
}
