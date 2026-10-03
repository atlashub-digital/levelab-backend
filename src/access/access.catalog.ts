/**
 * Access catalog: entitlement keys, protected content assets and sellable
 * offers. Versioned in code until a payment provider is chosen; a payment
 * webhook will grant the same keys an offer lists here.
 */

export const ENTITLEMENT_KEYS = [
  'content:corpo-forte',
  'content:forca-na-caneta',
  'levelab-plus',
  'premium',
] as const;

export type EntitlementKey = (typeof ENTITLEMENT_KEYS)[number];

/** "premium" unlocks everything else. */
export function expandKeys(keys: Iterable<string>): EntitlementKey[] {
  const set = new Set(keys);
  if (set.has('premium')) return [...ENTITLEMENT_KEYS];
  return ENTITLEMENT_KEYS.filter((key) => set.has(key));
}

export type ContentAsset = {
  id: string;
  product: string;
  kind: 'guia' | 'workbook';
  title: string;
  /** File name inside CONTENT_DIR (never served without an access check). */
  file: string;
  totalPages: number;
  /** Pages 1..previewPages are public (cover, preface, index). */
  previewPages: number;
  requires: EntitlementKey;
};

export const CONTENT_ASSETS: ContentAsset[] = [
  {
    id: 'corpo-forte-guia',
    product: 'corpo-forte',
    kind: 'guia',
    title: 'Corpo Forte — Guia Premium',
    file: 'LeveLab_Corpo_Forte_Guia_Premium_v2.0_FINAL.pdf',
    totalPages: 105,
    previewPages: 7,
    requires: 'content:corpo-forte',
  },
  {
    id: 'corpo-forte-workbook',
    product: 'corpo-forte',
    kind: 'workbook',
    title: 'Corpo Forte — Workbook Premium',
    file: 'LeveLab_Corpo_Forte_Workbook_Premium_v2.0_FINAL.pdf',
    totalPages: 77,
    previewPages: 5,
    requires: 'content:corpo-forte',
  },
  {
    id: 'forca-na-caneta',
    product: 'forca-na-caneta',
    kind: 'guia',
    title: 'Força na Caneta — Premium',
    file: 'LeveLab_Forca_na_Caneta_Premium_v2.0_FINAL.pdf',
    totalPages: 38,
    previewPages: 4,
    requires: 'content:forca-na-caneta',
  },
];

export function getAsset(id: string): ContentAsset | undefined {
  return CONTENT_ASSETS.find((asset) => asset.id === id);
}

/** Sellable offers -> keys they grant. A guide purchase includes LeveLab+ (LIA). */
export const OFFERS: Record<string, { title: string; keys: EntitlementKey[] }> = {
  'guia-corpo-forte': {
    title: 'Corpo Forte (Guia + Workbook) + LeveLab+',
    keys: ['content:corpo-forte', 'levelab-plus'],
  },
  'guia-forca-na-caneta': {
    title: 'Força na Caneta + LeveLab+',
    keys: ['content:forca-na-caneta', 'levelab-plus'],
  },
  'levelab-premium': {
    title: 'LeveLab Premium (acesso completo)',
    keys: ['premium'],
  },
};
