---
name: deployment-protocol
description: Standaard deployment workflow voor Vercel projecten
created: 2026-02-10
project: global
tags: [deployment, vercel, workflow]
---

# Deployment Protocol

## Pre-flight Checks
1. `npm run build` — moet schoon slagen
2. `npx tsc --noEmit` — geen TypeScript errors
3. Zoek naar `console.log` in productie code — verwijder debug statements
4. Controleer .env variabelen in Vercel dashboard matchen met lokaal

## Deploy naar Preview
- Push branch naar GitHub
- Vercel deployt automatisch een preview
- Deel preview URL met Shadow voor review

## Promote naar Production
- Alleen na goedkeuring van Shadow
- Optie A: Merge PR naar main/master branch
- Optie B: `npx vercel --prod` voor directe deploy

## Post-deployment
- Controleer production URL handmatig
- Log in activity_log: POST /api/activity met action "deployed"
- Update STATUS.md in project root
