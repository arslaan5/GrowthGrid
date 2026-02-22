"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  PenSquare,
  CalendarDays,
  BookOpen,
  LogOut,
  Sun,
  Moon,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useModLabel } from "@/lib/use-platform";
const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/entries", label: "Entries", icon: BookOpen },
  { href: "/dashboard/entries/new", label: "New Entry", icon: PenSquare },
  { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDays },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const modLabel = useModLabel();

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-card">
      {/* Brand */}
      <div className="flex items-center gap-2 px-6 py-5">
        <Flame className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold">GrowthGrid</span>
      </div>

      <Separator />

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href) &&
                !(
                  item.href === "/dashboard/entries" &&
                  pathname.startsWith("/dashboard/entries/")
                );
          // Special-case: /dashboard/entries is only active for exact /dashboard/entries path
          const isEntriesExact = item.href === "/dashboard/entries";
          const finalActive = isEntriesExact
            ? pathname === "/dashboard/entries"
            : active;
          return (
            <Link key={item.href} href={item.href}>
              <span
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  finalActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                {item.href === "/dashboard/entries/new" && (
                  <kbd className="hidden lg:inline text-[10px] opacity-60 border rounded px-1 py-0.5 font-mono">
                    {modLabel}N
                  </kbd>
                )}
              </span>
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* Footer */}
      <div className="px-3 py-4 space-y-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-destructive hover:text-destructive"
          onClick={() => logout()}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
