"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Copy,
  CheckCircle,
  Calendar,
  User,
  Shield,
  Loader2,
  Mail,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  Edit,
  Save,
  Trash2,
} from "lucide-react";

interface VIPToken {
  id: string;
  token: string;
  userId: string | null;
  type: string;
  quantity: number;
  used: number;
  expiresAt: string;
  createdAt: string;
  batchId: string | null;
  metadata?: {
    createdByName?: string;
    reason?: string;
  };
  user?: {
    email: string | null;
    displayName: string | null;
    name: string | null;
  };
}

interface User {
  id: string;
  email: string | null;
  displayName: string | null;
  name: string | null;
}

export default function AdminVIPTokensPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [tokens, setTokens] = useState<VIPToken[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [generatingTokens, setGeneratingTokens] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "expired" | "used"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [editingToken, setEditingToken] = useState<VIPToken | null>(null);
  const [editForm, setEditForm] = useState({
    userId: "",
    expirationDays: "",
    quantity: "",
    used: "",
    reason: "",
  });
  const [saving, setSaving] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });
  const [alertDialog, setAlertDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
  }>({
    open: false,
    title: "",
    message: "",
  });
  const [formData, setFormData] = useState({
    userId: "",
    quantity: "1",
    expirationDays: "30",
    reason: "",
  });

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "ADMIN")) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.role === "ADMIN") {
      fetchTokens();
      fetchUsers();
    }
  }, [user]);

  const fetchTokens = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/tokens/list");
      if (res.ok) {
        const data = await res.json();
        setTokens(data.data?.tokens || []);
      }
    } catch (error) {
      console.error("Failed to fetch tokens:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users?limit=100");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.data?.users || []);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.userId) {
      setAlertDialog({
        open: true,
        title: "User Required",
        message: "Please select a user to generate tokens for.",
      });
      return;
    }

    setGeneratingTokens(true);
    try {
      const res = await fetch("/api/admin/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: formData.userId,
          quantity: parseInt(formData.quantity),
          expirationDays: parseInt(formData.expirationDays),
          reason: formData.reason || "Admin generated VIP access",
          type: "general",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setAlertDialog({
          open: true,
          title: "Success",
          message: `Successfully generated ${formData.quantity} VIP token${
            parseInt(formData.quantity) > 1 ? "s" : ""
          }! Email sent to user.`,
        });
        setShowForm(false);
        setFormData({
          userId: "",
          quantity: "1",
          expirationDays: "30",
          reason: "",
        });
        fetchTokens();
      } else {
        setAlertDialog({
          open: true,
          title: "Error",
          message: data.error || "Failed to generate tokens",
        });
      }
    } catch (error) {
      console.error("Failed to generate token:", error);
      setAlertDialog({
        open: true,
        title: "Error",
        message: "Failed to generate tokens. Please try again.",
      });
    } finally {
      setGeneratingTokens(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleEdit = (token: VIPToken) => {
    setEditingToken(token);
    const currentExpiration = new Date(token.expiresAt);
    const daysFromNow = Math.ceil(
      (currentExpiration.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    setEditForm({
      userId: token.userId || "unassigned",
      expirationDays: daysFromNow.toString(),
      quantity: token.quantity.toString(),
      used: token.used.toString(),
      reason: token.metadata?.reason || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingToken) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/tokens/${editingToken.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editForm.userId === "unassigned" ? null : editForm.userId,
          expirationDays: parseInt(editForm.expirationDays),
          quantity: parseInt(editForm.quantity),
          used: parseInt(editForm.used),
          reason: editForm.reason,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setAlertDialog({
          open: true,
          title: "Success",
          message: "Token updated successfully!",
        });
        setEditingToken(null);
        fetchTokens();
      } else {
        setAlertDialog({
          open: true,
          title: "Error",
          message: data.error || "Failed to update token",
        });
      }
    } catch (error) {
      console.error("Failed to update token:", error);
      setAlertDialog({
        open: true,
        title: "Error",
        message: "Failed to update token. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteToken = async () => {
    if (!editingToken) return;

    setConfirmDialog({
      open: true,
      title: "Delete Token",
      message: `Are you sure you want to delete token ${editingToken.token}? This action cannot be undone.`,
      onConfirm: async () => {
        setSaving(true);
        try {
          const res = await fetch(`/api/admin/tokens/${editingToken.id}`, {
            method: "DELETE",
          });

          const data = await res.json();

          if (res.ok) {
            setAlertDialog({
              open: true,
              title: "Success",
              message: "Token deleted successfully!",
            });
            setEditingToken(null);
            fetchTokens();
          } else {
            setAlertDialog({
              open: true,
              title: "Error",
              message: data.error || "Failed to delete token",
            });
          }
        } catch (error) {
          console.error("Failed to delete token:", error);
          setAlertDialog({
            open: true,
            title: "Error",
            message: "Failed to delete token. Please try again.",
          });
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const getTokenStatus = (token: VIPToken) => {
    const isExpired = new Date(token.expiresAt) < new Date();
    const isUsed = token.used >= token.quantity;

    if (isUsed) return { label: "Used", color: "bg-gray-500" };
    if (isExpired) return { label: "Expired", color: "bg-destructive" };
    return { label: "Active", color: "bg-green-500" };
  };

  // Filter and search tokens
  const filteredTokens = tokens.filter((token) => {
    const status = getTokenStatus(token);
    const userName =
      token.user?.displayName || token.user?.name || token.user?.email || "";

    // Apply search filter
    const matchesSearch =
      searchQuery === "" ||
      token.token.toLowerCase().includes(searchQuery.toLowerCase()) ||
      userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.metadata?.reason?.toLowerCase().includes(searchQuery.toLowerCase());

    // Apply status filter
    const matchesStatus =
      statusFilter === "all" || status.label.toLowerCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTokens.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTokens = filteredTokens.slice(startIndex, endIndex);

  if (isLoading || loading) {
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8" />
              VIP Tokens
            </h1>
            <p className="text-muted-foreground">
              Generate and manage VIP access PINs for users
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Generate Tokens
          </Button>
        </div>

        {/* Search and Filter Controls */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by PIN, user, or reason..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  onClick={() => {
                    setStatusFilter("all");
                    setCurrentPage(1);
                  }}
                  size="sm"
                >
                  All ({tokens.length})
                </Button>
                <Button
                  variant={statusFilter === "active" ? "default" : "outline"}
                  onClick={() => {
                    setStatusFilter("active");
                    setCurrentPage(1);
                  }}
                  size="sm"
                >
                  Active (
                  {
                    tokens.filter((t) => getTokenStatus(t).label === "Active")
                      .length
                  }
                  )
                </Button>
                <Button
                  variant={statusFilter === "expired" ? "default" : "outline"}
                  onClick={() => {
                    setStatusFilter("expired");
                    setCurrentPage(1);
                  }}
                  size="sm"
                >
                  Expired (
                  {
                    tokens.filter((t) => getTokenStatus(t).label === "Expired")
                      .length
                  }
                  )
                </Button>
                <Button
                  variant={statusFilter === "used" ? "default" : "outline"}
                  onClick={() => {
                    setStatusFilter("used");
                    setCurrentPage(1);
                  }}
                  size="sm"
                >
                  Used (
                  {
                    tokens.filter((t) => getTokenStatus(t).label === "Used")
                      .length
                  }
                  )
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Generate VIP Access Tokens</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <Label htmlFor="userId">Select User</Label>
                  <Select
                    value={formData.userId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, userId: value })
                    }
                  >
                    <SelectTrigger id="userId">
                      <SelectValue placeholder="Choose a user..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            {u.displayName || u.name || u.email || "Unknown"}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    <Mail className="h-3 w-3 inline mr-1" />
                    An email with the PIN
                    {parseInt(formData.quantity) > 1 ? "s" : ""} will be sent to
                    the user
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="quantity">Number of PINs</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, quantity: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="expirationDays">Valid For (days)</Label>
                    <Input
                      id="expirationDays"
                      type="number"
                      min="1"
                      value={formData.expirationDays}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          expirationDays: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 inline mr-1" />
                      Expires:{" "}
                      {new Date(
                        Date.now() +
                          parseInt(formData.expirationDays) *
                            24 *
                            60 *
                            60 *
                            1000
                      ).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="reason">Reason (Optional)</Label>
                  <Input
                    id="reason"
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData({ ...formData, reason: e.target.value })
                    }
                    placeholder="e.g., Promotional reward, Compensation, etc."
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={generatingTokens}>
                    {generatingTokens ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Generate {formData.quantity} PIN
                        {parseInt(formData.quantity) > 1 ? "s" : ""}
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Loading Overlay */}
        {loading && tokens.length > 0 && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Results Info */}
        {!loading && filteredTokens.length > 0 && (
          <div className="text-sm text-muted-foreground mb-4">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredTokens.length)}{" "}
            of {filteredTokens.length} token
            {filteredTokens.length !== 1 ? "s" : ""}
            {searchQuery && ` matching "${searchQuery}"`}
          </div>
        )}

        <div className="space-y-4">
          {paginatedTokens.map((token) => {
            const status = getTokenStatus(token);
            const expiresDate = new Date(token.expiresAt);
            const daysRemaining = Math.ceil(
              (expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );

            return (
              <Card key={token.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <code className="text-xl font-mono font-bold bg-secondary px-4 py-2 rounded">
                          {token.token}
                        </code>
                        <Badge className={`${status.color} text-white`}>
                          {status.label}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>
                            Assigned to:{" "}
                            <span className="font-medium text-foreground">
                              {token.user?.displayName ||
                                token.user?.name ||
                                token.user?.email ||
                                "Unknown"}
                            </span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Expires: {expiresDate.toLocaleDateString()}
                            {daysRemaining > 0 && status.label === "Active" && (
                              <span className="text-yellow-600 font-medium ml-1">
                                ({daysRemaining}d left)
                              </span>
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CheckCircle className="h-4 w-4" />
                          <span>
                            Usage: {token.used}/{token.quantity}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>
                            Created:{" "}
                            {new Date(token.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {token.metadata?.reason && (
                        <div className="mt-3 p-2 bg-secondary/30 rounded text-sm">
                          <span className="text-muted-foreground">Reason:</span>{" "}
                          <span className="font-medium">
                            {token.metadata.reason}
                          </span>
                        </div>
                      )}

                      {token.metadata?.createdByName && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Created by: {token.metadata.createdByName}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(token)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(token.token)}
                      >
                        {copiedCode === token.token ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-1" />
                            Copy PIN
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* No Results */}
          {filteredTokens.length === 0 && !loading && tokens.length > 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Tokens Found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or filter criteria
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setCurrentPage(1);
                  }}
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}

          {tokens.length === 0 && !loading && (
            <Card>
              <CardContent className="p-12 text-center">
                <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">
                  No VIP Tokens Yet
                </h3>
                <p className="text-muted-foreground mb-4">
                  Generate your first VIP access token to get started
                </p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Token
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Pagination Controls */}
        {filteredTokens.length > itemsPerPage && (
          <Card className="mt-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Token Dialog */}
        <Dialog
          open={!!editingToken}
          onOpenChange={(open) => !open && setEditingToken(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit VIP Token</DialogTitle>
              <DialogDescription>
                Update token details. Changes will be logged in the audit trail.
              </DialogDescription>
            </DialogHeader>

            {editingToken && (
              <div className="space-y-4">
                <div className="p-3 bg-secondary/30 rounded">
                  <div className="text-sm font-medium mb-1">Token PIN</div>
                  <code className="text-lg font-mono font-bold">
                    {editingToken.token}
                  </code>
                </div>

                <div>
                  <Label htmlFor="edit-userId">Assign to User</Label>
                  <Select
                    value={editForm.userId}
                    onValueChange={(value) =>
                      setEditForm({ ...editForm, userId: value })
                    }
                  >
                    <SelectTrigger id="edit-userId">
                      <SelectValue placeholder="Select a user (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            {u.displayName || u.name || u.email || "Unknown"}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-quantity">Total Quantity</Label>
                    <Input
                      id="edit-quantity"
                      type="number"
                      min="1"
                      value={editForm.quantity}
                      onChange={(e) =>
                        setEditForm({ ...editForm, quantity: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Maximum number of uses
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="edit-used">Used Count</Label>
                    <Input
                      id="edit-used"
                      type="number"
                      min="0"
                      max={editForm.quantity}
                      value={editForm.used}
                      onChange={(e) =>
                        setEditForm({ ...editForm, used: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Times already used
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-expirationDays">
                    Expiration (days from now)
                  </Label>
                  <Input
                    id="edit-expirationDays"
                    type="number"
                    min="1"
                    value={editForm.expirationDays}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        expirationDays: e.target.value,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    <Calendar className="h-3 w-3 inline mr-1" />
                    New expiration:{" "}
                    {new Date(
                      Date.now() +
                        parseInt(editForm.expirationDays || "0") *
                          24 *
                          60 *
                          60 *
                          1000
                    ).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <Label htmlFor="edit-reason">Reason for Edit</Label>
                  <Input
                    id="edit-reason"
                    value={editForm.reason}
                    onChange={(e) =>
                      setEditForm({ ...editForm, reason: e.target.value })
                    }
                    placeholder="e.g., Extended validity, Fixed usage count"
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <div className="flex w-full justify-between items-center">
                <Button
                  variant="destructive"
                  onClick={handleDeleteToken}
                  disabled={saving}
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Token
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditingToken(null)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveEdit} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialog */}
        <Dialog
          open={confirmDialog.open}
          onOpenChange={(open) =>
            !open && setConfirmDialog({ ...confirmDialog, open: false })
          }
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{confirmDialog.title}</DialogTitle>
              <DialogDescription>{confirmDialog.message}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() =>
                  setConfirmDialog({ ...confirmDialog, open: false })
                }
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog({ ...confirmDialog, open: false });
                }}
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Alert Dialog */}
        <Dialog
          open={alertDialog.open}
          onOpenChange={(open) =>
            !open && setAlertDialog({ ...alertDialog, open: false })
          }
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{alertDialog.title}</DialogTitle>
              <DialogDescription>{alertDialog.message}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                onClick={() => setAlertDialog({ ...alertDialog, open: false })}
              >
                OK
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
