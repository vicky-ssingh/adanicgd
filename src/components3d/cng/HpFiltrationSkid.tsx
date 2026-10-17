import { useMemo } from 'react';
import { Pipe } from '@/components3d/primitives/Pipe';
import { Flange, Valve, Gauge } from '@/components3d/primitives/Fittings';
import { Column } from '@/components3d/primitives/Structure';
import { AccessPlatform } from './AccessPlatform';
import { steel, paintedMetal, concrete } from '@/materials/materials';
import { BRAND } from '@/theme/tokens';
import { SignPlane, LogoDecal } from '@/components3d/branding/Branding';

/**
 * Section 02 §3 — HP Inlet & Filtration Skid. Larger than the Online Station's:
 * a gear-operated main inlet valve, TWIN duty/standby filter vessels with a
 * crossover changeover arrangement, davit arms, inlet/inter-stage/outlet gauges,
 * a dial thermometer, a tall relief vent stack, and an access platform + ladder.
 * Local origin at plinth centre; gas rises from the underground riser at −X.
 */
export function HpFiltrationSkid() {
  const plinthMat = useMemo(() => concrete('#c8c4bc', 410), []);
  const frameMat = useMemo(() => steel({ color: '#9ba3ab', roughness: 0.5, metalness: 0.85, seed: 411 }), []);
  const pipeMat = useMemo(() => steel({ color: '#8a9099', seed: 412 }), []);
  const filterMat = useMemo(() => paintedMetal('#6b7b8c', 413), []);
  const hazardMat = useMemo(() => paintedMetal('#e6b422', 414), []);
  const plateMat = useMemo(() => steel({ color: '#c2c7cc', roughness: 0.4, metalness: 0.7, seed: 415 }), []);

  const PY = 1.0;
  const skidTop = 0.3;

  const support = (x: number, z: number) => (
    <group position={[x, skidTop, z]}>
      <mesh position={[0, (PY - skidTop) / 2, 0]} castShadow material={frameMat}>
        <boxGeometry args={[0.07, PY - skidTop, 0.07]} />
      </mesh>
      <mesh position={[0, PY - skidTop, 0]} castShadow material={frameMat}>
        <cylinderGeometry args={[0.16, 0.16, 0.06, 12, 1, true, 0, Math.PI]} />
      </mesh>
    </group>
  );

  // Twin filter vessels (duty + standby) at z = ±0.55.
  const filter = (z: number, duty: boolean) => (
    <group position={[-0.2, PY - 0.05, z]}>
      <Column radius={0.28} height={1.5} color="#6b7b8c" seed={duty ? 416 : 417} />
      {/* davit arm for lid removal */}
      <mesh position={[0, 1.65, 0]} material={frameMat}>
        <cylinderGeometry args={[0.04, 0.04, 0.5, 8]} />
      </mesh>
      <mesh position={[0.25, 1.85, 0]} rotation={[0, 0, Math.PI / 2]} material={frameMat}>
        <cylinderGeometry args={[0.035, 0.035, 0.5, 8]} />
      </mesh>
      {/* vent valve on top */}
      <mesh position={[0, 1.55, 0]} material={filterMat}>
        <cylinderGeometry args={[0.05, 0.05, 0.12, 8]} />
      </mesh>
      {/* differential-pressure gauge */}
      <group position={[0.28, 0.9, 0]} rotation={[Math.PI / 2, 0, 0]} scale={0.7}>
        <Gauge radius={0.12} seed={duty ? 418 : 419} />
      </group>
      {/* drain valve at base */}
      <mesh position={[0, -0.6, 0.26]} rotation={[Math.PI / 2, 0, 0]} material={filterMat}>
        <cylinderGeometry args={[0.05, 0.05, 0.12, 8]} />
      </mesh>
      {/* duty/standby indicator plate */}
      <SignPlane text={duty ? 'FILTER A · DUTY' : 'FILTER B · STANDBY'} width={0.7} position={[0, 0.4, 0.3]} options={{ fg: '#ffffff', bg: duty ? BRAND.tealCng : '#5a6472', fontWeight: 800, radius: 4, paddingX: 14 }} />
    </group>
  );

  return (
    <group>
      {/* Concrete plinth */}
      <mesh position={[0, skidTop / 2, 0]} castShadow receiveShadow material={plinthMat}>
        <boxGeometry args={[5.0, skidTop, 2.0]} />
      </mesh>
      <mesh position={[0, skidTop + 0.01, 0]} receiveShadow material={plinthMat}>
        <boxGeometry args={[4.84, 0.03, 1.84]} />
      </mesh>

      {/* Channel frame */}
      {([-0.9, 0.9] as const).map((z) => (
        <mesh key={z} position={[0, skidTop + 0.05, z]} castShadow material={frameMat}>
          <boxGeometry args={[4.8, 0.1, 0.1]} />
        </mesh>
      ))}
      {([-2.35, 2.35] as const).map((x) => (
        <mesh key={x} position={[x, skidTop + 0.05, 0]} castShadow material={frameMat}>
          <boxGeometry args={[0.1, 0.1, 1.8]} />
        </mesh>
      ))}

      {/* Underground inlet riser (0.30 dia) at −X */}
      <mesh position={[-2.3, -0.4, 0.6]} material={pipeMat}>
        <cylinderGeometry args={[0.15, 0.15, 2.8, 16]} />
      </mesh>
      <Pipe from={[-2.3, PY, 0.6]} to={[-2.3, PY, 0]} radius={0.15} color="#8a9099" seed={420} />
      <Pipe from={[-2.3, PY, 0]} to={[-1.7, PY, 0]} radius={0.15} color="#8a9099" seed={421} />

      {support(-1.4, 0)}
      {support(0.9, 0)}
      {support(1.8, 0)}

      {/* 1 · Main gear-operated inlet valve with handwheel */}
      <group position={[-1.5, PY, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={paintedMetal(BRAND.alert, 422)}>
          <cylinderGeometry args={[0.21, 0.21, 0.5, 16]} />
        </mesh>
        <group position={[0.42, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <Flange radius={0.24} thickness={0.05} bolts={12} seed={423} />
        </group>
        <group position={[-0.42, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <Flange radius={0.24} thickness={0.05} bolts={12} seed={424} />
        </group>
        {/* gearbox + handwheel on top */}
        <mesh position={[0, 0.32, 0]} castShadow material={frameMat}>
          <boxGeometry args={[0.22, 0.2, 0.22]} />
        </mesh>
        <mesh position={[0, 0.55, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow material={steel({ color: '#9aa1a8', seed: 425 })}>
          <torusGeometry args={[0.25, 0.03, 8, 20]} />
        </mesh>
      </group>

      {/* 2 · Twin filter vessels (duty + standby) */}
      {filter(0.55, true)}
      {filter(-0.55, false)}

      {/* 3 · Crossover / changeover piping with 4 valves */}
      <Pipe from={[-0.2, PY + 0.55, 0.55]} to={[-0.2, PY + 0.55, -0.55]} radius={0.06} color="#b0b6bd" seed={426} />
      <Pipe from={[-0.2, PY - 0.55, 0.55]} to={[-0.2, PY - 0.55, -0.55]} radius={0.06} color="#b0b6bd" seed={427} />
      {([[0.55, 0.5], [-0.55, 0.5], [0.55, -0.5], [-0.55, -0.5]] as const).map((v, i) => (
        <group key={i} position={[-0.2, PY + v[1], v[0]]} scale={0.35}>
          <Valve size={0.3} color={i < 2 ? BRAND.tealCng : '#5a6472'} handwheel seed={428 + i} />
        </group>
      ))}

      {/* 4 · Three gauges (inlet / inter-stage / outlet) */}
      {[-1.0, 0.6, 1.4].map((x, i) => (
        <group key={i} position={[x, PY + 0.3, 0.2]} rotation={[Math.PI / 2, 0, 0]} scale={0.7}>
          <Gauge radius={0.12} seed={432 + i} />
        </group>
      ))}

      {/* 5 · Dial thermometer (thermowell) */}
      <group position={[1.0, PY + 0.25, -0.2]} rotation={[Math.PI / 2, 0, 0]} scale={0.55}>
        <Gauge radius={0.12} seed={435} />
      </group>

      {/* outlet run to metering (+X) */}
      <Pipe from={[1.3, PY, 0]} to={[2.4, PY, 0]} radius={0.14} color="#8a9099" seed={436} />

      {/* 6 · Safety relief valve + tall (4.0) vent stack */}
      <group position={[2.1, PY, -0.6]}>
        <mesh position={[0, 0.12, 0]} castShadow material={pipeMat}>
          <cylinderGeometry args={[0.08, 0.08, 0.24, 10]} />
        </mesh>
        <mesh position={[0, 0.34, 0]} material={hazardMat}>
          <cylinderGeometry args={[0.06, 0.06, 0.34, 10]} />
        </mesh>
        <mesh position={[0, 2.2, 0]} castShadow material={pipeMat}>
          <cylinderGeometry args={[0.055, 0.055, 3.4, 10]} />
        </mesh>
        <mesh position={[0, 3.95, 0]} castShadow material={pipeMat}>
          <coneGeometry args={[0.12, 0.14, 12]} />
        </mesh>
      </group>

      {/* Access platform + ladder beside the filter vessels */}
      <group position={[-0.2, 0, 1.55]}>
        <AccessPlatform width={2.4} depth={1.0} deckY={1.0} ladderX={0.9} ladderZ={0.5} />
      </group>

      {/* Cable tray toward the control room + ID plate + logo */}
      <mesh position={[-1.0, skidTop + 0.35, -0.9]} material={steel({ color: '#6f757c', seed: 437 })}>
        <boxGeometry args={[2.0, 0.05, 0.22]} />
      </mesh>
      <group position={[0, skidTop + 0.55, 0.92]}>
        <mesh material={plateMat}>
          <boxGeometry args={[1.0, 0.24, 0.02]} />
        </mesh>
        <SignPlane text="HP FILTRATION — CNG-M01" width={0.92} position={[0, 0, 0.02]} options={{ fg: '#16202b', bg: '#d6dade', fontWeight: 800, letterSpacing: 1 }} />
      </group>
      <LogoDecal position={[-1.5, PY + 0.55, 0.3]} width={0.5} backing backingColor="#ffffff" />
    </group>
  );
}
