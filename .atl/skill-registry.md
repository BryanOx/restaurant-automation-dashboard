---
name: Skill Registry
description: Project-specific AI agent skills and conventions
created: 2026-05-02
---

## User Skills (from ~/.config/opencode/skills/)

| Skill | Trigger |
|-------|---------|
| `sdd-init` | "sdd init", "iniciar sdd" |
| `sdd-explore` | `/sdd-explore` |
| `sdd-propose` | `/sdd-new` |
| `sdd-spec` | `/sdd-spec` |
| `sdd-design` | `/sdd-design` |
| `sdd-tasks` | `/sdd-tasks` |
| `sdd-apply` | `/sdd-apply` |
| `sdd-verify` | `/sdd-verify` |
| `sdd-archive` | `/sdd-archive` |
| `sdd-onboard` | `/sdd-onboard` |
| `branch-pr` | Creating a PR or preparing changes for review |
| `issue-creation` | Creating a GitHub issue or reporting a bug |
| `go-testing` | Go tests or Bubbletea TUI testing |
| `skill-creator` | Creating new AI agent skills |
| `judgment-day` | "judgment day", "dual review", "doble review" |

## Project Conventions

### Tech Stack
- **Framework**: Next.js 16.2.4 (App Router)
- **Language**: TypeScript 5
- **UI**: React 19.2.4, Tailwind CSS 4
- **Linting**: ESLint 9 + eslint-config-next
- **Package Manager**: npm

### Architecture Patterns
- App Router directory structure (`app/` folder)
- Server components by default
- Route-based code splitting

### Additional Notes
- Follow Next.js 16 breaking changes - read `node_modules/next/dist/docs/` before writing code