import { Pad } from '@/components3d/primitives/Structure';
import { Pipe } from '@/components3d/primitives/Pipe';
import { Valve, Gauge } from '@/components3d/primitives/Fittings';
import { steel, paintedMetal } from '@/materials/materials';
import { BRAND } from '@/theme/tokens';
import { LogoDecal } from '@/components3d/branding/Branding';

/**
 * District Regulating Station (spec §2.14). A compact kerbside regulating skid
 * inside a low kiosk enclosure: inlet isolation, twin regulator streams, outlet,
 * gauges. Smaller than a PRS; scattered through the city. Inlet -X, outlet +X.
 */
export function Drs(props: { position?: [number, number, number]; rotation?: number }) {
  const { position = [0, 0, 0], rotation = 0 } = props;
  const regMat = steel({ color: '#9aa1a8', roughness: 0.42, metalness: 0.88, seed: 80 });
  const domeMat = paintedMetal(BRAND.accent, 81);
  const kioskMat = paintedMetal('#b6bcae', 82); // light olive-grey enclosure (clearly visible)

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Pad size={[3.6, 2.6]} height={0.22} />

      {/* Low enclosure back + sides (open front for visibility) */}
      <mesh position={[0, 1.0, -1.1]} castShadow receiveShadow material={kioskMat}>
        <boxGeometry args={[3.4, 1.8, 0.12]} />
      </mesh>
      <mesh position={[-1.6, 1.0, -0.4]} castShadow receiveShadow material={kioskMat}>
        <boxGeometry args={[0.12, 1.8, 1.5]} />
      </mesh>
      <mesh position={[1.6, 1.0, -0.4]} castShadow receiveShadow material={kioskMat}>
        <boxGeometry args={[0.12, 1.8, 1.5]} />
      </mesh>
      {/* roof */}
      <mesh position={[0, 1.95, -0.35]} castShadow receiveShadow material={kioskMat}>
        <boxGeometry args={[3.5, 0.12, 1.7]} />
      </mesh>
      {/* brand status light on roof edge */}
      <mesh position={[1.3, 1.9, 0.45]}>
        <boxGeometry args={[0.5, 0.06, 0.06]} />
        <meshStandardMaterial color="#0a0f14" emissive={BRAND.tealCng} emissiveIntensity={1.3} />
      </mesh>
      {/* Adani branded plate on enclosure (spec §2) */}
      <mesh position={[-0.7, 1.0, -1.03]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.0, 0.34]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} />
      </mesh>
      <LogoDecal position={[-0.7, 1.0, -1.04]} rotation={[0, Math.PI, 0]} width={0.85} backing={false} />

      {/* Twin regulator streams */}
      {[-0.5, 0.5].map((z, i) => (
        <group key={i} position={[0, 0.75, z]}>
          <Pipe from={[-1.7, 0, 0]} to={[-0.7, 0, 0]} radius={0.1} flanges seed={83 + i} />
          <group position={[-1.2, 0, 0]} scale={0.8}>
            <Valve size={0.2} color={BRAND.alert} seed={5 + i} />
          </group>
          <group position={[-0.2, 0, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={regMat}>
              <cylinderGeometry args={[0.22, 0.22, 0.55, 18]} />
            </mesh>
            <mesh position={[0, 0.32, 0]} castShadow material={domeMat}>
              <sphereGeometry args={[0.22, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>
          </group>
          <Pipe from={[-0.7, 0, 0]} to={[1.7, 0, 0]} radius={0.1} seed={85 + i} />
        </group>
      ))}

      {/* Gauges */}
      <group position={[-1.3, 1.25, 0.5]} scale={0.85}>
        <Gauge radius={0.12} seed={88} />
      </group>
      <group position={[1.1, 1.25, -0.5]} scale={0.85}>
        <Gauge radius={0.12} seed={89} />
      </group>
    </group>
  );
}
