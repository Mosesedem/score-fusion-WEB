"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Lock,
  Calendar,
  Target,
  ArrowLeft,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

interface Tip {
  id: string;
  title: string;
  summary?: string;
  content: string;
  odds?: number;
  oddsSource?: string;
  sport: string;
  league?: string;
  matchDate?: string;
  homeTeam?: {
    id: string;
    name: string;
    shortName?: string;
    logoUrl?: string;
  };
  awayTeam?: {
    id: string;
    name: string;
    shortName?: string;
    logoUrl?: string;
  };
  predictionType?: string;
  predictedOutcome?: string;
  confidenceLevel?: number;
  ticketSnapshots: string[];
  isVIP: boolean;
  featured: boolean;
  status: string;
  result?: string;
  successRate?: number;
  viewCount: number;
  createdAt: string;
  authorName?: string;
  tags: string[];
}

export default function TipDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [tip, setTip] = useState<Tip | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchTip = async () => {
    try {
      const res = await fetch(`/api/predictions/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setTip(data.data.prediction);
      } else if (res.status === 404) {
        router.push("/tips");
      }
    } catch (error) {
      console.error("Failed to fetch prediction:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchTip();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const getResultIcon = () => {
    if (!tip?.result) return null;
    switch (tip.result) {
      case "won":
        return (
          <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
        );
      case "lost":
        return <XCircle className="h-4 w-4 md:h-5 md:w-5 text-red-500" />;
      case "void":
        return <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm md:text-base text-muted-foreground">
          Loading prediction...
        </p>
      </div>
    );
  }

  if (!tip) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 md:p-8 text-center">
            <p className="text-sm md:text-base text-muted-foreground mb-4">
              Prediction not found
            </p>
            <Link href="/tips">
              <Button size="sm">Back to Predictions</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="border-b border-border bg-secondary">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4">
          <Link href="/tips">
            <Button
              variant="ghost"
              size="sm"
              className="mb-2 -ml-2 text-xs md:text-sm"
            >
              <ArrowLeft className="h-3 w-3 md:h-4 md:w-4 mr-1" />
              Back to Predictions
            </Button>
          </Link>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-4 md:py-8">
        <div className="container mx-auto px-3 md:px-4">
          <div className="max-w-4xl mx-auto">
            {/* Title and Badges */}
            <div className="mb-4 md:mb-6">
              <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mb-2 md:mb-3">
                <Badge className=" text-[10px] md:text-xs px-1.5 md:px-2 py-0.5">
                  {tip.sport}
                </Badge>
                {tip.league && (
                  <Badge className=" text-[10px] md:text-xs px-1.5 md:px-2 py-0.5">
                    {tip.league}
                  </Badge>
                )}
                {tip.isVIP && (
                  <Badge className="bg-primary text-primary-foreground text-[10px] md:text-xs px-1.5 md:px-2 py-0.5">
                    <Lock className="h-2 w-2 md:h-2.5 md:w-2.5 mr-0.5 md:mr-1" />
                    VIP
                  </Badge>
                )}
                {tip.featured && (
                  <Badge className="bg-primary text-primary-foreground text-[10px] md:text-xs px-1.5 md:px-2 py-0.5">
                    Featured
                  </Badge>
                )}
                {tip.result && (
                  <Badge
                    className={`text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 ${
                      tip.result === "won"
                        ? "bg-green-500 text-white"
                        : tip.result === "lost"
                        ? "bg-red-500 text-white"
                        : "bg-gray-500 text-white"
                    }`}
                  >
                    {getResultIcon()}
                    <span className="ml-1">{tip.result.toUpperCase()}</span>
                  </Badge>
                )}
              </div>
              <h1 className="text-xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-3">
                {tip.title}
              </h1>
              {tip.summary && (
                <p className="text-sm md:text-base lg:text-lg text-muted-foreground">
                  {tip.summary}
                </p>
              )}
            </div>

            {/* Team Match Display */}
            {(tip.homeTeam || tip.awayTeam) && (
              <Card className="mb-4 md:mb-6">
                <CardContent className="p-3 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 text-center min-w-0">
                      {tip.homeTeam && (
                        <>
                          {tip.homeTeam.logoUrl && (
                            <img
                              src={tip.homeTeam.logoUrl}
                              alt={tip.homeTeam.name}
                              className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 mx-auto mb-1.5 md:mb-2 object-contain"
                            />
                          )}
                          <p className="text-xs md:text-sm lg:text-base font-bold line-clamp-2">
                            {tip.homeTeam.name}
                          </p>
                        </>
                      )}
                    </div>
                    <div className="px-3 md:px-6 text-muted-foreground font-bold text-sm md:text-lg lg:text-xl shrink-0">
                      VS
                    </div>
                    <div className="flex-1 text-center min-w-0">
                      {tip.awayTeam && (
                        <>
                          {tip.awayTeam.logoUrl && (
                            <img
                              src={tip.awayTeam.logoUrl}
                              alt={tip.awayTeam.name}
                              className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 mx-auto mb-1.5 md:mb-2 object-contain"
                            />
                          )}
                          <p className="text-xs md:text-sm lg:text-base font-bold line-clamp-2">
                            {tip.awayTeam.name}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  {tip.matchDate && (
                    <div className="flex items-center justify-center gap-1 mt-3 md:mt-4 text-xs md:text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                      <span>{new Date(tip.matchDate).toLocaleString()}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Analytics Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
              {tip.odds && (
                <Card>
                  <CardContent className="p-3 md:p-4 text-center">
                    <div className="text-xl md:text-2xl lg:text-3xl font-bold text-primary">
                      {tip.odds}
                    </div>
                    <div className="text-[10px] md:text-xs text-muted-foreground mt-1">
                      Odds
                    </div>
                  </CardContent>
                </Card>
              )}
              {tip.predictedOutcome && (
                <Card>
                  <CardContent className="p-3 md:p-4 text-center">
                    <Target className="h-5 w-5 md:h-6 md:w-6 text-primary mx-auto mb-1" />
                    <div className="text-xs md:text-sm font-bold line-clamp-1">
                      {tip.predictedOutcome}
                    </div>
                    <div className="text-[10px] md:text-xs text-muted-foreground mt-0.5">
                      Prediction
                    </div>
                  </CardContent>
                </Card>
              )}
              {tip.confidenceLevel && (
                <Card>
                  <CardContent className="p-3 md:p-4 text-center">
                    <div className="text-xl md:text-2xl lg:text-3xl font-bold text-primary">
                      {tip.confidenceLevel}%
                    </div>
                    <div className="text-[10px] md:text-xs text-muted-foreground mt-1">
                      Confidence
                    </div>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardContent className="p-3 md:p-4 text-center">
                  <Eye className="h-5 w-5 md:h-6 md:w-6 text-primary mx-auto mb-1" />
                  <div className="text-xl md:text-2xl lg:text-3xl font-bold">
                    {tip.viewCount}
                  </div>
                  <div className="text-[10px] md:text-xs text-muted-foreground mt-1">
                    Views
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Analysis Content */}
            <Card className="mb-4 md:mb-6">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-base md:text-lg lg:text-xl">
                  Expert Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                <div className="prose prose-sm md:prose-base max-w-none dark:prose-invert">
                  <div
                    className="text-sm md:text-base leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: tip.content }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Ticket Snapshots */}
            {tip.ticketSnapshots && tip.ticketSnapshots.length > 0 && (
              <Card className="mb-4 md:mb-6">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-base md:text-lg lg:text-xl flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 md:h-5 md:w-5" />
                    Ticket Snapshots ({tip.ticketSnapshots.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    {tip.ticketSnapshots.map((snapshot, index) => (
                      <div
                        key={index}
                        className="relative rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-colors cursor-pointer"
                        onClick={() => setSelectedImage(snapshot)}
                      >
                        <img
                          src={snapshot}
                          alt={`Ticket snapshot ${index + 1}`}
                          className="w-full h-auto object-contain"
                        />
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-black/70 text-white text-[10px] md:text-xs">
                            {index + 1}/{tip.ticketSnapshots.length}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground mt-3 md:mt-4 text-center">
                    Click on any image to view full size
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Metadata */}
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-base md:text-lg lg:text-xl">
                  Prediction Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm">
                  {tip.authorName && (
                    <div>
                      <span className="text-muted-foreground">Analyst:</span>
                      <span className="ml-2 font-medium">{tip.authorName}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Published:</span>
                    <span className="ml-2 font-medium">
                      {new Date(tip.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {tip.predictionType && (
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <span className="ml-2 font-medium capitalize">
                        {tip.predictionType.replace(/_/g, " ")}
                      </span>
                    </div>
                  )}
                  {tip.successRate && (
                    <div>
                      <span className="text-muted-foreground">
                        Success Rate:
                      </span>
                      <span className="ml-2 font-medium">
                        {tip.successRate}%
                      </span>
                    </div>
                  )}
                </div>
                {tip.tags && tip.tags.length > 0 && (
                  <div className="mt-4">
                    <span className="text-muted-foreground text-xs md:text-sm">
                      Tags:
                    </span>
                    <div className="flex flex-wrap gap-1.5 md:gap-2 mt-2">
                      {tip.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          className=" text-[10px] md:text-xs px-1.5 md:px-2 py-0.5"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Full-size Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 text-white text-sm md:text-base hover:text-gray-300"
            >
              Close ✕
            </button>
            <img
              src={selectedImage}
              alt="Full size ticket"
              className="w-full h-auto object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
