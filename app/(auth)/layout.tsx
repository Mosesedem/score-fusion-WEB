"use client";

import { redirect } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      redirect("/");
    }
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary text-xl">Loading...</div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex pt-16">
        <main className="flex-1 lg:pl-64">{children}</main>
      </div>
    </div>
  );
}
