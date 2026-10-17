import { useMemo } from 'react';
import * as THREE from 'three';
import { concrete, paintedMetal } from '@/materials/materials';
import { SignPlane } from '@/components3d/branding/Branding';
import { RtuCabinet } from '@/components3d/scada/RtuCabinet';
import { RTU16 } from '@/config/pngConsumers';
import { usePngConsumerStore } from '@/state/usePngConsumerStore';
import { closeAllPanels } from '@/state/panels';

/**
 * Section 10 Part C — industrial PNG. A ground-level gas skid on a concrete pad
 * (NOT a wall-climbing pipe): inlet riser → main gear-operated ball valve → filter
 * → regulator → slam-shut → relief valve + vent stack → turbine meter + volume
 * corrector → outlet valve → outlet to the facility. Plus pipe supports, three
 * gauges, a temperature indicator, an instrument cabinet, an RTU-16 cabinet,
 * bollards, a gas detector, a fire extinguisher, an ESD button, signage, flow
 * arrows and earthing — and inside, a gas-fired steam boiler with a 2-valve
 * gas train and a flue through the roof. Clickable → industrial info panel.
 */
const GALV = new THREE.MeshStandardMaterial({ color: '#9aa1a8', metalness: 0.85, roughness: 0.45 });
const STEEL_B = new THREE.MeshStandardMaterial({ color: '#7d848b', metalness: 0.8, roughness: 0.4 });
const BLUE = new THREE.MeshStandardMaterial({ color: '#0b74b0', metalness: 0.5, roughness: 0.45 });
const YELLOW = new THREE.MeshStandardMaterial({ color: '#e8b600', metalness: 0.4, roughness: 0.5 });
const RED = new THREE.MeshStandardMaterial({ color: '#c01a1a', metalness: 0.2, roughness: 0.5 });
const BLACK = new THREE.MeshStandardMaterial({ color: '#16181c', metalness: 0.3, roughness: 0.6 });
const GAUGE = new THREE.MeshStandardMaterial({ color: '#f2f2f2', metalness: 0.1, roughness: 0.4 });
const COPPER = new THREE.MeshStandardMaterial({ color: '#b5732e', metalness: 0.7, roughness: 0.45 });
const HAZARD = new THREE.MeshStandardMaterial({ color: '#e8b600', metalness: 0.3, roughness: 0.6 });

function Gauge({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={GAUGE}><cylinderGeometry args={[0.07, 0.07, 0.03, 16]} /></mesh>
      <mesh position={[0, 0.03, 0]} material={BLACK}><boxGeometry args={[0.06, 0.008, 0.008]} /></mesh>
    </group>
  );
}
function Flange({ pos, r = 0.16 }: { pos: [number, number, number]; r?: number }) {
  return (
    <group position={pos}>
      <mesh rotation={[0, 0, Math.PI / 2]} material={STEEL_B}><cylinderGeometry args={[r, r, 0.05, 20]} /></mesh>
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={i} position={[0, Math.cos(i / 12 * Math.PI * 2) * (r - 0.03), Math.sin(i / 12 * Math.PI * 2) * (r - 0.03)]} material={BLACK}><cylinderGeometry args={[0.012, 0.012, 0.06, 6]} /></mesh>
      ))}
    </group>
  );
}
function Arrow({ pos, rot = 0 }: { pos: [number, number, number]; rot?: number }) {
  return <mesh position={pos} rotation={[0, 0, -Math.PI / 2 + rot]} material={new THREE.MeshBasicMaterial({ color: '#eaeaea', toneMapped: false })}><coneGeometry args={[0.04, 0.1, 8]} /></mesh>;
}

