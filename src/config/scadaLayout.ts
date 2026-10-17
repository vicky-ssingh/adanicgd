import type { SvId } from '@/config/svStations';
import type { FacilityId } from '@/config/safetyLayout';

/**
 * Section 09 — SCADA / telemetry placement config. One RTU (Remote Terminal Unit)
 * at every monitored asset, plus the central SCADA Control Centre they all report
 * to. Positions are world XZ ground anchors matching the placed 3D assets; the
 * cabinet stands on posts 1.2 units up. Kept additive — no existing asset file
 * changes. `svId` / `facilityId` link an RTU to the Section-07 / Section-08 store
 * functions so the control centre can remotely operate it.
 */
export type CommsStatus = 'online' | 'degraded' | 'lost';

export interface RtuDef {
  id: string;
  asset: string; // monitored asset label
  pos: [number, number]; // world XZ ground anchor
  rotation: number;
  status: CommsStatus;
  signalPct: number;
  comms: string; // link technology
  protocol: string;
  instruments: number;
  battery: number;
  encTemp: number; // enclosure temperature °C
  svId?: SvId; // remote SV-close target (Section 07)
  facilityId?: FacilityId; // remote ESD-trip target (Section 08)
}

/** Central SCADA control centre — every RTU link converges here. */
export const CONTROL_CENTRE = {
  pos: [112, -60] as [number, number],
  rotation: -Math.PI / 2, // glass frontage faces the city (−X)
  ringY: 11,
  focus: { position: [128, 16, -40] as [number, number, number], target: [112, 4, -60] as [number, number, number] },
};

/**
 * 15 RTUs. Numbering preserves the spec's explicitly-referenced units
 * (RTU-07 Online CNG, RTU-09 Daughter degraded, RTU-11..14 SV, RTU-15 Odorization).
 * The scene has 3 DRS (not 4), so RTU-06 monitors the Metering skid instead.
 */
export const RTUS: RtuDef[] = [
  { id: 'RTU-01', asset: 'City Gate Station', pos: [112, -96], rotation: Math.PI, status: 'online', signalPct: 96, comms: '4G / GPRS', protocol: 'Modbus TCP', instruments: 22, battery: 94, encTemp: 39, facilityId: 'citygate' },
  { id: 'RTU-02', asset: 'PRS SKID', pos: [78, -97], rotation: Math.PI, status: 'online', signalPct: 93, comms: '4G / GPRS', protocol: 'Modbus TCP', instruments: 16, battery: 91, encTemp: 38 },
  { id: 'RTU-03', asset: 'DRS · North', pos: [50, -58], rotation: -0.4, status: 'online', signalPct: 90, comms: '4G / GPRS', protocol: 'Modbus TCP', instruments: 9, battery: 88, encTemp: 37 },
  { id: 'RTU-04', asset: 'DRS · Central', pos: [5, -14], rotation: -0.6, status: 'online', signalPct: 88, comms: '4G / GPRS', protocol: 'Modbus TCP', instruments: 9, battery: 90, encTemp: 37 },
  { id: 'RTU-05', asset: 'DRS · West', pos: [-53, 16], rotation: -0.8, status: 'online', signalPct: 79, comms: '4G / GPRS', protocol: 'Modbus TCP', instruments: 9, battery: 84, encTemp: 36 },
  { id: 'RTU-06', asset: 'Metering SKID', pos: [90, -97], rotation: Math.PI, status: 'online', signalPct: 95, comms: 'Fibre', protocol: 'Modbus TCP', instruments: 12, battery: 100, encTemp: 34 },
  { id: 'RTU-07', asset: 'Online CNG Station', pos: [72, 80], rotation: 0.4, status: 'online', signalPct: 84, comms: '4G / GPRS', protocol: 'Modbus TCP', instruments: 14, battery: 92, encTemp: 38, facilityId: 'online-cng' },
  { id: 'RTU-08', asset: 'CNG Mother Station', pos: [58, -158], rotation: 0.2, status: 'online', signalPct: 90, comms: '4G / GPRS', protocol: 'Modbus TCP', instruments: 26, battery: 96, encTemp: 40, facilityId: 'mother' },
  { id: 'RTU-09', asset: 'CNG Daughter Station', pos: [138, 48], rotation: 0.6, status: 'degraded', signalPct: 42, comms: '4G / GPRS', protocol: 'Modbus TCP', instruments: 11, battery: 71, encTemp: 44, facilityId: 'daughter' },
  { id: 'RTU-10', asset: 'Daughter Booster Station', pos: [-160, 30], rotation: 0.8, status: 'online', signalPct: 77, comms: '4G / GPRS', protocol: 'Modbus TCP', instruments: 13, battery: 86, encTemp: 41, facilityId: 'booster' },
  { id: 'RTU-11', asset: 'SV Station SV-01', pos: [63, -78], rotation: -0.5, status: 'online', signalPct: 88, comms: '4G / GPRS', protocol: 'Modbus TCP', instruments: 6, battery: 89, encTemp: 37, svId: 'SV-01' },
  { id: 'RTU-12', asset: 'SV Station SV-02', pos: [28, -53], rotation: -0.7, status: 'online', signalPct: 90, comms: '4G / GPRS', protocol: 'Modbus TCP', instruments: 6, battery: 92, encTemp: 36, svId: 'SV-02' },
  { id: 'RTU-13', asset: 'SV Station SV-03', pos: [-7, -15], rotation: -0.9, status: 'online', signalPct: 86, comms: '4G / GPRS', protocol: 'Modbus TCP', instruments: 6, battery: 83, encTemp: 36, svId: 'SV-03' },
  { id: 'RTU-14', asset: 'SV Station SV-04', pos: [-32, 7], rotation: -0.8, status: 'online', signalPct: 82, comms: '4G / GPRS', protocol: 'Modbus TCP', instruments: 6, battery: 80, encTemp: 35, svId: 'SV-04' },
  { id: 'RTU-15', asset: 'Odorization Unit', pos: [74, -84], rotation: Math.PI, status: 'online', signalPct: 92, comms: '4G / GPRS', protocol: 'Modbus TCP', instruments: 8, battery: 90, encTemp: 38 },
];

export const RTU_BY_ID = Object.fromEntries(RTUS.map((r) => [r.id, r])) as Record<string, RtuDef>;

/** The single deliberately-degraded unit (spec §5.3) for the demo. */
export const DEGRADED_RTU = 'RTU-09';

/** Cabinet-top world position where the comms link departs. */
export function rtuLinkOrigin(r: RtuDef): [number, number, number] {
  return [r.pos[0], 3.6, r.pos[1]];
}

/** A sensible fly-to camera for an RTU / asset when clicked from the log. */
export function rtuFocus(r: RtuDef): { position: [number, number, number]; target: [number, number, number] } {
  const [x, z] = r.pos;
  const dir = z >= 0 ? 1 : -1;
  return { position: [x + 14, 12, z + 16 * dir], target: [x, 3, z] };
}
