import { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Pad } from '@/components3d/primitives/Structure';
import { Pipe, PipeRun } from '@/components3d/primitives/Pipe';
import { Valve, Gauge, Sensor } from '@/components3d/primitives/Fittings';
import { AccessPlatform } from './AccessPlatform';
import { steel, paintedMetal } from '@/materials/materials';
import { SignPlane } from '@/components3d/branding/Branding';
import { useMotherStore, type MotherBank } from '@/state/useMotherStore';

/**
 * Section 02 §6 — HP Cascade Storage. 24 cylinders in 4 rows of 6 on an open,
 * cross-braced steel frame with an access platform. Bottom row is the dedicated
 * Trailer Fill Reserve (Adani blue) — the operational cue that this is a Mother
 * Station. Per-row manifolds + pigtails + gauges; two outlet headers (to the
 * priority panel and to the trailer filling panel). Cylinders glow by live bank
 * fill; the reserve draws down while a trailer is filling.
 */

const BANK_COLOR: Record<MotherBank, string> = { HIGH: '#14b8a6', MEDIUM: '#0e8b82', LOW: '#0a5f5a', RESERVE: '#0b74b0' };
// bottom → top
const ROWS: MotherBank[] = ['RESERVE', 'LOW', 'MEDIUM', 'HIGH'];

