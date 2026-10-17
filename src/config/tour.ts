import type { NetworkMode } from '@/state/useViewStore';

/**
 * Section 13/14 — the complete 25-stop guided tour. Data-driven: each stop
 * declares its camera framing, network focus, caption (narration), an optional
 * live subsystem action (existing functions only, never new logic), a primary
 * billboard label and optional sequential sub-labels. Section 14 retunes every
 * camera position/target for proper three-quarter framing with the subject in the
 * clear area, and adds per-stop reveal flags (`xray` for gas-flow stops, `fadeProps`
 * to fade occluding trees) that revert on stop exit. Runtime ≈ 5–6 min at 1×.
 */
export type TourAction =
  | 'route-transmission'
  | 'pig'
  | 'odor'
  | 'route-primary'
  | 'markers'
  | 'cp'
  | 'sv-demo'
  | 'refuel'
  | 'trailer-fill'
  | 'trailer-follow'
  | 'compare'
  | 'png-home'
  | 'png-commercial'
  | 'png-industrial'
  | 'gas-leak'
  | 'cutaway'
  | 'scada';

/** A billboarded tour label. `live` is a key resolved by TourLabels each frame. */
export interface TourLabel {
  name: string;
  purpose?: string;
  anchor: [number, number, number];
  live?: string;
  accent?: string;
}

export interface TourStop {
  id: string;
  act: string;
  title: string;
  narration: string;
  position: [number, number, number];
  target: [number, number, number];
  mode: NetworkMode;
  duration: number; // seconds (guidance / min dwell when voice is off)
  focusId?: string;
  action?: TourAction;
  label?: TourLabel;
  subLabels?: TourLabel[];
  /** §D.5 — enable internal-flow (X-ray) for gas-flow subjects; reverts on exit. */
  xray?: boolean;
  /** §D.4 — fade occluding trees for this stop; reverts on exit. */
  fadeProps?: boolean;
}

const TEAL = '#14e0c8';

