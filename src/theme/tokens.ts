/**
 * ADANI CGD — SINGLE SOURCE OF BRAND TOKENS (spec §0.2 / §0.3)
 *
 * Every brand color used anywhere in the app — UI chrome AND 3D emissive/glow
 * materials — must resolve back to this file. When Adani's verified brand deck
 * (exact Pantone/CMYK, logo, typography) is supplied, swap the hex values here
 * and in theme.css only; nothing else in the codebase hard-codes brand hex.
 *
 * NOTE: These are placeholder values sourced from public brand aggregators, not
 * an internal Adani style guide. Verify before final production delivery.
 */

export const BRAND = {
  /** Corporate trust / core brand — primary UI panels, active nav, ONLINE status */
  primary: '#0B74B0',
  primarySoft: '#3C9BD1',
  /** Structural dark UI base — dashboard bg, glass-panel base */
  navy: '#0B2545',
  navyDeep: '#071A33',
  /** Innovation / secondary accent — secondary buttons, PNG highlight */
  accent: '#75479C',
  /** Energy / alerts / CTA — warnings, critical status, CTA buttons */
  alert: '#BD3861',
  /** Gas / clean-energy association — CNG network highlight, flow glow, eco */
  tealCng: '#0F8B8D',
  /** PNG network highlight — violet-blue flow glow */
  violetPng: '#6C5AB8',
  /** Neutral base surfaces */
  surface: '#F5F7FA',
  surfaceDark: '#12233B',
  ink: '#0E1726',
  muted: '#9FB2C8',
} as const;

/**
 * Functional split (spec §0.2):
 *   CNG network  = teal/blue flow glow
 *   PNG network  = violet/blue flow glow
 *   alert/shutdown = maroon
 *   normal/online  = primary blue
 */
export const FLOW_COLORS = {
  cng: BRAND.tealCng,
  png: BRAND.violetPng,
  transmission: BRAND.primary,
} as const;

export const STATUS_COLORS = {
  online: BRAND.primary,
  warning: BRAND.alert,
  critical: BRAND.alert,
  offline: BRAND.muted,
} as const;

export type BrandKey = keyof typeof BRAND;
