import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Selectable } from '@/components3d/Selectable';
import { SignPlane } from '@/components3d/branding/Branding';
import { PipeRun } from '@/components3d/primitives/Pipe';
import { Gauge } from '@/components3d/primitives/Fittings';
import { concrete, steel, paintedMetal, glass } from '@/materials/materials';
import { useValveStore, isolatedLines } from '@/state/useValveStore';
import type { ServiceLine } from '@/config/lineValves';
import { BRAND } from '@/theme/tokens';

/**
 * PNG last-mile modules from the 2D reference that the 3D twin lacked:
 * domestic + commercial Service Regulators, the industrial MRS skid with its
 * Electronic Volume Corrector, 4G AMR modems, and the Laboratory on a 0.5 bar
 * branch from the industrial tee. All sit on the existing consumer service
 * lines (which run along +Z at y 0.16); the operable ball valves around them
 * are LineValves. Each module is a Selectable network node.
 */
const GALV = new THREE.MeshStandardMaterial({ color: '#9aa1a8', metalness: 0.85, roughness: 0.45 });

/** Regulator body + domed spring housing, flow along local Z. */
function RegulatorBody({ s = 1 }: { s?: number }) {
  const bodyMat = useMemo(() => paintedMetal('#1f5f8b', 1840), []);
  const domeMat = useMemo(() => paintedMetal('#2a7ab0', 1841), []);
  return (
    <group scale={s}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow material={bodyMat}>
        <cylinderGeometry args={[0.12, 0.12, 0.42, 14]} />
      </mesh>
      <mesh position={[0, 0.17, 0]} castShadow material={bodyMat}>
        <cylinderGeometry args={[0.06, 0.08, 0.14, 10]} />
      </mesh>
      <mesh position={[0, 0.3, 0]} castShadow material={domeMat}>
        <sphereGeometry args={[0.2, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh position={[0, 0.3, 0]} material={domeMat}>
        <cylinderGeometry args={[0.2, 0.2, 0.03, 16]} />
      </mesh>
      {/* vent with rain cap */}
      <mesh position={[0.18, 0.42, 0]} material={GALV}>
        <cylinderGeometry args={[0.02, 0.02, 0.3, 6]} />
      </mesh>
      <mesh position={[0.18, 0.58, 0]} material={GALV}>
        <coneGeometry args={[0.05, 0.06, 8]} />
      </mesh>
    </group>
  );
}

/** 4G AMR modem: small IP65 box + whip antenna + blinking LED. */
export function AmrModem({ position = [0, 0, 0] as [number, number, number] }) {
  const boxMat = useMemo(() => paintedMetal('#e9e7e0', 1842), []);
  const led = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((state) => {
    if (led.current) led.current.emissiveIntensity = Math.sin(state.clock.elapsedTime * 5) > 0.6 ? 2.2 : 0.2;
  });
  return (
    <group position={position}>
      <mesh castShadow material={boxMat}>
        <boxGeometry args={[0.22, 0.28, 0.1]} />
      </mesh>
      <mesh position={[0.07, 0.3, 0]} material={GALV}>
        <cylinderGeometry args={[0.008, 0.012, 0.36, 6]} />
      </mesh>
      <mesh position={[-0.05, 0.08, 0.051]}>
        <sphereGeometry args={[0.018, 8, 6]} />
        <meshStandardMaterial ref={led} color="#22c55e" emissive="#22c55e" emissiveIntensity={1} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Pedestal service regulator on a plinth with a sunshade (straddles the line). */
function ServiceRegulator({ id, label, position, scale = 1 }: { id: string; label: string; position: [number, number, number]; scale?: number }) {
  const plinthMat = useMemo(() => concrete('#b1ada3', 1843), []);
  const hoodMat = useMemo(() => paintedMetal('#f2c200', 1844), []);
  return (
    <Selectable id={id} position={position} radius={1.4}>
      <group>
        <mesh position={[0, 0.12, 0]} receiveShadow material={plinthMat}>
          <boxGeometry args={[0.9, 0.24, 1.6]} />
        </mesh>
        {/* risers from the buried line up to the regulator and back down */}
        {[-0.55, 0.55].map((z) => (
          <mesh key={z} position={[0, 0.45, z]} material={GALV}>
            <cylinderGeometry args={[0.05 * scale, 0.05 * scale, 0.6, 8]} />
          </mesh>
        ))}
        <mesh position={[0, 0.75, 0]} rotation={[Math.PI / 2, 0, 0]} material={GALV}>
          <cylinderGeometry args={[0.05 * scale, 0.05 * scale, 1.1, 8]} />
        </mesh>
        <group position={[0, 0.75, 0]}>
          <RegulatorBody s={scale} />
        </group>
        <group position={[0.18, 0.9, 0.42]}><Gauge radius={0.08} seed={1845} /></group>
        {/* yellow sunshade hood on two posts */}
        {[-0.6, 0.6].map((z) => (
          <mesh key={z} position={[-0.38, 0.8, z]} material={GALV}>
            <boxGeometry args={[0.05, 1.4, 0.05]} />
          </mesh>
        ))}
        <mesh position={[0, 1.52, 0]} rotation={[0, 0, 0.12]} castShadow material={hoodMat}>
          <boxGeometry args={[0.95, 0.05, 1.5]} />
        </mesh>
        <SignPlane text={label} width={1.3} position={[-0.42, 1.2, 0]} rotation={[0, -Math.PI / 2, 0]} options={{ fg: '#ffffff', bg: BRAND.navy, fontWeight: 800 }} doubleSide />
      </group>
    </Selectable>
  );
}

/** Industrial Metering & Regulating Station skid + EVC / AMR pedestal. */
function MrsSkid() {
  const baseMat = useMemo(() => steel({ color: '#50575e', roughness: 0.6, seed: 1846 }), []);
  const filterMat = useMemo(() => paintedMetal('#6d7a85', 1847), []);
  const slamMat = useMemo(() => paintedMetal('#c01a1a', 1848), []);
  const meterMat = useMemo(() => paintedMetal('#2f6f9f', 1849), []);
  const evcMat = useMemo(() => paintedMetal('#dad7ce', 1850), []);
  const lcdMat = useMemo(() => glass('#1d3b52', 0.4), []);
  return (
    <>
      <Selectable id="mrs" position={[34, 0, 121.25]} radius={2.0}>
        <group>
          {/* skid frame across the line */}
          <mesh position={[0, 0.15, 0]} castShadow receiveShadow material={baseMat}>
            <boxGeometry args={[1.5, 0.3, 2.6]} />
          </mesh>
          {[-1.05, 1.05].map((z) => (
            <mesh key={z} position={[0, 0.5, z]} material={GALV}>
              <cylinderGeometry args={[0.09, 0.09, 0.5, 10]} />
            </mesh>
          ))}
          <mesh position={[0, 0.75, 0]} rotation={[Math.PI / 2, 0, 0]} material={GALV}>
            <cylinderGeometry args={[0.09, 0.09, 2.1, 10]} />
          </mesh>
          {/* filter → slam-shut → active/monitor regulator → turbine meter */}
          <mesh position={[0, 0.95, -0.75]} castShadow material={filterMat}>
            <cylinderGeometry args={[0.17, 0.17, 0.55, 14]} />
          </mesh>
          <mesh position={[0, 0.95, -0.3]} castShadow material={slamMat}>
            <boxGeometry args={[0.22, 0.26, 0.2]} />
          </mesh>
          <group position={[0, 0.75, 0.15]}><RegulatorBody s={1.2} /></group>
          <mesh position={[0, 0.75, 0.75]} rotation={[Math.PI / 2, 0, 0]} castShadow material={meterMat}>
            <cylinderGeometry args={[0.16, 0.16, 0.35, 16]} />
          </mesh>
          <mesh position={[0, 0.98, 0.75]} castShadow material={evcMat}>
            <boxGeometry args={[0.16, 0.14, 0.16]} />
          </mesh>
          <group position={[0.2, 1.1, -0.3]}><Gauge radius={0.08} seed={1851} /></group>
          <group position={[0.2, 1.1, 0.5]}><Gauge radius={0.08} seed={1852} /></group>
          <SignPlane text="MRS SKID · INDUSTRIAL" width={1.4} position={[0.77, 0.45, 0]} rotation={[0, Math.PI / 2, 0]} options={{ fg: '#ffffff', bg: BRAND.navy, fontWeight: 800 }} doubleSide />
        </group>
      </Selectable>

      {/* EVC + AMR pedestal beside the line, wired to the turbine meter */}
      <group position={[35.2, 0, 125.6]}>
        <mesh position={[0, 0.6, 0]} material={GALV}>
          <boxGeometry args={[0.08, 1.2, 0.08]} />
        </mesh>
        <mesh position={[0, 1.2, 0.08]} castShadow material={evcMat}>
          <boxGeometry args={[0.36, 0.44, 0.14]} />
        </mesh>
        <mesh position={[0, 1.28, 0.152]} material={lcdMat}>
          <boxGeometry args={[0.22, 0.12, 0.01]} />
        </mesh>
        <AmrModem position={[0, 1.62, 0.08]} />
        <SignPlane text="EVC · AMR" width={0.5} position={[0, 0.92, 0.16]} options={{ fg: '#ffffff', bg: BRAND.navy, fontWeight: 800 }} />
      </group>
    </>
  );
}

/** Quality-control laboratory on the 0.5 bar MDPE branch from the industrial tee. */
function Laboratory() {
  const wallMat = useMemo(() => paintedMetal('#f1efe9', 1860), []);
  const bandMat = useMemo(() => paintedMetal(BRAND.primary, 1861), []);
  const roofMat = useMemo(() => concrete('#9b978e', 1862), []);
  const winMat = useMemo(() => glass('#9fc4d8'), []);
  const stackMat = useMemo(() => steel({ color: '#b9bec3', seed: 1863 }), []);
  const meterMat = useMemo(() => paintedMetal('#d8d4c8', 1864), []);
  return (
    <Selectable id="laboratory" position={[50, 0, 126.6]} radius={3.4}>
      <group>
        <mesh position={[0, 1.5, 0]} castShadow receiveShadow material={wallMat}>
          <boxGeometry args={[5.2, 3.0, 4.2]} />
        </mesh>
        <mesh position={[0, 2.75, 0]} material={bandMat}>
          <boxGeometry args={[5.24, 0.3, 4.24]} />
        </mesh>
        <mesh position={[0, 3.06, 0]} castShadow material={roofMat}>
          <boxGeometry args={[5.5, 0.12, 4.5]} />
        </mesh>
        {/* windows on the long faces + door facing the road (-Z) */}
        {[-1.6, 0, 1.6].map((x) => (
          <mesh key={x} position={[x, 1.7, 2.11]} material={winMat}>
            <boxGeometry args={[1.1, 0.9, 0.04]} />
          </mesh>
        ))}
        {[-1.0, 1.4].map((x) => (
          <mesh key={x} position={[x, 1.7, -2.11]} material={winMat}>
            <boxGeometry args={[1.1, 0.9, 0.04]} />
          </mesh>
        ))}
        <mesh position={[0.2, 1.05, -2.12]} material={bandMat}>
          <boxGeometry args={[0.9, 2.0, 0.05]} />
        </mesh>
        {/* fume-cupboard extract stacks */}
        {[-1.4, -0.6].map((x) => (
          <mesh key={x} position={[x, 3.6, 1.0]} castShadow material={stackMat}>
            <cylinderGeometry args={[0.14, 0.14, 1.0, 12]} />
          </mesh>
        ))}
        {/* gas inlet: riser up the west wall into a small meter box */}
        <mesh position={[-3.0, 0.55, -1.6]} material={GALV}>
          <cylinderGeometry args={[0.04, 0.04, 0.9, 8]} />
        </mesh>
        <mesh position={[-2.75, 1.15, -1.6]} castShadow material={meterMat}>
          <boxGeometry args={[0.3, 0.4, 0.3]} />
        </mesh>
        <mesh position={[-2.75, 1.4, -1.6]} rotation={[0, 0, Math.PI / 2]} material={GALV}>
          <cylinderGeometry args={[0.03, 0.03, 0.5, 8]} />
        </mesh>
        <SignPlane text="QUALITY CONTROL LABORATORY" width={3.6} position={[0, 2.55, -2.13]} rotation={[0, Math.PI, 0]} options={{ fg: '#ffffff', bg: BRAND.navy, fontWeight: 800, letterSpacing: 1 }} />
      </group>
    </Selectable>
  );
}

/** Branch-line particles to the laboratory (stops when its supply is shut). */
function LabFlow() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const N = 5;
  const ts = useRef(Array.from({ length: N }, (_, i) => i / N));
  useFrame((_, dt) => {
    const m = ref.current;
    if (!m) return;
    const off = isolatedLines(useValveStore.getState().rt).has('laboratory' as ServiceLine);
    for (let i = 0; i < N; i++) {
      ts.current[i] = (ts.current[i] + dt * 0.12) % 1;
      const t = ts.current[i];
      dummy.position.set(34 + (46.9 - 34) * t, 0.2, 124.8);
      dummy.scale.setScalar(off ? 0.0001 : 1);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
      <sphereGeometry args={[0.08, 8, 8]} />
      <meshBasicMaterial color="#8fe3d6" toneMapped={false} />
    </instancedMesh>
  );
}

export function PngLastMile() {
  return (
    <group>
      <ServiceRegulator id="sr-dom" label="SERVICE REGULATOR" position={[-58, 0, 121]} />
      <ServiceRegulator id="sr-com" label="SERVICE REGULATOR" position={[-14, 0, 121.5]} scale={1.2} />
      {/* commercial meter AMR modem on a short post beside the line */}
      <group position={[-12.9, 0, 124.6]}>
        <mesh position={[0, 0.55, 0]} material={GALV}>
          <boxGeometry args={[0.06, 1.1, 0.06]} />
        </mesh>
        <AmrModem position={[0, 1.22, 0.06]} />
      </group>
      <MrsSkid />
      <Laboratory />
      {/* 0.5 bar MDPE branch: industrial tee → laboratory west wall */}
      <PipeRun points={[[34, 0.14, 124.8], [46.9, 0.14, 124.8], [47.0, 0.14, 125.0]]} radius={0.06} color="#f5c400" metalness={0.1} roughness={0.6} seed={1870} radialSegments={10} />
      <mesh position={[34, 0.16, 124.8]} material={GALV}>
        <sphereGeometry args={[0.24, 12, 10]} />
      </mesh>
      <LabFlow />
    </group>
  );
}
