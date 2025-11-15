"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

interface FeatureFlag {
  id: string;
  key: string;
  enabled: boolean;
  variant?: string;
  rollout: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminFeatureFlagsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [formData, setFormData] = useState({
    key: "",
    enabled: true,
    variant: "",
    rollout: "100",
  });

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "ADMIN")) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.role === "ADMIN") {
      fetchFlags();
    }
  }, [user]);

  const fetchFlags = async () => {
    try {
      const res = await fetch("/api/admin/flags");
      if (res.ok) {
        const data = await res.json();
        setFlags(data.flags || []);
      }
    } catch (error) {
      console.error("Failed to fetch flags:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = "/api/admin/flags";
      const method = editingFlag ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editingFlag && { id: editingFlag.id }),
          ...formData,
          rollout: parseInt(formData.rollout),
        }),
      });

      if (res.ok) {
        fetchFlags();
        setShowForm(false);
        setEditingFlag(null);
        setFormData({
          key: "",
          enabled: true,
          variant: "",
          rollout: "100",
        });
      }
    } catch (error) {
      console.error("Failed to save flag:", error);
    }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      const res = await fetch("/api/admin/flags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, enabled }),
      });

      if (res.ok) {
        fetchFlags();
      }
    } catch (error) {
      console.error("Failed to toggle flag:", error);
    }
  };

  const handleEdit = (flag: FeatureFlag) => {
    setEditingFlag(flag);
    setFormData({
      key: flag.key,
      enabled: flag.enabled,
      variant: flag.variant || "",
      rollout: flag.rollout.toString(),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this feature flag?")) return;

    try {
      const res = await fetch("/api/admin/flags", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        fetchFlags();
      }
    } catch (error) {
      console.error("Failed to delete flag:", error);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (user?.role !== "ADMIN") return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Feature Flags</h1>
            <p className="text-muted-foreground">
              Control feature rollout and A/B testing
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            New Flag
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>
                {editingFlag ? "Edit Feature Flag" : "Create New Feature Flag"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="key">Flag Key</Label>
                  <Input
                    id="key"
                    value={formData.key}
                    onChange={(e) =>
                      setFormData({ ...formData, key: e.target.value })
                    }
                    placeholder="e.g., enable_live_scores"
                    required
                    disabled={!!editingFlag}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Unique identifier for this feature flag (cannot be changed)
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="variant">Variant (Optional)</Label>
                    <Input
                      id="variant"
                      value={formData.variant}
                      onChange={(e) =>
                        setFormData({ ...formData, variant: e.target.value })
                      }
                      placeholder="e.g., variant_a"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Use for A/B testing different versions
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="rollout">Rollout Percentage</Label>
                    <Input
                      id="rollout"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.rollout}
                      onChange={(e) =>
                        setFormData({ ...formData, rollout: e.target.value })
                      }
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      0-100% of users will see this feature
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={formData.enabled}
                    onChange={(e) =>
                      setFormData({ ...formData, enabled: e.target.checked })
                    }
                    className="h-4 w-4"
                  />
                  <Label htmlFor="enabled">Enabled</Label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">
                    {editingFlag ? "Update" : "Create"} Flag
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingFlag(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {flags.map((flag) => (
            <Card key={flag.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-lg font-mono font-bold">
                        {flag.key}
                      </code>
                      {flag.enabled ? (
                        <Badge className="bg-primary text-primary-foreground">
                          Enabled
                        </Badge>
                      ) : (
                        <Badge className="bg-secondary">Disabled</Badge>
                      )}
                      {flag.variant && (
                        <Badge className="bg-secondary">{flag.variant}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Rollout: {flag.rollout}%</span>
                      <span>
                        Created: {new Date(flag.createdAt).toLocaleDateString()}
                      </span>
                      <span>
                        Updated: {new Date(flag.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggle(flag.id, !flag.enabled)}
                    >
                      {flag.enabled ? (
                        <>
                          <ToggleRight className="h-4 w-4 mr-1" />
                          Disable
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-4 w-4 mr-1" />
                          Enable
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(flag)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(flag.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {flags.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No feature flags found. Create your first flag to get started.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
