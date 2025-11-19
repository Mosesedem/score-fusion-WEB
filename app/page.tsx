"use client";
import { redirect } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useEffect } from "react";

export default function HomePage() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      redirect("/dashboard");
    } else {
      redirect("/login");
    }
  }, [user, isLoading]);
}
