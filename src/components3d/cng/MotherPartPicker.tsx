import { type ReactNode } from 'react';
import { type ThreeEvent } from '@react-three/fiber';
import { useMotherInfoStore, type MotherPart } from '@/state/useMotherInfoStore';
import { useStationInfoStore } from '@/state/useStationInfoStore';
import { useDaughterInfoStore } from '@/state/useDaughterInfoStore';
import { useTrailerInfoStore } from '@/state/useTrailerInfoStore';
import { useSelectionStore } from '@/state/useSelectionStore';
import { useRouteStore } from '@/state/useRouteStore';
import { useMeterStore } from '@/state/useMeterStore';

/**
 * Clickable wrapper for CNG Mother Station sub-assemblies (Section 02). Opens the
 * bespoke Mother info panel and clears every other selection panel (including the
 * Online Station's) so only one component panel is ever shown.
 */
export function MotherPartPicker({ part, children }: { part: MotherPart; children: ReactNode }) {
  const open = useMotherInfoStore((s) => s.open);

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    useSelectionStore.getState().clear();
    useRouteStore.getState().clear();
    useMeterStore.getState().close();
    useStationInfoStore.getState().close();
    useDaughterInfoStore.getState().close();
    useTrailerInfoStore.getState().close();
    open(part);
  };
  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
  };
  const onOut = () => {
    document.body.style.cursor = 'auto';
  };

  return (
    <group onClick={onClick} onPointerOver={onOver} onPointerOut={onOut}>
      {children}
    </group>
  );
}
