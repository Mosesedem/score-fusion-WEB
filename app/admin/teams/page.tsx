"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Image as ImageIcon } from "lucide-react";

interface Sport {
  id: string;
  name: string;
  displayName: string;
}

interface Team {
  id: string;
  name: string;
  shortName?: string;
  sportId: string;
  league?: string;
  country?: string;
  logoUrl?: string;
  isActive: boolean;
  sport: Sport;
  createdAt: string;
}

export default function AdminTeamsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  // API Search states
  const [apiSearchQuery, setApiSearchQuery] = useState("");
  const [apiSearchResults, setApiSearchResults] = useState<Team[]>([]);
  const [searchingTeams, setSearchingTeams] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: "",
    shortName: "",
    sportId: "",
    league: "",
    country: "",
    logoUrl: "",
    isActive: true,
  });

  // Search and pagination states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSport, setFilterSport] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "ADMIN")) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.role === "ADMIN") {
      fetchSports();
      fetchTeams();
    }
  }, [user]);

  const fetchSports = async () => {
    try {
      // Fetch available sports - you'll need to create this endpoint or use existing one
      const res = await fetch("/api/livescores/matches");
      if (res.ok) {
        // For now, use default sports
        setSports([
          { id: "1", name: "FOOTBALL", displayName: "Football" },
          { id: "2", name: "BASKETBALL", displayName: "Basketball" },
          { id: "3", name: "TENNIS", displayName: "Tennis" },
          { id: "4", name: "CRICKET", displayName: "Cricket" },
        ]);
      }
    } catch (error) {
      console.error("Failed to fetch sports:", error);
      // Set default sports
      setSports([
        { id: "1", name: "FOOTBALL", displayName: "Football" },
        { id: "2", name: "BASKETBALL", displayName: "Basketball" },
        { id: "3", name: "TENNIS", displayName: "Tennis" },
        { id: "4", name: "CRICKET", displayName: "Cricket" },
      ]);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/admin/teams");
      if (res.ok) {
        const data = await res.json();
        setTeams(data.data.teams || []);
      }
    } catch (error) {
      console.error("Failed to fetch teams:", error);
    } finally {
      setLoading(false);
    }
  };

  const uploadToCloudinary = async (
    file: File
  ): Promise<{ secure_url: string; public_id: string }> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME as
      | string
      | undefined;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET as
      | string
      | undefined;

    if (!cloudName || !uploadPreset) {
      throw new Error(
        "Cloudinary is not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET."
      );
    }

    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", uploadPreset);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: fd,
      }
    );
    if (!res.ok) {
      try {
        const errJson = await res.json();
        throw new Error(errJson?.error?.message || "Cloudinary upload failed");
      } catch {
        throw new Error("Cloudinary upload failed");
      }
    }
    return res.json();
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (file.size > 2 * 1024 * 1024) {
      setErrors({ ...errors, logo: "Logo size must be less than 2MB" });
      return;
    }
    setUploadingImage(true);
    setErrors({ ...errors, logo: "" });
    try {
      const result = await uploadToCloudinary(file);
      setFormData({ ...formData, logoUrl: result.secure_url });
    } catch (err) {
      console.error("Logo upload failed", err);
      setErrors({
        ...errors,
        logo:
          err instanceof Error
            ? `Failed to upload logo: ${err.message}`
            : "Failed to upload logo. Please try again.",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const searchAPITeams = async (query: string) => {
    if (query.length < 2) {
      setApiSearchResults([]);
      return;
    }
    setSearchingTeams(true);
    try {
      const res = await fetch(
        `/api/admin/teams/search?query=${encodeURIComponent(query)}&sport=${
          formData.sportId === "1" ? "FOOTBALL" : "BASKETBALL"
        }`
      );
      if (res.ok) {
        const data = await res.json();
        setApiSearchResults(data.data.teams || []);
      }
    } catch (error) {
      console.error("Failed to search teams:", error);
    } finally {
      setSearchingTeams(false);
    }
  };

  const handleSelectTeamFromAPI = async (team: Team) => {
    try {
      const res = await fetch("/api/admin/teams/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(team),
      });

      if (res.ok) {
        const data = await res.json();
        const createdTeam = data.data.team;

        // Add to local teams list
        setTeams((prev) => {
          const exists = prev.find((t) => t.id === createdTeam.id);
          return exists ? prev : [...prev, createdTeam];
        });

        // Reset form and close
        setApiSearchResults([]);
        setApiSearchQuery("");
        setShowForm(false);
        setManualMode(false);
        resetForm();
      }
    } catch (error) {
      console.error("Failed to create team:", error);
      alert("Failed to add team. Please try again.");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      shortName: "",
      sportId: "",
      league: "",
      country: "",
      logoUrl: "",
      isActive: true,
    });
    setErrors({});
    setApiSearchResults([]);
    setApiSearchQuery("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name.trim()) {
      setErrors({ name: "Team name is required" });
      return;
    }
    if (!formData.sportId) {
      setErrors({ sport: "Sport is required" });
      return;
    }

    try {
      const url = editingTeam ? `/api/admin/teams` : "/api/admin/teams";
      const method = editingTeam ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editingTeam && { id: editingTeam.id }),
          ...formData,
        }),
      });

      if (res.ok) {
        fetchTeams();
        setShowForm(false);
        setEditingTeam(null);
        resetForm();
      } else {
        const error = await res.json();
        setErrors({ submit: error.error || "Failed to save team" });
      }
    } catch (error) {
      console.error("Failed to save team:", error);
      setErrors({ submit: "Failed to save team. Please try again." });
    }
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      shortName: team.shortName || "",
      sportId: team.sportId,
      league: team.league || "",
      country: team.country || "",
      logoUrl: team.logoUrl || "",
      isActive: team.isActive,
    });
    setManualMode(true);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this team?")) return;

    try {
      const res = await fetch(`/api/admin/teams?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchTeams();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to delete team");
      }
    } catch (error) {
      console.error("Failed to delete team:", error);
      alert("Failed to delete team");
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

  if (!user || user.role !== "ADMIN") return null;

  // Filter and search logic
  const filteredTeams = teams.filter((team) => {
    const matchesSearch =
      searchQuery === "" ||
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.shortName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.league?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.country?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSport = filterSport === "all" || team.sportId === filterSport;

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && team.isActive) ||
      (filterStatus === "inactive" && !team.isActive);

    return matchesSearch && matchesSport && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredTeams.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTeams = filteredTeams.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Teams Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage teams for sports predictions
            </p>
          </div>
        </div>

        <div className="flex justify-end p-4">
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            New Team
          </Button>
        </div>

        {/* Search and Filter Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search teams by name, league, country..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full"
                />
              </div>
              <select
                value={filterSport}
                onChange={(e) => {
                  setFilterSport(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 bg-background border-2 border-border text-foreground rounded-md"
              >
                <option value="all">All Sports</option>
                {sports.map((sport) => (
                  <option key={sport.id} value={sport.id}>
                    {sport.displayName}
                  </option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 bg-background border-2 border-border text-foreground rounded-md"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Showing {startIndex + 1}-
              {Math.min(endIndex, filteredTeams.length)} of{" "}
              {filteredTeams.length} teams
            </div>
          </CardContent>
        </Card>

        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>
                {editingTeam ? "Edit Team" : "Create New Team"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {errors.submit && (
                  <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
                    {errors.submit}
                  </div>
                )}

                {/* Team Search or Manual Entry Toggle */}
                {!editingTeam && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg">Add Team</h3>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="manualMode">Manual Entry</Label>
                        <input
                          type="checkbox"
                          id="manualMode"
                          checked={manualMode}
                          onChange={(e) => {
                            setManualMode(e.target.checked);
                            setApiSearchResults([]);
                            setApiSearchQuery("");
                          }}
                          className="h-4 w-4"
                        />
                      </div>
                    </div>

                    {/* API Team Search */}
                    {!manualMode && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="sport">Sport *</Label>
                          <select
                            id="sport"
                            className="w-full px-3 py-2 bg-background border-2 border-border text-foreground rounded-md"
                            value={formData.sportId}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                sportId: e.target.value,
                              });
                              setApiSearchResults([]);
                            }}
                            required
                          >
                            <option value="">Select Sport</option>
                            {sports.map((sport) => (
                              <option key={sport.id} value={sport.id}>
                                {sport.displayName}
                              </option>
                            ))}
                          </select>
                        </div>

                        {formData.sportId && (
                          <div>
                            <Label htmlFor="apiSearch">Search for Team</Label>
                            <Input
                              id="apiSearch"
                              value={apiSearchQuery}
                              onChange={(e) => {
                                setApiSearchQuery(e.target.value);
                                searchAPITeams(e.target.value);
                              }}
                              placeholder="Type team name to search..."
                            />
                            {searchingTeams && (
                              <p className="text-sm text-muted-foreground mt-2">
                                Searching...
                              </p>
                            )}
                            {apiSearchResults.length > 0 && (
                              <div className="mt-2 border-2 border-border rounded-md max-h-64 overflow-y-auto">
                                {apiSearchResults.map((team, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() =>
                                      handleSelectTeamFromAPI(team)
                                    }
                                    className="w-full p-3 hover:bg-accent flex items-center gap-3 text-left"
                                  >
                                    {team.logoUrl && (
                                      <img
                                        src={team.logoUrl}
                                        alt={team.name}
                                        className="w-8 h-8 object-contain"
                                      />
                                    )}
                                    <div>
                                      <p className="font-medium">{team.name}</p>
                                      {team.league && (
                                        <p className="text-xs text-muted-foreground">
                                          {team.league}{" "}
                                          {team.country && `• ${team.country}`}
                                        </p>
                                      )}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Manual Entry Form */}
                {(manualMode || editingTeam) && (
                  <>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Team Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className={errors.name ? "border-destructive" : ""}
                          required
                        />
                        {errors.name && (
                          <p className="text-sm text-destructive mt-1">
                            {errors.name}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="shortName">Short Name</Label>
                        <Input
                          id="shortName"
                          value={formData.shortName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              shortName: e.target.value,
                            })
                          }
                          placeholder="e.g., MAN UTD"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="sportId">Sport *</Label>
                        <select
                          id="sportId"
                          className="w-full px-3 py-2 bg-background border-2 border-border text-foreground rounded-md"
                          value={formData.sportId}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              sportId: e.target.value,
                            })
                          }
                          required
                        >
                          <option value="">Select Sport</option>
                          {sports.map((sport) => (
                            <option key={sport.id} value={sport.id}>
                              {sport.displayName}
                            </option>
                          ))}
                        </select>
                        {errors.sport && (
                          <p className="text-sm text-destructive mt-1">
                            {errors.sport}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="league">League/Competition</Label>
                        <Input
                          id="league"
                          value={formData.league}
                          onChange={(e) =>
                            setFormData({ ...formData, league: e.target.value })
                          }
                          placeholder="e.g., Premier League"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          value={formData.country}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              country: e.target.value,
                            })
                          }
                          placeholder="e.g., England"
                        />
                      </div>
                      <div>
                        <Label htmlFor="logoUrl">Logo URL or Upload</Label>
                        <div className="flex gap-2">
                          <Input
                            id="logoUrl"
                            type="url"
                            value={formData.logoUrl}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                logoUrl: e.target.value,
                              })
                            }
                            placeholder="https://... or upload"
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              document.getElementById("logoFile")?.click()
                            }
                            disabled={uploadingImage}
                          >
                            {uploadingImage ? "Uploading..." : "Upload"}
                          </Button>
                          <input
                            id="logoFile"
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                        </div>
                        {formData.logoUrl && (
                          <img
                            src={formData.logoUrl}
                            alt="Logo preview"
                            className="mt-2 w-16 h-16 object-contain border-2 border-border rounded"
                          />
                        )}
                        {errors.logo && (
                          <p className="text-sm text-destructive mt-1">
                            {errors.logo}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isActive: e.target.checked,
                          })
                        }
                        className="h-4 w-4"
                      />
                      <Label htmlFor="isActive">Active</Label>
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit">
                        {editingTeam ? "Update" : "Create"} Team
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowForm(false);
                          setEditingTeam(null);
                          setManualMode(false);
                          resetForm();
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                )}
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedTeams.map((team) => (
            <Card key={team.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    {team.logoUrl ? (
                      <img
                        src={team.logoUrl}
                        alt={team.name}
                        className="w-12 h-12 object-contain"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-secondary flex items-center justify-center rounded">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold truncate">{team.name}</h3>
                      {team.shortName && (
                        <p className="text-sm text-muted-foreground">
                          {team.shortName}
                        </p>
                      )}
                    </div>
                  </div>
                  {!team.isActive && (
                    <Badge variant="outline" className="text-xs">
                      Inactive
                    </Badge>
                  )}
                </div>

                <div className="space-y-1 text-sm text-muted-foreground mb-4">
                  <p>
                    <span className="font-medium">Sport:</span>{" "}
                    {team.sport.displayName}
                  </p>
                  {team.league && (
                    <p>
                      <span className="font-medium">League:</span> {team.league}
                    </p>
                  )}
                  {team.country && (
                    <p>
                      <span className="font-medium">Country:</span>{" "}
                      {team.country}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(team)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(team.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {paginatedTeams.length === 0 &&
            filteredTeams.length === 0 &&
            teams.length > 0 && (
              <Card className="col-span-full">
                <CardContent className="p-8 md:p-12 text-center text-muted-foreground">
                  <ImageIcon className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-base md:text-lg mb-2">
                    No teams match your filters
                  </p>
                  <p className="text-xs md:text-sm">
                    Try adjusting your search or filter criteria
                  </p>
                </CardContent>
              </Card>
            )}

          {teams.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="p-8 md:p-12 text-center text-muted-foreground">
                <ImageIcon className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 opacity-50" />
                <p className="text-base md:text-lg mb-2">No teams found</p>
                <p className="text-xs md:text-sm">
                  Create your first team to get started
                </p>
              </CardContent>
            </Card>
          )}
        </div>

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
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
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
                      key={i}
                      size="sm"
                      variant={currentPage === pageNum ? "default" : "outline"}
                      onClick={() => setCurrentPage(pageNum)}
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
  );
}