/** Gas-fired steam boiler with a 2-valve-in-series gas train + flue. */
function Boiler({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      {/* insulated shell with panel seams */}
      <mesh position={[0, 1.1, 0]} castShadow receiveShadow material={paintedMetal('#c9ccd0', 440)}><boxGeometry args={[2.0, 2.2, 1.5]} /></mesh>
      {[-0.6, 0, 0.6].map((y, i) => <mesh key={i} position={[0, 1.1 + y, 0.76]} material={STEEL_B}><boxGeometry args={[2.0, 0.02, 0.02]} /></mesh>)}
      <SignPlane text="STEAM BOILER — 2 TPH" width={1.6} position={[0, 1.7, 0.76]} options={{ fg: '#fff', bg: '#0b74b0', fontWeight: 700 }} />
      {/* burner housing + combustion air fan + sight glass */}
      <mesh position={[0, 0.7, 0.78]} rotation={[Math.PI / 2, 0, 0]} material={STEEL_B}><cylinderGeometry args={[0.22, 0.22, 0.4, 20]} /></mesh>
      <mesh position={[0.45, 0.7, 0.82]} material={GALV}><cylinderGeometry args={[0.18, 0.18, 0.18, 16]} /></mesh>
      <mesh position={[0, 0.7, 1.0]} material={new THREE.MeshStandardMaterial({ color: '#ff7a1a', emissive: new THREE.Color('#ff5500'), emissiveIntensity: 0.6 })}><circleGeometry args={[0.04, 12]} /></mesh>
      {/* gas train: 2 safety shutoff valves in series + pressure switch + regulator + leak-test point */}
      <group position={[-0.7, 0.5, 0.85]}>
        <mesh material={STEEL_B}><boxGeometry args={[1.0, 0.06, 0.06]} /></mesh>
        <mesh position={[-0.3, 0, 0]} material={BLUE}><boxGeometry args={[0.12, 0.14, 0.14]} /></mesh>
        <mesh position={[-0.05, 0, 0]} material={BLUE}><boxGeometry args={[0.12, 0.14, 0.14]} /></mesh>
        <mesh position={[0.2, 0.1, 0]} material={BLACK}><cylinderGeometry args={[0.04, 0.04, 0.1, 12]} /></mesh>
        <mesh position={[0.4, 0, 0]} material={GALV}><cylinderGeometry args={[0.07, 0.09, 0.12, 16]} /></mesh>
        <mesh position={[0.5, -0.06, 0]} material={RED}><cylinderGeometry args={[0.012, 0.012, 0.06, 8]} /></mesh>
      </group>
      {/* control panel */}
      <mesh position={[1.02, 1.1, 0]} material={BLACK}><boxGeometry args={[0.06, 0.5, 0.4]} /></mesh>
      <mesh position={[1.06, 1.2, 0]} material={new THREE.MeshStandardMaterial({ color: '#0a1420', emissive: new THREE.Color('#2a6ca8'), emissiveIntensity: 0.7 })}><boxGeometry args={[0.01, 0.18, 0.28]} /></mesh>
      {/* steam pipes with lagging + safety valve + gauge */}
      <mesh position={[-0.6, 2.3, 0]} rotation={[0, 0, Math.PI / 2]} material={paintedMetal('#e6e6e6', 441)}><cylinderGeometry args={[0.09, 0.09, 1.2, 12]} /></mesh>
      <mesh position={[0.5, 2.35, 0]} material={STEEL_B}><cylinderGeometry args={[0.05, 0.05, 0.25, 10]} /></mesh>
      <Gauge pos={[0.7, 2.2, 0.4]} />
      {/* flue through the roof */}
      <mesh position={[0.6, 2.9, -0.4]} material={STEEL_B}><cylinderGeometry args={[0.25, 0.25, 2.2, 16]} /></mesh>
      <mesh position={[0.6, 4.1, -0.4]} material={STEEL_B}><cylinderGeometry args={[0.28, 0.25, 0.2, 16]} /></mesh>
      {/* facility shed enclosing the boiler (open front) */}
      <mesh position={[0, 1.6, -1.0]} material={paintedMetal('#d8d4c8', 442)}><boxGeometry args={[3.2, 3.2, 0.12]} /></mesh>
      <mesh position={[-1.6, 1.6, -0.2]} material={paintedMetal('#d8d4c8', 443)}><boxGeometry args={[0.12, 3.2, 1.8]} /></mesh>
      <mesh position={[0, 3.3, -0.2]} material={STEEL_B}><boxGeometry args={[3.3, 0.12, 2.0]} /></mesh>
    </group>
  );
}

