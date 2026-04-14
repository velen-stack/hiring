# Engram Hiring

Internal recruitment tracker. Captures candidate pipeline state so the team stops losing context in Slack.

## What's in v1 (Phase 1)

- Google OAuth sign-in, restricted to `@engram-lab.com` (configurable via `ALLOWED_EMAIL_DOMAINS`)
- Kanban pipeline board across 8 stages (top of funnel → accepted/rejected) with filters by department & position
- Candidate profile: name, position, interviewers, resume (uploaded to Google Drive via the uploader's OAuth, shared as "anyone with link" so the team can view), website, GitHub, comments, 5-facet ratings (technical, executive presence, seniority, problem solving, cultural fit)
- Follow-up pool with target dates and overdue highlighting
- Positions CRUD + team/settings view
- Dormant Phase 2 tables (`SlackMessage`, `Flag`) already in the schema so the Slack integration can ship without a migration

## Phase 2 (next session)

- Poll `#hiring` → store + match messages to candidates
- Reconcile inbox for unmatched / stage-changing Slack messages
- Daily digest DM + real-time alerts on urgent keywords (`offer`, `reject`, `onsite`, …)

## Prerequisites

- Node 20+
- Postgres 14+ (local, Railway, Neon, Supabase — anything you like)
- Google Cloud OAuth credentials

Resumes are uploaded to Google Drive using the signed-in user's OAuth token (the app requests the `drive.file` scope). A shared folder called "Engram Hiring -- Resumes" is automatically created. Files are set to "anyone with the link can view" so all team members can open them.

## Setup

```bash
# 1. install deps
npm install

# 2. create your env file
cp .env.example .env
# fill in DATABASE_URL, AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET

# 3. generate Prisma client + migrate the DB
npx prisma migrate dev --name init
npm run db:seed   # seeds example positions

# 4. run the dev server
npm run dev
# open http://localhost:3000
```

### Generating `AUTH_SECRET`

```bash
openssl rand -base64 32
```

### Google OAuth + Drive API

1. Google Cloud Console → APIs & Services → Credentials → Create OAuth Client ID → Web Application
2. Authorized redirect URI: `http://localhost:3000/api/auth/callback/google` (and `{AUTH_URL}/api/auth/callback/google` for prod)
3. Copy Client ID + Secret into `.env`
4. **Enable the Google Drive API** in the same GCP project (APIs & Services → Library → Google Drive API → Enable). This is required for resume uploads.

The first user to sign in becomes an admin-candidate (role defaults to `MEMBER`; you can promote in `prisma studio`).

## Scripts

| command | purpose |
| --- | --- |
| `npm run dev` | local dev server |
| `npm run build` | production build (runs `prisma generate`) |
| `npm run db:migrate` | run pending Prisma migrations |
| `npm run db:push` | push schema without migration files (fast iteration) |
| `npm run db:studio` | open Prisma Studio for data inspection |
| `npm run db:seed` | seed default positions |
| `npm run typecheck` | `tsc --noEmit` |

## Deployment (Vercel)

Resumes are stored in Google Drive (not the server filesystem), so this deploys cleanly to Vercel.

1. Push to a git repo, import into Vercel.
2. Add env vars: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL=https://<your-domain>`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`.
3. Add the production redirect URI to your Google OAuth client: `{AUTH_URL}/api/auth/callback/google`.
4. Enable the **Google Drive API** in Google Cloud Console for the same project as your OAuth credentials.
5. `prisma generate` runs via postinstall. Run `npx prisma migrate deploy` to apply migrations in prod.

## Architecture quick ref

```
app/(app)           # authenticated UI
app/login           # public sign-in page
app/api/auth/...    # NextAuth handlers
app/uploads/...     # dev-only static serve for uploaded resumes
components/         # UI primitives + domain components
lib/auth.ts         # Google OAuth + domain gate
lib/db.ts           # Prisma client singleton
lib/storage.ts      # resume storage (Google Drive via user OAuth)
lib/domain.ts       # stage/facet/department enums + labels
prisma/schema.prisma
```

## Known scope boundaries (v1)

- No ATS integrations.
- No calendar / interview scheduling.
- No candidate-facing portal.
- No outbound email.

## Notes

- Ratings are 1–5. One rating per `(candidate, author, facet)`; re-rating updates in place.
- Comments are plain text, append-only, authors can delete their own.
- Moving a candidate out of `FOLLOW_UP` clears their `followUpAt`.
- Archive hides a candidate but retains all data.
