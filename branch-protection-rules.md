# GitHub Branch Protection Rules

Complete guide to setting up branch protection for main and develop branches.

## Setup Options

### Option 1: GitHub Web UI (Easiest)

1. Go to Settings → Branches
2. Click "Add rule" under "Branch protection rules"
3. Enter branch name pattern (e.g., `main`, `develop`)
4. Check/configure options below

### Option 2: GitHub CLI

```bash
# Install GitHub CLI
brew install gh  # macOS
# or follow https://cli.github.com/

# Authenticate
gh auth login

# Create branch protection rules
gh api repos/:owner/:repo/branches/main/protection \
  -f required_status_checks='{"strict":true,"contexts":["lint","type-check","test","build"]}' \
  -f enforce_admins=true \
  -f required_pull_request_reviews='{"dismissal_restrictions":{},"dismiss_stale_reviews":true,"require_code_owner_reviews":true,"required_approving_review_count":2}' \
  -f restrictions=null \
  -f allow_force_pushes=false \
  -f allow_deletions=false
```

### Option 3: Infrastructure as Code (Terraform)

```hcl
# main.tf
resource "github_branch_protection" "main" {
  repository_id          = github_repository.main.id
  pattern                = "main"
  enforce_admins         = true
  require_signed_commits = false

  required_pull_request_reviews {
    dismiss_stale_reviews           = true
    require_code_owner_reviews      = true
    required_approving_review_count = 2
  }

  required_status_checks {
    strict   = true
    contexts = [
      "lint",
      "type-check",
      "test",
      "build",
      "security-scan",
      "accessibility-audit",
      "performance-check"
    ]
  }

  allow_force_pushes      = false
  allow_deletions         = false
  require_linear_history  = true
}
```

---

## Main Branch Configuration

### Basic Settings

| Setting                    | Value  | Purpose                       |
| -------------------------- | ------ | ----------------------------- |
| **Pattern**                | `main` | Applies to main branch        |
| **Enforce Admins**         | ✅ Yes | Even admins must follow rules |
| **Require Signed Commits** | ❌ No  | Optional, for extra security  |

### Pull Request Requirements

| Setting                             | Value  | Purpose                       |
| ----------------------------------- | ------ | ----------------------------- |
| **Require Pull Request Reviews**    | ✅ Yes | No direct commits             |
| **Require Code Owner Reviews**      | ✅ Yes | CODEOWNERS file must approve  |
| **Dismiss Stale Reviews**           | ✅ Yes | Push invalidates old reviews  |
| **Require Approvals**               | `2`    | Two reviewers required        |
| **Require Conversation Resolution** | ✅ Yes | All comments must be resolved |

### Status Checks Required

All must pass before merging:

- ✅ `lint` - ESLint checks
- ✅ `type-check` - TypeScript compilation
- ✅ `test` - Unit test suite
- ✅ `build` - Next.js build
- ✅ `security-scan` - Vulnerability audit
- ✅ `accessibility-audit` - WCAG compliance
- ✅ `performance-check` - Lighthouse score

### Advanced Rules

| Setting                    | Value  | Purpose                          |
| -------------------------- | ------ | -------------------------------- |
| **Up-to-Date Required**    | ✅ Yes | Branch must be current with main |
| **Require Linear History** | ✅ Yes | No merge commits, rebase only    |
| **Allow Force Pushes**     | ❌ No  | Prevents rewriting history       |
| **Allow Deletions**        | ❌ No  | Prevents accidental deletion     |

---

## Develop Branch Configuration

### Basic Settings

| Setting            | Value     | Purpose                       |
| ------------------ | --------- | ----------------------------- |
| **Pattern**        | `develop` | Applies to develop branch     |
| **Enforce Admins** | ✅ Yes    | Even admins must follow rules |

### Pull Request Requirements

| Setting                          | Value  | Purpose                        |
| -------------------------------- | ------ | ------------------------------ |
| **Require Pull Request Reviews** | ✅ Yes | No direct commits              |
| **Require Approvals**            | `1`    | One reviewer required (faster) |
| **Dismiss Stale Reviews**        | ✅ Yes | Push invalidates old reviews   |

### Status Checks Required

Faster checks for development:

- ✅ `lint` - ESLint checks
- ✅ `type-check` - TypeScript compilation
- ✅ `test` - Unit test suite
- ✅ `build` - Next.js build

**Excluded** (to speed up development):

- `security-scan` (run on main)
- `accessibility-audit` (run on main)
- `performance-check` (run on main)

### Advanced Rules

| Setting                    | Value  | Purpose                          |
| -------------------------- | ------ | -------------------------------- |
| **Up-to-Date Required**    | ✅ Yes | Branch must be current with main |
| **Require Linear History** | ✅ Yes | No merge commits                 |
| **Allow Force Pushes**     | ❌ No  | Prevents rewriting history       |
| **Allow Deletions**        | ❌ No  | Prevents accidental deletion     |

---

## Feature Branch Naming Convention

Enforce naming with additional branch protection rules:

### Allowed Patterns

```
feature/*       - New features
fix/*           - Bug fixes
refactor/*      - Code refactoring
docs/*          - Documentation
test/*          - Tests
perf/*          - Performance improvements
security/*      - Security fixes
chore/*         - Maintenance
ci/*            - CI/CD updates
a11y/*          - Accessibility improvements
```

