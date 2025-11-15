/* eslint-disable react/no-unescaped-entities */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, TrendingUp, Shield } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 text-primary">
            About ScoreFusion
          </h1>
          <p className="text-lg text-muted-foreground mb-12">
            Your trusted platform for premium betting predictions and live
            sports analytics.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card>
              <CardHeader>
                <Trophy className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Expert Predictions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our team of professional analysts provides data-driven betting
                  tips with transparent success rates.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Real-time Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Track live scores, match events, and betting odds in real-time
                  with our advanced analytics dashboard.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Community Driven</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Join thousands of users who trust ScoreFusion for their
                  betting insights and strategies.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Secure & Transparent</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We prioritize responsible gaming with full transparency in our
                  prediction methodologies.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Our Mission</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                ScoreFusion was founded with a simple mission: to provide sports
                bettors with the most accurate, data-driven predictions backed
                by transparent analytics.
              </p>
              <p>
                We combine advanced statistical models, real-time data feeds,
                and expert analysis to deliver premium betting tips that help
                our users make informed decisions.
              </p>
              <p>
                Our platform is built on principles of responsible gaming,
                transparency, and community trust. We track and publish all our
                predictions' outcomes, providing full visibility into our
                success rates.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
