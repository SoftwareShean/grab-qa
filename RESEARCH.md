# QA Annotation Tool Research

## The Problem

Manual QA testing workflow is fragmented:
1. Find a bug on the live site
2. Screenshot it (separate app)
3. Switch to notes/Notion/GitHub
4. Describe the issue, paste screenshot
5. Try to remember the exact element/location
6. Lose context about component structure
7. Repeat 50x per testing session

**Pain points:**
- Constant context switching between apps
- Hard to reference exact DOM elements
- Screenshots lose interactivity
- No connection to actual code/components
- Tedious to create well-structured issues

---

## Competitive Landscape

| Tool | Price | Target User | Key Differentiator |
|------|-------|-------------|-------------------|
| [BugHerd](https://bugherd.com) | $42/mo | Agencies, non-tech clients | Pin-drop simplicity, Kanban board |
| [Marker.io](https://marker.io) | $39-79/mo | QA teams | 2-way Jira sync, session replay |
| [Usersnap](https://usersnap.com) | €39-949/mo | Enterprise | Compliance, security features |
| [Feedbucket](https://feedbucket.app) | Free tier | Small teams | Budget-friendly alternative |

**Common limitations of existing tools:**
- Designed for **reporters** (clients, users) → devs
- No awareness of React component structure
- No integration with AI coding agents
- Heavy focus on screenshots over code context
- Expensive for solo devs/small teams

**Distribution Methods (all competitors):**
- Browser extension (no code required)
- JavaScript embed snippet (works on mobile)
- npm SDK (deepest integration)

---

## react-grab: The Foundation

[GitHub: aidenybai/react-grab](https://github.com/aidenybai/react-grab)

**License:** MIT (clear for commercial use)

**What it does:**
- Click any element on your React app
- Copies to clipboard:
  - Component name
  - File path (via source maps)
  - HTML source code
- Built for coding agents (Cursor, Claude Code, etc.)

**This is 80% of the hard technical problem already solved.**

---

## Product: GrabQA

### Unique Value Proposition

**"QA annotations that speak React and feed your AI coding agent."**

Unlike screenshot-based tools, GrabQA:
1. Knows your component structure
2. Captures element context, not just pixels
3. Exports directly to GitHub Issues with code context
4. Works with AI coding workflows

### Target Users

1. **Primary:** Solo/indie devs doing their own QA
2. **Secondary:** Small teams with dedicated QA who want dev-quality reports
3. **Tertiary:** Agencies who want to give clients smarter feedback tools

### Business Model

- **Open source** when self-hosted
- **Freemium SaaS** for cloud features:
  - Team collaboration
  - Screenshot storage
  - AI analysis (BYOK - bring your own API key)
  - Monday/Jira/Linear integrations

---

## Current Status

### ✅ Completed (v0.1.0)

**Core Package:** `qa-tool/packages/grab-qa`

- React context + hooks architecture
- Element selection with blue highlight overlay
- React fiber introspection (component name, file path)
- Annotation system (type, priority, title, description)
- LocalStorage persistence
- Export to GitHub Issues (opens pre-filled issue form)
- Export to clipboard (AI-optimized format)
- Hotkey: Alt+Q to toggle
- Floating toolbar + side panel UI

**Integration:**
- npm linked to `fixins-creators`
- Added to layout.tsx (dev mode only)

### 🚧 TODO

**MVP Features:**
- [ ] Screenshot capture (html2canvas)
- [ ] Annotation markers visible on page
- [ ] Session management (group annotations)
- [ ] Filter/search annotations

**Integrations:**
- [ ] Monday.com API integration
- [ ] Jira API integration
- [ ] Linear API integration
- [ ] MCP server for Claude Code integration

**Distribution:**
- [ ] Chrome extension version
- [ ] Embed script version
- [ ] npm publish to registry

**Polish:**
- [ ] Dark/light theme toggle
- [ ] Keyboard navigation
- [ ] Drag to reposition panel
- [ ] Annotation categories (custom)

---

## Quick Start

```bash
# Start fixins-creators dev server
cd fixins-creators
npm run dev

# Open http://localhost:3000
# Press Alt+Q to enable GrabQA
# Click "Grab Element" to start annotating
```

---

## Architecture

```
qa-tool/
├── packages/
│   └── grab-qa/           # npm package
│       ├── src/
│       │   ├── index.ts           # Exports
│       │   ├── types.ts           # Type definitions
│       │   ├── context.tsx        # React context + hooks
│       │   ├── store.ts           # localStorage persistence
│       │   ├── element.ts         # DOM selection + React fiber
│       │   ├── export.ts          # GitHub/Markdown/AI export
│       │   └── components/
│       │       ├── GrabQA.tsx     # Main wrapper
│       │       ├── Toolbar.tsx    # Floating toolbar
│       │       └── Panel.tsx      # Side panel
│       ├── dist/                  # Built output
│       └── package.json
└── RESEARCH.md                    # This file
```

---

## Sources

- [react-grab GitHub](https://github.com/aidenybai/react-grab)
- [Usersnap vs BugHerd vs Marker.io comparison](https://marker.io/blog/usersnap-vs-bugherd-vs-markerio)
- [Top Bug Reporting Platforms 2025](https://bugherd.com/blog/top-10-bug-reporting-software-platforms-in-2025)
- [BugHerd Installation Methods](https://support.bugherd.com/en/articles/11425649-get-the-extension-or-install-bugherd)
- [Marker.io Browser SDK](https://www.npmjs.com/package/@marker.io/browser)
