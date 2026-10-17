/**
 * Section 15 §E — per-DRS variation so the four (here three) kiosks don't look
 * cloned: different duty stream, different nameplate number, and one left with
 * its doors open by default (as if under inspection). Network position/pressures
 * come from config/network.ts and are unchanged.
 */
export interface DrsUnitDef {
  no: string; // nameplate number e.g. "DRS-01"
  dutyDefault: 1 | 2;
  doorsOpenDefault?: boolean; // under inspection
  weather: number; // 0..1 subtle dust variation
}

export const DRS_UNITS: Record<string, DrsUnitDef> = {
  drs1: { no: 'DRS-01', dutyDefault: 2, doorsOpenDefault: true, weather: 0.6 },
  drs2: { no: 'DRS-02', dutyDefault: 1, weather: 0.3 },
  drs3: { no: 'DRS-03', dutyDefault: 1, weather: 0.45 },
};
