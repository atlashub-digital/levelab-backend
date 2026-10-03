# LeveLab Backend

Business Core and content delivery API for the LeveLab ecosystem.

## Scope

This repository owns:

- members and identities
- programs and enrollments
- Corpo Forte modules and progress
- versioned runtime content
- Check-up Corpo Forte answers/results
- exercises, quizzes, commitments and trackers
- consent and preference records
- subscriptions / entitlements
- LIA context APIs
- Atendimento.Center integration
- webhook and audit infrastructure
- analytics events required by the product

## Architectural principle

**Notion is the editorial source of truth. This backend is the runtime source of truth.**

Only reviewed/approved editorial versions should be promoted into runtime content.

```text
Notion Content Lab
  -> professional review
  -> Approved version
  -> structured content snapshot
  -> Backend / PostgreSQL
  -> Frontend + LIA
```

## Recommended core entities

- Member
- Consent
- Program
- ProgramVersion
- Module
- ContentNode
- ContentVersion
- ClaimReference
- Enrollment
- ModuleProgress
- ExerciseResponse
- QuizAttempt
- Commitment
- TrackerEntry
- CheckupSession
- CheckupAnswer
- CheckupResult
- LiaContext
- Handoff
- Subscription
- AuditEvent

## Runtime content contract

Each published unit should support:

```json
{
  "content_id": "CF-S01-v1.2",
  "product_id": "corpo-forte",
  "module_id": "S01",
  "version": "1.2",
  "status": "published",
  "locale": "pt-BR",
  "title": "Mais do que um número",
  "summary": "...",
  "body_blocks": [],
  "lia_prompts": [],
  "exercise_schema": {},
  "quiz_schema": {},
  "claim_ids": [],
  "media_refs": [],
  "escalation_rules": []
}
```

## Integrations

- Supabase/PostgreSQL for product data
- Atendimento.Center for shared conversational operations and human handoff
- levelab-lia for LIA orchestration
- levelab-frontend as primary product client

## Initial implementation tracks

1. project/bootstrap + health/readiness
2. schema + migrations
3. auth/member profile
4. content versioning API
5. Corpo Forte program/progress API
6. Check-up API
7. LIA context + handoff API
8. subscriptions/entitlements
9. audit + analytics

## Security

This repository is public. Never commit secrets, credentials, production connection strings, health records, personal data, or privileged operational information.
