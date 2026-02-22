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

  // ── 1. Browser close / refresh ──────────────────────────────────────────
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // ── 2. Browser back / forward button (popstate) ─────────────────────────
  useEffect(() => {
    if (!isDirty) return;

    // Push a sentinel so the back press has something to cancel against
    window.history.pushState(null, "", window.location.href);

    const handlePop = () => {
      // Re-push to keep catching repeated back presses
      window.history.pushState(null, "", window.location.href);
      pendingHref.current = undefined; // undefined → go back after confirm
      setShowDialog(true);
    };

    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
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
    setShowDialog(false);
    const dest = pendingHref.current;
    pendingHref.current = undefined;
    if (dest) router.push(dest);
    else router.back();
  }, [router]);

  const cancelLeave = useCallback(() => {
    setShowDialog(false);
    pendingHref.current = undefined;
  }, []);

  return { guardedNavigate, showDialog, confirmLeave, cancelLeave };
}
