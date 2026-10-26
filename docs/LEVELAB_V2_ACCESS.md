# LeveLab V2 — Backend access and editorial release contract (26/10/2026)

Status: PREVIEW, no production activation.

## Identity and login
- Supabase Auth is authoritative for LeveLab login/session; email passwordless already exists in frontend.
- ARO V1 currently resolves paid rights by server-verified member email (transitional); bind to the stable Supabase user/ARO customer identity before commercial activation.
- AtlasHub WhatsApp OTP or LIA WhatsApp are not enabled until the signed verification bridge and phone-to-user binding are proven. Resend with verified @lia.doctor domain may deliver the Supabase email OTP after template/SMTP validation.

## Catalog / ownership
- Corpo Forte — Além da Balança: **one** ARO offer `levelab-corpo-forte-br` for BRL 39.90 (3990 minor units), granting **both** ARO rights `levelab:reader:corpo-forte` and `levelab:reader:corpo-forte-workbook`.
- Internal companion workbook `O Meu Corpo em Construção` must not be separately charged.
- Tomei Mounjaro. E Agora?: ARO offer `levelab-tomei-mounjaro-br` DRAFT only; right `levelab:reader:tomei-mounjaro`, product file/asset ID not yet wired. Proposed price pending direction confirmation.
- Força na Caneta: preserve legacy content and rights for existing customers; title currently in editorial review. No new sale until new edition and price approved.
- Existing LeveLab+ legacy grants should continue to work for already-authorized purchasers, but V2 ebook purchases **must not** include new LeveLab+ rights.
- Hotmart sales form separate channel in Phase 1; never grant ARO rights from unverified Hotmart notifications.

## Content and release
Direction states MSL001/MSL002/MSL003 manuscripts have been editorially validated despite historical filename labels `NAO_PUBLICAR`. Technical publishing nonetheless needs final versioned export, accurate page counts, safe rights credits, and file hash before delivery. Do not serve unreleased proofs with private identification fields.

Backend asset maps currently carry v2.0 files (105/77/38 pages). Do not point new V3 prices/products to those old materials. Release must atomically align:
- Backend `src/access/access.catalog.ts` asset metadata and protected file names.
- Frontend `lib/content/library.ts` asset IDs, pages, manifests and preview PDFs.
- ARO entitlement map; backend `AroEntitlementsService.RIGHTS` and frontend protected-reader authorization.

## Acceptance
1. Verified Supabase member identity and valid ARO account binding; no privilege elevation from email edits.
2. ARO offer registered with amount/currency and no subscription.
3. Signed webhook deduplication and idempotent checkout.
4. Approved payment -> ACTIVE order rights -> backend /me/library both book and workbook true -> private /me/content PDF stream.
5. Missing, REVOKED, EXPIRED, refunded, chargeback -> no access to paid asset. After-sales service owns refund contact, ARO owns financial record and entitlement revocation.
6. ARO down -> fail closed; no local payment-derived grant.
7. Read-only QA and smoke before flag activation; deployment rollback documented.

Never place secrets, member data, health records or regulated medicine marketing assets in public code.
