import type { NetworkGraph } from '@/types/network';

/**
 * The CGD network topology (spec §2.37) — the single source of truth shared by
 * the 3D placement (CgdNetwork), the simulation engine (M4), the flow particles
 * (M5) and component inspection (M8). Node positions are world coordinates that
 * match the placed 3D assets. CNG-station and PNG-consumer nodes are added in
 * M6/M7; the graph is intentionally extensible.
 *
 * Pressure profile (Bar): transmission 28 → city gate out 19 (primary) →
 * DRS out ~4 (secondary) → service ~1 (tertiary).
 */
export const NETWORK: NetworkGraph = {
  nodes: [
    {
      id: 'source',
      label: 'Natural Gas Source',
      type: 'source',
      network: 'common',
      position: [138, 2, -90],
      nominal: { pressure: 28, flow: 48000, temperature: 12 },
      purpose: 'High-pressure transmission gas entering the city network.',
    },
    {
      id: 'citygate',
      label: 'City Gate Station',
      type: 'citygate',
      network: 'common',
      position: [90, 4, -90],
      nominal: { pressure: 27.5, flow: 47000, temperature: 14 },
      purpose:
        'Receives transmission gas; filters, meters and regulates it before city distribution.',
    },
    {
      id: 'filtration',
      label: 'Filtration SKID',
      type: 'filtration',
      network: 'common',
      position: [99, 2.4, -91.5],
      nominal: { pressure: 27.6, flow: 47000, temperature: 14 },
      purpose: 'Removes dust, particles and impurities from natural gas before distribution.',
    },
    {
      id: 'metering',
      label: 'Metering SKID',
      type: 'metering',
      network: 'common',
      position: [90, 2.4, -91.5],
      nominal: { pressure: 27.2, flow: 47000, temperature: 15 },
      purpose: 'Custody-transfer measurement of gas flow, pressure and temperature.',
    },
    {
      id: 'prs',
      label: 'PRS SKID',
      type: 'prs',
      network: 'common',
      position: [81, 2.4, -91.5],
      nominal: { pressure: 19.0, flow: 46000, temperature: 16 },
      purpose: 'Regulates high transmission pressure down to primary distribution pressure.',
    },
    {
      id: 'drs1',
      label: 'DRS · North',
      type: 'drs',
      network: 'common',
      position: [45, 2.2, -60],
      nominal: { pressure: 4.1, flow: 15000, temperature: 18 },
      purpose: 'District regulation from primary to local distribution pressure.',
    },
    {
      id: 'drs2',
      label: 'DRS · Central',
      type: 'drs',
      network: 'common',
      position: [0, 2.2, -15],
      nominal: { pressure: 4.0, flow: 12000, temperature: 18 },
      purpose: 'District regulation from primary to local distribution pressure.',
    },
    {
      id: 'drs3',
      label: 'DRS · West',
      type: 'drs',
      network: 'common',
      position: [-48, 2.2, 15],
      nominal: { pressure: 3.9, flow: 9000, temperature: 18 },
      purpose: 'District regulation from primary to local distribution pressure.',
    },
    {
      id: 'cng-station',
      label: 'Online CNG Station',
      type: 'cng-station',
      network: 'cng',
      position: [86, 5.6, 90],
      nominal: { pressure: 19.0, flow: 8500, temperature: 20 },
      purpose:
        'Pipeline-connected (Online) CNG station: receives CGD gas, compresses it on-site to ~250 Bar into buffer cascade storage, and dispenses CNG to vehicles.',
    },
    {
      id: 'mother-station',
      label: 'CNG Mother Station',
      type: 'cng-station',
      network: 'cng',
      position: [40, 4, -150],
      nominal: { pressure: 24.0, flow: 3200, temperature: 20 },
      purpose:
        'Pipeline-fed Mother Station: three large compressors raise HP gas to 250 Bar for on-site dispensing and, above all, for filling mobile cascade trailers dispatched to Daughter and Daughter-Booster stations.',
    },
    {
      id: 'png-zone',
      label: 'PNG Consumers · West',
      type: 'png-consumer',
      network: 'png',
      position: [-62, 3, 38],
      nominal: { pressure: 0.1, flow: 1400, temperature: 22 },
      purpose:
        'Residential, commercial and industrial PNG consumers fed by buried MDPE service lines and meters.',
    },
    // ── Modules added from the 2D value-chain reference ──
    {
      id: 'ctm',
      label: 'Custody Transfer Meter',
      type: 'ctm',
      network: 'common',
      position: [130, 2.2, -90],
      nominal: { pressure: 28, flow: 48000, temperature: 12 },
      purpose:
        'Ultrasonic custody-transfer meter where gas changes hands from the transmission supplier to Adani. Its flow computer produces the billing volume both parties sign off.',
    },
    {
      id: 'gc',
      label: 'Gas Chromatograph',
      type: 'analyser',
      network: 'common',
      position: [89, 1.2, -84.5],
      nominal: { pressure: 1.5, flow: 0.05, temperature: 25 },
      purpose:
        'On-line gas chromatograph fed by a sample line from the metering skid. Measures composition and calorific value every few minutes for energy billing and quality control.',
    },
    {
      id: 'sr-dom',
      label: 'Service Regulator · Domestic',
      type: 'service-regulator',
      network: 'png',
      position: [-58, 0.6, 121],
      nominal: { pressure: 0.1, flow: 2.4, temperature: 22 },
      purpose: 'Cuts the 4 bar MDPE service main down to 100 mbar for the domestic meter and the 21 mbar appliance line.',
    },
    {
      id: 'sr-com',
      label: 'Service Regulator · Commercial',
      type: 'service-regulator',
      network: 'png',
      position: [-14, 0.6, 121.5],
      nominal: { pressure: 0.75, flow: 38, temperature: 22 },
      purpose: 'Cuts the 4 bar service main down to 0.5 – 1 bar for the commercial meter and GI pipework to the kitchen.',
    },
    {
      id: 'mrs',
      label: 'MRS Skid · Industrial',
      type: 'mrs',
      network: 'png',
      position: [34, 0.8, 121.2],
      nominal: { pressure: 2.5, flow: 420, temperature: 20 },
      purpose:
        'Metering & Regulating Station for the industrial customer: filter, active + monitor regulators, slam-shut and turbine meter, with an Electronic Volume Corrector and 4G AMR modem downstream.',
    },
    {
      id: 'mfm-mother',
      label: 'Mass Flow Meter · Cascade Filling',
      type: 'mass-flow-meter',
      network: 'cng',
      position: [37.5, 0.9, -138],
      nominal: { pressure: 250, flow: 1600, temperature: 32 },
      purpose:
        'Coriolis mass-flow meter on the Mother Station trailer-fill line. Measures the gas delivered into each cascade in kilograms, temperature-compensated, so the fill stops at 250 bar and every trailer load is accounted for.',
    },
    {
      id: 'laboratory',
      label: 'Laboratory',
      type: 'laboratory',
      network: 'png',
      position: [50, 1.5, 126.5],
      nominal: { pressure: 0.5, flow: 6, temperature: 22 },
      purpose: 'Quality-control laboratory fed from the industrial tee by a 0.5 bar MDPE branch for burners and test benches.',
    },
  ],

  edges: [
    {
      id: 'e-transmission',
      from: 'source',
      to: 'citygate',
      tier: 'transmission',
      network: 'common',
      points: [
        [138, 2.2, -90],
        [118, 2.2, -90],
        [110, 1.7, -90.3],
        [105, 1.3, -90.6],
      ],
    },
    {
      // Process flow through the station (drawn by the station itself).
      id: 'e-citygate-process',
      from: 'citygate',
      to: 'prs',
      tier: 'primary',
      network: 'common',
      render: false,
      points: [
        [105, 1.3, -90.6],
        [99, 2.3, -91.5],
        [90, 2.3, -91.5],
        [81, 2.3, -91.5],
        [75, 1.4, -91.5],
      ],
    },
    {
      id: 'e-primary',
      from: 'prs',
      to: 'drs1',
      tier: 'primary',
      network: 'common',
      points: [
        [75, 1.1, -91.5],
        [66, 0.9, -80],
        [55, 0.8, -66],
        [48, 0.8, -60],
        [43.1, 0.8, -60],
      ],
    },
    {
      id: 'e-secondary-1',
      from: 'drs1',
      to: 'drs2',
      tier: 'secondary',
      network: 'common',
      points: [
        [46.9, 0.8, -60],
        [38, 0.7, -55],
        [30, 0.7, -55],
        [20, -1.4, -45],
        [5, -1.4, -25],
        [-1.9, 0.8, -15],
      ],
    },
    {
      id: 'e-secondary-2',
      from: 'drs2',
      to: 'drs3',
      tier: 'secondary',
      network: 'common',
      points: [
        [1.9, 0.8, -15],
        [-20, 0.7, -2],
        [-35, -1.2, 6],
        [-49.9, 0.8, 15],
      ],
    },
    {
      id: 'e-tertiary-1',
      from: 'drs3',
      to: 'drs3',
      tier: 'tertiary',
      network: 'common',
      points: [
        [-46.1, 0.8, 15],
        [-42, 0.5, 22],
        [-38, 0.15, 34],
      ],
    },
    {
      // Dedicated CNG feeder from the city gate to the mother station — mostly
      // underground (y<0) along the east edge, surfacing at each end (teal flow).
      id: 'e-cng-spur',
      from: 'prs',
      to: 'cng-station',
      tier: 'secondary',
      network: 'cng',
      points: [
        [76, 0.7, -91],
        [95, -1.4, -88],
        [106, -1.4, -40],
        [106, -1.4, 40],
        [99, -1.4, 84],
        [96, 0.6, 90],
      ],
    },
    {
      // Dedicated HP feeder from the PRS to the Mother Station on the southern
      // industrial edge — mostly underground, surfacing at the inlet (teal flow).
      id: 'e-mother-spur',
      from: 'prs',
      to: 'mother-station',
      tier: 'primary',
      network: 'cng',
      points: [
        [78, 0.7, -91],
        [70, -1.4, -104],
        [55, -1.4, -124],
        [35, -1.4, -146],
        [16, -1.4, -160],
        [10, 0.6, -162],
      ],
    },
    {
      // Buried MDPE service main to the PNG consumer zone (violet flow).
      id: 'e-png-main',
      from: 'drs3',
      to: 'png-zone',
      tier: 'tertiary',
      network: 'png',
      render: false,
      points: [
        [-46, 0.5, 15],
        [-52, 0.28, 26],
        [-62, 0.25, 38],
      ],
    },
  ],
};

export const NODES_BY_ID = Object.fromEntries(NETWORK.nodes.map((n) => [n.id, n]));
