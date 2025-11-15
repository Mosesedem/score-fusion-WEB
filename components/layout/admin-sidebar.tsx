"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Crown,
  Flag,
  Shield,
  Menu,
  X,
  LogOut,
  Trophy,
  UserCog,
  CreditCard,
  BookOpen,
} from "lucide-react";

const adminItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/tips", label: "Tips Management", icon: TrendingUp },
  { href: "/admin/predictions", label: "Predictions", icon: Trophy },
  { href: "/admin/blog", label: "Blog", icon: BookOpen },
  { href: "/admin/teams", label: "Teams", icon: Shield },
  { href: "/admin/vip-tokens", label: "VIP Tokens", icon: Crown },
  { href: "/admin/feature-flags", label: "Feature Flags", icon: Flag },
  { href: "/admin/how-to", label: "How-To Guide", icon: BookOpen },
  // { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user || user.role !== "ADMIN") return null;

  const closeSheet = () => setIsOpen(false);
  const toggleSheet = () => setIsOpen(!isOpen);

  const handleLogout = () => {
    logout();
    closeSheet();
  };

  return (
    <>
      {/* Desktop Sidebar - Vertical List */}
      <aside className="hidden lg:block fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 z-30">
        <nav className="p-3 space-y-1 overflow-y-auto h-full scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
          <div className="px-3 py-2 mb-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Admin Controls
            </h2>
          </div>

          {adminItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={active ? "default" : "ghost"}
                  className="w-full justify-start gap-2"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}

          {/* Desktop Actions */}
          <div className="pt-4 mt-4 border-t border-border space-y-1">
            <Link href="/dashboard">
              <Button variant="outline" className="w-full justify-start gap-2">
                <UserCog className="h-4 w-4" />
                User Dashboard
              </Button>
            </Link>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </nav>
      </aside>

      {/* Mobile - Floating Menu Button */}
      <button
        onClick={toggleSheet}
        className="lg:hidden fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center z-50"
        aria-label="Toggle admin menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile - Bottom Sheet Overlay */}
      {isOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
            onClick={closeSheet}
          />
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom duration-300 shadow-2xl">
            {/* Sheet Header */}
            <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-bold">Admin Panel</h2>
                  <p className="text-xs text-muted-foreground">
                    {user.displayName || "Administrator"}
                  </p>
                </div>
              </div>
              <button
                onClick={closeSheet}
                className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-accent transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Sheet Content - Scrollable Grid */}
            <div className="overflow-y-auto max-h-[calc(85vh-10rem)] p-4">
              {/* Menu Items Grid */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {adminItems.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link key={item.href} href={item.href} onClick={closeSheet}>
                      <Card
                        className={`
                          flex flex-col items-center justify-center p-4 min-h-24 
                          transition-all duration-200 active:scale-95 cursor-pointer
                          ${
                            active
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-card hover:bg-accent border-border"
                          }
                        `}
                      >
                        <item.icon
                          className={`h-6 w-6 mb-2 ${
                            active
                              ? "text-primary-foreground"
                              : "text-foreground"
                          }`}
                        />
                        <span
                          className={`text-xs font-medium text-center leading-tight ${
                            active
                              ? "text-primary-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {item.label}
                        </span>
                      </Card>
                    </Link>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4 border-t border-border">
                <Link href="/dashboard" onClick={closeSheet}>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-12"
                  >
                    <UserCog className="h-5 w-5" />
                    User Dashboard
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start gap-3 h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
