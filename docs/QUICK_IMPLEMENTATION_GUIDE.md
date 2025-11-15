# Quick Implementation Guide - Admin Predictions Page

## ✅ COMPLETED

1. **API-Football Integration** - Team search now uses API-Football
2. **Database Schema** - `confidenceLevel` field added to Tip model
3. **Environment Variables** - All API keys and Cloudinary config ready

## 🔧 TO IMPLEMENT (Step-by-Step)

### Step 1: Add New State Variables

At the top of the component, add these new state variables:

```typescript
const [manualMode, setManualMode] = useState(false);
const [uploadingImage, setUploadingImage] = useState(false);
const [errors, setErrors] = useState<Record<string, string>>({});
const [manualHomeTeam, setManualHomeTeam] = useState({ name: "", logoUrl: "" });
const [manualAwayTeam, setManualAwayTeam] = useState({ name: "", logoUrl: "" });
```

Add `confidenceLevel: "75"` to formData initial state.

### Step 2: Add Cloudinary Upload Function

Add this function before the `handleSubmit` function:

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

### Step 3: Replace Ticket Snapshot Handler

Replace the `handleAddTicketSnapshot` function with:

```typescript
const handleTicketSnapshotUpload = async (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  if (!e.target.files || e.target.files.length === 0) return;

  if (formData.ticketSnapshots.length >= 10) {
    setErrors({ ...errors, tickets: "Maximum 10 ticket snapshots allowed" });
    return;
  }

  const file = e.target.files[0];
  if (file.size > 5 * 1024 * 1024) {
    setErrors({ ...errors, tickets: "File size must be less than 5MB" });
    return;
  }

  setUploadingImage(true);
  setErrors({ ...errors, tickets: "" });

  try {
    const result = await uploadToCloudinary(file);
    setFormData({
      ...formData,
      ticketSnapshots: [...formData.ticketSnapshots, result.secure_url],
    });
  } catch (error) {
    console.error("Failed to upload:", error);
    setErrors({ ...errors, tickets: "Failed to upload image" });
  } finally {
    setUploadingImage(false);
  }
};
```

### Step 4: Add Manual Team Logo Upload Handler

Add this new function:

```typescript
const handleManualTeamLogoUpload = async (
  e: React.ChangeEvent<HTMLInputElement>,
  position: "home" | "away"
) => {
  if (!e.target.files || e.target.files.length === 0) return;

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
  } catch (error) {
    setErrors({ ...errors, logo: "Failed to upload logo" });
  } finally {
    setUploadingImage(false);
  }
};
```

### Step 5: Add Form Validation

Add this validation function before `handleSubmit`:

```typescript
const validateForm = (): boolean => {
  const newErrors: Record<string, string> = {};

  if (!formData.title.trim()) newErrors.title = "Title is required";
  if (!formData.summary.trim()) newErrors.summary = "Summary is required";
  if (!formData.matchDate) newErrors.matchDate = "Match date is required";
  if (!formData.predictedOutcome.trim())
    newErrors.outcome = "Predicted outcome is required";

  if (manualMode) {
    if (!manualHomeTeam.name.trim())
      newErrors.homeTeam = "Home team name is required";
    if (!manualAwayTeam.name.trim())
      newErrors.awayTeam = "Away team name is required";
  } else {
    if (!formData.homeTeamId) newErrors.homeTeam = "Please select a home team";
    if (!formData.awayTeamId) newErrors.awayTeam = "Please select an away team";
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

### Step 6: Update handleSubmit

At the start of `handleSubmit`, add validation:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validateForm()) return; // Add this line

  // ... rest of existing code
```

Before creating the payload, add manual team creation:

