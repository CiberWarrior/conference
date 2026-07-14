# Payment & Terms Fields Guide

This guide shows you how to create **terms/agreement** and **payer type** fields in the Form Builder.

> **Important:** **Payment method** (Pay Now – Card, Pay Now – Bank Transfer, Pay Later) is **not** a custom field. It is configured in **Conference Settings → Payment** (system-level). See `docs/PAYMENT_OPTIONS_GUIDE.md` and `docs/PAYMENT_SETTINGS_IMPLEMENTATION.md`. Do **not** add a "Payment Method" custom field for that.

---

## 🎯 Fields to Create (Form Builder)

You can create these **custom fields** in the Form Builder when needed:

1. **Payer Type** (Radio buttons) – Person / Company
2. **Terms & Privacy Policy Agreement** (Checkbox with links)
3. **Conference Terms Agreement** (Checkbox with links)

*(Previously this guide listed "Payment Method" as a custom field; that is deprecated – use Conference Payment Settings instead.)*

---

## 📝 Field 1: Payer Type (optional)

### Settings:
```
Field Name:      payer_type
Field Type:      Radio Buttons
Label:           Payer
Placeholder:     (leave empty)
Description:     (optional)
Options:         Person
                 Company
Required:        ✅ Yes
```

### How it looks:
```
Payer *
○ Person
○ Company
```

---

## 📝 Field 2: Terms of Service & Privacy Policy

### Settings:
```
Field Name:      accept_terms_privacy
Field Type:      Checkbox
Label:           Agreement
Placeholder:     I accept [Terms of Service](https://yoursite.com/terms) and [Privacy Policy](https://yoursite.com/privacy)
Description:     (optional)
Required:        ✅ Yes
```

### Important Notes:
- **Placeholder field** is where the checkbox text goes
- Use markdown syntax for links: `[Link Text](https://url.com)`
- Links will automatically become clickable and open in new tab
- The system converts `[text](url)` to clickable HTML links

### How it looks:
```
☐ I accept Terms of Service and Privacy Policy *
           ↑ these become clickable blue underlined links
```

---

## 📝 Field 3: Conference Terms Agreement

### Settings:
```
Field Name:      accept_terms_conference
Field Type:      Checkbox
Label:           Conference Agreement
Placeholder:     I accept [Terms of Service](https://yoursite.com/conference-terms) and [Privacy Conference](https://yoursite.com/conference-privacy)
Description:     (optional)
Required:        ✅ Yes
```

### How it looks:
```
☐ I accept Terms of Service and Privacy Conference *
           ↑ clickable links
```

---

## 🎨 Complete Form Preview

Here's how the entire bottom section of your registration form will look:

```
┌────────────────────────────────────────────┐
│  ... [all other registration fields]       │
│                                            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                            │
│  Payment Method *                          │
│  ○ Bank transfer                           │
│  ○ Credit/debit card                       │
│                                            │
│  Payer *                                   │
│  ○ Person                                  │
│  ○ Company                                 │
│                                            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                            │
│  ☐ I accept Terms of Service and          │
│    Privacy Policy *                        │
│                                            │
│  ☐ I accept Terms of Service and          │
│    Privacy Conference *                    │
│                                            │
│  [Submit Registration]                     │
└────────────────────────────────────────────┘
```

---

## ✅ Validation

All 4 fields are **required**, which means:

- ❌ User cannot submit without selecting a payment method
- ❌ User cannot submit without selecting payer type
- ❌ User must check BOTH agreement boxes
- ✅ Form validation runs before submission

---

## 💾 How Data is Stored

When a user submits the form, all data is saved in `registrations.custom_data`:

```json
{
  "custom_data": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "payment_method": "Credit/debit card",
    "payer_type": "Person",
    "accept_terms_privacy": true,
    "accept_terms_conference": true
  }
}
```

---

## 🔗 Link Syntax Examples

