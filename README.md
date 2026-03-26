# Kyron Medical - Patient Voice AI

Production-ready Next.js app for a patient assistant that supports:

- Intelligent web chat (Claude + tool calling)
- Appointment scheduling with specialist matching and slot selection
- Prescription refill status workflow (simulated)
- Office info workflow (hours, address, contact)
- Outbound and inbound voice continuity via Vapi
- Email confirmations via Resend
- SMS confirmations via Twilio (opt-in flow)
- Dashboard view of booked appointments

## What is implemented

### Core patient workflows

- Intake for appointment scheduling: first name, last name, DOB, phone, email, reason
- Doctor matching based on concern/body part
- Available slot retrieval with day/time preference support
- Booking confirmation with conflict handling (`alreadyBooked` response)
- Safe post-booking behavior to avoid duplicate booking attempts
- Office info and prescription status support in the same assistant

### Voice handoff and continuity

- "Continue via Phone Call" button from chat UI
- Outbound call initiation via `POST /api/vapi/call`
- Session phone indexing so voice tool-calls resolve the same chat session
- Vapi webhook parsing for both `toolCallList` and `toolWithToolCallList`
- Single-line tool result formatting and HTTP 200 tool response contract
- Inbound callback personalization via `assistant-request` first message

### Notifications

- Email confirmation after successful booking
- SMS reminder tool (`send_sms_reminder`) for explicit opt-in
- Twilio sender uses `TWILIO_PHONE_NUMBER`

### UI and UX

- Liquid glass visual style with Kyron color palette
- Animated chat/message interactions
- Dashboard reads fresh appointments from `/api/appointments` with `no-store`

### Safety and guardrails

- System prompts instruct the assistant to avoid medical advice
- Tool flow constrained to scheduling/info/refill domain tasks

## Tech stack

- Next.js 16 (App Router), React 19, TypeScript
- Anthropic Claude (`claude-sonnet-4-20250514`)
- Vapi (voice calls + webhook tool execution)
- Resend (email), Twilio (SMS)
- Tailwind CSS 4

## Project structure

- `src/app/page.tsx` - Chat experience
- `src/app/dashboard/page.tsx` - Appointment dashboard
- `src/app/api/chat/route.ts` - Claude tool loop + chat API
- `src/app/api/vapi/call/route.ts` - Outbound call initiation
- `src/app/api/vapi/webhook/route.ts` - Vapi server webhook events/tool-calls
- `src/app/api/appointments/route.ts` - Appointment API for dashboard
- `src/data/doctors.ts` - Hard-coded providers + generated slots (45 days)
- `src/data/store.ts` - In-memory sessions + appointments
- `src/lib/claude.ts` - Prompt + tool schemas
- `src/lib/chat-tools.ts` - Tool handlers (`match_doctor`, `book_appointment`, etc.)
- `src/lib/vapi-webhook.ts` - Tool-call payload normalization helpers
- `src/lib/vapi-tools.ts` - Export OpenAI-style function definitions for Vapi
- `src/lib/email.ts` / `src/lib/sms.ts` - Notifications

## Initial setup (local)

### 1) Prerequisites

- Node.js 20+
- npm 10+

### 2) Install

```bash
git clone <your-repo-url>
cd kyron-patient-ai
npm install
```

### 3) Environment

```bash
cp .env.example .env.local
```

Fill `.env.local` with your keys:

- `ANTHROPIC_API_KEY` (required)
- `VAPI_API_KEY`, `VAPI_PHONE_NUMBER_ID`, `VAPI_ASSISTANT_ID` (voice)
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (email)
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` (SMS)
- `NEXT_PUBLIC_APP_URL` (e.g. `http://localhost:3000` locally)

### 4) Run

```bash
npm run dev
```

Open:

- Chat: `http://localhost:3000`
- Dashboard: `http://localhost:3000/dashboard`

## Run scripts

- `npm run dev` - local development
- `npm run build` - production build
- `npm run start` - run built app
- `npm run lint` - lint checks

## Vapi setup (required for voice scheduling)

See `VAPI_SETUP.md` for complete instructions.

Minimum required:

1. Set assistant Server URL to `https://YOUR_DOMAIN/api/vapi/webhook`
2. Ensure assistant function names/schemas match `getClaudeTools()` / `getVapiModelFunctions()`
3. Keep tools sync (`async: false`) and verify logs return `results` for tool-calls

## Deployment

For AWS EC2 + HTTPS + Nginx + PM2:

- `DEPLOY_EC2.md`

## Important notes

- State is currently in-memory per Node process.
  - Restarting the server clears sessions/appointments.
  - For production-grade persistence, move to a database.
- Never commit `.env.local` or API keys.

## License

Private use.
