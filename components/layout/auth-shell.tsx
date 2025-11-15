"use client";

import React from "react";
import { useAuth } from "@/contexts/auth-context";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";

export default function AuthShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();

  // Don't show sidebar on admin routes - admin has its own layout
  const isAdminRoute = pathname?.startsWith("/admin");

  // Guest users now have same privileges as basic users - show sidebar for both
  const hasSidebar = !!user && !isAdminRoute;

  return (
    <div className={hasSidebar ? "lg:pl-64 pb-24 md:pb-0" : undefined}>
      {!isAdminRoute && <AppSidebar />}
      {children}
    </div>
  );
}