### Single Link:
```
I accept [Terms of Service](https://example.com/terms)
```

### Multiple Links:
```
I accept [Terms](https://example.com/terms) and [Privacy Policy](https://example.com/privacy)
```

### Complex Example:
```
I have read and accept the [Terms of Service](https://example.com/terms), [Privacy Policy](https://example.com/privacy), and [Conference Rules](https://example.com/conference-rules)
```

**Important:** 
- Use square brackets `[]` for link text
- Use parentheses `()` for the URL
- No spaces between `]` and `(`
- All links open in a **new tab** automatically

---

## 📊 Exporting Data

When you export registrations to Excel/CSV, these fields will appear as:

| payment_method    | payer_type | accept_terms_privacy | accept_terms_conference |
|-------------------|------------|----------------------|-------------------------|
| Credit/debit card | Person     | true                 | true                    |
| Bank transfer     | Company    | true                 | true                    |

---

## 🎯 Quick Start Steps

1. **Open Form Builder**
   - Go to Admin Dashboard
   - Select your conference
   - Click "Registration Form"

2. **Add Field 1 - Payment Method**
   - Click "Add Custom Field"
   - Set Field Type: `Radio Buttons`
   - Set Label: `Payment Method`
   - Set Field Name: `payment_method`
   - Add Options: `Bank transfer` and `Credit/debit card`
   - Check "Required"
   - Click "Save Field"

3. **Add Field 2 - Payer Type**
   - Click "Add Custom Field"
   - Set Field Type: `Radio Buttons`
   - Set Label: `Payer`
   - Set Field Name: `payer_type`
   - Add Options: `Person` and `Company`
   - Check "Required"
   - Click "Save Field"

4. **Add Field 3 - Terms & Privacy**
   - Click "Add Custom Field"
   - Set Field Type: `Checkbox`
   - Set Label: `Agreement`
   - Set Field Name: `accept_terms_privacy`
   - Set Placeholder: `I accept [Terms of Service](https://yoursite.com/terms) and [Privacy Policy](https://yoursite.com/privacy)`
   - Check "Required"
   - Click "Save Field"

5. **Add Field 4 - Conference Terms**
   - Click "Add Custom Field"
   - Set Field Type: `Checkbox`
   - Set Label: `Conference Agreement`
   - Set Field Name: `accept_terms_conference`
   - Set Placeholder: `I accept [Terms of Service](https://yoursite.com/conference-terms) and [Privacy Conference](https://yoursite.com/conference-privacy)`
   - Check "Required"
   - Click "Save Field"

6. **Save Changes**
   - Click "Save Changes" at the top
   - ✅ Done!

---

## 🧪 Testing

After creating the fields:

1. Go to your conference page: `http://localhost:3000/conferences/your-slug` (port može biti i 3001)
2. Scroll to the registration form
3. Verify all 4 fields appear
4. Try to submit without filling them → should show validation errors
5. Click on the links in checkboxes → should open in new tab
6. Fill everything and submit → should succeed

---

## 🆘 Troubleshooting

### Links not clickable?
- Make sure you're using the exact markdown syntax: `[text](url)`
- Check there are no spaces between `]` and `(`
- Restart the dev server if needed

### Field not showing as required?
- Make sure "Required" checkbox is checked in Field Editor
- Save the field and then click "Save Changes" at the top

### Radio buttons showing as text?
- Make sure Field Type is set to "Radio Buttons"
- Check that Options are entered (one per line)

### Changes not appearing?
- Click "Save Changes" at the top of Form Builder
- Refresh the conference page
- Clear browser cache if needed

---

## 📞 Need Help?

If you have any questions or issues:
1. Check this guide first
2. Check the main registration fields guide: `REGISTRATION_FORM_FIELDS_GUIDE.md`
3. Check browser console for errors (F12)
4. Contact support with screenshots

---

**Last Updated:** January 2026
**Version:** 1.0
