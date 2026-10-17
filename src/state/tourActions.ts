import type { TourAction } from '@/config/tour';
import { useRouteStore } from '@/state/useRouteStore';
import { useSelectionStore } from '@/state/useSelectionStore';
import { useOdorStore } from '@/state/useOdorStore';
import { useSvStore } from '@/state/useSvStore';
import { useStationStore } from '@/state/useStationStore';
import { useMotherStore } from '@/state/useMotherStore';
import { useTrailerStore } from '@/state/useTrailerStore';
import { useDaughterStore } from '@/state/useDaughterStore';
import { usePngConsumerStore } from '@/state/usePngConsumerStore';
import { useScadaStore } from '@/state/useScadaStore';
import { usePigStore } from '@/state/usePigStore';
import { useCpStore } from '@/state/useCpStore';
import { useGasStore } from '@/state/useGasStore';
import { useEsdStore } from '@/state/useEsdStore';
import { useSimStore } from '@/state/useSimStore';
import { useMarkerStore } from '@/state/useMarkerStore';
import { useXrayStore } from '@/state/useXrayStore';
import { useTourFxStore } from '@/state/useTourFxStore';
import { FACILITIES } from '@/config/safetyLayout';

/**
 * Section 11/13 Part D — guided-tour action orchestration. These helpers only CALL
 * the existing subsystem functions (never new logic) so a stop can demonstrate a
 * live action, and revert them all so exiting the tour leaves a clean state.
 */
export function clearAllTourEffects() {
  useStationStore.getState().stopRefuel();
  useMotherStore.getState().reset();
  useTrailerStore.getState().setFollow(null);
  useScadaStore.getState().setLayer(false);
  useDaughterStore.getState().setCompareOpen(false);
  useOdorStore.getState().close();
  useSvStore.getState().openValve('SV-02');
  usePigStore.getState().closePanel();
  useMarkerStore.getState().close();
  useGasStore.getState().stop();
  // reset any facility ESD tripped during the leak demo (also restores scenario)
  const fac = useEsdStore.getState().fac;
  for (const f of FACILITIES) if (fac[f.id].tripped) useEsdStore.getState().confirmReset(f.id);
  // turn the CP survey layer back off if the tour enabled it
  if (useCpStore.getState().surveyOn) useCpStore.getState().toggleSurvey();
  if (usePngConsumerStore.getState().burnersOn) usePngConsumerStore.getState().toggleBurners();
  usePngConsumerStore.getState().closePanel();
  // clear any tour-triggered scenario (SV/ESD sync handles their own)
  const sc = useSimStore.getState().scenario;
  if (sc === 'gas-leak') useSimStore.getState().setScenario('normal');
  // §14 framing FX — restore internal-flow + faded props
  useXrayStore.getState().set(false);
  useTourFxStore.getState().setPropOpacity(1);
  useTourFxStore.getState().setCutaway(false);
  useRouteStore.getState().clear();
  useSelectionStore.getState().clear();
}

/** §14 — per-stop framing reveals (internal-flow, prop fade). Reverts via
 *  clearAllTourEffects on the next stop / exit. */
export function applyStopFraming(opts: { xray?: boolean; fadeProps?: boolean }) {
  useXrayStore.getState().set(!!opts.xray);
  useTourFxStore.getState().setPropOpacity(opts.fadeProps ? 0.12 : 1);
}

function highlightRoute(edges: string[], title: string, flow: number, chain: string[]) {
  useRouteStore.getState().setRoute({ edges: new Set(edges), chain, title, flow });
}

export function applyStopAction(action?: TourAction) {
  switch (action) {
    case 'route-transmission':
      highlightRoute(['e-transmission', 'e-citygate-process'], 'TRANSMISSION PIPELINE', 47000, ['Transmission Pipeline', 'City Gate Station']);
      break;
    case 'route-primary':
      highlightRoute(['e-primary', 'e-secondary-1', 'e-secondary-2'], 'DISTRIBUTION HIERARCHY', 12500, ['Primary DN300', 'Secondary DN200', 'DRS network']);
      break;
    case 'markers':
      highlightRoute(['e-secondary-1'], 'BURIED PIPELINE ROUTE', 8000, ['Secondary Main', 'Route Markers']);
      break;
    case 'pig':
      usePigStore.getState().openPanel('PL-01');
      usePigStore.getState().start();
      break;
    case 'odor':
      useOdorStore.getState().open();
      break;
    case 'cp':
      if (!useCpStore.getState().surveyOn) useCpStore.getState().toggleSurvey();
      break;
    case 'sv-demo':
      useSvStore.getState().confirmClose('SV-02');
      break;
    case 'refuel':
      useStationStore.getState().startRefuel();
      break;
    case 'trailer-fill':
      useMotherStore.getState().start();
      break;
    case 'trailer-follow':
      useTrailerStore.getState().setFollow('CT-07');
      break;
    case 'compare':
      useDaughterStore.getState().setCompareOpen(true);
      break;
    case 'png-home':
      usePngConsumerStore.getState().openPanel('residential');
      if (!usePngConsumerStore.getState().burnersOn) usePngConsumerStore.getState().toggleBurners();
      break;
    case 'png-commercial':
      usePngConsumerStore.getState().openPanel('commercial');
      break;
    case 'png-industrial':
      usePngConsumerStore.getState().openPanel('industrial');
      break;
    case 'gas-leak':
      useSimStore.getState().setScenario('gas-leak'); // SafetyRunner auto-runs the leak → auto-ESD
      break;
    case 'cutaway':
      useTourFxStore.getState().setCutaway(true);
      break;
    case 'scada':
      useScadaStore.getState().setLayer(true);
      break;
    default:
      break;
  }
}
