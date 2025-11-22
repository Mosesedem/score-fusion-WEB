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
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import Image from "next/image";

interface Carousel {
  id: string;
  title?: string;
  imageUrl: string;
  altText?: string;
  type: "LANDING" | "DASHBOARD_FREE" | "DASHBOARD_VIP";
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminCarouselsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [carousels, setCarousels] = useState<Carousel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCarousel, setEditingCarousel] = useState<Carousel | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    imageUrl: "",
    altText: "",
    type: "LANDING" as "LANDING" | "DASHBOARD_FREE" | "DASHBOARD_VIP",
    isActive: true,
    order: "0",
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "ADMIN")) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.role === "ADMIN") {
      fetchCarousels();
    }
  }, [user]);

  const fetchCarousels = async () => {
    try {
      const res = await fetch("/api/admin/carousels");
      if (res.ok) {
        const data = await res.json();
        setCarousels(data.carousels || []);
      }
    } catch (error) {
      console.error("Failed to fetch carousels:", error);
    } finally {
      setLoading(false);
    }
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "upload_preset",
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "scorefusion"
    );

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!res.ok) {
      throw new Error("Upload failed");
    }

    const data = await res.json();
    return data.secure_url;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setFormData({ ...formData, imageUrl: url });
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = "/api/admin/carousels";
      const method = editingCarousel ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editingCarousel && { id: editingCarousel.id }),
          ...formData,
          order: parseInt(formData.order),
        }),
      });

      if (res.ok) {
        fetchCarousels();
        setShowForm(false);
        setEditingCarousel(null);
        setFormData({
          title: "",
          imageUrl: "",
          altText: "",
          type: "LANDING",
          isActive: true,
          order: "0",
        });
      }
    } catch (error) {
      console.error("Failed to save carousel:", error);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch("/api/admin/carousels", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive }),
      });

      if (res.ok) {
        fetchCarousels();
      }
    } catch (error) {
      console.error("Failed to toggle carousel:", error);
    }
  };

  const handleEdit = (carousel: Carousel) => {
    setEditingCarousel(carousel);
    setFormData({
      title: carousel.title || "",
      imageUrl: carousel.imageUrl,
      altText: carousel.altText || "",
      type: carousel.type,
      isActive: carousel.isActive,
      order: carousel.order.toString(),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this carousel image?"))
      return;

    try {
      const res = await fetch(`/api/admin/carousels?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchCarousels();
      }
    } catch (error) {
      console.error("Failed to delete carousel:", error);
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
            <h1 className="text-3xl font-bold">Carousel Management</h1>
            <p className="text-muted-foreground">
              Manage promotional banners and carousels for landing and dashboard
              pages
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Image
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>
                {editingCarousel
                  ? "Edit Carousel Image"
                  : "Add New Carousel Image"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title (Optional)</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g., Win with expert tips"
                  />
                </div>

                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LANDING">Landing Page</SelectItem>
                      <SelectItem value="DASHBOARD_FREE">
                        Dashboard Free
                      </SelectItem>
                      <SelectItem value="DASHBOARD_VIP">
                        Dashboard VIP
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="image">Image</Label>
                  <div className="space-y-2">
                    <Input
                      id="imageUrl"
                      value={formData.imageUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, imageUrl: e.target.value })
                      }
                      placeholder="Image URL or upload below"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <Label htmlFor="file-upload" className="cursor-pointer">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={uploading}
                          asChild
                        >
                          <span>
                            <Upload className="h-4 w-4 mr-2" />
                            {uploading
                              ? "Uploading..."
                              : "Upload to Cloudinary"}
                          </span>
                        </Button>
                      </Label>
                    </div>
                    {formData.imageUrl && (
                      <div className="relative w-32 h-20">
                        <Image
                          src={formData.imageUrl}
                          alt="Preview"
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="altText">Alt Text</Label>
                  <Input
                    id="altText"
                    value={formData.altText}
                    onChange={(e) =>
                      setFormData({ ...formData, altText: e.target.value })
                    }
                    placeholder="Alt text for accessibility"
                  />
                </div>

                <div>
                  <Label htmlFor="order">Order</Label>
                  <Input
                    id="order"
                    type="number"
                    min="0"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData({ ...formData, order: e.target.value })
                    }
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Lower numbers appear first
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="h-4 w-4"
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={!formData.imageUrl}>
                    {editingCarousel ? "Update" : "Create"} Image
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingCarousel(null);
                      setFormData({
                        title: "",
                        imageUrl: "",
                        altText: "",
                        type: "LANDING",
                        isActive: true,
                        order: "0",
                      });
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
          {carousels.map((carousel) => (
            <Card key={carousel.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="relative w-24 h-16 shrink-0">
                      <Image
                        src={carousel.imageUrl}
                        alt={carousel.altText || carousel.title || ""}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">
                          {carousel.title || "Untitled"}
                        </h3>
                        {carousel.isActive ? (
                          <Badge className="bg-primary text-primary-foreground">
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-secondary">Inactive</Badge>
                        )}
                        <Badge variant="outline">
                          {carousel.type.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Order: {carousel.order}</span>
                        <span>
                          Created:{" "}
                          {new Date(carousel.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {carousel.altText && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Alt: {carousel.altText}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleToggle(carousel.id, !carousel.isActive)
                      }
                    >
                      {carousel.isActive ? (
                        <>
                          <ToggleRight className="h-4 w-4 mr-1" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-4 w-4 mr-1" />
                          Activate
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(carousel)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(carousel.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {carousels.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No carousel images found. Add your first image to get started.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
