"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button"; // Assuming Button component is in a separate file

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to the console for debugging
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <div className="max-w-md w-full bg-card text-card-foreground shadow-md p-6 text-center rounded-lg">
        <h2 className="text-2xl font-bold text-destructive mb-4">
          Oops! Something went wrong.
        </h2>
        <p className="text-muted-foreground mb-6">{error.message}</p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
