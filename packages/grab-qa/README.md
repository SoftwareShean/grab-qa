# GrabQA

Visual QA annotation tool for React apps. Select elements, add notes, export to GitHub Issues or AI coding agents.

[![npm version](https://img.shields.io/npm/v/grab-qa.svg)](https://www.npmjs.com/package/grab-qa)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Why GrabQA?

Traditional QA tools (BugHerd, Marker.io) are built for non-technical stakeholders reporting bugs. GrabQA is built for **developers doing their own QA** with modern AI coding workflows.

| Feature | Traditional Tools | GrabQA |
|---------|-------------------|--------|
| React component detection | ❌ | ✅ |
| File path extraction | ❌ | ✅ |
| AI agent export | ❌ | ✅ |
| Self-hosted | ❌ | ✅ |
| Open source | ❌ | ✅ |
| Price | $40-80/mo | Free |

## Quick Start

```bash
npm install grab-qa
```

```tsx
// app/layout.tsx (Next.js) or App.tsx (Vite/CRA)
import { GrabQA } from 'grab-qa';

export default function Layout({ children }) {
  return (
    <>
      {children}
      {process.env.NODE_ENV === 'development' && <GrabQA />}
    </>
  );
}
```

**That's it!** Press `Alt+Q` to enable GrabQA.

## Usage

1. Press **Alt+Q** to enable GrabQA
2. Click **"Grab Element"** to enter selection mode
3. Hover over elements (blue highlight shows what you'll select)
4. Click to select an element
5. Fill in the annotation form:
   - **Type**: Bug, Enhancement, Question, or Nitpick
   - **Priority**: Critical, High, Medium, or Low
   - **Title**: Brief description
   - **Description**: Details, steps to reproduce, etc.
6. Export:
   - **📋 Copy for AI** → Formatted for Claude Code, Cursor, etc.
   - **🐙 Create Issues** → Creates GitHub Issues via API

## What Gets Captured

For each annotated element, GrabQA captures:

- **CSS selector** - Unique path to the element
- **React component name** - The owning component (if detectable)
- **File path** - Source location with line number (dev mode + source maps)
- **Tag, classes, ID** - Basic DOM info
- **Text content** - First 200 chars
- **HTML snippet** - First 500 chars of innerHTML

## GitHub Integration

Click the GitHub icon in the panel header to configure:

1. Create a [Personal Access Token](https://github.com/settings/tokens/new?scopes=repo,project&description=GrabQA) with `repo` + `project` scopes
2. Paste the token and click Verify
3. Select your repository from the searchable list
4. (Optional) Select a GitHub Project board

Issues are created directly via API—no browser popups.

## Configuration

```tsx
<GrabQA
  config={{
    // Keyboard shortcut (default: 'KeyQ' for Alt+Q)
    hotkey: 'KeyQ',

    // LocalStorage key for persisting annotations
    storageKey: 'grab-qa-annotations',

    // Callbacks
    onAnnotationCreate: (annotation) => console.log('Created:', annotation),
    onAnnotationUpdate: (annotation) => console.log('Updated:', annotation),
  }}
/>
```

## Using the Hook

For programmatic control or custom UI:

```tsx
import { GrabQAProvider, useGrabQA, GrabQAOverlay } from 'grab-qa';

function CustomControls() {
  const {
    enable,
    disable,
    isEnabled,
    annotations,
    toggleGrabMode,
    exportToClipboard
  } = useGrabQA();

  return (
    <button onClick={toggleGrabMode}>
      {isEnabled ? 'Stop' : 'Start'} QA ({annotations.length} issues)
    </button>
  );
}

export default function App() {
  return (
    <GrabQAProvider>
      <YourApp />
      <CustomControls />
      <GrabQAOverlay />
    </GrabQAProvider>
  );
}
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Alt+Q` | Toggle GrabQA on/off |
| `Escape` | Cancel grab mode |

## Framework Support

| Framework | Support | Notes |
|-----------|---------|-------|
| Next.js 13+ (App Router) | ✅ | Use Client Component wrapper |
| Next.js (Pages Router) | ✅ | Direct import |
| Vite + React | ✅ | Direct import |
| Create React App | ✅ | Direct import |
| Remix | ✅ | Direct import |

### Next.js App Router

Since `layout.tsx` is a Server Component, create a client wrapper:

```tsx
// components/GrabQAWrapper.tsx
'use client';
import dynamic from 'next/dynamic';

const GrabQA = dynamic(
  () => import('grab-qa').then((mod) => mod.GrabQA),
  { ssr: false }
);

export function GrabQAWrapper() {
  if (process.env.NODE_ENV !== 'development') return null;
  return <GrabQA />;
}
```

```tsx
// app/layout.tsx
import { GrabQAWrapper } from '@/components/GrabQAWrapper';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <GrabQAWrapper />
      </body>
    </html>
  );
}
```

## Export Formats

### GitHub Issue

```markdown
## Element Context

| Property | Value |
|----------|-------|
| Selector | `button.submit-btn` |
| Component | `SubmitButton` |
| File | `src/components/SubmitButton.tsx:42` |

## Element Text
```
Submit Order
```

## Metadata
- **Page:** https://example.com/checkout
- **Priority:** High
- **Created:** 2025-01-30T12:00:00Z
```

### AI Agent Format

```markdown
# QA Issue: Button text is incorrect

Type: Bug
Priority: High

## Element to Fix
File: src/components/SubmitButton.tsx:42
Component: SubmitButton
CSS Selector: button.submit-btn

## Current HTML
```html
<button class="submit-btn">Submit Ordr</button>
```
```

## Roadmap

- [x] Element selection with React detection
- [x] GitHub Issues integration
- [x] Copy for AI agents
- [ ] Screenshot capture
- [ ] Monday.com integration
- [ ] Jira integration
- [ ] Linear integration
- [ ] Session management
- [ ] Browser extension

## Contributing

Contributions welcome! Please read our [contributing guide](https://github.com/SoftwareShean/grab-qa/blob/main/CONTRIBUTING.md).

```bash
git clone https://github.com/SoftwareShean/grab-qa.git
cd grab-qa/packages/grab-qa
npm install
npm run dev
```

## License

MIT © [Shean Johnson](https://github.com/SoftwareShean)
