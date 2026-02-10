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
            <div className="w-8 h-8 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-zinc-600 dark:text-zinc-400">Authenticating...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-8 h-8 bg-zinc-600 dark:bg-zinc-400 rounded-full flex items-center justify-center mx-auto mb-4">
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
              className="mt-4 px-4 py-2 bg-zinc-900 text-white rounded hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Back to VEHA Hub
            </button>
          </>
        )}
      </div>
    </div>
  );
}
