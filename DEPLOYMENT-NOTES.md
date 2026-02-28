# AWS Deploy Skill — Field Report

**Project:** Curriculum Designer Web App (Next.js 16, Zustand, Anthropic Claude via Bedrock)
**Date:** February 11, 2026
**Skill version:** Cloned from `github.com/NotDannyCrawford/aws-deploy-skill`

---

## What We Deployed

A Next.js 16 fullstack app with:
- Server-side API routes calling Claude (Anthropic) via AWS Bedrock SDK
- shadcn/ui frontend with Zustand state management
- PDF/Word file parsing (native Node.js packages: pdf-parse, mammoth)
- SSE streaming for long-form AI content generation
- No database

## How It Went

The skill worked well overall. We went through all phases sequentially and had a working deployment in about 30 minutes. The phased approach was easy to follow and the skip-if-done principle was helpful — we didn't waste time on things already set up.

### Phase 1: Pre-flight Check — Smooth
- Repo was already on GitHub, `.gitignore` was solid, `.env` was secured
- No hardcoded localhost URLs (Next.js relative API routes)
- Had uncommitted changes — skill correctly flagged this and we committed before proceeding

### Phase 2: Containerize — Smooth
- Stack detection worked: identified Next.js from `package.json`
- Used the Next.js Dockerfile template from `references/dockerize.md`
- **Key catch:** Had to add `output: "standalone"` to `next.config.ts` (the reference doc correctly notes this requirement)
- Generated Dockerfile, docker-compose.yml, Caddyfile, .dockerignore — all worked first try
- Readiness check found nothing wrong (clean codebase, no hardcoded URLs)

### Phase 2.5: Docker Validation — Caught One Issue
- `docker compose config` failed because the compose file references `env_file: .env` but only `.env.local` existed
- **Suggestion for the skill:** The Next.js template could note that Next.js projects typically use `.env.local`, and the compose file should either reference that or the skill should create a `.env` during containerization
- After creating `.env`, validation passed and local build succeeded

### Phase 3: AWS Setup — Smooth
- User had an AWS account but no CLI installed
- Installed via `brew install awscli`
- User configured credentials via `aws configure`
- Provisioned: key pair, security group (ports 22/80/443), t2.micro instance (Ubuntu 24.04), Elastic IP
- **One note:** The AMI lookup command worked perfectly. The whole provisioning sequence ran without issues.

### Phase 4: Deploy — Smooth
- SSH setup, Docker install, Git clone, swap space — all ran cleanly on first attempt
- Copied `.env` to server, ran `docker compose up -d --build`
- Build took ~4 minutes on t2.micro (the 2GB swap was essential — without it, `npm ci` would likely OOM)
- App came up healthy, `curl` returned 200 from both inside and outside

### Phase 5: Domain + HTTPS — Skipped
- User chose IP-only access for now

### Phase 6: CI/CD — Skipped
- User chose manual deploys for now

### Phase 7: Verify — Passed
- Health check from outside returned HTTP 200
- App fully functional at `http://<elastic-ip>`

## Post-Deploy: Switched from Anthropic API to AWS Bedrock

After initial deployment, we switched the AI backend from the direct Anthropic API (`@anthropic-ai/sdk`) to AWS Bedrock (`@anthropic-ai/bedrock-sdk`). This was a smooth change because:

1. The Bedrock SDK is a drop-in replacement (same `messages.create()` and `messages.stream()` API)
2. Only 2 code files changed: client.ts (auth method) and prompts.ts (model ID format)
3. Environment variables changed from `ANTHROPIC_API_KEY` to `AWS_REGION` + `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`

**Prerequisites that were needed:**
- Enable Claude model access in Bedrock console (Model Access page)
- Add `AmazonBedrockFullAccess` IAM policy to the user

**Suggestion for the skill:** Consider adding a "Post-deploy: AI provider setup" optional phase for apps that use AI APIs. Many apps deploying to AWS would benefit from switching to Bedrock to consolidate billing. The Bedrock SDK swap pattern is generic enough to template.

## Suggestions for the Skill

### Things That Worked Great
1. **Phased approach** — easy to follow, good mental model
2. **Skip-if-done principle** — didn't repeat unnecessary steps
3. **Reference docs** — `dockerize.md` templates were accurate and production-ready
4. **Swap space** — the 2GB swap on t2.micro was critical; glad it's in the script
5. **Docker validation phase (2.5)** — caught the .env issue before we deployed remotely

### Suggestions for Improvement

1. **`.env` vs `.env.local` for Next.js:** The generated `docker-compose.yml` uses `env_file: .env`, but Next.js projects conventionally use `.env.local` for secrets. The skill could either:
   - Detect Next.js and use `env_file: .env.local` in compose
   - Or create a `.env` from `.env.local` during containerization
   - Or note this in the Next.js section of `dockerize.md`

2. **Region awareness in the Console:** After deployment, the user couldn't find the EC2 instance in the AWS Console because they were viewing a different region. A small note in the Phase 7 handoff ("Make sure your Console region is set to X") would save confusion.

3. **Bedrock integration as optional phase:** For AI-powered apps, offer to switch from direct API keys to Bedrock. The pattern is:
   - `npm install @anthropic-ai/bedrock-sdk` (or equivalent for OpenAI via Bedrock)
   - Update client constructor (region-based auth instead of API key)
   - Update model ID to Bedrock format
   - Add IAM permissions

4. **Cost reminder about Elastic IP:** The handoff mentions it, but emphasizing that a *stopped* instance still costs ~$3.65/month for the Elastic IP could prevent surprise charges.

## Final State

```
URL:        http://100.51.138.180
SSH:        ssh -i ~/.ssh/deploy-key.pem ubuntu@100.51.138.180
App path:   /opt/apps/curriculum-designer/curriculum-designer-web/
Instance:   i-0f30c165bdb7c3e6f (t2.micro, us-east-1)
Elastic IP: eipalloc-008c908d4eced3406
Key pair:   deploy-key (~/.ssh/deploy-key.pem)
Sec group:  sg-09524315a35a5f705 (curriculum-designer-sg)
AI backend: AWS Bedrock (Claude Sonnet 4)
```
