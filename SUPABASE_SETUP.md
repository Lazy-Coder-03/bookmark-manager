# Supabase Setup Guide

A complete step-by-step guide to set up your Bookmark Manager backend on Supabase.

---

## Table of Contents

1. [Create Supabase Account](#step-1-create-supabase-account)
2. [Create New Project](#step-2-create-new-project)
3. [Run the Setup SQL](#step-3-run-the-setup-sql) **(One-Click Setup!)**
4. [Configure Email Authentication](#step-4-configure-email-authentication)
5. [Get Your API Keys](#step-5-get-your-api-keys)
6. [Deploy Edge Functions](#step-6-deploy-edge-functions)
7. [Update Frontend Config](#step-7-update-frontend-config)
8. [Test Your App](#step-8-test-your-app)

---

## Step 1: Create Supabase Account

1. Go to **https://supabase.com**
2. Click **"Start your project"** (green button)
3. Sign up using:
   - GitHub account (recommended), OR
   - Email and password
4. Verify your email if required

---

## Step 2: Create New Project

1. Once logged in, click **"New Project"**
2. Select your organization (or create one)
3. Fill in the details:

| Field | What to enter |
|-------|---------------|
| **Name** | `bookmark-manager` (or any name you like) |
| **Database Password** | Create a strong password and **SAVE IT** somewhere safe |
| **Region** | Choose the closest to your location |

4. Click **"Create new project"**
5. Wait 2-3 minutes for setup to complete

---

## Step 3: Run the Setup SQL

This single script creates everything: table, indexes, security policies.

1. In the left sidebar, click **"SQL Editor"**
2. Click **"New query"**
3. **Copy and paste this entire script:**

```sql
-- ================================================
-- BOOKMARK MANAGER - COMPLETE DATABASE SETUP
-- ================================================
-- This script is safe to run multiple times
-- ================================================

-- 1. Create the bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID DEFAULT auth.uid() NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Create index for faster queries
CREATE INDEX IF NOT EXISTS bookmarks_user_id_idx ON bookmarks(user_id);

-- 3. Enable Row Level Security
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if they exist (safe to re-run)
DROP POLICY IF EXISTS "Users can view own bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can add own bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can update own bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can delete own bookmarks" ON bookmarks;

-- 5. Create security policies

-- Users can only VIEW their own bookmarks
CREATE POLICY "Users can view own bookmarks"
ON bookmarks FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can only INSERT their own bookmarks
CREATE POLICY "Users can add own bookmarks"
ON bookmarks FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can only UPDATE their own bookmarks
CREATE POLICY "Users can update own bookmarks"
ON bookmarks FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can only DELETE their own bookmarks
CREATE POLICY "Users can delete own bookmarks"
ON bookmarks FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ================================================
-- DONE! Table + Security is ready.
-- ================================================
```

4. Click **"Run"** (or press Ctrl+Enter)
5. You should see **"Success. No rows returned"**

That's it! Your database is now set up with full security.

---

## Step 4: Configure Email Authentication

1. In the left sidebar, click **"Authentication"**
2. Click **"Providers"** tab
3. Find **"Email"** in the list
4. Make sure it's **enabled** (toggle should be ON)
5. Configure these settings:

| Setting | Recommended Value | Why |
|---------|-------------------|-----|
| Enable Email Signup | ON | Allow new users to register |
| Double Confirm Email Changes | OFF | Simpler for testing |
| Enable Email Confirmations | OFF (for testing) | Skip email verification during development |

> **Note:** For production, you should enable email confirmations. But for testing, it's easier to turn it off.

6. Click **"Save"**

---

## Step 5: Get Your API Keys

1. In the left sidebar, click **"Project Settings"** (gear icon at bottom)
2. Click **"API"** in the settings menu
3. You'll see several values. Copy these:

### Project URL
```
https://xxxxxxxxxxxx.supabase.co
```
This is your `SUPABASE_URL`

### API Keys

| Key | Where to use | Safe to expose? |
|-----|--------------|-----------------|
| `anon` `public` | Frontend (config.js) | Yes |
| `service_role` `secret` | Edge Functions only | **NO - Keep secret!** |

4. Save these somewhere safe (like your `.env` file)

---

## Step 6: Deploy Edge Functions

### Prerequisites

You need to install some tools first. Open **Command Prompt** or **PowerShell**:

#### Install Node.js (if not installed)
1. Go to https://nodejs.org
2. Download and install the **LTS** version
3. Restart your computer

#### Install Supabase CLI
```bash
npm install -g supabase
```

#### Login to Supabase
```bash
supabase login
```
This opens a browser - click **"Authorize"**

### Deploy the Functions

1. Open Command Prompt
2. Navigate to your project:
```bash
cd C:\Users\dj\Desktop\Sayantan_projects\Book_Mark_Manager
```

3. Link to your Supabase project:
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

> **Finding your Project Ref:**
> Go to Supabase Dashboard > Project Settings > General
> Look for "Reference ID" (looks like: `abcdefghijklmnop`)

4. Deploy each function:
```bash
supabase functions deploy signup
supabase functions deploy login
supabase functions deploy save-bookmark
supabase functions deploy get-bookmarks
supabase functions deploy fetch-title
```

5. Verify deployment:
   - Go to Supabase Dashboard
   - Click **"Edge Functions"** in sidebar
   - You should see all 5 functions listed

---

## Step 7: Update Frontend Config

1. Open the file: `frontend/js/config.js`
2. Replace the placeholder values:

```javascript
const CONFIG = {
    SUPABASE_URL: 'https://your-project-id.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
};
```

3. Save the file

---

## Step 8: Test Your App

1. Open `frontend/index.html` in your browser
2. Click **"Sign Up"**
3. Enter an email and password (min 6 characters)
4. Click **"Sign Up"**
5. You should be logged in automatically
6. Try adding a bookmark:
   - Paste a URL
   - Click "Fetch Title"
   - Add optional notes
   - Click "Save Bookmark"
7. Your bookmark should appear in the list
8. Try logging out and back in - your bookmarks should persist

---

## Troubleshooting

### "Invalid API key"
- Double-check your `SUPABASE_URL` and `SUPABASE_ANON_KEY` in config.js
- Make sure there are no extra spaces

### "User not found" or "Invalid credentials"
- Make sure email confirmations are disabled (for testing)
- Try signing up again with a new email

### "Permission denied" or "RLS policy violation"
- Check that all 4 RLS policies are created
- Make sure RLS is enabled on the bookmarks table

### Edge Functions not working
- Check that functions are deployed: Supabase Dashboard > Edge Functions
- Check function logs for errors: Click on function > "Logs" tab

### "Failed to fetch title"
- Some websites block automated requests
- Try with a different URL (like https://github.com)

---

## Security Checklist

Before going live, ensure:

- [ ] RLS is enabled on bookmarks table
- [ ] All 4 RLS policies are created
- [ ] `service_role` key is NOT in frontend code
- [ ] `.env` file is in `.gitignore`
- [ ] Email confirmations enabled (for production)

---

## Quick Reference

| What | Where to find |
|------|---------------|
| Project URL | Settings > API > Project URL |
| Anon Key | Settings > API > anon public |
| Service Role Key | Settings > API > service_role (keep secret!) |
| Project Ref | Settings > General > Reference ID |
| Table Editor | Left sidebar > Table Editor |
| SQL Editor | Left sidebar > SQL Editor |
| Edge Functions | Left sidebar > Edge Functions |
| Auth Settings | Left sidebar > Authentication > Providers |

---

## Done!

Your Supabase backend is now fully configured. Your app has:

- User authentication (email/password)
- Secure database with RLS
- Edge Functions for all operations
- Protection against data leaks between users

If you have questions, check the [Supabase Documentation](https://supabase.com/docs).
