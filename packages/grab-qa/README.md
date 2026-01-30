# QAFlow

Frictionless QA for React apps. Annotate elements, auto-create GitHub Issues, export to AI coding agents.

[![npm version](https://img.shields.io/npm/v/qaflow.svg)](https://www.npmjs.com/package/qaflow)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Why QAFlow?

Traditional QA tools are built for non-technical stakeholders. QAFlow is built for **developers** with modern AI coding workflows.

| Feature | Traditional Tools | QAFlow |
|---------|-------------------|--------|
| React component detection | ❌ | ✅ |
| File path extraction | ❌ | ✅ |
| AI agent export | ❌ | ✅ |
| Auto-create GitHub Issues | Manual | ✅ API |
| Self-hosted | ❌ | ✅ |
| Price | $40-80/mo | Free |

## Quick Start

```bash
npm install qaflow
```

```tsx
// app/layout.tsx (Next.js) or App.tsx (Vite/CRA)
import { QAFlow } from 'qaflow';

export default function Layout({ children }) {
  return (
    <>
      {children}
      {process.env.NODE_ENV === 'development' && <QAFlow />}
    </>
  );
}
```

**That's it!** Press `Alt+Q` to enable QAFlow.

## Usage

1. Press **Alt+Q** to enable QAFlow
2. Click **"Grab Element"** to enter selection mode
3. Hover over elements (blue highlight shows what you'll select)
4. Click to select an element
5. Fill in the annotation form
6. Export:
   - **📋 Copy for AI** → Formatted for Claude Code, Cursor, etc.
   - **🐙 Create Issues** → Auto-creates GitHub Issues via API

## What Gets Captured

- **CSS selector** - Unique path to the element
- **React component name** - The owning component (if detectable)
- **File path** - Source location with line number
- **Tag, classes, ID** - Basic DOM info
- **Text content** - First 200 chars
- **HTML snippet** - First 500 chars

## GitHub Integration

Click the GitHub icon to configure:

1. Create a [Personal Access Token](https://github.com/settings/tokens/new?scopes=repo,project&description=QAFlow)
2. Paste and verify
3. Select your repository
4. Click "Create Issues" → Issues created automatically

## Configuration

```tsx
<QAFlow
  config={{
    hotkey: 'KeyQ',  // Alt+Q to toggle
    storageKey: 'qaflow-annotations',
    onAnnotationCreate: (annotation) => console.log('Created:', annotation),
  }}
/>
```

## Next.js App Router

```tsx
// components/QAFlowWrapper.tsx
'use client';
import dynamic from 'next/dynamic';

const QAFlow = dynamic(
  () => import('qaflow').then((mod) => mod.QAFlow),
  { ssr: false }
);

export function QAFlowWrapper() {
  if (process.env.NODE_ENV !== 'development') return null;
  return <QAFlow />;
}
```

```tsx
// app/layout.tsx
import { QAFlowWrapper } from '@/components/QAFlowWrapper';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <QAFlowWrapper />
      </body>
    </html>
  );
}
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Alt+Q` | Toggle QAFlow |
| `Escape` | Cancel selection |

## Roadmap

- [x] Element selection with React detection
- [x] GitHub Issues integration (API)
- [x] Copy for AI agents
- [ ] Screenshot capture
- [ ] Session management
- [ ] Browser extension

## License

MIT © [Shean Johnson](https://github.com/SoftwareShean)
