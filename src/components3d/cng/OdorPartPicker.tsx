import { type ReactNode } from 'react';
import { type ThreeEvent } from '@react-three/fiber';
import { useOdorStore } from '@/state/useOdorStore';
import { useSelectionStore } from '@/state/useSelectionStore';
import { useRouteStore } from '@/state/useRouteStore';
import { useMeterStore } from '@/state/useMeterStore';
import { useStationInfoStore } from '@/state/useStationInfoStore';
import { useMotherInfoStore } from '@/state/useMotherInfoStore';
import { useDaughterInfoStore } from '@/state/useDaughterInfoStore';
import { useTrailerInfoStore } from '@/state/useTrailerInfoStore';

/** Section 06 — clickable wrapper opening the odorization-unit info panel and
 *  clearing every other selection panel. */
export function OdorPartPicker({ children }: { children: ReactNode }) {
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    useSelectionStore.getState().clear();
    useRouteStore.getState().clear();
    useMeterStore.getState().close();
    useStationInfoStore.getState().close();
    useMotherInfoStore.getState().close();
    useDaughterInfoStore.getState().close();
    useTrailerInfoStore.getState().close();
    useOdorStore.getState().open();
  };
  const onOver = (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; };
  const onOut = () => { document.body.style.cursor = 'auto'; };
  return (
    <group onClick={onClick} onPointerOver={onOver} onPointerOut={onOut}>
      {children}
    </group>
  );
}
