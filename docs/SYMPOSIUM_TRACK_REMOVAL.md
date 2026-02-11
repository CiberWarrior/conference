# Symposium / Track - Migration to Custom Fields

## 📋 Summary

Removed hardcoded **Symposium** and **Track** fields from the abstract submission system and migrated them to the **custom fields** system. This provides more flexibility and allows admins to configure these fields like any other custom field.

---

## 🎯 Why This Change?

### Before (Hardcoded):
- Symposium and Track were special, hardcoded fields in the system
- Had dedicated UI in conference settings
- Had special handling in frontend, backend, and admin views
- Less flexible - couldn't be customized like other fields

### After (Custom Fields):
- Symposium/Track are now regular **custom fields**
- Admin creates them like any other field (select, checkboxes, etc.)
- Consistent with the rest of the system
- More flexible - can add symposium, track, section, or any custom categorization

---

## ✅ Changes Made

### 1. **Frontend - Abstract Submission Form**
**File**: `/app/conferences/[slug]/submit-abstract/page.tsx`

**Removed**:
- `selectedSymposium` state
- `selectedTrack` state
- Symposium validation logic
- Track validation logic
- Hardcoded symposium/track UI rendering
- Symposium/track data in form submission

**Result**: Now these fields (if needed) are rendered as regular custom fields.

---

### 2. **Backend - Submit Abstract API**
**File**: `/app/api/conferences/[slug]/submit-abstract/route.ts`

**Removed**:
- `symposiumStr` parsing from formData
- `track` parsing from formData
- Special symposium/track handling
- Symposium/track in email notifications (HTML + plain text)

**Result**: If admin creates custom fields named "symposium" or "track", they will be automatically handled through the standard `custom_data` flow.

---

### 3. **Admin - Conference Settings**
**File**: `/app/admin/conferences/[id]/settings/page.tsx`

**Removed**:
- Entire "Simpoziji / Sekcije" configuration UI section
- `symposium_enabled`, `symposium_label`, `symposium_required`, `symposium_options`, `symposium_allow_multiple` state
- `track_enabled`, `track_label`, `track_required`, `track_options` state
- Settings loading for symposium/track
- Settings saving for symposium/track

**Result**: Admin now creates these fields in the "Custom Abstract Submission Fields" section.

---

### 4. **Admin - Abstracts View**
**File**: `/app/admin/abstracts/page.tsx`

**Removed**:
- Special symposium/track badge rendering in abstracts table

**Result**: If custom fields are created, they'll appear in the abstract data like any other custom field.

---

### 5. **Types**
**File**: `/types/conference.ts`

**Removed** from `ConferenceSettings` interface:
```typescript
// Abstract symposium/section configuration
symposium_enabled?: boolean
symposium_label?: string
symposium_required?: boolean
symposium_options?: string[]
symposium_allow_multiple?: boolean

// Additional track (optional second level)
track_enabled?: boolean
track_label?: string
track_required?: boolean
track_options?: string[]
```

**Result**: Clean interface without special symposium/track fields.

---

## 📖 How to Use Now (For Admins)

### Creating Symposium/Track Fields as Custom Fields

**Navigate to**: Admin → Conference Settings → "Custom Abstract Submission Fields"

### Example 1: Symposium (Single Select)

**Click "+ Add Field"**:
- **Label**: `Symposium`
- **Field Name**: `symposium` (or any name you want)
- **Type**: `Select (Dropdown)`
- **Required**: ✅ Yes (if mandatory)
- **Options** (one per line):
  ```
  Symposium 1: Molecular Biology
  Symposium 2: Genetics
  Symposium 3: Clinical Studies
  Section A: Neuroscience
  Section B: Immunology
  ```

**Save** → Done! ✅

---

### Example 2: Symposium (Multiple Select)

**Click "+ Add Field"**:
- **Label**: `Symposium`
- **Field Name**: `symposium_multiple`
- **Type**: `Checkboxes (Multiple)`
- **Required**: ✅ Yes
- **Options**:
  ```
  Symposium 1
  Symposium 2
  Symposium 3
  ```

**Save** → Done! ✅

---

### Example 3: Track/Session (Single Select)

**Click "+ Add Field"**:
- **Label**: `Track / Session`
- **Field Name**: `track`
- **Type**: `Select (Dropdown)`
- **Required**: ❌ No (optional)
- **Options**:
  ```
  Session A: Morning
  Session B: Afternoon
  Workshop Track
  Poster Session
  ```

**Save** → Done! ✅

---

## 🎨 How It Appears to Users

### Before (Hardcoded):
```
┌─────────────────────────────────┐
│ Abstract Type *                 │
│ ○ Poster ○ Oral ○ Invited      │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ Symposium *                     │
│ [Select dropdown]               │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ Track                           │
│ [Select dropdown]               │
└─────────────────────────────────┘
```

### After (Custom Fields):
```
┌─────────────────────────────────┐
│ Abstract Type *                 │
│ ○ Poster ○ Oral ○ Invited      │
└─────────────────────────────────┘

... (other custom fields) ...

┌─────────────────────────────────┐
│ Symposium *  [if admin created] │
│ [Select dropdown or checkboxes] │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ Track  [if admin created]       │
│ [Select dropdown]               │
└─────────────────────────────────┘

... (other custom fields) ...
```

---

## 🔄 Migration Path (For Existing Conferences)

