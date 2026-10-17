import { useMemo } from 'react';
import { steel, paintedMetal, emissive } from '@/materials/materials';
import { BRAND } from '@/theme/tokens';
import { useViewStore } from '@/state/useViewStore';
import { LogoDecal, SignPlane } from '@/components3d/branding/Branding';

/**
 * Section 01 §3.5 — Forecourt Canopy. A deck with real structural thickness
 * (0.55), an Adani-blue fascia wrapping all four edges, a clean white soffit with
 * recessed LED light panels + a beam grid, and four detailed square-hollow columns
 * (base plate + anchor bolts on a concrete pedestal, head gusset plates, a hazard
 * guard ring and bollards at the base). LED panels + fascia strip light at night.
 */
export function Canopy({
  width = 14,
  depth = 8,
  height = 5.2,
}: {
  width?: number;
  depth?: number;
  height?: number;
}) {
  const night = useViewStore((s) => s.timeOfDay) === 'night';
  const colMat = useMemo(() => paintedMetal(BRAND.primary, 140), []);
  const deckMat = useMemo(() => paintedMetal('#d5d8dc', 141), []);
  const soffitMat = useMemo(() => paintedMetal('#f5f5f5', 142), []);
  const fasciaMat = useMemo(() => paintedMetal(BRAND.primary, 143), []);
  const steelMat = useMemo(() => steel({ color: '#9aa1a8', seed: 144 }), []);
  const pedestalMat = useMemo(() => paintedMetal('#b9b5ac', 145), []);
  const hazardMat = useMemo(() => paintedMetal('#e6b422', 146), []);
  const lightMat = useMemo(() => emissive('#fff4e0', night ? 2.4 : 0.2), [night]);
  const stripMat = useMemo(() => emissive('#eaf4ff', night ? 2.0 : 0.15), [night]);

  const deckThick = 0.55;
  const deckY = height + deckThick / 2;
  const inset = 0.9;
  const cols: [number, number][] = [
    [-width / 2 + inset, -depth / 2 + inset],
    [width / 2 - inset, -depth / 2 + inset],
    [-width / 2 + inset, depth / 2 - inset],
    [width / 2 - inset, depth / 2 - inset],
  ];

  const lights = useMemo(() => {
    const arr: [number, number][] = [];
    const nx = 4, nz = 2;
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < nz; j++) {
        arr.push([
          -width / 2 + 2.2 + (i * (width - 4.4)) / (nx - 1),
          -depth / 2 + 2.2 + (j * (depth - 4.4)) / (nz - 1),
        ]);
      }
    }
    return arr;
  }, [width, depth]);

  return (
    <group>
      {/* Columns */}
      {cols.map((c, i) => (
        <group key={i} position={[c[0], 0, c[1]]}>
          {/* concrete pedestal */}
          <mesh position={[0, 0.17, 0]} castShadow receiveShadow material={pedestalMat}>
            <boxGeometry args={[0.9, 0.35, 0.9]} />
          </mesh>
          {/* base plate + 4 anchor bolts */}
          <mesh position={[0, 0.37, 0]} castShadow material={steelMat}>
            <boxGeometry args={[0.7, 0.06, 0.7]} />
          </mesh>
          {([[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]] as const).map((p, k) => (
            <mesh key={k} position={[p[0], 0.42, p[1]]} material={steelMat}>
              <cylinderGeometry args={[0.03, 0.03, 0.06, 6]} />
            </mesh>
          ))}
          {/* square hollow column */}
          <mesh position={[0, height / 2 + 0.4, 0]} castShadow receiveShadow material={colMat}>
            <boxGeometry args={[0.45, height, 0.45]} />
          </mesh>
          {/* hazard guard ring at base */}
          <mesh position={[0, 0.9, 0]} material={hazardMat}>
            <boxGeometry args={[0.55, 1.0, 0.55]} />
          </mesh>
          {/* head gusset plates */}
          {([[0.3, 0], [-0.3, 0], [0, 0.3], [0, -0.3]] as const).map((g, k) => (
            <mesh key={k} position={[g[0], height + 0.15, g[1]]} rotation={[0, 0, g[0] !== 0 ? Math.PI / 4 : 0]} material={steelMat}>
              <boxGeometry args={[0.16, 0.3, 0.16]} />
            </mesh>
          ))}
          {/* bollards around base */}
          {([[-0.75, 0], [0.75, 0], [0, -0.75], [0, 0.75]] as const).map((b, k) => (
            <mesh key={k} position={[b[0], 0.4, b[1]]} castShadow material={k % 2 ? paintedMetal(BRAND.primary, 147) : hazardMat}>
              <cylinderGeometry args={[0.08, 0.08, 0.8, 10]} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Roof deck (top) */}
      <mesh position={[0, deckY, 0]} castShadow receiveShadow material={deckMat}>
        <boxGeometry args={[width, deckThick, depth]} />
      </mesh>
      {/* Clean white soffit (underside) */}
      <mesh position={[0, height + 0.01, 0]} receiveShadow material={soffitMat}>
        <boxGeometry args={[width - 0.1, 0.04, depth - 0.1]} />
      </mesh>

      {/* Fascia band wrapping all four edges */}
      {([[0, depth / 2 + 0.005, width + 0.12, 0], [0, -depth / 2 - 0.005, width + 0.12, 0]] as const).map((f, i) => (
        <mesh key={`fz${i}`} position={[f[0], deckY, f[1]]} material={fasciaMat}>
          <boxGeometry args={[f[2], deckThick, 0.08]} />
        </mesh>
      ))}
      {([[width / 2 + 0.005, 0], [-width / 2 - 0.005, 0]] as const).map((f, i) => (
        <mesh key={`fx${i}`} position={[f[0], deckY, f[1]]} material={fasciaMat}>
          <boxGeometry args={[0.08, deckThick, depth + 0.12]} />
        </mesh>
      ))}
      {/* thin LED strip along the bottom of the fascia (front + back) */}
      {([depth / 2 + 0.05, -depth / 2 - 0.05] as const).map((z, i) => (
        <mesh key={i} position={[0, height + 0.06, z]} material={stripMat}>
          <boxGeometry args={[width, 0.05, 0.03]} />
        </mesh>
      ))}

      {/* Soffit LED panels + beam-grid recesses */}
      {lights.map((l, i) => (
        <mesh key={i} position={[l[0], height - 0.02, l[1]]} material={lightMat}>
          <boxGeometry args={[1.2, 0.04, 0.6]} />
        </mesh>
      ))}
      {/* structural beam grid (shallow recesses between panels) */}
      {[-width / 4, 0, width / 4].map((x, i) => (
        <mesh key={`bx${i}`} position={[x, height - 0.04, 0]} material={soffitMat}>
          <boxGeometry args={[0.1, 0.08, depth - 0.4]} />
        </mesh>
      ))}

      {/* ADANI TOTAL GAS fascia branding — front + back */}
      {([1, -1] as const).map((s) => (
        <group key={s} position={[0, deckY, s * (depth / 2 + 0.1)]} rotation={[0, s === 1 ? 0 : Math.PI, 0]}>
          <LogoDecal position={[-width / 2 + 1.8, 0, 0]} width={1.8} backing backingColor="#ffffff" />
          <SignPlane text="ADANI TOTAL GAS" width={6.4} position={[1.3, 0, 0]} options={{ fg: '#ffffff', fontWeight: 800, letterSpacing: 3 }} />
        </group>
      ))}
      {/* CNG on the side fascias */}
      {([1, -1] as const).map((s) => (
        <SignPlane key={`cng${s}`} text="CNG" width={2.0} position={[s * (width / 2 + 0.1), deckY, 0]} rotation={[0, s === 1 ? Math.PI / 2 : -Math.PI / 2, 0]} options={{ fg: '#ffffff', fontWeight: 800, letterSpacing: 8 }} />
      ))}
    </group>
  );
}
