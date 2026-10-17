import { type ReactNode } from 'react';
import { type ThreeEvent } from '@react-three/fiber';
import { useDaughterInfoStore, type DaughterPart } from '@/state/useDaughterInfoStore';
import { useStationInfoStore } from '@/state/useStationInfoStore';
import { useMotherInfoStore } from '@/state/useMotherInfoStore';
import { useTrailerInfoStore } from '@/state/useTrailerInfoStore';
import { useSelectionStore } from '@/state/useSelectionStore';
import { useRouteStore } from '@/state/useRouteStore';
import { useMeterStore } from '@/state/useMeterStore';

/** Clickable wrapper for Daughter/Booster station parts (Section 04). Opens the
 *  bespoke panel and clears every other selection panel. */
export function DaughterPartPicker({ part, children }: { part: DaughterPart; children: ReactNode }) {
  const open = useDaughterInfoStore((s) => s.open);
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    useSelectionStore.getState().clear();
    useRouteStore.getState().clear();
    useMeterStore.getState().close();
    useStationInfoStore.getState().close();
    useMotherInfoStore.getState().close();
    useTrailerInfoStore.getState().close();
    open(part);
  };
  const onOver = (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; };
  const onOut = () => { document.body.style.cursor = 'auto'; };
  return (
    <group onClick={onClick} onPointerOver={onOver} onPointerOut={onOut}>
      {children}
    </group>
  );
}
