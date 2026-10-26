/**
 * Access catalog: entitlement keys, protected content assets and sellable
 * offers. Versioned in code until a payment provider is chosen; a payment
 * webhook will grant the same keys an offer lists here.
 */

export const ENTITLEMENT_KEYS = [
  'content:corpo-forte',
  'content:forca-na-caneta',
  'content:tomei-mounjaro',
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
  /** false = hidden from /me/library (NAO_PUBLICAR). Defaults to true. */
  published?: boolean;
};

export const CONTENT_ASSETS: ContentAsset[] = [
  // MSL editions (EspelhoMeu Editions, A5, approved for distribution 2026-10-26).
  // Page counts are the OBSERVED counts of the installed files (pdfinfo),
  // per LEVELAB_V2_EXECUTION.md G1 — not the v2.0 assumptions (105/77).
  {
    id: 'msl002-corpo-forte',
    product: 'corpo-forte',
    kind: 'guia',
    title: 'Corpo Forte — Além da Balança',
    file: 'MSL002_Corpo_Forte_Alem_da_Balanca_A5_v1.0.pdf',
    totalPages: 80,
    previewPages: 6,
    requires: 'content:corpo-forte',
  },
  {
    id: 'msl003-corpo-em-construcao',
    product: 'corpo-forte',
    kind: 'workbook',
    title: 'O Meu Corpo em Construção',
    file: 'MSL003_O_Meu_Corpo_em_Construcao_A5_v1.0.pdf',
    totalPages: 57,
    previewPages: 4,
    requires: 'content:corpo-forte',
  },
  {
    id: 'msl001-tomei-mounjaro',
    product: 'tomei-mounjaro',
    kind: 'guia',
    title: 'Tomei Mounjaro. E Agora?',
    file: 'MSL001_Tomei_Mounjaro_E_Agora_A5_v1.0.pdf',
    totalPages: 97,
    previewPages: 5,
    requires: 'content:tomei-mounjaro',
  },
  {
    // PRESERVED, NOT PUBLISHED (NAO_PUBLICAR): historical 7-day guide under
    // editorial review. No offer grants its key; excluded from /me/library.
    id: 'forca-na-caneta',
    product: 'forca-na-caneta',
    kind: 'guia',
    title: 'Força na Caneta — Premium',
    file: 'LeveLab_Forca_na_Caneta_Premium_v2.0_FINAL.pdf',
    totalPages: 38,
    previewPages: 4,
    requires: 'content:forca-na-caneta',
    published: false,
  },
];

/** ARO owns purchase rights separately for each delivered document.
 * Do not collapse the book and workbook into one key: both must be ACTIVE.
 * Local keys remain available only for verified manual/admin access.
 */
// ARO reader rights (authoritative), per installed edition id.
export const ARO_RIGHT_BY_ASSET: Record<string, string> = {
  'corpo-forte-guia': 'levelab:reader:corpo-forte',
  'corpo-forte-workbook': 'levelab:reader:corpo-forte-workbook',
  'forca-na-caneta': 'levelab:reader:forca-na-caneta',
  'tomei-mounjaro': 'levelab:reader:tomei-mounjaro',
  'msl002-corpo-forte': 'levelab:reader:corpo-forte',
  'msl003-corpo-em-construcao': 'levelab:reader:corpo-forte-workbook',
  'msl001-tomei-mounjaro': 'levelab:reader:tomei-mounjaro',
};

export function getAsset(id: string): ContentAsset | undefined {
  return CONTENT_ASSETS.find((asset) => asset.id === id);
}

/** A key an offer grants; `days` limits it (no `days` = no end date). */
export type OfferGrant = { key: EntitlementKey; days?: number };

/**
 * Sellable offers -> what they grant. A guide is owned for good and includes
 * 30 days of LeveLab+ (LIA) — decision of 2026-10-03.
 */
export const OFFERS: Record<string, { title: string; grants: OfferGrant[] }> = {
  'guia-corpo-forte': {
    title: 'Corpo Forte (Guia + Workbook) + LeveLab+',
    grants: [{ key: 'content:corpo-forte' }, { key: 'levelab-plus', days: 30 }],
  },
  'guia-forca-na-caneta': {
    title: 'Força na Caneta + LeveLab+',
    grants: [{ key: 'content:forca-na-caneta' }, { key: 'levelab-plus', days: 30 }],
  },
  'levelab-premium': {
    title: 'LeveLab Premium (acesso completo)',
    grants: [{ key: 'premium' }],
  },
};
