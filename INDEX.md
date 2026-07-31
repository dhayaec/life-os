# Life-OS Toolchain Index

A lean, fully-wired development toolchain for this Next.js App Router app. Every
file below is present in the repo and verified working — nothing here references
tools that are not installed.

## Toolchain at a glance

| Concern          | Tool           | Config file                               | Runs on                |
| ---------------- | -------------- | ----------------------------------------- | ---------------------- |
| Linting          | ESLint 9       | `eslint.config.mjs`                       | save / pre-commit / CI |
| Formatting       | Prettier 3     | `.prettierrc`, `.prettierignore`          | save / pre-commit / CI |
| Type checking    | tsc            | `tsconfig.json`                           | pre-push / CI          |
| Unit tests       | Vitest 4       | `vitest.config.mts`, `tests/`             | pre-push / CI          |
| Commit messages  | commitlint     | `.commitlintrc.js`                        | commit-msg hook        |
| Staged-file lint | lint-staged    | `.lintstagedrc.js`                        | pre-commit hook        |
| Git hooks        | Husky 9        | `.husky/{pre-commit,commit-msg,pre-push}` | commit / push          |
| CI               | GitHub Actions | `.github/workflows/ci.yml`                | push to main / PR      |

## Related docs

- [PRODUCTION_CONFIG_SUMMARY.md](PRODUCTION_CONFIG_SUMMARY.md) — overview of the
  toolchain and how the enforcement layers fit together.
- [CLAUDE_CONFIG_GUIDE.md](CLAUDE_CONFIG_GUIDE.md) — day-to-day reference:
  scripts, commit format, hooks, CI, troubleshooting.
- [branch-protection-rules.md](branch-protection-rules.md) — GitHub branch
  protection matching the `quality` CI status check.

## Commands

```bash
pnpm dev            # development server
pnpm lint           # ESLint over the repo (flat config)
pnpm format         # Prettier write
pnpm format:check   # Prettier check
pnpm type-check     # tsc --noEmit
pnpm test           # Vitest, single run
pnpm test:watch     # Vitest, watch mode
pnpm test:coverage  # Vitest with v8 coverage
pnpm build          # production build
```
