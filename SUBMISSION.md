# Kyron Medical — submission checklist

Complete these **you** before the deadline (Tier 1: Thursday 8:00 PM ET — see your hiring email).

## Before you paste links

- [ ] **HTTPS app** live on EC2 — open `https://yourdomain.com` from an incognito window.
- [ ] `bash scripts/smoke-ec2.sh` passes on the server (optional).
- [ ] **Vapi outbound call** tested against the **production** URL.
- [ ] **Video** exported and uploaded to the host the form accepts (Drive, Loom, YouTube unlisted, etc.).
- [ ] **GitHub repo is public** — no `.env.local`, no API keys in git history.
- [ ] Run locally: `bash scripts/verify-submission.sh`

## Application form (from email)

Paste exactly what they ask for. Typically:

| Field | You provide |
|-------|-------------|
| Video link | Your recording (behavioral + demo + code walkthrough). |
| GitHub repo URL | `https://github.com/YOUR_USER/kyron-patient-ai` |
| Live app URL | `https://yourdomain.com` |

Do **not** reply to the hiring email — use **only** their form link.

## After submit

- Keep EC2 and domain running until you hear back (reviewers may click the link anytime).
- If you rotated any leaked keys, update `.env.local` on the server and `pm2 restart kyron`.

## References

- Deploy steps: [DEPLOY_EC2.md](DEPLOY_EC2.md)
- Recording shot list: [VIDEO_OUTLINE.md](VIDEO_OUTLINE.md)
- Push to GitHub: [GITHUB_SETUP.md](GITHUB_SETUP.md)
