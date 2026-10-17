import { useMemo } from 'react';
import * as THREE from 'three';
import { Building } from '@/components3d/city/Building';
import { Car } from '@/components3d/city/Vehicles';
import { SignPlane, LogoDecal } from '@/components3d/branding/Branding';
import { concrete, paintedMetal } from '@/materials/materials';
import { BRAND } from '@/theme/tokens';

/**
 * Shantigram named landmark buildings (spec §3.1–3.3). Each reuses the parametric
 * Building for its mass, then adds identifying signage, logo and setting (sports
 * ground / golf green / retail forecourt). Cosmetic environment only.
 */

function grassMat() {
  return new THREE.MeshStandardMaterial({ color: '#4f7d3f', roughness: 0.95, metalness: 0 });
}

/** 3.1 Adani International School — low-rise wide, sports ground, cricket pitch. */
export function AdaniSchool({ center }: { center: [number, number] }) {
  const [x, z] = center;
  const green = useMemo(grassMat, []);
  const pitch = useMemo(() => concrete('#c9b98f', 210), []);
  return (
    <group position={[x, 0, z]}>
      {/* main block + wing */}
      <Building position={[0, 0, -6]} width={22} depth={8} height={7} category="institutional" seed={301} />
      <Building position={[-8.5, 0, 2]} width={7} depth={9} height={7} category="institutional" seed={302} />
      {/* entrance porch */}
      <mesh position={[3, 1.6, -1.6]} castShadow receiveShadow material={paintedMetal('#e8dcc4', 303)}>
        <boxGeometry args={[6, 0.3, 3]} />
      </mesh>
      {[-2.5, -0.5, 1.5, 3.5].map((cx, i) => (
        <mesh key={i} position={[cx + 2.5, 0.8, -0.4]} castShadow material={paintedMetal('#efe7d5', 304)}>
          <cylinderGeometry args={[0.14, 0.14, 1.6, 10]} />
        </mesh>
      ))}
      {/* facade sign + logo */}
      <SignPlane
        text="ADANI INTERNATIONAL SCHOOL"
        width={16}
        position={[0, 6.1, -1.95]}
        doubleSide
        options={{ fg: BRAND.primary, fontWeight: 800, letterSpacing: 3 }}
      />
      <LogoDecal position={[-9.2, 6.0, 2.05]} width={3} backing rotation={[0, 0, 0]} />
      {/* sports ground + cricket pitch */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[9, 0.06, 8]} receiveShadow material={green}>
        <planeGeometry args={[15, 12]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[9, 0.08, 8]} receiveShadow material={pitch}>
        <planeGeometry args={[2, 8]} />
      </mesh>
    </group>
  );
}

/** 3.2 The Belvedere Golf & Country Club — clubhouse + green + flags. */
export function GolfClub({ center }: { center: [number, number] }) {
  const [x, z] = center;
  const green = useMemo(grassMat, []);
  const sand = useMemo(() => concrete('#dcc79a', 220), []);
  const flags = useMemo(() => [
    [6, 6],
    [-4, 9],
    [10, 12],
  ] as [number, number][], []);
  return (
    <group position={[x, 0, z]}>
      {/* clubhouse */}
      <Building position={[-7, 0, -8]} width={14} depth={9} height={8} category="commercial" seed={311} />
      {/* pitched brand canopy entry */}
      <mesh position={[-7, 8.4, -3.4]} castShadow material={paintedMetal(BRAND.primary, 312)}>
        <boxGeometry args={[8, 0.3, 2.5]} />
      </mesh>
      <SignPlane
        text="THE BELVEDERE GOLF & COUNTRY CLUB"
        width={13}
        position={[-7, 7, -3.4]}
        doubleSide
        options={{ fg: '#ffffff', bg: BRAND.navy, fontWeight: 800, radius: 10, paddingX: 40, letterSpacing: 2 }}
      />
      {/* golf green area */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[5, 0.05, 6]} receiveShadow material={green}>
        <planeGeometry args={[22, 20]} />
      </mesh>
      {/* a bunker */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 2]} receiveShadow material={sand}>
        <circleGeometry args={[2.2, 20]} />
      </mesh>
      {/* flag markers */}
      {flags.map((f, i) => (
        <group key={i} position={[f[0], 0, f[1]]}>
          <mesh position={[0, 0.9, 0]} material={paintedMetal('#e8e8e8', 313)}>
            <cylinderGeometry args={[0.03, 0.03, 1.8, 6]} />
          </mesh>
          <mesh position={[0.35, 1.6, 0]} material={paintedMetal(BRAND.alert, 314)}>
            <boxGeometry args={[0.6, 0.36, 0.02]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** 3.3 Shoppers' Plaza — retail complex, awnings, parking. */
export function ShoppersPlaza({ center }: { center: [number, number] }) {
  const [x, z] = center;
  const forecourt = useMemo(() => concrete('#b9b6ad', 230), []);
  const awning = useMemo(() => paintedMetal(BRAND.primary, 231), []);
  return (
    <group position={[x, 0, z]}>
      {/* forecourt / parking */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 8]} receiveShadow material={forecourt}>
        <planeGeometry args={[26, 14]} />
      </mesh>
      {/* retail block */}
      <Building position={[0, 0, -5]} width={24} depth={9} height={9} category="commercial" seed={331} />
      {/* ground-floor awnings */}
      {[-8, -3, 2, 7].map((ox, i) => (
        <mesh key={i} position={[ox, 2.6, -0.2]} rotation={[0.35, 0, 0]} castShadow material={awning}>
          <boxGeometry args={[4.4, 0.1, 1.6]} />
        </mesh>
      ))}
      {/* signage */}
      <SignPlane
        text="SHOPPERS' PLAZA"
        width={13}
        position={[0, 8, -0.4]}
        doubleSide
        options={{ fg: '#ffffff', fontWeight: 800, letterSpacing: 3 }}
      />
      <SignPlane
        text="ADANI SHANTIGRAM"
        width={8}
        position={[0, 7, -0.4]}
        doubleSide
        options={{ fg: BRAND.primarySoft, fontWeight: 700, letterSpacing: 4 }}
      />
      <LogoDecal position={[9, 8, -0.35]} width={3.4} backing />
      {/* parked cars in front */}
      {[-9, -5, -1, 3, 7, 11].map((cx, i) => (
        <Car key={i} position={[cx, 0, 11]} rotation={0} color={['#c9ccd1', '#334155', '#7f1d2e', '#26506e', '#e2e2e2', '#2f3a31'][i % 6]} />
      ))}
    </group>
  );
}
