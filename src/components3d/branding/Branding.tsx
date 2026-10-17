import { useMemo } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
import { makeSign, type SignOptions } from '@/materials/signage';

/** Adani logo aspect ratio (820 × 287). */
export const LOGO_ASPECT = 820 / 287;
export const LOGO_URL = '/assets/branding/adani_logo.png';

/**
 * Adani logo decal (spec §2). Renders the provided PNG on a flat plane (never
 * extruded, never distorted), optionally over a light backing plate so it stays
 * legible on dark surfaces. Cosmetic only.
 */
export function LogoDecal({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  width = 1,
  backing = true,
  backingColor = '#ffffff',
  backingPad = 0.18,
  emissiveAtNight = false,
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  backing?: boolean;
  backingColor?: string;
  backingPad?: number;
  emissiveAtNight?: boolean;
}) {
  const tex = useTexture(LOGO_URL);
  useMemo(() => {
    // Anisotropy + mipmaps stop the logo shimmering/jittering at angles/distance.
    tex.anisotropy = 16;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
  }, [tex]);
  const height = width / LOGO_ASPECT;
  const bw = width * (1 + backingPad);
  const bh = height * (1 + backingPad * LOGO_ASPECT * 0.5);

  return (
    <group position={position} rotation={rotation}>
      {backing && (
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[bw, bh]} />
          <meshStandardMaterial
            color={backingColor}
            roughness={0.5}
            metalness={0}
            emissive={emissiveAtNight ? backingColor : '#000000'}
            emissiveIntensity={emissiveAtNight ? 0.25 : 0}
          />
        </mesh>
      )}
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={tex} transparent toneMapped side={THREE.FrontSide} />
      </mesh>
    </group>
  );
}

/**
 * Flat text sign plane (banners, labels, safety signs, names). Sized from the
 * generated texture's aspect so text never stretches.
 */
export function SignPlane({
  text,
  options,
  width = 2,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  doubleSide = false,
}: {
  text: string;
  options?: SignOptions;
  width?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  doubleSide?: boolean;
}) {
  const { texture, aspect } = useMemo(() => makeSign(text, options), [text, options]);
  const height = width / aspect;
  // Both-sides mode renders two FRONT-facing planes back-to-back (the rear one
  // spun 180° about Y) rather than a single THREE.DoubleSide plane — a
  // double-sided plane shows a MIRRORED copy of the text on its back face, which
  // is what the guided-tour camera catches when it orbits behind a sign. Two
  // front-facing planes read correctly from either direction.
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={texture} transparent toneMapped side={THREE.FrontSide} />
      </mesh>
      {doubleSide && (
        <mesh rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial map={texture} transparent toneMapped side={THREE.FrontSide} />
        </mesh>
      )}
    </group>
  );
}
