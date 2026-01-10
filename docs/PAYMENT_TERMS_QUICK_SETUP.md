# Quick Setup: Payment & Terms Fields

**Time needed:** 5 minutes ⏱️

This is a **quick visual guide** to add the 4 payment and terms fields to your registration form.

---

## 🎯 What You'll Create

```
┌────────────────────────────────────────┐
│  Payment Method *                      │
│  ○ Bank transfer                       │
│  ○ Credit/debit card                   │
│                                        │
│  Payer *                               │
│  ○ Person                              │
│  ○ Company                             │
│                                        │
│  ☐ I accept Terms of Service and      │
│    Privacy Policy *                    │
│    (with clickable links)              │
│                                        │
│  ☐ I accept Terms of Service and      │
│    Privacy Conference *                │
│    (with clickable links)              │
└────────────────────────────────────────┘
```

---

## 📋 Copy-Paste Values

### Field 1: Payment Method

| Property    | Value                  |
|-------------|------------------------|
| Field Name  | `payment_method`       |
| Field Type  | Radio Buttons          |
| Label       | `Payment Method`       |
| Options     | `Bank transfer`<br>`Credit/debit card` |
| Required    | ✅ Yes                 |

---

### Field 2: Payer Type

| Property    | Value            |
|-------------|------------------|
| Field Name  | `payer_type`     |
| Field Type  | Radio Buttons    |
| Label       | `Payer`          |
| Options     | `Person`<br>`Company` |
| Required    | ✅ Yes           |

---

### Field 3: Terms & Privacy

| Property    | Value                  |
|-------------|------------------------|
| Field Name  | `accept_terms_privacy` |
| Field Type  | Checkbox               |
| Label       | `Agreement`            |
| Checkbox Text | `I accept [Terms of Service](https://yoursite.com/terms) and [Privacy Policy](https://yoursite.com/privacy)` |
| Required    | ✅ Yes                 |

**📝 Note:** Replace `https://yoursite.com/terms` and `https://yoursite.com/privacy` with your actual URLs!

---

### Field 4: Conference Terms

| Property    | Value                  |
|-------------|------------------------|
| Field Name  | `accept_terms_conference` |
| Field Type  | Checkbox               |
| Label       | `Conference Agreement` |
| Checkbox Text | `I accept [Terms of Service](https://yoursite.com/conference-terms) and [Privacy Conference](https://yoursite.com/conference-privacy)` |
| Required    | ✅ Yes                 |

**📝 Note:** Replace URLs with your actual Terms and Privacy pages!

---

## 🚀 Step-by-Step Instructions

