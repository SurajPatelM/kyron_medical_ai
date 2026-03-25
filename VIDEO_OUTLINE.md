# Video outline (~20 minutes)

Use this as a shot list while recording. Upload the final video per Kyron’s application form (link in their email).

## Part 1 — Behavioral (~5 minutes)

Answer with **specific examples** (company, stack, outcome):

1. **What makes you unique?**
2. **What would you bring to Kyron’s culture** — moving fast, shipping quality, inclusivity?
3. **Outcome-oriented vs effort-oriented** — define both; why outcomes matter; example where you optimized for outcome.
4. **How do you ramp on new tech quickly?** — tools, docs, small spikes, who you ask; 1–2 real examples.

## Part 2 — Customer walkthrough + live demo (~5 minutes)

Screen share the **deployed HTTPS app** (not only localhost).

Suggested flow:

1. Home page — liquid glass UI, Kyron branding.
2. Chat: office hours / address (workflow).
3. **Scheduling**: intake (name, DOB, phone, email), concern → matched doctor, slots; optional “Tuesday afternoon” style ask via chat.
4. Book appointment; show **email** (inbox or Resend logs) if possible.
5. **SMS** — if Twilio configured, mention opt-in; otherwise say it’s wired but optional for demo.
6. **Voice handoff**: click **Continue via Phone Call**; **answer your phone**; show that conversation continues with **context** from the chat.
7. Optional: ask the AI a **medical advice** question — it should **refuse** safely.

## Part 3 — Code & stack (~10 minutes)

Walk through as for an engineering manager:

1. **Stack**: Next.js App Router, TypeScript, Tailwind, Claude + tool use, Vapi, Resend/Twilio.
2. **Repo layout**: `src/app/api/*`, `src/data/doctors.ts`, `src/data/store.ts`, `src/lib/chat-tools.ts`, chat UI under `src/components/Chat/`.
3. **Chat flow**: `POST /api/chat` — messages, tool loop, persistence for voice context.
4. **Booking**: tools mutate in-memory slots; confirmation email/SMS.
5. **Voice**: `POST /api/vapi/call` — transcript → Vapi `assistantOverrides`.
6. **Safety**: system prompt guardrails in `src/lib/claude.ts`.
7. **Deploy**: EC2 + Nginx + Let’s Encrypt (mention `DEPLOY_EC2.md`).
8. **Tradeoffs**: in-memory state, MVP first, what you’d add next (DB, streaming, inbound webhook hardening).

---

**Tips:** Rehearse the **phone call** once before recording. Keep browser tabs minimal; show URL bar for HTTPS domain.
