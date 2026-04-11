// src/lib/areas.ts
// Central source of truth for Deeshora's serviceable areas
// Update this file to expand coverage — changes propagate everywhere automatically.

export interface AreaOption {
  label: string;        // Display name shown to the customer
  value: string;        // Stored in DB (used for serviceability check)
  locality: string;     // Parent area
  pincode?: string;     // Primary pincode (optional pre-fill hint)
  isServiceable: boolean;
}

// ─── THIRUVOTTRIYUR LOCALITIES ────────────────────────────────────────────
// All sub-localities inside the Thiruvottriyur zone
export const THIRUVOTTRIYUR_LOCALITIES: AreaOption[] = [
  { label: 'Thiruvottriyur Town',      value: 'Thiruvottriyur Town',      locality: 'Thiruvottriyur', pincode: '600019', isServiceable: true },
  { label: 'Kathivakkam',              value: 'Kathivakkam',              locality: 'Thiruvottriyur', pincode: '600019', isServiceable: true },
  { label: 'Ennore',                   value: 'Ennore',                   locality: 'Thiruvottriyur', pincode: '600057', isServiceable: true },
  { label: 'Vallur',                   value: 'Vallur',                   locality: 'Thiruvottriyur', pincode: '600103', isServiceable: true },
  { label: 'Wimco Nagar',              value: 'Wimco Nagar',              locality: 'Thiruvottriyur', pincode: '600019', isServiceable: true },
  { label: 'Mel Thiruvottriyur',       value: 'Mel Thiruvottriyur',       locality: 'Thiruvottriyur', pincode: '600019', isServiceable: true },
  { label: 'Ponneri High Road',        value: 'Ponneri High Road',        locality: 'Thiruvottriyur', pincode: '600019', isServiceable: true },
  { label: 'Mathur',                   value: 'Mathur',                   locality: 'Thiruvottriyur', pincode: '600068', isServiceable: true },
  { label: 'Arunachalam Nagar',        value: 'Arunachalam Nagar',        locality: 'Thiruvottriyur', pincode: '600019', isServiceable: true },
  { label: 'Kannagi Nagar',            value: 'Kannagi Nagar',            locality: 'Thiruvottriyur', pincode: '600019', isServiceable: true },
  { label: 'Anna Nagar (North Chennai)',value: 'Anna Nagar North Chennai', locality: 'Thiruvottriyur', pincode: '600019', isServiceable: true },
  { label: 'Minjur',                   value: 'Minjur',                   locality: 'Thiruvottriyur', pincode: '601203', isServiceable: true },
];

// ─── COMING SOON AREAS ────────────────────────────────────────────────────
// Displayed as "Coming Soon" — not yet serviceable
export const COMING_SOON_AREAS: AreaOption[] = [
  { label: 'Tondiarpet',        value: 'Tondiarpet',        locality: 'North Chennai', isServiceable: false },
  { label: 'Washermenpet',      value: 'Washermenpet',      locality: 'North Chennai', isServiceable: false },
  { label: 'Perambur',          value: 'Perambur',          locality: 'North Chennai', isServiceable: false },
  { label: 'Vyasarpadi',        value: 'Vyasarpadi',        locality: 'North Chennai', isServiceable: false },
  { label: 'Kolathur',          value: 'Kolathur',          locality: 'North Chennai', isServiceable: false },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────

/** All values that are considered serviceable for backend checks */
export const SERVICEABLE_VALUES = THIRUVOTTRIYUR_LOCALITIES.map(a => a.value.toLowerCase());

/** Check if a stored area value is in a serviceable zone */
export function isAreaServiceable(area: string | null | undefined): boolean {
  if (!area) return false;
  const normalized = area.toLowerCase();
  return SERVICEABLE_VALUES.some(v => normalized.includes(v) || v.includes(normalized));
}
