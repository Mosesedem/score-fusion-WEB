"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Copy, CheckCircle, DollarSign, TrendingUp } from "lucide-react";

interface ReferralData {
  code: string;
  referralCount: number;
  earnings: number;
  pendingEarnings: number;
  referrals: Array<{
    id: string;
    username: string;
    status: string;
    earnings: number;
    joinedAt: string;
  }>;
}

export default function ReferralPage() {
  const { user, isLoading } = useAuth();
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      fetchReferralData();
    }
  }, [isLoading, user]);

  const fetchReferralData = async () => {
    try {
      const res = await fetch("/api/referral");
      if (res.ok) {
        const data = await res.json();
        setReferralData(data);
      }
    } catch (error) {
      console.error("Failed to fetch referral data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (referralData?.code) {
      const url = `${window.location.origin}/signup?ref=${referralData.code}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyCodeOnly = () => {
    if (referralData?.code) {
      navigator.clipboard.writeText(referralData.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Coming Soon Banner */}
      <section className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="text-center">
            <Badge className="bg-primary-foreground text-primary font-bold text-xs md:text-sm px-3 py-1">
              COMING SOON
            </Badge>
            <p className="text-xs md:text-sm mt-1 md:mt-2 opacity-90">
              This feature is currently under development and will be available
              soon
            </p>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="border-b border-border bg-secondary">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-3 md:mb-4">
              Referral Program
            </h1>
            <p className="text-base md:text-xl text-muted-foreground">
              Earn 20% commission on every friend who subscribes to VIP
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          {!user && !isLoading && (
            <Card className="mb-6 md:mb-8 border-2 border-primary">
              <CardContent className="p-6 md:p-8 text-center">
                <Users className="h-10 w-10 md:h-12 md:w-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg md:text-xl font-bold mb-2">
                  Sign up to start referring
                </h3>
                <p className="text-sm md:text-base text-muted-foreground mb-4">
                  Create an account to get your unique referral code and start
                  earning
                </p>
                <Link href="/signup">
                  <Button size="lg" className="h-11 md:h-auto">
                    Create Account
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {user && referralData && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 md:gap-6 mb-8 md:mb-12">
                <Card>
                  <CardHeader className="pb-2 md:pb-3 p-3 md:p-6">
                    <CardTitle className="text-xs md:text-sm text-muted-foreground">
                      Total Referrals
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 md:p-6 md:pt-0">
                    <div className="flex items-center gap-1 md:gap-2">
                      <Users className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                      <span className="text-2xl md:text-3xl font-bold">
                        {referralData.referralCount}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2 md:pb-3 p-3 md:p-6">
                    <CardTitle className="text-xs md:text-sm text-muted-foreground">
                      Total Earnings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 md:p-6 md:pt-0">
                    <div className="flex items-center gap-1 md:gap-2">
                      <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                      <span className="text-2xl md:text-3xl font-bold">
                        ${referralData.earnings.toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2 md:pb-3 p-3 md:p-6">
                    <CardTitle className="text-xs md:text-sm text-muted-foreground">
                      Pending
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 md:p-6 md:pt-0">
                    <div className="flex items-center gap-1 md:gap-2">
                      <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                      <span className="text-2xl md:text-3xl font-bold">
                        ${referralData.pendingEarnings.toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Referral Code Card */}
              <Card className="mb-8 md:mb-12 border-2 border-primary">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-base md:text-lg">
                    Your Referral Code
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-4 md:p-6 md:pt-0">
                  <div>
                    <label className="text-xs md:text-sm text-muted-foreground mb-2 block">
                      Referral Link
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        value={`${
                          typeof window !== "undefined"
                            ? window.location.origin
                            : ""
                        }/signup?ref=${referralData.code}`}
                        readOnly
                        className="font-mono text-xs md:text-sm h-11 md:h-10"
                      />
                      <Button
                        onClick={handleCopyCode}
                        className="h-11 md:h-10 shrink-0 w-full sm:w-auto"
                      >
                        {copied ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs md:text-sm text-muted-foreground mb-2 block">
                      Referral Code Only
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        value={referralData.code}
                        readOnly
                        className="font-mono font-bold text-lg md:text-xl h-11 md:h-10"
                      />
                      <Button
                        onClick={handleCopyCodeOnly}
                        variant="outline"
                        className="h-11 md:h-10 shrink-0 w-full sm:w-auto"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Referral List */}
              <div>
                <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">
                  Your Referrals
                </h2>

                {referralData.referrals.length > 0 ? (
                  <div className="space-y-3 md:space-y-4">
                    {referralData.referrals.map((referral) => (
                      <Card key={referral.id}>
                        <CardContent className="p-4 md:p-6">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 md:gap-4 min-w-0">
                              <div className="h-10 w-10 bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0 text-sm md:text-base">
                                {referral.username.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-sm md:text-base truncate">
                                  {referral.username}
                                </div>
                                <div className="text-xs md:text-sm text-muted-foreground">
                                  Joined{" "}
                                  {new Date(
                                    referral.joinedAt
                                  ).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-lg md:text-xl font-bold text-primary">
                                ${referral.earnings.toFixed(2)}
                              </div>
                              <Badge
                                className={`text-xs ${
                                  referral.status === "ACTIVE"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary"
                                }`}
                              >
                                {referral.status}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-6 md:p-8 text-center text-muted-foreground text-sm md:text-base">
                      No referrals yet. Share your code to start earning!
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}

          {loading && (
            <Card>
              <CardContent className="p-6 md:p-8 text-center text-muted-foreground text-sm md:text-base">
                Loading referral data...
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-border bg-secondary py-8 md:py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto">
            <Card>
              <CardHeader className="p-4 md:p-6">
                <div className="h-10 w-10 md:h-12 md:w-12 bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg md:text-xl mb-2">
                  1
                </div>
                <CardTitle className="text-base md:text-lg">
                  Share Your Code
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-xs md:text-sm p-4 md:p-6 md:pt-0">
                Copy your unique referral link and share it with friends
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 md:p-6">
                <div className="h-10 w-10 md:h-12 md:w-12 bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg md:text-xl mb-2">
                  2
                </div>
                <CardTitle className="text-base md:text-lg">
                  They Sign Up
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-xs md:text-sm p-4 md:p-6 md:pt-0">
                Your friends create an account using your referral code
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 md:p-6">
                <div className="h-10 w-10 md:h-12 md:w-12 bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg md:text-xl mb-2">
                  3
                </div>
                <CardTitle className="text-base md:text-lg">You Earn</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-xs md:text-sm p-4 md:p-6 md:pt-0">
                Get 20% commission when they subscribe to VIP
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
