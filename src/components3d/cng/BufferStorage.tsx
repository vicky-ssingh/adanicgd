import { useMemo } from 'react';
import * as THREE from 'three';
import { Pad } from '@/components3d/primitives/Structure';
import { Pipe } from '@/components3d/primitives/Pipe';
import { Valve, Gauge } from '@/components3d/primitives/Fittings';
import { steel, paintedMetal } from '@/materials/materials';
import { SignPlane } from '@/components3d/branding/Branding';

/**
 * Section 04 §B.4 — booster buffer storage. 6 HP cylinders (2 banks × 3, HIGH top
 * bright teal / LOW bottom dim teal) in a small cross-braced frame with per-row
 * manifolds, gauges, straps and bollards. Kept full (~200 Bar) by the booster so
 * vehicles fill fast. Local origin at plinth centre; cylinders run along Z.
 */
const BANK_COLOR = ['#0a5f5a', '#14b8a6']; // LOW(bottom), HIGH(top)

export function BufferStorage() {
  const frameMat = useMemo(() => steel({ color: '#4f555c', roughness: 0.55, metalness: 0.85, seed: 840 }), []);
  const strapMat = useMemo(() => steel({ color: '#2b2f34', roughness: 0.6, metalness: 0.7, seed: 841 }), []);
  const bossMat = useMemo(() => steel({ color: '#b8bdc4', roughness: 0.4, metalness: 0.9, seed: 842 }), []);
  const cylMats = useMemo(
    () => BANK_COLOR.map((c) => new THREE.MeshStandardMaterial({ color: '#b8bcc0', emissive: new THREE.Color(c), emissiveIntensity: 0.5, roughness: 0.34, metalness: 0.8 })),
    [],
  );

  const plinthH = 0.25;
  const W = 2.6;
  const Zlen = 2.2;
  const cols = [-0.75, 0, 0.75];
  const rowY = [0.5, 1.0];
  const cylR = 0.26;
  const frontZ = Zlen / 2;
  const manZ = frontZ + 0.25;
  const topY = rowY[1] + 0.5;

  return (
    <group>
      <Pad size={[W + 0.4, Zlen + manZ + 0.5]} height={plinthH} seed={843} />
      {/* frame uprights + rails + brace */}
      {([-W / 2, W / 2] as const).map((x) =>
        ([-Zlen / 2 + 0.1, Zlen / 2 - 0.1] as const).map((z) => (
          <mesh key={`${x}${z}`} position={[x, plinthH + topY / 2, z]} castShadow material={frameMat}>
            <boxGeometry args={[0.09, topY, 0.09]} />
          </mesh>
        )),
      )}
      {[0.25, topY].map((y, i) => (
        <mesh key={i} position={[0, plinthH + y, 0]} material={frameMat}><boxGeometry args={[W, 0.08, Zlen]} /></mesh>
      ))}
      {([-1, 1] as const).map((s) => (
        <mesh key={s} position={[s * W * 0.3, plinthH + topY / 2, -Zlen / 2 + 0.1]} rotation={[0, 0, s * 0.7]} material={frameMat}><boxGeometry args={[0.06, topY * 1.3, 0.06]} /></mesh>
      ))}

      {/* cylinders */}
      {rowY.map((y, r) =>
        cols.map((x, c) => (
          <group key={`${r}-${c}`} position={[x, plinthH + y, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow material={cylMats[r]}><cylinderGeometry args={[cylR, cylR, Zlen, 18]} /></mesh>
            <mesh position={[0, 0, Zlen / 2]} castShadow material={cylMats[r]}><sphereGeometry args={[cylR, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
            <mesh position={[0, 0, -Zlen / 2]} rotation={[Math.PI, 0, 0]} castShadow material={cylMats[r]}><sphereGeometry args={[cylR, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
            <mesh position={[0, 0, frontZ + 0.06]} rotation={[Math.PI / 2, 0, 0]} material={bossMat}><cylinderGeometry args={[0.06, 0.06, 0.12, 10]} /></mesh>
            {/* strap */}
            <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={strapMat}><torusGeometry args={[cylR + 0.02, 0.015, 6, 14, Math.PI]} /></mesh>
          </group>
        )),
      )}

      {/* per-row manifold + gauge + bank valve + label */}
      {rowY.map((y, r) => (
        <group key={r} position={[0, plinthH + y, manZ]}>
          <Pipe from={[-W / 2 + 0.2, 0, 0]} to={[W / 2 - 0.2, 0, 0]} radius={0.05} color="#b0b6bd" seed={845 + r} />
          <group position={[W / 2 - 0.1, 0.18, 0]} rotation={[Math.PI / 2, 0, 0]} scale={0.6}><Gauge radius={0.14} seed={847 + r} /></group>
          <group position={[-W / 2 + 0.1, -0.02, 0]} scale={0.35}><Valve size={0.28} color={BANK_COLOR[r]} handwheel seed={849 + r} /></group>
          <SignPlane text={r === 1 ? 'HIGH BANK' : 'LOW BANK'} width={0.8} position={[0, 0, 0.05]} options={{ fg: '#ffffff', bg: BANK_COLOR[r], fontWeight: 800, radius: 4, paddingX: 12 }} />
        </group>
      ))}

      <SignPlane text="HIGH PRESSURE 200 BAR" width={1.6} position={[0, plinthH + topY + 0.2, manZ]} options={{ fg: '#7a1020', bg: '#f2d21e', fontWeight: 800, radius: 6, paddingX: 16 }} />
      {/* bollards */}
      {[-1, 1].map((s, i) => (
        <mesh key={i} position={[s * 1.2, 0.5, manZ + 0.4]} castShadow material={paintedMetal('#e6b422', 851 + i)}><cylinderGeometry args={[0.08, 0.08, 1.0, 10]} /></mesh>
      ))}
    </group>
  );
}
