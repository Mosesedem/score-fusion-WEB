"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreditCard,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Ban,
  CheckCircle,
  Clock,
  Loader2,
  Plus,
  Trash2,
  XCircle,
  AlertCircle,
  Edit,
} from "lucide-react";

interface Subscription {
  id: string;
  userId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  plan: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string | null;
    displayName: string | null;
    name: string | null;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  totalPages: number;
}

interface Stats {
  total: number;
  active: number;
  canceled: number;
  pastDue: number;
  trial: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
}

interface DialogState {
  open: boolean;
  type: "create" | "extend" | "cancel" | "delete" | "edit" | null;
  subscription: Subscription | null;
  userId?: string;
  userEmail?: string;
}

export default function AdminSubscriptionsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    canceled: 0,
    pastDue: 0,
    trial: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<
    "all" | "active" | "canceled" | "past_due" | "trial"
  >("all");
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false,
    totalPages: 0,
  });
  const [dialogState, setDialogState] = useState<DialogState>({
    open: false,
    type: null,
    subscription: null,
  });
  const [actionLoading, setActionLoading] = useState(false);

  // Form state for create/extend
  const [selectedPlan, setSelectedPlan] = useState<
    "monthly" | "yearly" | "trial"
  >("monthly");
  const [extendDays, setExtendDays] = useState(30);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [searchUsersQuery, setSearchUsersQuery] = useState("");
  const [searchedUsers, setSearchedUsers] = useState<
    Array<{
      id: string;
      email: string | null;
      displayName: string | null;
      name: string | null;
    }>
  >([]);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "ADMIN")) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.role === "ADMIN") {
      fetchSubscriptions();
      fetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, pagination.page, filter]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchQuery) {
        params.append("search", searchQuery);
      }

      if (filter !== "all") {
        params.append("status", filter);
      }

      const res = await fetch(`/api/admin/subscriptions?${params}`);
      const response = await res.json();

      if (!res.ok) {
        setError(
          response.error || `Failed to fetch subscriptions: ${res.status}`
        );
        return;
      }

      const subsList =
        response.data?.subscriptions || response.subscriptions || [];
      const paginationData =
        response.data?.pagination || response.pagination || {};

      setSubscriptions(subsList);
      setPagination(paginationData);
    } catch (error) {
      console.error("Failed to fetch subscriptions:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch subscriptions"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/subscriptions/stats");
      const response = await res.json();

      if (res.ok) {
        setStats(response.data || response.stats || stats);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
    const debounceTimer = setTimeout(() => {
      fetchSubscriptions();
    }, 500);
    return () => clearTimeout(debounceTimer);
  };

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchedUsers([]);
      return;
    }

    try {
      const res = await fetch(`/api/admin/users?search=${query}&limit=10`);
      const response = await res.json();

      if (res.ok) {
        const users = response.data?.users || response.users || [];
        setSearchedUsers(users);
      }
    } catch (error) {
      console.error("Failed to search users:", error);
    }
  };

  const openDialog = (
    type: "create" | "extend" | "cancel" | "delete" | "edit",
    subscription?: Subscription
  ) => {
    setDialogState({
      open: true,
      type,
      subscription: subscription || null,
      userId: subscription?.userId,
      userEmail: subscription?.user.email || undefined,
    });

    // Set defaults based on dialog type
    if (type === "edit" && subscription) {
      setSelectedPlan(subscription.plan as "monthly" | "yearly" | "trial");
      setExtendDays(30);
    } else {
      setExtendDays(30);
    }

    setSelectedUserId("");
    setSearchUsersQuery("");
    setSearchedUsers([]);
  };

  const closeDialog = () => {
    setDialogState({
      open: false,
      type: null,
      subscription: null,
    });
  };

  const confirmAction = async () => {
    if (!dialogState.type) return;

    setActionLoading(true);
    try {
      switch (dialogState.type) {
        case "create":
          await handleCreateSubscription();
          break;
        case "extend":
          await handleExtendSubscription();
          break;
        case "cancel":
          await handleCancelSubscription();
          break;
        case "delete":
          await handleDeleteSubscription();
          break;
        case "edit":
          await handleEditSubscription();
          break;
      }
      closeDialog();
      fetchSubscriptions();
      fetchStats();
    } catch (error) {
      console.error("Action failed:", error);
      alert(error instanceof Error ? error.message : "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateSubscription = async () => {
    if (!selectedUserId) {
      throw new Error("Please select a user");
    }

    const res = await fetch("/api/admin/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: selectedUserId,
        action: "create",
        plan: selectedPlan,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to create subscription");
    }
  };

  const handleExtendSubscription = async () => {
    if (!dialogState.subscription || extendDays <= 0) {
      throw new Error("Invalid extend parameters");
    }

    const res = await fetch("/api/admin/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: dialogState.subscription.userId,
        action: "extend",
        durationDays: extendDays,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to extend subscription");
    }
  };

  const handleCancelSubscription = async () => {
    if (!dialogState.subscription) return;

    const res = await fetch("/api/admin/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: dialogState.subscription.userId,
        action: "cancel",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to cancel subscription");
    }
  };

  const handleDeleteSubscription = async () => {
    if (!dialogState.subscription) return;

    const res = await fetch(
      `/api/admin/subscriptions/${dialogState.subscription.id}`,
      {
        method: "DELETE",
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to delete subscription");
    }
  };

  const handleEditSubscription = async () => {
    if (!dialogState.subscription) return;

    const res = await fetch(
      `/api/admin/subscriptions/${dialogState.subscription.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to update subscription");
    }
  };

  const getStatusBadge = (subscription: Subscription) => {
    const { status, cancelAtPeriodEnd, currentPeriodEnd, trialEnd } =
      subscription;
    const isExpired = new Date(currentPeriodEnd) < new Date();
    const isTrial = trialEnd && new Date(trialEnd) > new Date();

    if (status === "canceled" || isExpired) {
      return (
        <Badge className="bg-red-500 text-white">
          <XCircle className="h-3 w-3 mr-1" />
          {isExpired ? "Expired" : "Canceled"}
        </Badge>
      );
    }

    if (isTrial) {
      return (
        <Badge className="bg-blue-500 text-white">
          <Clock className="h-3 w-3 mr-1" />
          Trial
        </Badge>
      );
    }

    if (status === "past_due") {
      return (
        <Badge className="bg-orange-500 text-white">
          <AlertCircle className="h-3 w-3 mr-1" />
          Past Due
        </Badge>
      );
    }

    if (cancelAtPeriodEnd) {
      return (
        <Badge className="bg-yellow-500 text-white">
          <Ban className="h-3 w-3 mr-1" />
          Canceling
        </Badge>
      );
    }

    return (
      <Badge className="bg-green-500 text-white">
        <CheckCircle className="h-3 w-3 mr-1" />
        Active
      </Badge>
    );
  };

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      monthly: "bg-blue-600",
      yearly: "bg-purple-600",
      trial: "bg-gray-600",
    };

    return (
      <Badge
        className={`${colors[plan.toLowerCase()] || "bg-gray-600"} text-white`}
      >
        {plan.charAt(0).toUpperCase() + plan.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user?.role !== "ADMIN") return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Subscriptions Management</h1>
            <Button onClick={() => openDialog("create")}>
              <Plus className="h-4 w-4 mr-2" />
              Create Subscription
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">
                  All subscriptions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.active}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Trial
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.trial}
                </div>
                <p className="text-xs text-muted-foreground">Trial users</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Canceled
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {stats.canceled}
                </div>
                <p className="text-xs text-muted-foreground">Canceled plans</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Past Due
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {stats.pastDue}
                </div>
                <p className="text-xs text-muted-foreground">Payment issues</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Monthly MRR
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${stats.monthlyRevenue.toFixed(0)}
                </div>
                <p className="text-xs text-muted-foreground">Est. revenue</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Yearly ARR
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${stats.yearlyRevenue.toFixed(0)}
                </div>
                <p className="text-xs text-muted-foreground">Est. revenue</p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by user email or name..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setFilter("all");
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              All ({stats.total})
            </Button>
            <Button
              variant={filter === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setFilter("active");
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Active ({stats.active})
            </Button>
            <Button
              variant={filter === "trial" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setFilter("trial");
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              <Clock className="h-3 w-3 mr-1" />
              Trial ({stats.trial})
            </Button>
            <Button
              variant={filter === "past_due" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setFilter("past_due");
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              <AlertCircle className="h-3 w-3 mr-1" />
              Past Due ({stats.pastDue})
            </Button>
            <Button
              variant={filter === "canceled" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setFilter("canceled");
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              <XCircle className="h-3 w-3 mr-1" />
              Canceled ({stats.canceled})
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card>
            <CardContent className="p-8">
              <h2 className="text-xl font-bold text-destructive mb-2">Error</h2>
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={() => fetchSubscriptions()} className="mt-4">
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Subscriptions List */}
        {!loading && !error && (
          <>
            <div className="space-y-4">
              {subscriptions.map((sub) => (
                <Card
                  key={sub.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="text-lg font-bold">
                            {sub.user.displayName ||
                              sub.user.name ||
                              sub.user.email ||
                              "Unknown User"}
                          </h3>
                          {getStatusBadge(sub)}
                          {getPlanBadge(sub.plan)}
                        </div>

                        <p className="text-sm text-muted-foreground mb-3">
                          {sub.user.email || "No email"}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div>
                            <Label className="text-muted-foreground text-xs">
                              Started
                            </Label>
                            <p className="font-medium">
                              {new Date(
                                sub.currentPeriodStart
                              ).toLocaleDateString()}
                            </p>
                          </div>

                          <div>
                            <Label className="text-muted-foreground text-xs">
                              {sub.cancelAtPeriodEnd ? "Ends" : "Renews"}
                            </Label>
                            <p className="font-medium">
                              {new Date(
                                sub.currentPeriodEnd
                              ).toLocaleDateString()}
                            </p>
                          </div>

                          {sub.trialEnd && (
                            <div>
                              <Label className="text-muted-foreground text-xs">
                                Trial Ends
                              </Label>
                              <p className="font-medium">
                                {new Date(sub.trialEnd).toLocaleDateString()}
                              </p>
                            </div>
                          )}

                          <div>
                            <Label className="text-muted-foreground text-xs">
                              Created
                            </Label>
                            <p className="font-medium">
                              {new Date(sub.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {sub.canceledAt && (
                          <div className="mt-3 text-xs text-muted-foreground">
                            Canceled on:{" "}
                            {new Date(sub.canceledAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDialog("edit", sub)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        {sub.status === "active" && !sub.cancelAtPeriodEnd && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDialog("extend", sub)}
                            >
                              <Calendar className="h-4 w-4 mr-1" />
                              Extend
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDialog("cancel", sub)}
                            >
                              <Ban className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDialog("delete", sub)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {subscriptions.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No subscriptions found with the selected filter.</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{" "}
                  of {pagination.total} subscriptions
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page - 1,
                      }))
                    }
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from(
                      { length: Math.min(5, pagination.totalPages) },
                      (_, i) => {
                        const pageNum =
                          pagination.page <= 3
                            ? i + 1
                            : Math.min(
                                pagination.page - 2 + i,
                                pagination.totalPages - 4 + i
                              );
                        return (
                          <Button
                            key={pageNum}
                            variant={
                              pagination.page === pageNum
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() =>
                              setPagination((prev) => ({
                                ...prev,
                                page: pageNum,
                              }))
                            }
                          >
                            {pageNum}
                          </Button>
                        );
                      }
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasMore}
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page + 1,
                      }))
                    }
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Action Dialog */}
      <Dialog open={dialogState.open} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogState.type === "create" && "Create Subscription"}
              {dialogState.type === "edit" && "Edit Subscription"}
              {dialogState.type === "extend" && "Extend Subscription"}
              {dialogState.type === "cancel" && "Cancel Subscription"}
              {dialogState.type === "delete" && "Delete Subscription"}
            </DialogTitle>
            <DialogDescription>
              {dialogState.type === "create" &&
                "Create a new subscription for a user. This will give them immediate access."}
              {dialogState.type === "edit" &&
                "Update the subscription plan for this user."}
              {dialogState.type === "extend" &&
                "Extend the current subscription period."}
              {dialogState.type === "cancel" &&
                "Cancel this subscription. The user will retain access until the current period ends."}
              {dialogState.type === "delete" &&
                "Permanently delete this subscription record. This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {dialogState.type === "create" && (
              <>
                <div>
                  <Label htmlFor="userSearch">Search User</Label>
                  <Input
                    id="userSearch"
                    placeholder="Type user email or name..."
                    value={searchUsersQuery}
                    onChange={(e) => {
                      setSearchUsersQuery(e.target.value);
                      searchUsers(e.target.value);
                    }}
                  />
                  {searchedUsers.length > 0 && (
                    <div className="mt-2 border rounded-md max-h-48 overflow-y-auto">
                      {searchedUsers.map((u) => (
                        <button
                          key={u.id}
                          className={`w-full text-left px-3 py-2 hover:bg-accent transition-colors ${
                            selectedUserId === u.id ? "bg-accent" : ""
                          }`}
                          onClick={() => {
                            setSelectedUserId(u.id);
                            setSearchUsersQuery(
                              u.email || u.displayName || u.name || ""
                            );
                            setSearchedUsers([]);
                          }}
                        >
                          <p className="font-medium text-sm">
                            {u.displayName || u.name || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {u.email}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="plan">Subscription Plan</Label>
                  <Select
                    value={selectedPlan}
                    onValueChange={(value: "monthly" | "yearly" | "trial") =>
                      setSelectedPlan(value)
                    }
                  >
                    <SelectTrigger id="plan">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trial">Trial (7 days)</SelectItem>
                      <SelectItem value="monthly">Monthly Plan</SelectItem>
                      <SelectItem value="yearly">Yearly Plan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {dialogState.type === "edit" && (
              <>
                <div className="bg-secondary/50 p-3 rounded-lg mb-4">
                  <p className="text-sm font-medium">
                    User: <strong>{dialogState.userEmail}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Current Plan:{" "}
                    <Badge className="ml-1">
                      {dialogState.subscription?.plan}
                    </Badge>
                  </p>
                </div>

                <div>
                  <Label htmlFor="editPlan">New Subscription Plan</Label>
                  <Select
                    value={selectedPlan}
                    onValueChange={(value: "monthly" | "yearly" | "trial") =>
                      setSelectedPlan(value)
                    }
                  >
                    <SelectTrigger id="editPlan">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trial">Trial (7 days)</SelectItem>
                      <SelectItem value="monthly">Monthly Plan</SelectItem>
                      <SelectItem value="yearly">Yearly Plan</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    This will update the subscription plan type. The current
                    period dates will remain the same.
                  </p>
                </div>
              </>
            )}

            {dialogState.type === "extend" && (
              <div>
                <Label htmlFor="extendDays">Extend by (days)</Label>
                <Input
                  id="extendDays"
                  type="number"
                  min="1"
                  max="365"
                  value={extendDays}
                  onChange={(e) =>
                    setExtendDays(parseInt(e.target.value) || 30)
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  New end date:{" "}
                  {dialogState.subscription &&
                    new Date(
                      new Date(
                        dialogState.subscription.currentPeriodEnd
                      ).getTime() +
                        extendDays * 24 * 60 * 60 * 1000
                    ).toLocaleDateString()}
                </p>
              </div>
            )}

            {dialogState.type === "cancel" && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <p className="text-sm">
                  The user <strong>{dialogState.userEmail}</strong> will retain
                  access until{" "}
                  <strong>
                    {dialogState.subscription &&
                      new Date(
                        dialogState.subscription.currentPeriodEnd
                      ).toLocaleDateString()}
                  </strong>
                  .
                </p>
              </div>
            )}

            {dialogState.type === "delete" && (
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300">
                  This will permanently delete the subscription record for{" "}
                  <strong>{dialogState.userEmail}</strong>. The user will
                  immediately lose access.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              disabled={
                actionLoading ||
                (dialogState.type === "create" && !selectedUserId)
              }
              variant={
                dialogState.type === "delete" || dialogState.type === "cancel"
                  ? "destructive"
                  : "default"
              }
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
