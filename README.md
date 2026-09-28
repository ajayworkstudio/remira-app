# Remira

**Remember What Matters.**

Remira is a calm, iPhone-first productivity app for medical students — reminders, notes, a study calendar and notifications in one place. It is a **Progressive Web App**: it runs in any browser, installs to the iPhone Home Screen from Safari, and needs no Xcode or Mac to develop.

> Remira is a productivity tool. It does not provide diagnosis, treatment recommendations or patient records.

---

## 1. What's inside

| Area | Highlights |
| --- | --- |
| **Home** | Time-aware greeting, today's progress ring, Tasks / Done / Pending, today's schedule, upcoming, quick actions |
| **Reminders** | Create, edit, complete / reopen, duplicate, delete · categories · Low/Medium/High priority · repeat (daily, weekly, monthly, custom weekdays + interval) · notification lead time · search · status & category filters · Overdue / Today / Tomorrow / Upcoming / Completed groups |
| **Notes** | Create, edit, delete · category · tags · live search across title, content and `#tags` · markdown-style preview (`#`, `-`, `**bold**`, `*italic*`, `` `code` ``) rendered safely without HTML injection |
| **Calendar** | Month, Week and Agenda views · repeating reminders expanded · Remira vs Apple Calendar events visually distinct · "Add to Apple Calendar" via standards-compliant `.ics` |
| **Notifications** | In-app alerts while open + Web Push (VAPID) delivered by a server-side scheduled job |
| **Profile & Settings** | Avatar upload, name, System/Light/Dark theme, default notification time, `.ics` preferences, category management, logout |
| **PWA** | Manifest, icons, service worker, offline page, iOS safe areas, standalone mode |

**Demo mode:** if Supabase keys are missing, Remira runs with sample data stored only in that browser, clearly labelled. Handy for a first look — add keys to switch to real accounts.

## 2. Tech stack

Next.js 16 (App Router, TypeScript) · React 19 · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage, RLS) · Zod · lucide-react · web-push · next-themes · sonner · Vercel

> Next.js 16 renamed `middleware.ts` to **`proxy.ts`**, and `params` / `cookies()` are async. This project already follows both.

## 3. Installation

Requires **Node.js 20.9+** (22 LTS recommended). Works on Windows (PowerShell), macOS and Linux.

```bash
npm install
cp .env.example .env.local      # Windows PowerShell: Copy-Item .env.example .env.local
npm run dev                     # http://localhost:3000
```

With an empty `.env.local` you'll land in demo mode.

## 4. Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Anon **or** publishable key (RLS protects data) |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | Push dispatcher (bypasses RLS) |
| `VAPID_PUBLIC_KEY` | server (served to browser via `/api/push/public-key`) | Web Push identity |
| `VAPID_PRIVATE_KEY` | **server only** | Signs pushes |
| `VAPID_SUBJECT` | server | `mailto:you@example.com` |
| `CRON_SECRET` | **server only** | Bearer token the scheduler sends to the dispatcher |

Generate VAPID keys once: `npx web-push generate-vapid-keys`. Generate a cron secret: `openssl rand -hex 32` (or any long random string). **Never commit `.env.local`** — it's git-ignored.

## 5. Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. **Project Settings → API**: copy the URL and anon/publishable key into `.env.local`; copy the service-role/secret key into `SUPABASE_SERVICE_ROLE_KEY`.
3. **Authentication → URL Configuration**
   - Site URL: `http://localhost:3000` (later your Vercel URL)
   - Redirect URLs: `http://localhost:3000/auth/callback`, `https://YOUR-APP.vercel.app/auth/callback`
4. Optional: **Authentication → Providers → Email** — turn off "Confirm email" for faster local testing.

## 6. Database migrations

Everything lives in `supabase/migrations/20260929000000_initial_schema.sql`:

- Tables: `profiles`, `categories`, `reminders`, `notes`, `calendar_events`, `push_subscriptions`
- **Row Level Security on every table**; users can only read/write their own rows
- `user_id` defaults to `auth.uid()` — the client never sends a user id
- Composite foreign keys so a reminder/note can't reference another user's category
- Triggers: `updated_at`; reminders compute `notify_at` (UTC) from local date/time + timezone and re-arm notifications when rescheduled or reopened; new users get a profile + 13 default categories
- `avatars` storage bucket (owner-only writes)
- `claim_due_reminder_notifications()` — atomic, service-role-only claim used by the dispatcher (no double sends)

**Apply it** — either:

- **SQL editor:** paste the migration file and run it, **or**
- **Supabase CLI:** `npx supabase link --project-ref <ref>` then `npx supabase db push`

**Seed data (dev only):** register an account, edit the email at the top of `supabase/seed.sql`, run it in the SQL editor. It only writes rows for that one user.

