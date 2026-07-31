# LifeOS — Build Plan

## Context

LifeOS is a production-grade, full-stack "personal operating system" — a single
app combining notes, tasks, calendar, habits, journal, finance, bookmarks,
documents, and more (Notion × Calendar × Keep × Todoist × Obsidian …). It is a
learning/portfolio project meant to showcase modern Next.js + React
architecture, scalability, security, accessibility, performance, and testing.

The repo is a fresh `create-next-app` scaffold on **Next.js 16 / React 19 /
TypeScript strict / Tailwind 4 / pnpm / Node 24**. The toolchain is already
wired and verified green (flat ESLint, Prettier, husky + commitlint +
lint-staged, Vitest, single `quality` CI job). This plan builds the app on top
of that, MVP-first and shippable at every phase.

**Decisions (confirmed with user):**

- **Scope:** MVP-first — foundation + auth + 4 core modules, then extend.
- **Auth:** Better Auth (email/password, Google/GitHub OAuth, magic links,
  forgot/reset, email verification, sessions, MFA-ready).
- **AI assistant/summaries:** deferred to a later phase (needs AI provider key).
- **Dev database:** PostgreSQL on **Neon** (dev branch), same as production.

## Architecture

- **App Router, server-first.** RSC + Server Actions for mutations, Route
  Handlers for webhooks/file endpoints. Client components only where
  interactive.
- **Feature-based modules** under `src/features/*` (auth, notes, tasks,
  calendar, habits, journal, finance, bookmarks, documents, dashboard,
  settings). Shared layers: `components/ui` (shadcn), `components/common`,
  `components/layouts`, `lib`, `server`, `services` (repository pattern +
  service layer), `store`, `validations` (Zod), `constants`, `types`, `utils`,
  `hooks`, `providers`.
- **State:** TanStack Query (server state, optimistic updates, pagination),
  Zustand (theme/sidebar/preferences), Redux Toolkit (auth, global
  notifications, global UI per spec), Context (locale, feature flags,
  permissions).
- **Data access:** Prisma via a thin repository/service layer; Server Actions
  call services; client reads via Query + RSC.

## Toolchain

`prisma @prisma/client better-auth zod @tanstack/react-query @reduxjs/toolkit react-redux zustand framer-motion lucide-react class-variance-authority clsx tailwind-merge sonner cmdk date-fns @radix-ui/* (via shadcn) recharts @hello-pangea/dnd`
(drag-drop) `@tiptap/react` (rich text) `next-themes` `msw` `@playwright/test`.
Provision via **shadcn/ui** for UI components.

Reuse existing: `eslint.config.mjs`, `.prettierrc`, `.commitlintrc.js`,
`.lintstagedrc.js`, `vitest.config.mts`, `tests/setup.tsx`,
`.github/workflows/ci.yml`, `tsconfig.json` paths (`@/*` → `src/*`).

## Data model (Prisma, Postgres)

**v1 core** (all `userId` FK → `User`, cascade, indexed):

- Auth (Better Auth): `User` (with `role` enum for RBAC), `Account`, `Session`,
  `Verification`.
- Notes: `Folder` (nested), `Note` (content, isFavorite, trashedAt, archived),
  `Tag` + `NoteTag`, `NoteVersion` (content snapshot for history).
- Tasks: `Task` (status, priority, dueAt, completedAt, recurrence rule,
  reminderAt), `Label` + `TaskLabel`.
- Calendar: `CalendarEvent` (startAt/endAt, allDay, recurrence, location,
  color).
- Habits: `Habit` (frequency: daily/weekly/monthly), `HabitEntry` (date, done).
- Misc: `Notification`, `UserSettings` (theme, timezone, locale, prefs).

**Later phases:** `JournalEntry`, `Bookmark` + `Collection`,
`FinanceTransaction`

- `Budget`, `ShoppingItem`, `Document` (file metadata).

Full-text search via Postgres (pg_trgm / `to_tsvector` index) for Notes, Tasks,
Events, Documents, Habits, Bookmarks — consumed by Cmd+K global search.

## Phased roadmap (each phase ends green: lint + type-check + test + build)

### Phase 0 — Foundations

