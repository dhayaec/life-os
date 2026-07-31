# 🚀 Production-Ready Claude Configuration for Next.js

A comprehensive, enterprise-grade configuration system for Next.js applications
with automated quality checkpoints, branch protection, pre-commit hooks, and
CI/CD pipeline integration.

## 📋 Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Configuration Files](#configuration-files)
- [Pre-Commit Checkpoints](#pre-commit-checkpoints)
- [Pre-Push Checkpoints](#pre-push-checkpoints)
- [Commit Message Standards](#commit-message-standards)
- [Branch Protection Rules](#branch-protection-rules)
- [CI/CD Pipeline](#cicd-pipeline)
- [Production Release Checklist](#production-release-checklist)
- [Troubleshooting](#troubleshooting)

---

## Overview

This configuration enforces industry best practices across multiple dimensions:

### 🎯 Core Checkpoints

1. **Type Safety** - Strict TypeScript configuration
2. **Code Quality** - ESLint with React/Next.js specific rules
3. **Formatting** - Prettier for consistent code style
4. **Accessibility** - WCAG 2.1 compliance checks
5. **Security** - Vulnerability scanning and best practices
6. **Performance** - Bundle size and Lighthouse audits
7. **Testing** - Unit, integration, and E2E test coverage
8. **Documentation** - JSDoc and comment requirements

### 🛡️ Enforcement Mechanisms

- **Pre-commit hooks** - Fast local checks before staging
- **Pre-push hooks** - Comprehensive checks before remote push
- **Commit message validation** - Conventional commits standard
- **Branch protection** - Prevent direct pushes to main/develop
- **CI/CD pipeline** - Automated checks on every PR
- **Code review requirements** - Enforce peer review on main branch

---

## Quick Start

### 1. Installation

```bash
# Install dependencies
npm install

# Setup Husky git hooks
npm run prepare

# Verify setup
npx husky install
```

### 2. First Commit

```bash
# Git will automatically run pre-commit checks
git add src/
git commit -m "feat(core): add new feature"
# ✅ Linting, formatting, and type checking runs automatically
```

### 3. First Push

```bash
# Git will automatically run pre-push checks
git push origin feature/my-feature
# ✅ Full test suite, build, and security audit runs automatically
```

---

## Configuration Files

### `claude.json` - Master Configuration

The main configuration file that defines all checkpoints and standards.

**Key Sections:**

- `preCommitCheckpoints` - Quick checks before staging
- `commitStandards` - Conventional commits format
- `branchProtection` - GitHub branch rules
- `productionChecklistBeforeRelease` - Final checklist before deployment

### `.eslintrc.js` - Linting Rules

Strict ESLint configuration with:

- TypeScript strict mode
- React best practices
- Next.js specific rules
- Accessibility (a11y) requirements
- Security checks

**Key Features:**

```javascript
// No 'any' types allowed
'@typescript-eslint/no-explicit-any': 'error'

// Explicit return types required
'@typescript-eslint/explicit-function-return-types': 'error'

// No console.log in production
'no-console': ['error', { allow: ['warn', 'error'] }]

// Accessibility checks
'jsx-a11y/alt-text': 'error'
```

### `.prettierrc` - Code Formatting

Consistent formatting standards:

```json
{
  "printWidth": 100,
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "semi": true,
  "arrowParens": "always"
}
```

### `tsconfig.json` - TypeScript Configuration

Strict mode enabled:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true
  }
}
```

### `.commitlintrc.js` - Commit Message Validation

Enforces conventional commits:

```bash
feat(auth): add OAuth2 login        ✅ Valid
fix(bug): resolve type error        ✅ Valid
random commit message               ❌ Invalid
```

### `.lintstagedrc.js` - Pre-Commit Linting

Runs only on staged files for speed:

```javascript
{
  '*.{ts,tsx,js,jsx}': ['prettier --write', 'eslint --fix', 'tsc --noEmit']
}
```

---

## Pre-Commit Checkpoints

Run automatically when you commit. These are **fast** to provide quick feedback.

### What Runs

```bash
git commit
  ↓
✅ Prettier (format staged files)
✅ ESLint (lint staged files with --fix)
✅ TypeScript (type check)
  ↓
commit created or fails
```

### Example Output

```bash
$ git commit -m "feat(api): add user endpoint"

🔍 Running pre-commit checks...
📝 Formatting and linting staged files...

  ✓ src/pages/api/users.ts

  ✓ 1 file formatted
  ✓ 1 file linted

✅ Pre-commit checks passed!
```

### Skip Pre-Commit Hooks (Not Recommended)

```bash
git commit --no-verify
# Only in emergencies! This bypasses all safety checks.
```

---

## Pre-Push Checkpoints

Run when pushing to remote. These are **comprehensive** and may take 1-2
minutes.

### What Runs

```bash
git push
  ↓
❌ Prevent direct push to main/develop
✅ Full test suite (coverage > 70%)
✅ Build project (npm run build)
✅ Security audit (npm audit)
✅ Bundle size analysis
  ↓
push succeeds or fails
```

### Branch Protection

```
main branch
  ├─ No direct pushes allowed
  ├─ Require 2 PR approvals
  ├─ All status checks must pass
  ├─ Require up-to-date branch
  └─ Require conversation resolution

develop branch
  ├─ No direct pushes allowed
  ├─ Require 1 PR approval
  ├─ All status checks must pass
  └─ Require up-to-date branch
```

### Example Output

```bash
$ git push origin feature/oauth

🚀 Running pre-push checks...
📌 Branch: feature/oauth

📋 Running full test suite...
✅ 24 tests passed (156ms)

🔨 Building project...
✅ Build successful (12.3s)

🔐 Running security audit...
✅ No critical security vulnerabilities

📦 Checking bundle size...
✅ Bundle size check passed (489 KB)

✅ All pre-push checks passed! Pushing to remote...
```

### Skip Pre-Push Hooks (Not Recommended)

```bash
git push --no-verify
# Only in emergencies!
```

---

## Commit Message Standards

### Conventional Commits Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type       | Emoji | Description                |
| ---------- | ----- | -------------------------- |
| `feat`     | ✨    | A new feature              |
| `fix`      | 🐛    | A bug fix                  |
| `docs`     | 📖    | Documentation only         |
| `style`    | 💅    | Formatting, no code change |
| `refactor` | ♻️    | Code refactoring           |
| `perf`     | ⚡    | Performance improvement    |
| `test`     | ✅    | Tests only                 |
| `chore`    | 🔧    | Build/dependencies         |
| `ci`       | 🤖    | CI/CD configuration        |
| `security` | 🔒    | Security fixes             |
| `a11y`     | ♿    | Accessibility improvements |

### Valid Examples

```bash
feat(auth): add OAuth2 login with Google
fix(cart): resolve price calculation bug
refactor(api): extract validation middleware
perf(images): implement lazy loading
docs(readme): update installation steps
test(checkout): add payment processing tests
security(env): rotate API keys
a11y(forms): add ARIA labels to inputs
chore(deps): upgrade Next.js to 14.2.0
ci(actions): add lighthouse performance check
```

### Invalid Examples

```bash
Added new feature          ❌ Missing type
feat: add feature          ❌ Missing scope
FEAT(API): Add Feature     ❌ Wrong case
feat(api): add feature!    ❌ Period at end
```

### Interactive Commit Messages

```bash
npm run commit
# Opens interactive prompt with validation
# Guide-based commit message creation
```

---

## Branch Protection Rules

### Automatic Protection on GitHub

Add to your GitHub repository settings or run:

```bash
# Via GitHub API or CLI
gh repo edit --enable-require-reviews 2-of-last-3
```

### Main Branch Rules

- ✅ Require pull request reviews (2 approvals)
- ✅ Require status checks to pass
  - lint
  - type-check
  - test
  - build
  - security-scan
  - accessibility-audit
  - performance-check
- ✅ Require branches to be up to date
- ✅ Require signed commits (optional)
- ✅ Restrict who can push
  - Developers: only via PR
  - Dependabot: direct push allowed

### Develop Branch Rules

- ✅ Require pull request reviews (1 approval)
- ✅ Require status checks to pass (basic: lint, type-check, test, build)
- ✅ Require branches to be up to date
- ⚠️ Fewer restrictions than main for faster development

---

## CI/CD Pipeline

Automated checks run on every PR and push.

### Pipeline Stages

```
1. LINT (parallel)
   ├─ ESLint
   ├─ Prettier check
   └─ Import order check

2. TYPE CHECK
   └─ TypeScript strict

3. TEST
   ├─ Unit tests (coverage > 70%)
   ├─ Integration tests
   └─ Coverage upload to Codecov

4. BUILD
   ├─ Next.js build
   ├─ Export (if configured)
   └─ Upload artifacts

5. SECURITY
   ├─ npm audit
   ├─ Dependency check
   └─ Custom security scan

6. ACCESSIBILITY
   ├─ axe-core audit
   └─ WCAG compliance check

7. PERFORMANCE
   ├─ Lighthouse audit (90+ on all metrics)
   ├─ Bundle size analysis
   └─ Performance budgets

8. E2E TESTS (optional)
   ├─ Playwright tests
   └─ Screenshots + video
```

### Viewing Results

- **GitHub Actions** - Click "Checks" tab on PR
- **Status Badge** - Add to README.md
- **Artifacts** - Build outputs, test reports, Lighthouse results

### Example Badge

```markdown
[![CI](https://github.com/yourorg/yourrepo/workflows/CI%20Pipeline/badge.svg)](https://github.com/yourorg/yourrepo/actions)
```

---

## Production Release Checklist

Before merging to main and deploying:

### Security Checklist ✅

- [ ] All secrets removed from code
- [ ] No hardcoded credentials
- [ ] Environment variables properly configured
- [ ] HTTPS enforced
- [ ] CSP headers configured
- [ ] CORS properly set
- [ ] Dependencies audited
- [ ] No vulnerable packages
- [ ] SQL injection prevention verified
- [ ] XSS protection verified
- [ ] CSRF tokens implemented
- [ ] Rate limiting configured
- [ ] API authentication verified

### Performance Checklist ✅

- [ ] Bundle size < 500KB initial
- [ ] Lighthouse score > 90 on all metrics
- [ ] First Contentful Paint < 2s
- [ ] Images optimized (Next.js Image)
- [ ] Fonts optimized (next/font)
- [ ] Code splitting implemented
- [ ] Caching headers configured
- [ ] Database queries optimized
- [ ] API responses < 200ms

### Accessibility Checklist ✅

- [ ] WCAG 2.1 AA compliance verified
- [ ] Keyboard navigation tested
- [ ] Screen reader tested
- [ ] Color contrast verified
- [ ] ARIA labels present
- [ ] Semantic HTML used
- [ ] Focus management implemented
- [ ] Alt text for all images
- [ ] No flashing content

### Testing Checklist ✅

- [ ] Unit tests > 70% coverage
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Cross-browser tested
- [ ] Mobile responsiveness verified
- [ ] Load testing completed
- [ ] Security tests (OWASP Top 10)

### Code Quality Checklist ✅

- [ ] TypeScript strict mode enabled
- [ ] No 'any' types
- [ ] No console.log in production
- [ ] No commented-out code
- [ ] All imports used
- [ ] No duplicate code
- [ ] Code reviewed (2+ approvers)
- [ ] Linting passes 100%

### Deployment Checklist ✅

- [ ] Environment variables validated
- [ ] Database migrations tested
- [ ] Rollback plan documented
- [ ] Monitoring configured
- [ ] Health checks configured
- [ ] SSL/TLS configured
- [ ] Backup strategy verified

---

## Daily Development Workflow

### Creating a Feature

```bash
# 1. Create feature branch
git checkout -b feature/user-authentication

# 2. Make changes
vim src/pages/api/auth.ts

# 3. Commit (pre-commit hook runs automatically)
git add src/
git commit -m "feat(auth): add JWT token validation"
# ✅ Linting, formatting, type checking

# 4. Push (pre-push hook runs automatically)
git push origin feature/user-authentication
# ✅ Tests, build, security audit

# 5. Create PR on GitHub
# ✅ CI pipeline runs automatically
# ✅ Coverage report posted to PR
# ✅ Lighthouse results posted to PR

# 6. Code review
# ✅ At least 2 approvals required

# 7. Merge to develop
# ✅ Branch protection ensures all checks pass

# 8. Deploy to staging
# ✅ Automated deployment workflow

# 9. Merge to main
# ✅ Production deployment
```

### Quick Commands

```bash
# Check if code is production-ready
npm run ci

# Format code
npm run format

# Fix linting issues
npm run lint:fix

# Run type checking
npm run type-check

# Run tests with coverage
npm run test:coverage

# Build project
npm run build

# View test results in UI
npm run test:ui

# View Lighthouse results
npm run lighthouse

# Update dependencies
npm run deps:update

# Check for vulnerabilities
npm run security:scan
```

---

## Troubleshooting

### "Husky hooks not running"

```bash
# Re-install hooks
npm run prepare

# Verify installation
ls -la .husky/

# Make hooks executable
chmod +x .husky/pre-commit
chmod +x .husky/pre-push
chmod +x .husky/commit-msg
```

### "ESLint cannot find @typescript-eslint"

```bash
# Clear cache and reinstall
npm run clean:all
npm install
npm run lint
```

### "TypeScript errors on build but not in IDE"

```bash
# Ensure tsconfig.json is correct
npm run type-check

# Clear Next.js cache
rm -rf .next
npm run build
```

### "Tests failing in CI but passing locally"

```bash
# Run with same environment as CI
npm run test:coverage -- --run

# Check Node version matches
node --version  # Should be 20+

# Verify all dependencies installed
npm ci  # Clean install
```

### "Pre-push hook blocking legitimate push"

```bash
# Skip specific checks (use with caution)
git push --no-verify

# Or fix the failing check
npm run lint:fix
npm run type-check
npm run test:coverage
npm run build
```

### "Commit message rejected by commitlint"

```bash
# Follow conventional commits format
git commit -m "feat(scope): description"

# Interactive commit with guidance
npm run commit
```

### "Bundle size exceeds threshold"

```bash
# Analyze bundle composition
npm run analyze:bundle

# Check for large dependencies
npm ls <package-name>

# Consider code splitting
// Use dynamic imports for large components
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(
  () => import('@/components/Heavy'),
  { ssr: false }
)
```

---

## Performance Optimization Tips

### Image Optimization

```typescript
import Image from 'next/image'

// ✅ Good
<Image
  src="/image.jpg"
  alt="description"
  width={800}
  height={600}
/>

// ❌ Bad
<img src="/image.jpg" alt="description" />
```

### Font Optimization

```typescript
import { Inter } from 'next/font/google'

// ✅ Good
const inter = Inter({ subsets: ['latin'] })

// ❌ Bad
<link href="https://fonts.googleapis.com/..." />
```

### Component Splitting

```typescript
// ✅ Good - Server component by default
export default function Page() {
  return <ClientComponent />
}

// ✅ Use 'use client' only when needed
'use client'
export default function ClientComponent() {
  const [state, setState] = useState()
  return <div>{state}</div>
}
```

---

## Contributing

When contributing to this project:

1. ✅ Follow all pre-commit and pre-push checks
2. ✅ Write clear, descriptive commit messages
3. ✅ Add tests for new features
4. ✅ Update documentation
5. ✅ Request code review
6. ✅ Ensure all CI checks pass

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [ESLint Rules](https://eslint.org/docs/latest/rules/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Husky Documentation](https://typicode.github.io/husky/)
- [Commitlint Documentation](https://commitlint.js.org/)

---

## Support

For issues or questions:

1. Check this guide first
2. Review GitHub Issues
3. Contact team lead
4. File a GitHub Issue

---

**Last Updated:** 2026-01-01  
**Version:** 1.0.0  
**Maintained By:** Development Team
