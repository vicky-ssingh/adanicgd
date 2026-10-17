import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Pad } from '@/components3d/primitives/Structure';
import { Pipe } from '@/components3d/primitives/Pipe';
import { Gauge } from '@/components3d/primitives/Fittings';
import { steel, paintedMetal, emissive } from '@/materials/materials';
import { BRAND } from '@/theme/tokens';
import { SignPlane, LogoDecal } from '@/components3d/branding/Branding';

/**
 * Section 01 §3.2 — Main Compressor Package. A containerised acoustic enclosure
 * (Adani-blue body, grey roof) on a concrete plinth: ventilation louvres, a
 * roof cooling fan that ROTATES when running, hinged access doors, an inspection
 * window, an exhaust stack, an after-cooler, a condensate vessel and a stainless
 * control panel with an e-stop. Subtly vibrates while running. Suction enters −X
 * (from the inlet skid); HP discharge leaves +X (toward the cascade).
 */
export function Compressor({
  running = true,
  standby = false,
  label = 'CNG COMPRESSOR — UNIT 01',
  intensity = 1,
  getIntensity,
}: {
  running?: boolean;
  standby?: boolean;
  label?: string;
  /** Load factor (Section 04 booster): scales fan speed + vibration as the
   *  cascade depletes. 1 = nominal. */
  intensity?: number;
  /** Live load factor — takes precedence over `intensity` when provided. */
  getIntensity?: () => number;
}) {
  const bodyMat = useMemo(() => paintedMetal(BRAND.primary, 120), []);
  const roofMat = useMemo(() => paintedMetal('#d5d8dc', 121), []);
  const frameMat = useMemo(() => steel({ color: '#4a4f56', roughness: 0.55, metalness: 0.85, seed: 122 }), []);
  const louvreMat = useMemo(() => steel({ color: '#1d2a33', roughness: 0.6, metalness: 0.6, seed: 123 }), []);
  const steelMat = useMemo(() => steel({ color: '#9aa1a8', seed: 124 }), []);
  const coolerMat = useMemo(() => steel({ color: '#6b7078', roughness: 0.6, seed: 125 }), []);
  const panelMat = useMemo(() => steel({ color: '#c7ccd1', roughness: 0.35, metalness: 0.85, seed: 126 }), []);
  const screenMat = useMemo(() => emissive(BRAND.tealCng, 1.1), []);
  // Own (non-cached) material so multiple compressor instances don't fight over
  // one shared emissive when pulsing their run lamps.
  const lampGreen = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#0a0a0a', emissive: new THREE.Color('#39d98a'), emissiveIntensity: 1.4, roughness: 0.5 }),
    [],
  );
  const lampAmber = useMemo(() => emissive('#e0a23c', 1.0), []);
  const lampRed = useMemo(() => emissive('#d94f4f', 1.0), []);
  const glassMat = useMemo(() => steel({ color: '#10161d', roughness: 0.15, metalness: 0.4, seed: 127 }), []);

  const W = 4.6; // along X
  const H = 2.2;
  const D = 2.6; // along Z
  const plinthH = 0.3;
  const skidH = 0.2;
  const baseY = plinthH + skidH; // enclosure floor

  const enclosureRef = useRef<THREE.Group>(null);
  const fanRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const k = getIntensity ? getIntensity() : intensity;
    if (fanRef.current && running) fanRef.current.rotation.y += delta * 9 * k;
    if (enclosureRef.current) {
      // subtle running vibration (grows with load for the booster)
      enclosureRef.current.position.y = running ? Math.sin(t * 50 * k) * 0.005 * k : 0;
    }
    // pulse the green "running" lamp (own material instance per compressor)
    lampGreen.emissiveIntensity = running ? 1.0 + Math.sin(t * 3) * 0.6 : 0.15;
  });

  const louvrePanel = (z: number) => (
    <group position={[0, baseY + H * 0.5, z]}>
      <mesh material={louvreMat}>
        <boxGeometry args={[1.4, 0.8, 0.04]} />
      </mesh>
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh key={i} position={[0, 0.34 - i * 0.08, 0.03]} rotation={[0.5, 0, 0]} material={steelMat}>
          <boxGeometry args={[1.32, 0.05, 0.02]} />
        </mesh>
      ))}
    </group>
  );

  return (
    <group>
      {/* concrete plinth with corner anchor points */}
      <Pad size={[5.0, 2.5]} height={plinthH} seed={128} />
      {([[-2.2, -1.05], [2.2, -1.05], [-2.2, 1.05], [2.2, 1.05]] as const).map((p, i) => (
        <mesh key={i} position={[p[0], plinthH, p[1]]} material={frameMat}>
          <cylinderGeometry args={[0.06, 0.06, 0.06, 8]} />
        </mesh>
      ))}

      {/* steel I-beam skid base */}
      <mesh position={[0, plinthH + skidH / 2, 0]} castShadow material={frameMat}>
        <boxGeometry args={[W + 0.1, skidH, D + 0.1]} />
      </mesh>

      <group ref={enclosureRef}>
        {/* enclosure body */}
        <mesh position={[0, baseY + H / 2, 0]} castShadow receiveShadow material={bodyMat}>
          <boxGeometry args={[W, H, D]} />
        </mesh>
        {/* sloped roof with raised lip */}
        <mesh position={[0, baseY + H + 0.06, 0]} castShadow material={roofMat}>
          <boxGeometry args={[W + 0.14, 0.12, D + 0.14]} />
        </mesh>
        {/* lifting lugs at each corner */}
        {([[-W / 2, -D / 2], [W / 2, -D / 2], [-W / 2, D / 2], [W / 2, D / 2]] as const).map((p, i) => (
          <mesh key={i} position={[p[0], baseY + H + 0.16, p[1]]} rotation={[Math.PI / 2, 0, 0]} material={frameMat}>
            <torusGeometry args={[0.07, 0.02, 6, 10]} />
          </mesh>
        ))}

        {/* ventilation louvres on both long sides (±Z) */}
        {louvrePanel(D / 2 + 0.001)}
        {louvrePanel(-D / 2 - 0.001)}

        {/* two hinged access doors on the front (+Z is display side; doors on −Z... put on +Z next to louvre?) -> front = +X end wall pair */}
        <group position={[W / 2 + 0.001, baseY + H / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
          {([-0.65, 0.65] as const).map((z) => (
            <group key={z} position={[z, 0, 0]}>
              <mesh material={steel({ color: '#0a5f8f', roughness: 0.5, metalness: 0.4, seed: 129 })}>
                <boxGeometry args={[1.15, H - 0.3, 0.03]} />
              </mesh>
              {/* recessed handle */}
              <mesh position={[z > 0 ? -0.45 : 0.45, 0, 0.03]} material={steelMat}>
                <boxGeometry args={[0.08, 0.22, 0.03]} />
              </mesh>
              {/* hinges */}
              {[-0.6, 0, 0.6].map((hy, i) => (
                <mesh key={i} position={[z > 0 ? 0.55 : -0.55, hy, 0.02]} material={steelMat}>
                  <cylinderGeometry args={[0.03, 0.03, 0.12, 8]} />
                </mesh>
              ))}
            </group>
          ))}
          {/* inspection window on one door */}
          <mesh position={[0.65, 0.55, 0.03]} material={glassMat}>
            <boxGeometry args={[0.4, 0.3, 0.02]} />
          </mesh>
        </group>

        {/* roof cooling fan with wire-mesh grille */}
        <group position={[-0.6, baseY + H + 0.14, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={frameMat}>
            <torusGeometry args={[0.52, 0.03, 8, 24]} />
          </mesh>
          <group ref={fanRef} position={[0, 0.04, 0]}>
            {[0, 1, 2, 3, 4].map((i) => (
              <mesh key={i} rotation={[0, (i / 5) * Math.PI * 2, 0.35]} material={steelMat}>
                <boxGeometry args={[0.9, 0.02, 0.16]} />
              </mesh>
            ))}
            <mesh material={steelMat}>
              <cylinderGeometry args={[0.09, 0.09, 0.1, 12]} />
            </mesh>
          </group>
          {/* mesh grille */}
          {[-0.3, 0, 0.3].map((g, i) => (
            <mesh key={i} position={[g, 0.09, 0]} material={steelMat}>
              <boxGeometry args={[0.02, 0.01, 1.0]} />
            </mesh>
          ))}
        </group>

        {/* exhaust stack with rain cap */}
        <group position={[1.4, baseY + H, 0.7]}>
          <mesh position={[0, 0.75, 0]} castShadow material={steelMat}>
            <cylinderGeometry args={[0.12, 0.12, 1.5, 12]} />
          </mesh>
          <mesh position={[0, 1.55, 0]} castShadow material={steelMat}>
            <coneGeometry args={[0.18, 0.14, 12]} />
          </mesh>
        </group>

        {/* branding + safety decals on the −Z side */}
        <group position={[0, baseY + H * 0.62, -D / 2 - 0.02]} rotation={[0, Math.PI, 0]}>
          <LogoDecal position={[1.1, 0.35, 0]} width={1.1} backing backingColor="#ffffff" />
          <SignPlane text="ADANI TOTAL GAS" width={2.4} position={[-0.7, 0.35, 0]} options={{ fg: '#ffffff', fontWeight: 800, letterSpacing: 2 }} />
          <SignPlane text={label} width={2.6} position={[0, -0.05, 0]} options={{ fg: '#dCE8f2', fontWeight: 700, letterSpacing: 1 }} />
          <SignPlane text="HIGH PRESSURE" width={1.0} position={[-1.4, -0.5, 0]} options={{ fg: '#7a1020', bg: '#f2d21e', fontWeight: 800, radius: 6, paddingX: 26 }} />
          <SignPlane text="NO SMOKING" width={1.0} position={[-0.2, -0.5, 0]} options={{ fg: '#ffffff', bg: BRAND.alert, fontWeight: 800, radius: 6, paddingX: 26 }} />
          <SignPlane text="AUTHORISED PERSONNEL ONLY" width={1.4} position={[1.25, -0.5, 0]} options={{ fg: '#16202b', bg: '#c9ccd0', fontWeight: 700, radius: 6, paddingX: 18 }} />
        </group>
      </group>

      {/* suction pipe (−X) with isolation valve + gauge */}
      <Pipe from={[-W / 2 - 0.9, 0.9, 0.6]} to={[-W / 2, 0.9, 0.6]} radius={0.1} color="#b0b6bd" seed={130} />
      <group position={[-W / 2 - 0.5, 1.1, 0.6]} rotation={[Math.PI / 2, 0, 0]} scale={0.7}>
        <Gauge radius={0.1} seed={131} />
      </group>

      {/* after-cooler (finned heat exchanger) beside the enclosure */}
      <group position={[0, baseY + 0.4, -D / 2 - 0.55]}>
        <mesh castShadow receiveShadow material={coolerMat}>
          <boxGeometry args={[1.5, 0.8, 0.55]} />
        </mesh>
        {Array.from({ length: 12 }).map((_, i) => (
          <mesh key={i} position={[-0.68 + i * 0.12, 0, 0.0]} material={coolerMat}>
            <boxGeometry args={[0.02, 0.84, 0.6]} />
          </mesh>
        ))}
      </group>

      {/* HP discharge pipe (+X, smaller dia) with check + relief + gauge */}
      <Pipe from={[W / 2, 0.9, -0.5]} to={[W / 2 + 1.0, 0.9, -0.5]} radius={0.06} color="#c98f6b" seed={132} />
      <group position={[W / 2 + 0.6, 1.15, -0.5]} rotation={[Math.PI / 2, 0, 0]} scale={0.6}>
        <Gauge radius={0.1} seed={133} />
      </group>

      {/* condensate drain vessel */}
      <group position={[-W / 2 + 0.3, plinthH, D / 2 + 0.4]}>
        <mesh position={[0, 0.4, 0]} castShadow material={steel({ color: '#8f969d', seed: 134 })}>
          <cylinderGeometry args={[0.2, 0.2, 0.8, 14]} />
        </mesh>
        <mesh position={[0, 0.82, 0]} material={steel({ color: '#8f969d', seed: 135 })}>
          <sphereGeometry args={[0.2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
      </group>

      {/* control panel on the −X end wall */}
      <group position={[-W / 2 - 0.22, baseY + 0.7, -0.6]}>
        <mesh castShadow receiveShadow material={panelMat}>
          <boxGeometry args={[0.35, 1.0, 0.8]} />
        </mesh>
        {/* display */}
        <mesh position={[-0.18, 0.28, 0]} rotation={[0, -Math.PI / 2, 0]} material={screenMat}>
          <boxGeometry args={[0.5, 0.28, 0.02]} />
        </mesh>
        {/* indicator lamps */}
        <mesh position={[-0.18, 0.02, -0.22]} rotation={[0, -Math.PI / 2, 0]} material={standby ? lampAmber : lampGreen}>
          <boxGeometry args={[0.06, 0.06, 0.02]} />
        </mesh>
        <mesh position={[-0.18, 0.02, -0.08]} rotation={[0, -Math.PI / 2, 0]} material={lampAmber}>
          <boxGeometry args={[0.06, 0.06, 0.02]} />
        </mesh>
        <mesh position={[-0.18, 0.02, 0.06]} rotation={[0, -Math.PI / 2, 0]} material={lampRed}>
          <boxGeometry args={[0.06, 0.06, 0.02]} />
        </mesh>
        {/* e-stop mushroom (red on yellow) */}
        <mesh position={[-0.18, -0.25, 0.18]} rotation={[0, 0, Math.PI / 2]} material={paintedMetal('#f2d21e', 136)}>
          <cylinderGeometry args={[0.08, 0.08, 0.03, 12]} />
        </mesh>
        <mesh position={[-0.2, -0.25, 0.18]} rotation={[0, 0, Math.PI / 2]} material={paintedMetal('#c01a1a', 137)}>
          <cylinderGeometry args={[0.05, 0.05, 0.04, 12]} />
        </mesh>
      </group>

      {/* cable tray on stands toward the control room (−X) */}
      <group position={[-W / 2 - 0.6, plinthH + 0.35, -0.6]}>
        {[0, 0.7, 1.4].map((x, i) => (
          <mesh key={i} position={[-x, -0.35, 0]} material={frameMat}>
            <boxGeometry args={[0.04, 0.35, 0.04]} />
          </mesh>
        ))}
        <mesh position={[-0.7, 0, 0]} material={steel({ color: '#6f757c', seed: 138 })}>
          <boxGeometry args={[1.6, 0.05, 0.24]} />
        </mesh>
      </group>
    </group>
  );
}
