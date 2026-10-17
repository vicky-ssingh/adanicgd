import { type ReactNode } from 'react';
import { type ThreeEvent } from '@react-three/fiber';
import { useStationInfoStore, type StationPart } from '@/state/useStationInfoStore';
import { useMotherInfoStore } from '@/state/useMotherInfoStore';
import { useDaughterInfoStore } from '@/state/useDaughterInfoStore';
import { useTrailerInfoStore } from '@/state/useTrailerInfoStore';
import { useSelectionStore } from '@/state/useSelectionStore';
import { useRouteStore } from '@/state/useRouteStore';
import { useMeterStore } from '@/state/useMeterStore';

/**
 * Makes a station sub-assembly clickable so it opens its own rich info panel
 * (Section 01 §3–§12). Stops the click from bubbling to the outer station
 * <Selectable>, and clears the generic selection / route / meter panels so only
 * the bespoke station panel shows.
 */
export function PartPicker({ part, children }: { part: StationPart; children: ReactNode }) {
  const open = useStationInfoStore((s) => s.open);

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    useSelectionStore.getState().clear();
    useRouteStore.getState().clear();
    useMeterStore.getState().close();
    useMotherInfoStore.getState().close();
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
