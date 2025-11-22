/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Gift,
  Star,
  Trophy,
  Target,
  TrendingUp,
  Crown,
  Zap,
  X,
} from "lucide-react";
import Link from "next/link";

interface UserEngagementProps {
  user: any;
  userStats: {
    totalTipsViewed: number;
    correctPredictions: number;
    winRate: number;
    totalEarnings: number;
    streakDays: number;
    joinedDaysAgo: number;
  };
  isVIP: boolean;
}

export function UserEngagement({
  user,
  userStats,
  isVIP,
}: UserEngagementProps) {
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  useEffect(() => {
    // Show streak celebration for 3+ day streaks
    if (userStats.streakDays >= 3 && userStats.streakDays % 3 === 0) {
      setShowStreakCelebration(true);
    }

    // Show daily reward for active users
    if (userStats.totalTipsViewed > 0 && !isVIP) {
      const lastRewardShown = localStorage.getItem("lastDailyReward");
      const today = new Date().toDateString();
      if (lastRewardShown !== today) {
        setShowDailyReward(true);
      }
    }

    // Show upgrade prompt for engaged non-VIP users only
    if (!isVIP && userStats.totalTipsViewed >= 5 && userStats.winRate > 50) {
      const lastUpgradePrompt = localStorage.getItem("lastUpgradePrompt");
      const threeDaysAgo = new Date(
        Date.now() - 3 * 24 * 60 * 60 * 1000
      ).toDateString();
      if (!lastUpgradePrompt || lastUpgradePrompt < threeDaysAgo) {
        setShowUpgradePrompt(true);
      }
    }
  }, [userStats, isVIP]);

  const handleDailyRewardClaim = () => {
    localStorage.setItem("lastDailyReward", new Date().toDateString());
    setShowDailyReward(false);
    // Here you would typically call an API to give the user their reward
  };

  const handleUpgradePromptDismiss = () => {
    localStorage.setItem("lastUpgradePrompt", new Date().toDateString());
    setShowUpgradePrompt(false);
  };

  return (
    <>
      {/* Streak Celebration */}
      {showStreakCelebration && (
        <Card className="border-amber-500 bg-linear-to-r from-amber-50 to-yellow-50 mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-amber-500 rounded-full flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-amber-800">
                    🔥 {userStats.streakDays} Day Streak!
                  </h3>
                  <p className="text-sm text-amber-700">
                    You're on fire! Keep it up for bonus rewards
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStreakCelebration(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Smart Upgrade Prompt - Only for non-VIP users */}
      {showUpgradePrompt && !isVIP && (
        <Card className="border-primary bg-linear-to-r from-primary/5 to-primary/10 mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-primary">
                    You're Ready for VIP! 🎯
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {userStats.winRate.toFixed(0)}% win rate shows you know good
                    tips. Get VIP for even better ones!
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href="/subscriptions">
                  <Button size="sm" className="bg-primary hover:bg-primary/90">
                    Upgrade
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUpgradePromptDismiss}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievement Badges */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <h3 className="font-bold text-sm mb-3">Your Achievements</h3>
          <div className="flex flex-wrap gap-2">
            {userStats.totalTipsViewed >= 1 && (
              <Badge variant="secondary" className="text-xs">
                <Star className="h-3 w-3 mr-1" />
                First Tip
              </Badge>
            )}
            {userStats.totalTipsViewed >= 10 && (
              <Badge variant="secondary" className="text-xs">
                <Target className="h-3 w-3 mr-1" />
                Explorer
              </Badge>
            )}
            {userStats.streakDays >= 3 && (
              <Badge variant="secondary" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Streak Master
              </Badge>
            )}
            {userStats.winRate >= 60 && (
              <Badge variant="secondary" className="text-xs">
                <Trophy className="h-3 w-3 mr-1" />
                Winner
              </Badge>
            )}
            {userStats.correctPredictions >= 5 && (
              <Badge variant="secondary" className="text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                Analyst
              </Badge>
            )}
            {isVIP && (
              <Badge className="text-xs bg-amber-500">
                <Crown className="h-3 w-3 mr-1" />
                VIP Member
              </Badge>
            )}
          </div>
          {userStats.totalTipsViewed < 10 && (
            <p className="text-xs text-muted-foreground mt-2">
              View {10 - userStats.totalTipsViewed} more tips to unlock new
              achievements!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Next Milestone */}
      <Card className="border-primary/50 mb-4">
        <CardContent className="p-4">
          <h3 className="font-bold text-sm mb-2 ">Next Milestone</h3>
          {userStats.totalTipsViewed < 25 ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs ">Tip Explorer</span>
                <span className="text-xs ">{userStats.totalTipsViewed}/25</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${(userStats.totalTipsViewed / 25) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs mt-1">
                Unlock exclusive rewards at 25 tips viewed!
              </p>
            </div>
          ) : userStats.streakDays < 7 ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-blue-700">Week Warrior</span>
                <span className="text-xs text-blue-600">
                  {userStats.streakDays}/7
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(userStats.streakDays / 7) * 100}%` }}
                />
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Maintain a 7-day streak for special bonuses!
              </p>
            </div>
          ) : (
            <div className="text-center">
              <Trophy className="h-8 w-8 text-amber-500 mx-auto mb-2" />
              <p className="text-xs text-blue-700 font-medium">
                🎉 All milestones completed! You're a ScoreFusion champion!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
