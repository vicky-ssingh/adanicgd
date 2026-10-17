import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { EsdButton, EsdValve, Strobe } from './EsdKit';
import { GasDetector } from './GasDetector';
import { FireKit, FireWaterSystem, Hydrant, AssemblyPoint } from './FireEquipment';
import { TrUnit, CpTestPost } from './CpUnits';
import { FACILITIES, TR_UNITS, cpTestPosts, CP_MARGINAL_EDGE } from '@/config/safetyLayout';
import { NETWORK } from '@/config/network';
import { paintedMetal, emissive } from '@/materials/materials';
import { SignPlane, LogoDecal } from '@/components3d/branding/Branding';
import { useEsdStore } from '@/state/useEsdStore';
import { useGasStore } from '@/state/useGasStore';
import { useCpStore } from '@/state/useCpStore';
import { useSimStore } from '@/state/useSimStore';
import type { FacilityId } from '@/config/safetyLayout';

/** Ticks ESD trip/reset + gas-leak sequences (real-time; leak scaled by sim). */
function SafetyRunner() {
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    useEsdStore.getState().tick(dt);
    const sim = useSimStore.getState();
    // The "Gas Leak Detection" scenario auto-starts a leak.
    const g = useGasStore.getState();
    if (sim.scenario === 'gas-leak' && !g.active && !g.autoTripped) g.start('online-cng');
    if (sim.playing) useGasStore.getState().tick(dt * sim.speed);
  });
  return null;
}

/** Facility depressurisation vent plume during an ESD trip. */
function FacilityVent({ facilityId, pos }: { facilityId: FacilityId; pos: [number, number, number] }) {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#dfe7ec', transparent: true, opacity: 0, depthWrite: false }), []);
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    const ph = useEsdStore.getState().fac[facilityId].phase;
    // vent during depressurisation window (mid-trip)
    const k = ph > 0.3 && ph < 0.95 ? 1 : 0;
    mat.opacity = k * 0.5;
    if (g.current) { g.current.visible = k > 0; g.current.scale.setScalar(0.6 + ph * 1.6); }
  });
  return (
    <group ref={g} position={pos} visible={false}>
      <mesh material={mat}><sphereGeometry args={[0.4, 10, 10]} /></mesh>
      <mesh position={[0.2, 0.4, 0]} material={mat}><sphereGeometry args={[0.28, 10, 10]} /></mesh>
    </group>
  );
}

/** Wall-mounted gas-detection panel (control room). */
function GasPanel({ pos }: { pos: [number, number, number] }) {
  const cab = useMemo(() => paintedMetal('#2a2f35', 1180), []);
  const screen = useMemo(() => emissive('#0d1b1a', 0.6), []);
  return (
    <group position={pos}>
      <mesh material={cab}><boxGeometry args={[0.8, 0.6, 0.1]} /></mesh>
      <mesh position={[0, 0.1, 0.06]} material={screen}><boxGeometry args={[0.5, 0.18, 0.02]} /></mesh>
      <SignPlane text="GAS DETECTION" width={0.5} position={[0, 0.1, 0.072]} options={{ fg: '#8ef3d6', fontWeight: 700 }} />
      {/* LED grid */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[-0.28 + (i % 4) * 0.18, -0.12 - Math.floor(i / 4) * 0.12, 0.06]} material={emissive('#39d98a', 1.0)}><cylinderGeometry args={[0.02, 0.02, 0.01, 8]} /></mesh>
      ))}
      <LogoDecal position={[0.22, 0.24, 0.06]} width={0.28} backing backingColor="#ffffff" />
    </group>
  );
}

/** CP survey layer — colours steel pipeline by pipe-to-soil potential when on. */
function CpSurveyOverlay() {
  const meshes = useRef<Record<string, THREE.Mesh>>({});
  const steel = useMemo(() => NETWORK.edges.filter((e) => e.network === 'common' && e.render !== false), []);
  const tubes = useMemo(
    () =>
      steel.map((e) => {
        const curve = new THREE.CatmullRomCurve3(e.points.map((p) => new THREE.Vector3(p[0], Math.max(p[1], 0.4), p[2])), false, 'catmullrom', 0);
        const geom = new THREE.TubeGeometry(curve, Math.max(16, e.points.length * 10), 0.5, 8, false);
        const color = e.id === CP_MARGINAL_EDGE ? '#ffae3c' : '#39d98a';
        const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, toneMapped: false, depthWrite: false });
        return { id: e.id, geom, mat };
      }),
    [steel],
  );
  useFrame(() => {
    const on = useCpStore.getState().surveyOn;
    tubes.forEach((t) => { const m = meshes.current[t.id]; if (m) m.visible = on; });
  });
  return (
    <group>
      {tubes.map((t) => <mesh key={t.id} geometry={t.geom} material={t.mat} visible={false} ref={(m) => { if (m) meshes.current[t.id] = m; }} />)}
    </group>
  );
}

/**
 * Section 08 — the cross-facility safety layer, placed additively over the
 * existing scene: ESD buttons + valves + strobes + vents, gas + flame detectors +
 * detection panels, fire equipment, and cathodic-protection TR units + orange
 * test posts + the survey overlay.
 */
export function SafetySystems() {
  const testPosts = useMemo(() => cpTestPosts(), []);
  return (
    <group>
      <SafetyRunner />
      {FACILITIES.map((f) => (
        <group key={f.id}>
          <EsdValve facilityId={f.id} position={f.esdValve} rotation={f.rotation} />
          <Strobe facilityId={f.id} position={f.strobe} />
          <FacilityVent facilityId={f.id} pos={[f.strobe[0], f.strobe[1] - 1, f.strobe[2]]} />
          {f.esdButtons.map((b, i) => <EsdButton key={i} facilityId={f.id} position={[b[0], 0, b[1]]} rotation={f.rotation} />)}
          {f.detectors.map((d, i) => <GasDetector key={i} id={`GD-${f.id.slice(0, 2).toUpperCase()}${i + 1}`} facilityId={f.id} position={d} />)}
          {f.flame?.map((d, i) => <GasDetector key={`fl${i}`} id={`FD-${i + 1}`} facilityId={f.id} position={d} flame />)}
          {f.fire.map((a, i) => <FireKit key={i} anchor={a} big={i === 0} />)}
          <Hydrant p={f.hydrant} />
          <AssemblyPoint p={f.assembly} />
          <GasPanel pos={f.gasPanel} />
        </group>
      ))}
      <FireWaterSystem pos={[80, 0, -178]} />

      {TR_UNITS.map((t) => <TrUnit key={t.id} id={t.id} label={t.label} pos={t.pos} rotation={t.rotation} protectedKm={t.protectedKm} chainageKm={t.chainageKm} />)}
      {testPosts.map((t) => <CpTestPost key={t.id} id={t.id} pos={t.pos} chainageKm={t.chainageKm} />)}
      <CpSurveyOverlay />
    </group>
  );
}
