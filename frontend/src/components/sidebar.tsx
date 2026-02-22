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
    <aside className="bg-card hidden w-64 flex-col border-r md:flex">
      {/* Brand */}
      <div className="flex items-center gap-2 px-6 py-5">
        <Flame className="text-primary h-6 w-6 animate-pulse" />
        <span className="text-lg font-bold">GrowthGrid</span>
      </div>

      <Separator />

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href) &&
                !(item.href === "/dashboard/entries" && pathname.startsWith("/dashboard/entries/"));
          const isEntriesExact = item.href === "/dashboard/entries";
          const finalActive = isEntriesExact ? pathname === "/dashboard/entries" : active;
          return (
            <Link key={item.href} href={item.href}>
              <span
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                  "transition-all duration-150 hover:translate-x-0.5",
                  finalActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0 transition-transform duration-150 hover:scale-110" />
                <span className="flex-1">{item.label}</span>
                {item.href === "/dashboard/entries/new" && (
                  <kbd className="hidden rounded border px-1 py-0.5 font-mono text-[10px] opacity-60 lg:inline">
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
      <div className="space-y-2 px-3 py-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <span className="animate-icon-spin-in">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </span>
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive w-full justify-start gap-3"
          onClick={() => logout()}
        >
          <LogOut className="h-4 w-4 transition-transform duration-150 hover:scale-110" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
