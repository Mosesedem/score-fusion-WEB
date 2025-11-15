import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 text-primary">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground mb-12">
            Last updated: November 8, 2025
          </p>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>1. Information We Collect</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>
                  We collect information that you provide directly to us,
                  including:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Account information (email, display name)</li>
                  <li>Profile information (country, preferences)</li>
                  <li>
                    Payment information (processed securely through Stripe)
                  </li>
                  <li>
                    Usage data (tips viewed, bets placed, analytics events)
                  </li>
                  <li>
                    Device information (push notification tokens, browser type)
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. How We Use Your Information</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>We use the collected information to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide and maintain our services</li>
                  <li>Process your transactions and subscriptions</li>
                  <li>Send you betting tips and notifications</li>
                  <li>Analyze usage patterns and improve our platform</li>
                  <li>Comply with legal obligations</li>
                  <li>Detect and prevent fraud or abuse</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. Data Sharing and Disclosure</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>
                  We do not sell your personal information. We may share your
                  information with:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    Service providers (Stripe for payments, Firebase for
                    notifications)
                  </li>
                  <li>Analytics partners (aggregated, anonymized data only)</li>
                  <li>Legal authorities when required by law</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>4. Cookies and Tracking</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>
                  We use cookies and similar technologies to maintain sessions,
                  remember preferences, and analyze site usage. You can control
                  cookie preferences through your browser settings.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>5. Data Security</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>
                  We implement industry-standard security measures to protect
                  your data, including encryption, secure connections (HTTPS),
                  and access controls. However, no method of transmission over
                  the internet is 100% secure.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>6. Your Rights</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>You have the right to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Access your personal data</li>
                  <li>Correct inaccurate information</li>
                  <li>Request deletion of your account and data</li>
                  <li>Opt-out of marketing communications</li>
                  <li>Export your data in a portable format</li>
                </ul>
                <p className="mt-4">
                  To exercise these rights, visit your account settings or
                  contact our support team.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>7. Data Retention</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>
                  We retain your data for as long as your account is active or
                  as needed to provide services. When you delete your account,
                  we anonymize or delete your personal information, except where
                  required to retain it by law.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>8. Children&apos;s Privacy</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>
                  ScoreFusion is not intended for users under the age of 18 (or
                  the legal gambling age in your jurisdiction). We do not
                  knowingly collect information from minors.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>9. International Data Transfers</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>
                  Your information may be transferred to and processed in
                  countries other than your own. We ensure appropriate
                  safeguards are in place for such transfers.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>10. Changes to Privacy Policy</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>
                  We may update this Privacy Policy periodically. Significant
                  changes will be notified through our platform or via email.
                  Continued use after changes constitutes acceptance.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>11. Contact Us</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p>
                  For questions about this Privacy Policy or data practices,
                  please contact us through our support page or email us at
                  scorefusionn@gmail.com
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
