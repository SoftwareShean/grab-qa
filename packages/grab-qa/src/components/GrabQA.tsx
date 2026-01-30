'use client';

import React from 'react';
import { GrabQAProvider, type GrabQAProviderProps } from '../context';
import { GrabQAToolbar } from './Toolbar';
import { GrabQAPanel } from './Panel';

export interface GrabQAProps extends Omit<GrabQAProviderProps, 'children'> {
  children?: React.ReactNode;
}

/**
 * Main GrabQA component - wrap your app or specific pages with this
 *
 * @example
 * ```tsx
 * // In your layout or app
 * import { GrabQA } from 'grab-qa';
 *
 * export default function Layout({ children }) {
 *   return (
 *     <>
 *       {children}
 *       {process.env.NODE_ENV === 'development' && (
 *         <GrabQA config={{ githubRepo: 'user/repo' }} />
 *       )}
 *     </>
 *   );
 * }
 * ```
 */
export function GrabQA({ children, config }: GrabQAProps) {
  // Only render in browser
  if (typeof window === 'undefined') {
    return <>{children}</>;
  }

  return (
    <GrabQAProvider config={config}>
      {children}
      <GrabQAToolbar />
      <GrabQAPanel />
    </GrabQAProvider>
  );
}

/**
 * Standalone overlay - use if you want manual control via useGrabQA hook
 */
export function GrabQAOverlay() {
  return (
    <>
      <GrabQAToolbar />
      <GrabQAPanel />
    </>
  );
}
