import { create } from 'zustand';
import { RTUS, type CommsStatus } from '@/config/scadaLayout';
import { useSvStore } from '@/state/useSvStore';
import { useEsdStore } from '@/state/useEsdStore';
import type { SvId } from '@/config/svStations';
import type { FacilityId } from '@/config/safetyLayout';

/**
 * Section 09 — SCADA / telemetry layer state. Holds the overlay toggle, the RTU /
 * control-centre info-panel selection, a live "packets today" counter, and the
 * REMOTE OPERATIONS confirmation flow. Remote actions CALL the existing Section-07
 * (SV) and Section-08 (ESD) store functions — they never duplicate that logic.
 */
export type RemoteReq =
  | { kind: 'sv-close'; id: SvId }
  | { kind: 'esd-trip'; id: FacilityId };

interface ScadaState {
  layerOn: boolean;
  rtuPanelId: string | null;
  centreOpen: boolean;
  packetsToday: number;
  remoteReq: RemoteReq | null;

  toggleLayer: () => void;
  setLayer: (on: boolean) => void;
  openRtu: (id: string) => void;
  closeRtu: () => void;
  openCentre: () => void;
  closeCentre: () => void;
  bumpPackets: (n: number) => void;
  requestRemote: (r: RemoteReq) => void;
  cancelRemote: () => void;
  confirmRemote: () => void;
}

// Base count so the counter looks like a full operating day already elapsed.
const BASE_PACKETS = 1_284_000;

export const useScadaStore = create<ScadaState>((set, get) => ({
  layerOn: false,
  rtuPanelId: null,
  centreOpen: false,
  packetsToday: BASE_PACKETS,
  remoteReq: null,

  toggleLayer: () => set((s) => ({ layerOn: !s.layerOn })),
  setLayer: (layerOn) => set({ layerOn }),
  openRtu: (rtuPanelId) => set({ rtuPanelId, centreOpen: false }),
  closeRtu: () => set({ rtuPanelId: null }),
  openCentre: () => set({ centreOpen: true, rtuPanelId: null }),
  closeCentre: () => set({ centreOpen: false, remoteReq: null }),
  bumpPackets: (n) => set((s) => ({ packetsToday: s.packetsToday + n })),
  requestRemote: (remoteReq) => set({ remoteReq }),
  cancelRemote: () => set({ remoteReq: null }),
  confirmRemote: () => {
    const req = get().remoteReq;
    if (!req) return;
    if (req.kind === 'sv-close') useSvStore.getState().confirmClose(req.id);
    else useEsdStore.getState().confirmTrip(req.id);
    set({ remoteReq: null });
  },
}));

/** Effective comms status for an RTU (config-driven; degraded stays degraded). */
export function rtuStatus(id: string): CommsStatus {
  return RTUS.find((r) => r.id === id)?.status ?? 'online';
}

/** Aggregate telemetry health for the dashboard widget (spec §8.1). */
export function telemetryStats() {
  const online = RTUS.filter((r) => r.status === 'online').length;
  const degraded = RTUS.filter((r) => r.status === 'degraded').length;
  const lost = RTUS.filter((r) => r.status === 'lost').length;
  const total = RTUS.length;
  const totalDataPoints = RTUS.reduce((a, r) => a + r.instruments, 0);
  // Data availability = packet-delivery success: full on healthy links, a small
  // hit per degraded/lost RTU (≈99.6% with one degraded unit — spec §7/§8.1).
  const availability = 100 - (lost * 100 + degraded * 6) / total;
  return { online, degraded, lost, total, totalDataPoints, availability };
}
