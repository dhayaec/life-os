# Life-OS Toolchain Guide

Day-to-day reference for the project's quality toolchain. Commands assume pnpm
(this repo uses pnpm 11; do not mix in npm/yarn).

## Quick start

```bash
pnpm install     # install dependencies
pnpm prepare     # install husky hooks (also runs automatically on install)
pnpm dev         # development server
```

## Available scripts

| Script          | Runs                               |
| --------------- | ---------------------------------- |
| `dev`           | `next dev`                         |
| `build`         | `next build`                       |
| `start`         | `next start`                       |
| `lint`          | ESLint over the repo (flat config) |
| `lint:fix`      | ESLint with `--fix`                |
| `format`        | Prettier `--write .`               |
| `format:check`  | Prettier `--check .`               |
| `type-check`    | `tsc --noEmit`                     |
| `test`          | `vitest run`                       |
| `test:watch`    | `vitest` (watch mode)              |
| `test:coverage` | `vitest run --coverage` (v8)       |
| `prepare`       | `husky` (installs git hooks)       |

## Git hooks

| Hook         | Runs                                                                |
| ------------ | ------------------------------------------------------------------- |
| `pre-commit` | `npx lint-staged` — Prettier + ESLint `--fix` on staged files       |
| `commit-msg` | `npx --no -- commitlint --edit "$1"` — validates the commit message |
| `pre-push`   | `pnpm type-check`                                                   |

Bypass with `--no-verify` only in an emergency — it skips all checks for that
single operation.

## Commit messages

commitlint enforces Conventional Commits with a **mandatory kebab-case scope**:

```
type(scope): subject

optional body

optional footer
```

12 types:
`feat fix docs style refactor perf test chore ci security a11y revert`. Rules:
scope required and kebab-case, subject lowercase, no trailing period, header ≤
100 chars, blank lines around body/footer.

Examples:

```
feat(auth): add OAuth2 login with Google    valid
fix(cart): resolve price rounding bug       valid
chore(tooling): wire up husky hooks         valid
feat: add login flow                        invalid (no scope)
Added new feature                           invalid (no type)
feat(api): Add endpoint                     invalid (uppercase subject)
```

## CI

`.github/workflows/ci.yml` runs a single `quality` job on push to `main` and
every PR: checkout → pnpm 11 + Node 22 → `pnpm install --frozen-lockfile` → lint
→ type-check → test → build. Concurrency cancels superseded runs.

Branch protection (see `branch-protection-rules.md`) should require the
`quality` status check on `main`.

## Tests

- Vitest 4, jsdom environment, React plugin.
- Tests live in `tests/**/*.test.{ts,tsx}`; setup in `tests/setup.tsx`.
- Run with `pnpm test` / `pnpm test:watch` / `pnpm test:coverage`.

## Troubleshooting

| Symptom                      | Fix                                                          |
| ---------------------------- | ------------------------------------------------------------ |
| Hooks not running            | Run `pnpm prepare` to reinstall husky hooks                  |
| Commit rejected              | Follow `type(scope): subject`; see commit format above       |
| Prettier reformats on commit | Expected — lint-staged writes formatting on staged files     |
| New ESLint rule needed       | Add it to the `project/strict` block in `eslint.config.mjs`  |
| CI fails, passes locally     | Reinstall with `pnpm install --frozen-lockfile`; use Node 22 |
