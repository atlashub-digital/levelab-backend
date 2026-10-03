# Contributor Operating Rules

1. Read README.md and docs/ARCHITECTURE.md before changes.
2. Never commit credentials, real connection strings, personal data or health records.
3. Keep Atendimento.Center and LeveLab domain responsibilities separate.
4. All LIA-facing writes must be exposed through explicit, scoped, auditable API contracts.
5. Database schema changes require Prisma migrations.
6. Health-related behavior must preserve the safety boundary: no diagnosis, prescribing, dose adjustment or autonomous clinical decisions.
7. Prefer small vertical slices that can be tested end-to-end.
