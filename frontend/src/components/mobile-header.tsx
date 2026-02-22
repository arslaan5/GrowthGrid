"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  PenSquare,
  CalendarDays,
  BookOpen,
  LogOut,
  Sun,
  Moon,
  Menu,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/entries", label: "Entries", icon: BookOpen },
  { href: "/dashboard/entries/new", label: "New Entry", icon: PenSquare },
  { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDays },
];

export function MobileHeader() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <header className="md:hidden flex items-center justify-between border-b px-4 py-3 bg-card">
      <div className="flex items-center gap-2">
        <Flame className="h-5 w-5 text-primary animate-pulse" />
        <span className="font-bold">GrowthGrid</span>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="px-6 py-5 text-lg font-bold">
            GrowthGrid
          </SheetTitle>
          <Separator />
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item, idx) => {
              const active =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                >
                  <span
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                      "transition-all duration-150 hover:translate-x-0.5",
                      "animate-fade-up",
                      idx === 0 && "stagger-1",
                      idx === 1 && "stagger-2",
                      idx === 2 && "stagger-3",
                      idx === 3 && "stagger-4",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0 transition-transform duration-150 hover:scale-110" />
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
          <Separator />
          <div className="px-3 py-4 space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-3"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <span className="animate-icon-spin-in">
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </span>
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-3 text-destructive"
              onClick={() => logout()}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