```typescript
let homeTeamId = formData.homeTeamId;
let awayTeamId = formData.awayTeamId;

if (manualMode) {
  // Create home team
  if (manualHomeTeam.name) {
    const homeRes = await fetch("/api/admin/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: manualHomeTeam.name,
        logoUrl: manualHomeTeam.logoUrl,
        sport: formData.sport,
        league: formData.league,
      }),
    });
    if (homeRes.ok) {
      const homeData = await homeRes.json();
      homeTeamId = homeData.data.team.id;
    }
  }

  // Create away team
  if (manualAwayTeam.name) {
    const awayRes = await fetch("/api/admin/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: manualAwayTeam.name,
        logoUrl: manualAwayTeam.logoUrl,
        sport: formData.sport,
        league: formData.league,
      }),
    });
    if (awayRes.ok) {
      const awayData = await awayRes.json();
      awayTeamId = awayData.data.team.id;
    }
  }
}
```

Update the payload to include:

```typescript
const payload = {
  ...formData,
  homeTeamId, // Use the created IDs
  awayTeamId, // Use the created IDs
  confidenceLevel: formData.confidenceLevel
    ? parseInt(formData.confidenceLevel)
    : undefined,
  content: formData.content || formData.summary, // Use summary if no content
  // ... rest of payload
};
```

### Step 7: Update resetForm

Add these lines to `resetForm`:

```typescript
setManualHomeTeam({ name: "", logoUrl: "" });
setManualAwayTeam({ name: "", logoUrl: "" });
setManualMode(false);
setErrors({});
```

### Step 8: Update Form JSX - Reorder Sections

**MOVE** the "Match & Teams" section to be FIRST in the form, right after the error display div.

### Step 9: Add Manual Mode Toggle

In the "Match & Teams" section header, add:

```typescript
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

### Step 10: Add Conditional Team Input

Replace the team selection dropdowns with:

```typescript
{
  !manualMode ? (
    <>{/* Existing team dropdowns + API search */}</>
  ) : (
    <>
      {/* Manual Mode */}
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
    </>
  );
}
```

### Step 11: Make Full Analysis Optional

Find the "Full Analysis" textarea and:

- Remove `required` attribute
- Add "(Optional)" to label
- Update placeholder text

### Step 12: Update Ticket Snapshot Upload

Replace the button with file input:

```typescript
<Input
  type="file"
  accept="image/*"
  onChange={handleTicketSnapshotUpload}
  disabled={uploadingImage || formData.ticketSnapshots.length >= 10}
  id="ticketUpload"
  className="hidden"
/>
<Label htmlFor="ticketUpload" className="cursor-pointer">
  <Button type="button" variant="outline" size="sm" disabled={uploadingImage || formData.ticketSnapshots.length >= 10} asChild>
    <span>
      <Upload className="h-4 w-4 mr-2" />
      {uploadingImage ? "Uploading..." : "Upload Snapshot"}
    </span>
  </Button>
</Label>
```

### Step 13: Add Confidence Level Field

In the "Prediction Details" grid, add:

```typescript
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

### Step 14: Add Error Display Throughout Form

Add error messages below each required field:

```typescript
{
  errors.title && (
    <p className="text-xs text-destructive mt-1">{errors.title}</p>
  );
}
{
  errors.summary && (
    <p className="text-xs text-destructive mt-1">{errors.summary}</p>
  );
}
{
  errors.matchDate && (
    <p className="text-xs text-destructive mt-1">{errors.matchDate}</p>
  );
}
// etc.
```

### Step 15: Add Submit Error Display

At the top of the form, add:

```typescript
{
  errors.submit && (
    <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
      {errors.submit}
    </div>
  );
}
```

### Step 16: Update Team Search Text

Change "TheSportsDB" to "API-Football" in the search label.

### Step 17: Add DateTime Min Attribute

For the match date input, add:

```typescript
const getCurrentDateTime = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}T${String(
    now.getHours()
  ).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
};

// In the input:
<Input
  type="datetime-local"
  min={getCurrentDateTime()}
  // ...
/>;
```

## ✅ Done!

After implementing these changes:

1. Test team search (should use API-Football)
2. Test manual mode (create teams with logo upload)
3. Test ticket snapshot upload
4. Test form validation
5. Test confidence level
6. Verify match date can't be in the past

The form will be much more user-friendly with better error handling and flexibility!
