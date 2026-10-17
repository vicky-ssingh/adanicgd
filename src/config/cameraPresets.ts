/** Predefined camera locations (spec §2.29). */
export interface CameraPreset {
  id: string;
  label: string;
  position: [number, number, number];
  target: [number, number, number];
}

// CGD-flow journey stops only (source → consumer). Township landmarks are not
// listed here — they are viewable in the scene / guided tour, not the flow menu.
export const CAMERA_PRESETS: CameraPreset[] = [
  { id: 'city-overview', label: 'Shantigram Overview', position: [95, 68, 118], target: [0, 4, 0] },
  { id: 'transmission', label: 'Transmission Entry', position: [126, 14, -70], target: [112, 2, -90] },
  { id: 'city-gate', label: 'City Gate', position: [116, 22, -58], target: [89, 3, -90] },
  { id: 'prs', label: 'PRS SKID', position: [92, 9, -82], target: [81, 2, -91.5] },
  { id: 'drs', label: 'DRS', position: [50, 9, -46], target: [45, 1.6, -60] },
  { id: 'cng', label: 'Adani Total Gas CNG Station', position: [66, 15, 68], target: [90, 3, 92] },
  { id: 'mother', label: 'CNG Mother Station', position: [40, 34, -104], target: [40, 3, -150] },
  { id: 'mother-bay', label: 'Cascade Filling Bay', position: [2, 14, -128], target: [26, 3, -138] },
  { id: 'trailer-follow', label: 'Cascade Trailer — Follow', position: [10, 12, -60], target: [-10, 2, -80] },
  { id: 'trailer-manifold', label: 'Trailer Manifold Detail', position: [52, 7, -132], target: [40, 2, -127] },
  { id: 'daughter', label: 'Daughter Station', position: [130, 20, 78], target: [130, 3, 36] },
  { id: 'booster', label: 'Daughter Booster Station', position: [-150, 22, 62], target: [-150, 3, 14] },
  { id: 'booster-detail', label: 'Booster Compressor Detail', position: [-126, 8, 6], target: [-134, 3, 12] },
  { id: 'comparison', label: 'Station Comparison', position: [0, 150, 190], target: [0, 0, 0] },
  { id: 'odorization', label: 'Odorization Unit', position: [70, 9, -77], target: [79, 2, -87] },
  { id: 'sv-02', label: 'SV Station (SV-02)', position: [42, 8, -48], target: [34, 2, -56] },
  { id: 'pig-launcher', label: 'Pig Launcher', position: [118, 7, -80], target: [110, 2, -86] },
  { id: 'control-centre', label: 'SCADA Control Centre', position: [128, 16, -40], target: [112, 4, -60] },
  { id: 'png-kitchen', label: 'PNG Residential — Kitchen', position: [-64, 3.4, 134], target: [-57, 1.4, 127] },
  { id: 'png-commercial', label: 'PNG Commercial — Kitchen', position: [-20, 4, 137], target: [-13, 1.6, 129] },
  { id: 'png-industrial', label: 'PNG Industrial — Gas Skid', position: [30, 6, 141], target: [35, 2, 131] },
  { id: 'png', label: 'Shantigram Residential Zone', position: [-74, 7, 62], target: [-84, 1.5, 52] },
  { id: 'industrial', label: 'Shantigram Commercial & Industrial Zone', position: [-58, 20, -38], target: [-90, 3, -22] },
];
