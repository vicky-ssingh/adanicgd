import type { RtuDef } from '@/config/scadaLayout';

/**
 * Section 10 — PNG consumer-depth config. Three fully-detailed last-mile
 * connections (residential flat, commercial kitchen, industrial skid + boiler)
 * placed on open ground north of the city as a demonstration row, each with its
 * demand band and 24-hour demand profile. Additive — nothing in Sections 01–09 is
 * touched.
 */
export type ConsumerType = 'residential' | 'commercial' | 'industrial';

export interface ConsumerDef {
  type: ConsumerType;
  label: string; // headline (building / premises / facility)
  sub: string; // unit / premises detail
  pos: [number, number]; // world XZ
  rotation: number;
  pressure: string;
  meterType: string;
  min: number; // demand band (SCMH)
  max: number;
  peak: number;
  monthly: string;
  accent: string;
  camera: string;
}

export const CONSUMERS: ConsumerDef[] = [
  {
    type: 'residential', label: 'Elysium Tower A', sub: 'Flat 704 — Domestic',
    pos: [-58, 128], rotation: 0, pressure: '21 mbar', meterType: 'Diaphragm, G4',
    min: 0.5, max: 2.4, peak: 2.4, monthly: '38 SCM', accent: '#6C5AB8', camera: 'png-kitchen',
  },
  {
    type: 'commercial', label: "Shoppers' Plaza", sub: 'Food Court — Restaurant',
    pos: [-14, 130], rotation: 0, pressure: '100 mbar', meterType: 'Rotary, G25',
    min: 12, max: 42, peak: 42, monthly: '4,200 SCM', accent: '#0F8B8D', camera: 'png-commercial',
  },
  {
    type: 'industrial', label: 'Shantigram Industries', sub: 'Unit 3 — Steam Boiler',
    pos: [34, 132], rotation: 0, pressure: '4 Bar', meterType: 'Turbine, G400',
    min: 300, max: 680, peak: 680, monthly: '280,000 SCM', accent: '#BD3861', camera: 'png-industrial',
  },
];

export const CONSUMER_BY_TYPE = Object.fromEntries(CONSUMERS.map((c) => [c.type, c])) as Record<ConsumerType, ConsumerDef>;

/** Standalone RTU-16 for the industrial skid (renders a Section-09 cabinet; NOT
 *  added to the SCADA fleet so telemetry stats stay at 15 monitored RTUs). */
export const RTU16: RtuDef = {
  id: 'RTU-16', asset: 'Industrial PNG — Unit 3', pos: [39.5, 133.5], rotation: Math.PI,
  status: 'online', signalPct: 88, comms: '4G / GPRS', protocol: 'Modbus TCP',
  instruments: 10, battery: 90, encTemp: 40,
};

/** Instantaneous demand (SCMH) for a consumer type at a given hour-of-day. */
export function demandAt(type: ConsumerType, hour: number): number {
  const c = CONSUMER_BY_TYPE[type];
  const gauss = (h: number, mu: number, sig: number) => Math.exp(-((h - mu) ** 2) / (2 * sig * sig));
  if (type === 'residential') {
    // two cooking peaks (morning + evening), low overnight
    const f = Math.max(gauss(hour, 7.5, 1.1), gauss(hour, 20, 1.4)) * 0.9 + 0.06;
    return c.min + (c.max - c.min) * Math.min(1, f);
  }
  if (type === 'commercial') {
    // lunch + dinner peaks, broader and higher
    const f = Math.max(gauss(hour, 13, 1.7), gauss(hour, 20.5, 2.0)) * 0.92 + 0.18;
    return c.min + (c.max - c.min) * Math.min(1, f);
  }
  // industrial: flat, continuous, high, small dip at the 14:00 shift change
  const dip = 1 - 0.28 * gauss(hour, 14, 0.5);
  return c.min + (c.max - c.min) * (0.9 * dip);
}

/** 24-point demand profile for the info-panel sparkline. */
export function demandProfile(type: ConsumerType): number[] {
  return Array.from({ length: 24 }, (_, h) => demandAt(type, h));
}

/** Map sim elapsed seconds → hour-of-day (a full day every 120 s at 1×). */
export function hourOfDay(elapsed: number): number {
  return ((elapsed / 120) % 1) * 24;
}
