# Life-OS Toolchain Summary

A lean quality toolchain for this Next.js App Router app. Five layers enforce
standards locally and in CI, and every tool listed here is installed and
verified working.

## Enforcement layers

1. **Editor (on save)** — VS Code runs Prettier (`editor.formatOnSave`) and
   ESLint fix-on-save against the flat `eslint.config.mjs`.
2. **Pre-commit** — Husky runs `lint-staged`, which runs Prettier + ESLint
   `--fix` on staged files only.
3. **Commit message** — Husky's `commit-msg` hook runs commitlint, which
   enforces the Conventional Commits format defined in `.commitlintrc.js`.
4. **Pre-push** — Husky's `pre-push` hook runs `pnpm type-check` (fast,
   project-scoped type checking).
5. **CI** — `.github/workflows/ci.yml` runs the full quality gate on pushes to
   `main` and every PR: lint → type-check → test → build.

## What each tool does

- **ESLint 9 (flat config)** — `eslint.config.mjs` composes `eslint-config-next`
  (core-web-vitals + typescript) with curated project rules: no `any`, no unused
  vars, type-only imports, no non-null assertion (warn), no array-index keys, no
  useless fragments, no `console.log` / `debugger` in application code.
- **Prettier 3** — `.prettierrc`: printWidth 100, single quotes, trailing comma
  es5, LF line endings. `.prettierignore` excludes build output and YAML (no
  built-in YAML parser).
- **TypeScript strict** — `tsconfig.json` keeps `strict` plus
  `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns`,
  etc. Path alias `@/*` → `src/*`.
- **Vitest 4** — `vitest.config.mts` (jsdom, React plugin, `@` alias); tests
  live in `tests/`; setup in `tests/setup.tsx` (jest-dom matchers + a
  plain-`img` stand-in for `next/image`).
- **commitlint** — `.commitlintrc.js` extends `@commitlint/config-conventional`
  and requires `type(scope)` with a kebab-case scope, 12 types, header ≤ 100
  chars.
- **lint-staged** — `.lintstagedrc.js`: Prettier + ESLint on code files,
  Prettier on json/md/css. Type-check is deliberately left to pre-push/CI
  (per-file `tsc` is slow and not project-scoped).
- **Husky 9** — hooks installed via `pnpm prepare`.

## Toolchain files

```
eslint.config.mjs            .prettierrc              .prettierignore
.commitlintrc.js             .lintstagedrc.js         vitest.config.mts
tsconfig.json                package.json
.husky/pre-commit            .husky/commit-msg        .husky/pre-push
.github/workflows/ci.yml
tests/setup.tsx              tests/Home.test.tsx
```
