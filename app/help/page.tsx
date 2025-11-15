"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Trophy,
  CreditCard,
  UserPlus,
  TrendingUp,
  Crown,
  Wallet,
  Shield,
  MessageSquare,
} from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const categories = [
    { id: "all", label: "All Topics", icon: HelpCircle },
    { id: "getting-started", label: "Getting Started", icon: UserPlus },
    { id: "tips", label: "Tips & Predictions", icon: TrendingUp },
    { id: "vip", label: "VIP Membership", icon: Crown },
    { id: "payments", label: "Payments & Billing", icon: CreditCard },
    { id: "earnings", label: "Earnings & Rewards", icon: Wallet },
    { id: "account", label: "Account & Security", icon: Shield },
  ];

  const faqs: FAQItem[] = [
    {
      category: "getting-started",
      question: "How do I get started with ScoreFusion?",
      answer:
        "Getting started is easy! Simply sign up for a free account, verify your email, and you'll have immediate access to free tips and live scores. You can browse our tips section, view analytics, and start tracking your favorite teams. For premium features, consider upgrading to VIP.",
    },
    {
      category: "getting-started",
      question: "What's the difference between free and VIP membership?",
      answer:
        "Free members get access to basic tips, live scores, and community features. VIP members enjoy exclusive premium tips with higher success rates, advanced analytics, priority customer support, no ads, and access to our expert analysts' predictions. VIP tips typically have a 75%+ success rate.",
    },
    {
      category: "tips",
      question: "How accurate are your betting tips?",
      answer:
        "Our free tips maintain approximately a 60-65% success rate, while our VIP tips achieve 75%+ accuracy. All tips are based on comprehensive data analysis, team form, head-to-head statistics, and expert insights. We track and display the performance of all our tips transparently.",
    },
    {
      category: "tips",
      question: "When are new tips published?",
      answer:
        "We publish tips daily, usually 24-48 hours before match kickoff. VIP members receive early access to tips and get notifications as soon as new premium tips are available. You can also enable push notifications to never miss a tip.",
    },
    {
      category: "tips",
      question: "Can I request tips for specific matches?",
      answer:
        "VIP members can request analysis for specific matches through our priority support channel. We aim to cover all major leagues and tournaments, and we consider member requests when planning our tip coverage.",
    },
    {
      category: "vip",
      question: "How much does VIP membership cost?",
      answer:
        "We offer flexible VIP plans: weekly (€100), Bi-weekly (€200 ), and Monthly (€ 400 - save 50%). All plans include unlimited access to premium tips, advanced analytics, and priority support. You can cancel anytime.",
    },
    {
      category: "vip",
      question: "Can I try VIP before committing?",
      answer:
        "Yes! New users get a 7-day free trial of VIP membership. You can also earn VIP tokens through our referral program or special promotions. These tokens give you temporary VIP access without a subscription.",
    },
    {
      category: "vip",
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and various local payment methods depending on your region. All payments are processed securely through Stripe.",
    },
    {
      category: "payments",
      question: "Is my payment information secure?",
      answer:
        "Absolutely! We use Stripe for payment processing, which is PCI DSS Level 1 certified - the highest level of security in the payment industry. We never store your full credit card details on our servers.",
    },
    {
      category: "payments",
      question: "How do I cancel my subscription?",
      answer:
        "You can cancel your subscription anytime from your account settings. Go to Settings > Subscription > Cancel Subscription. You'll retain VIP access until the end of your current billing period. No questions asked, no cancellation fees.",
    },
    {
      category: "payments",
      question: "Do you offer refunds?",
      answer:
        "We offer a 30-day money-back guarantee for first-time VIP subscribers. If you're not satisfied with our service within the first 30 days, contact support for a full refund. Additional terms apply.",
    },
    {
      category: "earnings",
      question: "How does the referral program work?",
      answer:
        "Invite friends using your unique referral link. When they sign up and become active users, you earn rewards. Earn $5 for each free signup, $20 when they upgrade to VIP, plus 10% recurring commission for 12 months. Rewards are credited to your wallet.",
    },
    {
      category: "earnings",
      question: "How can I withdraw my earnings?",
      answer:
        "You can withdraw earnings once you reach the minimum threshold of $50. Go to Earnings > Withdraw and choose your preferred method (PayPal, bank transfer, or gift cards). Processing typically takes 3-5 business days.",
    },
    {
      category: "earnings",
      question: "What are tokens and how do I use them?",
      answer:
        "Tokens are our virtual currency that can be used to access premium features, unlock VIP tips, or converted to real money. Earn tokens through referrals, promotions, or by winning challenges. 100 tokens = $1.",
    },
    {
      category: "account",
      question: "How do I reset my password?",
      answer:
        "Click 'Forgot Password' on the login page, enter your email, and we'll send you a reset link. The link expires in 1 hour for security. If you don't receive it, check your spam folder or contact support.",
    },
    {
      category: "account",
      question: "Can I change my email address?",
      answer:
        "Yes! Go to Settings > Account > Email Address. Enter your new email and verify it through the confirmation link we send. For security, you'll need to enter your current password to make this change.",
    },
    {
      category: "account",
      question: "How do I delete my account?",
      answer:
        "We're sorry to see you go! You can delete your account from Settings > Account > Delete Account. This action is permanent and will remove all your data. Make sure to withdraw any remaining earnings first.",
    },
    {
      category: "account",
      question: "Is my personal data safe?",
      answer:
        "Yes! We take data privacy seriously and comply with GDPR and other data protection regulations. We never sell your data to third parties. Read our Privacy Policy for full details on how we protect and use your information.",
    },
  ];

  const filteredFAQs =
    selectedCategory === "all"
      ? faqs
      : faqs.filter((faq) => faq.category === selectedCategory);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <HelpCircle className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">Help Center</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find answers to commonly asked questions about ScoreFusion, or{" "}
            <Link href="/contact" className="text-primary hover:underline">
              contact our support team
            </Link>
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-5xl mx-auto">
          <Link href="/contact">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader>
                <MessageSquare className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Contact Support</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                Get help from our support team via email or live chat
              </CardContent>
            </Card>
          </Link>

          <Link href="/about">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader>
                <Trophy className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">About ScoreFusion</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                Learn more about our platform and what we offer
              </CardContent>
            </Card>
          </Link>

          <Link href="/tips">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Browse Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                Explore our latest betting tips and predictions
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Categories */}
        <div className="max-w-5xl mx-auto mb-8">
          <h2 className="text-2xl font-bold mb-4">Browse by Category</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={
                    selectedCategory === category.id ? "default" : "outline"
                  }
                  onClick={() => setSelectedCategory(category.id)}
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {category.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">
            Frequently Asked Questions
            {selectedCategory !== "all" && (
              <span className="text-muted-foreground text-lg ml-2">
                ({filteredFAQs.length})
              </span>
            )}
          </h2>

          {filteredFAQs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No questions found in this category.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredFAQs.map((faq, index) => (
                <Card
                  key={index}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => toggleFAQ(index)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <CardTitle className="text-lg font-semibold flex-1">
                        {faq.question}
                      </CardTitle>
                      {openIndex === index ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
                      )}
                    </div>
                  </CardHeader>
                  {openIndex === index && (
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Still Need Help */}
        <div className="max-w-5xl mx-auto mt-12">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-8 text-center">
              <h3 className="text-2xl font-bold mb-2">Still need help?</h3>
              <p className="text-muted-foreground mb-6">
                Can&apos;t find what you&apos;re looking for? Our support team
                is here to help.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link href="/contact">
                  <Button size="lg">Contact Support</Button>
                </Link>
                <Link href="/">
                  <Button size="lg" variant="outline">
                    Back to Home
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