- Install deps + `shadcn/ui init`; add baseline shadcn components.
- App shell: route-group layout with sidebar + topbar; dark/light theme
  (next-themes + Tailwind 4 tokens in `globals.css`); Zustand store for
  sidebar/prefs; toasts (sonner); fonts (Geist already wired).
- Create **`PLAN.md`** in repo root (this plan) + `docs/architecture.md`.
- DoD: shell renders, theme toggles, all checks green.

### Phase 1 — Data layer + Auth

- Neon dev branch + `.env` (validated with a Zod env schema); `prisma init`;
  Prisma schema + first migration.
- Better Auth: email/password, Google + GitHub OAuth, magic link, forgot/reset,
  email verification; auth pages; session in RSC (`getSession`) + provider;
  middleware guarding protected routes; `role` on User (RBAC-ready).
- DoD: signup → verify → login → protected route works for all methods; session
  cookie is httpOnly/secure.

### Phase 2 — Core modules (MVP)

Pattern per module: feature folder with schema models, Zod validations,
repository/service, Server Actions, RSC list pages + client interactive views,
Query-powered mutations with optimistic updates, pagination.

- **Notes** — Tiptap rich text (markdown, code blocks, tables, images), nested
  folders, tags, favorites, version history, trash, full-text search.
- **Tasks** — CRUD, priorities, labels, recurring tasks, reminders, due dates;
  list + Kanban + calendar views; drag-and-drop (`@hello-pangea/dnd`).
- **Calendar** — day/week/month views, drag-and-drop scheduling, recurring
  events, reminders.
- **Habits** — daily/weekly/monthly habits, streak tracking, charts (recharts),
  gamification (levels/points).
- DoD: all four modules fully usable; core logic unit-tested; chain green.

### Phase 3 — Extended modules

Journal (entries, mood, images, search) · Bookmarks (collections, tags, save
article/video/repo/website) · Finance (expenses/income, budgets, categories,
monthly reports, charts) · Shopping list (categories, checklists, history) ·
Documents (upload to Vercel Blob, folder hierarchy, preview, trash, favorites,
sharing) · Notifications center + toasts · **Global search (Cmd+K)**: fuzzy,
indexes tasks/notes/events/documents/habits/bookmarks · Dashboard widgets
(agenda, upcoming events, recent notes, tasks due, habit streaks, storage, quick
actions) · User settings (profile, password, notification prefs, appearance,
shortcuts, timezone). DoD: each module shippable; Cmd+K works.

### Phase 4 — AI + polish (deferred AI)

- AI assistant via Vercel AI SDK + AI Gateway: note summarization, task-list
  generation from notes, daily briefing, natural-language search.
- Performance: bundle analysis, virtualized lists, Suspense/streaming, PPR where
  appropriate, image/font optimization pass.
- Accessibility: WCAG 2.2 AA audit (keyboard, ARIA, contrast, focus).
- Stretch: PWA + offline, real-time (SSE/WebSockets).

### Phase 5 — Hardening, testing, deploy

- Security: CSP + security headers, rate limiting, Zod validation everywhere,
  CSRF protection, RBAC checks on actions, secure cookies.
- Testing: 80%+ coverage on core logic (Vitest + RTL + MSW); Playwright E2E
  suites (auth flow, notes/tasks CRUD).
- CI: extend `ci.yml` — add Prisma migrate/check, E2E job, coverage reporting.
- Deploy: Vercel (preview + production) + Neon; apply branch protection (require
  `quality` check) per `branch-protection-rules.md`.
- DoD: production deploy live; E2E green; coverage met.

## Out of scope / stretch (not blocking)

PWA/offline sync, real-time collaboration, voice assistant, plugin architecture,
i18n (full), theme builder, audit logs, public API, import/export, E2E-encrypted
modules, React Native companion, MFA. Password vault = client-side encryption
learning exercise only (no server-side plaintext).

## Verification

Per phase: `pnpm lint`, `pnpm type-check`, `pnpm test`, `pnpm build` must pass,
then manual browser check via `pnpm dev` (golden path + edge cases per module).
E2E (`pnpm test:e2e`) added from Phase 5. Config changes keep commitlint
(`type(scope): subject`) and husky hooks satisfied.
