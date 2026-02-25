"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function LoginPage() {
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Navigate immediately if user is already authenticated - don't wait for useEffect
  // Use window.location for hard navigation to ensure it works in production.
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7250/ingest/31bbd6ce-720a-4f7a-952f-43db051584c6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login/page.tsx:21',message:'redirect useEffect triggered',data:{authLoading,hasUser:!!user,userId:user?.id||null},timestamp:Date.now(),runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    if (!authLoading && user) {
      // #region agent log
      fetch('http://127.0.0.1:7250/ingest/31bbd6ce-720a-4f7a-952f-43db051584c6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login/page.tsx:23',message:'window.location.href=/dashboard called',data:{userId:user?.id},timestamp:Date.now(),runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      window.location.href = "/dashboard";
      return;
    }
  }, [user, authLoading]);

  // Don't render login form if user is authenticated (prevents flash)
  if (!authLoading && user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // #region agent log
    fetch('http://127.0.0.1:7250/ingest/31bbd6ce-720a-4f7a-952f-43db051584c6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login/page.tsx:27',message:'handleSubmit called',data:{email},timestamp:Date.now(),runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    try {
      await login(email, password);
      // #region agent log
      fetch('http://127.0.0.1:7250/ingest/31bbd6ce-720a-4f7a-952f-43db051584c6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login/page.tsx:32',message:'login() returned successfully',data:{user:user?.id||null},timestamp:Date.now(),runId:'run1',hypothesisId:'A,B,C'})}).catch(()=>{});
      // #endregion
      toast.success("Welcome back!");
      // Navigation is handled by the useEffect above once user state is set.
    } catch {
      // #region agent log
      fetch('http://127.0.0.1:7250/ingest/31bbd6ce-720a-4f7a-952f-43db051584c6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login/page.tsx:34',message:'login() threw error',data:{},timestamp:Date.now(),runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      toast.error("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <Card className="animate-fade-up w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">GrowthGrid</CardTitle>
          <CardDescription>Sign in to your learning journal</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="transition-all duration-200 focus:scale-[1.01]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="transition-all duration-200 focus:scale-[1.01]"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <p className="text-muted-foreground mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-primary hover:text-primary/80 underline underline-offset-4"
            >
              Register
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
