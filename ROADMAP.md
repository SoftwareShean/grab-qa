# GrabQA Roadmap

## Overview

GrabQA is evolving through three phases:

1. **Open Source npm Package** - Free, self-hosted tool for individual devs
2. **Team Beta** - Testing with work team (2 engineers, design director, CEO, QA)
3. **SaaS Platform** - Paid cloud version with team features

---

## Branch Strategy

| Branch | Purpose | Status |
|--------|---------|--------|
| `main` | Stable releases | Current: v0.1.0 |
| `npm-package` | Public npm package prep | In Progress |
| `team-beta` | Work team testing features | Planned |
| `saas-platform` | SaaS infrastructure | Planned |

---

## Phase 1: npm Package (Public)

**Goal:** Publishable open-source package anyone can `npm install`

### Tasks

- [ ] Package naming (check npm availability: `grab-qa`, `grabqa`, `@grabqa/react`)
- [ ] Clean up package.json (author, repository, bugs, homepage)
- [ ] Write comprehensive README with:
  - [ ] Quick start guide
  - [ ] Configuration options
  - [ ] GitHub integration setup
  - [ ] Screenshots/GIFs
  - [ ] Contributing guide
- [ ] Add LICENSE (MIT)
- [ ] Add CHANGELOG.md
- [ ] Set up GitHub Actions for:
  - [ ] CI (build + typecheck on PR)
  - [ ] Auto-publish to npm on release tag
- [ ] Create npm account / org (@grabqa?)
- [ ] First publish: v0.1.0

### Nice-to-haves
- [ ] Demo site (grabqa.dev?)
- [ ] CodeSandbox example
- [ ] Video walkthrough

---

## Phase 2: Team Beta

**Goal:** Test with work team, gather feedback, validate product

### Team Roles & Needs

| Role | Primary Need | Key Features |
|------|-------------|--------------|
| QA Engineer | Create tickets efficiently | Monday.com integration, bulk export |
| Engineers (2) | Receive actionable tickets | Code context, file paths, clear reproduction |
| Design Director | Visual feedback on UI | Screenshot annotations, visual diffs |
| CEO | Overview of issues | Dashboard, priority sorting, progress tracking |

### Features for Team Beta

#### Must Have
- [ ] **Monday.com Integration**
  - Create items via Monday API
  - Map annotation types to Monday columns
  - Link annotations to board items
  - Sync status bidirectionally?

- [ ] **Team Workspace** (no auth yet, just shared config)
  - Shared Monday board ID
  - Shared project settings
  - Export all team annotations

- [ ] **Screenshot Capture**
  - Capture element + surrounding context
  - Annotate directly on screenshot
  - Include in exports

- [ ] **Session Management**
  - Name QA sessions
  - Group annotations by session
  - Export session as report

#### Nice to Have
- [ ] Keyboard shortcuts (n = new, e = export, etc.)
- [ ] Annotation markers visible on page
- [ ] Click annotation card → highlight element
- [ ] Dark/light theme

### Rollout Plan
1. Deploy as private npm package or direct install
2. Install on one internal project
3. Run 2-week pilot
4. Gather feedback via weekly sync
5. Iterate based on feedback

---

## Phase 3: SaaS Platform

**Goal:** Monetizable product with team collaboration

### Tech Stack

| Component | Technology | Notes |
|-----------|------------|-------|
| Auth | Firebase Auth | Already using for Fixins |
| Database | Firestore | Real-time sync |
| Storage | Firebase Storage | Screenshots |
| Billing | Stripe | Already have account |
| Hosting | Firebase Hosting | Or Vercel for dashboard |
| API | Cloud Functions | Or Next.js API routes |

### Pricing Model (Draft)

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | 1 user, local storage only, GitHub export |
| **Pro** | $9/mo | Cloud sync, unlimited history, all integrations |
| **Team** | $29/mo | 5 users, shared workspace, team dashboard |
| **Enterprise** | Custom | SSO, audit logs, SLA |

