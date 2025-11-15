/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
  CreditCard,
  Banknote,
  Bitcoin,
  Smartphone,
  CheckCircle,
  AlertCircle,
  Shield,
  Mail,
  MessageSquare,
  Edit,
  Clock,
  Phone,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
}

const plans: Plan[] = [
  {
    id: "weekly",
    name: "Weekly VIP",
    price: 100,
    period: "week",
    features: [
      "All VIP tips & updates",
      "Correct score predictions",
      "Winning ticket screenshots",
      "Priority support",
      "7-day access",
    ],
  },
  {
    id: "biweekly",
    name: "2 Weeks VIP",
    price: 200,
    period: "2 weeks",
    features: [
      "All VIP tips & updates",
      "Correct score predictions",
      "Winning ticket screenshots",
      "Priority support",
      "Advanced analytics",
      "Telegram VIP group",
      "Cancel anytime",
    ],
  },
  {
    id: "monthly",
    name: "Monthly VIP",
    price: 400,
    period: "month",
    features: [
      "All VIP tips & updates",
      "Correct score predictions",
      "Winning ticket screenshots",
      "Priority support",
      "Advanced analytics",
      "Telegram VIP group",
      "Personal betting consultant",
      "Exclusive webinars",
      "4 months FREE",
    ],
  },
];

// Payment methods for Contact method (from first code)
const contactPaymentMethods = [
  {
    id: "crypto",
    name: "Cryptocurrency",
    icon: Bitcoin,
    description: "Bitcoin, USDT TRC20",
  },
  {
    id: "skrill",
    name: "Skrill",
    icon: CreditCard,
    description: "Skrill payment",
  },
  {
    id: "neteller",
    name: "Neteller",
    icon: CreditCard,
    description: "Neteller payment",
  },
  {
    id: "mpesa",
    name: "Safaricom M-pesa",
    icon: Smartphone,
    description: "M-pesa mobile money",
  },
  {
    id: "momo",
    name: "Momo",
    icon: Smartphone,
    description: "Momo payment",
  },
  {
    id: "perfect_money",
    name: "Perfect Money",
    icon: Banknote,
    description: "Perfect Money transfer",
  },
  {
    id: "webmoney",
    name: "Web Money",
    icon: Banknote,
    description: "Web Money payment",
  },
  {
    id: "bank_transfer",
    name: "Local Bank Deposit/Mobile Bank Transfer",
    icon: Banknote,
    description: "Direct bank transfer",
  },
];

