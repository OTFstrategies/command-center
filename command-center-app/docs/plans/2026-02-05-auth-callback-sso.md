# Auth Callback SSO Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Voeg /auth/callback route toe zodat Command Center SSO tokens van VEHA Hub kan ontvangen.

**Architecture:** Client-side route die tokens uit URL hash leest en Supabase sessie instelt.

**Tech Stack:** Next.js 14, Supabase JS, TypeScript

---

## Overview

| Task | Beschrijving |
|------|--------------|
| 1 | Supabase client setup |
| 2 | Auth callback page |
| 3 | Deploy & test |

---

## Task 1: Supabase Client Setup

**Files:**
- Create: `src/lib/supabase/client.ts`

**Step 1: Maak Supabase client helper**

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**Step 2: Install @supabase/ssr**

```bash
npm install @supabase/ssr
```

**Step 3: Voeg environment variables toe**

Maak `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://ikpmlhmbooaxfrlpzcfa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrcG1saG1ib29heGZybHB6Y2ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NjUzNjUsImV4cCI6MjA4NTU0MTM2NX0.OaTF51iom5IbHlqURVGbKuGSCqTLLxAGv7SITenFOgU
```

**Step 4: Commit**

```bash
git add src/lib/supabase/client.ts .env.local
git commit -m "feat: add Supabase client setup"
```

---

## Task 2: Auth Callback Page

**Files:**
- Create: `src/app/auth/callback/page.tsx`

**Step 1: Maak auth callback page**

```tsx
// src/app/auth/callback/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      try {
        // Get hash fragment (after #)
        const hash = window.location.hash.substring(1);
        if (!hash) {
          throw new Error("No authentication data received");
        }

        // Parse parameters from hash
        const params = new URLSearchParams(hash);
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        const permissions = params.get("permissions");

        if (!accessToken || !refreshToken) {
          throw new Error("Missing authentication tokens");
        }

        // Set session in Supabase
        const supabase = createClient();
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          throw sessionError;
        }

        // Store permissions in localStorage for app use
        if (permissions) {
          try {
            const parsedPermissions = JSON.parse(permissions);
            localStorage.setItem("hub_permissions", JSON.stringify(parsedPermissions));
          } catch {
            console.warn("Failed to parse permissions");
          }
        }

        setStatus("success");

        // Redirect to dashboard after short delay
        setTimeout(() => {
          router.push("/");
        }, 1000);
      } catch (err) {
        console.error("Auth callback error:", err);
        setError(err instanceof Error ? err.message : "Authentication failed");
        setStatus("error");
      }
    }

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="text-center">
        {status === "loading" && (
          <>
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-zinc-600 dark:text-zinc-400">Authenticating...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400">Logged in! Redirecting...</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-600 dark:text-red-400 mb-2">Authentication failed</p>
            <p className="text-sm text-zinc-500">{error}</p>
            <button
              onClick={() => window.location.href = "https://veha-hub.vercel.app"}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Back to VEHA Hub
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/auth/callback/page.tsx
git commit -m "feat: add auth callback page for SSO from VEHA Hub"
```

---

## Task 3: Deploy & Test

**Step 1: Add env vars to Vercel**

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Enter: https://ikpmlhmbooaxfrlpzcfa.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Enter: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Step 2: Deploy**

```bash
vercel --prod
```

**Step 3: Test SSO flow**

1. Go to https://veha-hub.vercel.app
2. Login
3. Click "Command Center" button
4. Verify redirect to Command Center with session

**Step 4: Push to git**

```bash
git push origin main
```

---

## Verification Checklist

- [ ] Supabase client werkt
- [ ] /auth/callback route bestaat
- [ ] Tokens worden correct geparsed uit hash
- [ ] Session wordt ingesteld in Supabase
- [ ] Permissions worden opgeslagen in localStorage
- [ ] Redirect naar dashboard werkt
- [ ] Error handling werkt
