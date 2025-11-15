"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Eye, EyeOff } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tokenFromUrl = searchParams?.get("token")?.trim() ?? "";

  const [token, setToken] = useState(tokenFromUrl);
  const [isTokenLocked, setIsTokenLocked] = useState(Boolean(tokenFromUrl));
  const [isVerified, setIsVerified] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      setIsTokenLocked(true);
    }
  }, [tokenFromUrl]);

  // Auto-verify when a token is present in the URL
  useEffect(() => {
    const autoVerify = async () => {
      if (!tokenFromUrl || isVerified) return;
      try {
        setIsSubmitting(true);
        const response = await fetch("/api/auth/reset-password/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: tokenFromUrl }),
        });
        const result = await response.json();
        if (response.ok) {
          setIsVerified(true);
          setStatusMessage("Code verified. You can now set a new password.");
        } else {
          setErrorMessage(result.error?.message || "Invalid or expired code");
        }
      } catch {
        // Silent fail, user can try manual verify
      } finally {
        setIsSubmitting(false);
      }
    };
    autoVerify();
  }, [tokenFromUrl, isVerified]);

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage("");
    setStatusMessage("");

    if (!token || !/^\d{5,6}$/.test(token)) {
      setErrorMessage("Please enter a valid 5 or 6 digit code");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/reset-password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(result.error?.message || "Invalid or expired code");
        return;
      }

      setIsVerified(true);
      setIsTokenLocked(true);
      setStatusMessage("Code verified. You can now set a new password.");
    } catch (error) {
      console.error("Verify reset code error", error);
      setErrorMessage("Something went wrong. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage("");
    setStatusMessage("");

    if (!isVerified) {
      setErrorMessage("Please verify your reset code first.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters");
      return;
    }

    if (
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      setErrorMessage(
        "Password must include uppercase, lowercase, and a number"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(result.error?.message || "Unable to reset password");
        return;
      }

      setStatusMessage(
        result.data?.message ||
          "Password updated successfully. Redirecting to sign in..."
      );
      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        router.push("/login");
      }, 2500);
    } catch (error) {
      console.error("Reset password error", error);
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
            Reset your password
          </h1>
          <p className="text-muted-foreground text-sm">
            {isVerified
              ? "Choose a new password for your Servixing account."
              : "Enter the 5–6 digit code from your email to continue."}
          </p>
        </div>

        {errorMessage && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-400 dark:text-red-400 p-3 rounded-lg mb-4 text-sm border border-red-200 dark:border-red-800">
            {errorMessage}
          </div>
        )}

        {statusMessage && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 p-3 rounded-lg mb-4 text-sm border border-emerald-200 dark:border-emerald-800">
            {statusMessage}
          </div>
        )}

        {!isVerified ? (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label htmlFor="token" className="block text-sm font-medium mb-2">
                Reset code
              </label>
              <Input
                id="token"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={token}
                onChange={(event) =>
                  setToken(event.target.value.replace(/\D/g, ""))
                }
                placeholder="Enter 5–6 digit code"
                required
                readOnly={isTokenLocked}
                disabled={isSubmitting && isTokenLocked}
                className="h-11 tracking-widest"
              />
              {isTokenLocked ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Code detected from your email link. If it expired, request a
                  new one.
                </p>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">
                  Enter the 5–6 digit code we emailed you.
                </p>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying code...
                </>
              ) : (
                "Verify code"
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2"
              >
                New password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  className="h-11 pr-12"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Use at least 8 characters, including uppercase, lowercase, and a
                number.
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium mb-2"
              >
                Confirm new password
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  className="h-11 pr-12"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                  disabled={isSubmitting}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating password...
                </>
              ) : (
                "Update password"
              )}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground mt-6">
          Need a new link?{" "}
          <Link
            href="/forgot-password"
            className="text-primary hover:text-primary font-medium hover:underline"
          >
            Request another reset email
          </Link>
        </p>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-8 shadow-xl">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </Card>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
