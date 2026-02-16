# Anthropic API Configuratie

## Service
- **Naam:** Anthropic Claude API
- **Website:** https://console.anthropic.com/
- **Docs:** https://docs.anthropic.com/

## Credentials

### Supabase Edge Function (Command Center)
De API key is opgeslagen als Supabase secret voor de chat-agent Edge Function.

**Project:** wwvpcdxctqytqnzxoscl

**Secret instellen via CLI:**
```bash
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-jouw-key-hier --project-ref wwvpcdxctqytqnzxoscl
```

**Secret instellen via Dashboard:**
https://supabase.com/dashboard/project/wwvpcdxctqytqnzxoscl/settings/functions

## Gebruik

### Command Center Chat Agent
- **Endpoint:** `https://wwvpcdxctqytqnzxoscl.supabase.co/functions/v1/chat-agent`
- **Model:** claude-sonnet-4-20250514
- **Functie:** Registry items beheren via natuurlijke taal

### Lokale Development
Voor lokale Supabase development:
```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-... --project-ref wwvpcdxctqytqnzxoscl
```

## Gerelateerde Projecten
- Command Center (`C:\Users\Shadow\Projects\command-center`)
