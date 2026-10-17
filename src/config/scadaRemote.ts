import type { FacilityId } from '@/config/safetyLayout';

/**
 * Section 09 §9 — the facilities exposed for remote ESD trip from the control
 * centre (the four CNG stations, per the spec). Each entry maps to the existing
 * Section-08 ESD store id so the remote action calls the same trip sequence.
 */
export const FacilityRemote: { id: FacilityId; short: string }[] = [
  { id: 'online-cng', short: 'Online CNG Station' },
  { id: 'mother', short: 'Mother Station' },
  { id: 'daughter', short: 'Daughter Station' },
  { id: 'booster', short: 'Daughter Booster' },
];
