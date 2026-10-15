# LeveLab Backend — ARO authoritative access handoff

Implemented:
- AroEntitlementsService resolves ACTIVE right by server-to-server ARO V1,
  email identity (transitional V1), with server-only Bearer ARO_SERVER_KEY.
- Requires ARO_ENTITLEMENTS_ENABLED=true; false maintains legacy backend
  behavior until ARO catalog and identity are approved.
- /me/library and /me/content are both guarded by same ARO authority
  when enabled. ARO down => deny/unavailable, never silently grant access.
- ARO events are notifications, never standalone grant calls.

Config through approved secrets store:
ARO_API_URL=
ARO_PROJECT_SLUG=levelab
ARO_SERVER_KEY=
ARO_ENTITLEMENTS_ENABLED=false

Outstanding before activation:
- Align ARO customer_id with Supabase subject rather than transitional email.
- Verify ARO grant for both book and workbook when Corpo Forte offer approved.
- Register catalog via aro.project.yaml in frontend and set approved prices.
- Provision durable signed webhook event dedup + verified processing.
- Test privileged route access with ACTIVE, missing, REVOKED, EXPIRED.
- Test controlled checkout/approved/order/entitlement/pdf/refund end-to-end.
- Replace v2.0 PDFs only after clinical/editorial signoff.
- No provider adapters, no ARO keys committed, no merge before tests.

Canonical ARO: atlashub-digital/atlashub-finance/openapi/aro-v1.yaml