// Payment methods for Form method (from second code)
const formPaymentMethods = [
  {
    id: "bank_transfer",
    name: "Bank Transfer",
    icon: Banknote,
    description: "Direct bank transfer (recommended)",
    details:
      "Account Name: Score Fusion Ltd\nBank: [Your Bank]\nAccount Number: [Account Number]\nIBAN: [IBAN]\nSWIFT: [SWIFT Code]",
  },
  {
    id: "crypto",
    name: "Cryptocurrency",
    icon: Bitcoin,
    description: "Bitcoin, Ethereum, USDT",
    details:
      "BTC: bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh\nETH: 0x742d35Cc6634C0532925a3b844Bc454e4438f44e\nUSDT (ERC20): 0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  },
  {
    id: "paypal",
    name: "PayPal",
    icon: CreditCard,
    description: "PayPal payment",
    details:
      "Send to: Scorefusionn@gmail.com\nNote: Include your username in payment reference",
  },
  {
    id: "mobile_money",
    name: "Mobile Money",
    icon: Smartphone,
    description: "MTN Mobile Money, Airtel Money",
    details:
      "MTN: +256 700 000 000\nAirtel: +256 750 000 000\nName: Score Fusion",
  },
];

// Contact methods (from first code)
const contactMethods = [
  {
    icon: Mail,
    label: "Email",
    value: "Scorefusionn@gmail.com",
    action:
      "mailto:Scorefusionn@gmail.com?subject=VIP%20Subscription%20Payment&body=Hi,%0D%0A%0D%0AI%20want%20to%20subscribe%20to%20the%20" +
      (plans[0] ? plans[0].name : "VIP") +
      "%20plan.%0D%0A%0D%0APlan:%20" +
      (plans[0] ? plans[0].name : "") +
      "%0D%0AAmount:%20€" +
      (plans[0] ? plans[0].price : "") +
      "%0D%0A%0D%0APlease%20provide%20payment%20details.%0D%0A%0D%0AThank%20you!",
    color: "bg-blue-500 hover:bg-blue-600",
  },
  {
    icon: MessageSquare,
    label: "WhatsApp",
    value: "+84 589 950 720",
    action:
      "https://wa.me/84589950720?text=Hi,%20I%20want%20to%20subscribe%20to%20the%20" +
      (plans[0] ? plans[0].name : "VIP") +
      "%20plan%20(€" +
      (plans[0] ? plans[0].price : "") +
      ").",
    color: "bg-green-500 hover:bg-green-600",
  },
  {
    icon: MessageSquare,
    label: "Telegram",
    value: "@Donaldauthorr",
    action: "https://t.me/Donaldauthorr",
    color: "bg-sky-500 hover:bg-sky-600",
  },
];

function CheckoutContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const [selectedPlan, setSelectedPlan] = useState<Plan | undefined>(undefined);
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<"contact" | "form">(
    "contact"
  );
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>("");
  const [formData, setFormData] = useState({
    fullName: user?.displayName || "",
    email: user?.email || "",
    phone: "",
    transactionId: "",
    amount: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const planId = searchParams.get("plan");
    if (planId) {
      const plan = plans.find((p) => p.id === planId);
      if (plan) {
        setSelectedPlan(plan);
        setFormData((prev) => ({ ...prev, amount: plan.price.toString() }));
        setIsChangingPlan(false);
      }
    }
  }, [searchParams]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlan || !selectedPaymentMethod) {
      toast({
        title: "Missing Information",
        description: "Please select a plan and payment method.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.fullName || !formData.email || !formData.transactionId) {
      toast({
        title: "Required Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/pay/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: selectedPlan,
          paymentMethod: selectedPaymentMethod,
          ...formData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSubmitted(true);
        toast({
          title: "Payment Submitted",
          description:
            "Your payment details have been sent to our admin. We'll process your VIP access shortly.",
        });
      } else {
        throw new Error(data.error || "Failed to submit payment");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Submission Failed",
        description:
          "There was an error submitting your payment. Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">
              Payment Submitted Successfully!
            </h1>
            <p className="text-muted-foreground mb-6">
              Your payment details have been sent to our admin team. We'll
              verify your payment and activate your VIP access within 24 hours.
            </p>
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">
                  What happens next?
                </h3>
                <ul className="text-sm text-green-700 space-y-1 text-left">
                  <li>• Our admin will verify your payment</li>
                  <li>• You'll receive a confirmation email</li>
                  <li>• VIP access will be activated automatically</li>
                  <li>• Access the VIP section from your dashboard</li>
                </ul>
              </div>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => (window.location.href = "/dashboard")}>
                  Go to Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = "/vip")}
                >
                  View VIP Section
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            Complete Your VIP Purchase
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground px-4">
            Choose your plan and select a checkout method below
          </p>
        </div>

        {/* Plan Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
              <span className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Selected Plan
              </span>
              {selectedPlan && !isChangingPlan && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsChangingPlan(true)}
                  className="text-xs sm:text-sm"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Change
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedPlan && !isChangingPlan ? (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold">
                      {selectedPlan.name}
                    </h3>
                    <p className="text-base sm:text-lg text-muted-foreground">
                      €{selectedPlan.price} for {selectedPlan.period}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs sm:text-sm">
                    Selected
                  </Badge>
                </div>
                <ul className="space-y-2">
                  {selectedPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm sm:text-base text-muted-foreground">
                  {selectedPlan
                    ? "Choose a different plan:"
                    : "Choose a plan to get started:"}
                </p>
                <div className="space-y-3">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-primary hover:shadow-md ${
                        selectedPlan?.id === plan.id
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      }`}
                      onClick={() => {
                        setSelectedPlan(plan);
                        setIsChangingPlan(false);
                        setFormData((prev) => ({
                          ...prev,
                          amount: plan.price.toString(),
                        }));
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-base sm:text-lg">
                            {plan.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {plan.period}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-xl sm:text-2xl font-bold text-primary">
                            €{plan.price}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {plan.features.slice(0, 3).map((feature, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs"
                          >
                            {feature}
                          </Badge>
                        ))}
                        {plan.features.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{plan.features.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedPlan && (
          <>
            {/* Checkout Method Selection */}
            <div className="mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">
                    Choose Checkout Method
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Select how you'd like to complete your purchase
                  </p>
                </CardHeader>
                <CardContent>
                  <Tabs
                    value={selectedMethod}
                    onValueChange={(value) =>
                      setSelectedMethod(value as "contact" | "form")
                    }
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="contact">Quick Contact</TabsTrigger>
                      <TabsTrigger value="form">Form Submission</TabsTrigger>
                    </TabsList>
                    <TabsContent value="contact" className="mt-4">
                      <p className="text-sm text-muted-foreground mb-4">
                        Contact our admin directly for payment details and
                        assistance.
                      </p>
                    </TabsContent>
                    <TabsContent value="form" className="mt-4">
                      <p className="text-sm text-muted-foreground mb-4">
                        Fill out the form below to submit your payment details
                        securely.
                      </p>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
              {/* Left Column: Payment Methods & Related */}
              <div className="space-y-6">
                {selectedMethod === "contact" ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <CreditCard className="h-5 w-5" />
                        Available Payment Methods
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {contactPaymentMethods.map((method) => {
                          const Icon = method.icon;
                          return (
                            <div
                              key={method.id}
                              className="p-3 sm:p-4 border rounded-lg hover:border-primary/50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <Icon className="h-5 w-5 text-primary flex-shrink-0" />
                                <div>
                                  <h4 className="font-medium text-sm sm:text-base">
                                    {method.name}
                                  </h4>
                                  <p className="text-xs text-muted-foreground">
                                    {method.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs sm:text-sm text-blue-800">
                          <strong>Note:</strong> Contact admin via Email,
                          WhatsApp, or Telegram to get payment details for your
                          preferred method.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Payment Method
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {formPaymentMethods.map((method) => {
                          const Icon = method.icon;
                          return (
                            <div
                              key={method.id}
                              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                selectedPaymentMethod === method.id
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50"
                              }`}
                              onClick={() =>
                                setSelectedPaymentMethod(method.id)
                              }
                            >
                              <div className="flex items-center gap-3">
                                <Icon className="h-5 w-5" />
                                <div className="flex-1">
                                  <h4 className="font-medium">{method.name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {method.description}
                                  </p>
                                </div>
                                {selectedPaymentMethod === method.id && (
                                  <CheckCircle className="h-5 w-5 text-primary" />
                                )}
                              </div>
                              {selectedPaymentMethod === method.id && (
                                <div className="mt-3 p-3 bg-muted rounded text-sm">
                                  <pre className="whitespace-pre-wrap font-mono text-xs">
                                    {method.details}
                                  </pre>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Column: Checkout Action */}
              <div className="space-y-6">
                {selectedMethod === "contact" ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <MessageSquare className="h-5 w-5" />
                        Contact Admin to Complete Payment
                      </CardTitle>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                        Choose your preferred contact method below to proceed
                        with payment
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {contactMethods.map((method, index) => {
                          const Icon = method.icon;
                          return (
                            <a
                              key={index}
                              href={method.action
                                .replace(/€\d+/g, `€${selectedPlan.price}`)
                                .replace(
                                  /VIP plan/g,
                                  `${selectedPlan.name} plan`
                                )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`block p-4 sm:p-6 rounded-lg text-white ${method.color} transition-transform hover:scale-105 shadow-md`}
                            >
                              <div className="flex items-center gap-4">
                                <div className="bg-white/20 p-3 rounded-full">
                                  <Icon className="h-6 w-6" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-bold text-base sm:text-lg mb-1">
                                    Contact via {method.label}
                                  </h3>
                                  <p className="text-xs sm:text-sm text-white/90">
                                    {method.value}
                                  </p>
                                </div>
                                <div className="text-white/80">→</div>
                              </div>
                            </a>
                          );
                        })}
                      </div>

                      <div className="mt-6 p-4 bg-green-50 rounded-lg">
                        <h4 className="font-semibold text-green-800 mb-2 text-sm sm:text-base">
                          Your Selected Plan:
                        </h4>
                        <div className="text-sm text-green-700">
                          <p>
                            <strong>Plan:</strong> {selectedPlan.name}
                          </p>
                          <p>
                            <strong>Amount:</strong> €{selectedPlan.price}
                          </p>
                          <p>
                            <strong>Duration:</strong> {selectedPlan.period}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Payment Details
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Fill in your payment information. Our admin will verify
                        and activate your VIP access.
                      </p>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="fullName">Full Name *</Label>
                            <Input
                              id="fullName"
                              value={formData.fullName}
                              onChange={(e) =>
                                handleInputChange("fullName", e.target.value)
                              }
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="email">Email *</Label>
                            <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={(e) =>
                                handleInputChange("email", e.target.value)
                              }
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                              id="phone"
                              value={formData.phone}
                              onChange={(e) =>
                                handleInputChange("phone", e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="amount">Amount (€) *</Label>
                            <Input
                              id="amount"
                              type="number"
                              value={formData.amount}
                              onChange={(e) =>
                                handleInputChange("amount", e.target.value)
                              }
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="transactionId">
                            Transaction ID / Reference *
                          </Label>
                          <Input
                            id="transactionId"
                            value={formData.transactionId}
                            onChange={(e) =>
                              handleInputChange("transactionId", e.target.value)
                            }
                            placeholder="Enter your payment reference number"
                            required
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            This is usually found in your bank statement or
                            payment confirmation
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="notes">Additional Notes</Label>
                          <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) =>
                              handleInputChange("notes", e.target.value)
                            }
                            placeholder="Any additional information about your payment..."
                            rows={3}
                          />
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                            <div className="text-sm">
                              <p className="font-medium text-blue-800">
                                Important:
                              </p>
                              <ul className="text-blue-700 mt-1 space-y-1">
                                <li>
                                  • Make sure to include your username in the
                                  payment reference
                                </li>
                                <li>• Keep your payment confirmation safe</li>
                                <li>• Processing usually takes 1-24 hours</li>
                                <li>
                                  • You'll receive an email confirmation once
                                  activated
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>

                        <Button
                          type="submit"
                          className="w-full"
                          disabled={
                            isSubmitting ||
                            !selectedPlan ||
                            !selectedPaymentMethod
                          }
                        >
                          {isSubmitting ? (
                            <>
                              <Clock className="h-4 w-4 mr-2 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <Mail className="h-4 w-4 mr-2" />
                              Submit Payment Details
                            </>
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                )}

                {/* Shared Instructions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <AlertCircle className="h-5 w-5" />
                      How It Works
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-3 text-sm">
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                          1
                        </span>
                        <span>Select your preferred VIP plan above</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                          2
                        </span>
                        <span>
                          {selectedMethod === "contact"
                            ? "Contact admin via Email, WhatsApp, or Telegram"
                            : "Fill out the payment form with your details"}
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                          3
                        </span>
                        <span>
                          {selectedMethod === "contact"
                            ? "Admin will provide payment details for your chosen method"
                            : "Our admin will receive and verify your submission"}
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                          4
                        </span>
                        <span>
                          Make payment and share transaction proof with admin
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                          5
                        </span>
                        <span>
                          Your VIP access will be activated within 24 hours
                        </span>
                      </li>
                    </ol>

                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-yellow-800">
                          <p className="font-medium">Important:</p>
                          <ul className="mt-1 space-y-1">
                            <li>
                              • Always mention your username when contacting or
                              submitting
                            </li>
                            <li>• Keep your payment receipt/screenshot safe</li>
                            <li>
                              • Contact admin if not activated within 24 hours
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Shared Contact Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Need Help?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span className="text-sm">Scorefusionn@gmail.com</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span className="text-sm">+84 589 950 720</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        <span className="text-sm">
                          Telegram: @Donaldauthorr
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      Contact us if you have any questions about the payment
                      process.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-primary text-xl">Loading...</div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
