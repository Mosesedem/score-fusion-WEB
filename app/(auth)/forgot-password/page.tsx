/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatusMessage("");
    setErrorMessage("");

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(result.error?.message || "Unable to send reset email");
        return;
      }

      setStatusMessage(
        result.data?.message ||
          "If an account matches that email, a reset link has been sent."
      );
      setEmail("");
      window.location.href = "/reset-password";
    } catch (error) {
      console.error("Forgot password error", error);
      setErrorMessage("Something went wrong. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center  p-4">
      <Card className="w-full max-w-md p-8 shadow-xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2 bg-linear-to-r from-primary to-primary bg-clip-text text-transparent">
            Forgot password?
          </h1>
          <p className="text-muted-foreground text-sm">
            Enter your email address and we'll send you a link to reset your
            password.
          </p>
        </div>

        {errorMessage && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded-lg mb-4 text-sm border border-red-200 dark:border-red-800">
            {errorMessage}
          </div>
        )}

        {statusMessage && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 p-3 rounded-lg mb-4 text-sm border border-emerald-200 dark:border-emerald-800">
            {statusMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              disabled={isSubmitting}
              className="h-11"
            />
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending reset link...
              </>
            ) : (
              "Send reset link"
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Remembered your password?{" "}
          <Link
            href="/login"
            className=" font-medium hover:underline text-primary hover:text-primary"
          >
            Back to sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
