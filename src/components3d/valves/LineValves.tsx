import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { LINE_VALVES, type LineValveDef } from '@/config/lineValves';
import { useValveStore } from '@/state/useValveStore';
import { closeAllPanels } from '@/state/panels';
import { concrete, steel, paintedMetal } from '@/materials/materials';
import { BRAND } from '@/theme/tokens';

/**
 * Operable line valves from the 2D reference flow, sitting on the existing
 * pipes. Three kinds: actuator-operated ball valve (AU — pneumatic actuator +
 * limit-switch box with a green/red position beacon), lever ball valve and
 * small-bore ball valve (yellow lever turns 90° across the pipe when shut).
 * Buried pipe → concrete valve chamber with the actuator / lever on an
 * extended stem. Click → valve panel (open / close / ESD).
 */
const OPEN_COL = new THREE.Color('#22c55e');
const SHUT_COL = new THREE.Color(BRAND.alert);

function Runner() {
  useFrame((_, dt) => useValveStore.getState().tick(Math.min(dt, 0.05)));
  return null;
}

function LineValve({ def }: { def: LineValveDef }) {
  const bodyMat = useMemo(() => steel({ color: def.kind === 'au' ? '#5d6b78' : '#a3aab1', roughness: 0.45, seed: 1700 }), [def.kind]);
  const flangeMat = useMemo(() => steel({ color: '#8b9299', roughness: 0.45, seed: 1701 }), []);
  const actMat = useMemo(() => paintedMetal('#f2c200', 1702), []);
  const leverMat = useMemo(() => paintedMetal('#e8b600', 1703), []);
  const padMat = useMemo(() => concrete('#a19d94', 1704), []);
  const hatchMat = useMemo(() => steel({ color: '#4c5257', roughness: 0.7, seed: 1705 }), []);
  const beaconMat = useMemo(() => new THREE.MeshStandardMaterial({ color: OPEN_COL, emissive: OPEN_COL, emissiveIntensity: 0.9, toneMapped: false }), []);
  const ringMat = useMemo(() => new THREE.MeshBasicMaterial({ color: BRAND.tealCng, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }), []);

  const lever = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);

  const r = Math.max(def.pipeR * (def.kind === 'small' ? 1.25 : 1.7), def.kind === 'small' ? 0.1 : 0.14);
  // body centre: on the pipe, or just above the chamber for buried lines
  const cy = def.buried ? 0.35 : def.position[1];
  const stemH = def.kind === 'au' ? r * 1.1 : r * 0.9;

  useFrame((state) => {
    const s = useValveStore.getState();
    const rt = s.rt[def.id];
    if (!rt) return;
    if (lever.current) lever.current.rotation.y = rt.ind * (Math.PI / 2);
    beaconMat.color.lerpColors(OPEN_COL, SHUT_COL, rt.ind);
    beaconMat.emissive.copy(beaconMat.color);
    if (ring.current) {
      const on = s.hoverId === def.id || s.panelId === def.id;
      ringMat.opacity = on ? 0.45 + Math.sin(state.clock.elapsedTime * 4) * 0.2 : 0;
      ring.current.visible = on;
    }
  });

  const onOver = (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); useValveStore.getState().setHover(def.id); document.body.style.cursor = 'pointer'; };
  const onOut = () => { useValveStore.getState().setHover(null); document.body.style.cursor = 'auto'; };
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    closeAllPanels();
    useValveStore.getState().openPanel(def.id);
  };

  return (
    <group position={[def.position[0], 0, def.position[2]]} rotation={[0, def.yaw, 0]}>
      <group onClick={onClick} onPointerOver={onOver} onPointerOut={onOut}>
        {/* generous invisible hit volume so small valves are easy to pick */}
        <mesh position={[0, cy + r, 0]} visible={false}>
          <boxGeometry args={[r * 5, r * 5 + 0.4, r * 5]} />
        </mesh>

        {def.buried ? (
          <group>
            {/* valve chamber: concrete collar + chequer-plate hatch + marker post */}
            <mesh position={[0, 0.06, 0]} receiveShadow castShadow material={padMat}>
              <boxGeometry args={[1.5, 0.12, 1.5]} />
            </mesh>
            <mesh position={[0, 0.125, 0]} material={hatchMat}>
              <boxGeometry args={[1.1, 0.02, 1.1]} />
            </mesh>
            <mesh position={[0.62, 0.55, 0.62]} castShadow material={actMat}>
              <boxGeometry args={[0.1, 1.1, 0.1]} />
            </mesh>
            <mesh position={[0, 0.2, 0]} material={flangeMat}>
              <cylinderGeometry args={[0.05, 0.05, 0.3, 8]} />
            </mesh>
          </group>
        ) : (
          def.position[1] - r > 0.25 && (
            <mesh position={[0, (def.position[1] - r) / 2, 0]} castShadow receiveShadow material={padMat}>
              <boxGeometry args={[r * 1.6, def.position[1] - r, r * 1.6]} />
            </mesh>
          )
        )}

        <group position={[0, cy, 0]}>
          {/* body + end flanges along local X */}
          <mesh castShadow material={bodyMat}>
            <sphereGeometry args={[r, 18, 14]} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={bodyMat}>
            <cylinderGeometry args={[r * 0.75, r * 0.75, r * 2.6, 16]} />
          </mesh>
          {[-1, 1].map((sx) => (
            <mesh key={sx} position={[sx * r * 1.3, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow material={flangeMat}>
              <cylinderGeometry args={[r * 1.0, r * 1.0, r * 0.22, 16]} />
            </mesh>
          ))}
          {/* stem / bonnet */}
          <mesh position={[0, r + stemH / 2 - r * 0.2, 0]} castShadow material={flangeMat}>
            <cylinderGeometry args={[r * 0.22, r * 0.3, stemH, 10]} />
          </mesh>

          {def.kind === 'au' ? (
            <group position={[0, r + stemH, 0]}>
              {/* rack-and-pinion pneumatic actuator */}
              <mesh position={[0, r * 0.35, 0]} castShadow material={actMat}>
                <boxGeometry args={[r * 2.4, r * 0.7, r * 0.9]} />
              </mesh>
              {[-1, 1].map((sx) => (
                <mesh key={sx} position={[sx * r * 1.25, r * 0.35, 0]} rotation={[0, 0, Math.PI / 2]} castShadow material={flangeMat}>
                  <cylinderGeometry args={[r * 0.42, r * 0.42, r * 0.12, 14]} />
                </mesh>
              ))}
              {/* limit-switch box + position beacon */}
              <mesh position={[0, r * 0.9, 0]} castShadow material={bodyMat}>
                <boxGeometry args={[r * 0.8, r * 0.4, r * 0.7]} />
              </mesh>
              <mesh position={[0, r * 1.22, 0]} material={beaconMat}>
                <cylinderGeometry args={[r * 0.26, r * 0.26, r * 0.24, 14]} />
              </mesh>
            </group>
          ) : (
            <group ref={lever} position={[0, r + stemH, 0]}>
              {/* quarter-turn lever: along the pipe = open, across = shut */}
              <mesh position={[r * 1.1, 0, 0]} castShadow material={leverMat}>
                <boxGeometry args={[r * 2.4, r * 0.16, r * 0.34]} />
              </mesh>
              <mesh position={[r * 2.3, 0, 0]} castShadow material={leverMat}>
                <boxGeometry args={[r * 0.4, r * 0.26, r * 0.42]} />
              </mesh>
              <mesh position={[0, r * 0.12, 0]} material={beaconMat}>
                <cylinderGeometry args={[r * 0.2, r * 0.2, r * 0.1, 12]} />
              </mesh>
            </group>
          )}
        </group>
      </group>

      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, def.buried ? 0.16 : 0.1, 0]} material={ringMat} visible={false}>
        <ringGeometry args={[Math.max(0.7, r * 3), Math.max(0.85, r * 3) + 0.15, 40]} />
      </mesh>
    </group>
  );
}

export function LineValves() {
  return (
    <group>
      <Runner />
      {LINE_VALVES.map((v) => (
        <LineValve key={v.id} def={v} />
      ))}
    </group>
  );
}
