"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface UseUnsavedChangesReturn {
  /** Call instead of router.back() / router.push() for guarded navigation. */
  guardedNavigate: (href?: string) => void;
  /** Whether the confirm dialog should be shown. */
  showDialog: boolean;
  /** Call when user confirms leaving — performs the pending navigation. */
  confirmLeave: () => void;
  /** Call when user cancels — hides the dialog, stays on page. */
  cancelLeave: () => void;
}

export function useUnsavedChanges(isDirty: boolean): UseUnsavedChangesReturn {
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  // undefined = go back | string = push href
  const pendingHref = useRef<string | undefined>(undefined);
  // Set to true while we are intentionally navigating away so popstate is ignored
  const confirming = useRef(false);

  // ── 1. Browser close / refresh ──────────────────────────────────────────
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // ── 2. Browser back / forward button (popstate) ─────────────────────────
  // Track how many sentinel entries we've pushed so confirmLeave can pop them all
  const sentinelCount = useRef(0);

  useEffect(() => {
    if (!isDirty) return;

    // Push ONE sentinel so the back press has something to cancel against
    window.history.pushState(null, "", window.location.href);
    sentinelCount.current = 1;

    const handlePop = () => {
      // Skip if we triggered this pop ourselves via confirmLeave
      if (confirming.current) return;
      // Re-push ONE sentinel to keep catching repeated back presses
      window.history.pushState(null, "", window.location.href);
      sentinelCount.current = 1;
      pendingHref.current = undefined; // undefined → go back after confirm
      setShowDialog(true);
    };

    window.addEventListener("popstate", handlePop);
    return () => {
      window.removeEventListener("popstate", handlePop);
      sentinelCount.current = 0;
    };
  }, [isDirty]);

  // ── 3. In-page UI navigation (back arrow button, cancel link) ───────────
  const guardedNavigate = useCallback(
    (href?: string) => {
      if (isDirty) {
        pendingHref.current = href;
        setShowDialog(true);
      } else {
        if (href) router.push(href);
        else router.back();
      }
    },
    [isDirty, router],
  );

  const confirmLeave = useCallback(() => {
    confirming.current = true;
    setShowDialog(false);
    const dest = pendingHref.current;
    pendingHref.current = undefined;
    if (dest) {
      router.push(dest);
    } else {
      // Jump back past all sentinel entries + the actual page in one go
      const steps = sentinelCount.current + 1;
      sentinelCount.current = 0;
      window.history.go(-steps);
    }
  }, [router]);

  const cancelLeave = useCallback(() => {
    setShowDialog(false);
    pendingHref.current = undefined;
  }, []);

  return { guardedNavigate, showDialog, confirmLeave, cancelLeave };
}