### Step 1: Open Form Builder
1. Go to **Admin Dashboard** (http://localhost:3001/admin)
2. Select your conference from dropdown
3. Click **"Registration Form"** in sidebar

### Step 2: Add Payment Method Field
1. Click **"Add Custom Field"** button
2. Fill in:
   - Field Name: `payment_method`
   - Field Type: Select **"Radio Buttons"** from dropdown
   - Label: `Payment Method`
   - Options: Type these (one per line):
     ```
     Bank transfer
     Credit/debit card
     ```
   - ✅ Check **"Required field"**
3. Click **"Save Field"** (green checkmark button)

### Step 3: Add Payer Type Field
1. Click **"Add Custom Field"** button again
2. Fill in:
   - Field Name: `payer_type`
   - Field Type: Select **"Radio Buttons"**
   - Label: `Payer`
   - Options: Type these (one per line):
     ```
     Person
     Company
     ```
   - ✅ Check **"Required field"**
3. Click **"Save Field"**

### Step 4: Add Terms & Privacy Checkbox
1. Click **"Add Custom Field"** button again
2. Fill in:
   - Field Name: `accept_terms_privacy`
   - Field Type: Select **"Checkbox"**
   - Label: `Agreement`
   - **Checkbox Text:** Copy and paste this (replace URLs with yours):
     ```
     I accept [Terms of Service](https://yoursite.com/terms) and [Privacy Policy](https://yoursite.com/privacy)
     ```
   - ✅ Check **"Required field"**
3. Click **"Save Field"**

### Step 5: Add Conference Terms Checkbox
1. Click **"Add Custom Field"** button one more time
2. Fill in:
   - Field Name: `accept_terms_conference`
   - Field Type: Select **"Checkbox"**
   - Label: `Conference Agreement`
   - **Checkbox Text:** Copy and paste this (replace URLs with yours):
     ```
     I accept [Terms of Service](https://yoursite.com/conference-terms) and [Privacy Conference](https://yoursite.com/conference-privacy)
     ```
   - ✅ Check **"Required field"**
3. Click **"Save Field"**

### Step 6: Save All Changes
1. Scroll to top of page
2. Click **"Save Changes"** button (blue button)
3. ✅ **Done!**

---

## 🧪 Test Your Form

1. Open your conference page: `http://localhost:3001/conferences/your-conference-slug`
2. Scroll down to registration form
3. Check that all 4 new fields appear
4. Try submitting **without** filling them → Should show error messages
5. **Click on the links** in checkboxes → Should open in new tab
6. Fill everything correctly and submit → Should succeed! ✅

---

## 💡 Pro Tips

### Tip 1: Update URLs Later
If you don't have Terms/Privacy pages yet, use placeholder URLs for now:
```
https://example.com/terms
https://example.com/privacy
```
You can edit these fields later to update the URLs.

### Tip 2: Reorder Fields
You can **drag and drop** fields in Form Builder to reorder them. Put payment and terms fields at the bottom of your form.

### Tip 3: Field Names Matter
**Don't change Field Names** after creating them! The system uses these to store data. You can safely change:
- Label
- Placeholder/Checkbox Text
- Options
- Description

### Tip 4: Export Data
When you export registrations, these fields will appear with their field names:
- `payment_method` → Shows: "Bank transfer" or "Credit/debit card"
- `payer_type` → Shows: "Person" or "Company"
- `accept_terms_privacy` → Shows: `true` or `false`
- `accept_terms_conference` → Shows: `true` or `false`

---

## 🎨 How Links Work

### What You Type:
```
I accept [Terms of Service](https://example.com/terms) and [Privacy Policy](https://example.com/privacy)
```

### What Users See:
```
☐ I accept Terms of Service and Privacy Policy
           ↑           ↑
      clickable    clickable
```

### Markdown Syntax:
- `[visible text](actual-url)`
- Square brackets = what user sees
- Parentheses = where link goes
- **No spaces** between `]` and `(`

---

## ❓ Common Questions

### Q: Can I have more than 2 radio options?
**A:** Yes! For example, Payment Method could have:
```
Bank transfer
Credit/debit card
PayPal
Cryptocurrency
```

### Q: Can checkboxes have multiple links?
**A:** Yes! Example:
```
I accept [Terms](url1), [Privacy](url2), and [Conference Rules](url3)
```

### Q: What if I don't want links in checkboxes?
**A:** Just type regular text without `[]` and `()`:
```
I accept the Terms of Service
```

### Q: Can I make fields optional?
**A:** Yes, just **uncheck** the "Required field" checkbox. But for terms/agreements, they should always be required!

### Q: Where do I get Terms/Privacy page URLs?
**A:** You need to create these pages on your website first, then use those URLs. If you don't have them yet, use placeholders and update later.

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Links not clickable | Check markdown syntax: `[text](url)` with no spaces |
| Field not saving | Make sure Field Name contains only letters, numbers, underscores |
| Radio buttons not working | Check that options are entered (one per line) |
| Changes not visible | Click "Save Changes" button at top, then refresh conference page |
| Field disappeared | Check you didn't accidentally delete it - there's no undo! |

---

## ✅ Checklist

Before finishing, verify:

- [ ] All 4 fields created
- [ ] All 4 fields marked as Required
- [ ] Links in checkboxes use correct markdown syntax
- [ ] Clicked "Save Changes" button
- [ ] Tested form on conference page
- [ ] Links open in new tab when clicked
- [ ] Form validation works (try submitting empty)
- [ ] Form submission succeeds when all filled

---

## 📚 Related Guides

- **Detailed guide:** `PAYMENT_AND_TERMS_FIELDS_GUIDE.md`
- **All field types:** `REGISTRATION_FORM_FIELDS_GUIDE.md`
- **Multiple participants:** `MULTIPLE_PARTICIPANTS_FEATURE.md`

---

**Need more help?** Check the detailed guide or contact support! 🚀
