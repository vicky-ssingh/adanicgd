import { useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { generateCity } from '@/config/cityLayout';
import { useTooltipStore } from '@/state/useTooltipStore';
import { useViewStore } from '@/state/useViewStore';
import { useSimStore } from '@/state/useSimStore';
import type { BuildingCategory } from '@/components3d/city/Building';

/**
 * Pulsing gas-connection dots at every PNG building's service entry point
 * (Fix Problem 2C). A bright dot in the branch glow colour pulses 1.0→1.3→1.0;
 * hovering shows a "PNG Connection — Active | Flow: X SCMH" tooltip. Visual only.
 */

const COLOR: Record<BuildingCategory, string> = {
  residential: '#4db8ff',
  commercial: '#b066ff',
  industrial: '#ff9500',
  institutional: '#4db8ff',
};
const BASE_FLOW: Record<BuildingCategory, number> = {
  residential: 6,
  commercial: 45,
  industrial: 130,
  institutional: 25,
};

export function ConnectionDots() {
  const mode = useViewStore((s) => s.mode);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const show = useTooltipStore((s) => s.show);
  const hide = useTooltipStore((s) => s.hide);

  const dots = useMemo(() => {
    const city = generateCity();
    return city.buildings
      .filter((b) => b.width * b.depth >= 18)
      .slice(0, 90)
      .map((b) => ({
        pos: new THREE.Vector3(b.position[0], 1.4, b.position[2] + b.depth / 2 + 1.1),
        category: b.category as BuildingCategory,
        flow: Math.round(BASE_FLOW[b.category as BuildingCategory] * (0.7 + Math.random() * 0.6)),
      }));
  }, []);

  const colorArray = useMemo(() => {
    const arr = new Float32Array(dots.length * 3);
    const c = new THREE.Color();
    dots.forEach((d, i) => {
      c.set(COLOR[d.category]).multiplyScalar(1.8);
      arr[i * 3] = c.r;
      arr[i * 3 + 1] = c.g;
      arr[i * 3 + 2] = c.b;
    });
    return arr;
  }, [dots]);

  // PNG dots only show in PNG / BOTH mode.
  const visible = mode === 'PNG' || mode === 'BOTH';

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const pulse = 1 + 0.3 * (0.5 + 0.5 * Math.sin(state.clock.elapsedTime * Math.PI)); // 2s cycle
    dots.forEach((d, i) => {
      dummy.position.copy(d.pos);
      dummy.scale.setScalar(visible ? pulse : 0.0001);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  if (dots.length === 0) return null;

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (!visible) return;
    e.stopPropagation();
    const i = e.instanceId;
    if (i == null) return;
    const d = dots[i];
    const scmh = useSimStore.getState().playing ? d.flow : 0;
    show(e.nativeEvent.clientX, e.nativeEvent.clientY, `PNG Connection — Active  |  Flow: ${scmh} SCMH`);
    document.body.style.cursor = 'pointer';
  };
  const onOut = () => {
    hide();
    document.body.style.cursor = 'auto';
  };

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, dots.length]}
      frustumCulled={false}
      onPointerMove={onMove}
      onPointerOut={onOut}
    >
      <sphereGeometry args={[0.55, 14, 14]} />
      <meshBasicMaterial toneMapped={false} transparent opacity={0.95} />
      <instancedBufferAttribute attach="instanceColor" args={[colorArray, 3]} />
    </instancedMesh>
  );
}
