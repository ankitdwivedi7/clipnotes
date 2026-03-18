# ClipNotes Deployment Guide

## Services Needed

### 1. Database — Neon (free tier)
- Go to https://neon.tech and create a project
- Copy the connection string → set as `DATABASE_URL`
- Run: `DATABASE_URL="your-url" npx prisma migrate deploy`

### 2. Redis — Upstash (free tier)
- Go to https://upstash.com and create a Redis database
- Copy the REST URL → set as `REDIS_URL`

### 3. API — Vercel
```bash
cd apps/api
npx vercel --prod
```
Set these environment variables in Vercel dashboard:
- `DATABASE_URL` — from Neon
- `REDIS_URL` — from Upstash
- `ANTHROPIC_API_KEY` — your Claude API key
- `JWT_SECRET` — generate with: `openssl rand -base64 32`

### 4. Worker — Fly.io or Railway
The worker runs as a long-lived process (not serverless).

```bash
# Option A: Railway
# Push to GitHub, connect to Railway, set start command:
# cd apps/api && npx prisma generate && npx tsx src/workers/index.ts

# Option B: Fly.io
# fly launch --dockerfile apps/api/Dockerfile.worker
```

### 5. Mobile — Expo EAS Build
```bash
cd apps/mobile
# Update EXPO_PUBLIC_API_URL in .env to your Vercel URL
eas build --platform ios
eas submit --platform ios
```

## Environment Variables Summary

| Variable | Where | Description |
|---|---|---|
| DATABASE_URL | API + Worker | Neon PostgreSQL connection string |
| REDIS_URL | API + Worker | Upstash Redis URL |
| ANTHROPIC_API_KEY | Worker | Claude API key |
| JWT_SECRET | API | Secret for signing JWT tokens |
| EXPO_PUBLIC_API_URL | Mobile | Your Vercel API URL |
