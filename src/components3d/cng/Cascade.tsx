import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Pad } from '@/components3d/primitives/Structure';
import { Pipe, PipeRun } from '@/components3d/primitives/Pipe';
import { Valve, Gauge } from '@/components3d/primitives/Fittings';
import { steel, paintedMetal } from '@/materials/materials';
import { SignPlane } from '@/components3d/branding/Branding';
import { useStationStore, type BankId } from '@/state/useStationStore';

/**
 * Section 01 §3.3 — Cascade Storage (buffer). An open steel rack of 12 horizontal
 * HP cylinders in 3 colour-coded banks (HIGH / MEDIUM / LOW), each with domed
 * ends, neck bosses, retaining straps, a front manifold header fed by curved
 * pigtails + isolation valves, a per-bank gauge and relief vent, and a main
 * outlet header. Each bank's cylinders glow by live fill level; the active bank
 * (during a refuel) glows brightest. Buffer-sized — smaller than a mother station.
 */

const BANK_COLOR: Record<BankId, string> = { HIGH: '#14b8a6', MEDIUM: '#0e8b82', LOW: '#0a5f5a' };
const ROWS: BankId[] = ['LOW', 'MEDIUM', 'HIGH']; // bottom → top

export function Cascade() {
  const frameMat = useMemo(() => steel({ color: '#4f555c', roughness: 0.55, metalness: 0.85, seed: 160 }), []);
  const strapMat = useMemo(() => steel({ color: '#2b2f34', roughness: 0.6, metalness: 0.7, seed: 161 }), []);
  const padMat = useMemo(() => paintedMetal('#1c1f22', 162), []);
  const bossMat = useMemo(() => steel({ color: '#b8bdc4', roughness: 0.4, metalness: 0.9, seed: 163 }), []);
  const manifoldColor = '#b0b6bd';

  // One emissive-capable material per bank (mutated per-frame by fill level).
  const bankMats = useMemo(() => {
    const mk = (c: string) =>
      new THREE.MeshStandardMaterial({ color: c, emissive: new THREE.Color(c), emissiveIntensity: 0.4, roughness: 0.34, metalness: 0.85 });
    return { LOW: mk(BANK_COLOR.LOW), MEDIUM: mk(BANK_COLOR.MEDIUM), HIGH: mk(BANK_COLOR.HIGH) } as Record<BankId, THREE.MeshStandardMaterial>;
  }, []);

  const indicatorRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const { banks, activeBank, refueling, refillBank } = useStationStore.getState();
    const t = state.clock.elapsedTime;
    (Object.keys(bankMats) as BankId[]).forEach((b) => {
      const fill = Math.max(0, Math.min(1, banks[b] / 100)); // 0..1
      const active = refueling && activeBank === b;
      const filling = refillBank === b;
      // Section 05 §7.3 mapping: 0.05 (empty) → 0.55 (full), active +0.25,
      // filling bank slow pulse.
      let e = 0.05 + fill * 0.5;
      if (active) e += 0.25;
      if (filling) e += 0.15 + Math.sin(t * (Math.PI * 2 / 1.5)) * 0.12;
      bankMats[b].emissiveIntensity = e;
    });
    // Flow-direction indicator slides to the active (draw) or refill row.
    const ind = indicatorRef.current;
    if (ind) {
      const target = refueling && activeBank ? activeBank : refillBank;
      ind.visible = !!target;
      if (target) {
        const row = ROWS.indexOf(target);
        ind.position.y = THREE.MathUtils.lerp(ind.position.y, 0.25 + [0.55, 1.2, 1.85][row], 0.25);
      }
    }
  });

  const plinthH = 0.25;
  const W = 4.0;
  const Zlen = 1.7; // cylinder length (Z)
  const cols = [-1.35, -0.45, 0.45, 1.35];
  const rowY = [0.55, 1.15, 1.75];
  const cylR = 0.26;
  const frontZ = Zlen / 2; // cylinder front face
  const manZ = frontZ + 0.28; // manifold header offset in front
  const topY = rowY[2] + 0.5;

  return (
    <group>
      <Pad size={[W + 0.5, Zlen + manZ + 0.6]} height={plinthH} seed={164} />

      {/* rack uprights + base plates at each leg */}
      {([-W / 2, W / 2] as const).map((x) =>
        ([-Zlen / 2 + 0.1, Zlen / 2 - 0.1] as const).map((z) => (
          <group key={`${x}${z}`} position={[x, plinthH, z]}>
            <mesh position={[0, topY / 2, 0]} castShadow material={frameMat}>
              <boxGeometry args={[0.1, topY, 0.1]} />
            </mesh>
            <mesh position={[0, 0.02, 0]} material={frameMat}>
              <boxGeometry args={[0.24, 0.04, 0.24]} />
            </mesh>
          </group>
        )),
      )}
      {/* top + upper/lower cross rails, and back cross-bracing */}
      {[0.3, topY].map((y, i) => (
        <mesh key={i} position={[0, plinthH + y, 0]} castShadow material={frameMat}>
          <boxGeometry args={[W, 0.08, Zlen]} />
        </mesh>
      ))}
      {/* diagonal back braces */}
      {([-1, 1] as const).map((s) => (
        <mesh key={s} position={[s * W * 0.32, plinthH + topY / 2, -Zlen / 2 + 0.1]} rotation={[0, 0, s * 0.7]} material={frameMat}>
          <boxGeometry args={[0.06, topY * 1.3, 0.06]} />
        </mesh>
      ))}

      {/* cylinders, banks bottom→top */}
      {ROWS.map((bank, r) =>
        cols.map((x, c) => (
          <group key={`${bank}-${c}`} position={[x, plinthH + rowY[r], 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow material={bankMats[bank]}>
              <cylinderGeometry args={[cylR, cylR, Zlen, 20]} />
            </mesh>
            {/* domed ends */}
            <mesh position={[0, 0, Zlen / 2]} castShadow material={bankMats[bank]}>
              <sphereGeometry args={[cylR, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>
            <mesh position={[0, 0, -Zlen / 2]} rotation={[Math.PI, 0, 0]} castShadow material={bankMats[bank]}>
              <sphereGeometry args={[cylR, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>
            {/* neck boss (front) */}
            <mesh position={[0, 0, frontZ + 0.06]} rotation={[Math.PI / 2, 0, 0]} material={bossMat}>
              <cylinderGeometry args={[0.06, 0.06, 0.12, 10]} />
            </mesh>
            {/* retaining straps + saddle pads over the two cross rails */}
            {([-0.45, 0.45] as const).map((sz) => (
              <group key={sz}>
                <mesh position={[0, 0, sz]} rotation={[0, 0, Math.PI / 2]} material={strapMat}>
                  <torusGeometry args={[cylR + 0.02, 0.015, 6, 16, Math.PI]} />
                </mesh>
                <mesh position={[0, -cylR - 0.01, sz]} material={padMat}>
                  <boxGeometry args={[0.14, 0.04, 0.12]} />
                </mesh>
              </group>
            ))}
            {/* pigtail from neck to bank manifold (curved) */}
            <PipeRun
              points={[
                [0, 0, frontZ + 0.12],
                [0, -0.12, frontZ + 0.22],
                [0, -0.1, manZ],
              ]}
              radius={0.03}
              color="#8f969d"
              seed={165 + r * 4 + c}
              tension={0.5}
              radialSegments={8}
            />
            {/* tiny isolation valve on the pigtail */}
            <mesh position={[0, -0.02, frontZ + 0.19]} material={bossMat}>
              <sphereGeometry args={[0.05, 10, 8]} />
            </mesh>
          </group>
        )),
      )}

      {/* per-bank manifold header + gauge + relief vent + bank isolation valve + label */}
      {ROWS.map((bank, r) => (
        <group key={`man-${bank}`} position={[0, plinthH + rowY[r], manZ]}>
          <Pipe from={[-W / 2 + 0.2, 0, 0]} to={[W / 2 - 0.2, 0, 0]} radius={0.055} color={manifoldColor} seed={180 + r} />
          {/* bank gauge at the end */}
          <group position={[W / 2 - 0.1, 0.18, 0]} rotation={[Math.PI / 2, 0, 0]} scale={0.7}>
            <Gauge radius={0.14} seed={183 + r} />
          </group>
          {/* relief valve + short vent tube at manifold end */}
          <mesh position={[-W / 2 + 0.1, 0.35, 0]} material={bossMat}>
            <cylinderGeometry args={[0.03, 0.03, 0.5, 8]} />
          </mesh>
          {/* bank isolation valve where manifold joins the outlet header */}
          <group position={[W / 2 - 0.1, -0.02, 0]} scale={0.4}>
            <Valve size={0.28} color={BANK_COLOR[bank]} handwheel seed={186 + r} />
          </group>
          {/* painted band + stencilled bank label on the frame */}
          <SignPlane text={`${bank} BANK`} width={0.9} position={[-W / 2 + 0.7, 0, 0.06]} options={{ fg: '#ffffff', bg: BANK_COLOR[bank], fontWeight: 800, radius: 4, paddingX: 18, letterSpacing: 1 }} />
        </group>
      ))}

      {/* main outlet header dropping down toward the priority panel (+X end) */}
      <Pipe from={[W / 2 - 0.1, plinthH + rowY[0], manZ]} to={[W / 2 - 0.1, plinthH + rowY[2], manZ]} radius={0.06} color={manifoldColor} seed={190} />
      <Pipe from={[W / 2 - 0.1, plinthH + 0.5, manZ]} to={[W / 2 + 0.6, plinthH + 0.5, manZ]} radius={0.06} color={manifoldColor} seed={191} />

      {/* flow-direction indicator — slides to the active/refill bank (Section 05 §4/§7) */}
      <group ref={indicatorRef} position={[W / 2 + 0.28, plinthH + rowY[0], manZ]} visible={false}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[0.09, 0.2, 12]} />
          <meshBasicMaterial color="#3ff0d6" toneMapped={false} />
        </mesh>
      </group>

      {/* warning signage on the frame */}
      <SignPlane text="HIGH PRESSURE GAS — 250 BAR" width={1.8} position={[0, plinthH + topY + 0.2, manZ]} options={{ fg: '#7a1020', bg: '#f2d21e', fontWeight: 800, radius: 6, paddingX: 20 }} />

      {/* protective bollards on the vehicle-facing (+Z) side */}
      {[-1.4, 0, 1.4].map((x, i) => (
        <group key={i} position={[x, 0, manZ + 0.5]}>
          <mesh position={[0, 0.5, 0]} castShadow material={paintedMetal('#e6b422', 192 + i)}>
            <cylinderGeometry args={[0.08, 0.08, 1.0, 10]} />
          </mesh>
          <mesh position={[0, 0.62, 0]} material={strapMat}>
            <cylinderGeometry args={[0.085, 0.085, 0.16, 10]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
