# LifeOS — Architecture

## Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript (strict)
- **Styling:** Tailwind CSS 4 + shadcn/ui (new-york style), oklch design tokens
- **Data:** PostgreSQL on Neon, Prisma ORM (repository/service layer)
- **Auth:** Better Auth (email/password, OAuth, magic links, sessions)
- **Client state:** TanStack Query (server state), Redux Toolkit (global UI,
  notifications, auth), Zustand (preferences/sidebar), Context (locale, flags)
- **Testing:** Vitest + React Testing Library + MSW; Playwright E2E (Phase 5)
- **Tooling:** pnpm, flat ESLint, Prettier, husky + commitlint + lint-staged

## Directory layout

```
src/
  app/                  # App Router routes (route groups, layouts, pages)
  components/
    ui/                 # shadcn/ui primitives
    common/             # shared components (EmptyState, PageHeader, ThemeToggle…)
    layouts/            # AppShell, Sidebar, Topbar, CommandMenu
  constants/            # navigation, app config
  features/             # feature-based modules (auth, notes, tasks, …)
  hooks/                # shared React hooks
  lib/                  # cn() + other shared utilities
  providers/            # Theme / Redux / Query providers
  server/               # server-only utilities (auth, db, env)
  services/             # repository + service layer over Prisma
  store/                # Redux (slices) + Zustand (preferences)
  types/                # shared TypeScript types
  utils/                # pure helpers (dates, formatting, search)
  validations/          # Zod schemas (shared client/server)
```

## Rendering model

Server-first. Route handlers and Server Actions for mutations; RSC for reads;
client components only where interactive (forms, drag-and-drop, menus).

- **Server:** pages/layouts, data fetching, auth session (`getSession`),
  mutations via Server Actions → services → Prisma.
- **Client:** interactive views, optimistic updates via TanStack Query, UI state
  via Redux/Zustand.

## State ownership

| Concern        | Owner          | Notes                                      |
| -------------- | -------------- | ------------------------------------------ |
| Server data    | TanStack Query | cached queries, optimistic mutations       |
| Global UI      | Redux Toolkit  | command palette, mobile nav, notifications |
| Preferences    | Zustand        | sidebar collapsed, persisted to storage    |
| Theme          | next-themes    | class strategy + Tailwind dark variant     |
| Locale / flags | React Context  | provider-driven                            |

## Data layer

- Prisma schema under `prisma/schema.prisma`; every user-owned model carries a
  `userId` FK → `User` (cascade delete, indexed).
- Services encapsulate repositories; Server Actions and route handlers call
  services, never Prisma directly.
- Full-text search via Postgres `pg_trgm` / `to_tsvector` for the global Cmd+K
  search.
- `.env` validated at runtime by a Zod env schema (`src/server/env`).

## Security model

- Session cookies are `httpOnly`/`secure`; CSRF-safe Server Actions.
- All user input validated with Zod at the boundary.
- RBAC-ready via `role` enum on `User`; checks enforced in services/actions.
- Headers/CSP, rate limiting, and secret hygiene land in Phase 5.

## Theming

- oklch tokens defined in `globals.css` (`:root` + `.dark`), mapped into
  Tailwind via `@theme inline`.
- `ThemeProvider` (next-themes) sets `.dark` on `<html>`;
  `suppressHydrationWarning` on the root element; `ThemeToggle` switches
  light/dark/system.
