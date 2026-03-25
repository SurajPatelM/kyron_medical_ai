# Publish to GitHub (public repo)

Run these from your laptop inside the `kyron-patient-ai` folder.

## 1. Ensure no secrets

- No `.env.local` in the repo: `git status` should not list it (it is gitignored).
- Never commit real API keys. Run `bash scripts/verify-submission.sh`.

## 2. Initialize git (if you have not already)

```bash
cd kyron-patient-ai
git init
git add -A
git status   # review: no .env.local
git commit -m "feat: Kyron Medical patient voice AI submission"
```

## 3. Create the GitHub repository

On GitHub: **New repository** → name e.g. `kyron-patient-ai` → **Public** → create **without** README (you already have one).

Then connect and push:

```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/kyron-patient-ai.git
git push -u origin main
```

CLI alternative: `gh repo create kyron-patient-ai --public --source=. --remote=origin --push`

## 4. Double-check on GitHub

- Repo is **Public**.
- Latest commit contains only source + docs (no `.env.local`).
- README renders; submission links at top work.

Use the repo URL on Kyron’s application form.
