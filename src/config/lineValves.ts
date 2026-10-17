import { NETWORK } from '@/config/network';

/**
 * Operable line valves taken from the 2D CGD value-chain reference
 * (refrence/2D-CGD/natural-gas-distribution-flow.html). Each valve sits on an
 * existing pipe — network-edge valves are placed by distance along the edge
 * polyline so they stay on the pipe; PNG last-mile valves use explicit points on
 * the consumer service lines. Closing a valve isolates the listed network nodes
 * (engine → flow 0) and/or stops the gas on a consumer service line.
 */
export type ValveKind = 'au' | 'ball' | 'small';
export type ServiceLine = 'residential' | 'commercial' | 'industrial' | 'laboratory';

export interface LineValveDef {
  id: string;
  tag: string;
  name: string;
  kind: ValveKind;
  kicker: string;
  pressure: string;
  size: string;
  desc: string;
  facts: string[];
  position: [number, number, number];
  /** Rotation about Y so the valve's local X runs along the pipe. */
  yaw: number;
  /** Pipe outer radius at the valve — sizes the body. */
  pipeR: number;
  /** Below-grade pipe → valve chamber with extended stem. */
  buried: boolean;
  /** Network nodes that lose supply when this valve is shut. */
  isolates: string[];
  /** Consumer service lines that lose supply when this valve is shut. */
  lines: ServiceLine[];
  /** Human-readable downstream extent. */
  affected: string;
  /** Closed by the "ESD — close all isolation valves" command. */
  esd: boolean;
}

/** Point + yaw at `dist` units along an edge polyline. */
function along(edgeId: string, dist: number): { p: [number, number, number]; yaw: number } {
  const e = NETWORK.edges.find((x) => x.id === edgeId);
  if (!e) throw new Error(`lineValves: unknown edge ${edgeId}`);
  let left = dist;
  for (let i = 0; i < e.points.length - 1; i++) {
    const a = e.points[i];
    const b = e.points[i + 1];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const dz = b[2] - a[2];
    const len = Math.hypot(dx, dy, dz);
    if (left <= len || i === e.points.length - 2) {
      const k = Math.min(1, left / len);
      return { p: [a[0] + dx * k, a[1] + dy * k, a[2] + dz * k], yaw: Math.atan2(-dz, dx) };
    }
    left -= len;
  }
  return { p: e.points[0], yaw: 0 };
}

const AU_FACTS = [
  'Pneumatic actuator lets it be opened or shut remotely from SCADA.',
  'Closes automatically on an emergency shutdown signal.',
  'Limit-switch box reports open / closed position to the control room.',
];
const BALL_FACTS = [
  'Quarter-turn: a 90° move of the lever takes it fully open or fully shut.',
  'Full-bore, so it adds almost no pressure drop when open.',
  'Lever in line with the pipe = open; across it = shut.',
];

const PNG_LAST_MILE = ['sr-dom', 'sr-com', 'mrs', 'laboratory'];
const DOWNSTREAM_ALL = ['citygate', 'filtration', 'metering', 'prs', 'gc', 'drs1', 'drs2', 'drs3', 'cng-station', 'mother-station', 'mfm-mother', 'png-zone', ...PNG_LAST_MILE];
const ALL_LINES: ServiceLine[] = ['residential', 'commercial', 'industrial', 'laboratory'];

const inlet = along('e-transmission', 17);
const outlet = along('e-primary', 2.2);
const cngIso = along('e-cng-spur', 39);
const onlineAu = along('e-cng-spur', 19.3 + 49.2 + 80 + 30);
const motherAu = along('e-mother-spur', 15.6 + 3);
const pngIso = along('e-primary', 14.6 + 17.9 + 3.7);

const isBuried = (y: number) => y < 0.3;
const surf = (p: [number, number, number]): [number, number, number] => [p[0], Math.max(p[1], 0), p[2]];