### SaaS Features

#### Core (Pro+)
- [ ] User authentication
- [ ] Cloud storage of annotations
- [ ] Cross-device sync
- [ ] Annotation history (30 days free, unlimited paid)
- [ ] All integrations (GitHub, Monday, Jira, Linear)

#### Team Features
- [ ] Shared workspaces
- [ ] Team member management
- [ ] Role-based permissions
- [ ] Team dashboard
- [ ] Activity feed
- [ ] @mentions in descriptions
- [ ] Assignment to team members

#### Dashboard
- [ ] Issues by status (open/resolved/exported)
- [ ] Issues by type (bug/enhancement/etc)
- [ ] Issues by project/page
- [ ] Timeline view
- [ ] Team activity

#### Integrations
- [ ] GitHub Issues (done)
- [ ] GitHub Projects (done)
- [ ] Monday.com
- [ ] Jira
- [ ] Linear
- [ ] Slack notifications
- [ ] Webhooks (for custom integrations)

### Infrastructure

```
grabqa.app/
├── Landing page (marketing)
├── /login, /signup (Firebase Auth)
├── /dashboard (main app)
│   ├── /projects
│   ├── /team
│   ├── /settings
│   └── /billing
└── /docs (documentation)

api.grabqa.app/
├── /annotations (CRUD)
├── /projects (CRUD)
├── /export (GitHub, Monday, etc.)
├── /webhooks (incoming)
└── /billing (Stripe webhooks)
```

### Stripe Setup
- [ ] Create GrabQA product in Stripe
- [ ] Set up subscription plans
- [ ] Implement checkout flow
- [ ] Handle webhooks (subscription created/updated/cancelled)
- [ ] Customer portal for self-service

---

## Revenue Projections

Assumptions:
- 1% conversion from free to paid
- Average $15/user/mo (mix of Pro + Team)
- 6-month runway to 500 paid users

| Month | Free Users | Paid Users | MRR |
|-------|------------|------------|-----|
| 1 | 100 | 1 | $15 |
| 2 | 500 | 5 | $75 |
| 3 | 1,500 | 15 | $225 |
| 4 | 3,000 | 30 | $450 |
| 5 | 6,000 | 60 | $900 |
| 6 | 10,000 | 100 | $1,500 |

---

## Competitive Positioning

| Feature | BugHerd | Marker.io | Usersnap | **GrabQA** |
|---------|---------|-----------|----------|------------|
| Price | $42/mo | $39/mo | €39/mo | Free + $9/mo |
| React awareness | ❌ | ❌ | ❌ | ✅ |
| AI agent export | ❌ | ❌ | ❌ | ✅ |
| Self-hosted option | ❌ | ❌ | ❌ | ✅ |
| Open source | ❌ | ❌ | ❌ | ✅ |
| Monday integration | ✅ | ❌ | ✅ | 🔜 |

**Unique selling points:**
1. Open source / self-hostable
2. React component awareness
3. Built for devs + AI coding agents
4. 10x cheaper than competitors

---

## Timeline

| Phase | Start | End | Milestone |
|-------|-------|-----|-----------|
| npm Package | Now | +1 week | Published on npm |
| Team Beta | +1 week | +4 weeks | Monday.com working, team testing |
| SaaS MVP | +4 weeks | +8 weeks | Auth + billing + dashboard |
| Public Launch | +8 weeks | +10 weeks | ProductHunt, Hacker News |

---

## Next Actions

### This Week
1. [ ] Publish to npm as `grab-qa`
2. [ ] Add Monday.com integration
3. [ ] Test with work team on one project

### Next Week
1. [ ] Gather team feedback
2. [ ] Start SaaS infrastructure (Firebase project, Stripe products)
3. [ ] Design dashboard wireframes

---

*Last updated: 2025-01-30*
