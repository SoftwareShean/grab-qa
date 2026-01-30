# GrabQA

Visual QA annotation tool for React apps. Select elements, add notes, export to GitHub Issues or your AI coding agent.

## Quick Start (Development)

### 1. Install dependencies

```bash
cd qa-tool/packages/grab-qa
npm install
npm run build
```

### 2. Link to your project

```bash
# In grab-qa directory
npm link

# In your project (e.g., fixins-creators)
npm link grab-qa
```

### 3. Add to your app

```tsx
// app/layout.tsx (or any layout/page)
import { GrabQA } from 'grab-qa';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}

        {/* Only show in development */}
        {process.env.NODE_ENV === 'development' && (
          <GrabQA
            config={{
              githubRepo: 'shean-studios/fixins-creators', // for GitHub export
            }}
          />
        )}
      </body>
    </html>
  );
}
```

## Usage

1. Press **Alt+Q** to enable GrabQA
2. Click **"Grab Element"** to enter selection mode
3. Hover over elements to see highlights
4. Click an element to select it
5. Add your annotation (type, priority, title, description)
6. Export to GitHub Issues or copy for AI

## Keyboard Shortcuts

- `Alt+Q` - Toggle GrabQA on/off
- `Escape` - Cancel grab mode

## Configuration

```tsx
<GrabQA
  config={{
    // GitHub repo for issue export (owner/repo format)
    githubRepo: 'shean-studios/fixins-creators',

    // Keyboard shortcut (default: 'KeyQ' for Alt+Q)
    hotkey: 'KeyQ',

    // LocalStorage key for persisting annotations
    storageKey: 'grab-qa-annotations',

    // Callbacks
    onAnnotationCreate: (annotation) => console.log('Created:', annotation),
    onAnnotationUpdate: (annotation) => console.log('Updated:', annotation),
    onExport: (annotations) => console.log('Exported:', annotations),
  }}
/>
```

## Export Options

### GitHub Issues
Opens new issue forms pre-filled with:
- Title with [QA] prefix
- Full element context (selector, component, file path)
- Labels for type (bug, enhancement, etc.) and priority

### Copy for AI
Copies all annotations in a format optimized for AI coding agents:
- Component/file locations
- Current HTML
- Issue descriptions

## Using the Hook

For custom UI or programmatic control:

```tsx
import { GrabQAProvider, useGrabQA, GrabQAOverlay } from 'grab-qa';

function CustomControls() {
  const { enable, disable, isEnabled, annotations, toggleGrabMode } = useGrabQA();

  return (
    <div>
      <button onClick={isEnabled ? disable : enable}>
        {isEnabled ? 'Disable' : 'Enable'} QA
      </button>
      <span>{annotations.length} issues</span>
    </div>
  );
}

function App() {
  return (
    <GrabQAProvider config={{ githubRepo: 'user/repo' }}>
      <YourApp />
      <CustomControls />
      <GrabQAOverlay />
    </GrabQAProvider>
  );
}
```

## React Component Detection

GrabQA attempts to extract React component info from the fiber tree:
- **Component name** - The React component that owns the element
- **File path** - Source file location (requires React dev mode with source maps)

This works best when:
- Running in development mode
- Source maps are enabled
- Using React 16.8+ with fiber architecture

## Roadmap

- [ ] Screenshot capture
- [ ] Session management
- [ ] Monday.com integration
- [ ] Jira integration
- [ ] Browser extension version
- [ ] MCP server for AI integration

## License

MIT
