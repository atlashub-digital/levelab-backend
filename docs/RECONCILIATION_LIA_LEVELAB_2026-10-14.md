# LeveLab Backend — Content & Entitlements Reconciliation (Proposal, 2026-10-14)

**Status:** review only, no runtime migrations yet.

## Canonical architecture
- One versioned content registry covering LeveLab WebReader and LIA.doctor.
- Only human-reviewed/published educational units may be surfaced through public product pages or LIA content tools.
- Content contract: `content_id`, `version`, `status`, `claim_ids`, `media_refs`, `locale`, `product_id`.
- Authorization contract: `member_id`, `offer_id`, `entitlement`, `payment_provider`, `consent`, `audit_event`.

## P0 acceptance
- [ ] Import approved snapshots from Notion Content Lab; do not blindly ingest Drive PDFs as claims.
- [ ] Entitlements shared by Hotmart + own checkout, verified webhooks, idempotency, refunds/chargeback revocation.
- [ ] Test preview/full Reader, bundle purchases, anonymous guest, unauthorized access.
- [ ] Secure session transfer between LeveLab.org and LIA.doctor; no raw tokens in URLs.
- [ ] Consent-aware member profile, channel opt-in and retention policies. No clinical data in freeform chatbot memory by default.
- [ ] Publish API contract, tests, migration plan, rollback plan before production release.

**Rule:** content remains separated from conversational implementation; no clinical claims hard-coded into software.
