"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/sidebar";
import { MobileHeader } from "@/components/mobile-header";
import { KeyboardShortcutProvider } from "@/components/keyboard-shortcut-provider";
import { Loader } from "@/components/loader";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, error, refresh } = useAuth();
  const router = useRouter();

  // Redirect unauthenticated users — useEffect is required here because
  // useAuth is a client-side context hook; router.replace is the correct
  // client-component equivalent of server-side redirect().
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, error, router]);

  if (loading) {
    return <Loader message="Loading your dashboard…" />;
  }

  // API-down / server-error state
  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <AlertTriangle className="text-destructive h-12 w-12" />
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="text-muted-foreground max-w-md text-sm">{error}</p>
        <Button onClick={() => refresh()} variant="outline" className="mt-2">
          Try again
        </Button>
      </div>
    );
  }

  if (!user) {
    return <Loader message="Redirecting…" />;
  }

  return (
    <KeyboardShortcutProvider>
      <div className="flex h-screen flex-col overflow-hidden md:flex-row">
        <MobileHeader />
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      </div>
    </KeyboardShortcutProvider>
  );
}