If you already had symposium/track configured (hardcoded):

### Step 1: Note Your Current Settings
Before making changes, note:
- ✅ Symposium label (e.g., "Symposium", "Section")
- ✅ Symposium options (list of all symposiums/sections)
- ✅ Was it required?
- ✅ Multiple selections allowed?
- ✅ Track label (e.g., "Track", "Session")
- ✅ Track options
- ✅ Was it required?

### Step 2: Create Custom Fields
Go to "Custom Abstract Submission Fields" and create:
1. **Symposium field** (using your noted options)
2. **Track field** (using your noted options)

### Step 3: Test
Submit a test abstract and verify the fields appear correctly.

### Step 4: Done!
Old settings are ignored, new custom fields work seamlessly.

---

## 📊 Data Storage

### Before (Hardcoded):
```json
{
  "custom_data": {
    "abstractTitle": "...",
    "symposium": ["Symposium 1"],  // Special handling
    "track": "Track A"             // Special handling
  }
}
```

### After (Custom Fields):
```json
{
  "custom_data": {
    "abstractTitle": "...",
    "symposium": "Symposium 1",    // Regular custom field
    "track": "Track A"             // Regular custom field
    "any_other_field": "value"     // All treated equally
  }
}
```

**Result**: No special handling, everything is uniform!

---

## ✨ Benefits

### 1. **Flexibility**
- Admin can name fields whatever they want (not limited to "symposium" or "track")
- Can create multiple categorization levels
- Can use different field types (dropdown, checkboxes, radio buttons)

### 2. **Consistency**
- All custom fields behave the same way
- No special cases in code
- Easier to maintain and extend

### 3. **Simplicity**
- Less code to maintain
- No hardcoded logic
- Admin has full control through UI

### 4. **Extensibility**
- Can add more categorization fields easily
- Can use any field type available in the custom fields system
- Can reorder fields, add descriptions, etc.

---

## 🧪 Testing

### Test Scenario 1: Create Symposium Field
1. Go to Conference Settings
2. Navigate to "Custom Abstract Submission Fields"
3. Add a new field:
   - Label: "Symposium"
   - Type: "Select"
   - Options: "Symposium 1", "Symposium 2", "Symposium 3"
   - Required: Yes
4. Save settings
5. Go to abstract submission form
6. Verify "Symposium" field appears
7. Submit an abstract
8. Check admin panel - abstract should have symposium data in `custom_data`

### Test Scenario 2: Multiple Symposium Selection
1. Create field with type "Checkboxes"
2. Add options
3. Submit abstract selecting multiple
4. Verify data is stored as array

### Test Scenario 3: Optional Track Field
1. Create "Track" field (not required)
2. Submit abstract without selecting track
3. Verify submission succeeds
4. Submit abstract with track selected
5. Verify data is stored correctly

---

## 📝 Example Admin Workflow

**Goal**: Configure symposium and track fields for a scientific conference

**Step 1**: Open Conference Settings

**Step 2**: Scroll to "Custom Abstract Submission Fields"

**Step 3**: Add Symposium Field
- Click "+ Add Field"
- Label: `Symposium *`
- Name: `symposium`
- Type: `Select (Dropdown)`
- Required: ✅
- Options:
  ```
  1. Molecular Biology and Genetics
  2. Clinical Medicine
  3. Public Health
  4. Neuroscience and Behavior
  5. Immunology and Microbiology
  ```
- Save

**Step 4**: Add Track Field (Optional)
- Click "+ Add Field"
- Label: `Presentation Track`
- Name: `presentation_track`
- Type: `Radio Buttons`
- Required: ❌
- Options:
  ```
  Basic Research
  Clinical Application
  Policy and Public Health
  ```
- Save

**Step 5**: Reorder Fields (if needed)
- Drag to position symposium field after "Keywords"

**Step 6**: Save Conference Settings

**Step 7**: Test
- Open abstract submission form
- Verify both fields appear
- Submit test abstract
- Check admin panel

**Done!** ✅

---

## 🔧 Technical Notes

### Custom Fields System Supports:
- ✅ Text inputs
- ✅ Textareas (short and long)
- ✅ Select dropdowns
- ✅ Radio buttons
- ✅ Checkboxes (multiple selection)
- ✅ File uploads
- ✅ Date pickers
- ✅ Email/phone inputs
- ✅ Separators (for visual organization)

### Any of these can be used for symposium/track categorization!

---

## 🎯 Summary

**Old Way**: Hardcoded symposium/track fields with special handling everywhere  
**New Way**: Regular custom fields that admin can configure however they want  

**Result**: More flexible, cleaner code, better UX! 🚀

---

## ❓ FAQ

### Q: Can I still call the field "Symposium"?
**A**: Yes! You can name it whatever you want in the label.

### Q: Can I have multiple categorization levels?
**A**: Yes! Create as many custom fields as you need:
- Symposium (level 1)
- Track (level 2)
- Session (level 3)
- Topic (level 4)

### Q: Can users select multiple symposiums?
**A**: Yes! Use "Checkboxes (Multiple)" field type.

### Q: What happens to old data?
**A**: Old symposium/track data in `custom_data` remains intact. New submissions will use the new custom field names.

### Q: Can I make it optional?
**A**: Yes! Just uncheck "Required" when creating the field.

---

**Migration Complete!** 🎉

Symposium and Track are now part of the flexible custom fields system!
