"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Shield, BarChart3 } from "lucide-react";
import { Icon } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export function AdminNavbar() {
  const { user, logout } = useAuth();

  if (!user || user.role !== "ADMIN") return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo with Admin Badge */}
          <Link href="/admin" className="flex items-center space-x-3">
            <div className="h-4 flex relative items-center gap-2">
              <Icon />
              <span className="text-xl font-bold">ScoreFusion</span>
              <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-primary text-primary-foreground rounded-full flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Admin
              </span>
            </div>
          </Link>

          {/* Center - Quick Stats or Info */}
          <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span>Admin Dashboard</span>
            </div>
          </div>

          {/* Right side - User Menu */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden lg:inline">
                    {user.displayName || "Admin"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.displayName || "Admin"}
                    </p>
                    {user.email && (
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    )}
                    <p className="text-xs text-primary flex items-center gap-1 mt-1">
                      <Shield className="h-3 w-3" />
                      Administrator
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/dashboard">
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>User Dashboard</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
