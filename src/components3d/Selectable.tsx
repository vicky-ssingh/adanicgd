import { useRef, type ReactNode } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useSelectionStore } from '@/state/useSelectionStore';
import { useViewStore } from '@/state/useViewStore';
import { BRAND } from '@/theme/tokens';

/**
 * Wraps a major asset to make it clickable/inspectable (spec §2.24). On click it
 * selects the node (opening the InfoPanel) and smoothly flies the camera to it;
 * hover shows a highlight ring and pointer cursor. `radius` sizes the ground
 * ring and the framing distance.
 */
export function Selectable({
  id,
  position = [0, 0, 0],
  rotation = 0,
  radius = 3,
  onSelect,
  children,
}: {
  id: string;
  position?: [number, number, number];
  rotation?: number;
  radius?: number;
  onSelect?: () => void;
  children: ReactNode;
}) {
  const selectedId = useSelectionStore((s) => s.selectedId);
  const hoveredId = useSelectionStore((s) => s.hoveredId);
  const select = useSelectionStore((s) => s.select);
  const hover = useSelectionStore((s) => s.hover);
  const focusOn = useViewStore((s) => s.focusOn);

  const groupRef = useRef<THREE.Group>(null);
  const active = selectedId === id;
  const hovered = hoveredId === id;

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    select(id);
    // Use the asset's WORLD position (it may sit under a transformed parent).
    const w = new THREE.Vector3();
    (groupRef.current ?? (e.eventObject as THREE.Object3D)).getWorldPosition(w);
    const t: [number, number, number] = [w.x, w.y + 1.2, w.z];
    const d = radius * 2.6 + 4;
    focusOn([w.x + d, w.y + radius * 1.6 + 4, w.z + d], t);
    onSelect?.();
  };
  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    hover(id);
    document.body.style.cursor = 'pointer';
  };
  const onOut = () => {
    hover(null);
    document.body.style.cursor = 'auto';
  };

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      <group onClick={onClick} onPointerOver={onOver} onPointerOut={onOut}>
        {children}
      </group>
      {(active || hovered) && <Ring radius={radius} active={active} />}
    </group>
  );
}

function Ring({ radius, active }: { radius: number; active: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ref.current) {
      const s = 1 + Math.sin(t * 3) * 0.03;
      ref.current.scale.set(s, s, s);
    }
    if (mat.current) {
      mat.current.opacity = active ? 0.55 + Math.sin(t * 3) * 0.2 : 0.3;
    }
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.15, 0]}>
      <ringGeometry args={[radius, radius + 0.35, 48]} />
      <meshBasicMaterial
        ref={mat}
        color={active ? BRAND.tealCng : BRAND.primarySoft}
        transparent
        opacity={0.4}
        side={THREE.DoubleSide}
        toneMapped={false}
        depthWrite={false}
      />
    </mesh>
  );
}
