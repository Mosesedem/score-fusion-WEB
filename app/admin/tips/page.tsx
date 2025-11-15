"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminTipsPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to unified predictions page
    router.replace("/admin/predictions");
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <p className="text-lg text-muted-foreground">
          Redirecting to Predictions Management...
        </p>
      </div>
    </div>
  );
}
