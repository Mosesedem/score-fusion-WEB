import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 text-primary">
            Terms of Service
          </h1>
          <p className="text-sm text-muted-foreground mb-12">
            Last updated: November 8, 2025
          </p>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>1. Acceptance of Terms</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>
                  By accessing or using ScoreFusion, you agree to be bound by
                  these Terms of Service and all applicable laws and
                  regulations. If you do not agree with any of these terms, you
                  are prohibited from using this service.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Use License</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>
                  Permission is granted to temporarily access the materials on
                  ScoreFusion for personal, non-commercial transitory viewing
                  only. This is the grant of a license, not a transfer of title.
                </p>
                <p>Under this license you may not:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Modify or copy the materials</li>
                  <li>Use the materials for any commercial purpose</li>
                  <li>Attempt to decompile or reverse engineer any software</li>
                  <li>Remove any copyright or proprietary notations</li>
                  <li>Transfer the materials to another person</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. Betting Predictions Disclaimer</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>
                  All predictions, tips, and analysis provided on ScoreFusion
                  are for informational purposes only. We do not guarantee any
                  outcomes or results. Sports betting involves risk and you may
                  lose money.
                </p>
                <p>
                  Users are solely responsible for their betting decisions.
                  ScoreFusion is not liable for any losses incurred as a result
                  of following our predictions or tips.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>4. VIP Subscription & Payments</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>
                  VIP subscriptions provide access to premium tips and
                  analytics. Subscriptions are billed automatically according to
                  your selected plan (monthly/yearly).
                </p>
                <p>
                  You may cancel your subscription at any time. Cancellation
                  will take effect at the end of the current billing period. No
                  refunds are provided for partial subscription periods.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>5. Responsible Gaming</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>
                  ScoreFusion promotes responsible gaming practices. Users must
                  be of legal age to participate in betting activities in their
                  jurisdiction.
                </p>
                <p>
                  We provide tools for self-exclusion, deposit limits, and
                  session time limits. If you feel you have a gambling problem,
                  please seek professional help.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>6. Account Termination</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>
                  We reserve the right to terminate or suspend accounts that
                  violate these terms, engage in fraudulent activity, or abuse
                  our services.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>7. Changes to Terms</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>
                  We may revise these terms at any time without notice. By using
                  ScoreFusion, you agree to be bound by the current version of
                  these Terms of Service.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>8. Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p>
                  For questions about these Terms of Service, please contact us
                  through our support page.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