export const LINE_VALVES: LineValveDef[] = [
  {
    id: 'V-101', tag: 'XV-1001', name: 'CGS Inlet Isolation Valve', kind: 'au',
    kicker: 'Isolation — City Gate inlet', pressure: '28 bar', size: '8″',
    desc: 'Full-bore actuated isolation valve on the steel transmission line just upstream of the City Gate Station. Closing it cuts the transmission supply to the whole city network.',
    facts: [...AU_FACTS, 'Lets the CGS be isolated for maintenance without depressurising the trunk.'],
    position: inlet.p, yaw: inlet.yaw, pipeR: 0.34, buried: false,
    isolates: DOWNSTREAM_ALL, lines: ALL_LINES, affected: 'the entire city network', esd: true,
  },
  {
    id: 'V-102', tag: 'XV-1002', name: 'CGS Outlet Isolation Valve', kind: 'au',
    kicker: 'Isolation — City Gate outlet', pressure: '19 bar', size: '8″',
    desc: 'Isolation valve on the outlet main after the PRS and the odorant injection point. Only odorised gas passes it; shutting it isolates the city network from the station.',
    facts: [...AU_FACTS, 'Interlocked with the station ESD system.'],
    position: outlet.p, yaw: outlet.yaw, pipeR: 0.18, buried: false,
    isolates: ['drs1', 'drs2', 'drs3', 'cng-station', 'mother-station', 'mfm-mother', 'png-zone', ...PNG_LAST_MILE], lines: ALL_LINES,
    affected: 'all CNG and PNG supply downstream of the CGS', esd: true,
  },
  {
    id: 'V-201', tag: 'HV-2001', name: 'CNG Network Isolation Valve', kind: 'ball',
    kicker: 'Isolation — CNG feeder', pressure: '19 bar', size: '6″',
    desc: 'Buried ball valve in a valve chamber on the dedicated CNG feeder. Operated from the surface through an extended stem; isolates the Online CNG Station feeder.',
    facts: [...BALL_FACTS, 'Valve chamber with extended stem — no excavation needed to operate it.'],
    position: surf(cngIso.p), yaw: cngIso.yaw, pipeR: 0.11, buried: isBuried(cngIso.p[1]),
    isolates: ['cng-station'], lines: [], affected: 'the Online CNG Station', esd: true,
  },
  {
    id: 'V-202', tag: 'XV-2002', name: 'Online Station Inlet Actuator Operating Valve', kind: 'au',
    kicker: 'Isolation — Online station inlet', pressure: '19 bar', size: '4″',
    desc: 'Actuator-operated valve at the Online CNG Station inlet. It shuts the station off the feeder on an ESD or from SCADA.',
    facts: AU_FACTS,
    position: surf(onlineAu.p), yaw: onlineAu.yaw, pipeR: 0.11, buried: isBuried(onlineAu.p[1]),
    isolates: ['cng-station'], lines: [], affected: 'the Online CNG Station', esd: true,
  },
  {
    id: 'V-203', tag: 'XV-2003', name: 'Mother Station Inlet Actuator Operating Valve', kind: 'au',
    kicker: 'Isolation — Mother station inlet', pressure: '24 bar', size: '6″',
    desc: 'Actuator-operated valve on the HP feeder to the CNG Mother Station. Shutting it stops compression and cascade filling.',
    facts: AU_FACTS,
    position: surf(motherAu.p), yaw: motherAu.yaw, pipeR: 0.18, buried: isBuried(motherAu.p[1]),
    isolates: ['mother-station', 'mfm-mother'], lines: [], affected: 'the CNG Mother Station', esd: true,
  },
  {
    id: 'V-301', tag: 'XV-3001', name: 'PNG Network Isolation Valve', kind: 'au',
    kicker: 'Isolation — PNG primary main', pressure: '19 bar', size: '6″',
    desc: 'Actuated isolation valve on the primary steel main ahead of the District Regulating Stations. Shutting it isolates the whole PNG side.',
    facts: AU_FACTS,
    position: pngIso.p, yaw: pngIso.yaw, pipeR: 0.18, buried: false,
    isolates: ['drs1', 'drs2', 'drs3', 'png-zone', ...PNG_LAST_MILE], lines: ALL_LINES, affected: 'all PNG consumers', esd: true,
  },
  // ── PNG last mile (service lines run along +Z: yaw = -π/2) ──
  {
    id: 'V-401', tag: 'HV-4001', name: 'Domestic SR Inlet Ball Valve', kind: 'ball',
    kicker: 'Isolation — Domestic service regulator', pressure: '4 bar', size: '1″',
    desc: 'Ball valve ahead of the domestic service regulator. Isolates the regulator for maintenance.',
    facts: BALL_FACTS,
    position: [-58, 0.16, 119.4], yaw: -Math.PI / 2, pipeR: 0.09, buried: false,
    isolates: ['sr-dom'], lines: ['residential'], affected: 'the residential connection', esd: false,
  },
  {
    id: 'V-402', tag: 'HV-4002', name: 'Domestic SR Outlet Ball Valve', kind: 'ball',
    kicker: 'Isolation — Domestic service regulator', pressure: '100 mbar', size: '1″',
    desc: 'Ball valve after the domestic service regulator on the 100 mbar line to the meter.',
    facts: BALL_FACTS,
    position: [-58, 0.16, 122.6], yaw: -Math.PI / 2, pipeR: 0.09, buried: false,
    isolates: [], lines: ['residential'], affected: 'the residential connection', esd: false,
  },
  {
    id: 'V-411', tag: 'HV-4011', name: 'Commercial SR Inlet Ball Valve', kind: 'ball',
    kicker: 'Isolation — Commercial service regulator', pressure: '4 bar', size: '1½″',
    desc: 'Ball valve ahead of the commercial service regulator.',
    facts: BALL_FACTS,
    position: [-14, 0.16, 119.6], yaw: -Math.PI / 2, pipeR: 0.13, buried: false,
    isolates: ['sr-com'], lines: ['commercial'], affected: 'the commercial kitchen', esd: false,
  },
  {
    id: 'V-412', tag: 'HV-4012', name: 'Commercial SR Outlet Ball Valve', kind: 'ball',
    kicker: 'Isolation — Commercial service regulator', pressure: '0.5 – 1 bar', size: '1½″',
    desc: 'Ball valve after the commercial service regulator, on the line to the commercial meter.',
    facts: BALL_FACTS,
    position: [-14, 0.16, 123.4], yaw: -Math.PI / 2, pipeR: 0.13, buried: false,
    isolates: [], lines: ['commercial'], affected: 'the commercial kitchen', esd: false,
  },
  {
    id: 'V-421', tag: 'HV-4021', name: 'MRS Inlet Ball Valve', kind: 'ball',
    kicker: 'Isolation — Industrial MRS', pressure: '4 bar', size: '2″',
    desc: 'Ball valve at the inlet of the industrial Metering & Regulating Station.',
    facts: BALL_FACTS,
    position: [34, 0.16, 119.2], yaw: -Math.PI / 2, pipeR: 0.2, buried: false,
    isolates: ['mrs', 'laboratory'], lines: ['industrial', 'laboratory'], affected: 'the industrial consumer and laboratory', esd: false,
  },
  {
    id: 'V-422', tag: 'HV-4022', name: 'MRS Outlet Ball Valve', kind: 'ball',
    kicker: 'Isolation — Industrial MRS', pressure: '1 – 4 bar', size: '2″',
    desc: 'Ball valve at the MRS outlet, ahead of the EVC and the laboratory tee.',
    facts: BALL_FACTS,
    position: [34, 0.16, 123.3], yaw: -Math.PI / 2, pipeR: 0.2, buried: false,
    isolates: ['laboratory'], lines: ['industrial', 'laboratory'], affected: 'the industrial consumer and laboratory', esd: false,
  },
  {
    id: 'V-423', tag: 'HV-4023', name: 'EVC Outlet Ball Valve', kind: 'ball',
    kicker: 'Isolation — Electronic volume corrector', pressure: '1 – 4 bar', size: '2″',
    desc: 'Ball valve downstream of the EVC on the line to the industrial consumer.',
    facts: BALL_FACTS,
    position: [34, 0.16, 126.9], yaw: -Math.PI / 2, pipeR: 0.2, buried: false,
    isolates: [], lines: ['industrial'], affected: 'the industrial consumer', esd: false,
  },
  {
    id: 'V-424', tag: 'HV-4024', name: 'Industrial Inlet Small Ball Valve', kind: 'small',
    kicker: 'Isolation — Industrial consumer inlet', pressure: '1 – 4 bar', size: '¾″',
    desc: 'Small-bore ball valve at the industrial consumer inlet.',
    facts: BALL_FACTS,
    position: [34, 0.16, 128.3], yaw: -Math.PI / 2, pipeR: 0.2, buried: false,
    isolates: [], lines: ['industrial'], affected: 'the industrial consumer', esd: false,
  },
  {
    id: 'V-431', tag: 'HV-4031', name: 'Laboratory Branch Ball Valve', kind: 'small',
    kicker: 'Isolation — Laboratory supply', pressure: '0.5 bar', size: '½″',
    desc: 'Small-bore ball valve on the 0.5 bar MDPE branch from the industrial tee to the laboratory.',
    facts: BALL_FACTS,
    position: [40, 0.16, 124.8], yaw: 0, pipeR: 0.08, buried: false,
    isolates: ['laboratory'], lines: ['laboratory'], affected: 'the laboratory', esd: false,
  },
  {
    id: 'V-501', tag: 'HV-5001', name: 'Sample Line Ball Valve', kind: 'small',
    kicker: 'Isolation — Gas chromatograph sample line', pressure: '1.5 bar', size: '¼″',
    desc: 'Small-bore ball valve on the stainless sample line from the metering skid to the gas chromatograph. Shut it to take the analyser out for calibration.',
    facts: [...BALL_FACTS, 'Shutting it stops gas-quality data; billing falls back to the last good calorific value.'],
    // City Gate local (0.6, 0.4, -2.6) → world (CGS at [90,0,-90], rotated π)
    position: [89.4, 0.4, -87.4], yaw: -Math.PI / 2, pipeR: 0.05, buried: false,
    isolates: ['gc'], lines: [], affected: 'gas-quality analysis', esd: false,
  },
  // ── Station-internal valves (2D reference) ──
  {
    id: 'V-204', tag: 'HV-2004', name: 'Online Compressor Inlet Ball Valve', kind: 'ball',
    kicker: 'Isolation — Online station compressor suction', pressure: '19 bar', size: '3″',
    desc: 'Ball valve on the compressor suction line after the inlet skid. Shut it to take the compressor out for maintenance; the station stops refilling its cascade.',
    facts: BALL_FACTS,
    position: [93.4, 0.9, 86.1], yaw: Math.PI, pipeR: 0.1, buried: false,
    isolates: ['cng-station'], lines: [], affected: 'Online station compression', esd: false,
  },
  {
    id: 'V-205', tag: 'HV-2005', name: 'Mother Compressor Inlet Ball Valve', kind: 'ball',
    kicker: 'Isolation — Mother station compressor suction', pressure: '24 bar', size: '4″',
    desc: 'Ball valve on the compressor-hall suction line. Shutting it stops all three compressors, so no cascade trailers can be filled.',
    facts: BALL_FACTS,
    position: [28.3, 1.06, -157.29], yaw: Math.PI, pipeR: 0.118, buried: false,
    isolates: ['mother-station', 'mfm-mother'], lines: [], affected: 'Mother station compression and trailer filling', esd: false,
  },
  {
    id: 'V-601', tag: 'HV-6001', name: 'Booster Inlet Ball Valve', kind: 'ball',
    kicker: 'Isolation — Daughter booster suction', pressure: '40 – 250 bar', size: '1″',
    desc: 'Ball valve on the decant line from the cascade discharge panel to the booster compressor. Shut it and the booster stops; dispensing then relies on the direct-fill line and falls off as the cascade pressure drops.',
    facts: BALL_FACTS,
    position: [-142, 0.9, 13.25], yaw: 0.149, pipeR: 0.06, buried: false,
    isolates: [], lines: [], affected: 'the booster compressor', esd: false,
  },
  {
    id: 'V-602', tag: 'HV-6002', name: 'Direct Fill Line — Inlet Ball Valve', kind: 'ball',
    kicker: 'Isolation — Daughter booster direct-fill line', pressure: '200 bar', size: '1″',
    desc: 'Ball valve on the direct-fill line that bypasses the booster and feeds the dispensers straight from a high-pressure cascade. Shut it to force all dispensing through the booster.',
    facts: BALL_FACTS,
    position: [-145.6, 0.5, 20], yaw: -Math.PI / 2, pipeR: 0.05, buried: false,
    isolates: [], lines: [], affected: 'the direct-fill bypass', esd: false,
  },
];

export const LINE_VALVE_BY_ID: Record<string, LineValveDef> = Object.fromEntries(LINE_VALVES.map((v) => [v.id, v]));
