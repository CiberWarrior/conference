# Registration Form Fields - Complete Guide

This document explains how to create all the fields mentioned in your requirements using the Form Builder.

## ✅ All Supported Field Types

The Form Builder now supports:
- **Text** (Short answer)
- **Textarea** (Long answer)
- **Email**
- **Phone Number** (tel)
- **Number**
- **Date**
- **Dropdown** (Select one from list)
- **Radio Buttons** (Yes/No or multiple choice)
- **Checkbox** (Single agreement)

---

## 📋 How to Create Each Required Field

### 1. **First Name** *
- **Type**: Text
- **Label**: First name
- **Required**: ✅ Yes
- **Placeholder**: Enter your first name

### 2. **Last Name** *
- **Type**: Text
- **Label**: Last name
- **Required**: ✅ Yes
- **Placeholder**: Enter your last name

### 3. **Initial or Middle Name**
- **Type**: Text
- **Label**: Initial or middle name
- **Required**: ❌ No
- **Placeholder**: e.g., J. or John

### 4. **Title**
- **Type**: Dropdown (Select)
- **Label**: Title
- **Required**: ❌ No
- **Options**:
  ```
  Mr
  Mrs
  Ms
  Prof
  Dr
  Prof. Dr.
  ```

### 5. **Gender**
- **Type**: Radio Buttons
- **Label**: Gender
- **Required**: ❌ No
- **Options**:
  ```
  Male
  Female
  Other
  Prefer not to say
  ```

### 6. **Organization** *
- **Type**: Text
- **Label**: Organization
- **Description**: Institute, Hospital, Company
- **Required**: ✅ Yes
- **Placeholder**: University, Company, Organization...

### 7. **Department**
- **Type**: Text
- **Label**: Department
- **Required**: ❌ No
- **Placeholder**: e.g., Department of Biology

### 8. **Address** *
- **Type**: Text
- **Label**: Address
- **Required**: ✅ Yes
- **Placeholder**: Street address

### 9. **City** *
- **Type**: Text
- **Label**: City
- **Required**: ✅ Yes
- **Placeholder**: Enter your city

### 10. **ZIP or Postal Code** *
- **Type**: Text
- **Label**: ZIP or Postal Code
- **Required**: ✅ Yes
- **Placeholder**: e.g., 10000

### 11. **State/Province**
- **Type**: Text
- **Label**: State/Prov
- **Required**: ❌ No
- **Placeholder**: State or Province

### 12. **Country** * (Dropdown)
- **Type**: Dropdown (Select)
- **Label**: Country
- **Required**: ✅ Yes
- **Options**: Add all countries you need, for example:
  ```
  Croatia
  Serbia
  Bosnia and Herzegovina
  Slovenia
  Montenegro
  North Macedonia
  Albania
  United States
  United Kingdom
  Germany
  France
  Italy
  Spain
  (... add more as needed)
  ```

### 13. **Phone Number** * (with country code)
- **Type**: Phone (tel)
- **Label**: Phone Number
- **Description**: Please include country code
- **Required**: ✅ Yes
- **Placeholder**: +385 1 234 5678

### 14. **Gala Dinner Attendance** *
- **Type**: Radio Buttons
- **Label**: Please select if you will attend Gala Dinner
- **Required**: ✅ Yes
- **Options**:
  ```
  Yes
  No
  ```

### 15. **Abstract Submission** *
- **Type**: Radio Buttons
- **Label**: Abstract Submission
- **Required**: ✅ Yes
- **Options**:
  ```
  Yes
  No
  ```

### 16. **Presentation Type** *
- **Type**: Radio Buttons
- **Label**: Select if you intend to have poster/spoken presentation
- **Required**: ✅ Yes
- **Options**:
  ```
  Poster
  Spoken
  No presentation
  ```

### 17. **Accompanying Persons** *
- **Type**: Radio Buttons
- **Label**: Accompanying Persons
- **Required**: ✅ Yes
- **Options**:
  ```
  Yes
  No
  ```

### 18. **Participant Status** *
- **Type**: Dropdown (Select)
- **Label**: Please choose one of the following status
- **Required**: ✅ Yes
- **Options**:
  ```
  Participant
  Invited Speaker
  Student
  ```

---

## 🎯 Quick Setup Steps

1. Go to **Admin Dashboard** → Select your conference
2. Click **Registration Form** in sidebar
3. For each field above:
   - Click **"Add Custom Field"**
   - Fill in: **Field Name**, **Type**, **Label**, **Options** (if needed)
   - Check **"Required field"** if mandatory
   - Click **"Save"**
4. Click **"Save Changes"** at the top
5. Test on `/conferences/your-slug`

---

## 💡 Pro Tips

### For Yes/No Questions:
- Use **Radio Buttons** (not checkbox)
- Options: `Yes` and `No` (one per line)

### For Dropdowns:
- Enter each option on a new line
- First line = First option

### For Country Lists:
- You can create a comprehensive list or just key countries
- Users will see them in the dropdown

### Field Names (Internal):
- Use lowercase with underscores
- Examples: `first_name`, `gala_dinner`, `phone_number`
- System automatically creates unique IDs

---

## 📸 Example Field Configuration

**Creating "Gala Dinner" field:**

```
Field Name (Internal): gala_dinner
Field Type: Radio Buttons
Label: Please select if you will attend Gala Dinner
Description: (leave empty or add note)
Options:
  Yes
  No
Required: ✅ Checked
```

**Creating "Country" field:**

```
Field Name (Internal): country
Field Type: Dropdown (Select one)
Label: Country
Description: Select your country
Options:
  Croatia
  Serbia
  Bosnia and Herzegovina
  Slovenia
  ... (add all countries)
Required: ✅ Checked
```

---

## ✅ All Fields Are Now Supported!

Your form builder can handle:
- ✅ Short text fields (First Name, Last Name, etc.)
- ✅ Long text fields (Address, Comments)
- ✅ Email validation
- ✅ Phone numbers
- ✅ Date pickers
- ✅ Dropdowns (Title, Country, Status)
- ✅ Radio buttons (Yes/No questions, Gender)
- ✅ Checkboxes (Agreements)
- ✅ Numbers

**Everything you listed is possible!** 🎉
