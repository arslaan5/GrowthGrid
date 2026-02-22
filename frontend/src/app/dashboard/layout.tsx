"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/sidebar";
import { MobileHeader } from "@/components/mobile-header";
import { KeyboardShortcutProvider } from "@/components/keyboard-shortcut-provider";
import { Loader } from "@/components/loader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <Loader message="Loading your dashboard…" />;
  }

  return (
    <KeyboardShortcutProvider>
      <div className="flex h-screen flex-col md:flex-row overflow-hidden">
        <MobileHeader />
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      </div>
    </KeyboardShortcutProvider>
  );
}
