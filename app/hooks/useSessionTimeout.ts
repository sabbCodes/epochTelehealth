"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

// Configurable timeouts
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;  // 30 minutes of inactivity
const ABSOLUTE_SESSION_MS   =  8 * 60 * 60 * 1000; // 8-hour hard cap
const STORAGE_KEY_LOGIN_AT  = "epoch_session_login_at";

export function useSessionTimeout() {
  const router = useRouter();
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const absoluteTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const signOutAndRedirect = useCallback(async (reason: "inactivity" | "absolute") => {
    console.info(`[SessionTimeout] Signing out – reason: ${reason}`);
    try {
      const { supabase } = await import("@/lib/supabase");
      await supabase.auth.signOut();
    } catch (_) {
      // Best-effort; still redirect even on error
    } finally {
      localStorage.removeItem(STORAGE_KEY_LOGIN_AT);
      router.push("/signin");
    }
  }, [router]);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(
      () => signOutAndRedirect("inactivity"),
      INACTIVITY_TIMEOUT_MS
    );
  }, [signOutAndRedirect]);

  useEffect(() => {
    // 1. Record / read login timestamp
    let loginAt = Number(localStorage.getItem(STORAGE_KEY_LOGIN_AT));
    if (!loginAt) {
      loginAt = Date.now();
      localStorage.setItem(STORAGE_KEY_LOGIN_AT, String(loginAt));
    }

    // 2. Absolute session cap
    const elapsed    = Date.now() - loginAt;
    const remaining  = ABSOLUTE_SESSION_MS - elapsed;

    if (remaining <= 0) {
      // Session already expired (e.g. tab left open overnight)
      signOutAndRedirect("absolute");
      return;
    }

    absoluteTimer.current = setTimeout(
      () => signOutAndRedirect("absolute"),
      remaining
    );

    // 3. Inactivity timer – start & bind events
    resetInactivityTimer();

    const activityEvents = [
      "mousemove", "mousedown", "keydown",
      "scroll", "touchstart", "click", "wheel",
    ];

    activityEvents.forEach((evt) =>
      window.addEventListener(evt, resetInactivityTimer, { passive: true })
    );

    // Cleanup on unmount
    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      if (absoluteTimer.current)   clearTimeout(absoluteTimer.current);
      activityEvents.forEach((evt) =>
        window.removeEventListener(evt, resetInactivityTimer)
      );
    };
  }, [resetInactivityTimer, signOutAndRedirect]);
}
