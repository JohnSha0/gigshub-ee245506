# Kuravilangad Gig Hub — Build Plan

A mobile-first, premium-looking marketplace connecting local students with job providers in Kuravilangad. Built as a self-contained demo: auth, role selection, and a two-way dashboard with simulated OTP, chat, and matching — all state lives in the browser.

## Scope

- Welcome + auth (email and phone/OTP, both simulated)
- Role selection after sign-up (Student / Provider)
- A single dashboard with a top toggle to switch between Student View and Provider View for demo purposes
- Student View: profile + skill checklist, gig feed, category pills, search, Apply flow
- Provider View: post-a-gig form, AI-style suggested students based on matching tags, Connect flow
- Mock data seeded on first load; new gigs and profiles persist in local state and appear immediately in feeds

## Pages / Routes

```text
/                 Welcome screen (logo, tagline, "Get Started")
/auth             Email/Phone toggle, login/signup
/auth/otp         6-digit OTP screen (simulated, any 6 digits works)
/onboarding/role  Student vs Provider choice (first-time only)
/app              Dashboard shell with Student/Provider toggle
                    - Student tab: Profile, Gig Feed
                    - Provider tab: Post Gig, Suggested Students
```

Unauthenticated users hitting `/app` are redirected to `/`.

## Design direction

Clean, premium, friendly light-mode tech aesthetic:
- Generous whitespace, large rounded corners (rounded-2xl), soft borders, subtle shadows
- A single warm accent color paired with neutral surfaces (defined as semantic tokens in `src/styles.css`)
- Mobile-first layouts; dashboard becomes a two-column comfortable view on desktop
- Pill-style category filters, card-based feed, sticky bottom action buttons on mobile

## Mock data (seeded)

Gigs:
- 10th Grade Physics Tuition — Near Deva Matha Campus — ₹300/hr — Tuition
- Social Media Poster Design — Remote — ₹1500 fixed — Design
- Excel Sheet Inventory Cleanup — Kuravilangad Junction — ₹800/day — Tech

Students:
- Amal S. — Tuition, Physics
- Sandhra Roy — Design, Video Editing
- Arjun K. — Excel, Tech

## State & persistence

- Zustand store (or React context + reducer) holding: `user`, `role`, `gigs`, `students`, `applications`, `connections`
- Persisted to `localStorage` so the demo survives reloads
- Seeding runs once on first load if store is empty
- "Apply Now" → "Applied & Chat Opened" (per-gig, per-user)
- "Connect" → "Request Sent! Open Chat" (per-student, per-gig)
- Clicking the chat CTA opens a simple simulated chat sheet (single canned thread)

## Technical notes

- Stack: TanStack Start + React + Tailwind v4 + shadcn/ui (already in template)
- Auth is fully simulated client-side — no backend, no Lovable Cloud needed for this build
- Routes use file-based routing under `src/routes/`; protected routes guarded by a small `_authenticated` layout that reads the auth flag from the store
- Skill matching = case-insensitive intersection between gig tags and student skills, sorted by overlap count
- Form validation with `zod` + react-hook-form for the post-gig and profile forms
- All colors via semantic tokens in `src/styles.css` (no raw hex in components)

## Out of scope (demo build)

- Real SMS/email delivery, real chat backend, payments, ratings — all simulated to match the brief