**Tests:** `supabase/tests/rls-test.sql` checks RLS isolation, spoofing, cross-user category references, triggers and the dispatcher against plain PostgreSQL (with `supabase/tests/local-stub.sql` standing in for Supabase's `auth`/`storage` schemas). Never run the stub on Supabase.

## 7. Local development

```bash
npm run dev        # dev server
npm run lint       # ESLint (flat config)
npm run typecheck  # tsc --noEmit
npm run build      # production build
npm run icons      # regenerate PNG icons from public/icons/*.svg
```

Test at iPhone size in Chrome/Edge DevTools → device toolbar → **390 × 844**.

**Test on your phone before deploying:** run `npm run dev -- -H 0.0.0.0`, then open `http://<your-PC-LAN-IP>:3000` on the phone (same Wi-Fi). Note that push notifications and PWA install need **HTTPS**, so do those tests on the Vercel deployment.

## 8. PWA testing

- Chrome DevTools → **Application**: check *Manifest* (installable, icons) and *Service Workers* (activated).
- *Network → Offline* then reload → you'll see the offline page; app pages you've already visited open from cache and show an offline banner.
- The service worker caches only static assets, icons and data-free page shells. It never caches Supabase responses or API routes.

## 9. iPhone installation

1. Open your Vercel URL in **Safari**.
2. Tap **Share** → **Add to Home Screen** → **Add**.
3. Open Remira from the Home Screen (it runs full-screen, respecting the notch and Home Indicator).
4. Settings → **Enable Notifications** (iOS only allows web push for Home Screen apps, iOS 16.4+).

## 10. Vercel deployment

1. Push the project to GitHub, then **Import** it in Vercel (framework auto-detected).
2. Add all environment variables from section 4 (Production + Preview).
3. Deploy, then add `https://YOUR-APP.vercel.app/auth/callback` to Supabase redirect URLs and set the Site URL.

## 11. Notification configuration

A browser can't wake itself at a future time when the app is closed, so Remira doesn't rely on `setTimeout`. Instead:

```
reminders.notify_at (UTC, computed by trigger)
        │   every minute
scheduler ──► POST /api/notifications/dispatch  (Authorization: Bearer CRON_SECRET)
                 1. claim_due_reminder_notifications()  → marks sent atomically
                 2. load push_subscriptions for those users
                 3. send Web Push (VAPID)
                 4. prune expired subscriptions (404/410)
        ▼
service worker → push → notification → tap opens the reminder
```

**Pick one scheduler** (Vercel Hobby only allows daily crons, so every-minute needs another option):

- **Supabase pg_cron (recommended, free):** enable `pg_cron` and `pg_net` extensions, edit the URL and secret in `supabase/cron.sql`, run it.
- **cron-job.org / any uptime pinger:** POST every minute to the dispatch URL with the `Authorization: Bearer …` header.
- **Vercel Pro:** add a cron in `vercel.json` and set `CRON_SECRET` (Vercel sends it automatically).

While the app is open, Remira also shows in-app alerts for reminders as they come due.

Repeating reminders: completing one rolls it forward to its next occurrence and re-arms its notification. If a repeating reminder is left unfinished, it stays overdue (like iOS Reminders) rather than silently advancing.

## 12. Calendar / ICS

`lib/calendar/ics.ts` produces RFC 5545 files: `UID`, `DTSTAMP`, `DTSTART`, `DTEND`, `SUMMARY`, `DESCRIPTION`, `LOCATION`, `URL`, `RRULE`, `VALARM`, with correct escaping and 75-octet line folding.

- Times are converted from each reminder's own timezone to **UTC** (DST-aware).
- Weekly repeat days are shifted when the UTC date differs from the local date (e.g. 06:00 Monday in Jakarta is 23:00 Sunday UTC → `BYDAY=SU`), so events land on the right day.
- **iPhone:** "Add to Apple Calendar" opens `/api/calendar/reminders/:id`, served as `text/calendar`, so Safari shows the native *Add to Calendar* sheet. **Desktop/demo:** the `.ics` downloads directly.
- Settings → Calendar: export all upcoming reminders, choose event length, include/exclude the alert.

Reading events *from* Apple Calendar isn't possible from a web app. The `calendar_events` table and the violet "Apple Calendar" styling are ready for a future native wrapper or `.ics` import.

## 13. Security notes

- RLS on every table; policies compare against `auth.uid()`.
- User identity is always derived from the verified session (`getClaims()`), never from request bodies.
- Service-role key, VAPID private key and cron secret are server-only (`lib/env.server.ts` imports `server-only`).
- All input validated with Zod on the client and constrained again in Postgres (`CHECK` lengths/enums).
- User text is rendered as React text (auto-escaped); the note preview builds elements, never `innerHTML`.
- Auth redirects only allow same-site paths (no open redirects). Security headers: `X-Frame-Options: DENY`, `nosniff`, strict referrer.
- Error messages shown to users are human-readable — no SQL or stack traces.

## 14. Future native iOS roadmap

```
Next.js PWA ──┐
              ├──► Supabase (same tables, RLS, auth)
SwiftUI app ──┘
```

The repository layer (`lib/data/repository.ts`) and `CalendarService` are the seams for native features: EventKit (read/write Apple Calendar), native notifications, Siri & Shortcuts, Home/Lock Screen widgets, Apple Watch, Focus filters.

## Project structure

```
app/
  (auth)/            login · register · forgot-password
  (app)/             home · reminders · notes · calendar · profile · settings
  api/               push/* · notifications/dispatch · calendar/*
  auth/callback/     email confirmation & password-reset exchange
  reset-password/  offline/  manifest.ts  layout.tsx  globals.css (design tokens)
components/          brand · layout · home · reminders · notes · calendar · categories · profile · notifications · ui
hooks/               use-reminders · use-notes · use-categories · use-notifications · use-profile · …
lib/
  supabase/          client · server · admin · proxy
  data/              repository interface + Supabase and demo implementations
  calendar/          ics (pure) · calendar-service (client) · server · agenda
  notifications/     notification-service (client) · push-server
  reminders/         recurrence · selectors
  validations/  utils/  categories/
public/              sw.js · icons/
supabase/            migrations/ · seed.sql · cron.sql · tests/
proxy.ts             session refresh + route protection
```
