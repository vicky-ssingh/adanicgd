import { useMemo } from 'react';
import { Pipe } from '@/components3d/primitives/Pipe';
import { Flange, Valve, Gauge } from '@/components3d/primitives/Fittings';
import { Column } from '@/components3d/primitives/Structure';
import { steel, paintedMetal, concrete } from '@/materials/materials';
import { BRAND } from '@/theme/tokens';
import { SignPlane, LogoDecal } from '@/components3d/branding/Branding';

/**
 * Section 01 §3.1 — Pipeline Inlet Skid. Where CGD pipeline gas enters the Online
 * station: an underground riser feeds, in flow order, an inlet isolation valve, a
 * gas filter, a pressure gauge, a rotary meter, a regulator, an outlet valve and
 * a safety relief valve with a tall vent stack. Everything sits on a concrete
 * plinth inside a galvanised channel frame with bolted flanges and pipe supports.
 * Local origin at the plinth centre; process flows left (−X, from the riser) to
 * right (+X, toward the compressor). Inlet riser is at −X.
 */
export function InletSkid() {
  const plinthMat = useMemo(() => concrete('#c8c4bc', 200), []);
  const frameMat = useMemo(() => steel({ color: '#9ba3ab', roughness: 0.5, metalness: 0.85, seed: 201 }), []);
  const pipeMat = useMemo(() => steel({ color: '#8a9099', seed: 202 }), []);
  const filterMat = useMemo(() => paintedMetal('#6b7b8c', 203), []);
  const meterMat = useMemo(() => paintedMetal('#c9ccd0', 204), []);
  const regMat = useMemo(() => paintedMetal('#b7bcc2', 205), []);
  const hazardMat = useMemo(() => paintedMetal('#e6b422', 206), []);
  const plateMat = useMemo(() => steel({ color: '#c2c7cc', roughness: 0.4, metalness: 0.7, seed: 207 }), []);

  const PY = 0.9; // process pipe centre height above plinth top
  const skidTop = 0.25;

  // Small U-shaped pipe support saddle.
  const support = (x: number, z: number) => (
    <group position={[x, skidTop, z]}>
      <mesh position={[0, (PY - skidTop) / 2, 0]} castShadow material={frameMat}>
        <boxGeometry args={[0.06, PY - skidTop, 0.06]} />
      </mesh>
      <mesh position={[0, PY - skidTop, 0]} castShadow material={frameMat}>
        <cylinderGeometry args={[0.14, 0.14, 0.05, 12, 1, true, 0, Math.PI]} />
      </mesh>
    </group>
  );

  const flangePair = (x: number, z = 0) => (
    <group position={[x, PY, z]} rotation={[0, 0, Math.PI / 2]}>
      <Flange radius={0.16} thickness={0.04} bolts={8} seed={210} />
      <group position={[0, 0.1, 0]}>
        <Flange radius={0.16} thickness={0.04} bolts={8} seed={211} />
      </group>
    </group>
  );

  return (
    <group>
      {/* Concrete plinth with chamfered look (bevel via a thin top cap) */}
      <mesh position={[0, skidTop / 2, 0]} castShadow receiveShadow material={plinthMat}>
        <boxGeometry args={[3.0, skidTop, 1.5]} />
      </mesh>
      <mesh position={[0, skidTop + 0.01, 0]} receiveShadow material={plinthMat}>
        <boxGeometry args={[2.86, 0.03, 1.36]} />
      </mesh>

      {/* Galvanised channel frame around the skid */}
      {([-0.7, 0.7] as const).map((z) => (
        <mesh key={z} position={[0, skidTop + 0.04, z]} castShadow material={frameMat}>
          <boxGeometry args={[2.9, 0.08, 0.08]} />
        </mesh>
      ))}
      {([-1.4, 1.4] as const).map((x) => (
        <mesh key={x} position={[x, skidTop + 0.04, 0]} castShadow material={frameMat}>
          <boxGeometry args={[0.08, 0.08, 1.4]} />
        </mesh>
      ))}

      {/* Underground inlet riser (−X): rises from below ground, bends onto skid */}
      <mesh position={[-1.35, -0.35, 0.45]} material={pipeMat}>
        <cylinderGeometry args={[0.1, 0.1, 2.6, 16]} />
      </mesh>
      <Pipe from={[-1.35, PY, 0.45]} to={[-1.35, PY, 0]} radius={0.1} color="#8a9099" seed={212} />
      <Pipe from={[-1.35, PY, 0]} to={[1.35, PY, 0]} radius={0.1} color="#8a9099" seed={213} />

      {/* Pipe supports every ~1.0 unit */}
      {support(-0.9, 0)}
      {support(0.1, 0)}
      {support(1.1, 0)}

      {/* 1 · Inlet isolation valve (red lever) */}
      <group position={[-1.1, PY, 0]} scale={0.62}>
        <Valve size={0.3} color={BRAND.alert} handwheel seed={214} />
      </group>
      {flangePair(-0.82)}

      {/* 2 · Gas filter unit — vertical cylindrical vessel with domed heads */}
      <group position={[-0.5, PY - 0.02, 0]}>
        <Column radius={0.23} height={0.9} color="#6b7b8c" seed={215} />
        {/* differential-pressure gauge on the side */}
        <group position={[0.24, 0.55, 0.0]} rotation={[Math.PI / 2, 0, 0]}>
          <Gauge radius={0.08} seed={216} />
        </group>
        {/* drain valve at base */}
        <mesh position={[0, 0.02, 0.22]} rotation={[Math.PI / 2, 0, 0]} material={filterMat}>
          <cylinderGeometry args={[0.05, 0.05, 0.12, 8]} />
        </mesh>
      </group>
      {flangePair(-0.18)}

      {/* 3 · Pressure gauge assembly on a short stem */}
      <group position={[0.0, PY + 0.22, 0.14]} rotation={[Math.PI / 2, 0, 0]}>
        <Gauge radius={0.1} seed={217} />
      </group>

      {/* 4 · Metering unit — rotary gas meter with counter + index head */}
      <group position={[0.42, PY, 0]}>
        <mesh castShadow receiveShadow material={meterMat}>
          <boxGeometry args={[0.5, 0.4, 0.3]} />
        </mesh>
        {/* index head on top */}
        <mesh position={[0, 0.28, 0]} castShadow material={meterMat}>
          <cylinderGeometry args={[0.09, 0.11, 0.14, 12]} />
        </mesh>
        {/* mechanical counter display */}
        <mesh position={[0, 0.02, 0.16]} material={steel({ color: '#10161d', roughness: 0.3, seed: 218 })}>
          <boxGeometry args={[0.3, 0.12, 0.02]} />
        </mesh>
      </group>
      {flangePair(0.74)}

      {/* 5 · Pressure regulator — bell body + domed spring housing */}
      <group position={[0.95, PY, 0]}>
        <mesh castShadow receiveShadow material={regMat}>
          <cylinderGeometry args={[0.14, 0.2, 0.28, 16]} />
        </mesh>
        <mesh position={[0, 0.28, 0]} castShadow material={regMat}>
          <sphereGeometry args={[0.18, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <mesh position={[0, 0.46, 0]} castShadow material={regMat}>
          <cylinderGeometry args={[0.04, 0.04, 0.1, 8]} />
        </mesh>
        {/* pilot line looping back */}
        <Pipe from={[0.12, PY + 0.2, 0.06]} to={[0.12, PY - 0.1, 0.2]} radius={0.02} color="#7d848c" seed={219} />
      </group>

      {/* 6 · Outlet isolation valve (blue lever) */}
      <group position={[1.25, PY, 0]} scale={0.62}>
        <Valve size={0.3} color={BRAND.primary} handwheel seed={220} />
      </group>

      {/* 7 · Safety relief valve + tall vent stack with rain cap */}
      <group position={[1.35, PY, -0.45]}>
        <mesh position={[0, 0.1, 0]} castShadow material={pipeMat}>
          <cylinderGeometry args={[0.07, 0.07, 0.2, 10]} />
        </mesh>
        {/* hazard band at base */}
        <mesh position={[0, 0.28, 0]} material={hazardMat}>
          <cylinderGeometry args={[0.055, 0.055, 0.3, 10]} />
        </mesh>
        <mesh position={[0, 1.6, 0]} castShadow material={pipeMat}>
          <cylinderGeometry args={[0.05, 0.05, 2.4, 10]} />
        </mesh>
        {/* rain cap */}
        <mesh position={[0, 2.85, 0]} castShadow material={pipeMat}>
          <coneGeometry args={[0.11, 0.12, 12]} />
        </mesh>
      </group>
      {/* connect outlet valve to relief tee and onward outlet */}
      <Pipe from={[1.35, PY, 0]} to={[1.35, PY, -0.45]} radius={0.08} color="#8a9099" seed={221} />

      {/* Identification plate + Adani logo + flow arrow decals */}
      <group position={[0, skidTop + 0.5, 0.71]}>
        <mesh material={plateMat}>
          <boxGeometry args={[0.9, 0.22, 0.02]} />
        </mesh>
        <SignPlane text="INLET SKID — CNG-01" width={0.82} position={[0, 0, 0.02]} options={{ fg: '#16202b', bg: '#d6dade', fontWeight: 800, letterSpacing: 1 }} />
      </group>
      <LogoDecal position={[-0.7, PY + 0.05, 0.09]} rotation={[0, 0, 0]} width={0.5} backing backingColor="#ffffff" />
      {[-0.4, 0.6].map((x, i) => (
        <SignPlane
          key={i}
          text="▶"
          width={0.16}
          position={[x, PY + 0.13, 0.001]}
          options={{ fg: '#eef2f5', bg: 'transparent', fontWeight: 800 }}
        />
      ))}
    </group>
  );
}
