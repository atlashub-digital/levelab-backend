# LeveLab ↔ Atlas Revenue Operations
Canonical: atlashub-digital/atlashub-finance/openapi/aro-v1.yaml.
- Active rights are resolved live at ARO /v1/entitlements/resolve using verified Supabase member email.
- Admin/complimentary local rights are independently labelled 'manual' or 'admin'; no payment-derived local rights.
- ARO notification POST /api/v1/aro/webhook checks exact raw-body HMAC/timestamp and stores id/type only in AroWebhookEvent with unique ID.
- ARO is always the authority for paid/refunded/revoked grants; inbound notifications never grant access.
- Apply migration before enabling webhook; set ARO_API_URL, ARO_PROJECT_SLUG, ARO_SERVER_KEY, ARO_WEBHOOK_SECRET, ARO_ENTITLEMENTS_ENABLED.
- Run node --experimental-strip-types --test test/aro-contract.test.ts (Node 22+).
- For engineering gates see front docs/integrations/ARO_LEVELAB_HANDOFF.md.
Do not include payment-provider adapters, secrets or payer health details.