export function IndustrialSkid({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const padMat = useMemo(() => concrete('#b6b2a8', 430), []);
  const onClick = (e: { stopPropagation: () => void }) => { e.stopPropagation(); closeAllPanels(); usePngConsumerStore.getState().openPanel('industrial'); };
  const cursor = (v: string) => (e: { stopPropagation: () => void }) => { e.stopPropagation(); document.body.style.cursor = v; };

  // skid header pipe height
  const hy = 0.9;
  return (
    <group position={position} rotation={[0, rotation, 0]} onClick={onClick} onPointerOver={cursor('pointer')} onPointerOut={() => (document.body.style.cursor = 'auto')}>
      {/* concrete pad 5.0 × 2.5 with yellow perimeter + chamfer + anchor points */}
      <mesh position={[0, 0.15, 0]} receiveShadow material={padMat}><boxGeometry args={[5.0, 0.3, 2.5]} /></mesh>
      <mesh position={[0, 0.31, 0]} material={HAZARD}><boxGeometry args={[4.9, 0.02, 2.4]} /></mesh>
      <mesh position={[0, 0.32, 0]} material={padMat}><boxGeometry args={[4.6, 0.02, 2.1]} /></mesh>
      {[[-2.2, -1.0], [2.2, -1.0], [-2.2, 1.0], [2.2, 1.0]].map((p, i) => (
        <mesh key={i} position={[p[0], 0.33, p[1]]} material={BLACK}><cylinderGeometry args={[0.03, 0.03, 0.04, 8]} /></mesh>
      ))}

      {/* galvanised frame + cross-bracing */}
      {[[-2.3, -1.1], [2.3, -1.1], [-2.3, 1.1], [2.3, 1.1]].map((p, i) => (
        <mesh key={i} position={[p[0], 1.0, p[1]]} material={GALV}><boxGeometry args={[0.1, 1.6, 0.1]} /></mesh>
      ))}
      <mesh position={[0, 1.75, -1.1]} material={GALV}><boxGeometry args={[4.7, 0.1, 0.1]} /></mesh>
      <mesh position={[0, 1.75, 1.1]} material={GALV}><boxGeometry args={[4.7, 0.1, 0.1]} /></mesh>
      <mesh position={[-2.3, 1.0, 0]} rotation={[Math.PI / 4, 0, 0]} material={STEEL_B}><boxGeometry args={[0.06, 0.06, 2.9]} /></mesh>

      {/* main header pipe along the pad */}
      <mesh position={[0, hy, 0]} rotation={[0, 0, Math.PI / 2]} material={STEEL_B}><cylinderGeometry args={[0.075, 0.075, 4.4, 16]} /></mesh>

      {/* 1 — inlet riser from underground with a bend */}
      <group position={[-2.3, 0, 0.6]}>
        <mesh position={[0, 0.4, 0]} material={STEEL_B}><cylinderGeometry args={[0.075, 0.075, 0.9, 16]} /></mesh>
        <mesh position={[0, 0.85, 0.1]} rotation={[Math.PI / 4, 0, 0]} material={STEEL_B}><cylinderGeometry args={[0.075, 0.075, 0.3, 16]} /></mesh>
        <mesh position={[0.15, hy, 0.15]} rotation={[0, 0, Math.PI / 2]} material={STEEL_B}><cylinderGeometry args={[0.075, 0.075, 0.4, 16]} /></mesh>
      </group>
      <Gauge pos={[-2.15, hy + 0.2, 0.2]} />

      {/* 2 — main isolation ball valve, gear-operated handwheel, flanges */}
      <group position={[-1.75, hy, 0]}>
        <Flange pos={[-0.2, 0, 0]} />
        <mesh material={BLUE}><sphereGeometry args={[0.14, 16, 12]} /></mesh>
        <Flange pos={[0.2, 0, 0]} />
        <mesh position={[0, 0.18, 0]} material={STEEL_B}><boxGeometry args={[0.1, 0.14, 0.1]} /></mesh>
        <mesh position={[0, 0.34, 0]} rotation={[Math.PI / 2, 0, 0]} material={BLACK}><torusGeometry args={[0.15, 0.015, 8, 20]} /></mesh>
      </group>

      {/* 3 — filter vessel + DP gauge + drain */}
      <group position={[-1.15, hy, 0]}>
        <mesh position={[0, 0.15, 0]} material={STEEL_B}><cylinderGeometry args={[0.17, 0.17, 0.5, 20]} /></mesh>
        <mesh position={[0, 0.42, 0]} material={STEEL_B}><sphereGeometry args={[0.17, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
        <mesh position={[0, -0.18, 0]} material={STEEL_B}><cylinderGeometry args={[0.03, 0.03, 0.12, 8]} /></mesh>
        <Gauge pos={[0.18, 0.3, 0]} />
      </group>

      {/* 4 — pressure regulator (bell housing + spring dome + adjustment cap + pilot loop) */}
      <group position={[-0.5, hy, 0]}>
        <mesh material={STEEL_B}><cylinderGeometry args={[0.14, 0.16, 0.2, 16]} /></mesh>
        <mesh position={[0, 0.2, 0]} material={STEEL_B}><sphereGeometry args={[0.16, 16, 10]} /></mesh>
        <mesh position={[0, 0.38, 0]} material={BLACK}><cylinderGeometry args={[0.04, 0.04, 0.06, 12]} /></mesh>
        <mesh position={[0.2, 0.2, 0]} rotation={[0, 0, 0.6]} material={COPPER}><torusGeometry args={[0.12, 0.008, 6, 16, Math.PI]} /></mesh>
      </group>

      {/* 5 — slam-shut valve + reset lever + indicator flag */}
      <group position={[0.0, hy, 0]}>
        <mesh material={RED}><boxGeometry args={[0.16, 0.2, 0.16]} /></mesh>
        <mesh position={[0.12, 0.14, 0]} rotation={[0, 0, -0.6]} material={BLACK}><cylinderGeometry args={[0.012, 0.012, 0.18, 8]} /></mesh>
        <mesh position={[0, 0.16, 0.1]} material={new THREE.MeshBasicMaterial({ color: '#39d98a', toneMapped: false })}><boxGeometry args={[0.05, 0.05, 0.01]} /></mesh>
      </group>
      <Gauge pos={[0.35, hy + 0.2, 0]} />

      {/* 6 — relief valve + vent stack 3.5 tall + rain cap + hazard band */}
      <group position={[0.5, hy, -0.3]}>
        <mesh material={STEEL_B}><boxGeometry args={[0.1, 0.14, 0.1]} /></mesh>
        <mesh position={[0, 1.75, 0]} material={STEEL_B}><cylinderGeometry args={[0.04, 0.04, 3.5, 12]} /></mesh>
        <mesh position={[0, 1.4, 0]} material={HAZARD}><cylinderGeometry args={[0.045, 0.045, 0.3, 12]} /></mesh>
        <mesh position={[0, 3.55, 0]} material={STEEL_B}><coneGeometry args={[0.08, 0.1, 12]} /></mesh>
      </group>

      {/* 7 — turbine meter + index head + electronic volume corrector box */}
      <group position={[1.1, hy, 0]}>
        <Flange pos={[-0.25, 0, 0]} r={0.13} />
        <mesh rotation={[0, 0, Math.PI / 2]} material={STEEL_B}><cylinderGeometry args={[0.11, 0.11, 0.5, 20]} /></mesh>
        <Flange pos={[0.25, 0, 0]} r={0.13} />
        <mesh position={[0, 0.18, 0]} material={BLACK}><boxGeometry args={[0.14, 0.12, 0.12]} /></mesh>
        <mesh position={[0, 0.26, 0.02]} material={GAUGE}><boxGeometry args={[0.08, 0.05, 0.01]} /></mesh>
        <mesh position={[0.28, 0.12, 0.16]} material={BLUE}><boxGeometry args={[0.14, 0.18, 0.06]} /></mesh>
        <SignPlane text="G400" width={0.14} position={[0.28, 0.12, 0.2]} options={{ fg: '#fff', bg: '#0b74b0', fontWeight: 700 }} />
      </group>

      {/* 8 — outlet isolation valve (flanged, lever) */}
      <group position={[1.7, hy, 0]}>
        <Flange pos={[-0.15, 0, 0]} r={0.12} />
        <mesh material={BLUE}><boxGeometry args={[0.14, 0.16, 0.14]} /></mesh>
        <mesh position={[0.08, 0.12, 0]} rotation={[0, 0, -0.5]} material={BLACK}><cylinderGeometry args={[0.012, 0.012, 0.16, 8]} /></mesh>
      </group>
      {/* 9 — outlet to building with penetration sleeve */}
      <group position={[2.2, hy, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} material={STEEL_B}><cylinderGeometry args={[0.07, 0.07, 0.5, 16]} /></mesh>
        <mesh position={[0.3, -0.3, 0]} material={STEEL_B}><cylinderGeometry args={[0.07, 0.07, 0.6, 16]} /></mesh>
      </group>

      {/* flow direction arrows on the pipework */}
      {[-1.4, -0.85, 0.6, 1.45].map((x, i) => <Arrow key={i} pos={[x, hy + 0.13, 0]} />)}

      {/* pipe supports with U-bolts every ~1u */}
      {[-1.5, -0.4, 0.7, 1.6].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <mesh position={[0, 0.55, 0]} material={GALV}><boxGeometry args={[0.06, 0.7, 0.06]} /></mesh>
          <mesh position={[0, hy, 0]} rotation={[Math.PI / 2, 0, 0]} material={BLACK}><torusGeometry args={[0.09, 0.012, 6, 12, Math.PI]} /></mesh>
        </group>
      ))}

      {/* temperature indicator + thermowell */}
      <group position={[0.8, hy + 0.15, 0.12]}>
        <mesh material={GAUGE}><boxGeometry args={[0.06, 0.06, 0.02]} /></mesh>
        <mesh position={[0, -0.12, 0]} material={STEEL_B}><cylinderGeometry args={[0.015, 0.015, 0.14, 8]} /></mesh>
      </group>

      {/* instrument cabinet + conduit */}
      <group position={[-2.0, 0, -1.0]}>
        <mesh position={[0, 0.9, 0]} material={paintedMetal('#8b9298', 431)}><boxGeometry args={[0.5, 0.7, 0.25]} /></mesh>
        <mesh position={[0, 1.0, 0.13]} material={new THREE.MeshStandardMaterial({ color: '#0a1420', emissive: new THREE.Color('#2a6ca8'), emissiveIntensity: 0.6 })}><boxGeometry args={[0.3, 0.18, 0.01]} /></mesh>
        <mesh position={[0.2, 0.4, 0]} material={GALV}><cylinderGeometry args={[0.02, 0.02, 0.9, 8]} /></mesh>
      </group>

      {/* RTU-16 cabinet (Section 09 link) */}
      <group position={[-3.0, 0, -1.4]} scale={0.9}>
        <RtuCabinet rtu={RTU16} />
      </group>

      {/* 4 protective bollards */}
      {[[-2.6, -1.4], [2.6, -1.4], [-2.6, 1.4], [2.6, 1.4]].map((p, i) => (
        <mesh key={i} position={[p[0], 0.5, p[1]]} material={YELLOW}><cylinderGeometry args={[0.08, 0.08, 1.0, 12]} /></mesh>
      ))}

      {/* gas detector on frame + fire extinguisher on stand + ESD button on post */}
      <group position={[2.3, 1.6, 1.1]}>
        <mesh material={STEEL_B}><cylinderGeometry args={[0.05, 0.05, 0.12, 12]} /></mesh>
        <mesh position={[0, -0.08, 0]} material={new THREE.MeshStandardMaterial({ color: '#0a0a0a', emissive: new THREE.Color('#39d98a'), emissiveIntensity: 1 })}><cylinderGeometry args={[0.02, 0.02, 0.01, 8]} /></mesh>
      </group>
      <group position={[2.9, 0, 1.0]}>
        <mesh position={[0, 0.35, 0]} material={RED}><cylinderGeometry args={[0.08, 0.08, 0.5, 16]} /></mesh>
        <mesh position={[0, 0.05, 0]} material={BLACK}><boxGeometry args={[0.3, 0.05, 0.3]} /></mesh>
      </group>
      <group position={[2.9, 0, -0.4]}>
        <mesh position={[0, 0.7, 0]} material={STEEL_B}><cylinderGeometry args={[0.04, 0.04, 1.4, 8]} /></mesh>
        <mesh position={[0, 1.35, 0.05]} material={YELLOW}><boxGeometry args={[0.16, 0.16, 0.08]} /></mesh>
        <mesh position={[0, 1.35, 0.1]} material={RED}><cylinderGeometry args={[0.05, 0.05, 0.03, 16]} /></mesh>
        <SignPlane text="ESD" width={0.14} position={[0, 1.18, 0.06]} options={{ fg: '#fff', bg: '#c01a1a', fontWeight: 800 }} />
      </group>

      {/* earthing conductor to ground rod */}
      <mesh position={[-2.5, 0.4, 1.2]} rotation={[0, 0, 0.2]} material={COPPER}><cylinderGeometry args={[0.01, 0.01, 0.9, 6]} /></mesh>

      {/* signage board */}
      <group position={[0, 0, 1.5]}>
        <mesh position={[0, 1.0, 0]} material={STEEL_B}><boxGeometry args={[0.06, 2.0, 0.06]} /></mesh>
        <SignPlane text="ADANI TOTAL GAS — INDUSTRIAL PNG CONNECTION" width={2.4} position={[0, 1.9, 0.04]} options={{ fg: '#fff', bg: '#0b74b0', fontWeight: 800, letterSpacing: 0.5 }} />
        <SignPlane text="DANGER — NATURAL GAS · NO SMOKING" width={2.0} position={[0, 1.6, 0.04]} options={{ fg: '#111', bg: '#e8b600', fontWeight: 800 }} />
        <SignPlane text="EMERGENCY 1800-XXX-XXXX · UNIT 3" width={1.8} position={[0, 1.36, 0.04]} options={{ fg: '#fff', bg: '#16181c', fontWeight: 600 }} />
      </group>

      {/* end-use boiler inside the facility */}
      <Boiler pos={[3.6, 0, -2.6]} />

      {/* headline sign */}
      <SignPlane text="SHANTIGRAM INDUSTRIES — UNIT 3 · INDUSTRIAL PNG" width={4.8} position={[0, 0.42, 2.0]} options={{ fg: '#fff', bg: '#BD3861', fontWeight: 800, letterSpacing: 1 }} />
    </group>
  );
}