export function HpCascade() {
  const frameMat = useMemo(() => steel({ color: '#4f555c', roughness: 0.55, metalness: 0.85, seed: 460 }), []);
  const strapMat = useMemo(() => steel({ color: '#2b2f34', roughness: 0.6, metalness: 0.7, seed: 461 }), []);
  const padMat = useMemo(() => paintedMetal('#1c1f22', 462), []);
  const bossMat = useMemo(() => steel({ color: '#b8bdc4', roughness: 0.4, metalness: 0.9, seed: 463 }), []);
  const manifoldColor = '#b0b6bd';

  const bankMats = useMemo(() => {
    const mk = (c: string) => new THREE.MeshStandardMaterial({ color: c, emissive: new THREE.Color(c), emissiveIntensity: 0.4, roughness: 0.34, metalness: 0.85 });
    return { HIGH: mk(BANK_COLOR.HIGH), MEDIUM: mk(BANK_COLOR.MEDIUM), LOW: mk(BANK_COLOR.LOW), RESERVE: mk(BANK_COLOR.RESERVE) } as Record<MotherBank, THREE.MeshStandardMaterial>;
  }, []);

  useFrame(() => {
    const { banks, stage } = useMotherStore.getState();
    (Object.keys(bankMats) as MotherBank[]).forEach((b) => {
      const fill = banks[b] / 100;
      const active = b === 'RESERVE' && stage === 'filling';
      bankMats[b].emissiveIntensity = 0.25 + fill * 0.8 + (active ? 0.7 : 0);
    });
  });

  const plinthH = 0.3;
  const W = 6.5;
  const Zlen = 2.0;
  const cols = [-2.7, -1.62, -0.54, 0.54, 1.62, 2.7];
  const rowY = [0.55, 1.2, 1.85, 2.5];
  const cylR = 0.28;
  const frontZ = Zlen / 2;
  const manZ = frontZ + 0.3;
  const topY = rowY[3] + 0.5;

  return (
    <group>
      <Pad size={[W + 0.6, Zlen + manZ + 0.8]} height={plinthH} seed={464} />

      {/* uprights + base plates */}
      {([-W / 2, W / 2] as const).map((x) =>
        ([-Zlen / 2 + 0.1, Zlen / 2 - 0.1] as const).map((z) => (
          <group key={`${x}${z}`} position={[x, plinthH, z]}>
            <mesh position={[0, topY / 2, 0]} castShadow material={frameMat}>
              <boxGeometry args={[0.12, topY, 0.12]} />
            </mesh>
            <mesh position={[0, 0.02, 0]} material={frameMat}>
              <boxGeometry args={[0.28, 0.05, 0.28]} />
            </mesh>
          </group>
        )),
      )}
      {[0.35, topY].map((y, i) => (
        <mesh key={i} position={[0, plinthH + y, 0]} castShadow material={frameMat}>
          <boxGeometry args={[W, 0.1, Zlen]} />
        </mesh>
      ))}
      {/* diagonal cross-bracing on rear + ends */}
      {([-1, 1] as const).map((s) => (
        <mesh key={s} position={[s * W * 0.35, plinthH + topY / 2, -Zlen / 2 + 0.1]} rotation={[0, 0, s * 0.7]} material={frameMat}>
          <boxGeometry args={[0.07, topY * 1.35, 0.07]} />
        </mesh>
      ))}

      {/* cylinders */}
      {ROWS.map((bank, r) =>
        cols.map((x, c) => (
          <group key={`${bank}-${c}`} position={[x, plinthH + rowY[r], 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow material={bankMats[bank]}>
              <cylinderGeometry args={[cylR, cylR, Zlen, 20]} />
            </mesh>
            <mesh position={[0, 0, Zlen / 2]} castShadow material={bankMats[bank]}>
              <sphereGeometry args={[cylR, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>
            <mesh position={[0, 0, -Zlen / 2]} rotation={[Math.PI, 0, 0]} castShadow material={bankMats[bank]}>
              <sphereGeometry args={[cylR, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>
            <mesh position={[0, 0, frontZ + 0.06]} rotation={[Math.PI / 2, 0, 0]} material={bossMat}>
              <cylinderGeometry args={[0.06, 0.06, 0.12, 10]} />
            </mesh>
            {([-0.55, 0.55] as const).map((sz) => (
              <group key={sz}>
                <mesh position={[0, 0, sz]} rotation={[0, 0, Math.PI / 2]} material={strapMat}>
                  <torusGeometry args={[cylR + 0.02, 0.015, 6, 16, Math.PI]} />
                </mesh>
                <mesh position={[0, -cylR - 0.01, sz]} material={padMat}>
                  <boxGeometry args={[0.14, 0.04, 0.12]} />
                </mesh>
              </group>
            ))}
            <PipeRun
              points={[[0, 0, frontZ + 0.12], [0, -0.12, frontZ + 0.24], [0, -0.1, manZ]]}
              radius={0.03}
              color="#8f969d"
              seed={465 + r * 6 + c}
              tension={0.5}
              radialSegments={8}
            />
            <mesh position={[0, -0.02, frontZ + 0.2]} material={bossMat}>
              <sphereGeometry args={[0.05, 10, 8]} />
            </mesh>
          </group>
        )),
      )}

      {/* per-bank manifold + gauge + relief + bank valve + label */}
      {ROWS.map((bank, r) => (
        <group key={`man-${bank}`} position={[0, plinthH + rowY[r], manZ]}>
          <Pipe from={[-W / 2 + 0.2, 0, 0]} to={[W / 2 - 0.2, 0, 0]} radius={0.06} color={manifoldColor} seed={490 + r} />
          <group position={[W / 2 - 0.1, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]} scale={0.7}>
            <Gauge radius={0.15} seed={494 + r} />
          </group>
          <mesh position={[-W / 2 + 0.1, 0.4, 0]} material={bossMat}>
            <cylinderGeometry args={[0.03, 0.03, 0.6, 8]} />
          </mesh>
          <group position={[W / 2 - 0.1, -0.02, 0]} scale={0.4}>
            <Valve size={0.28} color={BANK_COLOR[bank]} handwheel seed={498 + r} />
          </group>
          <SignPlane
            text={bank === 'RESERVE' ? 'TRAILER FILL RESERVE' : `${bank} BANK`}
            width={bank === 'RESERVE' ? 1.5 : 0.95}
            position={[-W / 2 + (bank === 'RESERVE' ? 1.0 : 0.75), 0, 0.06]}
            options={{ fg: '#ffffff', bg: BANK_COLOR[bank], fontWeight: 800, radius: 4, paddingX: 16, letterSpacing: 1 }}
          />
        </group>
      ))}

      {/* two outlet headers: to priority panel (+X, high) and to filling panel (+X, low) */}
      <Pipe from={[W / 2 - 0.1, plinthH + rowY[3], manZ]} to={[W / 2 - 0.1, plinthH + rowY[1], manZ]} radius={0.06} color={manifoldColor} seed={504} />
      <Pipe from={[W / 2 - 0.1, plinthH + rowY[2], manZ]} to={[W / 2 + 0.7, plinthH + rowY[2], manZ]} radius={0.06} color={manifoldColor} seed={505} />
      <Pipe from={[W / 2 - 0.1, plinthH + rowY[0], manZ]} to={[W / 2 + 0.7, plinthH + rowY[0], manZ]} radius={0.07} color={BANK_COLOR.RESERVE} seed={506} />

      {/* access platform + ladder along the front at mid height */}
      <group position={[0, 0, manZ + 0.6]}>
        <AccessPlatform width={W} depth={1.1} deckY={1.35} ladderX={W / 2 - 0.5} ladderZ={0.5} />
      </group>

      {/* warning signage + gas detector heads */}
      <SignPlane text="HIGH PRESSURE 250 BAR" width={2.0} position={[-1.2, plinthH + topY + 0.25, manZ]} options={{ fg: '#7a1020', bg: '#f2d21e', fontWeight: 800, radius: 6, paddingX: 20 }} />
      <SignPlane text="NO IGNITION SOURCES" width={2.0} position={[1.2, plinthH + topY + 0.25, manZ]} options={{ fg: '#ffffff', bg: '#c01a1a', fontWeight: 800, radius: 6, paddingX: 20 }} />
      {([-W / 2 + 0.3, W / 2 - 0.3] as const).map((x, i) => (
        <group key={i} position={[x, plinthH + topY, manZ - 0.1]} scale={0.7}>
          <Sensor color="#e0a23c" seed={508 + i} />
        </group>
      ))}

      {/* protective bollards on approach sides */}
      {[-2.2, 0, 2.2].map((x, i) => (
        <group key={i} position={[x, 0, manZ + 1.3]}>
          <mesh position={[0, 0.6, 0]} castShadow material={paintedMetal('#e6b422', 510 + i)}>
            <cylinderGeometry args={[0.09, 0.09, 1.2, 10]} />
          </mesh>
          <mesh position={[0, 0.75, 0]} material={strapMat}>
            <cylinderGeometry args={[0.095, 0.095, 0.18, 10]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
