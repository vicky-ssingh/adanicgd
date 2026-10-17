import { useSelectionStore } from '@/state/useSelectionStore';
import { useRouteStore } from '@/state/useRouteStore';
import { useMeterStore } from '@/state/useMeterStore';
import { useStationInfoStore } from '@/state/useStationInfoStore';
import { useMotherInfoStore } from '@/state/useMotherInfoStore';
import { useDaughterInfoStore } from '@/state/useDaughterInfoStore';
import { useTrailerInfoStore } from '@/state/useTrailerInfoStore';
import { useOdorStore } from '@/state/useOdorStore';
import { useSvStore } from '@/state/useSvStore';
import { useMarkerStore } from '@/state/useMarkerStore';
import { usePigStore } from '@/state/usePigStore';
import { useEsdStore } from '@/state/useEsdStore';
import { useGasStore } from '@/state/useGasStore';
import { useCpStore } from '@/state/useCpStore';
import { useScadaStore } from '@/state/useScadaStore';
import { usePngConsumerStore } from '@/state/usePngConsumerStore';
import { useVanStore } from '@/components3d/cng/MaintenanceVehicle';
import { useValveStore } from '@/state/useValveStore';

/** Closes every info/selection panel — used before opening a new one so only one
 *  shows at a time (Section 08 and later). Does not touch layer toggles. */
export function closeAllPanels() {
  useSelectionStore.getState().clear();
  useRouteStore.getState().clear();
  useMeterStore.getState().close();
  useStationInfoStore.getState().close();
  useMotherInfoStore.getState().close();
  useDaughterInfoStore.getState().close();
  useTrailerInfoStore.getState().close();
  useOdorStore.getState().close();
  useSvStore.getState().closePanel();
  useMarkerStore.getState().close();
  usePigStore.getState().closePanel();
  useEsdStore.getState().closePanel();
  useGasStore.getState().closePanel();
  useCpStore.getState().closeInfo();
  useScadaStore.getState().closeRtu();
  useScadaStore.getState().closeCentre();
  usePngConsumerStore.getState().closePanel();
  useVanStore.getState().setOpen(false);
  useValveStore.getState().closePanel();
}
