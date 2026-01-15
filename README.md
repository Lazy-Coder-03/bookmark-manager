# Bookmark Manager

A simple, clean bookmark manager with user authentication. Save your favorite URLs with titles and notes, accessible from anywhere.

## Features

- **User Authentication** - Email/password login and signup
- **Save Bookmarks** - URL, title (auto-fetched), and optional notes
- **Search** - Filter bookmarks by title, URL, or notes
- **Pagination** - 5 bookmarks per page
- **Edit & Delete** - Manage your bookmarks easily
- **Favicons** - Visual icons for each bookmarked site
- **Dark/Light Mode** - Theme toggle
- **Secure** - Row Level Security ensures users only see their own bookmarks

## Tech Stack

**Frontend:**
- HTML, CSS, JavaScript (Vanilla)
- [Tailwind CSS](https://tailwindcss.com/) + [DaisyUI](https://daisyui.com/)
- [Lucide Icons](https://lucide.dev/)

**Backend:**
- [Supabase](https://supabase.com/) (PostgreSQL + Auth + REST API)
- Supabase Edge Functions (Deno/TypeScript)

## Live Demo

Deployed on Vercel: [Your URL here]

## Setup Guide

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com/) and create a new project
2. Go to **SQL Editor** and run this query:

```sql
-- Create bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID DEFAULT auth.uid() NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS bookmarks_user_id_idx ON bookmarks(user_id);

-- Enable Row Level Security
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only access their own bookmarks)
CREATE POLICY "Users can view own bookmarks" ON bookmarks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks" ON bookmarks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookmarks" ON bookmarks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks" ON bookmarks
    FOR DELETE USING (auth.uid() = user_id);
```

### 2. Configure Authentication

1. Go to **Authentication** → **Providers** → Enable **Email**
2. Go to **Authentication** → **URL Configuration**
   - Set **Site URL** to your deployed URL
   - Add your URL to **Redirect URLs**

### 3. Deploy Edge Functions (Optional)

Edge functions are used for login, signup, and auto-fetching page titles.

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy functions
supabase functions deploy signup
supabase functions deploy login
supabase functions deploy fetch-title
```

### 4. Configure Frontend

Edit `frontend/js/config.js` with your Supabase credentials:

```javascript
const CONFIG = {
    SUPABASE_URL: 'https://your-project.supabase.co',
    SUPABASE_ANON_KEY: 'your-anon-key-here'
};
```

Find these in: **Supabase Dashboard** → **Settings** → **API**

### 5. Deploy to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com/) and import your repo
3. Set **Root Directory** to `frontend`
4. Deploy

### 6. Update Supabase URLs

After deployment, update Supabase:
- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: `https://your-app.vercel.app`

## Local Development

```bash
cd frontend
node server.js
```

Open http://localhost:3000

## Project Structure

```
bookmark-manager/
├── frontend/
│   ├── index.html          # Main HTML
│   ├── css/
│   │   └── style.css       # Custom styles
│   └── js/
│       ├── config.js       # Supabase credentials
│       └── app.js          # Main application logic
├── supabase/
│   └── functions/          # Edge Functions
│       ├── signup/
│       ├── login/
│       └── fetch-title/
├── SUPABASE_SETUP.md       # Detailed setup guide
└── README.md
```

## License

MIT License - feel free to use this for your own projects!
