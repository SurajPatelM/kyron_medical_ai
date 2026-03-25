# Kyron Medical — Patient Voice AI

Full-stack Next.js app: patient chat with Claude (tool use for scheduling), optional outbound calls via Vapi with chat context, Resend email confirmations, and optional Twilio SMS.

## Kyron interview submission

| Deliverable | In this repo |
|-------------|----------------|
| **EC2 + HTTPS** | Step-by-step: [DEPLOY_EC2.md](DEPLOY_EC2.md), Nginx example: [deploy/nginx-kyron.conf.example](deploy/nginx-kyron.conf.example) |
| **Video** | Shot list: [VIDEO_OUTLINE.md](VIDEO_OUTLINE.md) |
| **GitHub + form** | Push steps: [GITHUB_SETUP.md](GITHUB_SETUP.md) — checklist: [SUBMISSION.md](SUBMISSION.md) |
| **Pre-push verify** | `bash scripts/verify-submission.sh` |

## Quick start

```bash
cd kyron-patient-ai
cp .env.example .env.local
# Fill in API keys in .env.local (never commit .env.local)
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Dashboard: [http://localhost:3000/dashboard](http://localhost:3000/dashboard).

## Environment variables

See `.env.example`. Required for core chat: `ANTHROPIC_API_KEY`. Voice handoff needs `VAPI_*` keys. Email after booking uses `RESEND_API_KEY` (and optionally `RESEND_FROM_EMAIL` once your domain is verified in Resend). SMS needs Twilio vars.

## Architecture

- **`src/app/page.tsx`** — Chat client; session id in `sessionStorage`.
- **`src/app/api/chat/route.ts`** — Claude `claude-sonnet-4-20250514` with tools; persists messages in `src/data/store.ts`.
- **`src/data/doctors.ts`** — Specialists + generated weekday slots (~40% pre-booked) for 45 days.
- **`src/lib/chat-tools.ts`** — Tool implementations (`match_doctor`, `get_available_slots`, `book_appointment`, etc.). Booking triggers Resend + optional SMS.
- **`src/app/api/vapi/call/route.ts`** — Outbound call with transcript injected into assistant overrides.
- **`src/app/api/vapi/webhook/route.ts`** — Stub for inbound callback memory (point Vapi “Server URL” here when deployed).

State is **in-memory** (and per Node process): restarting the server clears sessions and appointments.

## Deployment (AWS EC2)

Full guide (DNS, PM2, Nginx, Certbot, smoke tests): **[DEPLOY_EC2.md](DEPLOY_EC2.md)**.

## Safety

The assistant is instructed **not** to give medical advice. Demo accordingly.

## License

Private / use per your organization.
