# Deploy Kyron Patient AI on AWS EC2 (HTTPS)

Follow these steps on a fresh **Ubuntu 24.04 LTS** EC2 instance. Replace placeholders: `yourdomain.com`, `/path/to/key.pem`, `ubuntu` user if your AMI differs.

## 1. EC2 setup

1. Launch instance: **t3.small** (or larger), Ubuntu 24.04.
2. Security group inbound: **22** (your IP), **80**, **443**.
3. Allocate **Elastic IP** and associate it with the instance.
4. Point DNS **A record** for `yourdomain.com` (and `www` if needed) to the Elastic IP.

## 2. SSH and base packages

```bash
ssh -i /path/to/key.pem ubuntu@YOUR_ELASTIC_IP

sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx certbot python3-certbot-nginx git
sudo npm install -g pm2
node -v   # expect v20.x
```

## 3. Clone and configure the app

```bash
cd ~
git clone https://github.com/YOUR_GITHUB_USERNAME/kyron-patient-ai.git
cd kyron-patient-ai
npm install
```

Create production env (never commit this file):

```bash
cp .env.example .env.local
nano .env.local
```

Required for interview demo:

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | Chat |
| `VAPI_API_KEY`, `VAPI_PHONE_NUMBER_ID`, `VAPI_ASSISTANT_ID` | Outbound + inbound voice — also configure dashboard per [VAPI_SETUP.md](VAPI_SETUP.md) |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Email (use verified domain in Resend) |
| `TWILIO_*` | Optional SMS |
| `NEXT_PUBLIC_APP_URL` | `https://yourdomain.com` |

Build and test locally on the instance:

```bash
npm run build
npm run start
# In another SSH session:
curl -I http://127.0.0.1:3000/
```

Stop the test server (Ctrl+C), then start with PM2:

```bash
pm2 start npm --name kyron -- start
pm2 save
pm2 startup
# Run the command `pm2 startup` prints (sudo env ...)
```

## 4. Nginx reverse proxy

```bash
sudo nano /etc/nginx/sites-available/kyron
```

Paste the contents of [`deploy/nginx-kyron.conf.example`](deploy/nginx-kyron.conf.example), replacing `yourdomain.com`.

```bash
sudo ln -sf /etc/nginx/sites-available/kyron /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

## 5. TLS (Let's Encrypt)

```bash
sudo certbot --nginx -d yourdomain.com
```

Certbot will modify the server block for HTTPS. Renewals are automatic via systemd timer.

## 6. Smoke tests (HTTPS + local)

From your **laptop**:

```bash
curl -fsS -o /dev/null -w "%{http_code}\n" https://yourdomain.com/
curl -fsS -o /dev/null -w "%{http_code}\n" https://yourdomain.com/dashboard
```

On the **server** (optional):

```bash
bash scripts/smoke-ec2.sh
```

## 7. Vapi webhook (optional)

For inbound callback memory, set the phone number **Server URL** in Vapi to:

`https://yourdomain.com/api/vapi/webhook`

You may need to adjust payload parsing in [`src/app/api/vapi/webhook/route.ts`](src/app/api/vapi/webhook/route.ts) to match Vapi’s live event shape.

## 8. After code updates

```bash
cd ~/kyron-patient-ai
git pull
npm install
npm run build
pm2 restart kyron
```

## Troubleshooting

- **502 Bad Gateway**: `pm2 logs kyron` — ensure app listens on `3000` and `next start` works.
- **Env not loaded**: Ensure `.env.local` lives in the project root (same directory as `package.json`). Next.js loads it for `next start`.
- **Resend failures**: Verify domain and `RESEND_FROM_EMAIL` in Resend dashboard.
