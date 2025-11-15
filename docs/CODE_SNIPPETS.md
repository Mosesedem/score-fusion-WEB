# Quick Reference - Key Code Snippets

## Cloudinary Upload Function

```typescript
const uploadToCloudinary = async (
  file: File
): Promise<{ secure_url: string; public_id: string }> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "ml_default");

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/dogmmnuu6/image/upload`,
    { method: "POST", body: formData }
  );

  if (!response.ok) throw new Error("Failed to upload image");
  return response.json();
};
```

## Manual Team Logo Upload

```typescript
const handleManualTeamLogoUpload = async (
  e: React.ChangeEvent<HTMLInputElement>,
  position: "home" | "away"
) => {
  if (!e.target.files?.[0]) return;

  const file = e.target.files[0];
  if (file.size > 2 * 1024 * 1024) {
    setErrors({ ...errors, logo: "Logo size must be less than 2MB" });
    return;
  }

  setUploadingImage(true);
  try {
    const result = await uploadToCloudinary(file);
    if (position === "home") {
      setManualHomeTeam({ ...manualHomeTeam, logoUrl: result.secure_url });
    } else {
      setManualAwayTeam({ ...manualAwayTeam, logoUrl: result.secure_url });
    }
  } catch {
    setErrors({ ...errors, logo: "Failed to upload logo" });
  } finally {
    setUploadingImage(false);
  }
};
```

## Ticket Snapshot Upload

```typescript
const handleTicketSnapshotUpload = async (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  if (!e.target.files?.[0]) return;

  if (formData.ticketSnapshots.length >= 10) {
    setErrors({ ...errors, tickets: "Maximum 10 snapshots allowed" });
    return;
  }

  const file = e.target.files[0];
  if (file.size > 5 * 1024 * 1024) {
    setErrors({ ...errors, tickets: "File must be less than 5MB" });
    return;
  }

  setUploadingImage(true);
  try {
    const result = await uploadToCloudinary(file);
    setFormData({
      ...formData,
      ticketSnapshots: [...formData.ticketSnapshots, result.secure_url],
    });
  } catch {
    setErrors({ ...errors, tickets: "Failed to upload" });
  } finally {
    setUploadingImage(false);
  }
};
```

## Form Validation

```typescript
const validateForm = (): boolean => {
  const newErrors: Record<string, string> = {};

  if (!formData.title.trim()) newErrors.title = "Title is required";
  if (!formData.summary.trim()) newErrors.summary = "Summary is required";
  if (!formData.matchDate) newErrors.matchDate = "Match date is required";
  if (!formData.predictedOutcome.trim())
    newErrors.outcome = "Outcome is required";

  if (manualMode) {
    if (!manualHomeTeam.name.trim()) newErrors.homeTeam = "Home team required";
    if (!manualAwayTeam.name.trim()) newErrors.awayTeam = "Away team required";
  } else {
    if (!formData.homeTeamId) newErrors.homeTeam = "Select home team";
    if (!formData.awayTeamId) newErrors.awayTeam = "Select away team";
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

## Manual Team Creation in Submit

```typescript
// In handleSubmit, before creating payload:
let homeTeamId = formData.homeTeamId;
let awayTeamId = formData.awayTeamId;

if (manualMode) {
  if (manualHomeTeam.name) {
    const res = await fetch("/api/admin/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: manualHomeTeam.name,
        logoUrl: manualHomeTeam.logoUrl,
        sport: formData.sport,
        league: formData.league,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      homeTeamId = data.data.team.id;
    }
  }

  if (manualAwayTeam.name) {
    const res = await fetch("/api/admin/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: manualAwayTeam.name,
        logoUrl: manualAwayTeam.logoUrl,
        sport: formData.sport,
        league: formData.league,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      awayTeamId = data.data.team.id;
    }
  }
}
```

## Manual Mode Toggle JSX

```tsx
<div className="flex items-center justify-between">
  <h3 className="font-bold text-lg flex items-center gap-2">
    <Calendar className="h-5 w-5" />
    Match & Teams
  </h3>
  <div className="flex items-center gap-2">
    <Label htmlFor="manualMode" className="text-sm">
      Manual Mode
    </Label>
    <input
      type="checkbox"
      id="manualMode"
      checked={manualMode}
      onChange={(e) => setManualMode(e.target.checked)}
      className="h-4 w-4"
    />
  </div>
</div>
```

## Manual Team Input JSX

```tsx
{
  manualMode ? (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-3">
        <Label>Home Team *</Label>
        <Input
          placeholder="Team name"
          value={manualHomeTeam.name}
          onChange={(e) =>
            setManualHomeTeam({ ...manualHomeTeam, name: e.target.value })
          }
          className={errors.homeTeam ? "border-destructive" : ""}
        />
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => handleManualTeamLogoUpload(e, "home")}
          disabled={uploadingImage}
        />
        {manualHomeTeam.logoUrl && (
          <img
            src={manualHomeTeam.logoUrl}
            alt="Home"
            className="w-16 h-16 object-contain border rounded"
          />
        )}
        {errors.homeTeam && (
          <p className="text-xs text-destructive">{errors.homeTeam}</p>
        )}
      </div>

      <div className="space-y-3">
        <Label>Away Team *</Label>
        <Input
          placeholder="Team name"
          value={manualAwayTeam.name}
          onChange={(e) =>
            setManualAwayTeam({ ...manualAwayTeam, name: e.target.value })
          }
          className={errors.awayTeam ? "border-destructive" : ""}
        />
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => handleManualTeamLogoUpload(e, "away")}
          disabled={uploadingImage}
        />
        {manualAwayTeam.logoUrl && (
          <img
            src={manualAwayTeam.logoUrl}
            alt="Away"
            className="w-16 h-16 object-contain border rounded"
          />
        )}
        {errors.awayTeam && (
          <p className="text-xs text-destructive">{errors.awayTeam}</p>
        )}
      </div>
    </div>
  ) : (
    <>{/* API mode - existing dropdowns + search */}</>
  );
}
```

## Ticket Upload Button JSX

```tsx
<Input
  type="file"
  accept="image/*"
  onChange={handleTicketSnapshotUpload}
  disabled={uploadingImage || formData.ticketSnapshots.length >= 10}
  id="ticketUpload"
  className="hidden"
/>
<Label htmlFor="ticketUpload" className="cursor-pointer">
  <Button
    type="button"
    variant="outline"
    size="sm"
    disabled={uploadingImage || formData.ticketSnapshots.length >= 10}
    asChild
  >
    <span>
      <Upload className="h-4 w-4 mr-2" />
      {uploadingImage ? "Uploading..." : "Upload Snapshot"}
    </span>
  </Button>
</Label>
```

## Confidence Level Input JSX

```tsx
<div>
  <Label htmlFor="confidenceLevel">Confidence Level (%)</Label>
  <Input
    id="confidenceLevel"
    type="number"
    min="1"
    max="100"
    value={formData.confidenceLevel}
    onChange={(e) =>
      setFormData({ ...formData, confidenceLevel: e.target.value })
    }
    placeholder="e.g., 75"
  />
  <p className="text-xs text-muted-foreground mt-1">
    Your confidence in this prediction (1-100%)
  </p>
</div>
```

## DateTime Helper

```typescript
const getCurrentDateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};
```

## Error Display JSX

```tsx
{
  errors.submit && (
    <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
      {errors.submit}
    </div>
  );
}
```

## State Variables to Add

```typescript
const [manualMode, setManualMode] = useState(false);
const [uploadingImage, setUploadingImage] = useState(false);
const [errors, setErrors] = useState<Record<string, string>>({});
const [manualHomeTeam, setManualHomeTeam] = useState({ name: "", logoUrl: "" });
const [manualAwayTeam, setManualAwayTeam] = useState({ name: "", logoUrl: "" });

// Add to formData:
confidenceLevel: "75",
```

## Updated Payload in handleSubmit

```typescript
const payload = {
  ...formData,
  homeTeamId, // Use created IDs
  awayTeamId, // Use created IDs
  odds: formData.odds ? parseFloat(formData.odds) : undefined,
  confidenceLevel: formData.confidenceLevel
    ? parseInt(formData.confidenceLevel)
    : undefined,
  matchDate: formData.matchDate || undefined,
  publishAt: formData.publishAt || new Date().toISOString(),
  content: formData.content || formData.summary,
  tags: formData.tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean),
};
```

## Updated resetForm

```typescript
const resetForm = () => {
  setFormData({
    /* reset all fields */
  });
  setManualHomeTeam({ name: "", logoUrl: "" });
  setManualAwayTeam({ name: "", logoUrl: "" });
  setManualMode(false);
  setErrors({});
};
```

---

Copy-paste these snippets directly into your code!
