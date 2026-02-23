"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Loader } from "@/components/loader";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect based on auth state — router.replace is the correct client-side
  // equivalent of server-side redirect() when auth state comes from context.
  useEffect(() => {
    if (!loading) {
      router.replace(user ? "/dashboard" : "/login");
    }
  }, [user, loading, router]);

  return <Loader message="Getting things ready…" />;
}
