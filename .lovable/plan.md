# Kuravilangad Gig Hub — Production Build Plan

A real, publish-ready mobile-first marketplace connecting students in Kuravilangad with local job providers. Backed by Lovable Cloud (Postgres + Auth + RLS), not mock state.

## What "production-ready" means here

- Real authentication (email/password + phone OTP) via Lovable Cloud
- Real database: users, profiles, gigs, applications, connections, messages
- Row-Level Security on every table — users can only see/modify what they should
- Server-side data, not localStorage; everything persists across devices
- Proper loading, empty, and error states; form validation with zod
- Mobile-first responsive UI, accessible, with SEO meta on public routes
- Seeded with the requested Kuravilangad sample data on first run

## Routes

```text
/                         Marketing landing (hero + how it works + CTA)
/auth                     Email/Phone toggle, login + signup
/auth/otp                 6-digit phone OTP entry
/onboarding/role          First-time role pick (Student / Provider)
/onboarding/student       Student profile + skill checklist
/onboarding/provider      Provider profile (name, org, contact)
/app                      Dashboard with Student/Provider view toggle
  /app/feed               Student: live gig feed + filters + search
  /app/profile            Student: edit profile + skills
  /app/post               Provider: post a gig
  /app/my-gigs            Provider: list of posted gigs + suggested students
  /app/chats              Shared inbox (applications + connection requests)
  /app/chats/$threadId    Single conversation
```

Protected routes live under an `_authenticated` layout that redirects to `/auth`.

## Database schema (Lovable Cloud)

```text
profiles              id (=auth.users.id), display_name, phone, avatar_url,
                      location, bio, created_at
user_roles            user_id, role ('student' | 'provider')   -- separate table
                                                                   for security
skills                id, name (seeded master list)
profile_skills        profile_id, skill_id                     -- student skills
gigs                  id, provider_id, title, category, pay_text, duration,
                      location, description, status, created_at
gig_tags              gig_id, skill_id                         -- for matching
applications          id, gig_id, student_id, status, created_at
connections           id, gig_id, provider_id, student_id, status, created_at
threads               id, gig_id, student_id, provider_id, created_at
messages              id, thread_id, sender_id, body, created_at
```

RLS highlights:
- `profiles`: anyone authenticated can read; user can update their own row
- `user_roles`: read own; insert only via secure function during onboarding
- `gigs`: authenticated read; insert/update/delete only by `provider_id = auth.uid()`
- `applications` / `connections`: visible to the gig's provider and the involved student only
- `threads` / `messages`: visible to the two participants only; insert if `sender_id = auth.uid()` and participant of thread
- `has_role()` SECURITY DEFINER function used in policies to avoid recursion

Realtime enabled on `messages`, `applications`, `connections` so chats and dashboards update live.

## Feature flows

**Auth**
- Email + password (auto-confirm enabled for fast onboarding)
- Phone OTP via Supabase phone auth
- After signup → role selection → role-specific onboarding → `/app`
- Logout from app header

**Student view**
- Profile page: display name, location, bio, skills checklist (Tuition, Canva/Graphic Design, Video Editing, Tech Support, Retail Help, Event Management, Excel Data Entry)
- Feed: paginated gig list with category pills (All, Tuition, Design, Tech, Retail, Events) + search by title/location
- Apply Now → inserts `applications` row + creates `thread` + opens chat; button switches to "Applied — Open Chat"

**Provider view**
- Post a Gig form (zod-validated): title, category, pay (text, e.g. "₹300/hr"), duration, location/landmark, description, skill tags
- My Gigs: each posted gig shows a ranked stack of suggested students computed by tag/skill overlap (server query)
- Connect → inserts `connections` row + creates `thread`; button switches to "Request sent — Open Chat"

**Chat**
- Shared inbox combining application + connection threads
- Realtime messages, mobile-first thread UI
- Unread badge in nav

**View toggle**
- Top-of-dashboard toggle lets a user switch between Student and Provider modes if they have both roles. If they only have one, the toggle is hidden. Users can add the second role from settings.

## Seed data (one-time migration)

- Skills master list seeded
- Three sample gigs (10th Grade Physics Tuition / Near Deva Matha Campus / ₹300 per hr; Social Media Poster Design / Remote / ₹1500 fixed; Excel Sheet Inventory Cleanup / Kuravilangad Junction / ₹800 per day) inserted under a system provider account so the feed is never empty
- Three demo student profiles (Amal S., Sandhra Roy, Arjun K.) with the requested skills, so providers see suggestions immediately

## UI & design

- Light, modern, friendly tech aesthetic; ample whitespace; large rounded corners; soft borders
- All colors as semantic tokens in `src/styles.css` (oklch); shadcn components themed via tokens
- Mobile-first layouts with a bottom tab bar on small screens and a sidebar on desktop
- Accessible forms with labels and error messages; toasts via sonner
- SEO `head()` on `/`, `/auth` with unique title + description; single H1 per page

## Technical notes

- Stack: TanStack Start + React + Tailwind v4 + shadcn/ui + Lovable Cloud
- Data fetching via TanStack Query + protected server functions where needed; direct supabase-js queries from the client where RLS already covers access
- Forms: react-hook-form + zod
- Phone auth requires the user to enable a phone provider in Cloud → Users → Auth settings; the plan will include clear instructions if it isn't preconfigured

## Out of scope (can be added later)

- Payments / escrow
- Ratings & reviews
- Push notifications
- Admin moderation panel

Approve this and I'll build it end-to-end, including enabling Lovable Cloud, running the migrations, and seeding the data.
