"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Lock,
  Target,
  TrendingUp,
  Calendar,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminHowToPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "ADMIN")) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">
              Predictions & Tips Management Guide
            </h1>
          </div>
          <p className="text-muted-foreground">
            Complete guide to managing predictions, tips, and VIP updates
          </p>
        </div>

        {/* Quick Navigation */}
        <Card className="mb-8 border-2 border-primary">
          <CardHeader>
            <CardTitle>Quick Navigation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <a href="#creating" className="text-primary hover:underline">
                📝 Creating Predictions
              </a>
              <a href="#categories" className="text-primary hover:underline">
                🏷️ Categories
              </a>
              <a href="#settling" className="text-primary hover:underline">
                ✅ Settling Results
              </a>
              <a href="#best-practices" className="text-primary hover:underline">
                💡 Best Practices
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              System Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-bold mb-2">Two Types of Content:</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border-2 border-border p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-5 w-5 text-blue-500" />
                    <h4 className="font-bold">Tips</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Regular predictions for match outcomes, over/under, both
                    teams to score, etc. Can be free or VIP.
                  </p>
                </div>
                <div className="border-2 border-purple-500 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-purple-500" />
                    <h4 className="font-bold">Updates</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    VIP-only updates with breaking news, correct score
                    predictions, and draw alerts. Time-sensitive content.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-2">Access Levels:</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge>Free</Badge>
                  <span className="text-sm">
                    Available to all users, including guests
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary">
                    <Lock className="h-3 w-3 mr-1" />
                    VIP
                  </Badge>
                  <span className="text-sm">
                    Requires active subscription or valid VIP token
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Creating Predictions */}
        <Card className="mb-8" id="creating">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Creating Predictions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">
                  1
                </span>
                Navigate to Predictions Management
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                Go to{" "}
                <Link
                  href="/admin/predictions"
                  className="text-primary hover:underline"
                >
                  Admin → Predictions
                </Link>{" "}
                and click "New Prediction"
              </p>
            </div>

            <div>
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">
                  2
                </span>
                Fill in Required Fields
              </h3>
              <div className="space-y-3">
                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold text-sm mb-1">Title</h4>
                  <p className="text-sm text-muted-foreground">
                    Clear, descriptive title. Example: "Manchester City vs
                    Arsenal - Home Win Expected"
                  </p>
                </div>
                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold text-sm mb-1">Summary</h4>
                  <p className="text-sm text-muted-foreground">
                    Brief 1-2 sentence preview. Shows in card view.
                  </p>
                </div>
                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold text-sm mb-1">Content</h4>
                  <p className="text-sm text-muted-foreground">
                    Full analysis with markdown support. Include stats, team
                    form, and reasoning.
                  </p>
                </div>
                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold text-sm mb-1">Match Details</h4>
                  <p className="text-sm text-muted-foreground">
                    Sport, league, teams, match date, odds, and prediction type.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">
                  3
                </span>
                Set Category and Access Level
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border-2 border-border p-4 rounded-lg">
                  <h4 className="font-bold mb-2">Category</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <div>
                        <strong>Tip:</strong> Regular predictions (match
                        outcomes, goals, etc.)
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">•</span>
                      <div>
                        <strong>Update:</strong> Breaking news, correct scores,
                        draw alerts
                      </div>
                    </li>
                  </ul>
                </div>
                <div className="border-2 border-border p-4 rounded-lg">
                  <h4 className="font-bold mb-2">Access Level</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      <div>
                        <strong>Free:</strong> Uncheck "VIP Only" - Available
                        to everyone
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <div>
                        <strong>VIP:</strong> Check "VIP Only" - Requires
                        subscription
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">
                  4
                </span>
                Set Status and Publish
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Draft</Badge>
                  <span className="text-sm">Save without publishing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>Published</Badge>
                  <span className="text-sm">
                    Immediately visible to users (if publish date is past)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Scheduled</Badge>
                  <span className="text-sm">
                    Will publish automatically at specified date/time
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories Guide */}
        <Card className="mb-8" id="categories">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Understanding Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-blue-500 p-4 rounded-lg">
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                Tips (Regular Predictions)
              </h3>
              <div className="space-y-2 text-sm">
                <p className="font-semibold">When to use:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Match winner predictions (home/away/draw)</li>
                  <li>Over/Under goals</li>
                  <li>Both teams to score</li>
                  <li>Handicap bets</li>
                  <li>Regular analysis posts</li>
                </ul>
                <p className="font-semibold mt-3">Display:</p>
                <p className="text-muted-foreground">
                  Shows in "Tips" section on both free and VIP pages
                </p>
              </div>
            </div>

            <div className="border-2 border-purple-500 p-4 rounded-lg">
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-purple-500" />
                Updates (VIP Only)
              </h3>
              <div className="space-y-2 text-sm">
                <p className="font-semibold">When to use:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Breaking team news affecting predictions</li>
                  <li>Correct score predictions (high odds)</li>
                  <li>Draw alerts (last-minute changes)</li>
                  <li>Injury updates changing match dynamics</li>
                  <li>Time-sensitive betting opportunities</li>
                </ul>
                <p className="font-semibold mt-3">Display:</p>
                <p className="text-muted-foreground">
                  Shows in separate "VIP Updates" section with purple badge
                </p>
                <div className="mt-2 p-2 bg-purple-50 dark:bg-purple-950 rounded">
                  <p className="text-xs">
                    💡 <strong>Tip:</strong> Use emoji in titles for updates
                    (🚨, ⚠️, 🔥) to grab attention
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settling Results */}
        <Card className="mb-8" id="settling">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Settling Prediction Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-950 border-2 border-yellow-500 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-bold mb-1">Important!</h4>
                  <p className="text-sm">
                    Always settle predictions after matches complete. This
                    builds trust and shows transparency to users.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-3">How to Settle:</h3>
              <ol className="space-y-3">
                <li className="flex gap-3">
                  <span className="font-bold text-primary">1.</span>
                  <div>
                    <p className="font-semibold">Wait for Match Completion</p>
                    <p className="text-sm text-muted-foreground">
                      Ensure the match has finished and official results are
                      confirmed
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary">2.</span>
                  <div>
                    <p className="font-semibold">Find the Prediction</p>
                    <p className="text-sm text-muted-foreground">
                      Go to Predictions Management and locate the prediction
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary">3.</span>
                  <div>
                    <p className="font-semibold">Click Result Button</p>
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Won
                      </Button>
                      <Button size="sm" variant="destructive">
                        <XCircle className="h-4 w-4 mr-1" />
                        Lost
                      </Button>
                    </div>
                  </div>
                </li>
              </ol>
            </div>

            <div>
              <h3 className="font-bold mb-2">Result Types:</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500">Won</Badge>
                  <span className="text-sm">
                    Prediction was correct - moves to history
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-500">Lost</Badge>
                  <span className="text-sm">
                    Prediction was incorrect - moves to history
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-gray-500">Void</Badge>
                  <span className="text-sm">
                    Match cancelled/postponed - moves to history
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-yellow-500">Pending</Badge>
                  <span className="text-sm">
                    Default state - stays in current predictions
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* History System */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              History System
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-bold mb-2">
                When Predictions Move to History:
              </h3>
              <div className="space-y-2">
                <div className="border-l-4 border-primary pl-4">
                  <p className="font-semibold text-sm">
                    Match Date Passed (2+ hours ago)
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Automatically moves to history 2 hours after match date
                  </p>
                </div>
                <div className="border-l-4 border-primary pl-4">
                  <p className="font-semibold text-sm">Result is Settled</p>
                  <p className="text-sm text-muted-foreground">
                    Immediately moves when you mark as Won/Lost/Void
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 border-2 border-blue-500 p-4 rounded-lg">
              <h4 className="font-bold mb-2">Why History Matters:</h4>
              <ul className="space-y-1 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">✓</span>
                  <span>Builds trust by showing transparency</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">✓</span>
                  <span>Demonstrates track record to potential VIP users</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">✓</span>
                  <span>Shows you're honest about losses, not just wins</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">✓</span>
                  <span>Helps users make informed subscription decisions</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Best Practices */}
        <Card className="mb-8" id="best-practices">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border-2 border-green-500 p-4 rounded-lg">
                <h3 className="font-bold text-green-600 mb-2 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Do This
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Provide detailed analysis with stats</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Set realistic confidence levels</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Settle results promptly after matches</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Use featured flag for best predictions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Add ticket snapshots for VIP tips</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Use updates for time-sensitive info</span>
                  </li>
                </ul>
              </div>

              <div className="border-2 border-red-500 p-4 rounded-lg">
                <h3 className="font-bold text-red-600 mb-2 flex items-center gap-2">
                  <XCircle className="h-5 w-5" />
                  Avoid This
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">✗</span>
                    <span>Don't make predictions without analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">✗</span>
                    <span>Don't forget to settle results</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">✗</span>
                    <span>Don't hide losing predictions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">✗</span>
                    <span>Don't overuse featured flag</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">✗</span>
                    <span>Don't create VIP content without value</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">✗</span>
                    <span>Don't use clickbait titles</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-primary/10 border-2 border-primary p-4 rounded-lg">
              <h3 className="font-bold mb-2">Content Quality Tips:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">1.</span>
                  <div>
                    <strong>Research thoroughly:</strong> Use stats, team form,
                    head-to-head records
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">2.</span>
                  <div>
                    <strong>Be honest:</strong> Explain reasoning clearly, even
                    for losses
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">3.</span>
                  <div>
                    <strong>Add value:</strong> VIP content should offer
                    insights not available elsewhere
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">4.</span>
                  <div>
                    <strong>Stay consistent:</strong> Regular posting schedule
                    builds trust
                  </div>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Quick Reference */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-bold mb-2">Prediction Types:</h3>
                <ul className="text-sm space-y-1">
                  <li>• Winner (home/away/draw)</li>
                  <li>• Over/Under goals</li>
                  <li>• Both teams to score</li>
                  <li>• Correct score</li>
                  <li>• Handicap</li>
                  <li>• Other</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold mb-2">Status Options:</h3>
                <ul className="text-sm space-y-1">
                  <li>• Draft - Not visible</li>
                  <li>• Published - Live now</li>
                  <li>• Scheduled - Auto-publish later</li>
                  <li>• Archived - Hidden from users</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Actions */}
        <div className="flex justify-center gap-4">
          <Link href="/admin/predictions">
            <Button size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Create New Prediction
            </Button>
          </Link>
          <Link href="/admin">
            <Button size="lg" variant="outline">
              Back to Admin Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
