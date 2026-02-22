"use client";

import { useState, useEffect } from "react";

/** Returns true if the user is on macOS. */
export function useIsMac(): boolean {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    // Reading navigator.userAgent inside an effect ensures client-only execution
    // (avoids SSR mismatch). The one-time setState call is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMac(/mac/i.test(navigator.userAgent));
  }, []);

  return isMac;
}

/** Returns the platform-aware modifier label: "⌥" on Mac, "Alt+" on others. */
export function useModLabel(): string {
  const isMac = useIsMac();
  return isMac ? "⌥" : "Alt+";
}