### Prevent Commits to Unallowed Branches

Use a pre-commit hook:

```bash
# .git/hooks/pre-commit
BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Allowed patterns
if [[ ! $BRANCH =~ ^(main|develop|feature/|fix/|refactor/|docs/|test/|perf/|security/|chore/|ci/|a11y/).*$ ]]; then
  echo "❌ Branch name '$BRANCH' does not follow naming convention"
  echo "   Use: feature/*, fix/*, refactor/*, docs/*, etc."
  exit 1
fi
```

---

## CODEOWNERS Setup

Create a `CODEOWNERS` file to require specific reviewers:

```bash
# .github/CODEOWNERS

# Global owners (all files)
* @lead-dev @tech-lead

# Specific components
/src/components/** @frontend-team
/src/pages/api/** @backend-team
/src/hooks/** @frontend-team
/src/utils/** @platform-team
/public/** @frontend-team

# Specific concerns
*.test.ts* @qa-team
*.security.ts @security-team
tsconfig.json @tech-lead
package.json @tech-lead

# Documentation
*.md @documentation-team
docs/** @documentation-team
```

---

## Bypass Rules (For Emergencies)

### Admin Bypass

Admins can bypass rules if needed (strongly discouraged):

1. Go to branch protection settings
2. Uncheck "Enforce admins"
3. Admin can now force push

**Best Practice**: Keep "Enforce admins" enabled even for admins.

### Dependabot Exception

Allow Dependabot to automatically update dependencies:

```json
{
  "allow_force_pushes": false,
  "allow_deletions": false,
  "bypass_pull_request_allowances": [
    {
      "actor": "dependabot[bot]",
      "actor_type": "Bot"
    }
  ]
}
```

---

## Workflows with Branch Protection

### Feature Development Flow

```
1. Create feature branch
   git checkout -b feature/new-feature

2. Make changes and commit
   git commit -m "feat(core): new feature"

3. Push to remote
   git push origin feature/new-feature
   ✅ Pre-push checks run

4. Create Pull Request
   ✅ CI pipeline runs
   ✅ Status checks posted

5. Code Review
   ✅ At least 1 approval (develop) or 2 (main)
   ✅ Conversations resolved

6. Merge to develop
   ✅ All checks must pass
   ✅ Branch must be up-to-date
   ✅ PR can be squashed or rebased

7. After develop testing...

8. Create PR to main
   ✅ CI pipeline runs (full checks)
   ✅ At least 2 approvals required
   ✅ CODEOWNERS must approve

9. Merge to main
   ✅ All checks must pass
   ✅ Branch must be up-to-date

10. Deploy to production
    ✅ Automated deployment workflow
```

---

## Troubleshooting

### "Required Status Checks Failing"

1. Check GitHub Actions workflow results
2. Click "Details" next to failing check
3. Review logs and fix issues locally
4. Push fix to branch
5. CI runs again automatically

### "Merge Button Disabled"

Likely causes:

- [ ] Pending status checks (wait for CI)
- [ ] Not enough approvals (request review)
- [ ] Conversation unresolved (mark resolved)
- [ ] Branch out of date (update branch)
- [ ] Signed commits required (configure git)

### "Cannot Force Push"

This is expected! Use `git push -f` to force push:

```bash
# Instead of force push, follow these steps:
git fetch origin
git rebase origin/develop
git push origin feature/branch

# If truly needed (emergency only):
# Ask admin to temporarily disable branch protection
```

### "Dependabot PRs Not Auto-Merging"

Configure auto-merge settings:

1. Settings → General
2. Check "Allow auto-merge"
3. Choose merge strategy (squash recommended)
4. Set "Auto-delete head branches" ✅

---

## Monitoring & Reporting

### View Protection Rules Status

```bash
# GitHub CLI
gh repo view --web  # Opens repository in browser
# Navigate to Settings → Branches to see all rules

# API
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/OWNER/REPO/branches/main/protection
```

### Branch Protection Metrics

Track in GitHub:

- Protected branches
- Failed PR checks
- Review time to merge
- Average CI/CD duration

### Dashboard Example

```
📊 Branch Protection Dashboard

Main Branch
├─ Total PRs this month: 24
├─ Avg approvals: 2.1
├─ Avg review time: 2.5 hours
├─ Failed checks: 3
└─ Deployments: 8

Develop Branch
├─ Total PRs this month: 156
├─ Avg approvals: 1.2
├─ Avg review time: 1.2 hours
├─ Failed checks: 12
└─ Merges to main: 8
```

---

## Best Practices

### ✅ DO

- ✅ Enforce rules for all team members (including admins)
- ✅ Require pull requests for all changes
- ✅ Require status checks to pass
- ✅ Keep rules up-to-date as project evolves
- ✅ Document exceptions with clear reasons
- ✅ Review and rotate code owners regularly
- ✅ Monitor CI/CD pipeline health

### ❌ DON'T

- ❌ Disable admins from following rules
- ❌ Allow direct pushes to main
- ❌ Skip status checks
- ❌ Merge without approvals
- ❌ Use force push on protected branches
- ❌ Hardcode exceptions
- ❌ Ignore failed CI checks

---

## Additional Resources

- [GitHub Branch Protection Docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [CODEOWNERS Documentation](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
- [GitHub Status Checks](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches)

---

**Last Updated:** 2026-01-01  
**Version:** 1.0.0