export const TOUR: TourStop[] = [
  // ───────────── ACT 1 — SOURCE & RECEIVING ─────────────
  {
    id: 'overview', act: 'Source & Receiving', title: 'Shantigram Overview', duration: 12,
    position: [92, 58, 116], target: [0, 6, 0], mode: 'BOTH',
    narration: 'Welcome to Adani Shantigram — a six-hundred-acre integrated township served by a complete City Gas Distribution network. Every pipeline, station and consumer shown here is live and simulated.',
    label: { name: 'ADANI SHANTIGRAM CGD NETWORK', purpose: 'A complete, live City Gas Distribution twin', anchor: [0, 16, 0] },
  },
  {
    id: 'transmission', act: 'Source & Receiving', title: 'Transmission Pipeline Entry', duration: 10,
    position: [131, 10, -77], target: [117, 2.6, -88], mode: 'BOTH', focusId: 'citygate', action: 'route-transmission', xray: true,
    narration: 'Natural gas arrives from the national grid by high-pressure transmission pipeline at twenty-six to twenty-eight bar.',
    label: { name: 'HIGH-PRESSURE TRANSMISSION PIPELINE', purpose: 'DN600 steel · from the national grid', anchor: [118, 2.6, -90], live: 'transmission', accent: TEAL },
  },
  {
    id: 'pig', act: 'Source & Receiving', title: 'Pig Launcher', duration: 10,
    position: [112, 4.5, -78], target: [110, 2, -86], mode: 'BOTH', action: 'pig',
    narration: 'Pipeline inspection gauges, known as pigs, are launched from here to clean and internally inspect the pipeline without interrupting supply.',
    label: { name: 'PIG LAUNCHER · PL-01', purpose: 'Cleans & inspects the pipeline in service', anchor: [110, 2.6, -86] },
  },
  {
    id: 'city-gate', act: 'Source & Receiving', title: 'City Gate Station', duration: 14,
    position: [114, 19, -70], target: [90, 4.5, -90], mode: 'BOTH', focusId: 'citygate', fadeProps: true,
    narration: 'At the City Gate Station, the gas is filtered, metered, odorised and regulated before it enters the city network.',
    label: { name: 'CITY GATE STATION', purpose: 'The gateway of the entire network', anchor: [90, 6.5, -90], live: 'citygate', accent: TEAL },
    subLabels: [
      { name: 'FILTRATION SKID', purpose: 'Removes dust & liquids', anchor: [99, 3.2, -91.5] },
      { name: 'METERING SKID', purpose: 'Custody-transfer measurement', anchor: [90, 3.2, -91.5], live: 'metering' },
      { name: 'ODORIZATION UNIT', purpose: 'Mercaptan injection', anchor: [79, 3, -87], live: 'odor' },
      { name: 'PRS SKID', purpose: 'Pressure regulation', anchor: [81, 3.2, -91.5], live: 'prs' },
    ],
  },
  {
    id: 'filtration', act: 'Source & Receiving', title: 'Filtration Skid', duration: 10,
    position: [101, 5.5, -83], target: [99, 2.6, -91.5], mode: 'BOTH', focusId: 'filtration', fadeProps: true,
    narration: 'The Filtration Skid removes dust, liquids and particulates from the gas to protect all the downstream equipment. Twin vessels run duty and standby.',
    label: { name: 'FILTRATION SKID', purpose: 'Twin vessel · duty / standby · DP 0.14 Bar', anchor: [99, 3.4, -91.5] },
  },
  {
    id: 'metering', act: 'Source & Receiving', title: 'Metering Skid', duration: 10,
    position: [95, 5, -84], target: [90, 2.6, -91.5], mode: 'BOTH', focusId: 'metering', fadeProps: true,
    narration: 'The Metering Skid performs custody-transfer measurement, with pressure and temperature compensation, precisely recording the volume of gas entering the city.',
    label: { name: 'METERING SKID', purpose: 'Turbine DN150 · custody transfer', anchor: [90, 3.4, -91.5], live: 'metering', accent: TEAL },
  },
  {
    id: 'odorization', act: 'Source & Receiving', title: 'Odorization Unit', duration: 12,
    position: [70, 6.5, -78], target: [79, 2.4, -87], mode: 'BOTH', action: 'odor', fadeProps: true,
    narration: 'Natural gas is odourless. Mercaptan is injected here so that any leak can be detected by smell — a mandatory requirement under P.N.G.R.B. safety regulations.',
    label: { name: 'ODORIZATION UNIT', purpose: 'Mercaptan dosing · mandatory safety', anchor: [79, 3.2, -87], live: 'odor', accent: TEAL },
  },
  {
    id: 'prs', act: 'Source & Receiving', title: 'Pressure Regulation', duration: 10,
    position: [86, 5.5, -84], target: [81, 2.6, -91.5], mode: 'BOTH', focusId: 'prs', fadeProps: true,
    narration: 'The Pressure Regulating Skid reduces the high transmission pressure down to around four bar for the city distribution network.',
    label: { name: 'PRS SKID', purpose: 'In 27 Bar → Out 4 Bar', anchor: [81, 3.4, -91.5], live: 'prs', accent: TEAL },
  },

  // ───────────── ACT 2 — DISTRIBUTION & CONTROL ─────────────
  {
    id: 'hierarchy', act: 'Distribution & Control', title: 'Distribution Hierarchy', duration: 14,
    position: [72, 15, -46], target: [50, 1.6, -58], mode: 'BOTH', focusId: 'drs1', action: 'route-primary', xray: true, fadeProps: true,
    narration: 'Primary, secondary and local networks carry gas across the township. Pipe diameter and pressure step down at each stage, branching into every neighbourhood.',
    label: { name: 'PRIMARY DISTRIBUTION', purpose: 'DN300 steel · yellow-banded', anchor: [55, 2, -66], live: 'primary', accent: TEAL },
  },
  {
    id: 'markers', act: 'Distribution & Control', title: 'Pipeline Route Markers', duration: 8,
    position: [40, 5.5, -44], target: [28, 1, -55], mode: 'BOTH', action: 'markers', fadeProps: true,
    narration: 'Buried pipelines are marked above ground so that excavation crews avoid third-party damage to the network.',
    label: { name: 'ROUTE MARKER · RM-047', purpose: 'Depth of cover 1.2 m · DO NOT DIG', anchor: [30, 1.8, -55] },
  },
  {
    id: 'buried', act: 'Distribution & Control', title: 'Buried Pipeline (Section View)', duration: 10,
    position: [24, 7, -30], target: [14, 0, -40], mode: 'BOTH', action: 'cutaway', xray: true,
    narration: 'Most of the distribution network is buried. M.D.P.E. and steel pipelines sit on a bedding layer with warning tape above them, and are marked at surface level to prevent excavation damage.',
    label: { name: 'BURIED PIPELINE · SECTION VIEW', purpose: 'Bedding sand · pipe · warning tape · backfill', anchor: [14, 0.5, -40], accent: TEAL },
  },
  {
    id: 'cp', act: 'Distribution & Control', title: 'Cathodic Protection', duration: 10,
    position: [112, 4.5, -77], target: [104, 1.6, -84], mode: 'BOTH', action: 'cp',
    narration: 'Impressed-current cathodic protection prevents corrosion of the buried steel pipelines, extending the life of the asset.',
    label: { name: 'TRANSFORMER RECTIFIER · TR-01', purpose: 'Impressed-current CP', anchor: [104, 1.8, -84], live: 'cp', accent: TEAL },
    subLabels: [
      { name: 'CP TEST POINT · TP-014', purpose: 'Pipe-to-soil −0.98 V · PROTECTED', anchor: [99, 1.2, -87] },
    ],
  },
  {
    id: 'sv', act: 'Distribution & Control', title: 'Sectionalizing Valve', duration: 14,
    position: [42, 5.5, -48], target: [34, 2.2, -56], mode: 'BOTH', action: 'sv-demo', fadeProps: true,
    narration: 'Sectionalizing valves isolate sections of the network for maintenance or emergency response. Watch as this valve closes — downstream flow stops and the affected consumers are identified — then reopens.',
    label: { name: 'SECTIONALIZING VALVE · SV-02', purpose: 'DN300 ball valve · isolates a section', anchor: [34, 2.8, -56], live: 'sv', accent: TEAL },
  },
  {
    id: 'drs', act: 'Distribution & Control', title: 'District Regulating Station', duration: 10,
    position: [-37, 9, 5], target: [-48, 2.6, 15], mode: 'BOTH', focusId: 'drs3', fadeProps: true,
    narration: 'District Regulating Stations step the pressure down again and split supply between the C.N.G. and P.N.G. networks.',
    label: { name: 'DRS-03', purpose: 'In 8 Bar → Out 4 Bar · CNG + PNG split', anchor: [-48, 3.2, 15], live: 'drs3', accent: TEAL },
  },

  // ───────────── ACT 3 — CNG NETWORK ─────────────
  {
    id: 'cng', act: 'CNG Network', title: 'Online CNG Station', duration: 14,
    position: [66, 15, 66], target: [88, 4, 90], mode: 'CNG', focusId: 'cng-station', action: 'refuel', fadeProps: true,
    narration: 'An Online C.N.G. Station is connected directly to the distribution pipeline and compresses the gas on site for dispensing to vehicles.',
    label: { name: 'ONLINE CNG STATION', purpose: 'Pipeline-fed · 4 dispensers', anchor: [90, 6.5, 90], live: 'cng', accent: TEAL },
  },
  {
    id: 'compressor', act: 'CNG Network', title: 'Compressor', duration: 10,
    position: [76, 7, 80], target: [86, 3.6, 89], mode: 'CNG', action: 'refuel', fadeProps: true,
    narration: 'The main compressor raises the pipeline gas from around eighteen bar to two hundred and fifty bar, ready for high-pressure vehicle dispensing.',
    label: { name: 'MAIN COMPRESSOR', purpose: '4-stage · 18 → 250 Bar · 250 kW', anchor: [86, 4.2, 89], accent: TEAL },
  },
  {
    id: 'cascade', act: 'CNG Network', title: 'Cascade Storage & Bank Logic', duration: 14,
    position: [82, 6.5, 98], target: [92, 3.6, 92], mode: 'CNG', action: 'refuel', fadeProps: true,
    narration: 'Gas is stored in three pressure banks. The priority panel draws from Low, then Medium, then High, maximising the gas transferred to each vehicle.',
    label: { name: 'CASCADE STORAGE', purpose: '12 cylinders · 3 banks', anchor: [92, 4.2, 93], live: 'cascade', accent: TEAL },
    subLabels: [
      { name: 'PRIORITY PANEL · PP-01', purpose: 'Sequences LOW → MEDIUM → HIGH', anchor: [90, 3.4, 90], live: 'priority' },
    ],
  },
  {
    id: 'dispenser', act: 'CNG Network', title: 'Dispenser & Vehicle', duration: 12,
    position: [88, 5, 79], target: [95, 3, 86], mode: 'CNG', action: 'refuel', fadeProps: true,
    narration: 'Vehicles refuel at two hundred bar. A typical car fill takes about four minutes.',
    label: { name: 'CNG DISPENSER · Lane 2', purpose: 'Dispensing 200 Bar', anchor: [95, 3.2, 86], live: 'dispenser', accent: TEAL },
  },
  {
    id: 'mother', act: 'CNG Network', title: 'Mother Station', duration: 16,
    position: [7, 10, -126], target: [26, 3.2, -138], mode: 'CNG', action: 'trailer-fill',
    narration: 'The Mother Station fills mobile cascade trailers for delivery to stations with no pipeline connection. The sequence includes earthing, connection, and a progressive fill of the trailer cylinders.',
    label: { name: 'CNG MOTHER STATION', purpose: '3 compressors · trailer filling bay', anchor: [40, 6, -148], live: 'mother', accent: TEAL },
  },
  {
    id: 'transit', act: 'CNG Network', title: 'Cascade in Transit', duration: 10,
    position: [10, 12, -60], target: [-10, 2, -80], mode: 'CNG', action: 'trailer-follow',
    narration: 'Filled trailers are transported by road to Daughter Stations across the network, carrying compressed gas to areas the pipeline does not reach.',
    label: { name: 'CASCADE TRAILER · CT-07', purpose: '250 Bar · en route', anchor: [-10, 3.5, -80], live: 'trailer', accent: TEAL },
  },
  {
    id: 'compare', act: 'CNG Network', title: 'Daughter vs Daughter Booster', duration: 22,
    position: [-128, 8.5, 6], target: [-146, 3, 15], mode: 'CNG', action: 'compare',
    narration: 'A Daughter Station has no compressor — dispensing pressure falls as the cascade empties, and forty-five percent of the gas is stranded. A Daughter Booster Station adds a booster compressor: dispensing holds at two hundred bar, and cascade utilisation rises to eighty-five percent.',
    label: { name: 'DAUGHTER BOOSTER STATION', purpose: 'Booster 75 kW · holds 200 Bar ✓', anchor: [-150, 4, 20], live: 'booster', accent: TEAL },
    subLabels: [
      { name: 'DAUGHTER STATION', purpose: 'No compressor · pressure falls ⚠', anchor: [130, 4, 40], live: 'daughter', accent: '#e0a23c' },
    ],
  },

  // ───────────── ACT 4 — PNG NETWORK ─────────────
  {
    id: 'png', act: 'PNG Network', title: 'PNG Residential', duration: 18,
    position: [-64, 3.2, 133], target: [-57, 1.5, 127], mode: 'PNG', action: 'png-home',
    narration: 'On the P.N.G. side, gas travels through buried M.D.P.E. pipeline, up the building service line, through the meter, and into the home — where it lights the kitchen stove.',
    label: { name: 'PNG RESIDENTIAL', purpose: 'MDPE DN63 · service line → meter → stove', anchor: [-57, 2.4, 127], live: 'res', accent: '#6C5AB8' },
    subLabels: [
      { name: 'PNG METER · G4', purpose: '21 mbar', anchor: [-62.5, 1.6, 127], live: 'res-meter' },
      { name: 'GAS STOVE · 4 burner', purpose: 'Ignited', anchor: [-57.2, 1.1, 125.6] },
    ],
  },
  {
    id: 'commercial', act: 'PNG Network', title: 'PNG Commercial', duration: 12,
    position: [-23, 5.5, 138], target: [-14, 1.8, 129], mode: 'PNG', action: 'png-commercial',
    narration: 'Restaurants, hotels and institutions take larger connections, with ground-mounted meter cabinets and slam-shut safety valves feeding commercial kitchens.',
    label: { name: 'COMMERCIAL PNG', purpose: 'Rotary G25 · 100 mbar', anchor: [-14, 3.4, 129], live: 'comm', accent: TEAL },
  },
  {
    id: 'industrial', act: 'PNG Network', title: 'PNG Industrial', duration: 14,
    position: [19, 7, 143], target: [36, 2.6, 131], mode: 'PNG', action: 'png-industrial',
    narration: 'Industrial consumers connect at ground level through a dedicated gas skid, at flow rates hundreds of times a domestic connection — feeding a steam boiler through a series gas train.',
    label: { name: 'INDUSTRIAL PNG SKID', purpose: 'Turbine G400 · 4 Bar', anchor: [34, 3.4, 132], live: 'ind', accent: '#BD3861' },
    subLabels: [
      { name: 'STEAM BOILER · 2 TPH', purpose: '2-valve series gas train', anchor: [37.6, 4, 129.4] },
    ],
  },

  // ───────────── ACT 5 — SAFETY & THE DIGITAL TWIN ─────────────
  {
    id: 'safety', act: 'Safety & Digital Twin', title: 'Safety Systems', duration: 16,
    position: [72, 8, 74], target: [86, 3, 88], mode: 'CNG', action: 'gas-leak', fadeProps: true,
    narration: 'Every facility carries emergency shutdown, gas detection and fire protection. When gas rises above forty percent of the lower explosive limit, an automatic shutdown is triggered. Watch the leak detection sequence run, then reset.',
    label: { name: 'GAS DETECTOR · GD-04', purpose: 'Auto-ESD at 40% LEL', anchor: [97, 2.2, 86], live: 'gas', accent: '#BD3861' },
    subLabels: [
      { name: 'ESD BUTTON · ARMED', purpose: 'Emergency shutdown', anchor: [74, 1.6, 78] },
    ],
  },
  {
    id: 'twin', act: 'Safety & Digital Twin', title: 'SCADA & The Digital Twin', duration: 16,
    position: [96, 60, 118], target: [10, 4, -24], mode: 'BOTH', action: 'scada',
    narration: 'Every asset reports to the S.C.A.D.A. control centre in real time — pressure, flow, equipment status and safety systems across the entire Shantigram network, with remote valve and shutdown capability. This is a living digital twin.',
    label: { name: 'SCADA CONTROL CENTRE', purpose: 'Real-time telemetry over the whole network', anchor: [112, 8, -60], live: 'scada', accent: TEAL },
  },
];

/**
 * §B.4 validation — warn (dev only) if a known gas-carrying component id is not
 * referenced by any tour stop, so future components are not silently skipped.
 */
export const TOUR_EXPECTED_IDS = [
  'transmission', 'pig', 'city-gate', 'filtration', 'metering', 'odorization', 'prs',
  'hierarchy', 'markers', 'buried', 'cp', 'sv', 'drs', 'cng', 'compressor', 'cascade', 'dispenser',
  'mother', 'transit', 'compare', 'png', 'commercial', 'industrial', 'safety', 'twin',
];

export function validateTourCoverage(): string[] {
  const ids = new Set(TOUR.map((s) => s.id));
  const missing = TOUR_EXPECTED_IDS.filter((id) => !ids.has(id));
  if (missing.length && import.meta.env?.DEV) {
    console.warn('[tour] gas-carrying components with no tour stop:', missing.join(', '));
  }
  return missing;
}
