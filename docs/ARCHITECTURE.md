# LeveLab Backend Architecture

## Boundary

LeveLab Backend is the business source of truth. It does not own channel conversations.

- **LeveLab Backend**: members, programs, progress, content runtime, commerce, subscriptions, consents.
- **Atendimento.Center**: channels, conversations, LIA runtime, human inbox, media transport, tool calls.
- **levelab-lia**: versioned conversational policies, prompts, safety, evals and program conversation flows.

## Runtime path

```text
Web / WhatsApp
  -> Atendimento.Center
  -> LIA
  -> Tool Gateway
  -> LeveLab Backend
  -> LeveLab PostgreSQL
```

LIA never receives direct database credentials.

## First vertical slice

1. Create or resolve a member.
2. Complete onboarding profile.
3. Start Leve 7.
4. Read today's program day.
5. Record a check-in.
6. Generate week summary.
7. Request human handoff.

## Commerce boundary

The commerce model must support physical goods, digital products, ebooks, courses, programs and subscriptions without assuming every product is publicly eligible for sale. Regulated products require an explicit compliance gate before activation.
