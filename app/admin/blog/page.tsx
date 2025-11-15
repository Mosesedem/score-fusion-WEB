"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CustomMarkdownEditor } from "@/components/custom-markdown-editor";
import { Plus, Edit, Trash2, Eye, Calendar, User, X } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  headerImage?: string;
  images: string[];
  authorName: string;
  publishedAt: string;
  status: string;
  tags: string[];
  viewCount: number;
  createdAt: string;
}

export default function AdminBlogPage() {
  const { user, isLoading } = useAuth();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    tags: "",
    status: "draft" as "draft" | "published",
    headerImage: "",
    images: [] as string[],
  });

  // Image upload states
  const [uploadingHeader, setUploadingHeader] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Search and pagination states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "ADMIN")) {
      return;
    }
  }, [user, isLoading]);

  useEffect(() => {
    if (user?.role === "ADMIN") {
      fetchBlogs();
    }
  }, [user]);

  const fetchBlogs = async () => {
    try {
      const res = await fetch("/api/admin/blog");
      if (res.ok) {
        const data = await res.json();
        setBlogs(data.data.blogs || []);
      }
    } catch (error) {
      console.error("Failed to fetch blogs:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: generateSlug(title),
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.slug.trim()) newErrors.slug = "Slug is required";
    if (!formData.content.trim()) newErrors.content = "Content is required";
    if (!formData.excerpt.trim()) newErrors.excerpt = "Excerpt is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const url = editingBlog
        ? `/api/admin/blog?id=${editingBlog.id}`
        : "/api/admin/blog";
      const method = editingBlog ? "PUT" : "POST";

      const payload = {
        ...formData,
        tags: formData.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        fetchBlogs();
        setShowForm(false);
        setEditingBlog(null);
        resetForm();
        setErrors({});
      } else {
        const error = await res.json();
        setErrors({ submit: error.error || "Failed to save blog post" });
      }
    } catch (error) {
      console.error("Failed to save blog post:", error);
      setErrors({ submit: "Failed to save blog post. Please try again." });
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      content: "",
      excerpt: "",
      tags: "",
      status: "draft",
      headerImage: "",
      images: [],
    });
    setErrors({});
  };

  const handleEdit = (blog: BlogPost) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      slug: blog.slug,
      content: blog.content,
      excerpt: blog.excerpt || "",
      tags: blog.tags.join(", "),
      status: blog.status as "draft" | "published",
      headerImage: blog.headerImage || "",
      images: blog.images || [],
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;

    try {
      const res = await fetch(`/api/admin/blog?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchBlogs();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to delete blog post");
      }
    } catch (error) {
      console.error("Failed to delete blog post:", error);
      alert("Failed to delete blog post");
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const formDataUpload = new FormData();
    formDataUpload.append("file", file);
    formDataUpload.append(
      "upload_preset",
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "scorefusion"
    );

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formDataUpload,
        }
      );

      if (res.ok) {
        const data = await res.json();
        return data.secure_url;
      } else {
        console.error("Failed to upload image:", await res.text());
        return null;
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
  };

  const handleHeaderImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingHeader(true);
    const imageUrl = await uploadImage(file);
    setUploadingHeader(false);

    if (imageUrl) {
      setFormData({ ...formData, headerImage: imageUrl });
    } else {
      alert("Failed to upload header image");
    }
  };

  const handleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const imageUrl = await uploadImage(file);
      if (imageUrl) {
        uploadedUrls.push(imageUrl);
      }
    }

    setUploadingImages(false);

    if (uploadedUrls.length > 0) {
      setFormData({
        ...formData,
        images: [...formData.images, ...uploadedUrls],
      });
    } else {
      alert("Failed to upload images");
    }
  };

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
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

  if (!user || user.role !== "ADMIN") return null;

  // Filter and search logic
  const filteredBlogs = blogs.filter((blog) => {
    const matchesSearch =
      searchQuery === "" ||
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || blog.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredBlogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBlogs = filteredBlogs.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Blog Management</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage blog posts
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            New Blog Post
          </Button>
        </div>

        {/* Search and Filter Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search blog posts..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 bg-background border-2 border-border text-foreground rounded-md"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Showing {startIndex + 1}-
              {Math.min(endIndex, filteredBlogs.length)} of{" "}
              {filteredBlogs.length} blog posts
            </div>
          </CardContent>
        </Card>

        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>
                {editingBlog ? "Edit Blog Post" : "Create New Blog Post"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {errors.submit && (
                  <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
                    {errors.submit}
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="Blog post title"
                      className={errors.title ? "border-destructive" : ""}
                    />
                    {errors.title && (
                      <p className="text-xs text-destructive mt-1">
                        {errors.title}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData({ ...formData, slug: e.target.value })
                      }
                      placeholder="url-friendly-slug"
                      className={errors.slug ? "border-destructive" : ""}
                    />
                    {errors.slug && (
                      <p className="text-xs text-destructive mt-1">
                        {errors.slug}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="excerpt">Excerpt *</Label>
                  <div className="mt-2">
                    <textarea
                      id="excerpt"
                      value={formData.excerpt}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setFormData({ ...formData, excerpt: e.target.value })
                      }
                      placeholder="Short description for preview (150-200 characters recommended)"
                      rows={4}
                      maxLength={300}
                      className={`w-full px-3 py-2 bg-background border-2 border-border text-foreground rounded-md resize-none ${
                        errors.excerpt ? "border-destructive" : ""
                      }`}
                    />
                    <div className="flex justify-between items-center mt-1">
                      {errors.excerpt && (
                        <p className="text-xs text-destructive">
                          {errors.excerpt}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground ml-auto">
                        {formData.excerpt.length}/300 characters
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="content">Content *</Label>
                  <div className="mt-2">
                    <CustomMarkdownEditor
                      value={formData.content}
                      onChange={(value) =>
                        setFormData({ ...formData, content: value })
                      }
                      placeholder="Write your blog post content here. Use the toolbar for formatting or type directly."
                      error={!!errors.content}
                    />
                    {errors.content && (
                      <p className="text-xs text-destructive mt-1">
                        {errors.content}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) =>
                        setFormData({ ...formData, tags: e.target.value })
                      }
                      placeholder="e.g., football, analysis, tips"
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      className="w-full px-3 py-2 bg-background border-2 border-border text-foreground rounded-md"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as "draft" | "published",
                        })
                      }
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                </div>

                {/* Header Image Upload */}
                <div>
                  <Label htmlFor="headerImage">Header Image (optional)</Label>
                  <div className="mt-2">
                    <Input
                      id="headerImage"
                      type="file"
                      accept="image/*"
                      onChange={handleHeaderImageUpload}
                      disabled={uploadingHeader}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    />
                    {uploadingHeader && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Uploading header image...
                      </p>
                    )}
                    {formData.headerImage && (
                      <div className="mt-2">
                        <Image
                          src={formData.headerImage}
                          alt="Header preview"
                          width={400}
                          height={128}
                          className="w-full max-w-md h-32 object-cover rounded-md"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setFormData({ ...formData, headerImage: "" })
                          }
                          className="mt-2"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove Header Image
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Images Upload */}
                <div>
                  <Label htmlFor="images">Additional Images (optional)</Label>
                  <div className="mt-2">
                    <Input
                      id="images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImagesUpload}
                      disabled={uploadingImages}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    />
                    {uploadingImages && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Uploading images...
                      </p>
                    )}
                    {formData.images.length > 0 && (
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                        {formData.images.map((image, index) => (
                          <div key={index} className="relative">
                            <Image
                              src={image}
                              alt={`Image ${index + 1}`}
                              width={200}
                              height={96}
                              className="w-full h-24 object-cover rounded-md"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">
                    {editingBlog ? "Update" : "Create"} Blog Post
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingBlog(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Blog Posts List */}
        <div className="space-y-4">
          {paginatedBlogs.map((blog) => (
            <Card key={blog.id}>
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-base md:text-lg font-bold">
                        {blog.title}
                      </h3>
                      <Badge
                        variant={
                          blog.status === "published"
                            ? "default"
                            : blog.status === "draft"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {blog.status}
                      </Badge>
                    </div>

                    <p className="text-muted-foreground mb-2 line-clamp-2 text-sm md:text-base">
                      {blog.excerpt}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm mb-2">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{blog.authorName}</span>
                      </div>
                      {blog.publishedAt && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(blog.publishedAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>{blog.viewCount} views</span>
                      </div>
                    </div>

                    {blog.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {blog.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(blog)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(blog.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {paginatedBlogs.length === 0 &&
            filteredBlogs.length === 0 &&
            blogs.length > 0 && (
              <Card>
                <CardContent className="p-8 md:p-12 text-center text-muted-foreground">
                  <p className="text-base md:text-lg mb-2">
                    No blog posts match your filters
                  </p>
                  <p className="text-xs md:text-sm">
                    Try adjusting your search or filter criteria
                  </p>
                </CardContent>
              </Card>
            )}

          {blogs.length === 0 && (
            <Card>
              <CardContent className="p-8 md:p-12 text-center text-muted-foreground">
                <p className="text-base md:text-lg mb-2">No blog posts found</p>
                <p className="text-xs md:text-sm">
                  Create your first blog post to get started
                </p>
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        size="sm"
                        variant={
                          currentPage === pageNum ? "default" : "outline"
                        }
                        onClick={() => setCurrentPage(pageNum)}
                        className="hidden sm:inline-flex"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
